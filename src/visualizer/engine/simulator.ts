import * as acorn from 'acorn';
import {
  ExecutionStep,
  StackFrame,
  QueueTask,
  WebApiTimer,
  ConsoleLogEntry,
  EventLoopPhase,
  ActionType,
  SimulationResult,
} from './types';

// Maximum execution thresholds to protect against infinite loops or runaway recursion
const MAX_STEPS = 500;
const MAX_LOOP_ITERATIONS = 200;
const MAX_STACK_DEPTH = 50;
const restrictedBuiltinObjects = new WeakSet<object>();

function createRestrictedBuiltin<T extends object>(value: T): T {
  restrictedBuiltinObjects.add(value);
  return Object.freeze(value);
}

interface Scope {
  parent: Scope | null;
  bindings: Map<string, unknown>;
}

function createScope(parent: Scope | null = null): Scope {
  return { parent, bindings: new Map() };
}

function lookupScope(scope: Scope, name: string): Scope | null {
  let curr: Scope | null = scope;
  while (curr) {
    if (curr.bindings.has(name)) return curr;
    curr = curr.parent;
  }
  return null;
}

function getVariable(scope: Scope, name: string): unknown {
  const target = lookupScope(scope, name);
  if (target) return target.bindings.get(name);
  if (name === 'undefined') return undefined;
  if (name === 'null') return null;
  if (name === 'NaN') return NaN;
  if (name === 'Infinity') return Infinity;
  if (name === 'Math') {
    return createRestrictedBuiltin({
      max: Math.max,
      min: Math.min,
      floor: Math.floor,
      ceil: Math.ceil,
      round: Math.round,
      abs: Math.abs,
      sqrt: Math.sqrt,
      random: Math.random,
      PI: Math.PI,
    });
  }
  if (name === 'JSON') {
    return createRestrictedBuiltin({
      stringify: (val: unknown) => JSON.stringify(val),
      parse: (str: string) => JSON.parse(str),
    });
  }
  return undefined;
}

function setVariable(scope: Scope, name: string, value: unknown): void {
  const target = lookupScope(scope, name);
  if (target) {
    target.bindings.set(name, value);
  } else {
    // If not found, define in current scope
    scope.bindings.set(name, value);
  }
}

function addDynamic(left: unknown, right: unknown): unknown {
  if (typeof left === 'string' || typeof right === 'string') {
    return String(left) + String(right);
  }
  return Number(left) + Number(right);
}

interface SimulatedFunction {
  __isSimulatedFunction: true;
  name: string;
  node: acorn.Node;
  params: string[];
  body: acorn.Node;
  closureScope: Scope;
  isAsync?: boolean;
}

interface SimulatedPromise {
  __isSimulatedPromise: true;
  id: string;
  status: 'pending' | 'resolved' | 'rejected';
  value?: unknown;
  reason?: unknown;
  thenCallbacks: Array<{
    onFulfilled?: unknown;
    onRejected?: unknown;
    resolveNext: (val: unknown) => void;
    rejectNext: (reason: unknown) => void;
    line: number | null;
  }>;
  then(onFulfilled?: unknown, onRejected?: unknown): SimulatedPromise;
  catch(onRejected?: unknown): SimulatedPromise;
  finally(onFinally?: unknown): SimulatedPromise;
}

interface DelayedTimer {
  id: string;
  timerId: number;
  callback: unknown;
  callbackName: string;
  delay: number;
  line: number | null;
  args: unknown[];
  enqueuedAtVirtualTime: number;
}

interface PendingMicrotask {
  id: string;
  source: 'Promise.then' | 'queueMicrotask' | 'async/await';
  callback: unknown;
  callbackName: string;
  line: number | null;
  detail: string;
  args: unknown[];
}

export class Simulator {
  private steps: ExecutionStep[] = [];
  private callStack: StackFrame[] = [];
  private taskQueue: QueueTask[] = [];
  private microtaskQueue: QueueTask[] = [];
  private webApis: WebApiTimer[] = [];
  private logs: ConsoleLogEntry[] = [];
  private eventLoopPhase: EventLoopPhase = 'idle';
  private eventLoopDegrees: number = 0;

  private pendingTimers: DelayedTimer[] = [];
  private pendingMicrotasks: PendingMicrotask[] = [];
  private nextTimerId: number = 1;
  private virtualTime: number = 0;
  private idCounter: number = 1;

  private activeLine: number | null = null;
  private activePanel: ExecutionStep['activePanel'] = null;
  private globalScope: Scope = createScope();
  private safeFunctions: Set<unknown> = new Set();
  private promiseConstructorRef: unknown = null;

  private generateId(prefix: string = 'item'): string {
    return `${prefix}_${this.idCounter++}`;
  }

  private snapshot(
    title: string,
    actionType: ActionType,
    description: string,
    explanation: string,
    highlightedItemId?: string
  ): void {
    if (this.steps.length >= MAX_STEPS) {
      throw new Error(
        `Execution limit of ${MAX_STEPS} steps reached. Possible infinite loop.`
      );
    }

    // Determine event loop needle degrees based on phase
    let degrees = 0;
    switch (this.eventLoopPhase) {
      case 'stack_execution':
        degrees = 0;
        break;
      case 'check_microtasks':
      case 'drain_microtasks':
        degrees = 90;
        break;
      case 'render_phase':
        degrees = 180;
        break;
      case 'check_tasks':
      case 'pick_task':
        degrees = 270;
        break;
      case 'idle':
      case 'finished':
      default:
        degrees = 0;
        break;
    }
    this.eventLoopDegrees = degrees;

    this.steps.push({
      stepIndex: this.steps.length,
      title,
      description,
      explanation,
      actionType,
      callStack: this.callStack.map((frame) => ({ ...frame })),
      taskQueue: this.taskQueue.map((task) => ({ ...task })),
      microtaskQueue: this.microtaskQueue.map((mt) => ({ ...mt })),
      webApis: this.webApis.map((api) => ({ ...api })),
      eventLoopPhase: this.eventLoopPhase,
      eventLoopDegrees: this.eventLoopDegrees,
      logs: this.logs.map((log) => ({ ...log })),
      activeLine: this.activeLine,
      activePanel: this.activePanel,
      highlightedItemId,
    });
  }

