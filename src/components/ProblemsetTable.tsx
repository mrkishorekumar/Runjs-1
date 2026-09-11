import { memo } from 'react';
import { Link } from 'react-router';
import { Problem, UserProblemState } from '../problem-engine/types';
import { CheckCircle2, Circle, Star, ArrowRight, BookOpen } from 'lucide-react';

interface ProblemsetTableProps {
  problems: Problem[];
  userStates: Record<string, UserProblemState>;
  onToggleStar: (slug: string) => void;
  onTopicClick?: (topic: string) => void;
  onResetFilters?: () => void;
}

function ProblemsetTable({
  problems,
  userStates,
  onToggleStar,
  onTopicClick,
  onResetFilters,
}: ProblemsetTableProps) {
  function getDifficultyBadge(diff: Problem['difficulty']) {
    switch (diff) {
      case 'easy':
        return (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            easy
          </span>
        );
      case 'medium':
        return (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            medium
          </span>
        );
      case 'hard':
        return (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
            hard
          </span>
        );
    }
  }

  if (problems.length === 0) {
    return (
      <div className="overflow-hidden rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] p-12 text-center my-4 shadow-xs">
        <div className="flex flex-col items-center gap-3 max-w-sm mx-auto">
          <div className="w-10 h-10 rounded-md bg-amber-500/10 text-amber-500 flex items-center justify-center border border-amber-500/20">
            <BookOpen className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">
            No problems found
          </h3>
          <p className="text-xs text-[var(--text-secondary)]">
            No coding challenges matched your current filters.
          </p>
          {onResetFilters && (
            <button
              type="button"
              onClick={onResetFilters}
              className="mt-1 px-3 py-1.5 rounded-md bg-amber-500 hover:bg-amber-400 text-black text-xs font-semibold transition-colors cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] my-4 shadow-xs transition-colors">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-[var(--border-default)] text-left text-xs">
          <thead className="bg-[var(--bg-surface-muted)] text-[var(--text-muted)] font-mono text-[10px] uppercase tracking-wider font-semibold">
            <tr>
              <th scope="col" className="w-10 px-3 py-2.5 text-center">
                Status
              </th>
              <th scope="col" className="w-10 px-2 py-2.5 text-center">
                Star
              </th>
              <th scope="col" className="px-3.5 py-2.5">
                Problem Title
              </th>
              <th scope="col" className="px-3.5 py-2.5 hidden md:table-cell">
                Topics
              </th>
              <th scope="col" className="px-3.5 py-2.5 w-24">
                Difficulty
              </th>
              <th
                scope="col"
                className="px-3.5 py-2.5 w-24 text-right hidden sm:table-cell"
              >
                Acceptance
              </th>
              <th scope="col" className="px-3.5 py-2.5 w-24 text-center">
                Action
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-[var(--border-subtle)] text-[var(--text-primary)]">
            {problems.map((problem) => {
              const state = userStates[problem.slug];
              const isSolved = state?.isSolved ?? false;
              const isStarred = state?.isStarred ?? false;
              const hasAttempted =
                !isSolved &&
                ((state?.submissions && state.submissions.length > 0) ||
                  Boolean(state?.lastAttemptedAt));

              return (
                <tr
                  key={problem.id}
                  className="hover:bg-[var(--bg-surface-hover)] transition-colors group"
                >
                  {/* Status Indicator */}
                  <td className="px-3 py-2.5 text-center">
                    {isSolved ? (
                      <span
                        title="Solved"
                        className="inline-flex items-center justify-center text-emerald-500"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </span>
                    ) : hasAttempted ? (
                      <span
                        title="Attempted"
                        className="inline-flex items-center justify-center text-amber-500"
                      >
                        <Circle className="w-3 h-3 fill-amber-500/30" />
                      </span>
                    ) : (
                      <span
                        title="Unsolved"
                        className="inline-flex items-center justify-center text-[var(--text-muted)]"
                      >
                        <Circle className="w-3 h-3 opacity-30" />
                      </span>
                    )}
                  </td>

                  {/* Star Toggle */}
                  <td className="px-2 py-2.5 text-center">
                    <button
                      type="button"
                      aria-label={
                        isStarred ? 'Remove from favorites' : 'Add to favorites'
                      }
                      onClick={() => onToggleStar(problem.slug)}
                      className={`p-1.5 sm:p-1 rounded transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/60 focus-visible:ring-offset-1 cursor-pointer ${
                        isStarred
                          ? 'text-amber-500 fill-amber-500'
                          : 'text-[var(--text-muted)] hover:text-amber-500'
                      }`}
                    >
                      <Star
                        className={`w-3.5 h-3.5 ${
                          isStarred ? 'fill-amber-500 text-amber-500' : ''
                        }`}
                      />
                    </button>
                  </td>

                  {/* Problem Title & ID */}
                  <td className="px-3.5 py-2.5">
                    <Link
                      to={`/problems/${problem.slug}`}
                      className="group-hover:text-amber-500 font-medium transition-colors inline-flex items-center gap-2"
                    >
                      <span className="font-mono text-[11px] text-[var(--text-muted)] tabular-nums">
                        #{problem.id}
                      </span>
                      <span className="text-xs text-[var(--text-primary)] group-hover:text-amber-500 font-medium">
                        {problem.title}
                      </span>
                    </Link>

                    {/* Mobile topics */}
                    <div className="flex md:hidden flex-wrap gap-1 mt-1">
                      {problem.topics.slice(0, 2).map((t) => (
                        <span
                          key={t}
                          className="px-1 py-0.2 rounded text-[10px] font-mono bg-[var(--bg-app)] text-[var(--text-muted)] border border-[var(--border-subtle)]"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </td>

                  {/* Topic Tags */}
                  <td className="px-3.5 py-2.5 hidden md:table-cell">
                    <div className="flex flex-wrap gap-1">
                      {problem.topics.map((topic) => (
                        <button
                          key={topic}
                          type="button"
                          onClick={() => onTopicClick && onTopicClick(topic)}
                          className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-[var(--bg-app)] hover:bg-amber-500/10 text-[var(--text-muted)] hover:text-amber-500 border border-[var(--border-subtle)] transition-colors cursor-pointer"
                        >
                          {topic}
                        </button>
                      ))}
                    </div>
                  </td>

                  {/* Difficulty */}
                  <td className="px-3.5 py-2.5">
                    {getDifficultyBadge(problem.difficulty)}
                  </td>

                  {/* Acceptance Rate */}
                  <td className="px-3.5 py-2.5 text-right hidden sm:table-cell font-mono text-[11px] text-[var(--text-muted)] tabular-nums">
                    {problem.acceptanceRate}
                  </td>

                  {/* Action Link */}
                  <td className="px-3.5 py-2.5 text-center">
                    <Link
                      to={`/problems/${problem.slug}`}
                      className={`inline-flex items-center justify-center gap-1 px-2.5 py-1 sm:py-0.5 min-h-[28px] sm:min-h-0 rounded text-xs font-mono font-medium transition-colors ${
                        isSolved
                          ? 'bg-[var(--bg-app)] hover:bg-[var(--bg-surface-active)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-default)]'
                          : 'bg-amber-500/10 hover:bg-amber-500 text-amber-600 dark:text-amber-400 hover:text-black dark:hover:text-black border border-amber-500/30'
                      }`}
                    >
                      <span>{isSolved ? 'Review' : 'Solve'}</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default memo(ProblemsetTable);
