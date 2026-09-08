import { memo, useMemo } from 'react';
import { Link } from 'react-router';
import {
  curriculum,
  getTotalLessonCount,
  getAllLessonSlugs,
  TOTAL_EXERCISE_COUNT,
} from '../data/curriculum';
import { getLessonBySlug } from '../data/lessonRegistry';
import { useLearnProgress } from '../hooks/useLearnProgress';
import {
  BookOpen,
  Trophy,
  Flame,
  Target,
  ArrowRight,
  CheckCircle2,
  Circle,
  Sparkles,
  Rocket,
  Calculator,
  Repeat,
  Box,
  LayoutList,
  Database,
  Type,
  Hash,
  GitBranch,
  ShieldAlert,
  Timer,
  Workflow,
  Package,
  FileCode,
  MousePointerClick,
  Globe,
  GraduationCap,
  Lightbulb,
  Layers,
  FunctionSquare,
  Wand2,
  Component,
  Infinity as InfinityIcon,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

// Icon map for topic icons
const iconMap: Record<string, LucideIcon> = {
  Rocket,
  Calculator,
  Repeat,
  FunctionSquare,
  Layers,
  Box,
  LayoutList,
  Database,
  Type,
  Hash,
  GitBranch,
  Component,
  ShieldAlert,
  Timer,
  Workflow,
  Infinity: InfinityIcon,
  Wand2,
  Package,
  FileCode,
  MousePointerClick,
  Globe,
  GraduationCap,
  Lightbulb,
};

function LearnHome() {
  const { getStats, progress } = useLearnProgress();

  const totalLessons = useMemo(() => getTotalLessonCount(), []);
  const totalExercises = TOTAL_EXERCISE_COUNT;
  const stats = useMemo(
    () => getStats(totalLessons, totalExercises),
    [getStats, totalLessons, totalExercises]
  );

  const allSlugs = useMemo(() => getAllLessonSlugs(), []);
  const firstLessonSlug = allSlugs[0] || 'intro';

  // Determine if user has actually started learning (completed at least 1 lesson or exercise)
  const hasStartedLearning =
    stats.completedLessons > 0 || stats.completedExercises > 0;
  const continueSlug = progress.lastLessonSlug || firstLessonSlug;

  return (
    <div className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
      {/* Hero Section */}
      <section className="mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-semibold mb-4">
          <Sparkles className="w-3.5 h-3.5" />
          <span>JavaScript 0 → Hero</span>
        </div>

        <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-[var(--text-primary)] leading-tight">
          Learn JavaScript{' '}
          <span className="bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 bg-clip-text text-transparent">
            From Scratch
          </span>
        </h1>
        <p className="mt-3 text-sm sm:text-base text-[var(--text-secondary)] leading-relaxed max-w-2xl">
          A complete, hands-on learning path to take you from absolute beginner
          to confident JavaScript developer. Interactive lessons, runnable code
          examples, practice exercises, and quizzes — all right here in your
          browser.
        </p>

        {/* CTA */}
        <div className="mt-6 flex flex-wrap items-center gap-3">
          {hasStartedLearning ? (
            <Link
              to={`/learn/${continueSlug}`}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-black text-sm font-semibold shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <ArrowRight className="w-4 h-4" />
              Continue Learning
            </Link>
          ) : (
            <Link
              to={`/learn/${firstLessonSlug}`}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-black text-sm font-semibold shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Rocket className="w-4 h-4" />
              Start Learning
            </Link>
          )}
          <span className="text-xs text-[var(--text-muted)]">
            {totalLessons} lessons • {totalExercises} exercises • Free forever
          </span>
        </div>
      </section>

      {/* Progress Stats */}
      <section className="mb-10 grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)]">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen className="w-4 h-4 text-amber-500" />
            <span className="text-[10px] uppercase font-bold tracking-wider text-[var(--text-muted)]">
              Lessons
            </span>
          </div>
          <p className="text-xl font-bold text-[var(--text-primary)] tabular-nums">
            {stats.completedLessons}
            <span className="text-sm text-[var(--text-muted)] font-normal">
              /{stats.totalLessons}
            </span>
          </p>
        </div>

        <div className="p-4 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)]">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-emerald-500" />
            <span className="text-[10px] uppercase font-bold tracking-wider text-[var(--text-muted)]">
              Progress
            </span>
          </div>
          <p className="text-xl font-bold text-[var(--text-primary)] tabular-nums">
            {stats.completionPercentage}%
          </p>
        </div>

        <div className="p-4 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)]">
          <div className="flex items-center gap-2 mb-2">
            <Trophy className="w-4 h-4 text-blue-500" />
            <span className="text-[10px] uppercase font-bold tracking-wider text-[var(--text-muted)]">
              Avg Quiz
            </span>
          </div>
          <p className="text-xl font-bold text-[var(--text-primary)] tabular-nums">
            {stats.averageQuizScore}%
          </p>
        </div>

        <div className="p-4 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)]">
          <div className="flex items-center gap-2 mb-2">
            <Flame className="w-4 h-4 text-orange-500" />
            <span className="text-[10px] uppercase font-bold tracking-wider text-[var(--text-muted)]">
              Streak
            </span>
          </div>
          <p className="text-xl font-bold text-[var(--text-primary)] tabular-nums">
            {stats.currentStreak}
            <span className="text-sm text-[var(--text-muted)] font-normal">
              {' '}
              days
            </span>
          </p>
        </div>
      </section>

      {/* Overall progress bar */}
      <section className="mb-10">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-[var(--text-secondary)]">
            Overall Progress
          </span>
          <span className="text-xs font-semibold text-[var(--text-primary)] tabular-nums">
            {stats.completionPercentage}%
          </span>
        </div>
        <div className="w-full h-2.5 rounded-full bg-[var(--bg-surface-hover)] overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 transition-all duration-500"
            style={{ width: `${stats.completionPercentage}%` }}
          />
        </div>
      </section>

      {/* Curriculum Roadmap */}
      <section>
        <h2 className="text-lg sm:text-xl font-bold text-[var(--text-primary)] mb-6">
          Learning Roadmap
        </h2>

        <div className="space-y-8">
          {curriculum.map((part) => {
            const partLessonSlugs = part.topics.flatMap((t) => t.lessonSlugs);
            const partCompleted = partLessonSlugs.filter(
              (s) => progress.lessons[s]?.isRead
            ).length;
            const partTotal = partLessonSlugs.length;
            const partPercentage =
              partTotal > 0 ? Math.round((partCompleted / partTotal) * 100) : 0;

            return (
              <div key={part.slug}>
                {/* Part Header */}
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-500">
                      Part {part.partNumber}
                    </span>
                    <h3 className="text-base font-bold text-[var(--text-primary)]">
                      {part.title}
                    </h3>
                    <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                      {part.description}
                    </p>
                  </div>
                  <span className="text-[11px] font-semibold text-[var(--text-muted)] tabular-nums whitespace-nowrap ml-4">
                    {partCompleted}/{partTotal} • {partPercentage}%
                  </span>
                </div>

                {/* Part progress bar */}
                <div className="w-full h-1.5 rounded-full bg-[var(--bg-surface-hover)] overflow-hidden mb-4">
                  <div
                    className="h-full rounded-full bg-amber-500 transition-all duration-500"
                    style={{ width: `${partPercentage}%` }}
                  />
                </div>

                {/* Topic Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {part.topics.map((topic) => {
                    const topicCompleted = topic.lessonSlugs.filter(
                      (s) => progress.lessons[s]?.isRead
                    ).length;
                    const topicTotal = topic.lessonSlugs.length;
                    const allDone =
                      topicCompleted === topicTotal && topicTotal > 0;
                    const firstUnread = topic.lessonSlugs.find(
                      (s) => !progress.lessons[s]?.isRead
                    );
                    const linkTo = firstUnread
                      ? `/learn/${firstUnread}`
                      : `/learn/${topic.lessonSlugs[0]}`;

                    const IconComponent = iconMap[topic.icon] || BookOpen;

                    const colorClasses: Record<string, string> = {
                      amber:
                        'bg-amber-500/10 text-amber-500 border-amber-500/20',
                      blue: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
                      emerald:
                        'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
                      violet:
                        'bg-violet-500/10 text-violet-500 border-violet-500/20',
                      rose: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
                      orange:
                        'bg-orange-500/10 text-orange-500 border-orange-500/20',
                      teal: 'bg-teal-500/10 text-teal-500 border-teal-500/20',
                      cyan: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20',
                      purple:
                        'bg-purple-500/10 text-purple-500 border-purple-500/20',
                      indigo:
                        'bg-indigo-500/10 text-indigo-500 border-indigo-500/20',
                      sky: 'bg-sky-500/10 text-sky-500 border-sky-500/20',
                      red: 'bg-red-500/10 text-red-500 border-red-500/20',
                      fuchsia:
                        'bg-fuchsia-500/10 text-fuchsia-500 border-fuchsia-500/20',
                      pink: 'bg-pink-500/10 text-pink-500 border-pink-500/20',
                      lime: 'bg-lime-500/10 text-lime-500 border-lime-500/20',
                    };

                    return (
                      <div
                        key={topic.slug}
                        className={`p-4 rounded-xl border bg-[var(--bg-surface)] transition-all duration-150 shadow-xs hover:shadow-md ${
                          allDone
                            ? 'border-emerald-500/30'
                            : 'border-[var(--border-default)]'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2.5">
                          <Link
                            to={linkTo}
                            className={`flex items-center justify-center w-8 h-8 rounded-lg border ${colorClasses[topic.accentColor] || colorClasses.amber} hover:scale-105 transition-transform`}
                          >
                            <IconComponent className="w-4 h-4" />
                          </Link>
                          {allDone ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          ) : topicCompleted > 0 ? (
                            <span className="text-[10px] font-semibold text-amber-500">
                              {topicCompleted}/{topicTotal}
                            </span>
                          ) : (
                            <Circle className="w-4 h-4 text-[var(--text-muted)]" />
                          )}
                        </div>

                        <Link
                          to={linkTo}
                          className="block group-hover:text-amber-500 transition-colors"
                        >
                          <h4 className="text-xs font-bold text-[var(--text-primary)] hover:text-amber-500 transition-colors">
                            {topic.title}
                          </h4>
                          <p className="text-[11px] text-[var(--text-muted)] mt-1 leading-relaxed line-clamp-2">
                            {topic.description}
                          </p>
                        </Link>

                        <div className="mt-3 pt-2.5 border-t border-[var(--border-subtle)] space-y-1">
                          {topic.lessonSlugs.map((s) => {
                            const l = getLessonBySlug(s);
                            const lessonTitle = l
                              ? l.title
                              : s
                                  .split('-')
                                  .map(
                                    (w) =>
                                      w.charAt(0).toUpperCase() + w.slice(1)
                                  )
                                  .join(' ');
                            return (
                              <Link
                                key={s}
                                to={`/learn/${s}`}
                                className="flex items-center gap-1.5 text-[11px] text-[var(--text-secondary)] hover:text-amber-500 transition-colors truncate py-0.5"
                              >
                                <span className="w-1 h-1 rounded-full bg-amber-500/50 shrink-0" />
                                <span className="truncate">{lessonTitle}</span>
                              </Link>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

export default memo(LearnHome);
