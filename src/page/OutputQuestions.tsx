import { useState, useMemo, useCallback, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import SEO from '../seo/SEO';
import { getBreadcrumbSchema } from '../seo/seoConfig';
import useLocalStorageState from '../hook/useLocalStorageState';
import CodeSnippet from '../components/CodeSnippet';
import QuestionPaletteModal from '../components/output-questions/QuestionPaletteModal';
import ResetQuizModal from '../components/output-questions/ResetQuizModal';
import QuizWelcome from '../components/output-questions/QuizWelcome';
import type {
  OutputQuestion,
  OutputQuestionDifficulty,
  OutputQuestionFilter,
} from '../data/output-questions-types';
import {
  Sparkles,
  CheckCircle2,
  XCircle,
  HelpCircle,
  RotateCcw,
  Trophy,
  Target,
  Brain,
  FileQuestion,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  Lightbulb,
  ArrowRight,
  Code2,
  ExternalLink,
  Hash,
  Play,
} from 'lucide-react';

// Question data
import easyQuestions from '../data/output-questions-easy.json';
import mediumQuestions from '../data/output-questions-medium.json';
import hardQuestions from '../data/output-questions-hard.json';

const allQuestions: OutputQuestion[] = [
  ...(easyQuestions as OutputQuestion[]),
  ...(mediumQuestions as OutputQuestion[]),
  ...(hardQuestions as OutputQuestion[]),
];

const DIFFICULTY_BADGES: Record<OutputQuestionDifficulty, string> = {
  easy: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  medium:
    'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  hard: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
};

const DIFFICULTY_ICONS: Record<OutputQuestionDifficulty, typeof Target> = {
  easy: Target,
  medium: Brain,
  hard: Trophy,
};

const OPTION_KEYS = ['A', 'B', 'C', 'D'];

export default function OutputQuestions() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeFilter, setActiveFilter] = useState<OutputQuestionFilter>('all');
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  // View mode: 'welcome' | 'quiz' (opens directly in quiz if ?q= is provided)
  const [viewMode, setViewMode] = useState<'welcome' | 'quiz'>(() => {
    return searchParams.has('q') ? 'quiz' : 'welcome';
  });

  // Stored answers
  const [answers, setAnswers] = useLocalStorageState<Record<number, number>>(
    'outputQuizAnswers',
    {}
  );

  // Filter questions
  const filteredQuestions = useMemo(() => {
    if (activeFilter === 'all') return allQuestions;
    return allQuestions.filter((q) => q.difficulty === activeFilter);
  }, [activeFilter]);

  // Current question index in filtered list
  const initialQId = Number(searchParams.get('q'));
  const [currentIndex, setCurrentIndex] = useState(() => {
    if (initialQId && initialQId >= 1 && initialQId <= 100) {
      const foundIdx = allQuestions.findIndex((q) => q.id === initialQId);
      if (foundIdx !== -1) return foundIdx;
    }
    return 0;
  });

  // Keep index within bounds if filter changes
  useEffect(() => {
    if (currentIndex >= filteredQuestions.length) {
      setCurrentIndex(0);
    }
  }, [filteredQuestions.length, currentIndex]);

  // Safe current question reference
  const currentQuestion: OutputQuestion =
    filteredQuestions[currentIndex] || filteredQuestions[0] || allQuestions[0];

  // Sync URL query param when in quiz mode
  useEffect(() => {
    if (viewMode === 'quiz' && currentQuestion) {
      setSearchParams({ q: currentQuestion.id.toString() }, { replace: true });
    }
  }, [viewMode, currentQuestion, setSearchParams]);

  // Handle answering
  const handleAnswer = useCallback(
    (optionIdx: number) => {
      if (!currentQuestion) return;
      if (answers[currentQuestion.id] !== undefined) return; // Only first answer counts

      const next = { ...answers, [currentQuestion.id]: optionIdx };
      setAnswers(next);
    },
    [currentQuestion, answers, setAnswers]
  );

  // Navigation handlers
  const handleNext = useCallback(() => {
    if (currentIndex < filteredQuestions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentIndex, filteredQuestions.length]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentIndex]);

  const handleJumpToQuestion = useCallback(
    (indexInAll: number) => {
      const targetQ = allQuestions[indexInAll];
      if (!targetQ) return;

      if (activeFilter !== 'all' && targetQ.difficulty !== activeFilter) {
        setActiveFilter('all');
        setCurrentIndex(indexInAll);
      } else {
        const idxInFiltered = filteredQuestions.findIndex(
          (q) => q.id === targetQ.id
        );
        if (idxInFiltered !== -1) {
          setCurrentIndex(idxInFiltered);
        } else {
          setActiveFilter('all');
          setCurrentIndex(indexInAll);
        }
      }
      setViewMode('quiz');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [activeFilter, filteredQuestions]
  );

  const handleStartQuiz = useCallback(
    (startId?: number, difficulty?: OutputQuestionFilter) => {
      if (difficulty) {
        setActiveFilter(difficulty);
        const subset = allQuestions.filter((q) => q.difficulty === difficulty);
        const nextUnanswered = subset.find((q) => answers[q.id] === undefined);
        const targetQ = nextUnanswered || subset[0];
        const targetIdx = subset.findIndex((q) => q.id === targetQ.id);
        setCurrentIndex(targetIdx !== -1 ? targetIdx : 0);
      } else if (startId) {
        setActiveFilter('all');
        const foundIdx = allQuestions.findIndex((q) => q.id === startId);
        setCurrentIndex(foundIdx !== -1 ? foundIdx : 0);
      } else {
        setActiveFilter('all');
        setCurrentIndex(0);
      }
      setViewMode('quiz');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [answers]
  );

  const handleBackToOverview = useCallback(() => {
    setViewMode('welcome');
    setSearchParams({}, { replace: true });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [setSearchParams]);

  const handleResetProgress = useCallback(() => {
    setIsResetModalOpen(true);
  }, []);

  const handleConfirmReset = useCallback(() => {
    setAnswers({});
    setCurrentIndex(0);
    setActiveFilter('all');
    setViewMode('welcome');
    setSearchParams({}, { replace: true });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [setAnswers, setSearchParams]);

  // Keyboard shortcut listener (only active in quiz mode)
  useEffect(() => {
    if (viewMode !== 'quiz') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Avoid firing if inside an input or if any modal is open
      if (
        isPaletteOpen ||
        isResetModalOpen ||
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (['1', '2', '3', '4'].includes(e.key)) {
        handleAnswer(Number(e.key) - 1);
      } else if (['a', 'A'].includes(e.key)) {
        handleAnswer(0);
      } else if (['b', 'B'].includes(e.key)) {
        handleAnswer(1);
      } else if (['c', 'C'].includes(e.key)) {
        handleAnswer(2);
      } else if (['d', 'D'].includes(e.key)) {
        handleAnswer(3);
      } else if (e.key === 'q' || e.key === 'Q') {
        setIsPaletteOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    viewMode,
    handleNext,
    handlePrev,
    handleAnswer,
    isPaletteOpen,
    isResetModalOpen,
  ]);

  // Stats calculation
  const stats = useMemo(() => {
    const totalAnswered = Object.keys(answers).length;
    const totalCorrect = Object.entries(answers).filter(([idStr, idx]) => {
      const q = allQuestions.find((q) => q.id === Number(idStr));
      return q && q.correctIndex === idx;
    }).length;

    const byDifficulty = (d: OutputQuestionDifficulty) => {
      const qs = allQuestions.filter((q) => q.difficulty === d);
      const answered = qs.filter((q) => answers[q.id] !== undefined).length;
      const correct = qs.filter(
        (q) => answers[q.id] !== undefined && answers[q.id] === q.correctIndex
      ).length;
      return { total: qs.length, answered, correct };
    };

    return {
      total: allQuestions.length,
      totalAnswered,
      totalCorrect,
      easy: byDifficulty('easy'),
      medium: byDifficulty('medium'),
      hard: byDifficulty('hard'),
    };
  }, [answers]);

  const hasAnswered = currentQuestion
    ? answers[currentQuestion.id] !== undefined
    : false;
  const selectedOption = currentQuestion
    ? answers[currentQuestion.id]
    : undefined;
  const isCorrect =
    hasAnswered &&
    currentQuestion &&
    selectedOption === currentQuestion.correctIndex;
  const DifficultyIcon = currentQuestion
    ? DIFFICULTY_ICONS[currentQuestion.difficulty]
    : Target;

  // Find next unanswered question for the header resume CTA
  const nextUnansweredQ = allQuestions.find((q) => answers[q.id] === undefined);
  const nextResumeId = nextUnansweredQ ? nextUnansweredQ.id : 1;

  // SEO schema
  const faqSchema = useMemo(() => {
    const sample = allQuestions.slice(0, 10);
    return {
      '@context': 'https://schema.org' as const,
      '@type': 'FAQPage',
      mainEntity: sample.map((q) => ({
        '@type': 'Question',
        name: `${q.question} — ${q.topic}`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `${q.options[q.correctIndex]}. ${q.explanation}`,
        },
      })),
    };
  }, []);

  return (
    <div className="min-h-screen w-full flex flex-col bg-[var(--bg-app)] text-[var(--text-primary)] transition-colors duration-150">
      <SEO
        title="JavaScript Output Questions — Predict the Output Quiz | RunJS"
        description="Test your JavaScript prediction skills with 100 interview-style output questions. Full-screen practice mode covering closures, promises, prototypes, and async/await."
        canonical="/output-questions"
        keywords={[
          'JavaScript output questions',
          'predict the output JavaScript',
          'JavaScript MCQ quiz',
          'JavaScript interview questions',
          'frontend interview prep',
        ]}
        structuredData={[
          getBreadcrumbSchema([
            { name: 'Home', item: '/' },
            { name: 'Output Questions', item: '/output-questions' },
          ]),
          faqSchema,
        ]}
      />

      <Navbar />

      {/* Sticky Workspace Sub-Header */}
      <div className="sticky top-14 z-30 w-full border-b border-[var(--border-default)] bg-[var(--bg-surface)]/95 backdrop-blur-md transition-colors">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2 sm:py-2.5 flex items-center justify-between gap-2 sm:gap-3">
          {/* Left Area: Navigation & Switchers */}
          <div className="flex items-center gap-2 shrink-0">
            {viewMode === 'quiz' ? (
              /* In Quiz Mode: Clean Back to Overview button */
              <button
                type="button"
                onClick={handleBackToOverview}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] text-xs font-semibold text-[var(--text-primary)] shadow-2xs transition-colors cursor-pointer"
                title="Return to quiz overview"
              >
                <ChevronLeft className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span>Overview</span>
              </button>
            ) : (
              /* In Welcome Mode: Section Switcher Tabs */
              <div className="flex items-center gap-1 p-0.5 sm:p-1 rounded-xl bg-[var(--bg-surface-muted)] border border-[var(--border-default)]">
                <Link
                  to="/interview"
                  className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 rounded-lg text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                >
                  <FileQuestion className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                  <span className="hidden sm:inline">Technical</span> Q&A
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-neutral-500/10 text-[var(--text-muted)] font-bold border border-[var(--border-default)]">
                    Theory
                  </span>
                </Link>

                <button
                  type="button"
                  onClick={handleBackToOverview}
                  className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 rounded-lg text-xs font-semibold bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-xs border border-[var(--border-default)] cursor-pointer"
                >
                  <Brain className="w-3.5 h-3.5 text-amber-500" />
                  <span>Output Quiz</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold border border-amber-500/25 font-mono tabular-nums">
                    100
                  </span>
                </button>
              </div>
            )}

            {/* Desktop secondary breadcrumb when in Quiz Mode */}
            {viewMode === 'quiz' && (
              <div className="hidden md:flex items-center gap-2 text-xs font-medium text-[var(--text-muted)]">
                <span>/</span>
                <span className="text-[var(--text-primary)] font-semibold truncate max-w-[200px]">
                  {currentQuestion.topic}
                </span>
              </div>
            )}
          </div>

          {/* Right Area: Controls */}
          {viewMode === 'quiz' ? (
            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 justify-end">
              {/* Difficulty Filter Pills: Horizontally scrollable on mobile */}
              <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5 max-w-[175px] sm:max-w-none">
                {(
                  [
                    { label: 'All', value: 'all', count: 100 },
                    { label: 'Easy', value: 'easy', count: 35 },
                    { label: 'Medium', value: 'medium', count: 40 },
                    { label: 'Hard', value: 'hard', count: 25 },
                  ] as const
                ).map((f) => (
                  <button
                    key={f.value}
                    type="button"
                    onClick={() => {
                      setActiveFilter(f.value);
                      setCurrentIndex(0);
                    }}
                    className={`flex items-center gap-1 px-2 py-1 sm:px-2.5 sm:py-1 rounded-lg text-xs font-semibold capitalize transition-all shrink-0 cursor-pointer ${
                      activeFilter === f.value
                        ? 'bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 shadow-2xs'
                        : 'border border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    <span>{f.label}</span>
                    <span className="text-[10px] opacity-70 hidden sm:inline font-mono tabular-nums">
                      ({f.count})
                    </span>
                  </button>
                ))}
              </div>

              {/* Score Pill */}
              <div className="flex items-center gap-1 px-2 sm:px-3 py-1 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface-muted)] text-xs font-semibold shrink-0">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span className="font-mono tabular-nums">
                  {stats.totalCorrect}/{stats.totalAnswered}
                </span>
              </div>

              {/* Quick Question Palette Trigger (hidden on mobile, bottom bar already has #Q) */}
              <button
                type="button"
                onClick={() => setIsPaletteOpen(true)}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] hover:border-[var(--border-focus)] text-xs font-semibold text-[var(--text-primary)] shadow-xs transition-all cursor-pointer shrink-0"
                title="Open all 100 questions grid (Shortcut: Q)"
              >
                <LayoutGrid className="w-3.5 h-3.5 text-amber-500" />
                <span className="font-mono tabular-nums">
                  Q{currentQuestion.id} of {allQuestions.length}
                </span>
              </button>

              {/* Reset Progress */}
              {stats.totalAnswered > 0 && (
                <button
                  type="button"
                  onClick={handleResetProgress}
                  aria-label="Reset quiz progress"
                  title="Reset all answered questions"
                  className="p-1.5 rounded-lg border border-red-500/20 text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer shrink-0"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ) : (
            /* Welcome View Quick Action */
            <div className="flex items-center gap-2 shrink-0">
              {stats.totalAnswered > 0 ? (
                <button
                  type="button"
                  onClick={() => handleStartQuiz(nextResumeId)}
                  className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-black text-xs font-bold shadow-xs transition-all hover:scale-[1.02] cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-black" />
                  <span>Resume (Q#{nextResumeId})</span>
                  <ArrowRight className="w-3.5 h-3.5 hidden sm:inline" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleStartQuiz(1)}
                  className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-black text-xs font-bold shadow-xs transition-all hover:scale-[1.02] cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-black" />
                  <span>Start (Q#1)</span>
                  <ArrowRight className="w-3.5 h-3.5 hidden sm:inline" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main Viewport: Welcome Screen OR Single Question Full-Screen Arena */}
      {viewMode === 'welcome' ? (
        /* ── WELCOME COMPONENT (Start Quiz or Resume Quiz) ── */
        <main className="flex-1">
          <QuizWelcome
            totalQuestions={allQuestions.length}
            answers={answers}
            questions={allQuestions}
            onStartQuiz={handleStartQuiz}
            onResetProgress={handleResetProgress}
          />
        </main>
      ) : (
        /* ── SINGLE QUESTION FULL-SCREEN ARENA ── */
        <main className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-start">
            {/* ── LEFT PANE: Question Header, Prompt & Code Snippet ── */}
            <div className="lg:col-span-7 flex flex-col gap-3 sm:gap-4">
              {/* Question Card */}
              <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-4 sm:p-6 shadow-xs">
                {/* Question Metadata Header */}
                <div className="flex items-center justify-between gap-2 pb-3 sm:pb-4 border-b border-[var(--border-subtle)]">
                  <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-wrap">
                    {/* Question Number Badge */}
                    <span className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold text-xs border border-amber-500/20 shadow-2xs shrink-0 font-mono tabular-nums">
                      #{currentQuestion.id}
                    </span>

                    {/* Difficulty Badge */}
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md text-[11px] sm:text-xs font-semibold uppercase tracking-wider border shrink-0 ${DIFFICULTY_BADGES[currentQuestion.difficulty]}`}
                    >
                      <DifficultyIcon className="w-3 h-3" />
                      <span>{currentQuestion.difficulty}</span>
                    </span>

                    {/* Topic Chip */}
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md text-[11px] sm:text-xs font-medium text-[var(--text-secondary)] border border-[var(--border-default)] bg-[var(--bg-surface-muted)] truncate max-w-[140px] sm:max-w-xs">
                      <Hash className="w-3 h-3 text-amber-500 shrink-0" />
                      <span className="truncate">{currentQuestion.topic}</span>
                    </span>
                  </div>

                  {/* Question Status Badge */}
                  {hasAnswered ? (
                    <div
                      className={`inline-flex items-center gap-1 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md text-[11px] sm:text-xs font-bold shrink-0 ${
                        isCorrect
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                          : 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'
                      }`}
                    >
                      {isCorrect ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Solved</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Incorrect</span>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-1 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md text-[11px] sm:text-xs font-medium text-[var(--text-muted)] border border-[var(--border-default)] bg-[var(--bg-surface-muted)] shrink-0">
                      <HelpCircle className="w-3.5 h-3.5" />
                      <span>Unanswered</span>
                    </div>
                  )}
                </div>

                {/* Question Prompt */}
                <div className="mt-3 sm:mt-4">
                  <h1 className="text-base sm:text-lg font-bold text-[var(--text-primary)] tracking-tight leading-snug">
                    {currentQuestion.question}
                  </h1>
                </div>

                {/* Code Snippet */}
                <div className="mt-2.5 sm:mt-4">
                  <CodeSnippet
                    code={currentQuestion.code}
                    title="JavaScript"
                    height={`${Math.min(
                      Math.max(
                        currentQuestion.code.split('\n').length * 20 + 20,
                        56
                      ),
                      380
                    )}px`}
                    actionButton={
                      <Link
                        to="/js"
                        target="_blank"
                        rel="noreferrer noopener"
                        className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] hover:bg-[var(--bg-surface-hover)] text-amber-500 font-medium transition-colors"
                        title="Open in JavaScript playground"
                      >
                        <Code2 className="w-3 h-3" />
                        <span>Sandbox</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </Link>
                    }
                  />
                </div>

                {/* Helpful Pro Tip (hidden on mobile, visible on desktop so choices are directly in view on mobile) */}
                <div className="hidden lg:flex mt-3 items-start gap-2 text-xs text-[var(--text-muted)] bg-[var(--bg-surface-muted)] p-2.5 rounded-xl border border-[var(--border-subtle)]">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    <strong className="text-[var(--text-secondary)]">
                      Interview Tip:
                    </strong>{' '}
                    Pay close attention to closure captures, synchronous vs
                    microtask execution, and coercion semantics.
                  </p>
                </div>
              </div>
            </div>

            {/* ── RIGHT PANE: Choices, Feedback & Detailed Explanation ── */}
            <div className="lg:col-span-5 flex flex-col gap-3 sm:gap-4">
              {/* Choices Box */}
              <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-4 sm:p-6 shadow-xs">
                {/* Header & Shortcut hint */}
                <div className="flex items-center justify-between pb-2.5 sm:pb-3 border-b border-[var(--border-subtle)]">
                  <h2 className="text-xs sm:text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider">
                    Select Expected Output:
                  </h2>
                  <span className="hidden sm:inline-block text-[11px] text-[var(--text-muted)]">
                    Keys:{' '}
                    <kbd className="px-1 py-0.5 rounded border border-[var(--border-default)] bg-[var(--bg-surface-muted)] font-mono">
                      1-4
                    </kbd>{' '}
                    or{' '}
                    <kbd className="px-1 py-0.5 rounded border border-[var(--border-default)] bg-[var(--bg-surface-muted)] font-mono">
                      A-D
                    </kbd>
                  </span>
                </div>

                {/* 4 MCQ Option Buttons */}
                <div className="mt-3 sm:mt-4 space-y-2 sm:space-y-2.5">
                  {currentQuestion.options.map((opt, idx) => {
                    const isSelected = selectedOption === idx;
                    const isCorrectChoice =
                      idx === currentQuestion.correctIndex;

                    let optionClasses =
                      'border-[var(--border-default)] bg-[var(--bg-surface)] hover:border-[var(--border-focus)] hover:bg-[var(--bg-surface-hover)] text-[var(--text-primary)] cursor-pointer';

                    if (hasAnswered) {
                      if (isCorrectChoice) {
                        optionClasses =
                          'border-emerald-500/50 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold shadow-xs cursor-default';
                      } else if (isSelected && !isCorrectChoice) {
                        optionClasses =
                          'border-red-500/50 bg-red-500/10 text-red-600 dark:text-red-400 font-semibold shadow-xs cursor-default';
                      } else {
                        optionClasses =
                          'border-[var(--border-default)] bg-[var(--bg-surface)] opacity-40 cursor-default';
                      }
                    }

                    return (
                      <button
                        key={idx}
                        type="button"
                        disabled={hasAnswered}
                        onClick={() => handleAnswer(idx)}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all duration-150 group ${optionClasses}`}
                      >
                        {/* Option Key Badge (A, B, C, D) */}
                        <span
                          className={`flex items-center justify-center w-7 h-7 rounded-lg text-xs font-bold shrink-0 border transition-colors ${
                            hasAnswered && isCorrectChoice
                              ? 'bg-emerald-500 text-white border-emerald-500 shadow-xs'
                              : hasAnswered && isSelected && !isCorrectChoice
                                ? 'bg-red-500 text-white border-red-500 shadow-xs'
                                : 'bg-[var(--bg-surface-muted)] text-[var(--text-secondary)] border-[var(--border-default)] group-hover:border-amber-500/50 group-hover:text-amber-500'
                          }`}
                        >
                          {OPTION_KEYS[idx]}
                        </span>

                        {/* Code Output Text */}
                        <span className="font-mono text-xs sm:text-sm font-semibold flex-1 leading-snug break-all">
                          {opt}
                        </span>

                        {/* Right feedback icon */}
                        {hasAnswered && isCorrectChoice && (
                          <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                        )}
                        {hasAnswered && isSelected && !isCorrectChoice && (
                          <XCircle className="w-5 h-5 text-red-500 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Post-Answer Result & Detailed Explanation */}
                {hasAnswered && (
                  <div className="mt-5 space-y-3 animate-in fade-in-50 slide-in-from-top-2 duration-150">
                    {/* Status Banner */}
                    <div
                      className={`flex items-center gap-2 p-3 rounded-xl border text-xs sm:text-sm font-bold ${
                        isCorrect
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                          : 'bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400'
                      }`}
                    >
                      {isCorrect ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                          <span>Correct answer! Excellent analysis.</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-4 h-4 text-red-500 shrink-0" />
                          <span>
                            Incorrect. The correct output is Option{' '}
                            {OPTION_KEYS[currentQuestion.correctIndex]}.
                          </span>
                        </>
                      )}
                    </div>

                    {/* Explanation Block */}
                    <div className="p-4 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface-muted)]">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-amber-500 uppercase tracking-wider mb-2">
                        <Lightbulb className="w-4 h-4" />
                        <span>Explanation</span>
                      </div>
                      <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed font-normal">
                        {currentQuestion.explanation}
                      </p>
                    </div>
                  </div>
                )}

                {/* Navigation Controls (Prev / Next) - Desktop only (mobile has sticky bottom bar) */}
                <div className="hidden sm:flex mt-6 pt-4 border-t border-[var(--border-subtle)] items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={handlePrev}
                    disabled={currentIndex === 0}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                      currentIndex === 0
                        ? 'border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-muted)] opacity-40 cursor-not-allowed'
                        : 'border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]'
                    }`}
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Previous</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsPaletteOpen(true)}
                    className="px-2.5 py-2 rounded-xl text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                    title="Open question navigator grid"
                  >
                    <span className="font-semibold text-[var(--text-primary)]">
                      {currentIndex + 1}
                    </span>{' '}
                    / {filteredQuestions.length}
                  </button>

                  <button
                    type="button"
                    onClick={handleNext}
                    disabled={currentIndex === filteredQuestions.length - 1}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      currentIndex === filteredQuestions.length - 1
                        ? 'border border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-muted)] opacity-40 cursor-not-allowed'
                        : hasAnswered
                          ? 'bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-black shadow-xs hover:scale-[1.02]'
                          : 'border border-[var(--border-default)] bg-[var(--bg-surface-active)] text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]'
                    }`}
                  >
                    <span>Next</span>
                    {hasAnswered ? (
                      <ArrowRight className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      )}

      {/* Question Palette Drawer Modal */}
      <QuestionPaletteModal
        isOpen={isPaletteOpen}
        onClose={() => setIsPaletteOpen(false)}
        questions={allQuestions}
        currentIndex={allQuestions.findIndex(
          (q) => q.id === currentQuestion.id
        )}
        onSelectQuestion={handleJumpToQuestion}
        answers={answers}
        activeDifficultyFilter={activeFilter}
        onFilterChange={(f) => {
          setActiveFilter(f);
          setCurrentIndex(0);
        }}
      />

      {/* Custom Reset Progress Confirmation Modal */}
      <ResetQuizModal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        onConfirm={handleConfirmReset}
        totalAnswered={stats.totalAnswered}
      />

      {/* Sticky Bottom Navigation Bar for Mobile (only shown in quiz mode) */}
      {viewMode === 'quiz' && (
        <div className="sm:hidden sticky bottom-0 z-20 w-full border-t border-[var(--border-default)] bg-[var(--bg-surface)]/95 backdrop-blur-md px-3 py-2 flex items-center justify-between gap-2 shadow-lg">
          <button
            type="button"
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className={`flex items-center gap-1 px-3 py-2 rounded-lg border text-xs font-semibold ${
              currentIndex === 0
                ? 'border-[var(--border-default)] text-[var(--text-muted)] opacity-40'
                : 'border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-primary)]'
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Prev</span>
          </button>

          <button
            type="button"
            onClick={() => setIsPaletteOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[var(--bg-surface-muted)] border border-[var(--border-default)] text-xs font-bold text-[var(--text-primary)]"
          >
            <LayoutGrid className="w-3.5 h-3.5 text-amber-500" />
            <span>#{currentQuestion.id} / 100</span>
          </button>

          <button
            type="button"
            onClick={handleNext}
            disabled={currentIndex === filteredQuestions.length - 1}
            className={`flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-bold ${
              hasAnswered
                ? 'bg-amber-500 text-black shadow-xs'
                : 'border border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-primary)]'
            }`}
          >
            <span>Next</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      <Footer />
    </div>
  );
}
