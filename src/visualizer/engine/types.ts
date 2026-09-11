export type FrameType = 'sync' | 'task' | 'microtask';

export interface StackFrame {
  id: string;
  name: string;
  line: number | null;
  column: number | null;
  args?: unknown[];
  type: FrameType;
  depth: number;
}

export interface WebApiTimer {
  id: string;
  timerId: number;
  callbackName: string;
  delay: number;
  remainingTime: number;
  status: 'ticking' | 'ready' | 'cancelled';
  line: number | null;
}

export type QueueTaskSource =
  | 'setTimeout'
  | 'setInterval'
  | 'queueMicrotask'
  | 'Promise.then'
  | 'Promise.catch'
  | 'Promise.finally'
  | 'async/await';

export interface QueueTask {
  id: string;
  type: 'task' | 'microtask';
  source: QueueTaskSource;
  callbackName: string;
  label: string;
  detail: string;
  line: number | null;
  delay?: number;
}

export type EventLoopPhase =
  | 'idle'
  | 'stack_execution'
  | 'check_microtasks'
  | 'drain_microtasks'
  | 'render_phase'
  | 'check_tasks'
  | 'pick_task'
  | 'finished';

export type ActionType =
  | 'SCRIPT_START'
  | 'CALLSTACK_PUSH'
  | 'CALLSTACK_POP'
  | 'WEBAPI_START'
  | 'WEBAPI_COMPLETE'
  | 'WEBAPI_CANCEL'
  | 'TASK_ENQUEUE'
  | 'TASK_DEQUEUE'
  | 'MICROTASK_ENQUEUE'
  | 'MICROTASK_DEQUEUE'
  | 'EVENT_LOOP_ROTATE'
  | 'CONSOLE_OUTPUT'
  | 'SCRIPT_COMPLETE'
  | 'ERROR';

export interface ConsoleLogEntry {
  id: string;
  type: 'log' | 'info' | 'warn' | 'error';
  args: string[];
  stepIndex: number;
  line: number | null;
  timestamp: number;
}

export interface ExecutionStep {
  stepIndex: number;
  title: string;
  description: string;
  explanation: string;
  actionType: ActionType;
  callStack: StackFrame[];
  taskQueue: QueueTask[];
  microtaskQueue: QueueTask[];
  webApis: WebApiTimer[];
  eventLoopPhase: EventLoopPhase;
  eventLoopDegrees: number;
  logs: ConsoleLogEntry[];
  activeLine: number | null;
  activePanel:
    'stack' | 'loop' | 'microtasks' | 'tasks' | 'webapis' | 'console' | null;
  highlightedItemId?: string;
}

export interface SimulationResult {
  success: boolean;
  steps: ExecutionStep[];
  error: string | null;
  errorLine: number | null;
}

export interface VisualizerPreset {
  id: string;
  title: string;
  category: 'Fundamentals' | 'Promises' | 'Timers' | 'Advanced';
  description: string;
  code: string;
  keyTakeaway: string;
}
