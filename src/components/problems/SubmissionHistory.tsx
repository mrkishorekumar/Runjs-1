import { memo, useState } from 'react';
import { SubmissionResult } from '../../problem-engine/types';
import CodeSnippet from '../CodeSnippet';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Code2,
  History,
} from 'lucide-react';

interface SubmissionHistoryProps {
  submissions: SubmissionResult[];
  onLoadCodeIntoEditor?: (code: string) => void;
}

function SubmissionHistory({
  submissions,
  onLoadCodeIntoEditor,
}: SubmissionHistoryProps) {
  const [selectedSubId, setSelectedSubId] = useState<string | null>(
    submissions[0]?.id || null
  );

  const selectedSubmission =
    submissions.find((s) => s.id === selectedSubId) || submissions[0];

  function getStatusBadge(status: SubmissionResult['status']) {
    switch (status) {
      case 'accepted':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Accepted
          </span>
        );
      case 'wrong_answer':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
            <XCircle className="w-3.5 h-3.5" />
            Wrong Answer
          </span>
        );
      case 'runtime_error':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
            <AlertTriangle className="w-3.5 h-3.5" />
            Runtime Error
          </span>
        );
      case 'time_limit_exceeded':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30">
            <Clock className="w-3.5 h-3.5" />
            Time Limit Exceeded
          </span>
        );
    }
  }

  function formatDate(iso: string) {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return iso;
    }
  }

  if (submissions.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-[var(--border-default)] bg-[var(--bg-surface)] p-8 text-center space-y-2">
        <History className="w-8 h-8 text-[var(--text-muted)] mx-auto opacity-50" />
        <h4 className="text-sm font-semibold text-[var(--text-primary)]">
          No submissions yet
        </h4>
        <p className="text-xs text-[var(--text-secondary)] max-w-xs mx-auto">
          Write your solution and click the "Submit" button to test against all
          hidden test cases.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-3xl">
      <div className="flex items-center justify-between pb-2 border-b border-[var(--border-default)]">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-purple-500" />
          <h3 className="text-sm font-bold text-[var(--text-primary)]">
            Submission History
          </h3>
        </div>
        <span className="text-xs font-mono tabular-nums text-[var(--text-muted)]">
          {submissions.length} Total Attempts
        </span>
      </div>

      {/* Submissions List */}
      <div className="space-y-2">
        {submissions.map((sub) => {
          const isSelected = sub.id === (selectedSubmission?.id || '');
          return (
            <button
              type="button"
              key={sub.id}
              onClick={() => setSelectedSubId(sub.id)}
              className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${
                isSelected
                  ? 'border-amber-500/50 bg-[var(--bg-surface-active)] shadow-xs'
                  : 'border-[var(--border-default)] bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)]'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {getStatusBadge(sub.status)}
                  <span className="text-[11px] text-[var(--text-muted)]">
                    {formatDate(sub.timestamp)}
                  </span>
                </div>

                <div className="flex items-center gap-3 font-mono text-[11px] text-[var(--text-secondary)] tabular-nums">
                  <span>
                    Cases:{' '}
                    <strong className="text-[var(--text-primary)]">
                      {sub.passedCases}/{sub.totalCases}
                    </strong>
                  </span>
                  <span>
                    Runtime:{' '}
                    <strong className="text-[var(--text-primary)]">
                      {sub.runtimeMs}ms
                    </strong>
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Submission Detail & Code */}
      {selectedSubmission && (
        <div className="mt-4 space-y-3 pt-3 border-t border-[var(--border-default)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Code2 className="w-4 h-4 text-amber-500" />
              <h4 className="text-xs font-bold text-[var(--text-primary)]">
                Submitted Code Snapshot ({selectedSubmission.language})
              </h4>
            </div>

            <div className="flex items-center gap-2">
              {onLoadCodeIntoEditor && (
                <button
                  type="button"
                  onClick={() => onLoadCodeIntoEditor(selectedSubmission.code)}
                  className="px-2.5 py-1 rounded-md bg-amber-500/10 hover:bg-amber-500 text-amber-600 dark:text-amber-400 hover:text-black text-[11px] font-semibold transition-colors cursor-pointer"
                >
                  Restore to Editor
                </button>
              )}
            </div>
          </div>

          <CodeSnippet
            code={selectedSubmission.code}
            language={selectedSubmission.language || 'javascript'}
            title={`Submitted Code (${selectedSubmission.language || 'javascript'})`}
          />
        </div>
      )}
    </div>
  );
}

export default memo(SubmissionHistory);
