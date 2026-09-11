import { memo } from 'react';
import {
  RotateCw,
  Sparkles,
  Layers,
  ListOrdered,
  CheckCircle2,
} from 'lucide-react';
import { EventLoopPhase } from '../engine/types';

interface EventLoopWheelProps {
  phase: EventLoopPhase;
  degrees: number;
  microtasksCount: number;
  tasksCount: number;
  stackCount: number;
}

function EventLoopWheel({
  phase,
  degrees,
  microtasksCount,
  tasksCount,
  stackCount,
}: EventLoopWheelProps) {
  // Map phase to friendly title & status
  let phaseTitle = 'Event Loop Idle';
  let phaseColor = 'text-amber-600 dark:text-amber-400';
  let phaseBg = 'bg-amber-500/10 border-amber-500/20';

  switch (phase) {
    case 'stack_execution':
      phaseTitle = 'Executing Call Stack';
      phaseColor = 'text-blue-600 dark:text-blue-400';
      phaseBg = 'bg-blue-500/10 border-blue-500/20';
      break;
    case 'check_microtasks':
    case 'drain_microtasks':
      phaseTitle = `Draining Microtasks (${microtasksCount} in queue)`;
      phaseColor = 'text-purple-600 dark:text-purple-400';
      phaseBg = 'bg-purple-500/10 border-purple-500/20';
      break;
    case 'render_phase':
      phaseTitle = 'Render & Animation Frame';
      phaseColor = 'text-emerald-600 dark:text-emerald-400';
      phaseBg = 'bg-emerald-500/10 border-emerald-500/20';
      break;
    case 'check_tasks':
    case 'pick_task':
      phaseTitle = `Picking Task (${tasksCount} in queue)`;
      phaseColor = 'text-amber-600 dark:text-amber-400';
      phaseBg = 'bg-amber-500/10 border-amber-500/20';
      break;
    case 'finished':
      phaseTitle = 'All Queues Drained';
      phaseColor = 'text-emerald-600 dark:text-emerald-400';
      phaseBg = 'bg-emerald-500/10 border-emerald-500/20';
      break;
    case 'idle':
    default:
      phaseTitle = 'Event Loop Ready';
      phaseColor = 'text-[var(--text-muted)]';
      phaseBg = 'bg-[var(--bg-surface-active)] border-[var(--border-default)]';
      break;
  }

  // Active quadrant states
  const isStackActive = phase === 'stack_execution';
  const isMicrotasksActive =
    phase === 'check_microtasks' || phase === 'drain_microtasks';
  const isRenderActive = phase === 'render_phase';
  const isTasksActive = phase === 'check_tasks' || phase === 'pick_task';

  return (
    <div className="flex flex-col h-full rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] overflow-hidden shadow-xs">
      {/* Header */}
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-[var(--bg-surface-elevated)] border-b border-[var(--border-default)] shrink-0 select-none">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-6 h-6 rounded-md bg-amber-500/10 text-amber-500 border border-amber-500/20">
            <RotateCw className="w-3.5 h-3.5 animate-spin [animation-duration:8s]" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)]">
            Event Loop
          </span>
        </div>
        <div
          className={`px-2 py-0.5 sm:px-2.5 sm:py-0.5 text-[9px] sm:text-[10px] font-semibold rounded-full border ${phaseBg} ${phaseColor} transition-all duration-300 truncate max-w-[160px] sm:max-w-none`}
        >
          {phaseTitle}
        </div>
      </div>

      {/* Interactive Visualizer Canvas / Wheel Area */}
      <div className="flex-1 flex flex-col items-center justify-center p-3 sm:p-4 relative bg-[var(--bg-app)]/30 min-h-[230px] select-none">
        <div className="relative w-44 h-44 sm:w-48 sm:h-48 flex items-center justify-center scale-95 sm:scale-100">
          {/* Outer Orbital Ring with dashed track */}
          <div className="absolute inset-0 rounded-full border-2 border-dashed border-[var(--border-default)] animate-spin [animation-duration:40s]" />

          {/* Secondary glowing ring */}
          <div className="absolute inset-2 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-surface)]/50 backdrop-blur-xs" />

          {/* Phase Node 1: Call Stack (Top: 0°) */}
          <div
            className={`absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border transition-all duration-300 z-10 ${
              isStackActive
                ? 'bg-blue-500 text-white border-blue-400 shadow-md shadow-blue-500/30 scale-105'
                : 'bg-[var(--bg-surface-elevated)] text-[var(--text-secondary)] border-[var(--border-default)]'
            }`}
          >
            <Layers className="w-3 h-3" />
            <span>Call Stack</span>
            {stackCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-blue-600/30 text-[9px] flex items-center justify-center">
                {stackCount}
              </span>
            )}
          </div>

          {/* Phase Node 2: Microtasks (Right: 90°) */}
          <div
            className={`absolute right-0 top-1/2 translate-x-3 -translate-y-1/2 flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border transition-all duration-300 z-10 ${
              isMicrotasksActive
                ? 'bg-purple-600 text-white border-purple-400 shadow-md shadow-purple-500/30 scale-105'
                : 'bg-[var(--bg-surface-elevated)] text-[var(--text-secondary)] border-[var(--border-default)]'
            }`}
          >
            <Sparkles className="w-3 h-3" />
            <span>Microtasks</span>
            {microtasksCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-purple-700/50 text-[9px] flex items-center justify-center">
                {microtasksCount}
              </span>
            )}
          </div>

          {/* Phase Node 3: Render (Bottom: 180°) */}
          <div
            className={`absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-2 flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border transition-all duration-300 z-10 ${
              isRenderActive
                ? 'bg-emerald-500 text-white border-emerald-400 shadow-md shadow-emerald-500/30 scale-105'
                : 'bg-[var(--bg-surface-elevated)] text-[var(--text-muted)] border-[var(--border-default)]'
            }`}
          >
            <CheckCircle2 className="w-3 h-3" />
            <span>Render</span>
          </div>

          {/* Phase Node 4: Task Queue (Left: 270°) */}
          <div
            className={`absolute left-0 top-1/2 -translate-x-3 -translate-y-1/2 flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border transition-all duration-300 z-10 ${
              isTasksActive
                ? 'bg-amber-500 text-black border-amber-400 shadow-md shadow-amber-500/30 scale-105'
                : 'bg-[var(--bg-surface-elevated)] text-[var(--text-secondary)] border-[var(--border-default)]'
            }`}
          >
            <ListOrdered className="w-3 h-3" />
            <span>Tasks</span>
            {tasksCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-amber-600/30 text-[9px] flex items-center justify-center">
                {tasksCount}
              </span>
            )}
          </div>

          {/* Center Hub & Rotating Radar Needle */}
          <div className="relative w-20 h-20 rounded-full bg-[var(--bg-surface-elevated)] border border-[var(--border-default)] shadow-inner flex items-center justify-center">
            {/* Center Pulse */}
            <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
              <RotateCw className="w-5 h-5 text-amber-500 animate-spin [animation-duration:12s]" />
            </div>

            {/* Rotating Arrow / Pointer */}
            <div
              className="absolute inset-0 flex items-center justify-center transition-transform duration-500 ease-out"
              style={{ transform: `rotate(${degrees}deg)` }}
            >
              <div className="w-1 h-16 bg-gradient-to-t from-transparent via-amber-500 to-amber-400 -translate-y-5 rounded-full shadow-xs" />
              <div className="w-2.5 h-2.5 bg-amber-400 rotate-45 -translate-y-13 rounded-xs shadow-md shadow-amber-400/50" />
            </div>
          </div>
        </div>

        {/* Dynamic Cycle Explainer */}
        <div className="mt-4 text-center">
          <p className="text-[11px] font-medium text-[var(--text-secondary)] max-w-xs">
            {isStackActive &&
              'Stack executing synchronous JavaScript statements.'}
            {isMicrotasksActive &&
              'Call stack clear! Draining all pending Promises and microtasks.'}
            {isTasksActive &&
              'Microtask queue empty! Dequeuing exactly ONE macrotask to the stack.'}
            {phase === 'finished' &&
              'All execution contexts, microtasks, and task queues resolved.'}
            {phase === 'idle' && 'Waiting for script execution to begin.'}
          </p>
        </div>
      </div>

      {/* Footer Info */}
      <div className="px-3 py-1.5 bg-[var(--bg-surface-elevated)] border-t border-[var(--border-default)] text-[10px] text-[var(--text-muted)] flex items-center justify-between select-none">
        <span>Cycle: Stack → Microtasks → Tasks</span>
        <span>HTML5 Event Loop Spec</span>
      </div>
    </div>
  );
}

export default memo(EventLoopWheel);
