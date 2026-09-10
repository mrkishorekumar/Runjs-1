import { memo, useState, useEffect, useCallback, useMemo } from 'react';
import {
  Terminal,
  Play,
  RotateCcw,
  CheckCircle2,
  Loader2,
  Zap,
  Code2,
} from 'lucide-react';

interface CodeToken {
  text: string;
  color: string;
}

interface CodeLine {
  indent: number;
  tokens: CodeToken[];
}

const DEMO_SNIPPET: CodeLine[] = [
  {
    indent: 0,
    tokens: [
      {
        text: '// Fibonacci with memoization',
        color: 'text-[var(--text-muted)]',
      },
    ],
  },
  {
    indent: 0,
    tokens: [
      { text: 'function ', color: 'text-purple-500 font-bold' },
      { text: 'fibonacci', color: 'text-blue-500 font-semibold' },
      { text: '(n, memo = {}) {', color: 'text-[var(--text-primary)]' },
    ],
  },
  {
    indent: 1,
    tokens: [
      { text: 'if ', color: 'text-purple-500 font-bold' },
      { text: '(n ', color: 'text-[var(--text-primary)]' },
      { text: 'in ', color: 'text-purple-500 font-bold' },
      { text: 'memo) ', color: 'text-[var(--text-primary)]' },
      { text: 'return ', color: 'text-purple-500 font-bold' },
      { text: 'memo[n];', color: 'text-[var(--text-primary)]' },
    ],
  },
  {
    indent: 1,
    tokens: [
      { text: 'if ', color: 'text-purple-500 font-bold' },
      { text: '(n <= ', color: 'text-[var(--text-primary)]' },
      { text: '2', color: 'text-amber-500 font-semibold' },
      { text: ') ', color: 'text-[var(--text-primary)]' },
      { text: 'return ', color: 'text-purple-500 font-bold' },
      { text: '1', color: 'text-amber-500 font-semibold' },
      { text: ';', color: 'text-[var(--text-primary)]' },
    ],
  },
  {
    indent: 1,
    tokens: [
      { text: 'memo[n] = ', color: 'text-[var(--text-primary)]' },
      { text: 'fibonacci', color: 'text-blue-500 font-semibold' },
      { text: '(n - ', color: 'text-[var(--text-primary)]' },
      { text: '1', color: 'text-amber-500' },
      { text: ', memo) + ', color: 'text-[var(--text-primary)]' },
      { text: 'fibonacci', color: 'text-blue-500 font-semibold' },
      { text: '(n - ', color: 'text-[var(--text-primary)]' },
      { text: '2', color: 'text-amber-500' },
      { text: ', memo);', color: 'text-[var(--text-primary)]' },
    ],
  },
  {
    indent: 1,
    tokens: [
      { text: 'return ', color: 'text-purple-500 font-bold' },
      { text: 'memo[n];', color: 'text-[var(--text-primary)]' },
    ],
  },
  {
    indent: 0,
    tokens: [{ text: '}', color: 'text-[var(--text-primary)]' }],
  },
  {
    indent: 0,
    tokens: [
      { text: 'console', color: 'text-emerald-500 font-semibold' },
      { text: '.', color: 'text-[var(--text-primary)]' },
      { text: 'log', color: 'text-blue-500 font-semibold' },
      { text: '(', color: 'text-[var(--text-primary)]' },
      { text: '"Fib(40):"', color: 'text-amber-500' },
      { text: ', ', color: 'text-[var(--text-primary)]' },
      { text: 'fibonacci', color: 'text-blue-500 font-semibold' },
      { text: '(', color: 'text-[var(--text-primary)]' },
      { text: '40', color: 'text-amber-500 font-semibold' },
      { text: '));', color: 'text-[var(--text-primary)]' },
    ],
  },
];

type Phase = 'typing' | 'compiling' | 'success';

function renderTokensUpToCharLimit(
  line: CodeLine,
  charLimit: number
): CodeToken[] {
  let remainingChars = charLimit;
  const renderedTokens: CodeToken[] = [];

  for (const token of line.tokens) {
    if (remainingChars <= 0) break;
    const tokenText = token.text;
    if (tokenText.length <= remainingChars) {
      renderedTokens.push({ text: tokenText, color: token.color });
      remainingChars -= tokenText.length;
    } else {
      renderedTokens.push({
        text: tokenText.slice(0, remainingChars),
        color: token.color,
      });
      remainingChars = 0;
    }
  }

  return renderedTokens;
}

