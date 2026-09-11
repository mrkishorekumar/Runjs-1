export type ExecutionContextType = 'global' | 'function';

export type ExecutionContextPhase = 'creation' | 'execution' | 'completed';

export type MemoryVariableKind =
  'var' | 'let' | 'const' | 'function' | 'param' | 'this' | 'arguments';

export type MemoryVariableStatus =
  | 'uninitialized' // TDZ for let / const
  | 'initialized' // undefined for var, bound for params/functions
  | 'updated' // assigned during code execution
  | 'accessed'; // read during execution

export interface MemoryVariable {
  name: string;
  kind: MemoryVariableKind;
  value: string;
  rawValue?: unknown;
  previousValue?: string;
  status: MemoryVariableStatus;
  isUpdated?: boolean;
  declarationLine?: number;
}

export interface ExecutionContext {
  id: string;
  type: ExecutionContextType;
  name: string;
  phase: ExecutionContextPhase;
  variables: Record<string, MemoryVariable>;
  callLine: number | null;
  depth: number;
  thisBinding: string;
  scopeName: string;
  returnValue?: string;
}

export interface ContextCallStackFrame {
  id: string;
  contextId: string;
  name: string;
  type: ExecutionContextType;
  phase: ExecutionContextPhase;
  line: number | null;
  depth: number;
  isActive: boolean;
  argsFormatted?: string;
}

export interface ContextConsoleLog {
  id: string;
  args: string[];
  line: number | null;
  type: 'log' | 'warn' | 'error' | 'info';
}

export type ContextActionType =
  | 'GEC_CREATE'
  | 'MEMORY_ALLOCATE'
  | 'MEMORY_COMPLETE'
  | 'CODE_EXECUTE'
  | 'VARIABLE_ASSIGN'
  | 'FUNCTION_CALL'
  | 'FEC_CREATE'
  | 'FEC_POP'
  | 'RETURN'
  | 'CONSOLE_LOG'
  | 'COMPLETE'
  | 'ERROR';

export interface ContextExecutionStep {
  stepIndex: number;
  title: string;
  phase: 'memory' | 'execution' | 'idle';
  actionType: ContextActionType;
  explanation: string;
  activeLine: number | null;
  callStack: ContextCallStackFrame[];
  contexts: ExecutionContext[];
  activeContextId: string;
  updatedVariableName?: string;
  updatedContextId?: string;
  logs: ContextConsoleLog[];
}

export interface ContextPreset {
  id: string;
  title: string;
  category: 'Fundamentals' | 'Functions' | 'Hoisting' | 'Advanced';
  description: string;
  code: string;
  keyTakeaway: string;
}

export interface ContextSimulationResult {
  success: boolean;
  steps: ContextExecutionStep[];
  error: string | null;
  errorLine: number | null;
}
