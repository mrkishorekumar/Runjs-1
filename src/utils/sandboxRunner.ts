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

  // Cache trusted APIs before prototype freezing or user overrides
  const trustedPostMessage = self.postMessage.bind(self);
  const originalSetTimeout = self.setTimeout.bind(self);
  const originalClearTimeout = self.clearTimeout.bind(self);
  const originalSetInterval = self.setInterval.bind(self);
  const originalClearInterval = self.clearInterval.bind(self);
  const originalQueueMicrotask = typeof self.queueMicrotask === 'function'
    ? self.queueMicrotask.bind(self)
    : function(fn) { originalSetTimeout(fn, 0); };
  const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;

  // Window alias for code expecting window.*
  try { self.window = self; } catch(e) {}

  // Freeze prototypes to prevent prototype poisoning
  try {
    Object.freeze(Object.prototype);
    Object.freeze(Array.prototype);
    Object.freeze(Function.prototype);
  } catch (e) {}

  function serializeArg(val, depth, seen) {
    if (depth === undefined) depth = 0;
    if (seen === undefined) seen = new WeakSet();
    if (depth > 3) return '[Object]';
    if (val === null) return 'null';
    if (val === undefined) return 'undefined';

    const type = typeof val;
    if (type === 'number' || type === 'string' || type === 'boolean') return val;
    if (type === 'bigint') return val.toString() + 'n';
    if (type === 'symbol') return val.toString();
    if (type === 'function') return '[Function: ' + (val.name || 'anonymous') + ']';

    if (val instanceof Error) {
      return {
        __isError: true,
        name: val.name,
        message: val.message,
        stack: val.stack
      };
    }

    if (type === 'object') {
      if (seen.has(val)) return '[Circular]';
      seen.add(val);
      try {
        if (Array.isArray(val)) {
          return val.slice(0, 50).map(function(item) {
            return serializeArg(item, depth + 1, seen);
          });
        }

        const copy = {};
        const keys = Object.keys(val).slice(0, 50);
        for (let i = 0; i < keys.length; i++) {
          const k = keys[i];
          if (k === '__proto__' || k === 'constructor' || k === 'prototype') continue;
          try { copy[k] = serializeArg(val[k], depth + 1, seen); }
          catch (err) { copy[k] = '[Unserializable]'; }
        }
        return copy;
      } finally {
        seen.delete(val);
      }
    }

    return String(val);
  }

  function postLog(method, args) {
    try {
      const serialized = args.map(function(a) { return serializeArg(a); });
      trustedPostMessage({ type: 'LOG', method: method, args: serialized });
    } catch(e) {}
  }

  const customConsole = {
    log: function() { postLog('log', Array.prototype.slice.call(arguments)); },
    info: function() { postLog('info', Array.prototype.slice.call(arguments)); },
    warn: function() { postLog('warn', Array.prototype.slice.call(arguments)); },
    error: function() { postLog('error', Array.prototype.slice.call(arguments)); },
    clear: function() { trustedPostMessage({ type: 'CLEAR' }); }
  };

  try { self.console = customConsole; } catch(e) {}

  const activeTimers = new Set();
  const activeIntervals = new Set();
  let isInitialExecutionComplete = false;
  let isFinished = false;
  let checkTimer = null;
  let executionResult = undefined;
  let maxTimeoutMs = 5000;

  function checkCompletion() {
    if (!isInitialExecutionComplete || isFinished) return;
    if (activeTimers.size > 0 || activeIntervals.size > 0) {
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
        if (activeTimers.size === 0 && activeIntervals.size === 0) {
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
    const msg = err && err.message ? err.message : String(err);
    postLog('error', [msg]);
    trustedPostMessage({ type: 'ERROR', error: msg });
  }

  self.setTimeout = function(handler, timeout) {
    const args = Array.prototype.slice.call(arguments, 2);
    const delay = Math.max(0, Number(timeout) || 0);
    let timerId;
    const wrappedHandler = function() {
      activeTimers.delete(timerId);
      try {
        if (typeof handler === 'function') {
          handler.apply(self, args);
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
      activeTimers.add(timerId);
      if (checkTimer !== null) {
        originalClearTimeout(checkTimer);
        checkTimer = null;
      }
    }
    return timerId;
  };

  self.clearTimeout = function(id) {
    if (id !== undefined && id !== null) {
      activeTimers.delete(id);
      originalClearTimeout(id);
      checkCompletion();
    }
  };

  self.setInterval = function(handler, interval) {
    const args = Array.prototype.slice.call(arguments, 2);
    const delay = Math.max(0, Number(interval) || 0);
    let intervalId;
    const wrappedHandler = function() {
      try {
        if (typeof handler === 'function') {
          handler.apply(self, args);
        } else {
          eval(handler);
        }
      } catch (err) {
        handleExecutionError(err);
      }
    };
    intervalId = originalSetInterval(wrappedHandler, delay);
    activeIntervals.add(intervalId);
    if (checkTimer !== null) {
      originalClearTimeout(checkTimer);
      checkTimer = null;
    }
    return intervalId;
  };

  self.clearInterval = function(id) {
    if (id !== undefined && id !== null) {
      activeIntervals.delete(id);
      originalClearInterval(id);
      checkCompletion();
    }
  };

  if (typeof self.setImmediate !== 'function') {
    self.setImmediate = function(cb) {
      const args = Array.prototype.slice.call(arguments, 1);
      return self.setTimeout.apply(self, [cb, 0].concat(args));
    };
    self.clearImmediate = function(id) {
      self.clearTimeout(id);
    };
  }

  if (typeof self.requestAnimationFrame !== 'function') {
    self.requestAnimationFrame = function(cb) {
      return self.setTimeout(function() {
        cb(performance.now());
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
        runner = new Function('console', 'setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', code);
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
