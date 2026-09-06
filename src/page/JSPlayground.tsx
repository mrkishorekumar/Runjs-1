import { Fragment, useEffect, useRef, useState } from 'react';
import Split from 'react-split';
import LunaConsole from 'luna-console';
import '../utils/lunaStyles';
import useDebounceLocalStorageState from '../hook/useDebounceLocalStorageState';
import useLocalStorageState from '../hook/useLocalStorageState';
import { addInfiniteLoopProtection } from '../utils/addInfiniteLoopProtection';
import { runInSandbox } from '../utils/sandboxRunner';
import { ModalRef } from '../utils/interface';
import useAdjustFontSize from '../hook/useAdjustFontSize';
import useComplieCode from '../hook/useComplieCode';
import { Link, useLocation } from 'react-router';
import HelpModal from '../components/HelpModal';
import useWarnOnClose from '../hook/useWarnOnClose ';
import useFormatDocument from '../hook/useFormatDocument';
import useDownloadFile from '../hook/useDownloadFile';
import useMediaQuery from '../hook/useMediaQuery';
import CodeEditor from '../components/CodeEditor';
import Terminal from '../components/Terminal';
import ThemeSelector from '../components/ThemeSelector';
import useTheme from '../hook/useTheme';
import { saveJSTSFile } from '../utils/commonFunction';
import SEO from '../seo/SEO';
import { getBreadcrumbSchema, getWebApplicationSchema } from '../seo/seoConfig';
import { usePwaInstall } from '../hook/usePwaInstall';
import ToolInterlinkMenu from '../components/ToolInterlinkMenu';
import ImportNotificationToast from '../components/ImportNotificationToast';
import ComplexityButton from '../components/complexity/ComplexityButton';
import ComplexityModal from '../components/complexity/ComplexityModal';
import { useComplexityAnalyzer } from '../hook/useComplexityAnalyzer';
import { consumeTransferredCode } from '../utils/crossToolTransfer';
import {
  Play,
  HelpCircle,
  Download,
  AlignLeft,
  ZoomIn,
  ZoomOut,
  Code2,
  ChevronLeft,
} from 'lucide-react';

