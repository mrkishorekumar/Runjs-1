export type SandboxLogMethod = 'log' | 'info' | 'warn' | 'error';

export interface SandboxLogEntry {
  type: SandboxLogMethod;
  args: unknown[];
  timestamp: number;
}

export interface SandboxRunOptions {
  timeoutMs?: number;
  onLog?: (type: SandboxLogMethod, args: unknown[]) => void;
  onClear?: () => void;
}

export interface SandboxResult {
  logs: SandboxLogEntry[];
  error?: string;
  durationMs: number;
}

export const WORKER_BOOTSTRAP = `
(function() {
  // Strip sensitive host storage and network capabilities from the worker
  try { delete self.indexedDB; } catch(e) {}
  try { delete self.caches; } catch(e) {}
  try { Object.defineProperty(self, 'fetch', { value: undefined, configurable: false, writable: false }); } catch(e) {}
  try { delete self.XMLHttpRequest; } catch(e) {}
  try { delete self.importScripts; } catch(e) {}
  try { delete self.WebSocket; } catch(e) {}
  try { delete self.EventSource; } catch(e) {}
  try { delete self.BroadcastChannel; } catch(e) {}
  try { delete self.SharedWorker; } catch(e) {}

  // Cache trusted APIs and unpolluted native methods before user execution
  const trustedPostMessage = self.postMessage.bind(self);
  const originalSetTimeout = self.setTimeout.bind(self);
  const originalClearTimeout = self.clearTimeout.bind(self);
  const originalSetInterval = self.setInterval.bind(self);
  const originalClearInterval = self.clearInterval.bind(self);
  const originalQueueMicrotask = typeof self.queueMicrotask === 'function'
    ? self.queueMicrotask.bind(self)
    : function(fn) { originalSetTimeout(fn, 0); };
  const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
  const NativeFunction = Function;

  // Unbound native methods bound to native call to ensure resilience against prototype modifications
  const safeApply = Function.prototype.call.bind(Function.prototype.apply);
  const safeWeakSetAdd = Function.prototype.call.bind(WeakSet.prototype.add);
  const safeWeakSetHas = Function.prototype.call.bind(WeakSet.prototype.has);
  const safeWeakSetDelete = Function.prototype.call.bind(WeakSet.prototype.delete);
  const safeObjectKeys = Object.keys;
  const safeIsArray = Array.isArray;
  const safePerformanceNow = typeof performance !== 'undefined' && typeof performance.now === 'function'
    ? performance.now.bind(performance)
    : Date.now;

  // Window alias for code expecting window.*
  try { self.window = self; } catch(e) {}

  function toArgsArray(args, startIndex) {
    const start = startIndex || 0;
    const len = args.length;
    if (len <= start) return [];
    const result = [];
    for (let i = start; i < len; i++) {
      result[i - start] = args[i];
    }
    return result;
  }

  function serializeArg(val, depth, seen) {
    if (depth === undefined) depth = 0;
    if (seen === undefined) seen = new WeakSet();
    if (depth > 3) return '[Object]';
    if (val === null) return 'null';
    if (val === undefined) return 'undefined';

    const type = typeof val;
    if (type === 'number' || type === 'string' || type === 'boolean') return val;
    if (type === 'bigint') {
      try { return val.toString() + 'n'; }
      catch (e) {
        try { return String(val) + 'n'; }
        catch (e2) { return '[BigInt]'; }
      }
    }
    if (type === 'symbol') {
      try { return val.toString(); }
      catch (e) {
        try { return String(val); }
        catch (e2) { return '[Symbol]'; }
      }
    }
    if (type === 'function') {
      let fnName = 'anonymous';
      try {
        if (typeof val.name === 'string' && val.name) {
          fnName = val.name;
        }
      } catch (e) {}
      return '[Function: ' + fnName + ']';
    }

    if (val instanceof Error) {
      let errName = 'Error';
      let errMsg = '';
      let errStack;
      try { errName = String(val.name || 'Error'); } catch (e) {}
      try { errMsg = String(val.message || ''); } catch (e) {}
      try { errStack = val.stack ? String(val.stack) : undefined; } catch (e) {}
      return {
        __isError: true,
        name: errName,
        message: errMsg,
        stack: errStack
      };
    }

    if (type === 'object') {
      if (safeWeakSetHas(seen, val)) return '[Circular]';
      safeWeakSetAdd(seen, val);
      try {
        if (safeIsArray(val)) {
          const len = Math.min(val.length, 50);
          const copy = [];
          for (let i = 0; i < len; i++) {
            copy[i] = serializeArg(val[i], depth + 1, seen);
          }
          return copy;
        }

        const copy = {};
        const keys = safeObjectKeys(val);
        const len = Math.min(keys.length, 50);
        for (let i = 0; i < len; i++) {
          const k = keys[i];
          if (k === '__proto__' || k === 'constructor' || k === 'prototype') continue;
          try { copy[k] = serializeArg(val[k], depth + 1, seen); }
          catch (err) { copy[k] = '[Unserializable]'; }
        }
        return copy;
      } finally {
        safeWeakSetDelete(seen, val);
      }
    }

    try {
      return String(val);
    } catch (e) {
      return '[Unserializable]';
    }
  }

  function postLog(method, args) {
    try {
      const len = args.length;
      const serialized = [];
      for (let i = 0; i < len; i++) {
        serialized[i] = serializeArg(args[i]);
      }
      trustedPostMessage({ type: 'LOG', method: method, args: serialized });
    } catch(e) {}
  }

  const customConsole = {
    log: function() { postLog('log', toArgsArray(arguments)); },
    info: function() { postLog('info', toArgsArray(arguments)); },
    warn: function() { postLog('warn', toArgsArray(arguments)); },
    error: function() { postLog('error', toArgsArray(arguments)); },
    clear: function() { trustedPostMessage({ type: 'CLEAR' }); }
  };

  try { self.console = customConsole; } catch(e) {}

  let activeTimersCount = 0;
  const activeTimers = Object.create(null);
  let activeIntervalsCount = 0;
  const activeIntervals = Object.create(null);
  let isInitialExecutionComplete = false;
  let isFinished = false;
  let checkTimer = null;
  let executionResult = undefined;
  let maxTimeoutMs = 5000;

  function hasPendingAsync() {
    return activeTimersCount > 0 || activeIntervalsCount > 0;
  }

  function checkCompletion() {
    if (!isInitialExecutionComplete || isFinished) return;
    if (hasPendingAsync()) {
      if (checkTimer !== null) {
        originalClearTimeout(checkTimer);
        checkTimer = null;
      }
      return;
    }

    if (checkTimer !== null) return;

    checkTimer = originalSetTimeout(function() {
      checkTimer = null;
      originalQueueMicrotask(function() {
        if (!isInitialExecutionComplete || isFinished) return;
        if (!hasPendingAsync()) {
          isFinished = true;
          trustedPostMessage({ type: 'DONE', result: serializeArg(executionResult) });
        }
      });
    }, 25);
  }

  function handleExecutionError(err) {
    if (isFinished) return;
    isFinished = true;
    if (checkTimer !== null) {
      originalClearTimeout(checkTimer);
      checkTimer = null;
    }
    let msg = 'Execution Error';
    try {
      if (err && typeof err.message === 'string') {
        msg = err.message;
      } else {
        msg = String(err);
      }
    } catch (e) {}
    postLog('error', [msg]);
    trustedPostMessage({ type: 'ERROR', error: msg });
  }

  self.setTimeout = function(handler, timeout) {
    const args = toArgsArray(arguments, 2);
    const delay = Math.max(0, Number(timeout) || 0);
    let timerId;
    const wrappedHandler = function() {
      if (activeTimers[timerId]) {
        delete activeTimers[timerId];
        activeTimersCount--;
      }
      try {
        if (typeof handler === 'function') {
          safeApply(handler, self, args);
        } else {
          eval(handler);
        }
      } catch (err) {
        handleExecutionError(err);
      } finally {
        checkCompletion();
      }
    };
    timerId = originalSetTimeout(wrappedHandler, delay);
    if (delay < maxTimeoutMs) {
      activeTimers[timerId] = true;
      activeTimersCount++;
      if (checkTimer !== null) {
        originalClearTimeout(checkTimer);
        checkTimer = null;
      }
    }
    return timerId;
  };

  self.clearTimeout = function(id) {
    if (id !== undefined && id !== null) {
      if (activeTimers[id]) {
        delete activeTimers[id];
        activeTimersCount--;
      }
      originalClearTimeout(id);
      checkCompletion();
    }
  };

  self.setInterval = function(handler, interval) {
    const args = toArgsArray(arguments, 2);
    const delay = Math.max(0, Number(interval) || 0);
    let intervalId;
    const wrappedHandler = function() {
      try {
        if (typeof handler === 'function') {
          safeApply(handler, self, args);
        } else {
          eval(handler);
        }
      } catch (err) {
        handleExecutionError(err);
      }
    };
    intervalId = originalSetInterval(wrappedHandler, delay);
    activeIntervals[intervalId] = true;
    activeIntervalsCount++;
    if (checkTimer !== null) {
      originalClearTimeout(checkTimer);
      checkTimer = null;
    }
    return intervalId;
  };

  self.clearInterval = function(id) {
    if (id !== undefined && id !== null) {
      if (activeIntervals[id]) {
        delete activeIntervals[id];
        activeIntervalsCount--;
      }
      originalClearInterval(id);
      checkCompletion();
    }
  };

  if (typeof self.setImmediate !== 'function') {
    self.setImmediate = function(cb) {
      const extra = toArgsArray(arguments, 1);
      const callArgs = [cb, 0];
      for (let i = 0; i < extra.length; i++) {
        callArgs[i + 2] = extra[i];
      }
      return safeApply(self.setTimeout, self, callArgs);
    };
    self.clearImmediate = function(id) {
      self.clearTimeout(id);
    };
  }

  if (typeof self.requestAnimationFrame !== 'function') {
    self.requestAnimationFrame = function(cb) {
      return self.setTimeout(function() {
        cb(safePerformanceNow());
      }, 16);
    };
    self.cancelAnimationFrame = function(id) {
      self.clearTimeout(id);
    };
  }

  if (typeof self.addEventListener === 'function') {
    self.addEventListener('unhandledrejection', function(event) {
      handleExecutionError(event.reason);
    });
  }

  self.onmessage = async function(e) {
    const code = e.data && e.data.code;
    if (typeof code !== 'string') return;
    if (typeof e.data.timeoutMs === 'number' && e.data.timeoutMs > 0) {
      maxTimeoutMs = e.data.timeoutMs;
    }

    try {
      // Execute in sandboxed worker scope with shadowed console and timers
      let runner;
      try {
        runner = new AsyncFunction('console', 'setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', code);
      } catch (syntaxErr) {
        runner = new NativeFunction('console', 'setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', code);
      }
      executionResult = await runner(customConsole, self.setTimeout, self.clearTimeout, self.setInterval, self.clearInterval);
    } catch (err) {
      handleExecutionError(err);
      return;
    } finally {
      isInitialExecutionComplete = true;
      checkCompletion();
    }
  };
})();
`;

