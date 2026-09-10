import { memo } from 'react';
import { Link, useLocation } from 'react-router';

interface FooterProps {
  className?: string;
  hasMarginTop?: boolean;
}

function Footer({ className = '', hasMarginTop }: FooterProps) {
  const location = useLocation();
  const isLearnPage = location.pathname.startsWith('/learn');
  const applyMarginTop =
    hasMarginTop !== undefined ? hasMarginTop : !isLearnPage;

  return (
    <footer
      className={`w-full border-t border-[var(--border-default)] bg-[var(--bg-surface)] py-3.5 transition-colors duration-150 text-[11px] ${
        applyMarginTop ? 'mt-8' : 'mt-0'
      } ${className}`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-[var(--text-secondary)]">
        <div className="flex flex-col sm:flex-row items-center gap-2 text-center sm:text-left">
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded border border-amber-500/40 bg-amber-500/10 flex items-center justify-center text-amber-500 font-mono text-[9px] font-bold">
              JS
            </div>
            <span className="font-semibold text-[var(--text-primary)]">
              RunJS
            </span>
          </div>
          <span className="hidden sm:inline text-[var(--border-default)]">
            |
          </span>
          <span className="text-[var(--text-muted)]">
            Client-side JavaScript, TypeScript & React Playground
          </span>
        </div>

        <div className="flex flex-wrap items-center justify-center sm:justify-end gap-x-3.5 gap-y-1 text-[var(--text-muted)]">
          <Link
            to="/privacy"
            className="hover:text-[var(--text-primary)] transition-colors"
          >
            Privacy
          </Link>
          <Link
            to="/terms"
            className="hover:text-[var(--text-primary)] transition-colors"
          >
            Terms
          </Link>
          <Link
            to="/kishorekumar"
            className="hover:text-[var(--text-primary)] transition-colors"
          >
            Creator
          </Link>
          <Link
            to="/about"
            className="hover:text-[var(--text-primary)] transition-colors"
          >
            About & Credits
          </Link>
          <Link
            to="https://www.linkedin.com/company/runjs/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[var(--text-primary)] transition-colors"
          >
            LinkedIn
          </Link>
          <span>© {new Date().getFullYear()}</span>
        </div>
      </div>
    </footer>
  );
}

export default memo(Footer);
