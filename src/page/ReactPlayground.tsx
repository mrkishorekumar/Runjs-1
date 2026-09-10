import {
  memo,
  useRef,
  useState,
  useEffect,
  useCallback,
  useMemo,
  Suspense,
} from 'react';
import { useParams, Link } from 'react-router';
import { SandpackProvider } from '@codesandbox/sandpack-react';
import Split from 'react-split';
import { WorkspaceProvider } from '../ide/state/workspaceContext';
import { useWorkspace } from '../ide/state/useWorkspace';
import { FileExplorer } from '../ide/components/FileExplorer/FileExplorer';
import { MultiTabEditor } from '../ide/components/Editor/MultiTabEditor';
import { LivePreview } from '../ide/components/Preview/LivePreview';
import TerminalSkeleton from '../components/skeletons/TerminalSkeleton';
import { lazyWithRetry } from '../utils/lazyWithRetry';
import AppLoading from '../components/AppLoading';

const XtermTerminal = lazyWithRetry(() =>
  import('../ide/components/Terminal/XtermTerminal').then((m) => ({
    default: m.XtermTerminal,
  }))
);
import {
  IdeConsole,
  IdeConsoleRef,
} from '../ide/components/Console/IdeConsole';
import ThemeSelector from '../components/ThemeSelector';
import HelpModal from '../components/HelpModal';
import ResetWorkspaceModal from '../ide/components/Modals/ResetWorkspaceModal';
import { ModalRef } from '../utils/interface';
import useTheme from '../hook/useTheme';
import useMediaQuery from '../hook/useMediaQuery';
import useWarnOnClose from '../hook/useWarnOnClose ';
import SEO from '../seo/SEO';
import { getBreadcrumbSchema, getWebApplicationSchema } from '../seo/seoConfig';
import {
  ChevronLeft,
  Atom,
  Save,
  AlignLeft,
  ZoomIn,
  ZoomOut,
  HelpCircle,
  FolderTree,
  Terminal as TerminalIcon,
  MessageSquare,
  Edit2,
  Check,
  RotateCcw,
} from 'lucide-react';

type MobileTab = 'files' | 'code' | 'preview' | 'terminal' | 'console';

