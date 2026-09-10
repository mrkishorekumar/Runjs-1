import { memo, useEffect, Suspense } from 'react';
import { useParams, Link, useNavigate } from 'react-router';
import { getLessonBySlug } from '../data/lessonRegistry';
import { getNextLessonSlug, getPreviousLessonSlug } from '../data/curriculum';
import { useLearnProgress } from '../hooks/useLearnProgress';
import SEO from '../../components/SEO';
import { generateLessonJsonLd } from '../seo/lessonJsonLd';
import CodeBlock from './CodeBlock';
import QuizComponent from './QuizComponent';
import DynamicBreadcrumb from './DynamicBreadcrumb';
import CodeEditorSkeleton from '../../components/skeletons/CodeEditorSkeleton';
import { lazyWithRetry } from '../../utils/lazyWithRetry';

const ExerciseComponent = lazyWithRetry(() => import('./ExerciseComponent'));
import {
  Clock,
  CheckCircle2,
  BookOpen,
  AlertTriangle,
  Info,
  Lightbulb,
  AlertCircle,
} from 'lucide-react';

function LessonContent() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const {
    markLessonRead,
    saveQuizScore,
    markExerciseCompleted,
    setLastLesson,
    getLessonProgress,
  } = useLearnProgress();

  const lesson = slug ? getLessonBySlug(slug) : undefined;
  const progress = slug ? getLessonProgress(slug) : null;
  const nextSlug = slug ? getNextLessonSlug(slug) : null;
  const prevSlug = slug ? getPreviousLessonSlug(slug) : null;

  // Track that the user visited this lesson
  useEffect(() => {
    if (slug) {
      setLastLesson(slug);
    }
  }, [slug, setLastLesson]);

  // Always scroll window to top when changing lessons
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [slug]);

  if (!lesson || !slug) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <SEO
          title="Lesson Not Found"
          description="The requested JavaScript lesson could not be found."
          noindex={true}
        />
        <div className="text-center max-w-md">
          <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2">
            Lesson Not Found
          </h2>
          <p className="text-sm text-[var(--text-secondary)] mb-4">
            The lesson you're looking for doesn't exist or may have been moved.
          </p>
          <Link
            to="/learn"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-black text-sm font-semibold transition-colors"
          >
            <BookOpen className="w-4 h-4" />
            Go to Learning Home
          </Link>
        </div>
      </div>
    );
  }

  const jsonLd = generateLessonJsonLd(lesson);

  const difficultyColors = {
    beginner: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    intermediate: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    advanced: 'bg-red-500/10 text-red-600 dark:text-red-400',
  };

  const calloutStyles = {
    tip: {
      bg: 'bg-emerald-500/5 border-emerald-500/20',
      icon: <Lightbulb className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />,
      label: 'Tip',
    },
    warning: {
      bg: 'bg-amber-500/5 border-amber-500/20',
      icon: (
        <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
      ),
      label: 'Warning',
    },
    note: {
      bg: 'bg-blue-500/5 border-blue-500/20',
      icon: <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />,
      label: 'Note',
    },
    important: {
      bg: 'bg-red-500/5 border-red-500/20',
      icon: <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />,
      label: 'Important',
    },
  };

  return (
    <article className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-7 min-w-0">
      <SEO
        title={`${lesson.title} - JavaScript Tutorial`}
        description={lesson.description}
        keywords={lesson.tags}
        canonical={`/learn/${lesson.slug}`}
        ogType="article"
        jsonLd={jsonLd}
      />
      {/* Dynamic Breadcrumb */}
      <DynamicBreadcrumb currentSlug={slug} />

      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between gap-3 mb-6 pb-4 border-b border-[var(--border-subtle)] flex-wrap">
        {prevSlug ? (
          <button
            type="button"
            onClick={() => navigate(`/learn/${prevSlug}`)}
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md border border-[var(--border-default)] bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] text-xs font-medium text-[var(--text-primary)] transition-colors cursor-pointer"
          >
            <span>❮ Previous</span>
          </button>
        ) : (
          <Link
            to="/learn"
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md border border-[var(--border-default)] bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] text-xs font-medium text-[var(--text-primary)] transition-colors"
          >
            <span>❮ Home</span>
          </Link>
        )}

        <div className="flex items-center gap-2">
          {!progress?.isRead ? (
            <button
              type="button"
              onClick={() => markLessonRead(slug)}
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-medium transition-colors cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Mark Complete</span>
            </button>
          ) : (
            <span className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>Completed</span>
            </span>
          )}

          {nextSlug ? (
            <button
              type="button"
              onClick={() => navigate(`/learn/${nextSlug}`)}
              className="inline-flex items-center gap-1.5 h-8 px-3.5 rounded-md bg-amber-500 hover:bg-amber-400 text-black text-xs font-semibold transition-colors cursor-pointer"
            >
              <span>Next ❯</span>
            </button>
          ) : (
            <Link
              to="/learn"
              className="inline-flex items-center gap-1.5 h-8 px-3.5 rounded-md bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-semibold transition-colors"
            >
              <span>Finish</span>
            </Link>
          )}
        </div>
      </div>

      {/* Lesson Header */}
      <header className="mb-8 pb-6 border-b border-[var(--border-default)]">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span
            className={`text-[10px] font-mono px-2 py-0.5 rounded-md border ${difficultyColors[lesson.difficulty]}`}
          >
            {lesson.difficulty}
          </span>
          <span className="flex items-center gap-1 text-[11px] font-mono text-[var(--text-muted)]">
            <Clock className="w-3 h-3" />
            {lesson.readingTime} min read
          </span>
          {progress?.isRead && (
            <span className="flex items-center gap-1 text-[11px] font-mono text-emerald-500 font-medium">
              <CheckCircle2 className="w-3 h-3" />
              completed
            </span>
          )}
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-primary)] leading-tight">
          {lesson.title}
        </h1>
        <p className="mt-2 text-sm text-[var(--text-secondary)] leading-relaxed">
          {lesson.description}
        </p>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mt-4">
          {lesson.tags.map((tag) => (
            <span
              key={tag}
              className="px-2 py-0.5 text-[10px] font-mono rounded-md bg-[var(--bg-surface)] border border-[var(--border-default)] text-[var(--text-secondary)]"
            >
              {tag}
            </span>
          ))}
        </div>
      </header>

      {/* Content Sections */}
      {lesson.sections.map((section, sIdx) => (
        <section key={sIdx} className="mb-8">
          <h2 className="text-lg sm:text-xl font-bold text-[var(--text-primary)] mb-3">
            {section.heading}
          </h2>

          {/* Paragraphs */}
          {section.paragraphs.map((para, pIdx) => (
            <p
              key={pIdx}
              className="text-sm text-[var(--text-secondary)] leading-relaxed mb-3"
            >
              {para}
            </p>
          ))}

          {/* Bullet Points */}
          {section.bulletPoints && section.bulletPoints.length > 0 && (
            <ul className="space-y-2 my-3 ml-2">
              {section.bulletPoints.map((point, bIdx) => (
                <li
                  key={bIdx}
                  className="text-sm text-[var(--text-secondary)] leading-relaxed flex items-start gap-2.5"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0 mt-2" />
                  <span className="flex-1">{point}</span>
                </li>
              ))}
            </ul>
          )}

          {/* Code Examples */}
          {section.codeExamples?.map((example, eIdx) => (
            <CodeBlock key={eIdx} example={example} />
          ))}

          {/* Callout */}
          {section.callout && (
            <div
              className={`flex items-start gap-3 p-3.5 my-4 rounded-lg border ${calloutStyles[section.callout.type].bg}`}
            >
              {calloutStyles[section.callout.type].icon}
              <div>
                <span className="text-[10px] font-mono font-medium text-[var(--text-muted)] block mb-1">
                  // {calloutStyles[section.callout.type].label.toLowerCase()}
                </span>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  {section.callout.text}
                </p>
              </div>
            </div>
          )}
        </section>
      ))}

      {/* Exercises */}
      {lesson.exercises.length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg sm:text-xl font-bold text-[var(--text-primary)] mb-4">
            Practice Exercises
          </h2>
          <Suspense
            fallback={
              <div className="h-96 w-full rounded-lg border border-[var(--border-default)] overflow-hidden mb-6">
                <CodeEditorSkeleton />
              </div>
            }
          >
            {lesson.exercises.map((exercise, eIdx) => (
              <ExerciseComponent
                key={`${slug}-exercise-${eIdx}`}
                exercise={exercise}
                exerciseNumber={eIdx + 1}
                onComplete={() =>
                  markExerciseCompleted(slug, lesson.exercises.length)
                }
              />
            ))}
          </Suspense>
        </section>
      )}

      {/* Quiz */}
      {lesson.quiz.length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg sm:text-xl font-bold text-[var(--text-primary)] mb-4">
            Test Your Understanding
          </h2>
          <QuizComponent
            key={`${slug}-quiz`}
            questions={lesson.quiz}
            onComplete={(score) => saveQuizScore(slug, score)}
          />
        </section>
      )}

      {/* Key Takeaways */}
      {lesson.keyTakeaways.length > 0 && (
        <section className="mb-8 p-4 rounded-lg border border-amber-500/20 bg-amber-500/5">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-amber-500" />
            <span>Key Takeaways</span>
          </h3>
          <ul className="space-y-2">
            {lesson.keyTakeaways.map((takeaway, tIdx) => (
              <li
                key={tIdx}
                className="flex items-start gap-2 text-xs text-[var(--text-secondary)] leading-relaxed"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />
                <span>{takeaway}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Bottom Navigation */}
      <footer className="pt-6 mt-8 border-t border-[var(--border-default)]">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          {prevSlug ? (
            <button
              type="button"
              onClick={() => {
                navigate(`/learn/${prevSlug}`);
                window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
              }}
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md border border-[var(--border-default)] bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] text-xs font-medium text-[var(--text-primary)] transition-colors cursor-pointer"
            >
              <span>❮ Previous</span>
            </button>
          ) : (
            <Link
              to="/learn"
              onClick={() =>
                window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
              }
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md border border-[var(--border-default)] bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] text-xs font-medium text-[var(--text-primary)] transition-colors"
            >
              <span>❮ Home</span>
            </Link>
          )}

          {!progress?.isRead ? (
            <button
              type="button"
              onClick={() => markLessonRead(slug)}
              className="inline-flex items-center gap-2 h-8 px-3.5 rounded-md bg-amber-500/15 border border-amber-500/30 hover:bg-amber-500/25 text-amber-600 dark:text-amber-400 text-xs font-medium transition-colors cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Mark Lesson Complete</span>
            </button>
          ) : (
            <span className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>Lesson Completed</span>
            </span>
          )}

          {nextSlug ? (
            <button
              type="button"
              onClick={() => {
                navigate(`/learn/${nextSlug}`);
                window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
              }}
              className="inline-flex items-center gap-1.5 h-8 px-3.5 rounded-md bg-amber-500 hover:bg-amber-400 text-black text-xs font-semibold transition-colors cursor-pointer"
            >
              <span>Next ❯</span>
            </button>
          ) : (
            <Link
              to="/learn"
              onClick={() =>
                window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
              }
              className="inline-flex items-center gap-1.5 h-8 px-3.5 rounded-md bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-semibold transition-colors"
            >
              <span>Curriculum Complete</span>
            </Link>
          )}
        </div>
      </footer>
    </article>
  );
}

export default memo(LessonContent);
