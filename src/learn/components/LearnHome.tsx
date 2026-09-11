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
    <div className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      {/* Hero Section */}
      <section className="mb-8">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md border border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-secondary)] font-mono text-xs mb-3">
          <BookOpen className="w-3.5 h-3.5 text-amber-500" />
          <span>curriculum // 0_to_hero</span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-primary)] leading-tight">
          Learn JavaScript From Scratch
        </h1>
        <p className="mt-2 text-sm text-[var(--text-secondary)] leading-relaxed max-w-2xl">
          A structured, hands-on learning path from language fundamentals to
          advanced patterns. Interactive lessons, runnable Monaco code examples,
          sandbox exercises, and quizzes.
        </p>

        {/* CTA */}
        <div className="mt-5 flex flex-wrap items-center gap-3">
          {hasStartedLearning ? (
            <Link
              to={`/learn/${continueSlug}`}
              className="inline-flex items-center gap-2 h-9 px-4 rounded-md bg-amber-500 hover:bg-amber-400 text-black text-xs font-semibold transition-colors"
            >
              <ArrowRight className="w-4 h-4" />
              <span>Continue Learning</span>
            </Link>
          ) : (
            <Link
              to={`/learn/${firstLessonSlug}`}
              className="inline-flex items-center gap-2 h-9 px-4 rounded-md bg-amber-500 hover:bg-amber-400 text-black text-xs font-semibold transition-colors"
            >
              <Rocket className="w-4 h-4" />
              <span>Start Learning</span>
            </Link>
          )}
          <span className="text-xs font-mono text-[var(--text-muted)]">
            {totalLessons} lessons • {totalExercises} exercises
          </span>
        </div>
      </section>

      {/* Progress Stats */}
      <section className="mb-8 grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)]">
          <div className="flex items-center gap-2 mb-1.5">
            <BookOpen className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-[10px] font-mono text-[var(--text-muted)]">
              lessons
            </span>
          </div>
          <p className="text-xl font-bold font-mono text-[var(--text-primary)] tabular-nums">
            {stats.completedLessons}
            <span className="text-xs text-[var(--text-muted)] font-normal font-mono">
              /{stats.totalLessons}
            </span>
          </p>
        </div>

        <div className="p-3.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)]">
          <div className="flex items-center gap-2 mb-1.5">
            <Target className="w-3.5 h-3.5 text-emerald-500" />
            <span className="text-[10px] font-mono text-[var(--text-muted)]">
              progress
            </span>
          </div>
          <p className="text-xl font-bold font-mono text-[var(--text-primary)] tabular-nums">
            {stats.completionPercentage}%
          </p>
        </div>

        <div className="p-3.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)]">
          <div className="flex items-center gap-2 mb-1.5">
            <Trophy className="w-3.5 h-3.5 text-blue-500" />
            <span className="text-[10px] font-mono text-[var(--text-muted)]">
              avg_quiz
            </span>
          </div>
          <p className="text-xl font-bold font-mono text-[var(--text-primary)] tabular-nums">
            {stats.averageQuizScore}%
          </p>
        </div>

        <div className="p-3.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)]">
          <div className="flex items-center gap-2 mb-1.5">
            <Flame className="w-3.5 h-3.5 text-orange-500" />
            <span className="text-[10px] font-mono text-[var(--text-muted)]">
              streak
            </span>
          </div>
          <p className="text-xl font-bold font-mono text-[var(--text-primary)] tabular-nums">
            {stats.currentStreak}
            <span className="text-xs text-[var(--text-muted)] font-normal font-mono">
              {' '}
              days
            </span>
          </p>
        </div>
      </section>

      {/* Overall progress bar */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-mono text-[var(--text-secondary)]">
            overall_progress
          </span>
          <span className="text-xs font-mono font-medium text-[var(--text-primary)] tabular-nums">
            {stats.completionPercentage}%
          </span>
        </div>
        <div className="w-full h-1.5 rounded-full bg-[var(--bg-surface-hover)] overflow-hidden">
          <div
            className="h-full rounded-full bg-amber-500 transition-all duration-300"
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
                <div className="flex items-center justify-between mb-2.5">
                  <div>
                    <span className="text-[10px] font-mono text-amber-500">
                      part_{part.partNumber}
                    </span>
                    <h3 className="text-base font-semibold text-[var(--text-primary)]">
                      {part.title}
                    </h3>
                    <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                      {part.description}
                    </p>
                  </div>
                  <span className="text-xs font-mono text-[var(--text-muted)] tabular-nums whitespace-nowrap ml-4">
                    {partCompleted}/{partTotal} • {partPercentage}%
                  </span>
                </div>

                {/* Part progress bar */}
                <div className="w-full h-1.5 rounded-full bg-[var(--bg-surface-hover)] overflow-hidden mb-3.5">
                  <div
                    className="h-full rounded-full bg-amber-500 transition-all duration-300"
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
                        className={`p-3.5 rounded-lg border bg-[var(--bg-surface)] transition-colors ${
                          allDone
                            ? 'border-emerald-500/30'
                            : 'border-[var(--border-default)]'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <Link
                            to={linkTo}
                            className={`flex items-center justify-center w-7 h-7 rounded-md border ${colorClasses[topic.accentColor] || colorClasses.amber}`}
                          >
                            <IconComponent className="w-3.5 h-3.5" />
                          </Link>
                          {allDone ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          ) : topicCompleted > 0 ? (
                            <span className="text-[10px] font-mono font-semibold text-amber-500">
                              {topicCompleted}/{topicTotal}
                            </span>
                          ) : (
                            <Circle className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                          )}
                        </div>

                        <Link
                          to={linkTo}
                          className="block group hover:text-amber-500 transition-colors"
                        >
                          <h4 className="text-xs font-semibold text-[var(--text-primary)] group-hover:text-amber-500 transition-colors">
                            {topic.title}
                          </h4>
                          <p className="text-[11px] text-[var(--text-muted)] mt-1 leading-relaxed line-clamp-2">
                            {topic.description}
                          </p>
                        </Link>

                        <div className="mt-2.5 pt-2 border-t border-[var(--border-subtle)] space-y-0.5">
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
