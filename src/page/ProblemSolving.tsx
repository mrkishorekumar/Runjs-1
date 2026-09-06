import {
  memo,
  useState,
  useRef,
  useEffect,
  useCallback,
  Suspense,
} from 'react';
import { useParams, useNavigate } from 'react-router';
import Split from 'react-split';
import LunaConsole from 'luna-console';
import '../utils/lunaStyles';
import { PROBLEMS } from '../problem-engine/data/problems';
import {
  TestCase,
  TestResult,
  SubmissionResult,
  Problem,
} from '../problem-engine/types';
import {
  getUserProblemState,
  saveUserProblemCode,
  recordSubmission,
  resetProblemCode,
} from '../problem-engine/storage';
import {
  runVisibleTestCases,
  submitProblemSolution,
} from '../problem-engine/evaluator';
import useLocalStorageState from '../hook/useLocalStorageState';
import useAdjustFontSize from '../hook/useAdjustFontSize';
import useComplieCode from '../hook/useComplieCode';
import useFormatDocument from '../hook/useFormatDocument';
import useWarnOnClose from '../hook/useWarnOnClose ';
import useMediaQuery from '../hook/useMediaQuery';
import useTheme from '../hook/useTheme';
import ProblemHeader from '../components/problems/ProblemHeader';
import ProblemDescription from '../components/problems/ProblemDescription';
import TestCasePanel from '../components/problems/TestCasePanel';
import TestResultsPanel from '../components/problems/TestResultsPanel';
import ResetCodeModal from '../components/problems/ResetCodeModal';
import ComplexityModal from '../components/complexity/ComplexityModal';
import { useComplexityAnalyzer } from '../hook/useComplexityAnalyzer';
import CodeEditorSkeleton from '../components/skeletons/CodeEditorSkeleton';
import { lazyWithRetry } from '../utils/lazyWithRetry';

const CodeEditor = lazyWithRetry(() => import('../components/CodeEditor'));
import Terminal from '../components/Terminal';
import SEO from '../seo/SEO';
import { getBreadcrumbSchema } from '../seo/seoConfig';
import {
  FileText,
  Code2,
  CheckCircle2,
  Terminal as TerminalIcon,
  Sparkles,
} from 'lucide-react';

