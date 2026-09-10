import { memo, useState, useRef, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'react-router';
import {
  playgroundLinks,
  interviewLinks,
  primaryNavLinks,
  moreNavLinks,
} from '../utils/masterData';
import ThemeSelector from './ThemeSelector';
import {
  Menu,
  X,
  Play,
  Code2,
  ChevronDown,
  Globe,
  Atom,
  Info,
  Trash2,
  ExternalLink,
  Shield,
  FileText,
  FileQuestion,
  Brain,
  RotateCw,
  Boxes,
  Download,
  User,
} from 'lucide-react';
import { usePwaInstall } from '../hook/usePwaInstall';

function Navbar() {
  const location = useLocation();
  const { isInstallable, isInstalled, openInstallModal } = usePwaInstall();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<
    'playgrounds' | 'interview' | 'more' | null
  >(null);

  const navRef = useRef<HTMLDivElement>(null);
  const dropdownCloseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

  // Close dropdown on outside click or Escape key
  useEffect(() => {
    const handlePointerDown = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpenDropdown(null);
        setMobileMenuOpen(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Close menus on route change
  useEffect(() => {
    setOpenDropdown(null);
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const handleMouseEnter = useCallback(
    (menu: 'playgrounds' | 'interview' | 'more') => {
      if (dropdownCloseTimeoutRef.current) {
        clearTimeout(dropdownCloseTimeoutRef.current);
        dropdownCloseTimeoutRef.current = null;
      }
      setOpenDropdown(menu);
    },
    []
  );

  const handleMouseLeave = useCallback(() => {
    dropdownCloseTimeoutRef.current = setTimeout(() => {
      setOpenDropdown(null);
    }, 150);
  }, []);

  const toggleDropdown = (menu: 'playgrounds' | 'interview' | 'more') => {
    if (dropdownCloseTimeoutRef.current) {
      clearTimeout(dropdownCloseTimeoutRef.current);
      dropdownCloseTimeoutRef.current = null;
    }
    setOpenDropdown((prev) => (prev === menu ? null : menu));
  };

  const prefetchRoute = useCallback((link: string) => {
    if (link === '/dashboard') {
      import('../page/Dashboard');
    }
  }, []);

  // Determine active states for dropdown triggers
  const isPlaygroundActive = playgroundLinks.some(
    (item) =>
      location.pathname === item.link ||
      location.pathname.startsWith(`${item.link}/`)
  );

  const isInterviewActive =
    location.pathname === '/interview' ||
    location.pathname.startsWith('/interview/') ||
    location.pathname === '/output-questions' ||
    location.pathname.startsWith('/output-questions/');

  const isMoreActive = moreNavLinks.some(
    (item) => !item.isExternal && location.pathname === item.link
  );

  // Helper to render interview custom icon badges
  const renderInterviewIcon = (iconName: string) => {
    switch (iconName) {
      case 'qa':
        return (
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 flex items-center justify-center shrink-0">
            <FileQuestion className="w-4 h-4" />
          </div>
        );
      case 'quiz':
        return (
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center justify-center shrink-0">
            <Brain className="w-4 h-4" />
          </div>
        );
      default:
        return null;
    }
  };

  // Helper to render playground custom icon badges
  const renderPlaygroundIcon = (iconName: string) => {
    switch (iconName) {
      case 'js':
        return (
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center justify-center font-mono text-xs font-black shrink-0">
            JS
          </div>
        );
      case 'ts':
        return (
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-500 border border-blue-500/20 flex items-center justify-center font-mono text-xs font-black shrink-0">
            TS
          </div>
        );
      case 'html':
        return (
          <div className="w-8 h-8 rounded-lg bg-orange-500/10 text-orange-500 border border-orange-500/20 flex items-center justify-center shrink-0">
            <Globe className="w-4 h-4" />
          </div>
        );
      case 'react':
        return (
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-500 border border-cyan-500/20 flex items-center justify-center shrink-0">
            <Atom className="w-4 h-4" />
          </div>
        );
      case 'visualizer':
        return (
          <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-500 border border-purple-500/20 flex items-center justify-center shrink-0">
            <RotateCw className="w-4 h-4" />
          </div>
        );
      case 'context':
        return (
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center justify-center shrink-0">
            <Boxes className="w-4 h-4" />
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 rounded-lg bg-gray-500/10 text-gray-500 border border-gray-500/20 flex items-center justify-center shrink-0">
            <Code2 className="w-4 h-4" />
          </div>
        );
    }
  };

  // Helper to render More menu icons
  const renderMoreIcon = (iconName: string) => {
    switch (iconName) {
      case 'creator':
        return (
          <div className="w-7 h-7 rounded-md bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center justify-center shrink-0">
            <User className="w-3.5 h-3.5" />
          </div>
        );
      case 'about':
        return (
          <div className="w-7 h-7 rounded-md bg-purple-500/10 text-purple-500 border border-purple-500/20 flex items-center justify-center shrink-0">
            <Info className="w-3.5 h-3.5" />
          </div>
        );
      case 'privacy':
        return (
          <div className="w-7 h-7 rounded-md bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center justify-center shrink-0">
            <Shield className="w-3.5 h-3.5" />
          </div>
        );
      case 'terms':
        return (
          <div className="w-7 h-7 rounded-md bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center justify-center shrink-0">
            <FileText className="w-3.5 h-3.5" />
          </div>
        );
      case 'bin':
        return (
          <div className="w-7 h-7 rounded-md bg-rose-500/10 text-rose-500 border border-rose-500/20 flex items-center justify-center shrink-0">
            <Trash2 className="w-3.5 h-3.5" />
          </div>
        );
      case 'github':
        return (
          <div className="w-7 h-7 rounded-md bg-neutral-500/10 text-[var(--text-secondary)] border border-[var(--border-default)] flex items-center justify-center shrink-0">
            <ExternalLink className="w-3.5 h-3.5" />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <header
      ref={navRef}
      className="sticky top-0 z-40 w-full border-b border-[var(--border-default)] bg-[var(--bg-surface)]/95 backdrop-blur-md transition-colors duration-150"
    >
      <div className="max-w-7xl mx-auto flex h-12 items-center justify-between px-3 sm:px-5 lg:px-6">
        {/* Left Side: Brand Logo */}
        <div className="flex items-center justify-start shrink-0">
          <Link
            to="/"
            className="flex items-center gap-2 group rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)]/50"
          >
            <div className="flex items-center justify-center w-7 h-7 rounded-md bg-[var(--bg-surface-elevated)] border border-amber-500/40 text-amber-500 group-hover:border-amber-500 transition-colors">
              <Code2 className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold tracking-tight text-[var(--text-primary)]">
                Run<span className="text-amber-500">JS</span>
              </span>
              <span className="hidden sm:inline-block px-1 py-0.2 text-[9px] font-mono uppercase tracking-wider rounded border border-[var(--border-default)] bg-[var(--bg-surface-muted)] text-[var(--text-muted)]">
                v2.0
              </span>
            </div>
          </Link>
        </div>

        {/* Center: Desktop Nav Items */}
        <nav
          className="hidden lg:flex items-center justify-center gap-1"
          aria-label="Main navigation"
        >
          {/* 1. Playgrounds Dropdown */}
          <div
            className="relative"
            onMouseEnter={() => handleMouseEnter('playgrounds')}
            onMouseLeave={handleMouseLeave}
          >
            <button
              type="button"
              onClick={() => toggleDropdown('playgrounds')}
              aria-expanded={openDropdown === 'playgrounds'}
              aria-haspopup="true"
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-all duration-150 cursor-pointer ${
                isPlaygroundActive || openDropdown === 'playgrounds'
                  ? 'bg-[var(--bg-surface-active)] text-[var(--text-primary)] font-semibold'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]'
              }`}
            >
              <span>Playgrounds</span>
              <ChevronDown
                className={`w-3.5 h-3.5 text-[var(--text-muted)] transition-transform duration-150 ${
                  openDropdown === 'playgrounds'
                    ? 'rotate-180 text-amber-500'
                    : ''
                }`}
              />
            </button>

            {/* Playgrounds Menu Panel */}
            {openDropdown === 'playgrounds' && (
              <div
                className="absolute left-0 top-full pt-1.5 w-76 z-50 animate-in fade-in zoom-in-95 duration-120"
                onMouseEnter={() => handleMouseEnter('playgrounds')}
                onMouseLeave={handleMouseLeave}
              >
                <div className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface-elevated)] p-1.5 shadow-lg">
                  <div className="px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)] border-b border-[var(--border-subtle)] mb-1">
                    Playgrounds & Visualizers
                  </div>

                  <div className="space-y-0.5">
                    {playgroundLinks.map((item) => {
                      const isActive =
                        location.pathname === item.link ||
                        location.pathname.startsWith(`${item.link}/`);
                      return (
                        <Link
                          key={item.link}
                          to={item.link}
                          onClick={() => setOpenDropdown(null)}
                          className={`flex items-start gap-2.5 p-2 rounded-md transition-colors ${
                            isActive
                              ? 'bg-amber-500/10 border border-amber-500/25 text-[var(--text-primary)]'
                              : 'hover:bg-[var(--bg-surface-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                          }`}
                        >
                          {renderPlaygroundIcon(item.iconName)}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-semibold text-[var(--text-primary)]">
                                {item.title}
                              </span>
                              {item.badge && (
                                <span className="px-1.5 py-0.2 text-[9px] font-mono rounded bg-[var(--bg-surface-active)] text-[var(--text-muted)] border border-[var(--border-default)]">
                                  {item.badge}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-[var(--text-muted)] leading-snug mt-0.5 line-clamp-1">
                              {item.description}
                            </p>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 2. Primary Direct Nav Links: Learn JS & Problems */}
          {primaryNavLinks.slice(0, 2).map((item) => {
            const isActive =
              item.link === '/'
                ? location.pathname === '/'
                : location.pathname === item.link ||
                  location.pathname.startsWith(`${item.link}/`);

            return (
              <Link
                key={item.link}
                to={item.link}
                className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-all duration-150 ${
                  isActive
                    ? 'bg-[var(--bg-surface-active)] text-[var(--text-primary)] font-semibold'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]'
                }`}
              >
                <span>{item.title}</span>
                {item.badge && (
                  <span className="px-1.5 py-0.2 text-[9px] font-mono rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}

          {/* 3. Interview Dropdown (Technical Q&A, Output Quiz) */}
          <div
            className="relative"
            onMouseEnter={() => handleMouseEnter('interview')}
            onMouseLeave={handleMouseLeave}
          >
            <button
              type="button"
              onClick={() => toggleDropdown('interview')}
              aria-expanded={openDropdown === 'interview'}
              aria-haspopup="true"
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-all duration-150 cursor-pointer ${
                isInterviewActive || openDropdown === 'interview'
                  ? 'bg-[var(--bg-surface-active)] text-[var(--text-primary)] font-semibold'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]'
              }`}
            >
              <span>Interview</span>
              <ChevronDown
                className={`w-3.5 h-3.5 text-[var(--text-muted)] transition-transform duration-150 ${
                  openDropdown === 'interview'
                    ? 'rotate-180 text-amber-500'
                    : ''
                }`}
              />
            </button>

            {/* Interview Menu Panel */}
            {openDropdown === 'interview' && (
              <div
                className="absolute left-0 top-full pt-1.5 w-76 z-50 animate-in fade-in zoom-in-95 duration-120"
                onMouseEnter={() => handleMouseEnter('interview')}
                onMouseLeave={handleMouseLeave}
              >
                <div className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface-elevated)] p-1.5 shadow-lg">
                  <div className="px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)] border-b border-[var(--border-subtle)] mb-1">
                    Interview Practice
                  </div>

                  <div className="space-y-0.5">
                    {interviewLinks.map((item) => {
                      const isActive =
                        location.pathname === item.link ||
                        location.pathname.startsWith(`${item.link}/`);
                      return (
                        <Link
                          key={item.link}
                          to={item.link}
                          onClick={() => setOpenDropdown(null)}
                          className={`flex items-start gap-2.5 p-2 rounded-md transition-colors ${
                            isActive
                              ? 'bg-amber-500/10 border border-amber-500/25 text-[var(--text-primary)]'
                              : 'hover:bg-[var(--bg-surface-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                          }`}
                        >
                          {renderInterviewIcon(item.iconName)}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-semibold text-[var(--text-primary)]">
                                {item.title}
                              </span>
                              {item.badge && (
                                <span className="px-1.5 py-0.2 text-[9px] font-mono rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25">
                                  {item.badge}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-[var(--text-muted)] leading-snug mt-0.5 line-clamp-1">
                              {item.description}
                            </p>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 4. Primary Direct Nav Link: Dashboard */}
          {primaryNavLinks.slice(2).map((item) => {
            const isActive =
              location.pathname === item.link ||
              location.pathname.startsWith(`${item.link}/`);

            return (
              <Link
                key={item.link}
                to={item.link}
                onMouseEnter={() => prefetchRoute(item.link)}
                onFocus={() => prefetchRoute(item.link)}
                onTouchStart={() => prefetchRoute(item.link)}
                className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-all duration-150 ${
                  isActive
                    ? 'bg-[var(--bg-surface-active)] text-[var(--text-primary)] font-semibold'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]'
                }`}
              >
                <span>{item.title}</span>
              </Link>
            );
          })}

          {/* 5. More Dropdown (About, Bin, GitHub) */}
          <div
            className="relative"
            onMouseEnter={() => handleMouseEnter('more')}
            onMouseLeave={handleMouseLeave}
          >
            <button
              type="button"
              onClick={() => toggleDropdown('more')}
              aria-expanded={openDropdown === 'more'}
              aria-haspopup="true"
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-all duration-150 cursor-pointer ${
                isMoreActive || openDropdown === 'more'
                  ? 'bg-[var(--bg-surface-active)] text-[var(--text-primary)] font-semibold'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]'
              }`}
            >
              <span>More</span>
              <ChevronDown
                className={`w-3.5 h-3.5 text-[var(--text-muted)] transition-transform duration-150 ${
                  openDropdown === 'more' ? 'rotate-180 text-amber-500' : ''
                }`}
              />
            </button>

            {/* More Menu Panel */}
            {openDropdown === 'more' && (
              <div
                className="absolute left-0 top-full pt-1.5 w-64 z-50 animate-in fade-in zoom-in-95 duration-120"
                onMouseEnter={() => handleMouseEnter('more')}
                onMouseLeave={handleMouseLeave}
              >
                <div className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface-elevated)] p-1.5 shadow-lg">
                  <div className="px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)] border-b border-[var(--border-subtle)] mb-1">
                    Utilities & Links
                  </div>

                  <div className="space-y-0.5">
                    {moreNavLinks.map((item) => {
                      const isActive =
                        !item.isExternal && location.pathname === item.link;

                      if (item.isExternal) {
                        return (
                          <a
                            key={item.title}
                            href={item.link}
                            target="_blank"
                            rel="noreferrer noopener"
                            onClick={() => setOpenDropdown(null)}
                            className="flex items-center gap-2 p-1.5 rounded-md text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors"
                          >
                            {renderMoreIcon(item.iconName)}
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-semibold text-[var(--text-primary)] flex items-center justify-between">
                                <span>{item.title}</span>
                                <ExternalLink className="w-3 h-3 text-[var(--text-muted)]" />
                              </div>
                              <p className="text-[11px] text-[var(--text-muted)] line-clamp-1">
                                {item.description}
                              </p>
                            </div>
                          </a>
                        );
                      }

                      return (
                        <Link
                          key={item.link}
                          to={item.link}
                          onClick={() => setOpenDropdown(null)}
                          className={`flex items-center gap-2 p-1.5 rounded-md transition-colors ${
                            isActive
                              ? 'bg-[var(--bg-surface-active)] text-[var(--text-primary)] font-semibold'
                              : 'hover:bg-[var(--bg-surface-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                          }`}
                        >
                          {renderMoreIcon(item.iconName)}
                          <div className="flex-1 min-w-0">
                            <span className="text-xs font-semibold text-[var(--text-primary)] block">
                              {item.title}
                            </span>
                            <p className="text-[11px] text-[var(--text-muted)] line-clamp-1">
                              {item.description}
                            </p>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </nav>

        {/* Right Side: Quick Action + Theme Selector + Mobile Menu Trigger */}
        <div className="flex items-center justify-end gap-1.5 shrink-0">
          {/* Start Coding CTA (hidden on active playground pages) */}
          {!isPlaygroundActive && (
            <Link
              to="/js"
              className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-black text-xs font-semibold transition-colors"
            >
              <Play className="w-3 h-3 fill-black" />
              <span>Open Editor</span>
            </Link>
          )}

          {/* Install App Button (Desktop) */}
          {isInstallable && !isInstalled && (
            <button
              type="button"
              onClick={openInstallModal}
              title="Install RunJS as Desktop App"
              className="hidden sm:inline-flex items-center gap-1.5 px-2 py-1 rounded-md border border-[var(--border-default)] bg-[var(--bg-surface-muted)] hover:bg-[var(--bg-surface-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xs font-medium transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span>Install</span>
            </button>
          )}

          {/* Theme Selector Component */}
          <ThemeSelector />

          {/* Mobile Menu Trigger */}
          <button
            type="button"
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-1.5 rounded-lg border border-[var(--border-default)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)]/40"
          >
            {mobileMenuOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-[var(--border-default)] bg-[var(--bg-surface-elevated)] px-4 py-4 shadow-xl animate-in slide-in-from-top-2 duration-150 max-h-[calc(100vh-3.5rem)] overflow-y-auto">
          <div className="space-y-4">
            {/* Section 1: Playgrounds */}
            <div>
              <div className="px-2 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                Playgrounds
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                {playgroundLinks.map((item) => {
                  const isActive =
                    location.pathname === item.link ||
                    location.pathname.startsWith(`${item.link}/`);
                  return (
                    <Link
                      key={item.link}
                      to={item.link}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-2.5 p-2 rounded-xl transition-colors ${
                        isActive
                          ? 'bg-amber-500/10 border border-amber-500/20 text-[var(--text-primary)] font-semibold'
                          : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]'
                      }`}
                    >
                      {renderPlaygroundIcon(item.iconName)}
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-semibold text-[var(--text-primary)]">
                          {item.title}
                        </span>
                        <p className="text-[10px] text-[var(--text-secondary)] line-clamp-1">
                          {item.description}
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Section 2: Learning & Interview Prep */}
            <div>
              <div className="px-2 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                Navigation
              </div>
              <div className="space-y-1">
                {/* Learn JS & Problems */}
                {primaryNavLinks.slice(0, 2).map((item) => {
                  const isActive =
                    item.link === '/'
                      ? location.pathname === '/'
                      : location.pathname === item.link ||
                        location.pathname.startsWith(`${item.link}/`);
                  return (
                    <Link
                      key={item.link}
                      to={item.link}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center justify-between p-2.5 rounded-xl text-xs font-medium transition-colors ${
                        isActive
                          ? 'bg-[var(--bg-surface-active)] text-[var(--text-primary)] font-semibold'
                          : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]'
                      }`}
                    >
                      <span>{item.title}</span>
                      {item.badge && (
                        <span className="px-1.5 py-0.2 text-[9px] font-bold uppercase rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}

                {/* Interview Links (Q&A and Output Quiz) */}
                {interviewLinks.map((item) => {
                  const isActive =
                    location.pathname === item.link ||
                    location.pathname.startsWith(`${item.link}/`);
                  return (
                    <Link
                      key={item.link}
                      to={item.link}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center justify-between p-2.5 rounded-xl text-xs font-medium transition-colors ${
                        isActive
                          ? 'bg-[var(--bg-surface-active)] text-[var(--text-primary)] font-semibold'
                          : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {renderInterviewIcon(item.iconName)}
                        <span>{item.title}</span>
                      </div>
                      {item.badge && (
                        <span className="px-1.5 py-0.2 text-[9px] font-bold uppercase rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}

                {/* Dashboard */}
                {primaryNavLinks.slice(2).map((item) => {
                  const isActive =
                    location.pathname === item.link ||
                    location.pathname.startsWith(`${item.link}/`);
                  return (
                    <Link
                      key={item.link}
                      to={item.link}
                      onMouseEnter={() => prefetchRoute(item.link)}
                      onFocus={() => prefetchRoute(item.link)}
                      onTouchStart={() => prefetchRoute(item.link)}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center justify-between p-2.5 rounded-xl text-xs font-medium transition-colors ${
                        isActive
                          ? 'bg-[var(--bg-surface-active)] text-[var(--text-primary)] font-semibold'
                          : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]'
                      }`}
                    >
                      <span>{item.title}</span>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Section 3: More / Utilities */}
            <div className="pt-2 border-t border-[var(--border-subtle)]">
              <div className="px-2 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                More
              </div>
              <div className="space-y-1">
                {moreNavLinks.map((item) => {
                  if (item.isExternal) {
                    return (
                      <a
                        key={item.title}
                        href={item.link}
                        target="_blank"
                        rel="noreferrer noopener"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-2.5 p-2 rounded-xl text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]"
                      >
                        {renderMoreIcon(item.iconName)}
                        <span className="flex-1">{item.title}</span>
                        <ExternalLink className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                      </a>
                    );
                  }

                  const isActive = location.pathname === item.link;
                  return (
                    <Link
                      key={item.link}
                      to={item.link}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-2.5 p-2 rounded-xl text-xs font-medium transition-colors ${
                        isActive
                          ? 'bg-[var(--bg-surface-active)] text-[var(--text-primary)] font-semibold'
                          : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]'
                      }`}
                    >
                      {renderMoreIcon(item.iconName)}
                      <span>{item.title}</span>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Mobile Install App Button */}
            {isInstallable && !isInstalled && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    openInstallModal();
                  }}
                  className="flex items-center justify-between w-full py-2.5 px-3 rounded-xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-bold shadow-xs transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Download className="w-4 h-4 text-amber-500 shrink-0" />
                    <span>Install RunJS App</span>
                  </div>
                  <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase rounded bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                    PWA
                  </span>
                </button>
              </div>
            )}

            {/* Mobile Start Coding Action */}
            <div className="pt-2">
              <Link
                to="/js"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center gap-2 w-full py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-black text-xs font-bold shadow-xs transition-colors"
              >
                <Play className="w-4 h-4 fill-black" />
                <span>Start Coding Now</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

export default memo(Navbar);
