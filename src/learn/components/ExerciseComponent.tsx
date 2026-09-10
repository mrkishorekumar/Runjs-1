import { memo, useState, useCallback, useEffect, useRef } from 'react';
import { Editor, Monaco, type OnMount } from '@monaco-editor/react';
import type { Exercise } from '../types';
import { runInSandbox } from '../../utils/sandboxRunner';
import useTheme from '../../hook/useTheme';
import {
  getMonacoThemeName,
  registerMonacoThemes,
} from '../../utils/monacoThemes';
import {
  Eye,
  EyeOff,
  Lightbulb,
  Play,
  RotateCcw,
  CheckCircle2,
} from 'lucide-react';

type EditorInstance = Parameters<OnMount>[0];

interface ExerciseComponentProps {
  exercise: Exercise;
  exerciseNumber: number;
  onComplete: () => void;
}

function ExerciseComponent({
  exercise,
  exerciseNumber,
  onComplete,
}: ExerciseComponentProps) {
  const { resolvedTheme } = useTheme();
  const editorRef = useRef<EditorInstance | null>(null);
  const monacoInstanceRef = useRef<Monaco | null>(null);

  const [code, setCode] = useState(exercise.starterCode);
  const [output, setOutput] = useState<string | null>(null);
  const [showSolution, setShowSolution] = useState(false);
  const [hintsRevealed, setHintsRevealed] = useState(0);
  const [completed, setCompleted] = useState(false);

  // Sync theme changes with Monaco
  useEffect(() => {
    if (monacoInstanceRef.current) {
      monacoInstanceRef.current.editor.setTheme(
        getMonacoThemeName(resolvedTheme)
      );
    }
  }, [resolvedTheme]);

  // Reset state when exercise changes
  useEffect(() => {
    setCode(exercise.starterCode);
    editorRef.current?.setValue(exercise.starterCode);
    setOutput(null);
    setShowSolution(false);
    setHintsRevealed(0);
    setCompleted(false);
  }, [exercise]);

  const handleRun = useCallback(async () => {
    const logs: string[] = [];
    const codeToRun = editorRef.current?.getValue() ?? code;

    try {
      const result = await runInSandbox(codeToRun, {
        timeoutMs: 3000,
        onLog: (type, args) => {
          const prefix = type === 'error' ? 'Error: ' : '';
          logs.push(
            prefix +
              args
                .map((a) => {
                  if (typeof a === 'object' && a !== null) {
                    try {
                      return JSON.stringify(a, null, 2);
                    } catch {
                      return String(a);
                    }
                  }
                  return String(a);
                })
                .join(' ')
          );
        },
      });

      if (result.error && logs.length === 0) {
        logs.push(`Error: ${result.error}`);
      }
    } catch (err) {
      logs.push(`Error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setOutput(logs.join('\n') || 'No output');
    }
  }, [code]);

  const handleRevealHint = useCallback(() => {
    setHintsRevealed((prev) => Math.min(prev + 1, exercise.hints.length));
  }, [exercise.hints.length]);

  const handleReset = useCallback(() => {
    setCode(exercise.starterCode);
    editorRef.current?.setValue(exercise.starterCode);
    setOutput(null);
    setShowSolution(false);
    setHintsRevealed(0);
  }, [exercise.starterCode]);

  const handleMarkComplete = useCallback(() => {
    setCompleted(true);
    onComplete();
  }, [onComplete]);

  const difficultyColors = {
    beginner:
      'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    intermediate:
      'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    advanced: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
  };

  const lineCount = code ? code.split('\n').length : 1;
  const computedHeight = `${Math.min(Math.max(lineCount * 21 + 36, 140), 320)}px`;

  return (
    <div className="my-6 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] overflow-hidden">
      {/* Header */}
      <div className="h-9 px-3.5 border-b border-[var(--border-subtle)] bg-[var(--bg-surface-muted)] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-[var(--text-primary)] font-mono">
            exercise_{exerciseNumber}
          </span>
          <span
            className={`text-[10px] font-mono px-2 py-0.5 rounded-md border ${difficultyColors[exercise.difficulty]}`}
          >
            {exercise.difficulty}
          </span>
        </div>
        {completed && (
          <span className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            completed
          </span>
        )}
      </div>

      {/* Description */}
      <div className="px-3.5 py-2.5 border-b border-[var(--border-subtle)]">
        <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-1">
          {exercise.title}
        </h4>
        <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
          {exercise.description}
        </p>
      </div>

      {/* Monaco Code Editor Area */}
      <div className="p-3.5">
        <div className="rounded-md border border-[var(--border-default)] overflow-hidden bg-[var(--bg-app)] focus-within:border-amber-500/50 transition-colors">
          <Editor
            height={computedHeight}
            width="100%"
            defaultLanguage="javascript"
            language="javascript"
            value={code}
            theme={getMonacoThemeName(resolvedTheme)}
            onChange={(value) => setCode(value ?? '')}
            onMount={(editor, monaco) => {
              editorRef.current = editor;
              monacoInstanceRef.current = monaco;
              registerMonacoThemes(monaco);
              monaco.editor.setTheme(getMonacoThemeName(resolvedTheme));
            }}
            beforeMount={(monaco) => {
              registerMonacoThemes(monaco);
            }}
            loading={
              <div
                style={{ height: computedHeight }}
                className="flex items-center justify-center bg-[var(--bg-app)] text-xs font-mono text-[var(--text-muted)]"
              >
                Loading exercise editor...
              </div>
            }
            options={{
              readOnly: false,
              minimap: { enabled: false },
              fontSize: 13,
              fontFamily:
                "'JetBrains Mono', 'Fira Code', Menlo, Monaco, Consolas, monospace",
              lineHeight: 21,
              lineNumbers: 'on',
              lineNumbersMinChars: 3,
              scrollBeyondLastLine: false,
              automaticLayout: true,
              renderLineHighlight: 'line',
              folding: false,
              glyphMargin: false,
              tabSize: 2,
              wordWrap: 'on',
              scrollbar: {
                verticalScrollbarSize: 6,
                horizontalScrollbarSize: 6,
                alwaysConsumeMouseWheel: false,
              },
            }}
          />
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-2 mt-3">
          <button
            type="button"
            onClick={handleRun}
            className="inline-flex items-center gap-1.5 h-7 px-3 rounded-md bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-semibold transition-colors cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Run Code</span>
          </button>

          {exercise.hints.length > 0 &&
            hintsRevealed < exercise.hints.length && (
              <button
                type="button"
                onClick={handleRevealHint}
                className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md border border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-mono transition-colors cursor-pointer"
              >
                <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                <span>hint ({hintsRevealed}/{exercise.hints.length})</span>
              </button>
            )}

          <button
            type="button"
            onClick={() => setShowSolution(!showSolution)}
            className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md border border-[var(--border-default)] text-[var(--text-secondary)] text-xs font-mono hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors cursor-pointer"
          >
            {showSolution ? (
              <>
                <EyeOff className="w-3.5 h-3.5" />
                <span>hide_solution</span>
              </>
            ) : (
              <>
                <Eye className="w-3.5 h-3.5" />
                <span>show_solution</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md border border-[var(--border-default)] text-[var(--text-muted)] text-xs font-mono hover:text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)] transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>reset</span>
          </button>

          {!completed && (
            <button
              type="button"
              onClick={handleMarkComplete}
              className="ml-auto inline-flex items-center gap-1.5 h-7 px-3 rounded-md bg-amber-500 hover:bg-amber-400 text-black text-xs font-semibold transition-colors cursor-pointer"
            >
              <span>Mark Complete ✓</span>
            </button>
          )}
        </div>
      </div>

      {/* Hints */}
      {hintsRevealed > 0 && (
        <div className="px-3.5 pb-3">
          <div className="space-y-1.5">
            {exercise.hints.slice(0, hintsRevealed).map((hint, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2 px-3 py-2 rounded-md bg-amber-500/5 border border-amber-500/10"
              >
                <Lightbulb className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />
                <span className="text-xs text-[var(--text-secondary)] leading-relaxed font-mono">
                  {hint}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Output */}
      {output && (
        <div className="px-3.5 pb-3">
          <div className="px-3 py-2 rounded-md bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)]">
            <span className="text-[10px] font-mono text-[var(--text-muted)] block mb-1">
              // output
            </span>
            <pre className="text-xs font-mono text-[var(--text-primary)] whitespace-pre-wrap">
              {output}
            </pre>
          </div>
        </div>
      )}

      {/* Solution */}
      {showSolution && (
        <div className="px-3.5 pb-3.5">
          <div className="rounded-md border border-emerald-500/20 bg-emerald-500/5 overflow-hidden">
            <div className="h-7 px-3 border-b border-emerald-500/10 flex items-center justify-between">
              <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400">
                // solution
              </span>
            </div>
            <pre className="p-3 text-xs font-mono text-[var(--text-primary)] whitespace-pre-wrap overflow-x-auto bg-[var(--bg-app)]">
              {exercise.solution}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

export default memo(ExerciseComponent);