/**
 * Executes arbitrary user JavaScript inside an isolated Web Worker sandbox with
 * stripped storage/network access and strict timeout protection.
 */
export function runInSandbox(
  code: string,
  options: SandboxRunOptions = {}
): Promise<SandboxResult> {
  const timeoutMs = options.timeoutMs ?? 5000;
  const onLog = options.onLog;

  return new Promise((resolve) => {
    const startTime = performance.now();
    const logs: SandboxLogEntry[] = [];
    let blob: Blob | null = null;
    let url: string | null = null;
    let worker: Worker | null = null;
    let timerId: ReturnType<typeof setTimeout> | null = null;
    let isSettled = false;

    const cleanup = () => {
      if (timerId !== null) {
        clearTimeout(timerId);
        timerId = null;
      }
      if (worker) {
        try {
          worker.terminate();
        } catch {
          // Worker might already be terminated
        }
        worker = null;
      }
      if (url) {
        try {
          URL.revokeObjectURL(url);
        } catch {
          // URL might already be revoked
        }
        url = null;
      }
    };

    const finish = (error?: string) => {
      if (isSettled) return;
      isSettled = true;
      cleanup();
      const durationMs = Math.max(
        0.1,
        Math.round(performance.now() - startTime)
      );
      resolve({ logs, error, durationMs });
    };

    try {
      blob = new Blob([WORKER_BOOTSTRAP], { type: 'application/javascript' });
      url = URL.createObjectURL(blob);
      worker = new Worker(url);

      timerId = setTimeout(() => {
        const timeoutMsg = `Time Limit Exceeded: Execution took longer than ${timeoutMs}ms.`;
        onLog?.('error', [timeoutMsg]);
        logs.push({
          type: 'error',
          args: [timeoutMsg],
          timestamp: Date.now(),
        });
        finish(timeoutMsg);
      }, timeoutMs);

      worker.onmessage = (event: MessageEvent) => {
        const data = event.data;
        if (!data || typeof data !== 'object') return;

        if (data.type === 'LOG' && data.method && Array.isArray(data.args)) {
          const method = data.method as SandboxLogMethod;
          logs.push({
            type: method,
            args: data.args,
            timestamp: Date.now(),
          });
          onLog?.(method, data.args);
        } else if (data.type === 'CLEAR') {
          options.onClear?.();
        } else if (data.type === 'DONE') {
          finish();
        } else if (data.type === 'ERROR') {
          finish(data.error);
        }
      };

      worker.onerror = (event: ErrorEvent) => {
        const errorMsg = event.message || 'Worker execution error';
        onLog?.('error', [errorMsg]);
        logs.push({
          type: 'error',
          args: [errorMsg],
          timestamp: Date.now(),
        });
        finish(errorMsg);
      };

      worker.postMessage({ code, timeoutMs });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      onLog?.('error', [errorMsg]);
      logs.push({
        type: 'error',
        args: [errorMsg],
        timestamp: Date.now(),
      });
      finish(errorMsg);
    }
  });
}
