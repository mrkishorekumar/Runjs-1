import { memo, useState, useCallback, useRef, useEffect } from 'react';
import { Editor, Monaco, type OnMount } from '@monaco-editor/react';
import type { CodeExample as CodeExampleType } from '../types';
import useTheme from '../../hook/useTheme';
import {
  getMonacoThemeName,
  registerMonacoThemes,
} from '../../utils/monacoThemes';
import { Copy, Check, Play, Code2 } from 'lucide-react';

type EditorInstance = Parameters<OnMount>[0];

interface CodeBlockProps {
  example: CodeExampleType;
}

function CodeBlock({ example }: CodeBlockProps) {
  const { resolvedTheme } = useTheme();
  const editorRef = useRef<EditorInstance | null>(null);
  const monacoInstanceRef = useRef<Monaco | null>(null);

  const [copied, setCopied] = useState(false);
  const [output, setOutput] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const rawCode = example.code?.trim() || '';
  const lineCount = rawCode ? rawCode.split('\n').length : 1;
  const computedHeight = `${Math.min(Math.max(lineCount * 21 + 18, 64), 650)}px`;

  // Format code on mount & when example.code changes
  const formatDocument = useCallback((editor: EditorInstance) => {
    try {
      editor.updateOptions({ readOnly: false });
      editor.getAction('editor.action.formatDocument')?.run();
      setTimeout(() => {
        editor.updateOptions({ readOnly: true });
      }, 60);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (monacoInstanceRef.current) {
      monacoInstanceRef.current.editor.setTheme(
        getMonacoThemeName(resolvedTheme)
      );
    }
  }, [resolvedTheme]);

  useEffect(() => {
    if (editorRef.current) {
      formatDocument(editorRef.current);
    }
  }, [rawCode, formatDocument]);

  const handleCopy = useCallback(async () => {
    try {
      const textToCopy = editorRef.current?.getValue() ?? rawCode;
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  }, [rawCode]);

  const handleRun = useCallback(() => {
    setIsRunning(true);
    const logs: string[] = [];
    const originalLog = console.log;
    const originalWarn = console.warn;
    const originalError = console.error;

    // Capture console output
    console.log = (...args: unknown[]) => {
      logs.push(
        args
          .map((a) => {
            if (typeof a === 'object') {
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
    };
    console.warn = console.log;
    console.error = (...args: unknown[]) => {
      logs.push('Error: ' + args.map(String).join(' '));
    };

    const codeToRun = editorRef.current?.getValue() ?? rawCode;

    try {
      // Use indirect eval to run in global scope
      const result = (0, eval)(codeToRun);
      if (result !== undefined && logs.length === 0) {
        logs.push(String(result));
      }
    } catch (err) {
      logs.push(`Error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      console.log = originalLog;
      console.warn = originalWarn;
      console.error = originalError;
      setOutput(logs.join('\n') || 'No output');
      setIsRunning(false);
    }
  }, [rawCode]);

  return (
    <div className="my-4 rounded-lg border border-[var(--border-default)] overflow-hidden bg-[var(--bg-surface)] max-w-full">
      {/* Title bar */}
      <div className="h-9 flex items-center justify-between px-3 bg-[var(--bg-surface)] border-b border-[var(--border-subtle)] text-xs select-none">
        <div className="flex items-center gap-2">
          <Code2 className="w-3.5 h-3.5 text-amber-500" />
          <span className="font-medium text-[var(--text-primary)] font-mono text-xs">
            {example.title || 'code_example'}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleRun}
            disabled={isRunning}
            className="flex items-center gap-1 h-6 px-2 rounded-md text-[11px] font-mono font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 active:bg-emerald-500/30 transition-colors disabled:opacity-50 cursor-pointer"
            title="Run this code in browser"
          >
            <Play className="w-3 h-3 fill-current" />
            <span>run</span>
          </button>
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1 h-6 px-2 rounded-md text-[11px] font-mono font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors cursor-pointer"
            title="Copy code"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-emerald-500" />
                <span className="text-emerald-500">copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span>copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Formatted Non-Editable Monaco Code Editor */}
      <div className="w-full relative bg-[var(--bg-app)]">
        <Editor
          height={computedHeight}
          width="100%"
          defaultLanguage="javascript"
          language="javascript"
          value={rawCode}
          theme={getMonacoThemeName(resolvedTheme)}
          loading={
            <div
              style={{ height: computedHeight }}
              className="flex items-center justify-center bg-[var(--bg-app)] text-xs font-mono text-[var(--text-muted)]"
            >
              Loading code editor...
            </div>
          }
          onMount={(editor, monaco) => {
            editorRef.current = editor;
            monacoInstanceRef.current = monaco;
            registerMonacoThemes(monaco);
            monaco.editor.setTheme(getMonacoThemeName(resolvedTheme));
            formatDocument(editor);
          }}
          beforeMount={(monaco) => {
            registerMonacoThemes(monaco);
          }}
          options={{
            readOnly: true,
            domReadOnly: true,
            minimap: { enabled: false },
            fontSize: 13,
            fontFamily:
              "'JetBrains Mono', 'Fira Code', Menlo, Monaco, Consolas, monospace",
            lineHeight: 21,
            lineNumbers: 'on',
            lineNumbersMinChars: 3,
            scrollBeyondLastLine: false,
            automaticLayout: true,
            renderLineHighlight: 'none',
            folding: false,
            glyphMargin: false,
            contextmenu: false,
            overviewRulerBorder: false,
            overviewRulerLanes: 0,
            hideCursorInOverviewRuler: true,
            scrollbar: {
              verticalScrollbarSize: 6,
              horizontalScrollbarSize: 6,
              alwaysConsumeMouseWheel: false,
            },
          }}
        />
      </div>

      {/* Expected output or live output */}
      {(output || example.output) && (
        <div className="px-3 py-2 border-t border-[var(--border-subtle)] bg-[var(--bg-surface-muted)]">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-[10px] font-mono text-[var(--text-muted)]">
              {output ? '▸ console_output' : '▸ expected_output'}
            </span>
          </div>
          <pre className="text-xs font-mono text-emerald-600 dark:text-emerald-400 whitespace-pre-wrap">
            {output ?? example.output}
          </pre>
        </div>
      )}

      {/* Explanation callout */}
      {example.explanation && (
        <div className="px-3 py-2 border-t border-[var(--border-subtle)] bg-[var(--bg-app)]">
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
            {example.explanation}
          </p>
        </div>
      )}
    </div>
  );
}

export default memo(CodeBlock);
