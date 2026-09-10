import { memo, useState } from 'react';
import { TestCase } from '../../problem-engine/types';
import { formatValueForDisplay } from '../../problem-engine/evaluator';
import { Plus, Trash2, CheckCircle2 } from 'lucide-react';

interface TestCasePanelProps {
  testCases: TestCase[];
  customTestCases: TestCase[];
  onAddCustomTestCase: (tc: TestCase) => void;
  onRemoveCustomTestCase: (index: number) => void;
  selectedCaseIndex: number;
  onSelectCaseIndex: (index: number) => void;
}

function TestCasePanel({
  testCases,
  customTestCases,
  onAddCustomTestCase,
  onRemoveCustomTestCase,
  selectedCaseIndex,
  onSelectCaseIndex,
}: TestCasePanelProps) {
  const allCases = [...testCases, ...customTestCases];
  const [customInputText, setCustomInputText] = useState(
    '[\n  [2, 7, 11, 15],\n  9\n]'
  );
  const [customExpectedText, setCustomExpectedText] = useState('[0, 1]');
  const [isAdding, setIsAdding] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);

  const currentCase = allCases[selectedCaseIndex] || allCases[0];

  function handleSaveCustom() {
    try {
      setParseError(null);
      const parsedInput = JSON.parse(customInputText);
      const parsedExpected = JSON.parse(customExpectedText);

      const newCase: TestCase = {
        name: `Custom ${customTestCases.length + 1}`,
        input: Array.isArray(parsedInput) ? parsedInput : [parsedInput],
        expected: parsedExpected,
        isCustom: true,
      };

      const newIndex = testCases.length + customTestCases.length;
      onAddCustomTestCase(newCase);
      onSelectCaseIndex(newIndex);
      setIsAdding(false);
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'Invalid JSON syntax in custom test case';
      setParseError(message);
    }
  }

  return (
    <div className="h-full w-full flex flex-col bg-[var(--bg-app)] overflow-hidden text-xs">
      {/* Test Case Selection Tabs */}
      <div className="flex items-center gap-1 px-3 py-1.5 bg-[var(--bg-surface)] border-b border-[var(--border-default)] select-none shrink-0 overflow-x-auto scrollbar-none">
        {allCases.map((tc, idx) => {
          const isSelected = idx === selectedCaseIndex && !isAdding;
          const isCustom = idx >= testCases.length;

          return (
            <div key={idx} className="flex items-center">
              <button
                type="button"
                onClick={() => {
                  setIsAdding(false);
                  onSelectCaseIndex(idx);
                }}
                className={`h-7 px-2.5 rounded-md text-xs font-mono whitespace-nowrap transition-colors ${
                  isSelected
                    ? 'bg-[var(--bg-surface-active)] text-[var(--text-primary)] border border-[var(--border-subtle)] font-semibold'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]'
                }`}
              >
                {tc.name || `case_${idx + 1}`}
              </button>

              {isCustom && (
                <button
                  type="button"
                  title="Delete custom case"
                  aria-label="Delete custom case"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveCustomTestCase(idx - testCases.length);
                    onSelectCaseIndex(0);
                  }}
                  className="p-1 ml-0.5 text-[var(--text-muted)] hover:text-rose-400 rounded transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>
          );
        })}

        <button
          type="button"
          onClick={() => setIsAdding(true)}
          className={`flex items-center gap-1 h-7 px-2 rounded-md text-xs font-mono border border-dashed transition-colors ${
            isAdding
              ? 'border-amber-500/60 text-amber-400 bg-amber-500/10 font-semibold'
              : 'border-[var(--border-default)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-hover)]'
          }`}
        >
          <Plus className="w-3 h-3" />
          <span>+custom</span>
        </button>
      </div>

      {/* Test Case Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 font-mono text-xs">
        {isAdding ? (
          /* Custom Test Case Creator */
          <div className="space-y-3 font-sans">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold text-[var(--text-primary)] font-mono">
                Add Custom Test Case
              </h4>
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] font-mono"
              >
                Cancel
              </button>
            </div>

            {parseError && (
              <div className="p-2 rounded-md bg-rose-500/10 text-rose-500 border border-rose-500/20 text-xs font-mono">
                {parseError}
              </div>
            )}

            <div className="space-y-1">
              <label
                htmlFor="custom-case-args"
                className="text-[11px] font-mono text-[var(--text-secondary)]"
              >
                Arguments Array (JSON e.g. [[1,2,3], 5])
              </label>
              <textarea
                id="custom-case-args"
                value={customInputText}
                onChange={(e) => setCustomInputText(e.target.value)}
                rows={4}
                className="w-full p-2 font-mono text-xs rounded-md border border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-primary)] focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 focus:outline-none transition-colors"
              />
            </div>

            <div className="space-y-1">
              <label
                htmlFor="custom-case-expected"
                className="text-[11px] font-mono text-[var(--text-secondary)]"
              >
                Expected Return Value (JSON)
              </label>
              <input
                id="custom-case-expected"
                type="text"
                value={customExpectedText}
                onChange={(e) => setCustomExpectedText(e.target.value)}
                className="w-full h-8 px-2.5 font-mono text-xs rounded-md border border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-primary)] focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 focus:outline-none transition-colors"
              />
            </div>

            <button
              type="button"
              onClick={handleSaveCustom}
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md bg-amber-500 hover:bg-amber-400 text-black text-xs font-semibold transition-colors"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Save & Select Case</span>
            </button>
          </div>
        ) : currentCase ? (
          /* Selected Test Case Inspector */
          <div className="space-y-3">
            {/* Input Arguments */}
            <div className="space-y-1.5">
              <div className="text-[11px] font-mono text-[var(--text-muted)]">
                Input Arguments
              </div>
              <div className="space-y-1.5">
                {Array.isArray(currentCase.input) ? (
                  currentCase.input.map((arg, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-md border border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-primary)] whitespace-pre-wrap break-all font-mono"
                    >
                      <div className="text-[10px] text-[var(--text-muted)] font-mono mb-1">
                        arg[{idx}]:
                      </div>
                      <code>{formatValueForDisplay(arg)}</code>
                    </div>
                  ))
                ) : (
                  <div className="p-2.5 rounded-md border border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-primary)] whitespace-pre-wrap break-all font-mono">
                    <code>{formatValueForDisplay(currentCase.input)}</code>
                  </div>
                )}
              </div>
            </div>

            {/* Expected Output */}
            <div className="space-y-1.5">
              <div className="text-[11px] font-mono text-[var(--text-muted)]">
                Expected Output
              </div>
              <div className="p-2.5 rounded-md border border-[var(--border-default)] bg-[var(--bg-surface)] text-emerald-600 dark:text-emerald-400 whitespace-pre-wrap break-all font-mono">
                <code>{formatValueForDisplay(currentCase.expected)}</code>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default memo(TestCasePanel);
