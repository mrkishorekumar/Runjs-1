import React, { memo, useEffect, useRef, useState } from 'react';
import useTheme from '../hook/useTheme';
import { ThemeMode } from '../context/ThemeContext';
import { Sun, Moon, Monitor, Check } from 'lucide-react';

interface ThemeSelectorProps {
  compact?: boolean;
  className?: string;
}

const themeOptions: {
  value: ThemeMode;
  label: string;
  icon: React.ReactNode;
}[] = [
  { value: 'light', label: 'Light', icon: <Sun className="w-3.5 h-3.5" /> },
  { value: 'dark', label: 'Dark', icon: <Moon className="w-3.5 h-3.5" /> },
  {
    value: 'system',
    label: 'System',
    icon: <Monitor className="w-3.5 h-3.5" />,
  },
];

function ThemeSelector({
  compact = false,
  className = '',
}: ThemeSelectorProps) {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const getCurrentIcon = () => {
    if (theme === 'system') {
      return <Monitor className="w-4 h-4" />;
    }
    return resolvedTheme === 'dark' ? (
      <Moon className="w-4 h-4" />
    ) : (
      <Sun className="w-4 h-4" />
    );
  };

  return (
    <div
      className={`relative inline-block text-left ${className}`}
      ref={dropdownRef}
    >
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Select theme"
        aria-haspopup="true"
        aria-expanded={isOpen}
        title={`Theme: ${theme.charAt(0).toUpperCase() + theme.slice(1)} (${resolvedTheme})`}
        className={`flex items-center justify-center gap-1.5 rounded-md border border-[var(--border-default)] bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors focus:outline-none focus:ring-1 focus:ring-[var(--border-focus)] ${
          compact ? 'p-1.5' : 'px-2 py-1 text-xs font-medium'
        }`}
      >
        {getCurrentIcon()}
        {!compact && (
          <span className="capitalize hidden sm:inline text-xs">{theme}</span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-1 w-32 origin-top-right rounded-md border border-[var(--border-default)] bg-[var(--bg-surface-elevated)] p-1 shadow-md animate-in fade-in zoom-in-95 duration-100">
          <div className="text-[10px] font-mono font-semibold text-[var(--text-muted)] px-2 py-1 uppercase tracking-wider border-b border-[var(--border-subtle)] mb-0.5">
            Theme
          </div>
          {themeOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                setTheme(opt.value);
                setIsOpen(false);
              }}
              className={`flex w-full items-center justify-between rounded px-2 py-1 text-xs font-medium transition-colors cursor-pointer ${
                theme === opt.value
                  ? 'bg-[var(--bg-surface-active)] text-[var(--text-primary)] font-semibold'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-primary)]'
              }`}
            >
              <div className="flex items-center gap-2">
                {opt.icon}
                <span>{opt.label}</span>
              </div>
              {theme === opt.value && (
                <Check className="w-3.5 h-3.5 text-amber-500" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default memo(ThemeSelector);
