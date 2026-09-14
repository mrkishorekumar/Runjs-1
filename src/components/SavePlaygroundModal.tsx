import { memo, useEffect, useRef, useState } from 'react';
import { X, BookmarkPlus, Loader2 } from 'lucide-react';

export interface SavePlaygroundModalProps {
  isOpen: boolean;
  defaultName: string;
  title?: string;
  description?: string;
  playgroundType: 'js' | 'ts' | 'react' | 'html';
  isSaving?: boolean;
  onSave: (name: string) => Promise<unknown> | unknown;
  onClose: () => void;
}

function SavePlaygroundModal({
  isOpen,
  defaultName,
  title = 'Save Playground',
  description,
  playgroundType,
  isSaving = false,
  onSave,
  onClose,
}: SavePlaygroundModalProps) {
  const [name, setName] = useState(defaultName);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isSubmittingRef = useRef(false);

  // Sync default name and select text on open
  useEffect(() => {
    if (isOpen) {
      setName(defaultName);
      setError(null);
      isSubmittingRef.current = false;
      const timer = setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          inputRef.current.select();
        }
      }, 50);

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          onClose();
        }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => {
        clearTimeout(timer);
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isOpen, defaultName, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving || isSubmittingRef.current) return;
    const cleanName = name.trim();
    if (!cleanName) {
      setError('Please enter a playground name.');
      inputRef.current?.focus();
      return;
    }
    setError(null);
    isSubmittingRef.current = true;
    try {
      await onSave(cleanName);
    } finally {
      isSubmittingRef.current = false;
    }
  };

  const getLanguageLabel = () => {
    switch (playgroundType) {
      case 'js':
        return 'JavaScript';
      case 'ts':
        return 'TypeScript';
      case 'react':
        return 'React';
      case 'html':
        return 'HTML/CSS/JS';
      default:
        return 'Code';
    }
  };

  const getAccentColorClasses = () => {
    switch (playgroundType) {
      case 'js':
        return {
          iconBg: 'bg-amber-500/10 border-amber-500/20 text-amber-500',
          badge:
            'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
          button:
            'bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-black',
        };
      case 'ts':
        return {
          iconBg: 'bg-blue-500/10 border-blue-500/20 text-blue-500',
          badge:
            'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
          button: 'bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white',
        };
      case 'react':
        return {
          iconBg: 'bg-cyan-500/10 border-cyan-500/20 text-cyan-500',
          badge:
            'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20',
          button: 'bg-cyan-600 hover:bg-cyan-500 active:bg-cyan-700 text-white',
        };
      case 'html':
        return {
          iconBg: 'bg-orange-500/10 border-orange-500/20 text-orange-500',
          badge:
            'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20',
          button:
            'bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white',
        };
      default:
        return {
          iconBg: 'bg-amber-500/10 border-amber-500/20 text-amber-500',
          badge: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
          button: 'bg-amber-500 hover:bg-amber-600 text-black',
        };
    }
  };

  const colors = getAccentColorClasses();

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="save-playground-modal-title"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div
        className="w-full max-w-md rounded-2xl bg-[var(--bg-surface-elevated)] border border-[var(--border-default)] shadow-2xl overflow-hidden transition-all duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-default)] bg-[var(--bg-surface)]">
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-xl border flex items-center justify-center ${colors.iconBg}`}
            >
              <BookmarkPlus className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2
                  id="save-playground-modal-title"
                  className="text-sm font-bold text-[var(--text-primary)]"
                >
                  {title}
                </h2>
                <span
                  className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-medium border ${colors.badge}`}
                >
                  {getLanguageLabel()}
                </span>
              </div>
              <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                {description ||
                  'Save this playground to your personal dashboard to reopen anytime.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="space-y-1.5">
            <label
              htmlFor="playground-name-input"
              className="block text-xs font-semibold text-[var(--text-secondary)]"
            >
              Playground Name <span className="text-red-500">*</span>
            </label>
            <input
              id="playground-name-input"
              ref={inputRef}
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError(null);
              }}
              placeholder="e.g. My Interview Solution"
              disabled={isSaving}
              className={`w-full px-3 py-2 rounded-lg text-xs font-medium bg-[var(--bg-surface)] border text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none transition-all ${
                error
                  ? 'border-red-500 focus:ring-1 focus:ring-red-500'
                  : 'border-[var(--border-default)] focus:border-amber-500 focus:ring-1 focus:ring-amber-500'
              }`}
            />
            {error && (
              <p className="text-[11px] text-red-500 font-medium">{error}</p>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-3.5 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xs font-medium transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving || !name.trim()}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold shadow-xs transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${colors.button}`}
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>Save</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default memo(SavePlaygroundModal);
