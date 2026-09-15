import { memo, useState, useRef, useEffect, useCallback } from 'react';
import { Save, Check, Loader2, Copy, ChevronDown } from 'lucide-react';

export interface SavePlaygroundButtonProps {
  isSaved: boolean;
  isDirty: boolean;
  isSaving: boolean;
  onSave: () => void;
  onSaveCopy?: () => void;
  playgroundType: 'js' | 'ts' | 'react' | 'html';
  shortcutText?: string;
}

function SavePlaygroundButton({
  isSaved,
  isSaving,
  onSave,
  onSaveCopy,
}: SavePlaygroundButtonProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const menuTriggerRef = useRef<HTMLButtonElement>(null);
  const menuItemRef = useRef<HTMLButtonElement>(null);

  // Close menu on outside interaction or Escape key
  const closeMenu = useCallback(() => {
    setIsMenuOpen(false);
    menuTriggerRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!isMenuOpen) return;

    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsMenuOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeMenu();
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMenuOpen, closeMenu]);

  // Autofocus first menu item on open for keyboard navigability
  useEffect(() => {
    if (isMenuOpen) {
      menuItemRef.current?.focus();
    }
  }, [isMenuOpen]);

  const hasSplitAction = isSaved && Boolean(onSaveCopy);

  // If this is an unsaved scratchpad, keep the active "Save" button strictly for creating a new playground
  if (!isSaved) {
    return (
      <div className="relative inline-flex items-stretch rounded-lg shadow-xs">
        <button
          type="button"
          onClick={onSave}
          disabled={isSaving}
          title="Save Playground to Dashboard"
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-all duration-150 cursor-pointer disabled:opacity-60 select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/60"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-3 h-3 animate-spin shrink-0 text-[var(--text-secondary)]" />
              <span>Saving...</span>
            </>
          ) : (
            <>
              <Save className="w-3 h-3 shrink-0 text-[var(--text-secondary)]" />
              <span>Save</span>
            </>
          )}
        </button>
      </div>
    );
  }

  // Existing saved playground: Manual save behavior for updating is removed/disabled.
  // Display auto-save status indicator with optional "Save as Copy" dropdown.
  return (
    <div
      ref={containerRef}
      className="relative inline-flex items-stretch rounded-lg shadow-xs"
    >
      {/* Auto-Save Status Indicator */}
      <div
        role="status"
        aria-live="polite"
        title="All changes automatically saved locally"
        className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium select-none border ${
          hasSplitAction
            ? 'rounded-l-lg rounded-r-none border-r-0'
            : 'rounded-lg'
        } ${
          isSaving
            ? 'border-[var(--border-default)] bg-[var(--bg-surface-muted)] text-[var(--text-secondary)] opacity-80 cursor-default'
            : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 cursor-default'
        }`}
      >
        {isSaving ? (
          <>
            <Loader2 className="w-3 h-3 animate-spin shrink-0 text-[var(--text-secondary)]" />
            <span>Saving...</span>
          </>
        ) : (
          <>
            <Check className="w-3 h-3 stroke-[2.5] text-emerald-500 shrink-0" />
            <span>Saved</span>
          </>
        )}
      </div>

      {/* Segmented Chevron Dropdown Trigger for Save as Copy */}
      {hasSplitAction && (
        <>
          <button
            ref={menuTriggerRef}
            type="button"
            onClick={() => setIsMenuOpen((prev) => !prev)}
            aria-haspopup="menu"
            aria-expanded={isMenuOpen}
            aria-controls="save-playground-options-menu"
            aria-label="More save options"
            title="More save options"
            className="flex items-center justify-center px-1.5 border border-l border-l-[var(--border-default)] border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 transition-colors cursor-pointer rounded-r-lg rounded-l-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/60"
          >
            <ChevronDown
              className={`w-3 h-3 transition-transform duration-150 ${isMenuOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {/* Accessible Dropdown Popover */}
          {isMenuOpen && (
            <div
              id="save-playground-options-menu"
              role="menu"
              aria-orientation="vertical"
              className="absolute top-full right-0 mt-1 w-44 rounded-xl bg-[var(--bg-surface-elevated)] border border-[var(--border-default)] shadow-xl py-1 z-50 text-xs animate-in fade-in zoom-in-95 duration-100"
            >
              <button
                ref={menuItemRef}
                role="menuitem"
                type="button"
                onClick={() => {
                  setIsMenuOpen(false);
                  onSaveCopy?.();
                }}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-left text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] focus:bg-[var(--bg-surface-hover)] focus:text-[var(--text-primary)] focus:outline-none transition-colors cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Save as Copy...</span>
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default memo(SavePlaygroundButton);
