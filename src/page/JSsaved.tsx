import { Fragment, useEffect, useRef, useState } from 'react';
import LunaConsole from 'luna-console';
import '../utils/lunaStyles';
import Split from 'react-split';
import { Link, useNavigate, useParams } from 'react-router';
import useLocalStorageState from '../hook/useLocalStorageState';
import { addInfiniteLoopProtection } from '../utils/addInfiniteLoopProtection';
import { runInSandbox } from '../utils/sandboxRunner';
import { ModalRef, UserCodeBase } from '../utils/interface';
import useAdjustFontSize from '../hook/useAdjustFontSize';
import useComplieCode from '../hook/useComplieCode';
import { getCode } from '../db/operations';
import useIndexDBState from '../hook/useIndexDBState';
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
import ToolInterlinkMenu from '../components/ToolInterlinkMenu';
import ComplexityButton from '../components/complexity/ComplexityButton';
import ComplexityModal from '../components/complexity/ComplexityModal';
import { useComplexityAnalyzer } from '../hook/useComplexityAnalyzer';
import {
  Play,
  HelpCircle,
  Download,
  AlignLeft,
  ZoomIn,
  ZoomOut,
  Code2,
  ChevronLeft,
  Tag as TagIcon,
} from 'lucide-react';

function JSsaved() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [code, setcode] = useIndexDBState(id ?? '');
  const [currentFontSize, setFontSize] = useLocalStorageState('fontSize', '14');
  const [savedCode, setSavedCode] = useState<UserCodeBase>();
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
  } = useComplexityAnalyzer(() => code?.code ?? '');
  const consoleRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<ModalRef>(null);
  /* eslint-disable  @typescript-eslint/no-explicit-any */
  const editorRef = useRef<any>(null);
  const { resolvedTheme } = useTheme();
  const isDesktop = useMediaQuery('(min-width: 640px)');

  async function dbcall() {
    if (id) {
      try {
        const dbResult = await getCode(id);
        if (!dbResult) {
          return navigate('/404');
        }
        setSavedCode(dbResult);
        setcode(dbResult);
      } catch (error) {
        console.log('Error', error);
      }
    }
  }

  useEffect(() => {
    async function fetchUserSavedCode() {
      await dbcall();
    }
    fetchUserSavedCode();
  }, [id]);

  function handleTextChange(txt: string) {
    if (savedCode) {
      const payload: UserCodeBase = {
        ...savedCode,
        code: txt,
        lastModifiedAt: new Date(),
      };
      setcode(payload);
    }
  }

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
        const final = addInfiniteLoopProtection(code?.code ?? '');
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
    if (code) {
      saveJSTSFile(code.code, code.fileName, 'js');
    }
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

  const fileName = code?.fileName || savedCode?.fileName || 'script';

  return (
    <Fragment>
      <SEO
        title={`${fileName}.js - Saved JavaScript`}
        description="Saved JavaScript workspace in RunJS"
        noIndex={true}
        noFollow={true}
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
                {fileName}.js
              </span>
              {savedCode?.tag && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium rounded bg-[var(--bg-surface-muted)] text-[var(--text-secondary)] border border-[var(--border-subtle)]">
                  <TagIcon className="w-2.5 h-2.5 opacity-60" />
                  {savedCode.tag}
                </span>
              )}
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
              disabled={!savedCode}
            />

            {/* Cross-Tool Interlink Menu */}
            <ToolInterlinkMenu
              currentTool="js"
              getCode={() => code?.code ?? ''}
            />

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
                        <span>{fileName}.js</span>
                      </div>
                    </div>
                    <span className="text-[11px] text-[var(--text-muted)] font-mono">
                      JavaScript • IndexedDB
                    </span>
                  </div>

                  <div className="flex-1 overflow-hidden">
                    <CodeEditor
                      language="javascript"
                      code={code?.code ?? ''}
                      editorRef={editorRef}
                      currentFontSize={Number(currentFontSize)}
                      onChange={(value) => handleTextChange(value ?? '')}
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
                  code={code?.code ?? ''}
                  editorRef={editorRef}
                  currentFontSize={Number(currentFontSize)}
                  onChange={(value) => handleTextChange(value ?? '')}
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

      <ComplexityModal
        isOpen={isComplexityModalOpen}
        onClose={closeComplexityModal}
        result={complexityResult}
        codeSnippet={complexityAnalyzedCode}
      />

      <HelpModal ref={dialogRef} />
    </Fragment>
  );
}

export default JSsaved;
