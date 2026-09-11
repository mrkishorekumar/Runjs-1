import { memo } from 'react';
import { Sparkles, ArrowRight, ShieldAlert } from 'lucide-react';
import { QueueTask } from '../engine/types';

interface MicrotaskQueuePanelProps {
  queue: QueueTask[];
  highlightedItemId?: string;
  isDraining?: boolean;
}

function MicrotaskQueuePanel({
  queue,
  highlightedItemId,
  isDraining = false,
}: MicrotaskQueuePanelProps) {
  return (
    <div className="flex flex-col h-full rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] overflow-hidden shadow-xs">
      {/* Header */}
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-[var(--bg-surface-elevated)] border-b border-[var(--border-default)] shrink-0 select-none">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-6 h-6 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)]">
              Microtask Queue
            </span>
            <span className="px-1.5 py-0.2 text-[9px] font-bold uppercase rounded bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
              High Priority
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {isDraining && (
            <span className="flex items-center gap-1 text-[10px] font-semibold text-purple-500 animate-pulse">
              <ArrowRight className="w-3 h-3" />
              <span>Draining...</span>
            </span>
          )}
          <span className="px-2 py-0.5 text-[10px] font-mono font-semibold rounded-full bg-[var(--bg-surface-active)] text-[var(--text-secondary)] border border-[var(--border-subtle)]">
            {queue.length} waiting
          </span>
        </div>
      </div>

      {/* Queue Body */}
      <div className="flex-1 p-3 overflow-y-auto flex flex-col gap-2 bg-[var(--bg-app)]/50">
        {queue.length === 0 ? (
          <div className="h-full min-h-[140px] flex flex-col items-center justify-center text-center p-4 rounded-lg border border-dashed border-[var(--border-default)] text-[var(--text-muted)] select-none">
            <Sparkles className="w-6 h-6 mb-2 stroke-[1.5] text-purple-500/40" />
            <p className="text-xs font-medium text-[var(--text-secondary)]">
              Microtask Queue is Empty
            </p>
            <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
              Promises and queueMicrotask callbacks will appear here
            </p>
          </div>
        ) : (
          queue.map((task, index) => {
            const isFirst = index === 0;
            const isHighlighted = task.id === highlightedItemId;

            return (
              <div
                key={task.id}
                className={`flex items-center justify-between p-2.5 rounded-lg border transition-all duration-200 animate-in slide-in-from-right-2 ${
                  isFirst
                    ? 'bg-purple-500/5 border-purple-500/40 shadow-xs ring-1 ring-purple-500/20'
                    : 'bg-[var(--bg-surface)] border-[var(--border-default)]'
                } ${isHighlighted ? 'ring-2 ring-amber-400 scale-[1.01]' : ''}`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="flex items-center justify-center w-5 h-5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 font-mono text-[10px] font-bold shrink-0">
                    #{index + 1}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-xs font-bold text-[var(--text-primary)] truncate">
                        {task.callbackName}
                      </span>
                      {isFirst && (
                        <span className="px-1.5 py-0.2 text-[8px] font-bold uppercase rounded bg-purple-500 text-white">
                          Next
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-[var(--text-muted)] truncate">
                      {task.detail}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {task.line !== null && (
                    <span className="px-1.5 py-0.5 text-[10px] font-mono font-medium rounded bg-[var(--bg-surface-active)] text-[var(--text-muted)] border border-[var(--border-subtle)]">
                      L:{task.line}
                    </span>
                  )}
                  <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase rounded border bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20">
                    {task.source}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Alert / Educational Tip */}
      <div className="px-3 py-1.5 bg-[var(--bg-surface-elevated)] border-t border-[var(--border-default)] text-[10px] text-[var(--text-secondary)] flex items-center justify-between select-none">
        <div className="flex items-center gap-1 text-purple-600 dark:text-purple-400 font-medium">
          <ShieldAlert className="w-3 h-3 shrink-0" />
          <span>Drained completely before ANY macrotask</span>
        </div>
        <span className="text-[var(--text-muted)]">FIFO Order</span>
      </div>
    </div>
  );
}

export default memo(MicrotaskQueuePanel);
