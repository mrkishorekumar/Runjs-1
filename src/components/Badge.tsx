import { memo } from 'react';
import { TaggedResult } from '../utils/interface';
import { Tag as TagIcon } from 'lucide-react';

function Badge({ count, tag, setSearchTerm, searchTerm }: TaggedResult) {
  const isSelected = tag === searchTerm;

  return (
    <button
      type="button"
      onClick={() => setSearchTerm((prev) => (prev === tag ? '' : tag))}
      aria-pressed={isSelected}
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-mono rounded border transition-colors cursor-pointer ${
        isSelected
          ? 'bg-amber-500/10 border-amber-500/30 text-amber-500'
          : 'bg-[var(--bg-surface)] border-[var(--border-default)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]'
      }`}
    >
      <TagIcon className="w-3 h-3 opacity-70" />
      <span>{tag}</span>
      <span
        className={`px-1 py-0.2 rounded text-[10px] font-mono ${
          isSelected
            ? 'bg-amber-500/20 text-amber-500 font-semibold'
            : 'bg-[var(--bg-surface-muted)] text-[var(--text-muted)]'
        }`}
      >
        {count}
      </span>
    </button>
  );
}

export default memo(Badge);
