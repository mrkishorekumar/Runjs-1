import { memo } from 'react';
import { Gauge, Loader2 } from 'lucide-react';

interface ComplexityButtonProps {
  onClick: () => void;
  isAnalyzing: boolean;
  disabled?: boolean;
  className?: string;
  size?: 'sm' | 'md';
  hideLabelBelowSm?: boolean;
}

function ComplexityButton({
  onClick,
  isAnalyzing,
  disabled = false,
  className = '',
  size = 'md',
  hideLabelBelowSm = false,
}: ComplexityButtonProps) {
  const isCompact = size === 'sm';

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || isAnalyzing}
      title="Analyze Time and Space Complexity"
      aria-label="Analyze Time and Space Complexity"
      className={`relative inline-flex items-center justify-center gap-1.5 font-medium transition-all duration-150 cursor-pointer select-none disabled:opacity-50 disabled:cursor-not-allowed border border-[var(--border-default)] bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] active:bg-[var(--bg-surface-active)] text-[var(--text-primary)] shadow-2xs hover:border-amber-500/50 hover:shadow-xs focus:outline-none focus:ring-2 focus:ring-amber-500/30 ${
        isCompact
          ? `${hideLabelBelowSm ? 'p-1.5 sm:px-2.5 sm:py-1.5' : 'px-2.5 py-1.5'} rounded-lg text-[11px]`
          : 'px-3 py-1.5 rounded-md text-xs'
      } ${className}`}
    >
      {isAnalyzing ? (
        <>
          <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-500 shrink-0" />
          <span
            className={`text-amber-500 font-semibold truncate ${
              hideLabelBelowSm ? 'hidden sm:inline' : ''
            }`}
          >
            <span className="hidden md:inline">Analyzing your code...</span>
            <span className="md:hidden">Analyzing...</span>
          </span>
        </>
      ) : (
        <>
          <Gauge className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          <span
            className={`truncate ${hideLabelBelowSm ? 'hidden sm:inline' : ''}`}
          >
            <span className="hidden md:inline">Analyze Complexity</span>
            <span className="md:hidden">Complexity</span>
          </span>
        </>
      )}
    </button>
  );
}

export default memo(ComplexityButton);
