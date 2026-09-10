import { memo } from 'react';
import { Difficulty, ProblemFilterStatus } from '../../problem-engine/types';
import { Search, X, Star, CheckCircle, RotateCcw } from 'lucide-react';

interface ProblemFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  difficulty: 'all' | Difficulty;
  onDifficultyChange: (diff: 'all' | Difficulty) => void;
  selectedTopic: string;
  onTopicChange: (topic: string) => void;
  status: ProblemFilterStatus;
  onStatusChange: (status: ProblemFilterStatus) => void;
  availableTopics: string[];
  totalCounts: {
    all: number;
    easy: number;
    medium: number;
    hard: number;
    solved: number;
    starred: number;
  };
  onResetFilters: () => void;
}

function ProblemFilters({
  search,
  onSearchChange,
  difficulty,
  onDifficultyChange,
  selectedTopic,
  onTopicChange,
  status,
  onStatusChange,
  availableTopics,
  totalCounts,
  onResetFilters,
}: ProblemFiltersProps) {
  const isFiltered =
    search.trim() !== '' ||
    difficulty !== 'all' ||
    selectedTopic !== 'all' ||
    status !== 'all';

  return (
    <div className="space-y-3 my-4">
      {/* Top Search and Quick Status Row */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        {/* Search Bar */}
        <div className="relative flex-1 max-w-md">
          <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-[var(--text-muted)]">
            <Search className="w-3.5 h-3.5" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search problems by title, topic, or keyword..."
            className="w-full h-8 pl-8 pr-7 text-xs rounded-md border border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 transition-colors"
          />
          {search && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => onSearchChange('')}
              className="absolute inset-y-0 right-0 pr-2 flex items-center text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Difficulty / Status Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {/* All */}
          <button
            type="button"
            onClick={() => {
              if (onResetFilters) {
                onResetFilters();
              } else {
                onSearchChange('');
                onDifficultyChange('all');
                onTopicChange('all');
                onStatusChange('all');
              }
            }}
            className={`h-8 px-2.5 rounded-md text-xs font-mono font-medium whitespace-nowrap border transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/60 focus-visible:ring-offset-1 ${
              !isFiltered
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-500'
                : 'bg-[var(--bg-surface)] border-[var(--border-default)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]'
            }`}
          >
            all ({totalCounts.all})
          </button>

          {/* Easy */}
          <button
            type="button"
            onClick={() => {
              onDifficultyChange('easy');
              onStatusChange('all');
            }}
            className={`h-8 px-2.5 rounded-md text-xs font-mono font-medium whitespace-nowrap border transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/60 focus-visible:ring-offset-1 ${
              difficulty === 'easy' && status === 'all'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500'
                : 'bg-[var(--bg-surface)] border-[var(--border-default)] text-[var(--text-secondary)] hover:text-emerald-500 hover:bg-[var(--bg-surface-hover)]'
            }`}
          >
            easy ({totalCounts.easy})
          </button>

          {/* Medium */}
          <button
            type="button"
            onClick={() => {
              onDifficultyChange('medium');
              onStatusChange('all');
            }}
            className={`h-8 px-2.5 rounded-md text-xs font-mono font-medium whitespace-nowrap border transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/60 focus-visible:ring-offset-1 ${
              difficulty === 'medium' && status === 'all'
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-500'
                : 'bg-[var(--bg-surface)] border-[var(--border-default)] text-[var(--text-secondary)] hover:text-amber-500 hover:bg-[var(--bg-surface-hover)]'
            }`}
          >
            medium ({totalCounts.medium})
          </button>

          {/* Hard */}
          <button
            type="button"
            onClick={() => {
              onDifficultyChange('hard');
              onStatusChange('all');
            }}
            className={`h-8 px-2.5 rounded-md text-xs font-mono font-medium whitespace-nowrap border transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/60 focus-visible:ring-offset-1 ${
              difficulty === 'hard' && status === 'all'
                ? 'bg-rose-500/10 border-rose-500/30 text-rose-500'
                : 'bg-[var(--bg-surface)] border-[var(--border-default)] text-[var(--text-secondary)] hover:text-rose-500 hover:bg-[var(--bg-surface-hover)]'
            }`}
          >
            hard ({totalCounts.hard})
          </button>

          {/* Solved */}
          <button
            type="button"
            onClick={() =>
              onStatusChange(status === 'solved' ? 'all' : 'solved')
            }
            className={`h-8 flex items-center gap-1.5 px-2.5 rounded-md text-xs font-mono font-medium whitespace-nowrap border transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/60 focus-visible:ring-offset-1 ${
              status === 'solved'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500'
                : 'bg-[var(--bg-surface)] border-[var(--border-default)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]'
            }`}
          >
            <CheckCircle className="w-3.5 h-3.5" />
            <span>solved ({totalCounts.solved})</span>
          </button>

          {/* Starred */}
          <button
            type="button"
            onClick={() =>
              onStatusChange(status === 'starred' ? 'all' : 'starred')
            }
            className={`h-8 flex items-center gap-1.5 px-2.5 rounded-md text-xs font-mono font-medium whitespace-nowrap border transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/60 focus-visible:ring-offset-1 ${
              status === 'starred'
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-500'
                : 'bg-[var(--bg-surface)] border-[var(--border-default)] text-[var(--text-secondary)] hover:text-amber-500 hover:bg-[var(--bg-surface-hover)]'
            }`}
          >
            <Star className="w-3.5 h-3.5 fill-current" />
            <span>starred ({totalCounts.starred})</span>
          </button>
        </div>
      </div>

      {/* Topic Tags Filter Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        <span className="text-[var(--text-muted)] font-mono text-[11px] uppercase tracking-wider mr-1 shrink-0">
          Topics:
        </span>

        <button
          type="button"
          onClick={() => onTopicChange('all')}
          className={`px-2 py-0.5 rounded text-xs font-mono shrink-0 border transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/60 focus-visible:ring-offset-1 ${
            selectedTopic === 'all'
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-500 font-semibold'
              : 'bg-[var(--bg-surface)] border-[var(--border-default)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]'
          }`}
        >
          all
        </button>

        {availableTopics.map((topic) => {
          const isSelected = selectedTopic === topic;
          return (
            <button
              key={topic}
              type="button"
              onClick={() => onTopicChange(isSelected ? 'all' : topic)}
              className={`px-2 py-0.5 rounded text-xs font-mono shrink-0 border transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/60 focus-visible:ring-offset-1 ${
                isSelected
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-500 font-semibold'
                  : 'bg-[var(--bg-surface)] border-[var(--border-default)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]'
              }`}
            >
              {topic}
            </button>
          );
        })}

        {isFiltered && (
          <button
            type="button"
            onClick={onResetFilters}
            className="flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono text-rose-500 hover:bg-rose-500/10 border border-rose-500/20 shrink-0 ml-auto transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/60 focus-visible:ring-offset-1"
          >
            <RotateCcw className="w-3 h-3" />
            <span>reset</span>
          </button>
        )}
      </div>
    </div>
  );
}

export default memo(ProblemFilters);