  public run(code: string): SimulationResult {
    this.steps = [];
    this.callStack = [];
    this.taskQueue = [];
    this.microtaskQueue = [];
    this.webApis = [];
    this.logs = [];
    this.pendingTimers = [];
    this.pendingMicrotasks = [];
    this.nextTimerId = 1;
    this.virtualTime = 0;
    this.idCounter = 1;
    this.activeLine = null;
    this.activePanel = null;
    this.globalScope = createScope();

    try {
      const ast = acorn.parse(code, {
        ecmaVersion: 'latest',
        locations: true,
        sourceType: 'script',
      }) as unknown as { body: acorn.Node[] };

      // Initialize built-ins in global scope
      this.initGlobalBuiltins();

      // Step 1: Start of Script
      this.eventLoopPhase = 'stack_execution';
      this.activePanel = 'stack';
      this.activeLine = 1;

      const mainFrameId = this.generateId('frame');
      const mainFrame: StackFrame = {
        id: mainFrameId,
        name: 'main()',
        line: 1,
        column: 0,
        type: 'sync',
        depth: 1,
      };
      this.callStack.push(mainFrame);

      this.snapshot(
        'Script Execution Started',
        'SCRIPT_START',
        'Global execution context created.',
        'The JavaScript engine creates the global execution context and pushes main() onto the Call Stack to execute synchronous statements top-to-bottom.',
        mainFrameId
      );

      // Execute synchronous statements
      for (const statement of ast.body) {
        this.executeStatement(statement, this.globalScope);
      }

      // Pop main() frame
      this.callStack.pop();
      this.activeLine = null;
      this.snapshot(
        'Main Script Execution Finished',
        'CALLSTACK_POP',
        'main() popped from Call Stack.',
        'All synchronous statements have executed. The Call Stack is now empty, allowing the Event Loop to inspect the Microtask and Task queues.',
        mainFrameId
      );

      // Start Event Loop Cycle
      this.runEventLoop();

      // Completed
      this.eventLoopPhase = 'finished';
      this.activePanel = 'loop';
      this.snapshot(
        'Execution Completed',
        'SCRIPT_COMPLETE',
        'Event loop cycle finished. All queues drained.',
        'The Call Stack is empty, all microtasks have resolved, and all scheduled timers have executed. The JavaScript runtime is now idle.'
      );

      return {
        success: true,
        steps: this.steps,
        error: null,
        errorLine: null,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      let errorLine: number | null = null;

      // Extract line if acorn syntax error
      const lineMatch = message.match(/\((\d+):(\d+)\)/);
      if (lineMatch) {
        errorLine = parseInt(lineMatch[1], 10);
      } else if (this.activeLine) {
        errorLine = this.activeLine;
      }

      return {
        success: false,
        steps: this.steps,
        error: message,
        errorLine,
      };
    }
  }

  private initGlobalBuiltins(): void {
    this.safeFunctions.clear();

    // console
    const consoleLog = (...args: unknown[]) => this.handleConsole('log', args);
    const consoleInfo = (...args: unknown[]) =>
      this.handleConsole('info', args);
    const consoleWarn = (...args: unknown[]) =>
      this.handleConsole('warn', args);
    const consoleError = (...args: unknown[]) =>
      this.handleConsole('error', args);
    this.safeFunctions.add(consoleLog);
    this.safeFunctions.add(consoleInfo);
    this.safeFunctions.add(consoleWarn);
    this.safeFunctions.add(consoleError);

    this.globalScope.bindings.set('console', {
      __isConsole: true,
      log: consoleLog,
      info: consoleInfo,
      warn: consoleWarn,
      error: consoleError,
    });

    // setTimeout
    const setTimeoutFn = (
      cb: unknown,
      delay: unknown = 0,
      ...args: unknown[]
    ) => {
      return this.handleSetTimeout(cb, delay, args);
    };
    this.safeFunctions.add(setTimeoutFn);
    this.globalScope.bindings.set('setTimeout', setTimeoutFn);

    // setInterval (simulated for initial ticks)
    const setIntervalFn = (
      cb: unknown,
      delay: unknown = 0,
      ...args: unknown[]
    ) => {
      return this.handleSetTimeout(cb, delay, args);
    };
    this.safeFunctions.add(setIntervalFn);
    this.globalScope.bindings.set('setInterval', setIntervalFn);

    // clearTimeout / clearInterval
    const clearTimeoutFn = (id: unknown) => {
      this.handleClearTimeout(id);
    };
    this.safeFunctions.add(clearTimeoutFn);
    this.globalScope.bindings.set('clearTimeout', clearTimeoutFn);

    const clearIntervalFn = (id: unknown) => {
      this.handleClearTimeout(id);
    };
    this.safeFunctions.add(clearIntervalFn);
    this.globalScope.bindings.set('clearInterval', clearIntervalFn);

    // queueMicrotask
    const queueMicrotaskFn = (cb: unknown) => {
      this.handleQueueMicrotask(cb);
    };
    this.safeFunctions.add(queueMicrotaskFn);
    this.globalScope.bindings.set('queueMicrotask', queueMicrotaskFn);

    // Promise constructor
    const PromiseConstructor = this.createPromiseConstructor();
    this.promiseConstructorRef = PromiseConstructor;
    this.safeFunctions.add(PromiseConstructor);
    this.globalScope.bindings.set('Promise', PromiseConstructor);
  }

  private handleConsole(
    type: 'log' | 'info' | 'warn' | 'error',
    args: unknown[]
  ): void {
    const formattedArgs = args.map((a) => {
      if (typeof a === 'object' && a !== null) {
        try {
          return JSON.stringify(a);
        } catch {
          return String(a);
        }
      }
      return String(a);
    });

    const logEntry: ConsoleLogEntry = {
      id: this.generateId('log'),
      type,
      args: formattedArgs,
      stepIndex: this.steps.length,
      line: this.activeLine,
      timestamp: Date.now(),
    };
    this.logs.push(logEntry);

    this.activePanel = 'console';
    this.snapshot(
      `Console ${type.toUpperCase()}: ${formattedArgs.join(' ')}`,
      'CONSOLE_OUTPUT',
      `console.${type}(${formattedArgs.join(', ')})`,
      `Output sent to standard console output while executing on the Call Stack at line ${this.activeLine || '?'}.`,
      logEntry.id
    );
    this.activePanel = 'stack';
  }

  private handleSetTimeout(
    cb: unknown,
    delayRaw: unknown,
    args: unknown[]
  ): number {
    const delay =
      typeof delayRaw === 'number' && !isNaN(delayRaw)
        ? Math.max(0, delayRaw)
        : 0;
    const timerId = this.nextTimerId++;
    const timerItemId = this.generateId('timer');
    const cbName = this.getFunctionName(cb) || 'anonymous callback';

    const timer: DelayedTimer = {
      id: timerItemId,
      timerId,
      callback: cb,
      callbackName: cbName,
      delay,
      line: this.activeLine,
      args,
      enqueuedAtVirtualTime: this.virtualTime,
    };
    this.pendingTimers.push(timer);

    const webApiEntry: WebApiTimer = {
      id: timerItemId,
      timerId,
      callbackName: cbName,
      delay,
      remainingTime: delay,
      status: 'ticking',
      line: this.activeLine,
    };
    this.webApis.push(webApiEntry);

    this.activePanel = 'webapis';
    this.snapshot(
      `setTimeout registered (${delay}ms)`,
      'WEBAPI_START',
      `Timer #${timerId} registered with Web APIs (${delay}ms delay).`,
      `The browser offloads setTimeout to its Web APIs background environment. JavaScript continues executing synchronous code without blocking.`,
      timerItemId
    );
    this.activePanel = 'stack';

    return timerId;
  }

  private handleClearTimeout(id: unknown): void {
    const numericId = Number(id);
    const index = this.pendingTimers.findIndex((t) => t.timerId === numericId);
    if (index !== -1) {
      const removed = this.pendingTimers.splice(index, 1)[0];
      const apiItem = this.webApis.find((w) => w.timerId === numericId);
      if (apiItem) apiItem.status = 'cancelled';

      this.activePanel = 'webapis';
      this.snapshot(
        `Timer #${numericId} Cancelled`,
        'WEBAPI_CANCEL',
        `clearTimeout cancelled Timer #${numericId}.`,
        `The timer was removed from Web APIs before triggering, so its callback will not be enqueued to the Task Queue.`,
        removed.id
      );
      this.activePanel = 'stack';
    }
  }

  private handleQueueMicrotask(cb: unknown): void {
    const microtaskId = this.generateId('microtask');
    const cbName = this.getFunctionName(cb) || 'queueMicrotask callback';

    const queueTask: QueueTask = {
      id: microtaskId,
      type: 'microtask',
      source: 'queueMicrotask',
      callbackName: cbName,
      label: 'queueMicrotask',
      detail: `Explicit microtask scheduled at line ${this.activeLine || '?'}`,
      line: this.activeLine,
    };

    this.microtaskQueue.push(queueTask);
    this.pendingMicrotasks.push({
      id: microtaskId,
      source: 'queueMicrotask',
      callback: cb,
      callbackName: cbName,
      line: this.activeLine,
      detail: 'queueMicrotask',
      args: [],
    });

    this.activePanel = 'microtasks';
    this.snapshot(
      'queueMicrotask Enqueued',
      'MICROTASK_ENQUEUE',
      `Added ${cbName} to Microtask Queue.`,
      `queueMicrotask() explicitly places a task directly into the Microtask Queue. Microtasks have higher priority than macrotasks (such as setTimeout).`,
      microtaskId
    );
    this.activePanel = 'stack';
  }

  private createPromiseConstructor(): unknown {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;

    function SimulatedPromiseClass(
      this: SimulatedPromise,
      executor?: (res: (v: unknown) => void, rej: (r: unknown) => void) => void
    ) {
      this.__isSimulatedPromise = true;
      this.id = self.generateId('promise');
      this.status = 'pending';
      this.thenCallbacks = [];

      const resolve = (val: unknown) => {
        if (this.status !== 'pending') return;
        this.status = 'resolved';
        this.value = val;

        // Schedule all attached then callbacks into microtask queue
        for (const cbInfo of this.thenCallbacks) {
          self.schedulePromiseMicrotask(
            cbInfo.onFulfilled,
            val,
            cbInfo.resolveNext,
            cbInfo.line
          );
        }
        this.thenCallbacks = [];
      };
      self.safeFunctions.add(resolve);

      const reject = (reason: unknown) => {
        if (this.status !== 'pending') return;
        this.status = 'rejected';
        this.reason = reason;

        for (const cbInfo of this.thenCallbacks) {
          if (cbInfo.onRejected) {
            self.schedulePromiseMicrotask(
              cbInfo.onRejected,
              reason,
              cbInfo.resolveNext,
              cbInfo.line
            );
          } else {
            cbInfo.rejectNext(reason);
          }
        }
        this.thenCallbacks = [];
      };
      self.safeFunctions.add(reject);

      if (typeof executor === 'function') {
        const execFrameId = self.generateId('frame');
        self.callStack.push({
          id: execFrameId,
          name: 'new Promise executor',
          line: self.activeLine,
          column: 0,
          type: 'sync',
          depth: self.callStack.length + 1,
        });

        self.snapshot(
          'Promise Executor Executing',
          'CALLSTACK_PUSH',
          'new Promise((resolve, reject) => { ... }) pushed to Call Stack.',
          'The executor function passed to new Promise() runs SYNCHRONOUSLY immediately when instantiated.',
          execFrameId
        );

        try {
          executor(resolve, reject);
        } finally {
          self.callStack.pop();
          self.snapshot(
            'Promise Executor Finished',
            'CALLSTACK_POP',
            'Promise executor popped from Call Stack.',
            'Synchronous promise executor finished. Any attached .then() handlers will be deferred as microtasks.',
            execFrameId
          );
        }
      }
    }

    SimulatedPromiseClass.prototype.then = function (
      this: SimulatedPromise,
      onFulfilled?: unknown,
      onRejected?: unknown
    ) {
      const nextPromise: SimulatedPromise = new (
        SimulatedPromiseClass as unknown as {
          new (): SimulatedPromise;
        }
      )();

      const resolveNext = (resVal: unknown) => {
        nextPromise.status = 'resolved';
        nextPromise.value = resVal;
        for (const cb of nextPromise.thenCallbacks) {
          self.schedulePromiseMicrotask(
            cb.onFulfilled,
            resVal,
            cb.resolveNext,
            cb.line
          );
        }
      };
      self.safeFunctions.add(resolveNext);

      const rejectNext = (rejReason: unknown) => {
        nextPromise.status = 'rejected';
        nextPromise.reason = rejReason;
        for (const cb of nextPromise.thenCallbacks) {
          if (cb.onRejected) {
            self.schedulePromiseMicrotask(
              cb.onRejected,
              rejReason,
              cb.resolveNext,
              cb.line
            );
          } else {
            cb.rejectNext(rejReason);
          }
        }
      };
      self.safeFunctions.add(rejectNext);

      if (this.status === 'resolved') {
        self.schedulePromiseMicrotask(
          onFulfilled,
          this.value,
          resolveNext,
          self.activeLine
        );
      } else if (this.status === 'rejected') {
        if (onRejected) {
          self.schedulePromiseMicrotask(
            onRejected,
            this.reason,
            resolveNext,
            self.activeLine
          );
        } else {
          rejectNext(this.reason);
        }
      } else {
        this.thenCallbacks.push({
          onFulfilled,
          onRejected,
          resolveNext,
          rejectNext,
          line: self.activeLine,
        });
      }

      return nextPromise;
    };

    SimulatedPromiseClass.prototype.catch = function (
      this: SimulatedPromise,
      onRejected?: unknown
    ) {
      return this.then(undefined, onRejected);
    };

    SimulatedPromiseClass.prototype.finally = function (
      this: SimulatedPromise,
      onFinally?: unknown
    ) {
      return this.then(
        (val: unknown) => {
          if (typeof onFinally === 'function') onFinally();
          return val;
        },
        (err: unknown) => {
          if (typeof onFinally === 'function') onFinally();
          throw err;
        }
      );
    };

    const resolveStatic = function (val: unknown) {
      const p = new (
        SimulatedPromiseClass as unknown as {
          new (): SimulatedPromise;
        }
      )();
      p.status = 'resolved';
      p.value = val;
      return p;
    };

    const rejectStatic = function (reason: unknown) {
      const p = new (
        SimulatedPromiseClass as unknown as {
          new (): SimulatedPromise;
        }
      )();
      p.status = 'rejected';
      p.reason = reason;
      return p;
    };

    (SimulatedPromiseClass as unknown as Record<string, unknown>).resolve =
      resolveStatic;
    (SimulatedPromiseClass as unknown as Record<string, unknown>).reject =
      rejectStatic;

    self.safeFunctions.add(SimulatedPromiseClass);
    self.safeFunctions.add(resolveStatic);
    self.safeFunctions.add(rejectStatic);
    self.safeFunctions.add(SimulatedPromiseClass.prototype.then);
    self.safeFunctions.add(SimulatedPromiseClass.prototype.catch);
    self.safeFunctions.add(SimulatedPromiseClass.prototype.finally);

    return SimulatedPromiseClass;
  }

  private schedulePromiseMicrotask(
    callback: unknown,
    arg: unknown,
    resolveNext: (val: unknown) => void,
    line: number | null
  ): void {
    const microtaskId = this.generateId('microtask');
    const cbName = this.getFunctionName(callback) || 'Promise.then callback';

    const queueTask: QueueTask = {
      id: microtaskId,
      type: 'microtask',
      source: 'Promise.then',
      callbackName: cbName,
      label: 'Promise.then()',
      detail: `Fulfills with: ${JSON.stringify(arg) || 'undefined'}`,
      line,
    };

    this.microtaskQueue.push(queueTask);
    this.pendingMicrotasks.push({
      id: microtaskId,
      source: 'Promise.then',
      callback: (resolvedValue: unknown) => {
        if (typeof callback === 'function') {
          const res = callback(resolvedValue);
          resolveNext(res);
        } else {
          resolveNext(resolvedValue);
        }
      },
      callbackName: cbName,
      line,
      detail: 'Promise.then',
      args: [arg],
    });

    this.activePanel = 'microtasks';
    this.snapshot(
      'Promise Callback Enqueued to Microtasks',
      'MICROTASK_ENQUEUE',
      `Added ${cbName} to Microtask Queue.`,
      `When a Promise settles, its .then()/.catch() callbacks are scheduled onto the Microtask Queue to be executed as soon as the synchronous Call Stack clears.`,
      microtaskId
    );
    this.activePanel = 'stack';
  }

  private runEventLoop(): void {
    let iterations = 0;
    const MAX_LOOP_TURNS = 100;

    while (iterations++ < MAX_LOOP_TURNS) {
      // 1. Check & Drain Microtask Queue
      if (this.pendingMicrotasks.length > 0) {
        this.eventLoopPhase = 'check_microtasks';
        this.activePanel = 'microtasks';
        this.snapshot(
          'Event Loop Checks Microtasks',
          'EVENT_LOOP_ROTATE',
          'Event loop checks the Microtask Queue.',
          'Before executing any macrotask or rendering, the event loop must completely drain all pending microtasks.'
        );

        while (this.pendingMicrotasks.length > 0) {
          const mt = this.pendingMicrotasks.shift()!;
          const uiTaskIndex = this.microtaskQueue.findIndex(
            (t) => t.id === mt.id
          );
          if (uiTaskIndex !== -1) {
            this.microtaskQueue.splice(uiTaskIndex, 1);
          }

          this.eventLoopPhase = 'drain_microtasks';
          this.activePanel = 'microtasks';
          this.snapshot(
            `Dequeuing Microtask: ${mt.callbackName}`,
            'MICROTASK_DEQUEUE',
            `Dequeued ${mt.callbackName} from Microtask Queue.`,
            `The highest priority microtask is removed from the queue and pushed onto the Call Stack.`,
            mt.id
          );

          // Push to Call Stack and execute
          const frameId = this.generateId('frame');
          this.activePanel = 'stack';
          this.activeLine = mt.line;
          this.callStack.push({
            id: frameId,
            name: mt.callbackName,
            line: mt.line,
            column: 0,
            type: 'microtask',
            depth: this.callStack.length + 1,
          });

          this.snapshot(
            `Executing Microtask: ${mt.callbackName}`,
            'CALLSTACK_PUSH',
            `Pushed ${mt.callbackName} to Call Stack.`,
            `Executing microtask callback in the Call Stack. Any new microtasks scheduled inside will also run before macrotasks.`,
            frameId
          );

          try {
            if (typeof mt.callback === 'function') {
              mt.callback(...mt.args);
            }
          } finally {
            this.callStack.pop();
            this.snapshot(
              `Microtask Finished: ${mt.callbackName}`,
              'CALLSTACK_POP',
              `Popped ${mt.callbackName} from Call Stack.`,
              `Microtask execution complete. The event loop checks if more microtasks remain in the queue.`,
              frameId
            );
          }
        }
      }

      // 2. Advance Virtual Timers to Task Queue if any
      this.advanceTimers();

      // 3. Check Task Queue
      if (this.taskQueue.length > 0) {
        this.eventLoopPhase = 'check_tasks';
        this.activePanel = 'tasks';
        this.snapshot(
          'Event Loop Checks Task Queue',
          'EVENT_LOOP_ROTATE',
          'Microtask queue empty. Event loop checks Task Queue.',
          'All microtasks are drained. The Event Loop now inspects the Task Queue (Macrotask Queue) to pick ONE task.'
        );

        // Dequeue ONE task
        const taskUi = this.taskQueue.shift()!;
        const timerIndex = this.pendingTimers.findIndex(
          (t) => t.id === taskUi.id
        );
        const timer =
          timerIndex !== -1
            ? this.pendingTimers.splice(timerIndex, 1)[0]
            : null;

        // Remove from webApis list
        const apiIndex = this.webApis.findIndex((w) => w.id === taskUi.id);
        if (apiIndex !== -1) {
          this.webApis.splice(apiIndex, 1);
        }

        this.eventLoopPhase = 'pick_task';
        this.snapshot(
          `Dequeuing Task: ${taskUi.callbackName}`,
          'TASK_DEQUEUE',
          `Dequeued ${taskUi.callbackName} from Task Queue.`,
          `The Event Loop takes exactly ONE macrotask from the Task Queue and moves it to the Call Stack for execution.`,
          taskUi.id
        );

        // Push callback to Call Stack
        const frameId = this.generateId('frame');
        this.activePanel = 'stack';
        this.activeLine = taskUi.line;
        this.callStack.push({
          id: frameId,
          name: taskUi.callbackName,
          line: taskUi.line,
          column: 0,
          type: 'task',
          depth: this.callStack.length + 1,
        });

        this.snapshot(
          `Executing Task: ${taskUi.callbackName}`,
          'CALLSTACK_PUSH',
          `Pushed ${taskUi.callbackName} to Call Stack.`,
          `Macrotask callback is now executing. If it queues microtasks, they will be executed before the NEXT macrotask!`,
          frameId
        );

        try {
          if (timer && typeof timer.callback === 'function') {
            timer.callback(...timer.args);
          }
        } finally {
          this.callStack.pop();
          this.snapshot(
            `Task Finished: ${taskUi.callbackName}`,
            'CALLSTACK_POP',
            `Popped ${taskUi.callbackName} from Call Stack.`,
            `Macrotask execution finished. The event loop will now return to step 1: check if microtasks were scheduled.`,
            frameId
          );
        }

        // Loop continues back to microtask check!
        continue;
      }

      // If no microtasks, and no tasks in queue, are there any remaining timers in Web APIs?
      if (this.pendingTimers.length > 0) {
        // Force advance timers that are waiting
        this.advanceTimers(true);
        if (this.taskQueue.length > 0) {
          continue;
        }
      }

      // Both queues empty and no pending timers -> finished
      break;
    }
  }

  private advanceTimers(forceNext: boolean = false): void {
    if (this.pendingTimers.length === 0) return;

    // Sort pending timers by delay
    this.pendingTimers.sort((a, b) => a.delay - b.delay);

    // If forcing (stack & queues idle), advance virtual time to the earliest timer
    if (forceNext && this.taskQueue.length === 0) {
      const nextTimer = this.pendingTimers[0];
      this.virtualTime = Math.max(this.virtualTime, nextTimer.delay);
    }

    // Find all timers whose delay <= virtualTime and not yet in taskQueue
    const readyTimers = this.pendingTimers.filter(
      (t) =>
        t.delay <= this.virtualTime &&
        !this.taskQueue.some((q) => q.id === t.id)
    );

    for (const timer of readyTimers) {
      const apiItem = this.webApis.find((w) => w.id === timer.id);
      if (apiItem) {
        apiItem.status = 'ready';
        apiItem.remainingTime = 0;
      }

      const taskItem: QueueTask = {
        id: timer.id,
        type: 'task',
        source: 'setTimeout',
        callbackName: timer.callbackName,
        label: `setTimeout (${timer.delay}ms)`,
        detail: `Timer #${timer.timerId} finished`,
        line: timer.line,
        delay: timer.delay,
      };
      this.taskQueue.push(taskItem);

      this.activePanel = 'tasks';
      this.snapshot(
        `Timer Completed (${timer.delay}ms) -> Task Queue`,
        'TASK_ENQUEUE',
        `Timer #${timer.timerId} callback added to Task Queue.`,
        `The Web API timer completed. Its callback function is placed into the Task Queue (Callback Queue) to await an empty Call Stack.`,
        timer.id
      );
    }
  }

  private getFunctionName(fn: unknown): string {
    if (typeof fn === 'function' && fn.name) {
      return fn.name.replace(/^bound /, '') + '()';
    }
    if (
      typeof fn === 'object' &&
      fn !== null &&
      '__isSimulatedFunction' in fn
    ) {
      const sim = fn as SimulatedFunction;
      return sim.name ? `${sim.name}()` : 'anonymous()';
    }
    return 'anonymous()';
  }

  // --- AST Walker & Statement / Expression Evaluator ---

  private executeStatement(node: acorn.Node, scope: Scope): unknown {
    if (!node) return undefined;
    const anyNode = node as unknown as Record<string, unknown>;

    if (
      anyNode.loc &&
      typeof (anyNode.loc as Record<string, unknown>).start === 'object'
    ) {
      const start = (anyNode.loc as Record<string, Record<string, unknown>>)
        .start;
      if (typeof start.line === 'number') {
        this.activeLine = start.line;
      }
    }

    switch (node.type) {
      case 'ExpressionStatement':
        return this.evaluateExpression(anyNode.expression as acorn.Node, scope);

      case 'VariableDeclaration': {
        const declarations = anyNode.declarations as Array<
          Record<string, unknown>
        >;
        for (const decl of declarations) {
          const idNode = decl.id as Record<string, unknown>;
          const name = String(idNode.name);
          let value: unknown = undefined;
          if (decl.init) {
            value = this.evaluateExpression(decl.init as acorn.Node, scope);
          }
          scope.bindings.set(name, value);
        }
        return undefined;
      }

      case 'FunctionDeclaration': {
        const idNode = anyNode.id as Record<string, unknown>;
        const name = String(idNode.name);
        const params = (anyNode.params as Array<Record<string, unknown>>).map(
          (p) => String(p.name)
        );
        const simFunc: SimulatedFunction = {
          __isSimulatedFunction: true,
          name,
          node,
          params,
          body: anyNode.body as acorn.Node,
          closureScope: scope,
          isAsync: Boolean(anyNode.async),
        };
        scope.bindings.set(name, simFunc);
        return undefined;
      }

      case 'BlockStatement': {
        const blockScope = createScope(scope);
        const body = anyNode.body as acorn.Node[];
        for (const stmt of body) {
          const res = this.executeStatement(stmt, blockScope);
          if (res && typeof res === 'object' && '__isReturn' in res) {
            return res;
          }
        }
        return undefined;
      }

      case 'IfStatement': {
        const testVal = this.evaluateExpression(
          anyNode.test as acorn.Node,
          scope
        );
        if (testVal) {
          return this.executeStatement(anyNode.consequent as acorn.Node, scope);
        } else if (anyNode.alternate) {
          return this.executeStatement(anyNode.alternate as acorn.Node, scope);
        }
        return undefined;
      }

      case 'WhileStatement': {
        let loopCount = 0;
        while (this.evaluateExpression(anyNode.test as acorn.Node, scope)) {
          if (++loopCount > MAX_LOOP_ITERATIONS) {
            throw new Error(
              `While loop exceeded safety limit of ${MAX_LOOP_ITERATIONS} iterations.`
            );
          }
          const res = this.executeStatement(anyNode.body as acorn.Node, scope);
          if (res && typeof res === 'object' && '__isReturn' in res) {
            return res;
          }
        }
        return undefined;
      }

      case 'ForStatement': {
        const forScope = createScope(scope);
        if (anyNode.init) {
          if ((anyNode.init as acorn.Node).type === 'VariableDeclaration') {
            this.executeStatement(anyNode.init as acorn.Node, forScope);
          } else {
            this.evaluateExpression(anyNode.init as acorn.Node, forScope);
          }
        }
        let loopCount = 0;
        while (
          anyNode.test
            ? this.evaluateExpression(anyNode.test as acorn.Node, forScope)
            : true
        ) {
          if (++loopCount > MAX_LOOP_ITERATIONS) {
            throw new Error(
              `For loop exceeded safety limit of ${MAX_LOOP_ITERATIONS} iterations.`
            );
          }
          const res = this.executeStatement(
            anyNode.body as acorn.Node,
            forScope
          );
          if (res && typeof res === 'object' && '__isReturn' in res) {
            return res;
          }
          if (anyNode.update) {
            this.evaluateExpression(anyNode.update as acorn.Node, forScope);
          }
        }
        return undefined;
      }

      case 'ReturnStatement': {
        let returnVal: unknown = undefined;
        if (anyNode.argument) {
          returnVal = this.evaluateExpression(
            anyNode.argument as acorn.Node,
            scope
          );
        }
        return { __isReturn: true, value: returnVal };
      }

      default:
        return undefined;
    }
  }

  private evaluateExpression(node: acorn.Node, scope: Scope): unknown {
    if (!node) return undefined;
    const anyNode = node as unknown as Record<string, unknown>;

    switch (node.type) {
      case 'Literal':
        return anyNode.value;

      case 'Identifier':
        return getVariable(scope, String(anyNode.name));

      case 'BinaryExpression': {
        const left = this.evaluateExpression(anyNode.left as acorn.Node, scope);
        const right = this.evaluateExpression(
          anyNode.right as acorn.Node,
          scope
        );
        switch (String(anyNode.operator)) {
          case '+':
            return addDynamic(left, right);
          case '-':
            return Number(left) - Number(right);
          case '*':
            return Number(left) * Number(right);
          case '/':
            return Number(left) / Number(right);
          case '%':
            return Number(left) % Number(right);
          case '==':
            return left == right;
          case '!=':
            return left != right;
          case '===':
            return left === right;
          case '!==':
            return left !== right;
          case '<':
            return Number(left) < Number(right);
          case '<=':
            return Number(left) <= Number(right);
          case '>':
            return Number(left) > Number(right);
          case '>=':
            return Number(left) >= Number(right);
          default:
            return undefined;
        }
      }

      case 'LogicalExpression': {
        const left = this.evaluateExpression(anyNode.left as acorn.Node, scope);
        const op = String(anyNode.operator);
        if (op === '&&')
          return left
            ? this.evaluateExpression(anyNode.right as acorn.Node, scope)
            : left;
        if (op === '||')
          return left
            ? left
            : this.evaluateExpression(anyNode.right as acorn.Node, scope);
        if (op === '??')
          return left !== null && left !== undefined
            ? left
            : this.evaluateExpression(anyNode.right as acorn.Node, scope);
        return undefined;
      }

      case 'UnaryExpression': {
        const arg = this.evaluateExpression(
          anyNode.argument as acorn.Node,
          scope
        );
        const op = String(anyNode.operator);
        if (op === '!') return !arg;
        if (op === '-') return -Number(arg);
        if (op === '+') return +Number(arg);
        if (op === 'typeof') return typeof arg;
        return undefined;
      }

      case 'AssignmentExpression': {
        const right = this.evaluateExpression(
          anyNode.right as acorn.Node,
          scope
        );
        const leftNode = anyNode.left as Record<string, unknown>;
        if (leftNode.type === 'Identifier') {
          const varName = String(leftNode.name);
          const op = String(anyNode.operator);
          let finalVal: unknown = right;
          if (op === '+=') {
            const current = getVariable(scope, varName);
            finalVal = addDynamic(current, right);
          }
          if (op === '-=') {
            const current = Number(getVariable(scope, varName));
            finalVal = current - Number(right);
          }
          setVariable(scope, varName, finalVal);
          return finalVal;
        }
        return right;
      }

      case 'UpdateExpression': {
        const argNode = anyNode.argument as Record<string, unknown>;
        if (argNode.type === 'Identifier') {
          const varName = String(argNode.name);
          const current = Number(getVariable(scope, varName)) || 0;
          const isPrefix = Boolean(anyNode.prefix);
          const isIncrement = String(anyNode.operator) === '++';
          const next = isIncrement ? current + 1 : current - 1;
          setVariable(scope, varName, next);
          return isPrefix ? next : current;
        }
        return 0;
      }

      case 'ArrayExpression': {
        const elements = anyNode.elements as acorn.Node[];
        return elements.map((el) => this.evaluateExpression(el, scope));
      }

      case 'ObjectExpression': {
        const properties = anyNode.properties as Array<Record<string, unknown>>;
        const obj: Record<string, unknown> = Object.create(null);
        for (const prop of properties) {
          const keyNode = prop.key as Record<string, unknown>;
          const key = String(keyNode.name || keyNode.value);
          if (
            key === '__proto__' ||
            key === 'constructor' ||
            key === 'prototype'
          ) {
            continue;
          }
          const val = this.evaluateExpression(prop.value as acorn.Node, scope);
          obj[key] = val;
        }
        return obj;
      }

      case 'MemberExpression': {
        const obj = this.evaluateExpression(
          anyNode.object as acorn.Node,
          scope
        ) as Record<string, unknown>;
        const propNode = anyNode.property as Record<string, unknown>;
        const isComputed = Boolean(anyNode.computed);
        const propName = isComputed
          ? String(
              this.evaluateExpression(propNode as unknown as acorn.Node, scope)
            )
          : String(propNode.name);

        if (
          propName === '__proto__' ||
          propName === 'constructor' ||
          propName === 'prototype'
        ) {
          return undefined;
        }

        if (obj === null || obj === undefined) return undefined;
        const val = obj[propName];
        if (typeof val === 'function') {
          if (
            Array.isArray(obj) ||
            typeof obj === 'string' ||
            (typeof obj === 'object' &&
              obj !== null &&
              restrictedBuiltinObjects.has(obj)) ||
            obj === this.promiseConstructorRef ||
            Boolean((obj as Record<string, unknown>)?.__isSimulatedPromise) ||
            Boolean((obj as Record<string, unknown>)?.__isConsole)
          ) {
            const bound = val.bind(obj);
            this.safeFunctions.add(bound);
            return bound;
          }
          return undefined;
        }
        return val;
      }

      case 'ArrowFunctionExpression':
      case 'FunctionExpression': {
        const params = (anyNode.params as Array<Record<string, unknown>>).map(
          (p) => String(p.name)
        );
        const simFunc: SimulatedFunction = {
          __isSimulatedFunction: true,
          name: anyNode.id
            ? String((anyNode.id as Record<string, unknown>).name)
            : '',
          node,
          params,
          body: anyNode.body as acorn.Node,
          closureScope: scope,
          isAsync: Boolean(anyNode.async),
        };
        return simFunc;
      }

      case 'NewExpression': {
        const callee = this.evaluateExpression(
          anyNode.callee as acorn.Node,
          scope
        );
        const rawArgs = anyNode.arguments as acorn.Node[];
        const evalArgs = rawArgs.map((arg) => {
          if (
            arg.type === 'ArrowFunctionExpression' ||
            arg.type === 'FunctionExpression'
          ) {
            const simFunc = this.evaluateExpression(
              arg,
              scope
            ) as SimulatedFunction;
            return (res: unknown, rej: unknown) => {
              return this.callSimulatedFunction(simFunc, [res, rej]);
            };
          }
          return this.evaluateExpression(arg, scope);
        });

        // Only allow instantiating explicitly permitted constructors (e.g. simulated Promise)
        if (
          typeof callee === 'function' &&
          callee === this.promiseConstructorRef
        ) {
          return new (callee as { new (...a: unknown[]): unknown })(
            ...evalArgs
          );
        }
        return undefined;
      }

      case 'CallExpression': {
        const calleeNode = anyNode.callee as Record<string, unknown>;
        const rawArgs = anyNode.arguments as acorn.Node[];
        const evalArgs = rawArgs.map((arg) => {
          if (
            arg.type === 'ArrowFunctionExpression' ||
            arg.type === 'FunctionExpression'
          ) {
            const simFunc = this.evaluateExpression(
              arg,
              scope
            ) as SimulatedFunction;
            return (...passedArgs: unknown[]) => {
              return this.callSimulatedFunction(simFunc, passedArgs);
            };
          }
          return this.evaluateExpression(arg, scope);
        });

        const callee = this.evaluateExpression(
          calleeNode as unknown as acorn.Node,
          scope
        );

        // Simulated function invocation
        if (
          typeof callee === 'object' &&
          callee !== null &&
          '__isSimulatedFunction' in callee
        ) {
          const simFunc = callee as SimulatedFunction;
          return this.callSimulatedFunction(simFunc, evalArgs);
        }

        // Native/simulation function invocation (must be explicitly registered in safeFunctions)
        if (typeof callee === 'function' && this.safeFunctions.has(callee)) {
          return callee(...evalArgs);
        }

        return undefined;
      }

      case 'AwaitExpression': {
        // Evaluate the awaited expression
        const awaitedVal = this.evaluateExpression(
          anyNode.argument as acorn.Node,
          scope
        );
        return awaitedVal;
      }

      default:
        return undefined;
    }
  }

  private callSimulatedFunction(
    simFunc: SimulatedFunction,
    args: unknown[]
  ): unknown {
    if (this.callStack.length >= MAX_STACK_DEPTH) {
      throw new Error(
        `Maximum call stack depth of ${MAX_STACK_DEPTH} exceeded (Stack Overflow).`
      );
    }

    const frameId = this.generateId('frame');
    const funcDisplayName = simFunc.name ? `${simFunc.name}()` : 'anonymous()';

    let line = this.activeLine;
    const nodeAny = simFunc.node as unknown as Record<string, unknown>;
    if (
      nodeAny.loc &&
      typeof (nodeAny.loc as Record<string, unknown>).start === 'object'
    ) {
      const s = (nodeAny.loc as Record<string, Record<string, unknown>>).start;
      if (typeof s.line === 'number') line = s.line;
    }

    this.callStack.push({
      id: frameId,
      name: funcDisplayName,
      line,
      column: 0,
      type: 'sync',
      depth: this.callStack.length + 1,
    });

    this.activePanel = 'stack';
    this.snapshot(
      `Call: ${funcDisplayName}`,
      'CALLSTACK_PUSH',
      `Pushed ${funcDisplayName} to Call Stack.`,
      `Function invoked. A new stack frame is created with local arguments and scope.`,
      frameId
    );

    const fnScope = createScope(simFunc.closureScope);
    simFunc.params.forEach((param, i) => {
      fnScope.bindings.set(param, args[i]);
    });

    let returnVal: unknown = undefined;
    try {
      if (simFunc.body.type === 'BlockStatement') {
        const bodyList = (
          simFunc.body as unknown as Record<string, acorn.Node[]>
        ).body;
        for (const stmt of bodyList) {
          const res = this.executeStatement(stmt, fnScope);
          if (res && typeof res === 'object' && '__isReturn' in res) {
            returnVal = (res as Record<string, unknown>).value;
            break;
          }
        }
      } else {
        // Arrow expression body: () => x + 1
        returnVal = this.evaluateExpression(simFunc.body, fnScope);
      }
    } finally {
      this.callStack.pop();
      this.snapshot(
        `Return: ${funcDisplayName}`,
        'CALLSTACK_POP',
        `Popped ${funcDisplayName} from Call Stack.`,
        `Function execution completed. Stack frame destroyed and control returns to caller.`,
        frameId
      );
    }

    return returnVal;
  }
}

export function simulateCode(code: string): SimulationResult {
  const simulator = new Simulator();
  return simulator.run(code);
}
