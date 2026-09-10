import { transform } from 'esbuild-wasm';
import {
  Fragment,
  memo,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import Split from 'react-split';
import LunaConsole from 'luna-console';
import '../utils/lunaStyles';
import useLocalStorageState from '../hook/useLocalStorageState';
import useAdjustFontSize from '../hook/useAdjustFontSize';
import useComplieCode from '../hook/useComplieCode';
import useDebounceLocalStorageState from '../hook/useDebounceLocalStorageState';
import { addInfiniteLoopProtection } from '../utils/addInfiniteLoopProtection';
import { runInSandbox } from '../utils/sandboxRunner';
import { Link, useLocation } from 'react-router';
import { ITypeScriptError, ModalRef } from '../utils/interface';
import HelpModal from '../components/HelpModal';
import useWarnOnClose from '../hook/useWarnOnClose ';
import useFormatDocument from '../hook/useFormatDocument';
import useDownloadFile from '../hook/useDownloadFile';
import useMediaQuery from '../hook/useMediaQuery';
import CodeEditor from '../components/CodeEditor';
import Terminal from '../components/Terminal';
import ThemeSelector from '../components/ThemeSelector';
import useTheme from '../hook/useTheme';
import { loadTypscript, saveJSTSFile } from '../utils/commonFunction';
import SEO from '../seo/SEO';
import { getBreadcrumbSchema, getWebApplicationSchema } from '../seo/seoConfig';
import ToolInterlinkMenu from '../components/ToolInterlinkMenu';
import ImportNotificationToast from '../components/ImportNotificationToast';
import { consumeTransferredCode } from '../utils/crossToolTransfer';
import {
  Play,
  Loader2,
  HelpCircle,
  Download,
  AlignLeft,
  ZoomIn,
  ZoomOut,
  Code2,
  ChevronLeft,
} from 'lucide-react';

/**
 * TypeScript Playground page component providing live code editing, diagnostics, and in-browser execution.
 */
function TSPlayground() {
  const location = useLocation();
  const [code, setCode] = useDebounceLocalStorageState(
    'tscode',
    '// Welcome to RunJS - In-browser TypeScript Playground\n\ninterface UserProfile {\n  id: string;\n  name: string;\n  role: "admin" | "developer" | "designer";\n  skills: string[];\n}\n\nconst user: UserProfile = {\n  id: "usr_101",\n  name: "Alex Rivera",\n  role: "developer",\n  skills: ["TypeScript", "React", "Node.js"]\n};\n\nfunction printUserInfo(profile: UserProfile): void {\n  console.log(`User: ${profile.name} (${profile.role.toUpperCase()})`);\n  console.log("Skills:", profile.skills.join(", "));\n}\n\nprintUserInfo(user);\n',
    1000
  );
  const [importSource, setImportSource] = useState<string | null>(null);

  // Consume any code transferred from another tool (JS Playground, Event Loop, Execution Context)
  useEffect(() => {
    const transferred = consumeTransferredCode(
      'ts',
      location.state as { code?: string; source?: string } | undefined,
      location.search
    );

    if (transferred && transferred.code !== undefined) {
      setCode(transferred.code);
      if (transferred.source) {
        setImportSource(transferred.source);
      }
      if (location.state && (location.state as { code?: string }).code) {
        window.history.replaceState({}, document.title);
      }
    }
  }, [location.state, location.search, setCode]);
  const [currentFontSize, setFontSize] = useLocalStorageState('fontSize', '14');
  const [activeMobileTab, setActiveMobileTab] = useState<'editor' | 'console'>(
    'editor'
  );
  const [isRunning, setIsRunning] = useState(false);
  const [tsErrors, setTsErrors] = useState<ITypeScriptError[]>([]);
  const [terminalTab, setTerminalTab] = useState<'console' | 'tsErrors'>(
    'console'
  );
  const consoleRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<ModalRef>(null);
  /* eslint-disable  @typescript-eslint/no-explicit-any */
  const editorRef = useRef<any>(null);
  const { resolvedTheme } = useTheme();
  const isDesktop = useMediaQuery('(min-width: 640px)');

  const handleValidate = useCallback((markers: any[]) => {
    const formatted: ITypeScriptError[] = markers
      .filter((m) => m.severity === 8)
      .map((m) => ({
        message: m.message,
        code: typeof m.code === 'object' ? m.code?.value : m.code,
        startLineNumber: m.startLineNumber,
        startColumn: m.startColumn,
        endLineNumber: m.endLineNumber,
        endColumn: m.endColumn,
        severity: 'error' as const,
      }));
    setTsErrors(formatted);
  }, []);

  const handleErrorClick = useCallback((error: ITypeScriptError) => {
    setActiveMobileTab('editor');
    if (editorRef.current) {
      editorRef.current.revealPositionInCenter({
        lineNumber: error.startLineNumber,
        column: error.startColumn,
      });
      editorRef.current.setPosition({
        lineNumber: error.startLineNumber,
        column: error.startColumn,
      });
      editorRef.current.focus();
    }
  }, []);

  function handleFontSize(operation: 'increaseFontSize' | 'decreaseFontSize') {
    let fontSize = Number(currentFontSize);
    if (operation === 'increaseFontSize') {
      fontSize = Math.min(fontSize + 1, 28);
    } else {
      fontSize = Math.max(fontSize - 1, 10);
    }
    setFontSize(fontSize.toString());
  }

  function clearTerminal() {
    if (consoleRef.current) {
      consoleRef.current.innerHTML = '';
    }
  }

  async function handleRunClick() {
    setIsRunning(true);
    if (!isDesktop) {
      setActiveMobileTab('console');
    }
    if (editorRef.current) {
      editorRef.current.getAction('editor.action.formatDocument')?.run();
    }
    if (consoleRef.current) {
      consoleRef.current.innerHTML = '';

      const lunaConsole = new LunaConsole(consoleRef.current, {
        theme: resolvedTheme === 'dark' ? 'dark' : 'light',
      });

      try {
        await loadTypscript();
        const parseJavascriptCode = await transform(code ?? '', {
          loader: 'ts',
        });
        let final = parseJavascriptCode.code;
        final = addInfiniteLoopProtection(final);
        const result = await runInSandbox(final, {
          timeoutMs: 5000,
          onLog: (type, args) => {
            if (type === 'error') {
              lunaConsole.error(...args);
            } else if (type === 'warn') {
              lunaConsole.warn(...args);
            } else if (type === 'info') {
              lunaConsole.info(...args);
            } else {
              lunaConsole.log(...args);
            }
          },
        });
        if (result.error) lunaConsole.error(result.error);
      } catch (error) {
        lunaConsole.error(error);
      }
    }
    setIsRunning(false);
  }

  function handleDownload() {
    saveJSTSFile(code, 'script', 'ts');
  }

  useAdjustFontSize(handleFontSize);
  useComplieCode(handleRunClick);
  useDownloadFile(handleDownload);
  useWarnOnClose();
  useFormatDocument(() => {
    if (editorRef.current) {
      editorRef.current.getAction('editor.action.formatDocument')?.run();
    }
  });

  return (
    <Fragment>
      <SEO
        title="Online TypeScript Playground with esbuild Wasm"
        description="Fast, client-side TypeScript compiler powered by esbuild WebAssembly. Type check, compile, and execute TypeScript directly in your browser."
        canonical="/ts"
        keywords={[
          'TypeScript playground',
          'online TypeScript compiler',
          'esbuild wasm TypeScript',
          'run TypeScript in browser',
          'Monaco TypeScript IDE',
        ]}
        structuredData={[
          getBreadcrumbSchema([
            { name: 'Home', item: '/' },
            { name: 'TypeScript Playground', item: '/ts' },
          ]),
          getWebApplicationSchema(),
        ]}
      />

      <main className="h-screen w-full flex flex-col bg-[var(--bg-app)] overflow-hidden">
        {/* Top IDE Navigation */}
        <nav className="h-10 w-full flex items-center justify-between px-2.5 sm:px-3 bg-[var(--bg-surface)] border-b border-[var(--border-default)] z-30 shrink-0 select-none">
          {/* Left: Brand & File Title */}
          <div className="flex items-center gap-2.5">
            <Link
              to="/dashboard"
              title="Back to Dashboard"
              className="flex items-center gap-1 p-1 rounded hover:bg-[var(--bg-surface-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              <div className="flex items-center justify-center w-5 h-5 rounded border border-blue-500/40 bg-blue-500/10 text-blue-500 font-mono font-bold text-[10px]">
                TS
              </div>
            </Link>

            <div className="hidden sm:flex items-center gap-1.5 font-mono text-xs">
              <span className="font-semibold text-[var(--text-primary)]">
                script.ts
              </span>
              <span className="text-[var(--border-default)]">/</span>
              <span className="text-[10px] text-[var(--text-muted)]">
                esbuild wasm
              </span>
            </div>
          </div>

          {/* Center: Actions (Run, Interlink, Format, Font, Download) */}
          <div className="flex items-center gap-1.5">
            {/* Run Button */}
            <button
              type="button"
              onClick={handleRunClick}
              disabled={isRunning}
              title="Run code (Ctrl/Cmd + R)"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
            >
              {isRunning ? (
                <Loader2 className="w-3 h-3 animate-spin text-white shrink-0" />
              ) : (
                <Play className="w-3 h-3 fill-white shrink-0" />
              )}
              <span>Run</span>
              <kbd className="hidden md:inline-block ml-0.5 px-1 py-0.2 text-[9px] font-mono bg-white/20 text-white rounded">
                ⌘R
              </kbd>
            </button>

            {/* Cross-Tool Interlink Menu */}
            <ToolInterlinkMenu currentTool="ts" getCode={() => code} />

            {/* Format Document */}
            <button
              type="button"
              onClick={() => {
                if (editorRef.current) {
                  editorRef.current
                    .getAction('editor.action.formatDocument')
                    ?.run();
                }
              }}
              title="Format Document (Shift + Alt + F)"
              aria-label="Format Document"
              className="hidden sm:flex items-center p-1 rounded border border-[var(--border-default)] bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              <AlignLeft className="w-3.5 h-3.5" />
            </button>

            {/* Font Size Adjusters */}
            <div className="hidden md:flex items-center rounded border border-[var(--border-default)] bg-[var(--bg-surface-muted)] p-0.5">
              <button
                type="button"
                onClick={() => handleFontSize('decreaseFontSize')}
                title="Decrease font size"
                className="p-1 rounded text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors"
              >
                <ZoomOut className="w-3 h-3" />
              </button>
              <span className="px-1.5 text-[10px] font-mono text-[var(--text-muted)]">
                {currentFontSize}px
              </span>
              <button
                type="button"
                onClick={() => handleFontSize('increaseFontSize')}
                title="Increase font size"
                className="p-1 rounded text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors"
              >
                <ZoomIn className="w-3 h-3" />
              </button>
            </div>

            {/* Download File */}
            <button
              type="button"
              onClick={handleDownload}
              title="Download File (Ctrl/Cmd + S)"
              aria-label="Download File"
              className="hidden sm:flex items-center p-1 rounded border border-[var(--border-default)] bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Right: Help, Theme & Mobile Switcher */}
          <div className="flex items-center gap-2">
            {/* Mobile View Toggle */}
            <div className="flex sm:hidden rounded-md border border-[var(--border-default)] bg-[var(--bg-surface-muted)] p-0.5">
              <button
                type="button"
                onClick={() => setActiveMobileTab('editor')}
                className={`px-2 py-1 text-[11px] font-medium rounded ${
                  activeMobileTab === 'editor'
                    ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-2xs font-semibold'
                    : 'text-[var(--text-secondary)]'
                }`}
              >
                Code
              </button>
              <button
                type="button"
                onClick={() => setActiveMobileTab('console')}
                className={`px-2 py-1 text-[11px] font-medium rounded ${
                  activeMobileTab === 'console'
                    ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-2xs font-semibold'
                    : 'text-[var(--text-secondary)]'
                }`}
              >
                Console
              </button>
            </div>

            {/* Theme Selector */}
            <ThemeSelector compact={true} />

            {/* Help / Shortcuts Button */}
            <button
              type="button"
              onClick={() => dialogRef?.current?.open()}
              title="Keyboard Shortcuts"
              aria-label="Help"
              className="flex items-center gap-1 p-1.5 rounded-md border border-[var(--border-default)] bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
          </div>
        </nav>

        {/* Main Workspace Area */}
        <section className="flex-1 w-full relative overflow-hidden">
          {isDesktop ? (
            /* Desktop Split Pane View */
            <div className="h-full w-full">
              <Split
                className="split h-full w-full"
                sizes={[60, 40]}
                minSize={180}
                gutterSize={6}
              >
                {/* Code Editor Column */}
                <div className="h-full flex flex-col overflow-hidden bg-[var(--bg-app)]">
                  {/* Editor File Tab Strip */}
                  <div className="flex items-center justify-between px-3 py-1.5 bg-[var(--bg-surface)] border-b border-[var(--border-default)] text-xs no-select">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[var(--bg-surface-active)] text-[var(--text-primary)] font-medium border border-[var(--border-subtle)]">
                        <Code2 className="w-3.5 h-3.5 text-blue-500" />
                        <span>script.ts</span>
                      </div>
                    </div>
                    <span className="text-[11px] text-[var(--text-muted)] font-mono">
                      TypeScript • esbuild-wasm
                    </span>
                  </div>

                  <div className="flex-1 overflow-hidden">
                    <CodeEditor
                      language="typescript"
                      path="script.ts"
                      code={code}
                      editorRef={editorRef}
                      currentFontSize={Number(currentFontSize)}
                      onChange={(value) => setCode(value ?? '')}
                      onValidate={handleValidate}
                    />
                  </div>
                </div>

                {/* Terminal Column */}
                <div className="h-full overflow-hidden">
                  <Terminal
                    clearTerminal={clearTerminal}
                    consoleRef={consoleRef}
                    language="typescript"
                    tsErrors={tsErrors}
                    onErrorClick={handleErrorClick}
                    activeTab={terminalTab}
                    onTabChange={setTerminalTab}
                  />
                </div>
              </Split>
            </div>
          ) : (
            /* Mobile Single Tab View */
            <div className="h-full w-full">
              <div
                className={`h-full flex flex-col bg-[var(--bg-app)] ${
                  activeMobileTab === 'editor' ? '' : 'hidden'
                }`}
              >
                <CodeEditor
                  language="typescript"
                  path="script.ts"
                  code={code}
                  editorRef={editorRef}
                  currentFontSize={Number(currentFontSize)}
                  onChange={(value) => setCode(value ?? '')}
                  onValidate={handleValidate}
                />
              </div>
              <div
                className={`h-full ${
                  activeMobileTab === 'console' ? '' : 'hidden'
                }`}
              >
                <Terminal
                  clearTerminal={clearTerminal}
                  consoleRef={consoleRef}
                  language="typescript"
                  tsErrors={tsErrors}
                  onErrorClick={handleErrorClick}
                  activeTab={terminalTab}
                  onTabChange={setTerminalTab}
                />
              </div>
            </div>
          )}
        </section>
      </main>

      <ImportNotificationToast
        source={importSource}
        onDismiss={() => setImportSource(null)}
      />

      <HelpModal ref={dialogRef} />
    </Fragment>
  );
}

export default memo(TSPlayground);
