import { memo } from 'react';
import { Link } from 'react-router';
import { Problem } from '../../problem-engine/types';
import { getGithubIssueUrl } from '../../utils/githubIssues';
import ThemeSelector from '../ThemeSelector';
import ComplexityButton from '../complexity/ComplexityButton';
import {
  ChevronLeft,
  Play,
  CheckCircle2,
  Loader2,
  RotateCcw,
  AlignLeft,
  ZoomIn,
  ZoomOut,
  Bug,
} from 'lucide-react';

interface ProblemHeaderProps {
  problem: Problem;
  isRunning: boolean;
  isSubmitting: boolean;
  onRun: () => void;
  onSubmit: () => void;
  onReset: () => void;
  onFormat: () => void;
  onAnalyzeComplexity: () => void;
  isAnalyzingComplexity: boolean;
  currentFontSize: string;
  onFontSizeChange: (
    operation: 'increaseFontSize' | 'decreaseFontSize'
  ) => void;
  isSolved?: boolean;
}

function ProblemHeader({
  problem,
  isRunning,
  isSubmitting,
  onRun,
  onSubmit,
  onReset,
  onFormat,
  onAnalyzeComplexity,
  isAnalyzingComplexity,
  currentFontSize,
  onFontSizeChange,
  isSolved,
}: ProblemHeaderProps) {
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

  return (
    <header className="h-10 w-full flex items-center justify-between px-3 bg-[var(--bg-surface)] border-b border-[var(--border-default)] z-30 shrink-0 select-none transition-colors">
      {/* Left: Back Link & Problem Title */}
      <div className="flex items-center gap-2 min-w-0">
        <Link
          to="/problems"
          title="Back to Problems"
          className="flex items-center gap-1 px-2 py-1 rounded text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors shrink-0"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Problems</span>
        </Link>

        <div className="h-3.5 w-px bg-[var(--border-default)] hidden sm:block shrink-0" />

        <div className="flex items-center gap-2 min-w-0">
          <span className="font-mono text-xs text-[var(--text-muted)] shrink-0">
            #{problem.id}
          </span>
          <h1 className="text-xs font-semibold text-[var(--text-primary)] truncate">
            {problem.title}
          </h1>
          <div className="shrink-0">
            {getDifficultyBadge(problem.difficulty)}
          </div>

          {isSolved && (
            <span
              title="Solved"
              className="hidden md:inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-mono font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0"
            >
              <CheckCircle2 className="w-3 h-3" />
              solved
            </span>
          )}
        </div>
      </div>

      {/* Center: Run & Submit Actions */}
      <div className="flex items-center gap-1.5 shrink-0">
        {/* Run Button (Tests Sample Cases) */}
        <button
          type="button"
          onClick={onRun}
          disabled={isRunning || isSubmitting}
          title="Run visible test cases (Ctrl/Cmd + R)"
          className="flex items-center gap-1.5 px-2.5 py-1 rounded border border-[var(--border-default)] bg-[var(--bg-app)] hover:bg-[var(--bg-surface-hover)] text-[var(--text-primary)] text-xs font-medium cursor-pointer disabled:opacity-50 transition-colors"
        >
          {isRunning ? (
            <Loader2 className="w-3 h-3 animate-spin text-amber-500 shrink-0" />
          ) : (
            <Play className="w-3 h-3 fill-current text-amber-500 shrink-0" />
          )}
          <span>Run</span>
          <kbd className="hidden xl:inline-block ml-1 px-1 py-0.2 text-[9px] font-mono bg-[var(--border-default)] text-[var(--text-secondary)] rounded">
            ⌘R
          </kbd>
        </button>

        {/* Analyze Complexity Button */}
        <ComplexityButton
          onClick={onAnalyzeComplexity}
          isAnalyzing={isAnalyzingComplexity}
          size="sm"
          hideLabelBelowSm
        />

        {/* Submit Button (Runs All Hidden Cases) */}
        <button
          type="button"
          onClick={onSubmit}
          disabled={isRunning || isSubmitting}
          title="Submit solution against all test cases"
          className="flex items-center gap-1.5 px-3 py-1 rounded bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-semibold cursor-pointer disabled:opacity-50 transition-colors"
        >
          {isSubmitting ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
          ) : (
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
          )}
          <span>Submit</span>
        </button>

        {/* Reset Starter Code */}
        <button
          type="button"
          onClick={onReset}
          title="Reset to starter code"
          aria-label="Reset Code"
          className="hidden sm:flex items-center p-1.5 rounded border border-[var(--border-default)] bg-[var(--bg-app)] hover:bg-[var(--bg-surface-hover)] text-[var(--text-secondary)] hover:text-rose-500 transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>

        {/* Format Document */}
        <button
          type="button"
          onClick={onFormat}
          title="Format Document (Shift + Alt + F)"
          aria-label="Format Document"
          className="hidden sm:flex items-center p-1.5 rounded border border-[var(--border-default)] bg-[var(--bg-app)] hover:bg-[var(--bg-surface-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
        >
          <AlignLeft className="w-3.5 h-3.5" />
        </button>

        {/* Font Zoom Controls */}
        <div className="hidden md:flex items-center rounded border border-[var(--border-default)] bg-[var(--bg-app)] p-0.5">
          <button
            type="button"
            onClick={() => onFontSizeChange('decreaseFontSize')}
            title="Decrease font size"
            className="p-1 rounded text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors cursor-pointer"
          >
            <ZoomOut className="w-3 h-3" />
          </button>
          <span className="px-1.5 text-[10px] font-mono text-[var(--text-muted)] min-w-[28px] text-center">
            {currentFontSize}px
          </span>
          <button
            type="button"
            onClick={() => onFontSizeChange('increaseFontSize')}
            title="Increase font size"
            className="p-1 rounded text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors cursor-pointer"
          >
            <ZoomIn className="w-3 h-3" />
          </button>
        </div>

        {/* Raise Issue on GitHub */}
        <a
          href={getGithubIssueUrl(problem)}
          target="_blank"
          rel="noopener noreferrer"
          title="Raise an issue for this problem on GitHub"
          aria-label="Raise Issue"
          className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded border border-[var(--border-default)] bg-[var(--bg-app)] hover:bg-[var(--bg-surface-hover)] text-[var(--text-secondary)] hover:text-amber-500 text-xs font-mono transition-colors"
        >
          <Bug className="w-3.5 h-3.5 text-amber-500" />
          <span className="hidden xl:inline">Issue</span>
        </a>

        {/* Theme Selector */}
        <ThemeSelector compact={true} />
      </div>
    </header>
  );
}

export default memo(ProblemHeader);