function ProblemSolving() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const { resolvedTheme } = useTheme();

  // Locate the target problem
  const problem: Problem | undefined = PROBLEMS.find(
    (p) => p.slug === slug || p.id === slug
  );

  const defaultCode =
    problem?.starterCode.javascript ||
    'function solution() {\n  // Write your solution here\n}';

  const [code, setCode] = useState<string>(() => {
    if (!problem) return '';
    const state = getUserProblemState(problem.slug, defaultCode, 'javascript');
    return state.code || defaultCode;
  });

  const language = 'javascript' as const;
  const [currentFontSize, setFontSize] = useLocalStorageState('fontSize', '14');

  const [userState, setUserState] = useState(() => {
    if (!problem) return null;
    return getUserProblemState(problem.slug, defaultCode, 'javascript');
  });

  const [customTestCases, setCustomTestCases] = useState<TestCase[]>([]);
  const [selectedCaseIndex, setSelectedCaseIndex] = useState(0);

  const [lastRunResults, setLastRunResults] = useState<TestResult[] | null>(
    null
  );
  const [lastSubmission, setLastSubmission] = useState<SubmissionResult | null>(
    null
  );
  const [resultsActiveView, setResultsActiveView] = useState<'run' | 'submit'>(
    'run'
  );

  const [bottomTab, setBottomTab] = useState<'cases' | 'results' | 'console'>(
    'cases'
  );
  const [mobileTab, setMobileTab] = useState<
    'desc' | 'editor' | 'results' | 'console'
  >('desc');

  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const {
    isAnalyzing: isAnalyzingComplexity,
    result: complexityResult,
    isModalOpen: isComplexityModalOpen,
    analyze: handleAnalyzeComplexity,
    closeModal: closeComplexityModal,
  } = useComplexityAnalyzer(() => code);

  const [consoleLogs, setConsoleLogs] = useState<
    { type: 'info' | 'log'; message: string }[]
  >([]);

  /* eslint-disable  @typescript-eslint/no-explicit-any */
  const editorRef = useRef<any>(null);
  const consoleRef = useRef<HTMLDivElement>(null);
  const lunaConsoleInstanceRef = useRef<LunaConsole | null>(null);

  // Sync state if slug changes
  useEffect(() => {
    if (problem) {
      const state = getUserProblemState(
        problem.slug,
        problem.starterCode.javascript,
        'javascript'
      );
      setUserState(state);
      setCode(state.code || problem.starterCode.javascript);
      setLastSubmission(state.submissions[0] || null);
    }
  }, [slug, problem]);

  // Auto-save code on change (debounced)
  useEffect(() => {
    if (!problem || !code) return;
    const timer = setTimeout(() => {
      saveUserProblemCode(problem.slug, code, 'javascript');
    }, 600);
    return () => clearTimeout(timer);
  }, [code, problem]);

  // Reactive Luna Console rendering
  useEffect(() => {
    if (
      consoleRef.current &&
      (bottomTab === 'console' || mobileTab === 'console')
    ) {
      consoleRef.current.innerHTML = '';
      const consoleInst = new LunaConsole(consoleRef.current, {
        theme: resolvedTheme === 'dark' ? 'dark' : 'light',
      });
      lunaConsoleInstanceRef.current = consoleInst;

      if (consoleLogs.length === 0) {
        consoleInst.log(
          'Console output will appear here when running code with console.log(...)'
        );
      } else {
        consoleLogs.forEach((entry) => {
          if (entry.type === 'info') {
            consoleInst.info(entry.message);
          } else {
            consoleInst.log(entry.message);
          }
        });
      }
    }
  }, [bottomTab, mobileTab, consoleLogs, resolvedTheme]);

  // Terminal setup
  function clearTerminal() {
    setConsoleLogs([]);
    if (consoleRef.current) {
      consoleRef.current.innerHTML = '';
    }
  }

  function handleFontSize(operation: 'increaseFontSize' | 'decreaseFontSize') {
    let size = Number(currentFontSize);
    if (operation === 'increaseFontSize') {
      size = Math.min(size + 1, 28);
    } else {
      size = Math.max(size - 1, 10);
    }
    setFontSize(size.toString());
  }

  function handleFormatDocument() {
    if (editorRef.current) {
      editorRef.current.getAction('editor.action.formatDocument')?.run();
    }
  }

  const handleRun = useCallback(async () => {
    if (!problem || isRunning || isSubmitting) return;
    setIsRunning(true);

    if (editorRef.current) {
      editorRef.current.getAction('editor.action.formatDocument')?.run();
    }

    try {
      const results = await runVisibleTestCases(
        problem,
        code,
        customTestCases,
        'javascript'
      );
      setLastRunResults(results);
      setResultsActiveView('run');
      setBottomTab('results');
      if (!isDesktop) {
        setMobileTab('results');
      }

      // Collect logs to state for Luna Console
      const newLogs: { type: 'info' | 'log'; message: string }[] = [];
      results.forEach((res, i) => {
        if (res.logs && res.logs.length > 0) {
          newLogs.push({
            type: 'info',
            message: `--- Test Case ${i + 1} Logs ---`,
          });
          res.logs.forEach((log) =>
            newLogs.push({ type: 'log', message: log })
          );
        }
      });
      setConsoleLogs(newLogs);
    } catch (err: unknown) {
      console.error('Run failed', err);
    } finally {
      setIsRunning(false);
    }
  }, [problem, isRunning, isSubmitting, code, customTestCases, isDesktop]);

  const handleSubmit = useCallback(async () => {
    if (!problem || isRunning || isSubmitting) return;
    setIsSubmitting(true);

    if (editorRef.current) {
      editorRef.current.getAction('editor.action.formatDocument')?.run();
    }

    try {
      const submission = await submitProblemSolution(
        problem,
        code,
        'javascript'
      );
      const updatedState = recordSubmission(problem.slug, submission);
      setUserState(updatedState);
      setLastSubmission(submission);
      setResultsActiveView('submit');
      setBottomTab('results');
      if (!isDesktop) {
        setMobileTab('results');
      }

      // Collect logs to state for Luna Console
      const newLogs: { type: 'info' | 'log'; message: string }[] = [];
      submission.allResults?.forEach((res, i) => {
        if (res.logs && res.logs.length > 0) {
          newLogs.push({
            type: 'info',
            message: `--- Test Case ${i + 1} Logs ---`,
          });
          res.logs.forEach((log) =>
            newLogs.push({ type: 'log', message: log })
          );
        }
      });
      setConsoleLogs(newLogs);
    } catch (err: unknown) {
      console.error('Submit failed', err);
    } finally {
      setIsSubmitting(false);
    }
  }, [problem, isRunning, isSubmitting, code, isDesktop]);

  const handleOpenResetModal = useCallback(() => {
    setIsResetModalOpen(true);
  }, []);

  const handleConfirmReset = useCallback(() => {
    if (!problem) return;
    const starter = problem.starterCode.javascript;
    resetProblemCode(problem.slug, starter, 'javascript');
    setCode(starter);
  }, [problem]);

  useAdjustFontSize(handleFontSize);
  useComplieCode(handleRun);
  useFormatDocument(handleFormatDocument);
  useWarnOnClose();

  if (!problem) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-[var(--bg-app)] text-[var(--text-primary)] p-6 space-y-4">
        <SEO
          title="Problem Not Found"
          description="The requested coding challenge was not found on RunJS."
          noIndex={true}
          noFollow={true}
        />

        <div className="text-3xl font-bold">Problem Not Found</div>
        <p className="text-sm text-[var(--text-secondary)]">
          The requested coding challenge was not found.
        </p>
        <button
          type="button"
          onClick={() => navigate('/problems')}
          className="px-4 py-2 rounded-lg bg-amber-500 text-black font-semibold text-xs shadow-xs hover:bg-amber-600 transition-colors cursor-pointer"
        >
          Back to Problemset
        </button>
      </div>
    );
  }

  return (
    <div className="h-screen w-full flex flex-col bg-[var(--bg-app)] text-[var(--text-primary)] overflow-hidden">
      <SEO
        title={`${problem.title} - JavaScript Coding Challenge`}
        description={`Solve "${problem.title}" (${problem.difficulty}) in JavaScript. ${problem.description.slice(0, 140).replace(/\s+/g, ' ').trim()}... Run tests and verify your solution on RunJS.`}
        canonical={`/problems/${problem.slug}`}
        type="article"
        keywords={[
          problem.title,
          ...problem.topics,
          `${problem.difficulty} JavaScript problem`,
          'JavaScript coding challenge',
          'algorithm solution',
        ]}
        structuredData={[
          getBreadcrumbSchema([
            { name: 'Home', item: '/' },
            { name: 'Problems', item: '/problems' },
            { name: problem.title, item: `/problems/${problem.slug}` },
          ]),
          {
            '@context': 'https://schema.org',
            '@type': 'Question',
            name: problem.title,
            text: problem.description,
            educationalLevel: problem.difficulty,
            about: problem.topics.map((t) => ({ '@type': 'Thing', name: t })),
          },
          {
            '@context': 'https://schema.org',
            '@type': 'TechArticle',
            headline: `${problem.title} - JavaScript Coding Challenge`,
            description: problem.description
              .slice(0, 200)
              .replace(/\s+/g, ' ')
              .trim(),
            proficiencyLevel: problem.difficulty,
            articleSection: problem.topics.join(', '),
            inLanguage: 'en',
            author: {
              '@type': 'Person',
              name: 'M R Kishore Kumar',
            },
          },
        ]}
      />

      {/* Top Solved Screen Navigation */}
      <ProblemHeader
        problem={problem}
        isRunning={isRunning}
        isSubmitting={isSubmitting}
        onRun={handleRun}
        onSubmit={handleSubmit}
        onReset={handleOpenResetModal}
        onFormat={handleFormatDocument}
        onAnalyzeComplexity={handleAnalyzeComplexity}
        isAnalyzingComplexity={isAnalyzingComplexity}
        currentFontSize={currentFontSize}
        onFontSizeChange={handleFontSize}
        isSolved={userState?.isSolved}
      />

      {/* Mobile Tab Switcher Bar */}
      {!isDesktop && (
        <div className="flex items-center justify-around bg-[var(--bg-surface)] border-b border-[var(--border-default)] px-2 py-1.5 text-xs font-semibold select-none shrink-0">
          <button
            type="button"
            onClick={() => setMobileTab('desc')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md ${
              mobileTab === 'desc'
                ? 'bg-[var(--bg-surface-active)] text-[var(--text-primary)] font-bold'
                : 'text-[var(--text-secondary)]'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Problem</span>
          </button>

          <button
            type="button"
            onClick={() => setMobileTab('editor')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md ${
              mobileTab === 'editor'
                ? 'bg-[var(--bg-surface-active)] text-[var(--text-primary)] font-bold'
                : 'text-[var(--text-secondary)]'
            }`}
          >
            <Code2 className="w-3.5 h-3.5 text-amber-500" />
            <span>Editor</span>
          </button>

          <button
            type="button"
            onClick={() => setMobileTab('results')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md ${
              mobileTab === 'results'
                ? 'bg-[var(--bg-surface-active)] text-[var(--text-primary)] font-bold'
                : 'text-[var(--text-secondary)]'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>Verdict</span>
          </button>

          <button
            type="button"
            onClick={() => setMobileTab('console')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md ${
              mobileTab === 'console'
                ? 'bg-[var(--bg-surface-active)] text-[var(--text-primary)] font-bold'
                : 'text-[var(--text-secondary)]'
            }`}
          >
            <TerminalIcon className="w-3.5 h-3.5" />
            <span>Console</span>
          </button>
        </div>
      )}

      {/* Main Workspace Area */}
      <div className="flex-1 overflow-hidden">
        {isDesktop ? (
          /* Desktop Split Pane Workspace */
          <Split
            sizes={[42, 58]}
            minSize={[320, 420]}
            gutterSize={6}
            className="split h-full w-full"
          >
            {/* Left Pane: Problem Description & Solutions */}
            <div className="h-full bg-[var(--bg-surface)] overflow-hidden border-r border-[var(--border-default)]">
              <ProblemDescription
                problem={problem}
                submissions={userState?.submissions || []}
                onLoadCodeIntoEditor={(restoredCode) => setCode(restoredCode)}
              />
            </div>

            {/* Right Pane: Code Editor + Test Runner Split */}
            <div className="h-full overflow-hidden">
              <Split
                direction="vertical"
                sizes={[62, 38]}
                minSize={[200, 160]}
                gutterSize={6}
                className="h-full w-full flex flex-col"
              >
                {/* Editor Container */}
                <div className="h-full flex flex-col bg-[var(--bg-app)] overflow-hidden">
                  <div className="flex items-center justify-between px-3 py-1.5 bg-[var(--bg-surface)] border-b border-[var(--border-default)] text-xs select-none">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-[var(--bg-surface-active)] text-[var(--text-primary)] font-medium border border-[var(--border-subtle)]">
                        <Code2 className="w-3.5 h-3.5 text-amber-500" />
                        <span>solution.js</span>
                      </div>
                    </div>

                    <span className="text-[11px] font-mono text-[var(--text-muted)]">
                      JavaScript • ES2024
                    </span>
                  </div>

                  <div className="flex-1 overflow-hidden">
                    <Suspense fallback={<CodeEditorSkeleton />}>
                      <CodeEditor
                        language={language}
                        code={code}
                        editorRef={editorRef}
                        currentFontSize={Number(currentFontSize)}
                        onChange={(val) => setCode(val ?? '')}
                        disableAutoSuggestion={true}
                      />
                    </Suspense>
                  </div>
                </div>

                {/* Bottom Test Runner & Console Pane */}
                <div className="h-full flex flex-col bg-[var(--bg-app)] overflow-hidden border-t border-[var(--border-default)]">
                  {/* Bottom Tab Strip */}
                  <div className="flex items-center justify-between px-3 py-1 bg-[var(--bg-surface)] border-b border-[var(--border-default)] select-none shrink-0">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setBottomTab('cases')}
                        className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                          bottomTab === 'cases'
                            ? 'bg-[var(--bg-surface-active)] text-[var(--text-primary)]'
                            : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]'
                        }`}
                      >
                        <span>Test Cases</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setBottomTab('results')}
                        className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                          bottomTab === 'results'
                            ? 'bg-[var(--bg-surface-active)] text-[var(--text-primary)]'
                            : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]'
                        }`}
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        <span>Test Results</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setBottomTab('console')}
                        className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                          bottomTab === 'console'
                            ? 'bg-[var(--bg-surface-active)] text-[var(--text-primary)]'
                            : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]'
                        }`}
                      >
                        <TerminalIcon className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Console</span>
                      </button>
                    </div>
                  </div>

                  {/* Bottom Tab Content */}
                  <div className="flex-1 overflow-hidden">
                    {bottomTab === 'cases' && (
                      <TestCasePanel
                        testCases={problem.testCases}
                        customTestCases={customTestCases}
                        onAddCustomTestCase={(newCase) =>
                          setCustomTestCases((prev) => [...prev, newCase])
                        }
                        onRemoveCustomTestCase={(idx) =>
                          setCustomTestCases((prev) =>
                            prev.filter((_, i) => i !== idx)
                          )
                        }
                        selectedCaseIndex={selectedCaseIndex}
                        onSelectCaseIndex={setSelectedCaseIndex}
                      />
                    )}

                    {bottomTab === 'results' && (
                      <TestResultsPanel
                        lastRunResults={lastRunResults}
                        lastSubmission={lastSubmission}
                        activeView={resultsActiveView}
                        onRunClick={handleRun}
                      />
                    )}

                    {bottomTab === 'console' && (
                      <Terminal
                        clearTerminal={clearTerminal}
                        consoleRef={consoleRef}
                      />
                    )}
                  </div>
                </div>
              </Split>
            </div>
          </Split>
        ) : (
          /* Mobile Single Tab View */
          <div className="h-full w-full">
            <div className={`h-full ${mobileTab === 'desc' ? '' : 'hidden'}`}>
              <ProblemDescription
                problem={problem}
                submissions={userState?.submissions || []}
                onLoadCodeIntoEditor={(restoredCode) => {
                  setCode(restoredCode);
                  setMobileTab('editor');
                }}
              />
            </div>

            <div
              className={`h-full flex flex-col ${mobileTab === 'editor' ? '' : 'hidden'}`}
            >
              <Suspense fallback={<CodeEditorSkeleton />}>
                <CodeEditor
                  language={language}
                  code={code}
                  editorRef={editorRef}
                  currentFontSize={Number(currentFontSize)}
                  onChange={(val) => setCode(val ?? '')}
                  disableAutoSuggestion={true}
                />
              </Suspense>
            </div>

            <div
              className={`h-full ${mobileTab === 'results' ? '' : 'hidden'}`}
            >
              <TestResultsPanel
                lastRunResults={lastRunResults}
                lastSubmission={lastSubmission}
                activeView={resultsActiveView}
                onRunClick={handleRun}
              />
            </div>

            <div
              className={`h-full ${mobileTab === 'console' ? '' : 'hidden'}`}
            >
              <Terminal clearTerminal={clearTerminal} consoleRef={consoleRef} />
            </div>
          </div>
        )}
      </div>

      {/* Custom Reset Code Confirmation Modal */}
      <ResetCodeModal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        onConfirm={handleConfirmReset}
        problemTitle={problem.title}
      />

      {/* Complexity Analyzer Result Modal */}
      <ComplexityModal
        isOpen={isComplexityModalOpen}
        onClose={closeComplexityModal}
        result={complexityResult}
        codeSnippet={code}
      />
    </div>
  );
}

export default memo(ProblemSolving);
