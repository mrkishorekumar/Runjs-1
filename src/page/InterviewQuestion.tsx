import { useState, useMemo, useCallback, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import SEO from '../seo/SEO';
import { getBreadcrumbSchema } from '../seo/seoConfig';
import QuestionAccordion from '../components/QuestionAccordion';
import CodeSnippet from '../components/CodeSnippet';
import useLocalStorageState from '../hook/useLocalStorageState';
import InterViewQuestion from '../asset/interview_questions.json';
import type {
  JSInterviewQuestion,
  JSInterviewQuestionList,
  InterviewMasteryMap,
  InterviewBookmarkMap,
} from '../utils/interface';
import InterviewWelcome from '../components/interview/InterviewWelcome';
import InterviewNavigatorModal from '../components/interview/InterviewNavigatorModal';
import ResetInterviewModal from '../components/interview/ResetInterviewModal';
import {
  Search,
  Sparkles,
  X,
  Brain,
  FileQuestion,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Bookmark,
  Lightbulb,
  ArrowRight,
  Code2,
  ExternalLink,
  Shuffle,
  Eye,
  EyeOff,
  ListFilter,
  Play,
  Check,
  BookOpen,
} from 'lucide-react';

const allQuestions = InterViewQuestion as JSInterviewQuestionList;

const DIFFICULTY_CLASSES = {
  easy: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  medium:
    'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  hard: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
};

type ViewMode = 'welcome' | 'practice' | 'list';

export default function InterviewQuestion() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Mode state: 'welcome' | 'practice' | 'list'
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    if (searchParams.get('mode') === 'list') return 'list';
    if (searchParams.has('q') || searchParams.get('mode') === 'practice') {
      return 'practice';
    }
    return 'welcome';
  });

  // Filters
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [activeDifficulty, setActiveDifficulty] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isNavigatorOpen, setIsNavigatorOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  // Practice state
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // List mode: Active accordion
  const [activeAccordion, setActiveAccordion] = useLocalStorageState(
    'activeInterviewAccordion',
    '-1'
  );

  // Stored mastery ratings & bookmarks
  const [mastery, setMastery] = useLocalStorageState<InterviewMasteryMap>(
    'interviewMastery',
    {}
  );
  const [bookmarks, setBookmarks] = useLocalStorageState<InterviewBookmarkMap>(
    'interviewBookmarks',
    {}
  );

  // Categories list
  const categories = useMemo(() => {
    const set = new Set<string>();
    allQuestions.forEach((q) => {
      if (q.category) set.add(q.category);
    });
    return ['All', ...Array.from(set)];
  }, []);

  // Filter questions for practice and list modes
  const filteredQuestions = useMemo(() => {
    return allQuestions.filter((q) => {
      // Category filter
      if (activeCategory !== 'All' && q.category !== activeCategory) {
        return false;
      }
      // Difficulty filter
      if (activeDifficulty !== 'all' && q.difficulty !== activeDifficulty) {
        return false;
      }
      // Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesQ = q.question.toLowerCase().includes(query);
        const matchesAns = q.answer.some((a) =>
          a.data.some((d) => d.toLowerCase().includes(query))
        );
        const matchesTag = q.tags?.some((t) => t.toLowerCase().includes(query));
        if (!matchesQ && !matchesAns && !matchesTag) return false;
      }
      return true;
    });
  }, [activeCategory, activeDifficulty, searchQuery]);

  // Current question index for Practice Arena
  const initialQId = Number(searchParams.get('q'));
  const [currentIndex, setCurrentIndex] = useState(() => {
    if (initialQId && initialQId >= 1 && initialQId <= allQuestions.length) {
      const foundIdx = allQuestions.findIndex((q) => q.id === initialQId);
      if (foundIdx !== -1) return foundIdx;
    }
    return 0;
  });

  // Keep index within bounds if filteredQuestions changes
  useEffect(() => {
    if (
      currentIndex >= filteredQuestions.length &&
      filteredQuestions.length > 0
    ) {
      setCurrentIndex(0);
    }
  }, [filteredQuestions.length, currentIndex]);

  const currentQuestion: JSInterviewQuestion =
    filteredQuestions[currentIndex] || filteredQuestions[0] || allQuestions[0];
  const currentQId = currentQuestion
    ? (currentQuestion.id ?? currentIndex + 1)
    : 1;

  // Reset answer revealed state when moving to a new question
  useEffect(() => {
    setIsAnswerRevealed(false);
  }, [currentQId]);

  // Sync URL search params
  useEffect(() => {
    if (viewMode === 'practice' && currentQuestion) {
      setSearchParams(
        { q: currentQId.toString(), mode: 'practice' },
        { replace: true }
      );
    } else if (viewMode === 'list') {
      setSearchParams({ mode: 'list' }, { replace: true });
    }
  }, [viewMode, currentQId, setSearchParams]);

  // Mastery handlers
  const handleSetMastery = useCallback(
    (status: 'mastered' | 'review') => {
      const currentStatus = mastery[currentQId];
      const next = { ...mastery };
      if (currentStatus === status) {
        delete next[currentQId];
      } else {
        next[currentQId] = status;
      }
      setMastery(next);
    },
    [currentQId, mastery, setMastery]
  );

  const handleToggleBookmark = useCallback(
    (idToToggle?: number) => {
      const targetId = idToToggle ?? currentQId;
      const next = { ...bookmarks };
      if (next[targetId]) {
        delete next[targetId];
      } else {
        next[targetId] = true;
      }
      setBookmarks(next);
    },
    [currentQId, bookmarks, setBookmarks]
  );

  const handleToggleMasteredForId = useCallback(
    (targetId: number) => {
      const currentStatus = mastery[targetId];
      const next = { ...mastery };
      if (currentStatus === 'mastered') {
        delete next[targetId];
      } else {
        next[targetId] = 'mastered';
      }
      setMastery(next);
    },
    [mastery, setMastery]
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

  const handleRandomQuestion = useCallback(() => {
    if (filteredQuestions.length <= 1) return;
    let nextIdx = Math.floor(Math.random() * filteredQuestions.length);
    if (nextIdx === currentIndex) {
      nextIdx = (nextIdx + 1) % filteredQuestions.length;
    }
    setCurrentIndex(nextIdx);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentIndex, filteredQuestions.length]);

  const handleJumpToQuestion = useCallback(
    (indexInAll: number) => {
      const targetQ = allQuestions[indexInAll];
      if (!targetQ) return;

      const needsFilterReset =
        (activeCategory !== 'All' && targetQ.category !== activeCategory) ||
        (activeDifficulty !== 'all' &&
          targetQ.difficulty !== activeDifficulty) ||
        searchQuery.trim() !== '';

      if (needsFilterReset) {
        setActiveCategory('All');
        setActiveDifficulty('all');
        setSearchQuery('');
        setCurrentIndex(indexInAll);
      } else {
        const idxInFiltered = filteredQuestions.findIndex(
          (q) =>
            (q.id ?? allQuestions.indexOf(q) + 1) ===
            (targetQ.id ?? indexInAll + 1)
        );
        if (idxInFiltered !== -1) {
          setCurrentIndex(idxInFiltered);
        } else {
          setActiveCategory('All');
          setActiveDifficulty('all');
          setSearchQuery('');
          setCurrentIndex(indexInAll);
        }
      }
      setViewMode('practice');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [activeCategory, activeDifficulty, searchQuery, filteredQuestions]
  );

  const handleStartPractice = useCallback(
    (startId?: number, category?: string) => {
      setSearchQuery('');
      setActiveDifficulty('all');

      if (category && category !== 'All') {
        setActiveCategory(category);
        const subset = allQuestions.filter((q) => q.category === category);
        const targetQ = startId
          ? subset.find((q) => q.id === startId)
          : subset.find((q) => mastery[q.id ?? 0] === undefined) || subset[0];
        const targetIdx = subset.findIndex(
          (q) => (q.id ?? 1) === (targetQ ? targetQ.id : startId)
        );
        setCurrentIndex(targetIdx !== -1 ? targetIdx : 0);
      } else if (startId) {
        setActiveCategory('All');
        const foundIdx = allQuestions.findIndex((q) => q.id === startId);
        setCurrentIndex(foundIdx !== -1 ? foundIdx : 0);
      } else {
        setActiveCategory('All');
        setCurrentIndex(0);
      }
      setViewMode('practice');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [mastery]
  );

  const handleOpenListMode = useCallback(() => {
    setViewMode('list');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleBackToOverview = useCallback(() => {
    setViewMode('welcome');
    setSearchParams({}, { replace: true });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [setSearchParams]);

  const handleConfirmReset = useCallback(() => {
    setMastery({});
    setBookmarks({});
    setCurrentIndex(0);
    setActiveCategory('All');
    setActiveDifficulty('all');
    setViewMode('welcome');
    setSearchParams({}, { replace: true });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [setMastery, setBookmarks, setSearchParams]);

  // Copy current question & answer
  const handleCopyCurrent = useCallback(async () => {
    if (!currentQuestion) return;
    try {
      const fullText = `${currentQuestion.question}\n\n${currentQuestion.answer
        .map((a) => a.data.join('\n'))
        .join('\n\n')}`;
      await navigator.clipboard.writeText(fullText);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  }, [currentQuestion]);

  // Keyboard shortcut listener (only active in practice arena)
  useEffect(() => {
    if (viewMode !== 'practice') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        isNavigatorOpen ||
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
      } else if (e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();
        setIsAnswerRevealed((prev) => !prev);
      } else if (e.key === '1') {
        handleSetMastery('mastered');
      } else if (e.key === '2') {
        handleSetMastery('review');
      } else if (e.key === 'b' || e.key === 'B') {
        handleToggleBookmark();
      } else if (e.key === 'r' || e.key === 'R') {
        handleRandomQuestion();
      } else if (e.key === 'q' || e.key === 'Q') {
        setIsNavigatorOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    viewMode,
    isNavigatorOpen,
    isResetModalOpen,
    handleNext,
    handlePrev,
    handleSetMastery,
    handleToggleBookmark,
    handleRandomQuestion,
  ]);

  // Stats calculation
  const stats = useMemo(() => {
    const totalMastered = Object.values(mastery).filter(
      (s) => s === 'mastered'
    ).length;
    const totalReview = Object.values(mastery).filter(
      (s) => s === 'review'
    ).length;
    const totalTracked = totalMastered + totalReview;
    return {
      total: allQuestions.length,
      totalMastered,
      totalReview,
      totalTracked,
    };
  }, [mastery]);

  const currentStatus = mastery[currentQId];
  const isBookmarked = !!bookmarks[currentQId];

  // Code snippets inside current question
  const codeBlocks = useMemo(() => {
    return currentQuestion
      ? currentQuestion.answer.filter((b) => b.type === 'code')
      : [];
  }, [currentQuestion]);

  const hasCode = codeBlocks.length > 0;

  // Sandbox URL based on category
  const sandboxUrl = useMemo(() => {
    if (currentQuestion?.category === 'React') return '/react';
    if (currentQuestion?.category === 'TypeScript') return '/ts';
    return '/js';
  }, [currentQuestion]);

  // SEO Schema
  const faqSchema = useMemo(() => {
    const sample = allQuestions.slice(0, 15);
    return {
      '@context': 'https://schema.org' as const,
      '@type': 'FAQPage',
      mainEntity: sample.map((q) => ({
        '@type': 'Question',
        name: q.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: q.answer
            .map((ans) => ans.data.join(' '))
            .join(' ')
            .slice(0, 300),
        },
      })),
    };
  }, []);

  return (
    <div className="min-h-screen w-full flex flex-col justify-between bg-[var(--bg-app)] text-[var(--text-primary)] transition-colors duration-150">
      <SEO
        title="JavaScript Technical Interview Questions & Answers | RunJS"
        description="Master JavaScript, React, TypeScript, Node.js, and frontend architecture interviews with interactive practice, active recall, code sandboxes, and detailed solutions."
        canonical="/interview"
        keywords={[
          'JavaScript interview questions',
          'React interview questions',
          'frontend interview questions',
          'JavaScript event loop',
          'closures interview questions',
          'technical interview prep',
          'React re-renders optimization',
        ]}
        structuredData={[
          getBreadcrumbSchema([
            { name: 'Home', item: '/' },
            { name: 'Interview Questions', item: '/interview' },
          ]),
          faqSchema,
        ]}
      />

      <Navbar />

      {/* Sticky Workspace Sub-Header */}
      <div className="sticky top-14 z-30 w-full border-b border-[var(--border-default)] bg-[var(--bg-surface)]/95 backdrop-blur-md transition-colors">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2 sm:py-2.5 flex items-center justify-between gap-2 sm:gap-3">
          {/* Left Area: Navigation & Section Switchers */}
          <div className="flex items-center gap-2 shrink-0">
            {viewMode !== 'welcome' ? (
              /* In Practice or List Mode: Return to Overview Button */
              <button
                type="button"
                onClick={handleBackToOverview}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] text-xs font-semibold text-[var(--text-primary)] shadow-2xs transition-colors cursor-pointer"
                title="Return to interview overview"
              >
                <ChevronLeft className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span>Overview</span>
              </button>
            ) : (
              /* In Welcome Mode: Section Switcher Tabs */
              <div className="flex items-center gap-1 p-0.5 sm:p-1 rounded-xl bg-[var(--bg-surface-muted)] border border-[var(--border-default)]">
                <button
                  type="button"
                  onClick={handleBackToOverview}
                  className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 rounded-lg text-xs font-semibold bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-xs border border-[var(--border-default)] cursor-pointer"
                >
                  <FileQuestion className="w-3.5 h-3.5 text-amber-500" />
                  <span className="hidden sm:inline">Technical</span> Q&A
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold border border-amber-500/20 font-mono tabular-nums">
                    {allQuestions.length}
                  </span>
                </button>

                <Link
                  to="/output-questions"
                  className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 rounded-lg text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                >
                  <Brain className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                  <span>Output Quiz</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/20 font-mono tabular-nums">
                    100
                  </span>
                </Link>
              </div>
            )}

            {/* Mode Switcher (Practice Arena vs List View) */}
            {viewMode !== 'welcome' && (
              <div className="flex items-center gap-1 p-0.5 rounded-xl bg-[var(--bg-surface-muted)] border border-[var(--border-default)]">
                <button
                  type="button"
                  onClick={() => setViewMode('practice')}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    viewMode === 'practice'
                      ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-xs border border-[var(--border-default)]'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                  }`}
                  title="Interactive Practice Arena"
                >
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  <span className="hidden sm:inline">Practice Arena</span>
                  <span className="sm:hidden">Arena</span>
                </button>

                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    viewMode === 'list'
                      ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-xs border border-[var(--border-default)]'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                  }`}
                  title="All Questions Study Guide"
                >
                  <ListFilter className="w-3 h-3 text-amber-500" />
                  <span className="hidden sm:inline">Study Guide</span>
                  <span className="sm:hidden">List</span>
                </button>
              </div>
            )}
          </div>

          {/* Right Area: Filters, Progress & Actions */}
          {viewMode !== 'welcome' ? (
            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 justify-end">
              {/* Category Filter Pills (Practice mode - Desktop) */}
              <div className="hidden sm:flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => {
                      setActiveCategory(cat);
                      setCurrentIndex(0);
                    }}
                    className={`px-2 py-1 rounded-lg text-xs font-semibold capitalize transition-all shrink-0 cursor-pointer ${
                      activeCategory === cat
                        ? 'bg-amber-500/15 border border-amber-500/40 text-amber-600 dark:text-amber-400 shadow-2xs'
                        : 'border border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Live Mastery Pill */}
              <div
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface-muted)] text-xs font-semibold shrink-0"
                title={`${stats.totalMastered} questions mastered`}
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span className="font-mono tabular-nums">
                  {stats.totalMastered}/{allQuestions.length}
                </span>
              </div>

              {/* Question Navigator Trigger */}
              <button
                type="button"
                onClick={() => setIsNavigatorOpen(true)}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] hover:border-[var(--border-focus)] text-xs font-semibold text-[var(--text-primary)] shadow-xs transition-all cursor-pointer shrink-0"
                title="Open question navigator grid (Shortcut: Q)"
              >
                <LayoutGrid className="w-3.5 h-3.5 text-amber-500" />
                <span className="font-mono tabular-nums">
                  Q{currentQId} of {allQuestions.length}
                </span>
              </button>

              {/* Reset Progress Button */}
              {stats.totalTracked > 0 && (
                <button
                  type="button"
                  onClick={() => setIsResetModalOpen(true)}
                  aria-label="Reset interview progress"
                  title="Reset all tracked interview progress"
                  className="p-1.5 rounded-lg border border-red-500/20 text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer shrink-0"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ) : (
            /* Welcome View Quick Action */
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => handleStartPractice(1)}
                className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-black text-xs font-bold shadow-xs transition-all hover:scale-[1.02] cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-black" />
                <span>Start Practice</span>
                <ArrowRight className="w-3.5 h-3.5 hidden sm:inline" />
              </button>
            </div>
          )}
        </div>

        {/* Mobile Horizontal Category Filter Strip (Practice mode on mobile) */}
        {viewMode === 'practice' && (
          <div className="sm:hidden w-full px-3 pb-2 pt-1 flex items-center gap-1.5 overflow-x-auto no-scrollbar border-t border-[var(--border-subtle)]/60">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => {
                  setActiveCategory(cat);
                  setCurrentIndex(0);
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold capitalize transition-all shrink-0 cursor-pointer ${
                  activeCategory === cat
                    ? 'bg-amber-500/15 border border-amber-500/40 text-amber-600 dark:text-amber-400 shadow-2xs'
                    : 'border border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Main Viewport: Welcome Screen OR Interactive Arena OR List View */}
      {viewMode === 'welcome' ? (
        /* ── 1. WELCOME / DASHBOARD MODE ── */
        <main className="flex-1">
          <InterviewWelcome
            totalQuestions={allQuestions.length}
            questions={allQuestions}
            mastery={mastery}
            bookmarks={bookmarks}
            onStartPractice={handleStartPractice}
            onOpenListMode={handleOpenListMode}
            onResetProgress={() => setIsResetModalOpen(true)}
          />
        </main>
      ) : viewMode === 'practice' ? (
        /* ── 2. INTERACTIVE PRACTICE ARENA MODE (Single Question) ── */
        <main className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-start">
            {/* ── LEFT PANE: Question Header, Prompt & Code / Tips ── */}
            <div className="lg:col-span-6 flex flex-col gap-3 sm:gap-4">
              <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-5 sm:p-6 shadow-xs space-y-4">
                {/* Header Badges */}
                <div className="flex items-center justify-between gap-2 pb-3 border-b border-[var(--border-subtle)]">
                  <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-wrap">
                    {/* Question ID Badge */}
                    <span className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold text-xs border border-amber-500/20 shadow-2xs shrink-0 font-mono tabular-nums">
                      #{currentQId}
                    </span>

                    {/* Category Chip */}
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] sm:text-xs font-semibold border border-[var(--border-default)] bg-[var(--bg-surface-muted)] text-[var(--text-secondary)]">
                      <span>{currentQuestion.category || 'JavaScript'}</span>
                    </span>

                    {/* Difficulty Badge */}
                    {currentQuestion.difficulty && (
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] sm:text-xs font-semibold uppercase tracking-wider border ${
                          DIFFICULTY_CLASSES[currentQuestion.difficulty]
                        }`}
                      >
                        {currentQuestion.difficulty}
                      </span>
                    )}
                  </div>

                  {/* Bookmark & Mastery Status */}
                  <div className="flex items-center gap-1.5">
                    {/* Mastery pill */}
                    {currentStatus === 'mastered' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Mastered</span>
                      </span>
                    ) : currentStatus === 'review' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Review</span>
                      </span>
                    ) : null}

                    {/* Bookmark star */}
                    <button
                      type="button"
                      onClick={() => handleToggleBookmark()}
                      title={
                        isBookmarked
                          ? 'Remove bookmark'
                          : 'Bookmark question (Key: B)'
                      }
                      className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                        isBookmarked
                          ? 'border-amber-500 bg-amber-500/10 text-amber-500'
                          : 'border-[var(--border-default)] text-[var(--text-muted)] hover:text-amber-500 hover:border-amber-500/50'
                      }`}
                    >
                      <Bookmark
                        className={`w-4 h-4 ${isBookmarked ? 'fill-amber-500' : ''}`}
                      />
                    </button>
                  </div>
                </div>

                {/* Question Title */}
                <div>
                  <h1 className="text-base sm:text-xl font-bold text-[var(--text-primary)] tracking-tight leading-snug">
                    {currentQuestion.question}
                  </h1>
                </div>

                {/* Active Recall Challenge Card */}
                <div className="p-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface-muted)] space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div className="flex items-center gap-2 text-xs font-bold text-amber-500 uppercase tracking-wider">
                      <Brain className="w-4 h-4 shrink-0" />
                      <span>Active Recall Challenge</span>
                    </div>

                    {/* Reveal Button */}
                    <button
                      type="button"
                      onClick={() => setIsAnswerRevealed((prev) => !prev)}
                      className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-black text-xs font-bold shadow-2xs transition-all cursor-pointer shrink-0"
                    >
                      {isAnswerRevealed ? (
                        <>
                          <EyeOff className="w-3.5 h-3.5" />
                          <span>Hide Solution</span>
                        </>
                      ) : (
                        <>
                          <Eye className="w-3.5 h-3.5" />
                          <span>Reveal Solution</span>
                        </>
                      )}
                    </button>
                  </div>

                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                    Formulate how you would answer this question in a technical
                    interview or whiteboard session. Focus on core concepts,
                    trade-offs, and real-world edge cases.
                  </p>
                </div>

                {/* Interview Tip */}
                {currentQuestion.tip && (
                  <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 text-xs text-[var(--text-secondary)]">
                    <Sparkles className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <p className="leading-relaxed">
                      <strong className="text-[var(--text-primary)]">
                        Interviewer Tip:
                      </strong>{' '}
                      {currentQuestion.tip}
                    </p>
                  </div>
                )}

                {/* Tags */}
                {currentQuestion.tags && currentQuestion.tags.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap pt-1">
                    {currentQuestion.tags.map((t) => (
                      <span
                        key={t}
                        className="text-[11px] px-2 py-0.5 rounded-md bg-[var(--bg-surface-muted)] text-[var(--text-secondary)] border border-[var(--border-subtle)]"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* ── RIGHT PANE: Solution Reveal & Self-Assessment ── */}
            <div className="lg:col-span-6 flex flex-col gap-3 sm:gap-4">
              <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-5 sm:p-6 shadow-xs flex flex-col justify-between min-h-[420px]">
                {/* Right Header: Actions & Shortcuts */}
                <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
                  <div className="flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-amber-500" />
                    <h2 className="text-xs sm:text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider">
                      Structured Solution
                    </h2>
                  </div>

                  <div className="flex items-center gap-2">
                    {hasCode && (
                      <Link
                        to={sandboxUrl}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface-muted)] hover:bg-[var(--bg-surface-hover)] text-[11px] text-amber-500 font-semibold transition-colors"
                        title="Open in RunJS playground sandbox"
                      >
                        <Code2 className="w-3 h-3" />
                        <span>Sandbox</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </Link>
                    )}

                    <button
                      type="button"
                      onClick={handleCopyCurrent}
                      className="p-1.5 rounded-lg border border-[var(--border-default)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                      title="Copy question and structured answer"
                    >
                      {isCopied ? (
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <BookOpen className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Answer Container: Either Blur/Prompt OR Full Reveal */}
                <div className="flex-1 py-4">
                  {!isAnswerRevealed ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-6 sm:p-10 border border-dashed border-[var(--border-default)] rounded-xl bg-[var(--bg-surface-muted)]/50 space-y-3">
                      <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
                        <Brain className="w-6 h-6" />
                      </div>

                      <h3 className="text-sm sm:text-base font-bold text-[var(--text-primary)]">
                        Solution is Hidden
                      </h3>

                      <p className="text-xs text-[var(--text-secondary)] max-w-sm leading-relaxed">
                        Spend 30 seconds thinking about how you would structure
                        your answer before revealing the complete explanation.
                      </p>

                      <button
                        type="button"
                        onClick={() => setIsAnswerRevealed(true)}
                        className="mt-2 flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-black text-xs font-bold shadow-xs transition-transform hover:scale-[1.02] cursor-pointer"
                      >
                        <Eye className="w-4 h-4" />
                        <span className="hidden sm:inline">
                          Reveal Answer (Press Space)
                        </span>
                        <span className="sm:hidden">Reveal Answer</span>
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4 animate-in fade-in-50 duration-150">
                      {currentQuestion.answer.map((block, idx) => (
                        <div key={idx}>
                          {block.type === 'para' && (
                            <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
                              {block.data.join(' ')}
                            </p>
                          )}
                          {block.type === 'heading' && (
                            <h3 className="font-bold text-sm text-[var(--text-primary)] mt-3 mb-1.5">
                              {block.data.join(' ')}
                            </h3>
                          )}
                          {block.type === 'points' && (
                            <ul className="list-disc list-inside space-y-1.5 pl-2 my-2 text-xs sm:text-sm text-[var(--text-secondary)]">
                              {block.data.map((point, j) => (
                                <li key={j} className="leading-relaxed">
                                  {point}
                                </li>
                              ))}
                            </ul>
                          )}
                          {block.type === 'code' && (
                            <div className="my-2.5">
                              <CodeSnippet
                                code={block.data.join('\n')}
                                height={`${Math.min(
                                  Math.max(block.data.length * 20 + 20, 60),
                                  360
                                )}px`}
                              />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Self-Assessment Mastery Rating Controls */}
                <div className="pt-4 border-t border-[var(--border-subtle)] space-y-3">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <span className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                      Self Assessment:
                    </span>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <button
                        type="button"
                        onClick={() => handleSetMastery('mastered')}
                        className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                          currentStatus === 'mastered'
                            ? 'bg-emerald-500 border-emerald-500 text-white shadow-xs'
                            : 'border-[var(--border-default)] bg-[var(--bg-surface)] text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10'
                        }`}
                        title="Shortcut: 1"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>I Know This</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSetMastery('review')}
                        className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                          currentStatus === 'review'
                            ? 'bg-amber-500 border-amber-500 text-black shadow-xs'
                            : 'border-[var(--border-default)] bg-[var(--bg-surface)] text-amber-600 dark:text-amber-400 hover:bg-amber-500/10'
                        }`}
                        title="Shortcut: 2"
                      >
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>Need Review</span>
                      </button>
                    </div>
                  </div>

                  {/* Navigation Controls (Desktop & Tablet) */}
                  <div className="hidden sm:flex items-center justify-between pt-2">
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
                      <ChevronLeft className="w-4 h-4 shrink-0" />
                      <span>Previous</span>
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={handleRandomQuestion}
                        className="p-2 rounded-xl border border-[var(--border-default)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors cursor-pointer"
                        title="Random question (Key: R)"
                      >
                        <Shuffle className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => setIsNavigatorOpen(true)}
                        className="px-3 py-2 rounded-xl text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                        title="Open question navigator (Key: Q)"
                      >
                        <span className="font-bold text-[var(--text-primary)]">
                          {currentIndex + 1}
                        </span>{' '}
                        / {filteredQuestions.length}
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={handleNext}
                      disabled={currentIndex === filteredQuestions.length - 1}
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        currentIndex === filteredQuestions.length - 1
                          ? 'border border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-muted)] opacity-40 cursor-not-allowed'
                          : 'bg-amber-500 hover:bg-amber-600 text-black shadow-xs hover:scale-[1.02]'
                      }`}
                    >
                      <span>Next</span>
                      <ArrowRight className="w-4 h-4 shrink-0" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      ) : (
        /* ── 3. STUDY GUIDE (ACCORDION LIST VIEW) ── */
        <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header Controls */}
          <div className="pb-6 border-b border-[var(--border-default)] space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
                  Complete Technical Interview Guide
                </h1>
                <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1">
                  Browse, search, and study all {allQuestions.length} interview
                  questions with explanations and code.
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleStartPractice(1)}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-black text-xs font-bold shadow-2xs transition-colors cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Practice Mode</span>
              </button>
            </div>

            {/* Search & Filter Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
              <div className="relative flex-1 max-w-md">
                <label htmlFor="list-search-input" className="sr-only">
                  Search questions
                </label>
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                <input
                  id="list-search-input"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter by keyword (e.g. closure, fiber, jwt)..."
                  className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-1 focus:ring-amber-500/50"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Category pills */}
              <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setActiveCategory(cat)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold capitalize transition-all shrink-0 cursor-pointer ${
                      activeCategory === cat
                        ? 'bg-amber-500/15 border border-amber-500/40 text-amber-600 dark:text-amber-400 font-bold shadow-2xs'
                        : 'border border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Stats summary */}
            <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
              <span>
                Showing{' '}
                <strong className="text-[var(--text-primary)]">
                  {filteredQuestions.length}
                </strong>{' '}
                of {allQuestions.length} questions
              </span>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setActiveAccordion('-1')}
                  className="hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                >
                  Collapse All
                </button>
              </div>
            </div>
          </div>

          {/* Accordion List */}
          <section className="my-6">
            {filteredQuestions.length > 0 ? (
              filteredQuestions.map((val) => {
                const originalIndex = allQuestions.indexOf(val);
                const qId = val.id ?? originalIndex + 1;
                const isOpened = Number(activeAccordion) === originalIndex;

                return (
                  <QuestionAccordion
                    key={qId}
                    data={val}
                    questionNumber={originalIndex}
                    isOpened={isOpened}
                    changeActiveQuestion={() => {
                      setActiveAccordion(
                        isOpened ? '-1' : originalIndex.toString()
                      );
                    }}
                    isMastered={mastery[qId] === 'mastered'}
                    isBookmarked={!!bookmarks[qId]}
                    onToggleMastered={() => handleToggleMasteredForId(qId)}
                    onToggleBookmark={() => handleToggleBookmark(qId)}
                    onPractice={() => handleJumpToQuestion(originalIndex)}
                  />
                );
              })
            ) : (
              <div className="p-12 text-center rounded-2xl border border-dashed border-[var(--border-default)] bg-[var(--bg-surface)] my-6">
                <p className="text-sm text-[var(--text-secondary)]">
                  No interview questions found matching "{searchQuery}".
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setActiveCategory('All');
                    setActiveDifficulty('all');
                  }}
                  className="mt-3 px-3 py-1.5 rounded-lg bg-amber-500 text-black text-xs font-semibold hover:bg-amber-600 transition-colors cursor-pointer"
                >
                  Reset Filters
                </button>
              </div>
            )}
          </section>
        </main>
      )}

      {/* Question Palette Modal */}
      <InterviewNavigatorModal
        isOpen={isNavigatorOpen}
        onClose={() => setIsNavigatorOpen(false)}
        questions={allQuestions}
        currentIndex={allQuestions.findIndex((q) => (q.id ?? 1) === currentQId)}
        onSelectQuestion={handleJumpToQuestion}
        mastery={mastery}
        bookmarks={bookmarks}
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
      />

      {/* Reset Progress Modal */}
      <ResetInterviewModal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        onConfirm={handleConfirmReset}
        totalTracked={stats.totalTracked}
      />

      {/* Sticky Bottom Navigation Bar for Mobile (in practice mode) */}
      {viewMode === 'practice' && (
        <div className="sm:hidden sticky bottom-0 z-20 w-full border-t border-[var(--border-default)] bg-[var(--bg-surface)]/95 backdrop-blur-md px-3 py-2 flex items-center justify-between gap-2 shadow-lg">
          <button
            type="button"
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg border text-xs font-semibold ${
              currentIndex === 0
                ? 'border-[var(--border-default)] text-[var(--text-muted)] opacity-40 cursor-not-allowed'
                : 'border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-primary)] active:bg-[var(--bg-surface-hover)]'
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Prev</span>
          </button>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleRandomQuestion}
              className="p-1.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-[var(--text-primary)] active:bg-[var(--bg-surface-hover)]"
              title="Random question"
            >
              <Shuffle className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => setIsNavigatorOpen(true)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[var(--bg-surface-muted)] border border-[var(--border-default)] text-xs font-bold text-[var(--text-primary)] active:bg-[var(--bg-surface-hover)]"
            >
              <LayoutGrid className="w-3.5 h-3.5 text-amber-500" />
              <span>
                #{currentQId} / {allQuestions.length}
              </span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleNext}
            disabled={currentIndex === filteredQuestions.length - 1}
            className={`flex items-center gap-1 px-3.5 py-1.5 rounded-lg text-xs font-bold shadow-xs ${
              currentIndex === filteredQuestions.length - 1
                ? 'border border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-muted)] opacity-40 cursor-not-allowed'
                : 'bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-black'
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