function HomeIdeDemo() {
  const [typedLineIndex, setTypedLineIndex] = useState(0);
  const [typedCharIndex, setTypedCharIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>('typing');
  const [executionTime, setExecutionTime] = useState<number | null>(null);

  const lineTexts = useMemo(() => {
    return DEMO_SNIPPET.map((line) => line.tokens.map((t) => t.text).join(''));
  }, []);

  const startAnimation = useCallback(() => {
    setTypedLineIndex(0);
    setTypedCharIndex(0);
    setPhase('typing');
    setExecutionTime(null);
  }, []);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    if (phase === 'typing') {
      const currentLineText = lineTexts[typedLineIndex] || '';
      const totalCharsInLine = currentLineText.length;

      if (typedCharIndex < totalCharsInLine) {
        // Typing character by character with human-like rhythm
        const nextChar = currentLineText[typedCharIndex];
        let charDelay = 22;

        if (nextChar === ' ') {
          charDelay = 35;
        } else if ([';', '{', '}', '(', ')', ','].includes(nextChar)) {
          charDelay = 55;
        }

        timer = setTimeout(() => {
          setTypedCharIndex((prev) => prev + 1);
        }, charDelay);
      } else {
        // Current line completed
        if (typedLineIndex < DEMO_SNIPPET.length - 1) {
          // Pause between lines (pressing Enter to next line)
          timer = setTimeout(() => {
            setTypedLineIndex((prev) => prev + 1);
            setTypedCharIndex(0);
          }, 160);
        } else {
          // All lines completed -> transition to compiling
          timer = setTimeout(() => {
            setPhase('compiling');
          }, 500);
        }
      }
    } else if (phase === 'compiling') {
      // Compiling animation duration (900ms)
      timer = setTimeout(() => {
        setExecutionTime(0.42);
        setPhase('success');
      }, 900);
    } else if (phase === 'success') {
      // Hold output for 5.5s before looping
      timer = setTimeout(() => {
        startAnimation();
      }, 5500);
    }

    return () => clearTimeout(timer);
  }, [phase, typedLineIndex, typedCharIndex, lineTexts, startAnimation]);

  return (
    <div className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] overflow-hidden">
      {/* Mock IDE Header Bar */}
      <div className="h-10 flex items-center justify-between px-3 sm:px-3.5 bg-[var(--bg-surface)] border-b border-[var(--border-default)] text-xs select-none gap-2">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          {/* macOS window control buttons */}
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f56] inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e] inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#27c93f] inline-block" />
          </div>

          <div className="flex items-center gap-1.5 font-mono text-[var(--text-secondary)] text-[11px] pl-2 border-l border-[var(--border-subtle)] min-w-0">
            <Code2 className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span className="truncate">algorithm-demo.js</span>
          </div>
        </div>

        {/* Dynamic Status Indicator */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {phase === 'typing' && (
            <span className="inline-flex items-center gap-1.5 h-6 px-2 rounded-md text-[10px] font-mono text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 whitespace-nowrap shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
              <span className="hidden sm:inline">typing...</span>
              <span className="sm:hidden">typing...</span>
            </span>
          )}

          {phase === 'compiling' && (
            <span className="inline-flex items-center gap-1.5 h-6 px-2 rounded-md text-[10px] font-mono text-blue-600 dark:text-blue-400 bg-blue-500/10 border border-blue-500/30 whitespace-nowrap shrink-0">
              <Loader2 className="w-3 h-3 animate-spin shrink-0" />
              <span className="hidden sm:inline">compiling...</span>
              <span className="sm:hidden">compiling...</span>
            </span>
          )}

          {phase === 'success' && (
            <span className="inline-flex items-center gap-1.5 h-6 px-2 rounded-md text-[10px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 whitespace-nowrap shrink-0">
              <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
              <span className="hidden sm:inline">
                done // {executionTime}ms
              </span>
              <span className="sm:hidden">{executionTime}ms</span>
            </span>
          )}

          {/* Replay / Run Button */}
          <button
            type="button"
            onClick={startAnimation}
            title="Replay animation"
            className="flex items-center gap-1 h-6 px-2 rounded-md border border-[var(--border-default)] bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-[11px] font-mono transition-colors cursor-pointer shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/60"
          >
            <RotateCcw className="w-3 h-3" />
            <span className="hidden sm:inline">replay</span>
          </button>
        </div>
      </div>

      {/* Editor & Console Split Body */}
      <div className="grid grid-cols-1 md:grid-cols-12 min-h-[300px] font-mono text-[11px] sm:text-xs divide-y md:divide-y-0 md:divide-x divide-[var(--border-default)]">
        {/* Code Editor Pane */}
        <div className="p-3.5 sm:p-5 md:col-span-7 bg-[var(--bg-app)] text-[var(--text-primary)] space-y-1.5 overflow-x-auto select-none [scrollbar-width:thin] [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[var(--border-default)]">
          {DEMO_SNIPPET.map((line, idx) => {
            if (idx > typedLineIndex) return null;

            const isCurrentLine = idx === typedLineIndex;
            const lineLimit = isCurrentLine
              ? typedCharIndex
              : lineTexts[idx].length;
            const renderedTokens = renderTokensUpToCharLimit(line, lineLimit);

            return (
              <div key={idx} className="flex items-center gap-2 sm:gap-3">
                <span className="text-[var(--text-muted)] text-[10px] sm:text-[11px] w-3.5 sm:w-4 text-right select-none opacity-40 shrink-0">
                  {idx + 1}
                </span>
                <div
                  className={`flex-1 whitespace-pre ${
                    line.indent > 0 ? 'pl-3 sm:pl-5' : ''
                  }`}
                >
                  {renderedTokens.map((tok, tIdx) => (
                    <span key={tIdx} className={tok.color}>
                      {tok.text}
                    </span>
                  ))}
                  {/* Active Letter-by-Letter Blinking Cursor */}
                  {phase === 'typing' && isCurrentLine && (
                    <span className="inline-block w-1.5 h-3.5 ml-0.5 bg-amber-500 animate-pulse align-middle" />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Terminal Console Pane */}
        <div className="p-3.5 sm:p-5 md:col-span-5 bg-[var(--bg-surface)] text-[var(--text-secondary)] flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2.5 border-b border-[var(--border-subtle)] text-[11px] font-semibold text-[var(--text-primary)] font-sans">
              <div className="flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>Output Terminal</span>
              </div>
              <span className="text-[10px] font-mono text-[var(--text-muted)] shrink-0">
                client • sandbox
              </span>
            </div>

            {/* Console Output Log States */}
            {phase === 'typing' && (
              <div className="text-[11px] text-[var(--text-muted)] italic pt-2">
                Waiting for execution...
              </div>
            )}

            {phase === 'compiling' && (
              <div className="space-y-2 pt-1 font-mono text-xs">
                <div className="flex items-center gap-2 text-blue-500">
                  <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                  <span>Compiling TypeScript AST...</span>
                </div>
                <div className="text-[10px] sm:text-[11px] text-[var(--text-muted)] pl-5">
                  Running client AST infinite-loop analyzer
                </div>
              </div>
            )}

            {phase === 'success' && (
              <div className="space-y-2 pt-1 font-mono text-xs animate-in fade-in slide-in-from-top-1 duration-200">
                <div className="flex items-start gap-2">
                  <span className="text-emerald-500 font-bold select-none shrink-0">
                    &gt;
                  </span>
                  <span className="text-[var(--text-primary)] font-bold">
                    Fib(40): <span className="text-amber-500">102334155</span>
                  </span>
                </div>
                <div className="text-emerald-600 dark:text-emerald-400 text-[10px] sm:text-[11px] flex items-center gap-1.5 pt-1">
                  <CheckCircle2 className="w-3 h-3 shrink-0" />
                  <span className="hidden sm:inline">
                    [Execution complete in {executionTime}ms • Zero server
                    latency]
                  </span>
                  <span className="sm:hidden">
                    [Executed in {executionTime}ms • Zero latency]
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Quick Run CTA inside terminal footer */}
          <div className="pt-2.5 border-t border-[var(--border-subtle)] flex items-center justify-between text-[10px] text-[var(--text-muted)] font-mono gap-2">
            <span className="flex items-center gap-1 min-w-0 truncate">
              <Zap className="w-3 h-3 text-amber-500 shrink-0" />
              <span className="truncate">client_execution // zero_latency</span>
            </span>
            <button
              type="button"
              onClick={startAnimation}
              className="text-amber-500 hover:text-amber-400 font-mono font-medium flex items-center gap-1 cursor-pointer shrink-0 focus:outline-none focus-visible:ring-1 focus-visible:ring-amber-500/60 rounded px-1"
            >
              <Play className="w-2.5 h-2.5 fill-current" />
              <span>run_code</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default memo(HomeIdeDemo);
