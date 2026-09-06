import { memo, useEffect, useRef, useState } from 'react';
import {
  X,
  Gauge,
  Clock,
  Database,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Info,
  Copy,
  Check,
  Bug,
  ExternalLink,
} from 'lucide-react';
import { ComplexityResult, ComplexityRank } from '../../utils/complexity/types';
import { getComplexityIssueUrl } from '../../utils/githubIssues';

interface ComplexityModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: ComplexityResult | null;
  codeSnippet?: string;
}

function ComplexityModal({
  isOpen,
  onClose,
  result,
  codeSnippet,
}: ComplexityModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement | null;
      modalRef.current
        ?.querySelector<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
        ?.focus();

      function handleKeyDown(e: KeyboardEvent) {
        if (e.key === 'Escape') {
          e.preventDefault();
          onClose();
          return;
        }

        if (e.key === 'Tab' && modalRef.current) {
          const focusables = modalRef.current.querySelectorAll<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          if (focusables.length === 0) return;

          const first = focusables[0];
          const last = focusables[focusables.length - 1];

          if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
          } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }

      window.addEventListener('keydown', handleKeyDown);
      return () => {
        window.removeEventListener('keydown', handleKeyDown);
        previousFocusRef.current?.focus();
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen || !result) return null;

  const handleCopySummary = async () => {
    const summaryText = `/*
 * Time Complexity: ${result.timeComplexity} (${result.timeClassification})
 * Space Complexity: ${result.spaceComplexity} (${result.spaceClassification})
 *
 * ${result.explanation.replace(/\n\n/g, '\n * ')}
 */`;
    try {
      await navigator.clipboard.writeText(summaryText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const getTimeTheme = (rank: ComplexityRank) => {
    switch (rank) {
      case ComplexityRank.O_1:
      case ComplexityRank.O_LOG_N:
        return {
          bg: 'bg-emerald-500/10 dark:bg-emerald-500/15',
          border: 'border-emerald-500/30',
          text: 'text-emerald-600 dark:text-emerald-400',
          badge:
            'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
        };
      case ComplexityRank.O_N:
        return {
          bg: 'bg-blue-500/10 dark:bg-blue-500/15',
          border: 'border-blue-500/30',
          text: 'text-blue-600 dark:text-blue-400',
          badge:
            'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30',
        };
      case ComplexityRank.O_N_LOG_N:
        return {
          bg: 'bg-amber-500/10 dark:bg-amber-500/15',
          border: 'border-amber-500/30',
          text: 'text-amber-600 dark:text-amber-400',
          badge:
            'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
        };
      case ComplexityRank.O_N_2:
      case ComplexityRank.O_N_3:
        return {
          bg: 'bg-rose-500/10 dark:bg-rose-500/15',
          border: 'border-rose-500/30',
          text: 'text-rose-600 dark:text-rose-400',
          badge:
            'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30',
        };
      case ComplexityRank.O_2_N:
      case ComplexityRank.O_N_FACT:
      default:
        return {
          bg: 'bg-purple-500/10 dark:bg-purple-500/15',
          border: 'border-purple-500/30',
          text: 'text-purple-600 dark:text-purple-400',
          badge:
            'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30',
        };
    }
  };

  const getSpaceTheme = (rank: ComplexityRank) => {
    switch (rank) {
      case ComplexityRank.O_1:
        return {
          bg: 'bg-emerald-500/10 dark:bg-emerald-500/15',
          border: 'border-emerald-500/30',
          text: 'text-emerald-600 dark:text-emerald-400',
          badge:
            'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
        };
      case ComplexityRank.O_LOG_N:
      case ComplexityRank.O_N:
        return {
          bg: 'bg-blue-500/10 dark:bg-blue-500/15',
          border: 'border-blue-500/30',
          text: 'text-blue-600 dark:text-blue-400',
          badge:
            'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30',
        };
      default:
        return {
          bg: 'bg-amber-500/10 dark:bg-amber-500/15',
          border: 'border-amber-500/30',
          text: 'text-amber-600 dark:text-amber-400',
          badge:
            'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
        };
    }
  };

  const timeTheme = getTimeTheme(result.timeRank);
  const spaceTheme = getSpaceTheme(result.spaceRank);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="complexity-modal-title"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150 select-text"
    >
      <div
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl max-h-[90vh] rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-default)] shadow-2xl flex flex-col overflow-hidden transition-all duration-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--border-default)] bg-[var(--bg-app)]/50 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20 shrink-0">
              <Gauge className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2
                  id="complexity-modal-title"
                  className="text-sm font-bold text-[var(--text-primary)] truncate"
                >
                  Complexity Analysis
                </h2>
                {result.isEstimate && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                    Estimate
                  </span>
                )}
              </div>
              <p className="text-xs text-[var(--text-secondary)] truncate">
                Static AST inspection of time and space complexity
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {result.success && (
              <button
                type="button"
                onClick={handleCopySummary}
                title="Copy complexity summary as code comment"
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-[var(--border-default)] bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-emerald-500">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Copy</span>
                  </>
                )}
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              aria-label="Close modal"
              className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 text-xs sm:text-sm">
          {!result.success ? (
            /* Error State */
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 sm:p-5 space-y-3">
              <div className="flex items-center gap-2.5 text-rose-500">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <h3 className="text-sm font-bold">
                  Unable to Analyze: Syntax Error
                </h3>
              </div>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                {result.error ||
                  'The code contains a syntax error preventing static AST parsing.'}
                {result.errorLine && (
                  <span className="ml-1 font-mono font-semibold text-rose-400">
                    (Line {result.errorLine})
                  </span>
                )}
              </p>
              {result.suggestions && result.suggestions.length > 0 && (
                <div className="pt-2 border-t border-rose-500/20 text-xs text-[var(--text-secondary)] space-y-1">
                  <div className="font-semibold text-[var(--text-primary)]">
                    Suggestions:
                  </div>
                  <ul className="list-disc list-inside space-y-0.5">
                    {result.suggestions.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            /* Successful Analysis Results */
            <>
              {/* 1. Complexity Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Time Complexity Card */}
                <div
                  className={`rounded-xl border p-4 sm:p-4.5 flex flex-col justify-between transition-all ${timeTheme.bg} ${timeTheme.border}`}
                >
                  <div className="flex items-center justify-between pb-2 border-b border-black/5 dark:border-white/5">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--text-secondary)]">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Time Complexity</span>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${timeTheme.badge}`}
                    >
                      {result.timeClassification}
                    </span>
                  </div>
                  <div className="pt-3">
                    <div
                      className={`text-3xl sm:text-4xl font-mono font-extrabold tracking-tight ${timeTheme.text}`}
                    >
                      {result.timeComplexity}
                    </div>
                    <p className="text-[11px] text-[var(--text-muted)] mt-1">
                      Estimated runtime growth rate
                    </p>
                  </div>
                </div>

                {/* Space Complexity Card */}
                <div
                  className={`rounded-xl border p-4 sm:p-4.5 flex flex-col justify-between transition-all ${spaceTheme.bg} ${spaceTheme.border}`}
                >
                  <div className="flex items-center justify-between pb-2 border-b border-black/5 dark:border-white/5">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--text-secondary)]">
                      <Database className="w-3.5 h-3.5" />
                      <span>Space Complexity</span>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${spaceTheme.badge}`}
                    >
                      {result.spaceClassification}
                    </span>
                  </div>
                  <div className="pt-3">
                    <div
                      className={`text-3xl sm:text-4xl font-mono font-extrabold tracking-tight ${spaceTheme.text}`}
                    >
                      {result.spaceComplexity}
                    </div>
                    <p className="text-[11px] text-[var(--text-muted)] mt-1">
                      Auxiliary memory & call stack
                    </p>
                  </div>
                </div>
              </div>

              {/* 2. Explanation Section */}
              <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-app)]/60 p-4 sm:p-4.5 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--text-primary)]">
                  <Info className="w-4 h-4 text-amber-500" />
                  <span>Explanation</span>
                </div>
                <div className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed space-y-2">
                  {result.explanation.split('\n\n').map((para, i) => (
                    <p key={i}>{para}</p>
                  ))}
                </div>
              </div>

              {/* 3. Detected Factors Checklist */}
              {result.factors && result.factors.length > 0 && (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Analysis Details & Detected Factors</span>
                    </h3>
                    <span className="text-[11px] text-[var(--text-muted)]">
                      {result.factors.length} factor
                      {result.factors.length > 1 ? 's' : ''} detected
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-2">
                    {result.factors.map((factor, index) => (
                      <div
                        key={index}
                        className="flex items-start justify-between gap-3 p-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] transition-colors text-xs"
                      >
                        <div className="flex items-start gap-2 min-w-0">
                          <span className="text-emerald-500 font-bold shrink-0 mt-0.5">
                            ✓
                          </span>
                          <div className="min-w-0 text-[var(--text-primary)]">
                            <span>{factor.description}</span>
                            {factor.line && (
                              <span className="ml-1.5 px-1.5 py-0.2 rounded text-[10px] font-mono bg-[var(--bg-surface-muted)] border border-[var(--border-subtle)] text-[var(--text-muted)]">
                                Line {factor.line}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-[var(--bg-surface-muted)] text-[var(--text-secondary)] border border-[var(--border-default)]">
                            {factor.order}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 4. Optimization Suggestions */}
              {result.suggestions && result.suggestions.length > 0 && (
                <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-500">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Optimization Suggestions</span>
                  </div>
                  <ul className="list-disc list-inside space-y-1 text-xs text-[var(--text-secondary)] leading-relaxed">
                    {result.suggestions.map((suggestion, idx) => (
                      <li key={idx}>{suggestion}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* 5. Notes */}
              {result.notes && result.notes.length > 0 && (
                <div className="text-[11px] text-[var(--text-muted)] space-y-1 border-t border-[var(--border-subtle)] pt-3">
                  {result.notes.map((note, idx) => (
                    <p key={idx}>{note}</p>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-[var(--border-default)] bg-[var(--bg-app)]/50 shrink-0">
          <a
            href={getComplexityIssueUrl(result, codeSnippet)}
            target="_blank"
            rel="noopener noreferrer"
            title="Report incorrect complexity analysis on GitHub"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-[var(--border-default)] bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] text-[var(--text-secondary)] hover:text-rose-500 dark:hover:text-rose-400 transition-colors cursor-pointer"
          >
            <Bug className="w-3.5 h-3.5 text-rose-500" />
            <span>Raise Issue</span>
            <ExternalLink className="w-3 h-3 text-[var(--text-muted)]" />
          </a>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-black shadow-xs transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default memo(ComplexityModal);
