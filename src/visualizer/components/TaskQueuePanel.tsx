import { memo } from 'react';
import { ListOrdered, Clock, Globe, ArrowRight } from 'lucide-react';
import { QueueTask, WebApiTimer } from '../engine/types';

interface TaskQueuePanelProps {
  queue: QueueTask[];
  webApis: WebApiTimer[];
  highlightedItemId?: string;
  isPicking?: boolean;
}

function TaskQueuePanel({
  queue,
  webApis,
  highlightedItemId,
  isPicking = false,
}: TaskQueuePanelProps) {
  const activeTimers = webApis.filter((w) => w.status === 'ticking');

  return (
    <div className="flex flex-col h-full rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] overflow-hidden shadow-xs">
      {/* Header */}
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-[var(--bg-surface-elevated)] border-b border-[var(--border-default)] shrink-0 select-none">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-6 h-6 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <ListOrdered className="w-3.5 h-3.5" />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)]">
              Task Queue
            </span>
            <span className="px-1.5 py-0.2 text-[9px] font-bold uppercase rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              Macrotasks
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {isPicking && (
            <span className="flex items-center gap-1 text-[10px] font-semibold text-amber-600 dark:text-amber-400 animate-pulse">
              <ArrowRight className="w-3 h-3" />
              <span>Picking 1 task...</span>
            </span>
          )}
          <span className="px-2 py-0.5 text-[10px] font-mono font-semibold rounded-full bg-[var(--bg-surface-active)] text-[var(--text-secondary)] border border-[var(--border-subtle)]">
            {queue.length} in queue
          </span>
        </div>
      </div>

      {/* Main Body with Web APIs section on top and Task Queue below */}
      <div className="flex-1 flex flex-col p-3 gap-3 overflow-y-auto bg-[var(--bg-app)]/50">
        {/* Section 1: Web APIs (Background Timers) */}
        {webApis.length > 0 && (
          <div className="flex flex-col gap-1.5 p-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)]">
            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] select-none">
              <div className="flex items-center gap-1.5">
                <Globe className="w-3 h-3 text-cyan-600 dark:text-cyan-400" />
                <span>Web APIs (Background Timers)</span>
              </div>
              <span>{activeTimers.length} active</span>
            </div>

            <div className="flex flex-wrap gap-1.5 pt-1">
              {webApis.map((timer) => {
                const isReady = timer.status === 'ready';
                const isCancelled = timer.status === 'cancelled';

                let statusBadge =
                  'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20';
                if (isReady)
                  statusBadge =
                    'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
                if (isCancelled)
                  statusBadge =
                    'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';

                return (
                  <div
                    key={timer.id}
                    className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs border bg-[var(--bg-surface-elevated)] transition-all ${
                      timer.id === highlightedItemId
                        ? 'ring-2 ring-amber-400'
                        : ''
                    }`}
                  >
                    <Clock className="w-3 h-3 text-[var(--text-muted)]" />
                    <span className="font-mono text-[11px] font-semibold text-[var(--text-primary)]">
                      {timer.callbackName}
                    </span>
                    <span
                      className={`px-1 py-0.2 text-[9px] font-bold rounded border ${statusBadge}`}
                    >
                      {timer.delay}ms • {timer.status}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Section 2: Task Queue Items */}
        <div className="flex-1 flex flex-col gap-2">
          {queue.length === 0 ? (
            <div className="h-full min-h-[120px] flex flex-col items-center justify-center text-center p-4 rounded-lg border border-dashed border-[var(--border-default)] text-[var(--text-muted)] select-none">
              <Clock className="w-6 h-6 mb-2 stroke-[1.5] text-amber-500/40" />
              <p className="text-xs font-medium text-[var(--text-secondary)]">
                Task Queue is Empty
              </p>
              <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                Completed setTimeout and event callbacks enter here
              </p>
            </div>
          ) : (
            queue.map((task, index) => {
              const isFirst = index === 0;
              const isHighlighted = task.id === highlightedItemId;

              return (
                <div
                  key={task.id}
                  className={`flex items-center justify-between p-2.5 rounded-lg border transition-all duration-200 animate-in slide-in-from-left-2 ${
                    isFirst
                      ? 'bg-amber-500/5 border-amber-500/40 shadow-xs ring-1 ring-amber-500/20'
                      : 'bg-[var(--bg-surface)] border-[var(--border-default)]'
                  } ${isHighlighted ? 'ring-2 ring-amber-400 scale-[1.01]' : ''}`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="flex items-center justify-center w-5 h-5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-mono text-[10px] font-bold shrink-0">
                      #{index + 1}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs font-bold text-[var(--text-primary)] truncate">
                          {task.callbackName}
                        </span>
                        {isFirst && (
                          <span className="px-1.5 py-0.2 text-[8px] font-bold uppercase rounded bg-amber-500 text-black">
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
                    <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase rounded border bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20">
                      {task.label}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="px-3 py-1.5 bg-[var(--bg-surface-elevated)] border-t border-[var(--border-default)] text-[10px] text-[var(--text-secondary)] flex items-center justify-between select-none">
        <span className="text-amber-600 dark:text-amber-400 font-medium">
          1 Macrotask processed per turn
        </span>
        <span className="text-[var(--text-muted)]">
          Web APIs → Callback Queue
        </span>
      </div>
    </div>
  );
}

export default memo(TaskQueuePanel);
