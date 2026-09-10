import { memo, useState, useCallback, useEffect } from 'react';
import type { QuizQuestion } from '../types';
import { CheckCircle2, XCircle, RotateCcw, Trophy } from 'lucide-react';

interface QuizComponentProps {
  questions: QuizQuestion[];
  onComplete: (score: number) => void;
}

function QuizComponent({ questions, onComplete }: QuizComponentProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  // Reset quiz state whenever questions change
  useEffect(() => {
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setIsAnswered(false);
    setCorrectCount(0);
    setIsComplete(false);
  }, [questions]);

  const currentQuestion = questions[currentIndex];

  const handleAnswer = useCallback(
    (optionIndex: number) => {
      if (isAnswered) return;
      setSelectedAnswer(optionIndex);
      setIsAnswered(true);
      if (optionIndex === currentQuestion.correctIndex) {
        setCorrectCount((prev) => prev + 1);
      }
    },
    [isAnswered, currentQuestion.correctIndex]
  );

  const handleNext = useCallback(() => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedAnswer(null);
      setIsAnswered(false);
    } else {
      const score = Math.round((correctCount / questions.length) * 100);
      setIsComplete(true);
      onComplete(score);
    }
  }, [currentIndex, questions.length, correctCount, onComplete]);

  const handleReset = useCallback(() => {
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setIsAnswered(false);
    setCorrectCount(0);
    setIsComplete(false);
  }, []);

  if (questions.length === 0) return null;

  if (isComplete) {
    const score = Math.round((correctCount / questions.length) * 100);
    const emoji = score >= 80 ? '🎉' : score >= 50 ? '👍' : '💪';

    return (
      <div className="my-6 p-6 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-center">
        <Trophy className="w-10 h-10 mx-auto mb-3 text-amber-500" />
        <h3 className="text-lg font-bold text-[var(--text-primary)]">
          Quiz Complete! {emoji}
        </h3>
        <p className="text-sm text-[var(--text-secondary)] mt-2">
          You got{' '}
          <strong className="text-[var(--text-primary)] font-mono">{correctCount}</strong>{' '}
          out of{' '}
          <strong className="text-[var(--text-primary)] font-mono">
            {questions.length}
          </strong>{' '}
          correct ({score}%)
        </p>
        <div className="mt-4 w-full bg-[var(--bg-surface-muted)] rounded-full h-2 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              score >= 80
                ? 'bg-emerald-500'
                : score >= 50
                  ? 'bg-amber-500'
                  : 'bg-red-500'
            }`}
            style={{ width: `${score}%` }}
          />
        </div>
        <button
          type="button"
          onClick={handleReset}
          className="mt-4 inline-flex items-center gap-1.5 h-8 px-3.5 rounded-md text-xs font-mono font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>retry_quiz</span>
        </button>
      </div>
    );
  }

  return (
    <div className="my-6 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] overflow-hidden">
      {/* Header */}
      <div className="h-9 px-3.5 border-b border-[var(--border-subtle)] bg-[var(--bg-surface-muted)] flex items-center justify-between">
        <span className="text-xs font-medium text-[var(--text-primary)] font-mono">
          quiz
        </span>
        <span className="text-[10px] font-mono text-[var(--text-muted)] tabular-nums">
          question {currentIndex + 1} / {questions.length}
        </span>
      </div>

      {/* Question */}
      <div className="p-4">
        <p className="text-sm font-medium text-[var(--text-primary)] mb-4">
          {currentQuestion.question}
        </p>

        {/* Options */}
        <div className="space-y-2">
          {currentQuestion.options.map((option, idx) => {
            const isSelected = selectedAnswer === idx;
            const isCorrect = idx === currentQuestion.correctIndex;
            let optionStyle =
              'border-[var(--border-default)] bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)]';

            if (isAnswered) {
              if (isCorrect) {
                optionStyle =
                  'border-emerald-500/50 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300';
              } else if (isSelected && !isCorrect) {
                optionStyle =
                  'border-red-500/50 bg-red-500/10 text-red-700 dark:text-red-300';
              } else {
                optionStyle =
                  'border-[var(--border-subtle)] bg-[var(--bg-surface-muted)] opacity-60';
              }
            }

            return (
              <button
                key={idx}
                type="button"
                disabled={isAnswered}
                onClick={() => handleAnswer(idx)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-md border text-left text-xs transition-colors font-mono ${optionStyle} ${
                  !isAnswered ? 'cursor-pointer' : 'cursor-default'
                }`}
              >
                <span className="w-5 h-5 flex items-center justify-center rounded border border-current text-[10px] font-bold shrink-0">
                  {String.fromCharCode(65 + idx)}
                </span>
                <span className="flex-1 font-sans">{option}</span>
                {isAnswered && isCorrect && (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                )}
                {isAnswered && isSelected && !isCorrect && (
                  <XCircle className="w-4 h-4 text-red-500 shrink-0" />
                )}
              </button>
            );
          })}
        </div>

        {/* Explanation */}
        {isAnswered && (
          <div className="mt-4 p-3 rounded-md bg-[var(--bg-surface-muted)] border border-[var(--border-subtle)]">
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              <strong className="text-[var(--text-primary)] font-mono text-xs">
                // explanation:
              </strong>{' '}
              {currentQuestion.explanation}
            </p>
          </div>
        )}

        {/* Next button */}
        {isAnswered && (
          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={handleNext}
              className="h-8 px-3.5 rounded-md bg-amber-500 hover:bg-amber-400 text-black text-xs font-semibold transition-colors"
            >
              {currentIndex < questions.length - 1
                ? 'Next Question →'
                : 'See Results'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default memo(QuizComponent);
