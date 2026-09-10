import { memo, useState } from 'react';
import { TestResult, SubmissionResult } from '../../problem-engine/types';
import { formatValueForDisplay } from '../../problem-engine/evaluator';
import {
  CheckCircle2,
  XCircle,
  Zap,
  HardDrive,
  Terminal,
  Play,
} from 'lucide-react';

interface TestResultsPanelProps {
  lastRunResults: TestResult[] | null;
  lastSubmission: SubmissionResult | null;
  activeView: 'run' | 'submit';
  onRunClick: () => void;
}

function TestResultsPanel({
  lastRunResults,
  lastSubmission,
  activeView,
  onRunClick,
}: TestResultsPanelProps) {
  const [selectedCaseIdx, setSelectedCaseIdx] = useState(0);

  if (activeView === 'submit' && lastSubmission) {
    const isAccepted = lastSubmission.status === 'accepted';
    return (
      <div className="h-full w-full flex flex-col bg-[var(--bg-app)] overflow-y-auto p-3.5 space-y-3 text-xs">
        {/* Verdict Header */}
        <div
          className={`p-3 rounded-md border flex items-center justify-between gap-3 ${
            isAccepted
              ? 'border-emerald-500/30 bg-emerald-500/10'
              : 'border-rose-500/30 bg-rose-500/10'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div
              className={`flex items-center justify-center w-8 h-8 rounded ${
                isAccepted
                  ? 'bg-emerald-500 text-black'
                  : 'bg-rose-500 text-white'
              }`}
            >
              {isAccepted ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : (
                <XCircle className="w-5 h-5" />
              )}
            </div>

            <div>
              <h3
                className={`text-sm font-bold font-mono ${
                  isAccepted
                    ? 'text-emerald-500'
                    : 'text-rose-500'
                }`}
              >
                {isAccepted
                  ? 'Accepted'
                  : lastSubmission.status === 'time_limit_exceeded'
                    ? 'Time Limit Exceeded'
                    : lastSubmission.status === 'runtime_error'
                      ? 'Runtime Error'
                      : 'Wrong Answer'}
              </h3>
              <p className="text-[11px] font-mono text-[var(--text-secondary)]">
                {isAccepted
                  ? 'All test cases passed successfully.'
                  : `Passed ${lastSubmission.passedCases} of ${lastSubmission.totalCases} test cases.`}
              </p>
            </div>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-3 gap-2">
          <div className="p-2.5 rounded-md border border-[var(--border-default)] bg-[var(--bg-surface)]">
            <div className="flex items-center gap-1 text-[10px] font-mono text-[var(--text-muted)] uppercase mb-0.5">
              <Zap className="w-3 h-3 text-amber-500" />
              <span>Runtime</span>
            </div>
            <div className="font-mono text-xs font-bold text-[var(--text-primary)]">
              {lastSubmission.runtimeMs} ms
            </div>
          </div>

          <div className="p-2.5 rounded-md border border-[var(--border-default)] bg-[var(--bg-surface)]">
            <div className="flex items-center gap-1 text-[10px] font-mono text-[var(--text-muted)] uppercase mb-0.5">
              <HardDrive className="w-3 h-3 text-blue-500" />
              <span>Memory</span>
            </div>
            <div className="font-mono text-xs font-bold text-[var(--text-primary)]">
              {lastSubmission.memoryMB} MB
            </div>
          </div>

          <div className="p-2.5 rounded-md border border-[var(--border-default)] bg-[var(--bg-surface)]">
            <div className="flex items-center gap-1 text-[10px] font-mono text-[var(--text-muted)] uppercase mb-0.5">
              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
              <span>Passed</span>
            </div>
            <div className="font-mono text-xs font-bold text-[var(--text-primary)]">
              {lastSubmission.passedCases} / {lastSubmission.totalCases}
            </div>
          </div>
        </div>

        {/* Failed Case Details if not accepted */}
        {!isAccepted && lastSubmission.failedCase && (
          <div className="space-y-2.5 pt-1 font-mono text-xs">
            <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)]">
              Failed Test Case Details
            </div>

            {lastSubmission.failedCase.error && (
              <div className="p-2.5 rounded-md border border-rose-500/30 bg-rose-500/10 text-rose-500">
                <div className="font-bold text-xs mb-1">Error:</div>
                <code>{lastSubmission.failedCase.error}</code>
              </div>
            )}

            <div className="space-y-1">
              <div className="text-[10px] text-[var(--text-muted)]">
                Input:
              </div>
              <div className="p-2 rounded-md border border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-primary)] break-all">
                <code>
                  {formatValueForDisplay(lastSubmission.failedCase.input)}
                </code>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="space-y-1">
                <div className="text-[10px] text-[var(--text-muted)]">
                  Expected Output:
                </div>
                <div className="p-2 rounded-md border border-[var(--border-default)] bg-[var(--bg-surface)] text-emerald-500 break-all">
                  <code>
                    {formatValueForDisplay(lastSubmission.failedCase.expected)}
                  </code>
                </div>
              </div>

              <div className="space-y-1">
                <div className="text-[10px] text-[var(--text-muted)]">
                  Actual Output:
                </div>
                <div className="p-2 rounded-md border border-rose-500/30 bg-rose-500/5 text-rose-500 break-all">
                  <code>
                    {formatValueForDisplay(lastSubmission.failedCase.actual)}
                  </code>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (activeView === 'run' && lastRunResults && lastRunResults.length > 0) {
    const currentCase = lastRunResults[selectedCaseIdx] || lastRunResults[0];
    const totalPassed = lastRunResults.filter((r) => r.passed).length;
    const allPassed = totalPassed === lastRunResults.length;

    return (
      <div className="h-full w-full flex flex-col bg-[var(--bg-app)] overflow-hidden text-xs">
        {/* Case Results Tabs */}
        <div className="flex items-center justify-between px-3 py-1.5 bg-[var(--bg-surface)] border-b border-[var(--border-default)] select-none shrink-0">
          <div className="flex items-center gap-1 overflow-x-auto">
            {lastRunResults.map((res, idx) => {
              const isSelected = idx === selectedCaseIdx;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedCaseIdx(idx)}
                  className={`h-7 flex items-center gap-1.5 px-2.5 rounded text-xs font-mono font-medium whitespace-nowrap border transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-[var(--bg-surface-active)] text-[var(--text-primary)] border-[var(--border-default)]'
                      : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]'
                  }`}
                >
                  {res.passed ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  ) : (
                    <XCircle className="w-3.5 h-3.5 text-rose-500" />
                  )}
                  <span>{res.name || `case_${idx + 1}`}</span>
                </button>
              );
            })}
          </div>

          <span
            className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-medium ${
              allPassed
                ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
            }`}
          >
            {totalPassed}/{lastRunResults.length} passed
          </span>
        </div>

        {/* Selected Case Breakdown */}
        <div className="flex-1 overflow-y-auto p-3.5 space-y-2.5 font-mono text-xs">
          {/* Status badge & runtime */}
          <div className="flex items-center justify-between pb-2 border-b border-[var(--border-default)]">
            <div className="flex items-center gap-1.5">
              {currentCase.passed ? (
                <span className="inline-flex items-center gap-1 text-emerald-500 font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Passed
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-rose-500 font-bold">
                  <XCircle className="w-3.5 h-3.5" />
                  Failed
                </span>
              )}
            </div>

            <span className="text-[11px] text-[var(--text-muted)]">
              runtime: {currentCase.runtimeMs}ms
            </span>
          </div>

          {currentCase.error && (
            <div className="p-2.5 rounded-md border border-rose-500/30 bg-rose-500/10 text-rose-500">
              <div className="font-bold text-xs mb-1">Runtime Error:</div>
              <code>{currentCase.error}</code>
            </div>
          )}

          {/* Input */}
          <div className="space-y-1">
            <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">
              Input:
            </div>
            <div className="p-2 rounded-md border border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-primary)] break-all">
              <code>{formatValueForDisplay(currentCase.input)}</code>
            </div>
          </div>

          {/* Expected vs Actual */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="space-y-1">
              <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">
                Expected:
              </div>
              <div className="p-2 rounded-md border border-[var(--border-default)] bg-[var(--bg-surface)] text-emerald-500 break-all">
                <code>{formatValueForDisplay(currentCase.expected)}</code>
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">
                Actual:
              </div>
              <div
                className={`p-2 rounded-md border break-all ${
                  currentCase.passed
                    ? 'border-[var(--border-default)] bg-[var(--bg-surface)] text-emerald-500'
                    : 'border-rose-500/30 bg-rose-500/5 text-rose-500'
                }`}
              >
                <code>{formatValueForDisplay(currentCase.actual)}</code>
              </div>
            </div>
          </div>

          {/* Captured Console Logs */}
          {currentCase.logs && currentCase.logs.length > 0 && (
            <div className="space-y-1 pt-1.5 border-t border-[var(--border-subtle)]">
              <div className="flex items-center gap-1 text-[10px] text-[var(--text-muted)]">
                <Terminal className="w-3 h-3" />
                <span>Captured stdout:</span>
              </div>
              <div className="p-2 rounded-md bg-[var(--bg-surface)] border border-[var(--border-default)] text-[11px] text-[var(--text-secondary)] space-y-0.5">
                {currentCase.logs.map((log, i) => (
                  <div key={i} className="text-amber-500/90 font-mono">
                    &gt; {log}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Initial Empty State
  return (
    <div className="h-full w-full flex flex-col items-center justify-center p-6 text-center space-y-2.5 bg-[var(--bg-app)]">
      <div className="w-9 h-9 rounded-md bg-amber-500/10 text-amber-500 flex items-center justify-center border border-amber-500/20">
        <Play className="w-4 h-4 fill-amber-500" />
      </div>
      <div className="space-y-0.5 max-w-xs">
        <h4 className="text-xs font-semibold text-[var(--text-primary)]">
          Ready to Test
        </h4>
        <p className="text-[11px] text-[var(--text-secondary)]">
          Click <strong>Run</strong> for sample cases or <strong>Submit</strong> for full verification.
        </p>
      </div>
      <button
        type="button"
        onClick={onRunClick}
        className="px-3 py-1.5 rounded-md bg-amber-500 hover:bg-amber-400 text-black text-xs font-semibold transition-colors cursor-pointer"
      >
        Run Test Cases
      </button>
    </div>
  );
}

export default memo(TestResultsPanel);
