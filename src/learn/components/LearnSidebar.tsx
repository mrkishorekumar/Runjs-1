import { memo, useState } from 'react';
import { Link, useLocation } from 'react-router';
import { curriculum } from '../data/curriculum';
import { useLearnProgress } from '../hooks/useLearnProgress';
import {
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  Circle,
  BookOpen,
  X,
  Menu,
} from 'lucide-react';

interface LearnSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

function TopicTree({
  currentLessonSlug,
  onClose,
}: {
  currentLessonSlug?: string;
  onClose: () => void;
}) {
  const { getLessonProgress } = useLearnProgress();
  const [expandedTopics, setExpandedTopics] = useState<Set<string>>(() => {
    const expanded = new Set<string>();
    for (const part of curriculum) {
      for (const topic of part.topics) {
        expanded.add(topic.slug);
      }
    }
    return expanded;
  });

  function toggleTopic(topicSlug: string) {
    setExpandedTopics((prev) => {
      const next = new Set(prev);
      if (next.has(topicSlug)) {
        next.delete(topicSlug);
      } else {
        next.add(topicSlug);
      }
      return next;
    });
  }

  return (
    <nav className="p-2">
      {curriculum.map((part) => (
        <div key={part.slug} className="mb-3">
          {/* Part Header */}
          <div className="px-2 py-1 mb-1">
            <span className="text-[10px] font-mono text-[var(--text-muted)]">
              part_{part.partNumber} // {part.title}
            </span>
          </div>

          {/* Topics */}
          {part.topics.map((topic) => {
            const isExpanded = expandedTopics.has(topic.slug);
            const completedCount = topic.lessonSlugs.filter(
              (slug) => getLessonProgress(slug)?.isRead
            ).length;
            const totalCount = topic.lessonSlugs.length;
            const allDone = completedCount === totalCount && totalCount > 0;

            return (
              <div key={topic.slug} className="mb-0.5">
                {/* Topic toggle */}
                <button
                  type="button"
                  onClick={() => toggleTopic(topic.slug)}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-left text-xs font-medium hover:bg-[var(--bg-surface-hover)] transition-colors"
                >
                  {isExpanded ? (
                    <ChevronDown className="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0" />
                  )}
                  <span
                    className={`flex-1 ${allDone ? 'text-emerald-600 dark:text-emerald-400' : 'text-[var(--text-primary)]'}`}
                  >
                    {topic.title}
                  </span>
                  <span className="text-[10px] font-mono text-[var(--text-muted)] tabular-nums">
                    {completedCount}/{totalCount}
                  </span>
                </button>

                {/* Lesson links */}
                {isExpanded && (
                  <div className="ml-4 pl-2 border-l border-[var(--border-subtle)]">
                    {topic.lessonSlugs.map((slug) => {
                      const isActive = currentLessonSlug === slug;
                      const progress = getLessonProgress(slug);
                      const isComplete = progress?.isRead ?? false;

                      return (
                        <Link
                          key={slug}
                          to={`/learn/${slug}`}
                          onClick={() => {
                            onClose();
                            window.scrollTo({
                              top: 0,
                              left: 0,
                              behavior: 'instant',
                            });
                          }}
                          className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-[11px] transition-colors ${
                            isActive
                              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold'
                              : isComplete
                                ? 'text-emerald-600 dark:text-emerald-400 hover:bg-[var(--bg-surface-hover)]'
                                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]'
                          }`}
                        >
                          {isComplete ? (
                            <CheckCircle2 className="w-3 h-3 shrink-0 text-emerald-500" />
                          ) : (
                            <Circle className="w-3 h-3 shrink-0 text-[var(--text-muted)]" />
                          )}
                          <span className="truncate">
                            {slug
                              .split('-')
                              .map(
                                (w) => w.charAt(0).toUpperCase() + w.slice(1)
                              )
                              .join(' ')}
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </nav>
  );
}

function LearnSidebar({ isOpen, onClose }: LearnSidebarProps) {
  const location = useLocation();
  const currentLessonSlug = location.pathname.split('/').pop();

  return (
    <>
      {/* Mobile Drawer (visible when isOpen on < lg screens) */}
      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={onClose}
          />

          {/* Drawer Panel */}
          <aside className="fixed top-0 left-0 bottom-0 w-72 max-w-[85vw] bg-[var(--bg-surface)] border-r border-[var(--border-default)] z-50 overflow-y-auto shadow-2xl flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-[var(--border-default)] shrink-0">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-amber-500" />
                <span className="text-sm font-semibold text-[var(--text-primary)]">
                  JavaScript Curriculum
                </span>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-md hover:bg-[var(--bg-surface-hover)] text-[var(--text-secondary)] transition-colors"
                aria-label="Close curriculum drawer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <TopicTree
                currentLessonSlug={currentLessonSlug}
                onClose={onClose}
              />
            </div>
          </aside>
        </div>
      )}

      {/* Desktop Sticky Sidebar (in-flow, visible only on lg screens) */}
      <aside className="hidden lg:flex flex-col w-56 xl:w-60 shrink-0 border-r border-[var(--border-default)] sticky top-12 h-[calc(100vh-48px)] self-start bg-[var(--bg-surface)]">
        <div className="h-10 flex items-center gap-2 px-4 border-b border-[var(--border-subtle)] shrink-0">
          <BookOpen className="w-4 h-4 text-amber-500" />
          <span className="text-xs font-mono font-medium text-[var(--text-primary)]">
            curriculum
          </span>
        </div>
        <div className="flex-1 overflow-y-auto">
          <TopicTree currentLessonSlug={currentLessonSlug} onClose={() => {}} />
        </div>
      </aside>
    </>
  );
}

/** Mobile sidebar toggle button */
export function SidebarToggle({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-2 h-8 px-3 rounded-md border border-[var(--border-default)] bg-[var(--bg-surface)] text-xs font-mono text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors"
      aria-label="Toggle curriculum sidebar"
    >
      <Menu className="w-3.5 h-3.5" />
      <span>curriculum_outline</span>
    </button>
  );
}

export default memo(LearnSidebar);
