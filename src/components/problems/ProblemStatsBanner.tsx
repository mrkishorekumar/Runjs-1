import { memo } from 'react';
import { Problem } from '../../problem-engine/types';
import {
  getProblemStats,
  getAllProblemStates,
} from '../../problem-engine/storage';
import { Trophy, Star, Shuffle, CheckCircle2, Play } from 'lucide-react';
import { Link } from 'react-router';

interface ProblemStatsBannerProps {
  problems: Problem[];
  onPickRandom?: () => void;
}

function ProblemStatsBanner({
  problems,
  onPickRandom,
}: ProblemStatsBannerProps) {
  const stats = getProblemStats(problems);

  const easyPercent =
    stats.easyTotal > 0
      ? Math.round((stats.easySolved / stats.easyTotal) * 100)
      : 0;
  const mediumPercent =
    stats.mediumTotal > 0
      ? Math.round((stats.mediumSolved / stats.mediumTotal) * 100)
      : 0;
  const hardPercent =
    stats.hardTotal > 0
      ? Math.round((stats.hardSolved / stats.hardTotal) * 100)
      : 0;

  // Find next unsolved problem for quick start
  const allStates = getAllProblemStates();
  const nextUnsolved =
    problems.find((p) => !allStates[p.slug]?.isSolved) || problems[0];

  return (
    <div className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] p-3.5 shadow-xs transition-colors mb-4">
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        {/* Left: Overall Completion & Info */}
        <div className="flex items-center gap-3.5">
          <div className="flex flex-col items-center justify-center w-14 h-14 rounded-md border border-[var(--border-default)] bg-[var(--bg-app)] shrink-0 font-mono">
            <span className="text-lg font-bold text-amber-500 leading-none">
              {stats.solved}
            </span>
            <span className="text-[10px] text-[var(--text-muted)] mt-1">
              /{stats.total}
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-[var(--text-primary)]">
                Challenge Progress
              </h2>
              {stats.solved > 0 && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-mono font-medium bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                  <CheckCircle2 className="w-3 h-3" />
                  {stats.percentage}%
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 mt-1 text-xs font-mono text-[var(--text-muted)]">
              <span className="flex items-center gap-1">
                <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                <span>{stats.starredCount} starred</span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Trophy className="w-3 h-3 text-[var(--text-muted)]" />
                <span>{stats.total - stats.solved} remaining</span>
              </span>
            </div>
          </div>
        </div>

        {/* Middle: Difficulty Breakdown Progress Bars */}
        <div className="flex-1 max-w-md grid grid-cols-3 gap-2">
          {/* Easy */}
          <div className="p-2 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-app)]">
            <div className="flex items-center justify-between text-[11px] mb-1">
              <span className="font-mono font-medium text-emerald-500">Easy</span>
              <span className="font-mono text-[10px] text-[var(--text-muted)]">
                {stats.easySolved}/{stats.easyTotal}
              </span>
            </div>
            <div className="w-full h-1 rounded-full bg-[var(--border-default)] overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                style={{ width: `${easyPercent}%` }}
              />
            </div>
          </div>

          {/* Medium */}
          <div className="p-2 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-app)]">
            <div className="flex items-center justify-between text-[11px] mb-1">
              <span className="font-mono font-medium text-amber-500">Medium</span>
              <span className="font-mono text-[10px] text-[var(--text-muted)]">
                {stats.mediumSolved}/{stats.mediumTotal}
              </span>
            </div>
            <div className="w-full h-1 rounded-full bg-[var(--border-default)] overflow-hidden">
              <div
                className="h-full bg-amber-500 rounded-full transition-all duration-300"
                style={{ width: `${mediumPercent}%` }}
              />
            </div>
          </div>

          {/* Hard */}
          <div className="p-2 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-app)]">
            <div className="flex items-center justify-between text-[11px] mb-1">
              <span className="font-mono font-medium text-rose-500">Hard</span>
              <span className="font-mono text-[10px] text-[var(--text-muted)]">
                {stats.hardSolved}/{stats.hardTotal}
              </span>
            </div>
            <div className="w-full h-1 rounded-full bg-[var(--border-default)] overflow-hidden">
              <div
                className="h-full bg-rose-500 rounded-full transition-all duration-300"
                style={{ width: `${hardPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Right: Quick Action Buttons */}
        <div className="flex sm:flex-row lg:flex-col items-stretch gap-1.5 shrink-0">
          {nextUnsolved && (
            <Link
              to={`/problems/${nextUnsolved.slug}`}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md bg-amber-500 hover:bg-amber-400 text-black text-xs font-semibold transition-colors"
            >
              <Play className="w-3 h-3 fill-black" />
              <span>Continue Solving</span>
            </Link>
          )}

          {onPickRandom && (
            <button
              type="button"
              onClick={onPickRandom}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md border border-[var(--border-default)] bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xs font-medium transition-colors cursor-pointer"
            >
              <Shuffle className="w-3 h-3" />
              <span>Pick Random</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default memo(ProblemStatsBanner);
