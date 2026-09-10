import { memo, useState, useRef, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router';
import { curriculum, findLessonLocation } from '../data/curriculum';
import { getLessonBySlug } from '../data/lessonRegistry';
import {
  ChevronRight,
  ChevronDown,
  Check,
  Home,
  BookOpen,
  Layers,
} from 'lucide-react';

interface DynamicBreadcrumbProps {
  currentSlug: string;
}

type DropdownType = 'part' | 'topic' | 'lesson' | null;

function DynamicBreadcrumb({ currentSlug }: DynamicBreadcrumbProps) {
  const navigate = useNavigate();
  const [openMenu, setOpenMenu] = useState<DropdownType>(null);
  const containerRef = useRef<HTMLElement | null>(null);

  const location = findLessonLocation(currentSlug);
  const currentLesson = getLessonBySlug(currentSlug);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpenMenu(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close dropdown on Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpenMenu(null);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSelect = useCallback(
    (targetSlug: string) => {
      setOpenMenu(null);
      navigate(`/learn/${targetSlug}`);
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    },
    [navigate]
  );

  if (!location || !currentLesson) {
    return null;
  }

  const { part, topic } = location;
  const firstLessonOfPart = part.topics[0]?.lessonSlugs[0] ?? currentSlug;
  const firstLessonOfTopic = topic.lessonSlugs[0] ?? currentSlug;

  return (
    <nav
      ref={containerRef}
      aria-label="Curriculum Breadcrumb"
      className="flex items-center gap-1 text-[11px] sm:text-xs text-[var(--text-secondary)] mb-4 flex-wrap select-none relative z-30"
    >
      {/* Home / Learn root */}
      <Link
        to="/learn"
        className="flex items-center gap-1 px-1.5 py-1 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors"
        title="Go to Learning Dashboard"
      >
        <Home className="w-3.5 h-3.5" />
        <span className="font-medium">Learn</span>
      </Link>

      <ChevronRight className="w-3 h-3 text-[var(--text-muted)] opacity-50 shrink-0" />

      {/* Part segment with dropdown */}
      <div className="relative flex items-center">
        <Link
          to={`/learn/${firstLessonOfPart}`}
          className="px-1.5 py-1 rounded-md hover:bg-[var(--bg-surface-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors font-medium truncate max-w-[140px] sm:max-w-[200px]"
          title={`Part ${part.partNumber}: ${part.title}`}
        >
          {part.title}
        </Link>
        <button
          type="button"
          onClick={() => setOpenMenu(openMenu === 'part' ? null : 'part')}
          aria-expanded={openMenu === 'part'}
          aria-label="Switch Part"
          className={`p-1 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors cursor-pointer ${
            openMenu === 'part'
              ? 'bg-[var(--bg-surface-hover)] text-[var(--text-primary)]'
              : ''
          }`}
        >
          <ChevronDown className="w-3 h-3" />
        </button>

        {/* Part Dropdown Popover */}
        {openMenu === 'part' && (
          <div className="absolute top-full left-0 mt-1.5 w-72 max-h-80 overflow-y-auto rounded-md border border-[var(--border-default)] bg-[var(--bg-surface)] p-1.5 shadow-lg z-50">
            <div className="px-2 py-1 text-[10px] font-mono text-[var(--text-muted)] border-b border-[var(--border-subtle)] mb-1">
              select_curriculum_part
            </div>
            {curriculum.map((p) => {
              const isCurrent = p.slug === part.slug;
              const targetSlug = p.topics[0]?.lessonSlugs[0];
              if (!targetSlug) return null;

              return (
                <button
                  key={p.slug}
                  type="button"
                  onClick={() => handleSelect(targetSlug)}
                  className={`w-full flex items-center justify-between gap-2 px-2 py-1.5 rounded-md text-left text-xs transition-colors cursor-pointer ${
                    isCurrent
                      ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <BookOpen className="w-3.5 h-3.5 shrink-0 text-amber-500/70" />
                    <span className="truncate">
                      Part {p.partNumber}: {p.title}
                    </span>
                  </div>
                  {isCurrent && (
                    <Check className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <ChevronRight className="w-3 h-3 text-[var(--text-muted)] opacity-50 shrink-0" />

      {/* Topic segment with dropdown */}
      <div className="relative flex items-center">
        <Link
          to={`/learn/${firstLessonOfTopic}`}
          className="px-1.5 py-1 rounded-md hover:bg-[var(--bg-surface-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors font-medium truncate max-w-[130px] sm:max-w-[180px]"
          title={topic.title}
        >
          {topic.title}
        </Link>
        <button
          type="button"
          onClick={() => setOpenMenu(openMenu === 'topic' ? null : 'topic')}
          aria-expanded={openMenu === 'topic'}
          aria-label="Switch Topic"
          className={`p-1 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors cursor-pointer ${
            openMenu === 'topic'
              ? 'bg-[var(--bg-surface-hover)] text-[var(--text-primary)]'
              : ''
          }`}
        >
          <ChevronDown className="w-3 h-3" />
        </button>

        {/* Topic Dropdown Popover */}
        {openMenu === 'topic' && (
          <div className="absolute top-full left-0 mt-1.5 w-64 max-h-80 overflow-y-auto rounded-md border border-[var(--border-default)] bg-[var(--bg-surface)] p-1.5 shadow-lg z-50">
            <div className="px-2 py-1 text-[10px] font-mono text-[var(--text-muted)] border-b border-[var(--border-subtle)] mb-1">
              topics_in_{part.slug}
            </div>
            {part.topics.map((t) => {
              const isCurrent = t.slug === topic.slug;
              const targetSlug = t.lessonSlugs[0];
              if (!targetSlug) return null;

              return (
                <button
                  key={t.slug}
                  type="button"
                  onClick={() => handleSelect(targetSlug)}
                  className={`w-full flex items-center justify-between gap-2 px-2 py-1.5 rounded-md text-left text-xs transition-colors cursor-pointer ${
                    isCurrent
                      ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <Layers className="w-3.5 h-3.5 shrink-0 text-amber-500/70" />
                    <span className="truncate">{t.title}</span>
                  </div>
                  {isCurrent && (
                    <Check className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <ChevronRight className="w-3 h-3 text-[var(--text-muted)] opacity-50 shrink-0" />

      {/* Lesson segment with dropdown */}
      <div className="relative flex items-center">
        <span
          className="px-1.5 py-1 text-[var(--text-primary)] font-semibold truncate max-w-[150px] sm:max-w-[220px]"
          title={currentLesson.title}
        >
          {currentLesson.title}
        </span>
        {topic.lessonSlugs.length > 1 && (
          <button
            type="button"
            onClick={() => setOpenMenu(openMenu === 'lesson' ? null : 'lesson')}
            aria-expanded={openMenu === 'lesson'}
            aria-label="Switch Lesson in this Topic"
            className={`p-1 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors cursor-pointer ${
              openMenu === 'lesson'
                ? 'bg-[var(--bg-surface-hover)] text-[var(--text-primary)]'
                : ''
            }`}
          >
            <ChevronDown className="w-3 h-3" />
          </button>
        )}

        {/* Lesson Dropdown Popover */}
        {openMenu === 'lesson' && (
          <div className="absolute top-full right-0 sm:left-0 sm:right-auto mt-1.5 w-64 max-h-80 overflow-y-auto rounded-md border border-[var(--border-default)] bg-[var(--bg-surface)] p-1.5 shadow-lg z-50">
            <div className="px-2 py-1 text-[10px] font-mono text-[var(--text-muted)] border-b border-[var(--border-subtle)] mb-1">
              lessons_in_{topic.slug}
            </div>
            {topic.lessonSlugs.map((slug) => {
              const isCurrent = slug === currentSlug;
              const lessonInfo = getLessonBySlug(slug);
              const title =
                lessonInfo?.title ||
                slug
                  .split('-')
                  .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                  .join(' ');

              return (
                <button
                  key={slug}
                  type="button"
                  onClick={() => handleSelect(slug)}
                  className={`w-full flex items-center justify-between gap-2 px-2 py-1.5 rounded-md text-left text-xs transition-colors cursor-pointer ${
                    isCurrent
                      ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]'
                  }`}
                >
                  <span className="truncate">{title}</span>
                  {isCurrent && (
                    <Check className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </nav>
  );
}

export default memo(DynamicBreadcrumb);