function ReactWorkspace() {
  const {
    vfs,
    projectName,
    activeFile,
    openFiles,
    dirtyFiles,
    fileContents,
    fontSize,
    isSaving,
    isLoading,
    isExplorerOpen,
    isTerminalOpen,
    isConsoleOpen,
    sandpackFiles,
    syncSandpackFiles,
    setActiveFile,
    openFile,
    closeFile,
    closeOtherFiles,
    closeAllFiles,
    updateFileContent,
    saveFile,
    saveProject,
    setProjectName,
    resetWorkspace,
    toggleExplorer,
    toggleTerminal,
    toggleConsole,
    setFontSize,
    handleFileDeleted,
    handleFileRenamed,
  } = useWorkspace();

  const { resolvedTheme } = useTheme();
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const [activeMobileTab, setActiveMobileTab] = useState<MobileTab>('code');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState(projectName);
  const [previewReloadTrigger, setPreviewReloadTrigger] = useState(0);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  const handleConfirmReset = useCallback(async () => {
    await resetWorkspace();
    setIsResetModalOpen(false);
  }, [resetWorkspace]);

  const consoleRef = useRef<IdeConsoleRef>(null);
  const helpDialogRef = useRef<ModalRef>(null);
  /* eslint-disable @typescript-eslint/no-explicit-any */
  const editorRef = useRef<any>(null);

  const allFiles = useMemo(
    () => ({ ...sandpackFiles, ...fileContents }),
    [sandpackFiles, fileContents]
  );

  useWarnOnClose();

  useEffect(() => {
    setTitleValue(projectName);
  }, [projectName]);

  // Intercept window postMessage logs from Sandpack preview iframe to Luna console
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Strictly ensure message came from an iframe embedded in this page
      const isIframeSource =
        event.source &&
        event.source !== window &&
        Array.from(document.querySelectorAll('iframe')).some(
          (frame) => frame.contentWindow === event.source
        );
      if (!isIframeSource) {
        return;
      }

      const data = event.data;
      if (data && typeof data === 'object') {
        if (data.type === 'console' && data.log) {
          const { method, data: logData } = data.log;
          const args = Array.isArray(logData)
            ? logData
            : logData === undefined
              ? []
              : [logData];
          if (consoleRef.current) {
            switch (method) {
              case 'error':
                consoleRef.current.error(...args);
                break;
              case 'warn':
                consoleRef.current.warn(...args);
                break;
              case 'info':
                consoleRef.current.info(...args);
                break;
              default:
                consoleRef.current.log(...args);
                break;
            }
          }
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+S / Ctrl+S
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        saveProject();
      }
      // Cmd+B / Ctrl+B: Toggle Explorer
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        toggleExplorer();
      }
      // Cmd+` / Ctrl+`: Toggle Terminal
      if ((e.metaKey || e.ctrlKey) && e.key === '`') {
        e.preventDefault();
        toggleTerminal();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [saveProject, toggleExplorer, toggleTerminal]);

  const handleTitleSubmit = () => {
    if (titleValue.trim()) {
      setProjectName(titleValue.trim());
    }
    setIsEditingTitle(false);
  };

  const handleFormat = () => {
    if (editorRef.current) {
      editorRef.current.getAction('editor.action.formatDocument')?.run();
    }
  };

  const handleFontSize = (direction: 'increase' | 'decrease') => {
    if (direction === 'increase') {
      setFontSize(Math.min(fontSize + 1, 28));
    } else {
      setFontSize(Math.max(fontSize - 1, 10));
    }
  };

  const handleDevServerRestart = useCallback(async () => {
    await syncSandpackFiles();
    setPreviewReloadTrigger((prev) => prev + 1);
  }, [syncSandpackFiles]);

  const renderPreview = () =>
    Object.keys(sandpackFiles).length > 0 ? (
      <SandpackProvider
        key={previewReloadTrigger}
        files={sandpackFiles}
        template="react"
        theme={resolvedTheme === 'dark' ? 'dark' : 'light'}
        options={{
          recompileMode: 'delayed',
          recompileDelay: 300,
        }}
        style={{ height: '100%', width: '100%' }}
      >
        <LivePreview onRestartDevServer={handleDevServerRestart} />
      </SandpackProvider>
    ) : (
      <div className="h-full w-full flex items-center justify-center bg-[var(--bg-app)] text-xs text-[var(--text-muted)]">
        Loading preview runtime...
      </div>
    );

  return (
    <main className="h-screen w-full flex flex-col bg-[var(--bg-app)] overflow-hidden">
      {/* Top IDE Header */}
      <nav className="h-10 w-full flex items-center justify-between px-2.5 sm:px-3 bg-[var(--bg-surface)] border-b border-[var(--border-default)] z-30 shrink-0 select-none">
        {/* Left: Brand, Project Title & Template Switcher */}
        <div className="flex items-center gap-2.5">
          <Link
            to="/dashboard"
            title="Back to Dashboard"
            className="flex items-center gap-1 p-1 rounded hover:bg-[var(--bg-surface-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <div className="flex items-center justify-center w-5 h-5 rounded border border-cyan-500/40 bg-cyan-500/10 text-cyan-500 font-mono font-bold text-[10px]">
              <Atom className="w-3.5 h-3.5" />
            </div>
          </Link>

          {/* Project Title with Inline Rename */}
          <div className="flex items-center gap-1.5 font-mono text-xs">
            {isEditingTitle ? (
              <div className="flex items-center gap-1">
                <input
                  autoFocus
                  type="text"
                  value={titleValue}
                  onChange={(e) => setTitleValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleTitleSubmit();
                    if (e.key === 'Escape') setIsEditingTitle(false);
                  }}
                  onBlur={handleTitleSubmit}
                  className="px-1.5 py-0.5 rounded border border-[var(--border-focus)] bg-[var(--bg-surface)] text-xs text-[var(--text-primary)] outline-none"
                />
                <button
                  type="button"
                  onClick={handleTitleSubmit}
                  className="p-0.5 rounded text-emerald-500 hover:bg-[var(--bg-surface-hover)]"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div
                onClick={() => setIsEditingTitle(true)}
                title="Click to rename"
                className="group flex items-center gap-1 cursor-pointer"
              >
                <span className="font-semibold text-[var(--text-primary)] group-hover:text-cyan-500 transition-colors">
                  {projectName}
                </span>
                <Edit2 className="w-3 h-3 text-[var(--text-muted)] opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            )}

            <span className="text-[var(--border-default)]">/</span>
            <span className="hidden sm:inline-block text-[10px] text-[var(--text-muted)]">
              Vite HMR
            </span>
          </div>

          {/* Reset Workspace Action */}
          <div className="hidden sm:flex items-center ml-1">
            <button
              type="button"
              onClick={() => setIsResetModalOpen(true)}
              title="Reset Workspace to Clean Template"
              className="flex items-center gap-1 px-1.5 py-0.5 rounded border border-[var(--border-default)] bg-[var(--bg-surface-muted)] text-[10px] text-[var(--text-muted)] hover:text-rose-500 hover:border-rose-500/30 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* Center: Actions (Save, Format, Font Zoom, Panel Toggles) */}
        <div className="hidden md:flex items-center gap-1.5">
          {/* Save Project Button */}
          <button
            type="button"
            onClick={saveProject}
            disabled={isSaving}
            title="Save Project (⌘S)"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-cyan-600 hover:bg-cyan-500 active:bg-cyan-700 text-white text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
          >
            <Save className={`w-3 h-3 ${isSaving ? 'animate-spin' : ''}`} />
            <span>{isSaving ? 'Saving...' : 'Save'}</span>
            <kbd className="hidden lg:inline-block ml-0.5 px-1 py-0.2 text-[9px] font-mono bg-white/20 text-white rounded">
              ⌘S
            </kbd>
          </button>

          {/* Format Document */}
          <button
            type="button"
            onClick={handleFormat}
            title="Format Document (Shift+Alt+F)"
            className="p-1 rounded border border-[var(--border-default)] bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            <AlignLeft className="w-3.5 h-3.5" />
          </button>

          {/* Font Size Adjusters */}
          <div className="flex items-center rounded border border-[var(--border-default)] bg-[var(--bg-surface-muted)] p-0.5">
            <button
              type="button"
              onClick={() => handleFontSize('decrease')}
              title="Decrease font size"
              className="p-1 rounded text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors"
            >
              <ZoomOut className="w-3 h-3" />
            </button>
            <span className="px-1.5 text-[10px] font-mono text-[var(--text-muted)]">
              {fontSize}px
            </span>
            <button
              type="button"
              onClick={() => handleFontSize('increase')}
              title="Increase font size"
              className="p-1 rounded text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors"
            >
              <ZoomIn className="w-3 h-3" />
            </button>
          </div>

          <div className="h-4 w-px bg-[var(--border-default)] mx-1" />

          {/* Panel Toggle Buttons */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={toggleExplorer}
              title="Toggle File Explorer (⌘B)"
              aria-label="Toggle File Explorer"
              className={`flex items-center gap-1 px-2 py-1 rounded border text-xs font-medium transition-colors ${
                isExplorerOpen
                  ? 'border-cyan-500/40 bg-cyan-500/10 text-cyan-500 font-semibold'
                  : 'border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]'
              }`}
            >
              <FolderTree className="w-3 h-3" />
              <span className="hidden xl:inline text-[10px]">Files</span>
            </button>

            <button
              type="button"
              onClick={toggleTerminal}
              title="Toggle Terminal (⌘`)"
              aria-label="Toggle Terminal"
              className={`flex items-center gap-1 px-2 py-1 rounded border text-xs font-medium transition-colors ${
                isTerminalOpen
                  ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-500 font-semibold'
                  : 'border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]'
              }`}
            >
              <TerminalIcon className="w-3 h-3" />
              <span className="hidden xl:inline text-[10px]">Terminal</span>
            </button>

            <button
              type="button"
              onClick={toggleConsole}
              title="Toggle Luna Console"
              aria-label="Toggle Console"
              className={`flex items-center gap-1 px-2 py-1 rounded border text-xs font-medium transition-colors ${
                isConsoleOpen
                  ? 'border-amber-500/40 bg-amber-500/10 text-amber-500 font-semibold'
                  : 'border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]'
              }`}
            >
              <MessageSquare className="w-3 h-3" />
              <span className="hidden xl:inline text-[10px]">Console</span>
            </button>
          </div>
        </div>

        {/* Right: Theme Selector, Shortcuts & Mobile Tabs */}
        <div className="flex items-center gap-2">
          {/* Mobile View Toggle */}
          <div className="flex md:hidden rounded-md border border-[var(--border-default)] bg-[var(--bg-surface-muted)] p-0.5">
            {(
              [
                { id: 'files', label: 'Files' },
                { id: 'code', label: 'Code' },
                { id: 'preview', label: 'Preview' },
                { id: 'terminal', label: 'Term' },
                { id: 'console', label: 'Console' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                aria-pressed={activeMobileTab === tab.id}
                onClick={() => setActiveMobileTab(tab.id)}
                className={`px-2 py-1 text-[11px] font-medium rounded transition-colors ${
                  activeMobileTab === tab.id
                    ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-2xs font-semibold'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <ThemeSelector compact={true} />

          {/* Help Shortcuts */}
          <button
            type="button"
            onClick={() => helpDialogRef.current?.open()}
            title="Keyboard Shortcuts"
            className="p-1.5 rounded-md border border-[var(--border-default)] bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      </nav>

      {/* Main Workspace */}
      <div className="flex-1 w-full overflow-hidden">
        {isLoading ? (
          <AppLoading freeLoading={true} />
        ) : isDesktop ? (
          /* Desktop Multi-Split Layout */
          <Split
            className="flex h-full w-full split"
            sizes={isExplorerOpen ? [18, 44, 38] : [0, 56, 44]}
            minSize={isExplorerOpen ? [140, 300, 260] : [0, 300, 260]}
            gutterSize={6}
          >
            {/* 1. Left: File Explorer */}
            <div
              className={`h-full overflow-hidden bg-[var(--bg-surface)] ${
                isExplorerOpen ? 'block' : 'hidden'
              }`}
            >
              <FileExplorer
                vfs={vfs}
                activeFile={activeFile}
                dirtyFiles={dirtyFiles}
                onSelectFile={setActiveFile}
                onFileDeleted={handleFileDeleted}
                onFileRenamed={handleFileRenamed}
              />
            </div>

            {/* 2. Center: Code Editor & Bottom Terminal */}
            <div className="h-full overflow-hidden bg-[var(--bg-app)]">
              {isTerminalOpen ? (
                <Split
                  className="flex flex-col h-full w-full"
                  direction="vertical"
                  sizes={[65, 35]}
                  minSize={[150, 100]}
                  gutterSize={6}
                >
                  <div className="h-full overflow-hidden">
                    <MultiTabEditor
                      activeFile={activeFile}
                      openFiles={openFiles}
                      dirtyFiles={dirtyFiles}
                      content={fileContents[activeFile] ?? ''}
                      onSelectTab={setActiveFile}
                      onCloseTab={closeFile}
                      onCloseOtherTabs={closeOtherFiles}
                      onCloseAllTabs={closeAllFiles}
                      onChangeCode={updateFileContent}
                      onSaveFile={saveFile}
                      fontSize={fontSize}
                      editorRef={editorRef}
                      allFiles={allFiles}
                    />
                  </div>
                  <div className="h-full overflow-hidden">
                    <Suspense fallback={<TerminalSkeleton />}>
                      <XtermTerminal
                        vfs={vfs}
                        onDevServerRestart={handleDevServerRestart}
                        onOpenFile={openFile}
                      />
                    </Suspense>
                  </div>
                </Split>
              ) : (
                <div className="h-full overflow-hidden">
                  <MultiTabEditor
                    activeFile={activeFile}
                    openFiles={openFiles}
                    dirtyFiles={dirtyFiles}
                    content={fileContents[activeFile] ?? ''}
                    onSelectTab={setActiveFile}
                    onCloseTab={closeFile}
                    onCloseOtherTabs={closeOtherFiles}
                    onCloseAllTabs={closeAllFiles}
                    onChangeCode={updateFileContent}
                    onSaveFile={saveFile}
                    fontSize={fontSize}
                    editorRef={editorRef}
                    allFiles={allFiles}
                  />
                </div>
              )}
            </div>

            {/* 3. Right: Live Preview & Bottom Console */}
            <div className="h-full overflow-hidden bg-[var(--bg-app)]">
              {isConsoleOpen ? (
                <Split
                  className="flex flex-col h-full w-full"
                  direction="vertical"
                  sizes={[60, 40]}
                  minSize={[150, 100]}
                  gutterSize={6}
                >
                  <div className="h-full overflow-hidden">
                    {renderPreview()}
                  </div>
                  <div className="h-full overflow-hidden">
                    <IdeConsole ref={consoleRef} />
                  </div>
                </Split>
              ) : (
                <div className="h-full overflow-hidden">{renderPreview()}</div>
              )}
            </div>
          </Split>
        ) : (
          /* Mobile Single Tab Layout */
          <div className="h-full w-full overflow-hidden">
            <div
              className={`h-full overflow-hidden ${
                activeMobileTab === 'files' ? 'block' : 'hidden'
              }`}
            >
              <FileExplorer
                vfs={vfs}
                activeFile={activeFile}
                dirtyFiles={dirtyFiles}
                onSelectFile={(path) => {
                  setActiveFile(path);
                  setActiveMobileTab('code');
                }}
                onFileDeleted={handleFileDeleted}
                onFileRenamed={handleFileRenamed}
              />
            </div>

            <div
              className={`h-full overflow-hidden ${
                activeMobileTab === 'code' ? 'block' : 'hidden'
              }`}
            >
              <MultiTabEditor
                activeFile={activeFile}
                openFiles={openFiles}
                dirtyFiles={dirtyFiles}
                content={fileContents[activeFile] ?? ''}
                onSelectTab={setActiveFile}
                onCloseTab={closeFile}
                onCloseOtherTabs={closeOtherFiles}
                onCloseAllTabs={closeAllFiles}
                onChangeCode={updateFileContent}
                onSaveFile={saveFile}
                fontSize={fontSize}
                editorRef={editorRef}
                allFiles={allFiles}
              />
            </div>

            <div
              className={`h-full overflow-hidden ${
                activeMobileTab === 'preview' ? 'block' : 'hidden'
              }`}
            >
              {renderPreview()}
            </div>

            <div
              className={`h-full overflow-hidden ${
                activeMobileTab === 'terminal' ? 'block' : 'hidden'
              }`}
            >
              <Suspense fallback={<TerminalSkeleton />}>
                <XtermTerminal
                  vfs={vfs}
                  onDevServerRestart={handleDevServerRestart}
                  onOpenFile={(p) => {
                    openFile(p);
                    setActiveMobileTab('code');
                  }}
                />
              </Suspense>
            </div>

            <div
              className={`h-full overflow-hidden ${
                activeMobileTab === 'console' ? 'block' : 'hidden'
              }`}
            >
              <IdeConsole ref={consoleRef} />
            </div>
          </div>
        )}
      </div>

      <HelpModal ref={helpDialogRef} />
      <ResetWorkspaceModal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        onConfirm={handleConfirmReset}
      />
    </main>
  );
}

function ReactPlayground() {
  const { id } = useParams();

  return (
    <WorkspaceProvider initialProjectId={id}>
      <SEO
        title={
          id
            ? 'Saved React Playground'
            : 'Online React & Vite Playground (Sandpack)'
        }
        description={
          id
            ? 'Saved React workspace in RunJS'
            : 'In-browser React development environment with multi-file explorer, Sandpack live bundler, interactive preview, and xterm terminal.'
        }
        canonical={id ? undefined : '/react'}
        noIndex={Boolean(id)}
        noFollow={Boolean(id)}
        keywords={
          id
            ? undefined
            : [
                'React playground',
                'online React sandbox',
                'Sandpack React IDE',
                'React in browser',
                'Vite playground online',
                'browser React compiler',
              ]
        }
        structuredData={
          id
            ? undefined
            : [
                getBreadcrumbSchema([
                  { name: 'Home', item: '/' },
                  { name: 'React Playground', item: '/react' },
                ]),
                getWebApplicationSchema(),
              ]
        }
      />

      <ReactWorkspace />
    </WorkspaceProvider>
  );
}

export default memo(ReactPlayground);
