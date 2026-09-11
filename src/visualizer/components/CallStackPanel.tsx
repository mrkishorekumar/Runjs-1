import { memo } from 'react';
import { Layers, Activity } from 'lucide-react';
import { StackFrame } from '../engine/types';

interface CallStackPanelProps {
  stack: StackFrame[];
  highlightedItemId?: string;
}

function CallStackPanel({ stack, highlightedItemId }: CallStackPanelProps) {
  // Stack displays with top of the stack visually on top (or bottom to top)
  // Reversing so the currently active/top frame is at the top of the panel
  const reversedStack = [...stack].reverse();

  return (
    <div className="flex flex-col h-full rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] overflow-hidden shadow-xs">
      {/* Panel Header */}
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-[var(--bg-surface-elevated)] border-b border-[var(--border-default)] shrink-0 select-none">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-6 h-6 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
            <Layers className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)]">
            Call Stack
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="px-2 py-0.5 text-[10px] font-mono font-semibold rounded-full bg-[var(--bg-surface-active)] text-[var(--text-secondary)] border border-[var(--border-subtle)]">
            Depth: {stack.length}
          </span>
        </div>
      </div>

      {/* Stack Container */}
      <div className="flex-1 p-3 overflow-y-auto flex flex-col justify-start gap-2 bg-[var(--bg-app)]/50">
        {reversedStack.length === 0 ? (
          <div className="h-full min-h-[140px] flex flex-col items-center justify-center text-center p-4 rounded-lg border border-dashed border-[var(--border-default)] text-[var(--text-muted)] select-none">
            <Activity className="w-6 h-6 mb-2 stroke-[1.5] text-[var(--text-muted)]/60 animate-pulse" />
            <p className="text-xs font-medium text-[var(--text-secondary)]">
              Call Stack is Empty
            </p>
            <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
              Ready for next microtask or macrotask
            </p>
          </div>
        ) : (
          reversedStack.map((frame, index) => {
            const isTop = index === 0;
            const isHighlighted = frame.id === highlightedItemId;

            let badgeClass =
              'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
            if (frame.type === 'microtask') {
              badgeClass =
                'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20';
            } else if (frame.type === 'task') {
              badgeClass =
                'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
            }

            return (
              <div
                key={frame.id}
                className={`flex items-center justify-between p-2.5 rounded-lg border transition-all duration-200 animate-in slide-in-from-top-2 ${
                  isTop
                    ? 'bg-[var(--bg-surface-elevated)] border-blue-500/50 shadow-md ring-1 ring-blue-500/30'
                    : 'bg-[var(--bg-surface)] border-[var(--border-default)] hover:border-[var(--border-hover)]'
                } ${isHighlighted ? 'ring-2 ring-amber-400 scale-[1.01]' : ''}`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className={`w-2 h-2 rounded-full shrink-0 ${
                      isTop
                        ? 'bg-blue-500 animate-ping'
                        : 'bg-[var(--text-muted)]'
                    }`}
                  />
                  <div className="flex flex-col min-w-0">
                    <span className="font-mono text-xs font-bold text-[var(--text-primary)] truncate">
                      {frame.name}
                    </span>
                    {isTop && (
                      <span className="text-[10px] text-blue-500 font-semibold tracking-wide">
                        Active Execution Frame
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {frame.line !== null && (
                    <span className="px-1.5 py-0.5 text-[10px] font-mono font-medium rounded bg-[var(--bg-surface-active)] text-[var(--text-muted)] border border-[var(--border-subtle)]">
                      L:{frame.line}
                    </span>
                  )}
                  <span
                    className={`px-1.5 py-0.5 text-[9px] font-bold uppercase rounded border ${badgeClass}`}
                  >
                    {frame.type}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Panel Footer / Subtitle */}
      <div className="px-3 py-1.5 bg-[var(--bg-surface-elevated)] border-t border-[var(--border-default)] text-[10px] text-[var(--text-muted)] flex items-center justify-between select-none">
        <span>LIFO (Last In, First Out)</span>
        <span>{stack.length > 0 ? 'Executing synchronous frame' : 'Idle'}</span>
      </div>
    </div>
  );
}

export default memo(CallStackPanel);
