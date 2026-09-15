import { transform } from 'esbuild-wasm';
import {
  Fragment,
  memo,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import LunaConsole from 'luna-console';
import '../utils/lunaStyles';
import { Link, useNavigate, useParams } from 'react-router';
import useLocalStorageState from '../hook/useLocalStorageState';
import useAdjustFontSize from '../hook/useAdjustFontSize';
import useComplieCode from '../hook/useComplieCode';
import { addInfiniteLoopProtection } from '../utils/addInfiniteLoopProtection';
import { runInSandbox } from '../utils/sandboxRunner';
import { getCode } from '../db/operations';
import { ITypeScriptError, ModalRef, UserCodeBase } from '../utils/interface';
import HelpModal from '../components/HelpModal';
import Split from 'react-split';
import useWarnOnClose from '../hook/useWarnOnClose ';
import useFormatDocument from '../hook/useFormatDocument';
import useMediaQuery from '../hook/useMediaQuery';
import SavePlaygroundButton from '../components/SavePlaygroundButton';
import SavePlaygroundModal from '../components/SavePlaygroundModal';
import { usePlaygroundPersistence } from '../hook/usePlaygroundPersistence';
import CodeEditor from '../components/CodeEditor';
import Terminal from '../components/Terminal';
import ThemeSelector from '../components/ThemeSelector';
import useTheme from '../hook/useTheme';
import { loadTypscript, saveJSTSFile } from '../utils/commonFunction';
import SEO from '../seo/SEO';
import ToolInterlinkMenu from '../components/ToolInterlinkMenu';
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

/**
 * Saved TypeScript snippet viewer and editor page component.
 */
function TSsaved() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [editorCode, setEditorCode] = useState<string>('');
  const [initialCode, setInitialCode] = useState<string>('');
  const [savedCode, setSavedCode] = useState<UserCodeBase>();
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

  const persistence = usePlaygroundPersistence({
    id,
    type: 'ts',
    initialName: savedCode?.fileName,
    getCurrentData: () => ({
      code: editorCode,
    }),
    onSaved: (updatedDoc) => {
      setSavedCode(updatedDoc);
      setInitialCode(updatedDoc.code ?? '');
    },
  });

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

  async function dbcall() {
    if (id) {
      try {
        const dbResult = await getCode(id);
        if (!dbResult || dbResult.isDelete) {
          return navigate('/404', { replace: true });
        }
        setSavedCode(dbResult);
        setEditorCode(dbResult.code ?? '');
        setInitialCode(dbResult.code ?? '');
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

  useEffect(() => {
    if (savedCode) {
      persistence.setIsDirty(editorCode !== initialCode);
    }
  }, [editorCode, initialCode, savedCode, persistence.setIsDirty]);

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
        await loadTypscript();
        const parseJavascriptCode = await transform(editorCode, {
          loader: 'ts',
        });
        let final = parseJavascriptCode.code;
        final = addInfiniteLoopProtection(final);
        const result = await runInSandbox(final, {
          timeoutMs: 5000,
          onClear: () => {
            lunaConsole.clear();
          },
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

  function handleTextChange(txt: string) {
    setEditorCode(txt);
  }

  function clearTerminal() {
    if (consoleRef.current) {
      consoleRef.current.innerHTML = '';
    }
  }

  function handleDownload() {
    saveJSTSFile(editorCode, savedCode?.fileName || 'script', 'ts');
  }

  useAdjustFontSize(handleFontSize);
  useComplieCode(handleRunClick);
  useWarnOnClose();
  useFormatDocument(() => {
    if (editorRef.current) {
      editorRef.current.getAction('editor.action.formatDocument')?.run();
    }
  });

  const fileName = savedCode?.fileName || 'script';

  return (
    <Fragment>
      <SEO
        title={`${fileName}.ts - Saved TypeScript`}
        description="Saved TypeScript workspace in RunJS"
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
              <div className="flex items-center justify-center w-6 h-6 rounded-md bg-blue-500 text-white font-bold text-xs shadow-xs">
                TS
              </div>
            </Link>

            <div className="hidden sm:flex items-center gap-2">
              <span className="text-xs font-semibold text-[var(--text-primary)]">
                {fileName}.ts
              </span>
              {persistence.isSaving && (
                <span className="inline-flex items-center gap-1 text-[11px] font-mono text-blue-500 dark:text-blue-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                  Saving...
                </span>
              )}
              {savedCode?.tag && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium rounded bg-[var(--bg-surface-muted)] text-[var(--text-secondary)] border border-[var(--border-subtle)]">
                  <TagIcon className="w-2.5 h-2.5 opacity-60" />
                  {savedCode.tag}
                </span>
              )}
            </div>
          </div>

          {/* Center: Actions (Run, Save, Format, Font, Download) */}
          <div className="flex items-center gap-1.5">
            {/* Run Button */}
            <button
              type="button"
              onClick={handleRunClick}
              disabled={isRunning}
              title="Run code (Ctrl/Cmd + R)"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-all duration-150 hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-blue-500/50 cursor-pointer disabled:opacity-50"
            >
              <Play
                className={`w-3.5 h-3.5 fill-white ${isRunning ? 'animate-spin' : ''}`}
              />
              <span>Run</span>
              <kbd className="hidden md:inline-block ml-1 px-1 py-0.2 text-[9px] font-mono bg-white/20 text-white rounded">
                ⌘R
              </kbd>
            </button>

            {/* Save Button */}
            <SavePlaygroundButton
              isSaved={true}
              isDirty={persistence.isDirty}
              isSaving={persistence.isSaving}
              onSave={persistence.triggerSave}
              onSaveCopy={persistence.openSaveCopyModal}
              playgroundType="ts"
              shortcutText={persistence.shortcutText}
            />

            {/* Cross-Tool Interlink Menu */}
            <ToolInterlinkMenu currentTool="ts" getCode={() => editorCode} />

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
                        <Code2 className="w-3.5 h-3.5 text-blue-500" />
                        <span>{fileName}.ts</span>
                      </div>
                    </div>
                    <span className="text-[11px] text-[var(--text-muted)] font-mono">
                      TypeScript • IndexedDB
                    </span>
                  </div>

                  <div className="flex-1 overflow-hidden">
                    <CodeEditor
                      language="typescript"
                      path="script.ts"
                      code={editorCode}
                      editorRef={editorRef}
                      currentFontSize={Number(currentFontSize)}
                      onChange={(value) => handleTextChange(value ?? '')}
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
                  code={editorCode}
                  editorRef={editorRef}
                  currentFontSize={Number(currentFontSize)}
                  onChange={(value) => handleTextChange(value ?? '')}
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

      <SavePlaygroundModal
        isOpen={persistence.isSaveCopyModalOpen}
        title="Save as Copy"
        description="Create a new playground with a copy of this code."
        defaultName={`${savedCode?.fileName || 'TypeScript Playground'} (Copy)`}
        playgroundType="ts"
        isSaving={persistence.isSaving}
        onSave={persistence.confirmSaveCopy}
        onClose={persistence.closeSaveCopyModal}
      />

      <HelpModal ref={dialogRef} />
    </Fragment>
  );
}

export default memo(TSsaved);