function JSPlayground() {
  const { isInstallable, isInstalled, openInstallModal } = usePwaInstall();
  const location = useLocation();
  const [code, setCode] = useDebounceLocalStorageState(
    'jscode',
    '// Welcome to RunJS - In-browser JavaScript Playground\n\nfunction calculateStats(numbers) {\n  const sum = numbers.reduce((acc, curr) => acc + curr, 0);\n  const avg = sum / numbers.length;\n  const max = Math.max(...numbers);\n  return { sum, avg, max };\n}\n\nconst scores = [88, 92, 79, 95, 100];\nconsole.log("Calculated Statistics:", calculateStats(scores));\n',
    1000
  );
  const [importSource, setImportSource] = useState<string | null>(null);

  // Consume any code transferred from another tool (Event Loop, Execution Context, TS)
  useEffect(() => {
    const transferred = consumeTransferredCode(
      'js',
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
  const {
    isAnalyzing: isAnalyzingComplexity,
    result: complexityResult,
    analyzedCode: complexityAnalyzedCode,
    isModalOpen: isComplexityModalOpen,
    analyze: handleAnalyzeComplexity,
    closeModal: closeComplexityModal,
  } = useComplexityAnalyzer(() => code);
  const consoleRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<ModalRef>(null);
  /* eslint-disable  @typescript-eslint/no-explicit-any */
  const editorRef = useRef<any>(null);
  const { resolvedTheme } = useTheme();
  const isDesktop = useMediaQuery('(min-width: 640px)');

  function handleFontSize(operation: 'increaseFontSize' | 'decreaseFontSize') {
    let fontSize = Number(currentFontSize);
    if (operation === 'increaseFontSize') {
      fontSize = Math.min(fontSize + 1, 28);
    } else {
      fontSize = Math.max(fontSize - 1, 10);
    }
    setFontSize(fontSize.toString());
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
        const final = addInfiniteLoopProtection(code);
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

  function clearTerminal() {
    if (consoleRef.current) {
      consoleRef.current.innerHTML = '';
    }
  }

  function handleDownload() {
    saveJSTSFile(code, 'script', 'js');
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
        title="Online JavaScript Compiler & Scratchpad (ES2024+)"
        description="Interactive in-browser JavaScript sandbox with Monaco editor, infinite loop protection, custom font controls, and interactive Luna console."
        canonical="/js"
        keywords={[
          'JavaScript playground',
          'JavaScript online compiler',
          'run JavaScript in browser',
          'Monaco editor JS',
          'JS scratchpad',
          'browser JavaScript IDE',
        ]}
        structuredData={[
          getBreadcrumbSchema([
            { name: 'Home', item: '/' },
            { name: 'JavaScript Playground', item: '/js' },
          ]),
          getWebApplicationSchema(),
        ]}
      />

      <main className="h-screen w-full flex flex-col bg-[var(--bg-app)] overflow-hidden">
        {/* Top IDE Navigation */}
        <nav className="h-12 w-full flex items-center justify-between px-3 bg-[var(--bg-surface)] border-b border-[var(--border-default)] z-30 shrink-0 select-none">
          {/* Left: Brand & File Title */}
          <div className="flex items-center gap-3">
            <Link
              to="/dashboard"
              title="Back to Dashboard"
              className="flex items-center gap-1.5 p-1.5 rounded-md hover:bg-[var(--bg-surface-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              <div className="flex items-center justify-center w-6 h-6 rounded-md bg-amber-500 text-black font-bold text-xs shadow-xs">
                JS
              </div>
            </Link>

            <div className="hidden sm:flex items-center gap-2">
              <span className="text-xs font-semibold text-[var(--text-primary)]">
                script.js
              </span>
              <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                JavaScript
              </span>
            </div>
          </div>

          {/* Center: Actions (Run, Format, Font, Download) */}
          <div className="flex items-center gap-1.5">
            {/* Run Button */}
            <button
              type="button"
              onClick={handleRunClick}
              disabled={isRunning}
              title="Run code (Ctrl/Cmd + R)"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-black text-xs font-semibold shadow-xs transition-all duration-150 hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-amber-500/50 cursor-pointer disabled:opacity-50"
            >
              <Play
                className={`w-3.5 h-3.5 fill-black ${isRunning ? 'animate-spin' : ''}`}
              />
              <span>Run</span>
              <kbd className="hidden md:inline-block ml-1 px-1 py-0.2 text-[9px] font-mono bg-black/15 text-black rounded">
                ⌘R
              </kbd>
            </button>

            {/* Complexity Analyzer Button */}
            <ComplexityButton
              onClick={handleAnalyzeComplexity}
              isAnalyzing={isAnalyzingComplexity}
            />

            {/* Cross-Tool Interlink Menu */}
            <ToolInterlinkMenu currentTool="js" getCode={() => code} />

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
              className="hidden sm:flex items-center gap-1 p-1.5 rounded-md border border-[var(--border-default)] bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              <AlignLeft className="w-4 h-4" />
            </button>

            {/* Font Size Adjusters */}
            <div className="hidden md:flex items-center rounded-md border border-[var(--border-default)] bg-[var(--bg-surface)] p-0.5">
              <button
                type="button"
                onClick={() => handleFontSize('decreaseFontSize')}
                title="Decrease font size"
                className="p-1 rounded text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="px-1.5 text-[11px] font-mono text-[var(--text-muted)]">
                {currentFontSize}px
              </span>
              <button
                type="button"
                onClick={() => handleFontSize('increaseFontSize')}
                title="Increase font size"
                className="p-1 rounded text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Download File */}
            <button
              type="button"
              onClick={handleDownload}
              title="Download File (Ctrl/Cmd + S)"
              aria-label="Download File"
              className="hidden sm:flex items-center p-1.5 rounded-md border border-[var(--border-default)] bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              <Download className="w-4 h-4" />
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

            {/* Install App Button */}
            {isInstallable && !isInstalled && (
              <button
                type="button"
                onClick={openInstallModal}
                title="Install RunJS as Desktop App"
                className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-semibold transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span>Install</span>
              </button>
            )}

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
                        <Code2 className="w-3.5 h-3.5 text-amber-500" />
                        <span>script.js</span>
                      </div>
                    </div>
                    <span className="text-[11px] text-[var(--text-muted)] font-mono">
                      JavaScript • ES2024
                    </span>
                  </div>

                  <div className="flex-1 overflow-hidden">
                    <CodeEditor
                      language="javascript"
                      code={code}
                      editorRef={editorRef}
                      currentFontSize={Number(currentFontSize)}
                      onChange={(value) => setCode(value ?? '')}
                    />
                  </div>
                </div>

                {/* Terminal Column */}
                <div className="h-full overflow-hidden">
                  <Terminal
                    clearTerminal={clearTerminal}
                    consoleRef={consoleRef}
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
                  language="javascript"
                  code={code}
                  editorRef={editorRef}
                  currentFontSize={Number(currentFontSize)}
                  onChange={(value) => setCode(value ?? '')}
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

      <ComplexityModal
        isOpen={isComplexityModalOpen}
        onClose={closeComplexityModal}
        result={complexityResult}
        codeSnippet={complexityAnalyzedCode}
      />
    </Fragment>
  );
}

export default JSPlayground;
