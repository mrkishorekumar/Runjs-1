import {
  Fragment,
  useCallback,
  useEffect,
  useRef,
  useState,
  Suspense,
} from 'react';
import Split from 'react-split';
import { Link, useNavigate, useParams } from 'react-router';
import {
  Play,
  RotateCcw,
  HelpCircle,
  Download,
  AlignLeft,
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  Code2,
  FileCode,
  Palette,
  Copy,
  Check,
  Zap,
  PanelTop,
  PanelLeft,
  PanelRight,
  ChevronDown,
  Maximize2,
  Minimize2,
  Minus,
  Plus,
} from 'lucide-react';
import CodeEditorSkeleton from '../components/skeletons/CodeEditorSkeleton';
import { lazyWithRetry } from '../utils/lazyWithRetry';

const CodeEditor = lazyWithRetry(() => import('../components/CodeEditor'));
import {
  HTMLPreview,
  HTMLPreviewRef,
} from '../components/html-playground/HTMLPreview';
import ThemeSelector from '../components/ThemeSelector';
import HelpModal from '../components/HelpModal';
import HTMLResetModal from '../components/html-playground/HTMLResetModal';
import useMediaQuery from '../hook/useMediaQuery';
import useWarnOnClose from '../hook/useWarnOnClose ';
import useLocalStorageState from '../hook/useLocalStorageState';
import useAdjustFontSize from '../hook/useAdjustFontSize';
import useFormatDocument from '../hook/useFormatDocument';
import { compileHtmlDocument } from '../utils/htmlCompiler';
import { getCode, updateCode } from '../db/operations';
import { ModalRef, UserCodeBase } from '../utils/interface';
import SEO from '../components/SEO';

const DEFAULT_HTML = `<div class="container">
  <h1>Hello RunJS</h1>
  <p>Start coding with HTML, CSS, and JavaScript...</p>
  <button id="counter-btn">Clicks: 0</button>
</div>`;

const DEFAULT_CSS = `body {
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  padding: 2rem;
  background: #f8fafc;
  color: #1e293b;
  margin: 0;
}

.container {
  max-width: 600px;
  margin: 0 auto;
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
}

h1 {
  color: #ea580c;
  margin-top: 0;
}

p {
  line-height: 1.6;
  color: #64748b;
}

button {
  background: #ea580c;
  color: white;
  border: none;
  padding: 0.6rem 1.2rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

button:hover {
  background: #c2410c;
}`;

const DEFAULT_JS = `console.log("Hello from RunJS HTML/CSS/JS Playground!");

let count = 0;
const button = document.getElementById("counter-btn");

if (button) {
  button.addEventListener("click", () => {
    count++;
    button.textContent = \`Clicks: \${count}\`;
    console.log(\`Button clicked! New count: \${count}\`);
  });
}`;

const LOCAL_STORAGE_KEY = 'runjs_html_playground_state';

const parseFontSize = (val: unknown): number => {
  if (typeof val === 'number' && !isNaN(val)) return val;
  if (typeof val === 'string') {
    const cleaned = val.replace(/["']/g, '').trim();
    const num = Number(cleaned);
    if (!isNaN(num) && num >= 10 && num <= 28) return num;
  }
  return 14;
};

type MobileTab = 'html' | 'css' | 'js' | 'preview';
type PlaygroundLayout = 'top' | 'left' | 'right';
type EditorTab = 'html' | 'css' | 'js';

function HTMLPlaygroundCore({ id }: { id?: string }) {
  const navigate = useNavigate();
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const [isLoadingProject, setIsLoadingProject] = useState<boolean>(
    Boolean(id)
  );

  // Modal & Component Refs
  const helpDialogRef = useRef<ModalRef>(null);
  const previewRef = useRef<HTMLPreviewRef>(null);
  /* eslint-disable @typescript-eslint/no-explicit-any */
  const htmlEditorRef = useRef<any>(null);
  const cssEditorRef = useRef<any>(null);
  const jsEditorRef = useRef<any>(null);

  // Saved code metadata from DB (when viewing /html/:id)
  const [savedProject, setSavedProject] = useState<UserCodeBase | null>(null);

  // Project Code State
  const [initialCode] = useState(() => {
    if (!id) {
      try {
        const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          return {
            html: parsed.html ?? DEFAULT_HTML,
            css: parsed.css ?? DEFAULT_CSS,
            javascript: parsed.javascript ?? DEFAULT_JS,
          };
        }
      } catch (error) {
        console.error('Failed to parse saved HTML playground state', error);
      }
    }
    return {
      html: DEFAULT_HTML,
      css: DEFAULT_CSS,
      javascript: DEFAULT_JS,
    };
  });

  const [html, setHtml] = useState<string>(initialCode.html);
  const [css, setCss] = useState<string>(initialCode.css);
  const [javascript, setJavascript] = useState<string>(initialCode.javascript);

  // Settings
  const [autoRun, setAutoRun] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('runjs_html_autorun');
      return saved ? JSON.parse(saved) : true;
    } catch (error) {
      console.error('Failed to parse autorun', error);
      return true;
    }
  });

  // Font Size via useLocalStorageState
  const [currentFontSize, setFontSize] = useLocalStorageState('fontSize', '14');
  const numericFontSize = parseFontSize(currentFontSize);

  // Modals & format feedback states
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isFormatting, setIsFormatting] = useState(false);

  // Layout mode: 'top' | 'left' | 'right' (CodePen style)
  const [layout, setLayout] = useState<PlaygroundLayout>(() => {
    try {
      const saved = localStorage.getItem('runjs_html_layout');
      if (saved === 'top' || saved === 'left' || saved === 'right') {
        return saved;
      }
    } catch {
      // ignore
    }
    return 'top';
  });
  const [isLayoutMenuOpen, setIsLayoutMenuOpen] = useState(false);
  const layoutMenuRef = useRef<HTMLDivElement>(null);

  // Click outside to close layout menu
  useEffect(() => {
    if (!isLayoutMenuOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (
        layoutMenuRef.current &&
        !layoutMenuRef.current.contains(event.target as Node)
      ) {
        setIsLayoutMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isLayoutMenuOpen]);

  const handleLayoutChange = (newLayout: PlaygroundLayout) => {
    setLayout(newLayout);
    setIsLayoutMenuOpen(false);
    try {
      localStorage.setItem('runjs_html_layout', newLayout);
    } catch (e) {
      console.error('Failed to save layout', e);
    }
  };

  // Splitview Editor Controls: Collapsed and Maximized (Full View)
  const [maximizedEditor, setMaximizedEditor] = useState<EditorTab | null>(
    null
  );
  const [collapsedEditors, setCollapsedEditors] = useState<
    Record<EditorTab, boolean>
  >({
    html: false,
    css: false,
    js: false,
  });

  const toggleMaximizeEditor = (tab: EditorTab) => {
    setMaximizedEditor((curr) => (curr === tab ? null : tab));
  };

  const toggleCollapseEditor = (tab: EditorTab) => {
    setCollapsedEditors((prev) => {
      // If collapsing, ensure at least one editor remains open
      if (!prev[tab]) {
        const remainingOpen = (['html', 'css', 'js'] as EditorTab[]).filter(
          (t) => t !== tab && !prev[t]
        ).length;
        if (remainingOpen === 0) return prev;
      }
      if (maximizedEditor) {
        setMaximizedEditor(null);
      }
      return { ...prev, [tab]: !prev[tab] };
    });
  };

  // UI state
  const [activeMobileTab, setActiveMobileTab] = useState<MobileTab>('preview');
  const [isCompiling, setIsCompiling] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [copiedTab, setCopiedTab] = useState<string | null>(null);

  // Compiled document for iframe preview
  const [compiledDoc, setCompiledDoc] = useState<string>(() =>
    compileHtmlDocument({
      html,
      css,
      javascript,
      enableLoopProtection: true,
    })
  );

  useWarnOnClose();

  // Load from DB if in /html/:id route
  useEffect(() => {
    if (!id) return;
    const currentId = id;

    let isMounted = true;
    async function loadSaved(projId: string) {
      try {
        const doc = await getCode(projId);
        if (!isMounted) return;
        if (!doc) {
          navigate('/404');
          return;
        }
        setSavedProject(doc);
        const newHtml = doc.htmlCode || DEFAULT_HTML;
        const newCss = doc.cssCode || DEFAULT_CSS;
        const newJs = doc.jsCode || doc.code || DEFAULT_JS;
        setHtml(newHtml);
        setCss(newCss);
        setJavascript(newJs);
        setCompiledDoc(
          compileHtmlDocument({
            html: newHtml,
            css: newCss,
            javascript: newJs,
            enableLoopProtection: true,
          })
        );
        setIsLoadingProject(false);
      } catch (err) {
        console.error('Failed to load saved project', err);
        if (isMounted) setIsLoadingProject(false);
      }
    }

    loadSaved(currentId);
    return () => {
      isMounted = false;
    };
  }, [id, navigate]);

  // Persist to localStorage when in standalone /html (Scratchpad flow)
  useEffect(() => {
    if (id) return;
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(
          LOCAL_STORAGE_KEY,
          JSON.stringify({
            html,
            css,
            javascript,
          })
        );
      } catch (e) {
        console.error('Failed to persist HTML playground', e);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [id, html, css, javascript]);

  // Persist to IndexedDB when in saved /html/:id (Dashboard project flow)
  useEffect(() => {
    if (!id || !savedProject || isLoadingProject) return;
    const currentId = id;
    const timer = setTimeout(async () => {
      try {
        await updateCode(currentId, {
          htmlCode: html,
          cssCode: css,
          jsCode: javascript,
          code: javascript,
          lastModifiedAt: new Date(),
        });
      } catch (e) {
        console.error('Failed to update project in DB', e);
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [id, savedProject, isLoadingProject, html, css, javascript]);

  // Recompile function
  const runCompilation = useCallback(
    (customHtml?: string, customCss?: string, customJs?: string) => {
      setIsCompiling(true);
      const targetHtml = customHtml !== undefined ? customHtml : html;
      const targetCss = customCss !== undefined ? customCss : css;
      const targetJs = customJs !== undefined ? customJs : javascript;

      const doc = compileHtmlDocument({
        html: targetHtml,
        css: targetCss,
        javascript: targetJs,
        enableLoopProtection: true,
      });

      setCompiledDoc(doc);
      setIsDirty(false);
      setTimeout(() => setIsCompiling(false), 200);
    },
    [html, css, javascript]
  );

  // Auto-run trigger with 450ms debounce
  useEffect(() => {
    if (!autoRun) {
      setIsDirty(true);
      return;
    }

    const handler = setTimeout(() => {
      runCompilation();
    }, 450);

    return () => clearTimeout(handler);
  }, [html, css, javascript, autoRun, runCompilation]);

  // Manual Run Click Handler
  const handleRun = useCallback(() => {
    runCompilation();
    previewRef.current?.reload();
    if (!isDesktop) {
      setActiveMobileTab('preview');
    }
  }, [runCompilation, isDesktop]);

  // Reset Project Execution
  const executeReset = useCallback(() => {
    setIsResetModalOpen(false);
    setHtml(DEFAULT_HTML);
    setCss(DEFAULT_CSS);
    setJavascript(DEFAULT_JS);
    if (!id) {
      try {
        localStorage.setItem(
          LOCAL_STORAGE_KEY,
          JSON.stringify({
            html: DEFAULT_HTML,
            css: DEFAULT_CSS,
            javascript: DEFAULT_JS,
            settings: { autoRun, fontSize: numericFontSize },
          })
        );
      } catch (e) {
        console.error('Failed to reset localStorage', e);
      }
    }
    previewRef.current?.getConsoleRef()?.clear();
    runCompilation(DEFAULT_HTML, DEFAULT_CSS, DEFAULT_JS);
    previewRef.current?.reload();
  }, [id, autoRun, numericFontSize, runCompilation]);

  // Format All Documents
  const handleFormatAll = useCallback(() => {
    setIsFormatting(true);
    const editors = [
      htmlEditorRef.current,
      cssEditorRef.current,
      jsEditorRef.current,
    ].filter(Boolean);

    editors.forEach((editor) => {
      try {
        editor.getAction('editor.action.formatDocument')?.run();
      } catch (err) {
        console.error('Format error', err);
      }
    });

    setTimeout(() => setIsFormatting(false), 1200);
  }, []);

  // Keyboard Shortcuts (Cmd/Ctrl + R for Run)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isCmdOrCtrl = e.metaKey || e.ctrlKey;
      if (isCmdOrCtrl && (e.key === 'r' || e.key === 'R')) {
        e.preventDefault();
        handleRun();
      } else if (isCmdOrCtrl && e.key === 'Enter') {
        e.preventDefault();
        handleRun();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleRun]);

  // Font size handler
  const handleFontSize = useCallback(
    (operation: 'increaseFontSize' | 'decreaseFontSize') => {
      let size = parseFontSize(currentFontSize);
      if (operation === 'increaseFontSize') {
        size = Math.min(size + 1, 28);
      } else {
        size = Math.max(size - 1, 10);
      }
      setFontSize(size.toString());
    },
    [currentFontSize, setFontSize]
  );

  useAdjustFontSize(handleFontSize);
  useFormatDocument(handleFormatAll);

  // Toggle Auto Run
  const handleToggleAutoRun = () => {
    setAutoRun((prev) => {
      const next = !prev;
      localStorage.setItem('runjs_html_autorun', JSON.stringify(next));
      if (next) {
        runCompilation();
      }
      return next;
    });
  };

  // Copy code utility
  const handleCopyCode = async (
    type: 'html' | 'css' | 'js',
    codeStr: string
  ) => {
    try {
      await navigator.clipboard.writeText(codeStr);
      setCopiedTab(type);
      setTimeout(() => setCopiedTab(null), 1500);
    } catch (e) {
      console.error('Failed to copy', e);
    }
  };

  // Download project as ZIP
  const handleDownloadZip = async () => {
    try {
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();

      zip.file('index.html', html);
      zip.file('style.css', css);
      zip.file('script.js', javascript);
      zip.file(
        'preview.html',
        compileHtmlDocument({
          html,
          css,
          javascript,
          enableLoopProtection: false,
        })
      );
      zip.file(
        'README.md',
        `# RunJS HTML/CSS/JS Playground Export\n\n- \`index.html\`: Structure\n- \`style.css\`: Styling\n- \`script.js\`: JavaScript code\n- \`preview.html\`: Standalone combined bundle\n\nGenerated by RunJS.`
      );

      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${savedProject?.fileName || 'runjs-html-project'}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      console.error('Download failed', err);
    }
  };

  const renderHtmlEditor = (borderClass = '') => (
    <div
      className={`h-full flex flex-col overflow-hidden bg-[var(--bg-app)] ${borderClass}`}
    >
      <div className="h-7 px-2.5 flex items-center justify-between bg-[var(--bg-surface)] border-b border-[var(--border-default)] text-xs select-none shrink-0">
        <div className="flex items-center gap-1.5 text-[var(--text-primary)]">
          <FileCode className="w-3.5 h-3.5 text-orange-500" />
          <span className="font-mono text-[11px] font-medium">index.html</span>
          {maximizedEditor === 'html' && (
            <span className="px-1 py-0.2 rounded text-[9px] font-mono font-medium bg-amber-500/10 text-amber-500 border border-amber-500/20">
              maximized
            </span>
          )}
        </div>
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={() => handleCopyCode('html', html)}
            title="Copy HTML"
            className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors cursor-pointer"
          >
            {copiedTab === 'html' ? (
              <Check className="w-3.5 h-3.5 text-emerald-500" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </button>
          <button
            type="button"
            onClick={() =>
              htmlEditorRef.current
                ?.getAction('editor.action.formatDocument')
                ?.run()
            }
            title="Format HTML"
            className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors cursor-pointer"
          >
            <AlignLeft className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => toggleMaximizeEditor('html')}
            title={
              maximizedEditor === 'html'
                ? 'Restore Split View'
                : 'Maximize Editor'
            }
            className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors cursor-pointer"
          >
            {maximizedEditor === 'html' ? (
              <Minimize2 className="w-3.5 h-3.5 text-amber-500" />
            ) : (
              <Maximize2 className="w-3.5 h-3.5" />
            )}
          </button>
          <button
            type="button"
            onClick={() => toggleCollapseEditor('html')}
            title="Close / Collapse Editor"
            className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors cursor-pointer"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      <div className="flex-1 min-h-0 overflow-hidden">
        <Suspense fallback={<CodeEditorSkeleton />}>
          <CodeEditor
            language="html"
            path="index.html"
            code={html}
            editorRef={htmlEditorRef}
            currentFontSize={numericFontSize}
            onChange={(val) => setHtml(val ?? '')}
          />
        </Suspense>
      </div>
    </div>
  );

  const renderCssEditor = (borderClass = '') => (
    <div
      className={`h-full flex flex-col overflow-hidden bg-[var(--bg-app)] ${borderClass}`}
    >
      <div className="h-7 px-2.5 flex items-center justify-between bg-[var(--bg-surface)] border-b border-[var(--border-default)] text-xs select-none shrink-0">
        <div className="flex items-center gap-1.5 text-[var(--text-primary)]">
          <Palette className="w-3.5 h-3.5 text-blue-500" />
          <span className="font-mono text-[11px] font-medium">style.css</span>
          {maximizedEditor === 'css' && (
            <span className="px-1 py-0.2 rounded text-[9px] font-mono font-medium bg-amber-500/10 text-amber-500 border border-amber-500/20">
              maximized
            </span>
          )}
        </div>
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={() => handleCopyCode('css', css)}
            title="Copy CSS"
            className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors cursor-pointer"
          >
            {copiedTab === 'css' ? (
              <Check className="w-3.5 h-3.5 text-emerald-500" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </button>
          <button
            type="button"
            onClick={() =>
              cssEditorRef.current
                ?.getAction('editor.action.formatDocument')
                ?.run()
            }
            title="Format CSS"
            className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors cursor-pointer"
          >
            <AlignLeft className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => toggleMaximizeEditor('css')}
            title={
              maximizedEditor === 'css'
                ? 'Restore Split View'
                : 'Maximize Editor'
            }
            className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors cursor-pointer"
          >
            {maximizedEditor === 'css' ? (
              <Minimize2 className="w-3.5 h-3.5 text-amber-500" />
            ) : (
              <Maximize2 className="w-3.5 h-3.5" />
            )}
          </button>
          <button
            type="button"
            onClick={() => toggleCollapseEditor('css')}
            title="Close / Collapse Editor"
            className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors cursor-pointer"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      <div className="flex-1 min-h-0 overflow-hidden">
        <Suspense fallback={<CodeEditorSkeleton />}>
          <CodeEditor
            language="css"
            path="style.css"
            code={css}
            editorRef={cssEditorRef}
            currentFontSize={numericFontSize}
            onChange={(val) => setCss(val ?? '')}
          />
        </Suspense>
      </div>
    </div>
  );

  const renderJsEditor = (borderClass = '') => (
    <div
      className={`h-full flex flex-col overflow-hidden bg-[var(--bg-app)] ${borderClass}`}
    >
      <div className="h-7 px-2.5 flex items-center justify-between bg-[var(--bg-surface)] border-b border-[var(--border-default)] text-xs select-none shrink-0">
        <div className="flex items-center gap-1.5 text-[var(--text-primary)]">
          <Code2 className="w-3.5 h-3.5 text-amber-500" />
          <span className="font-mono text-[11px] font-medium">script.js</span>
          {maximizedEditor === 'js' && (
            <span className="px-1 py-0.2 rounded text-[9px] font-mono font-medium bg-amber-500/10 text-amber-500 border border-amber-500/20">
              maximized
            </span>
          )}
        </div>
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={() => handleCopyCode('js', javascript)}
            title="Copy JavaScript"
            className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors cursor-pointer"
          >
            {copiedTab === 'js' ? (
              <Check className="w-3.5 h-3.5 text-emerald-500" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </button>
          <button
            type="button"
            onClick={() =>
              jsEditorRef.current
                ?.getAction('editor.action.formatDocument')
                ?.run()
            }
            title="Format JavaScript"
            className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors cursor-pointer"
          >
            <AlignLeft className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => toggleMaximizeEditor('js')}
            title={
              maximizedEditor === 'js'
                ? 'Restore Split View'
                : 'Maximize Editor'
            }
            className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors cursor-pointer"
          >
            {maximizedEditor === 'js' ? (
              <Minimize2 className="w-3.5 h-3.5 text-amber-500" />
            ) : (
              <Maximize2 className="w-3.5 h-3.5" />
            )}
          </button>
          <button
            type="button"
            onClick={() => toggleCollapseEditor('js')}
            title="Close / Collapse Editor"
            className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors cursor-pointer"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      <div className="flex-1 min-h-0 overflow-hidden">
        <Suspense fallback={<CodeEditorSkeleton />}>
          <CodeEditor
            language="javascript"
            path="script.js"
            code={javascript}
            editorRef={jsEditorRef}
            currentFontSize={numericFontSize}
            onChange={(val) => setJavascript(val ?? '')}
          />
        </Suspense>
      </div>
    </div>
  );

  const renderCollapsedVerticalBar = (tab: EditorTab) => {
    const config = {
      html: { name: 'index.html', icon: FileCode, color: 'text-orange-500' },
      css: { name: 'style.css', icon: Palette, color: 'text-blue-500' },
      js: { name: 'script.js', icon: Code2, color: 'text-amber-500' },
    }[tab];
    const Icon = config.icon;

    return (
      <div
        key={`collapsed-vert-${tab}`}
        onClick={() => toggleCollapseEditor(tab)}
        className="h-7 w-full shrink-0 px-2.5 flex items-center justify-between bg-[var(--bg-surface)] border-b border-[var(--border-default)] select-none text-xs cursor-pointer hover:bg-[var(--bg-surface-hover)] transition-colors"
        title={`Expand ${config.name}`}
      >
        <div className="flex items-center gap-1.5 font-mono text-[11px] text-[var(--text-muted)]">
          <Icon className={`w-3.5 h-3.5 ${config.color}`} />
          <span>{config.name}</span>
          <span className="text-[10px] text-[var(--text-muted)]">(hidden)</span>
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            toggleCollapseEditor(tab);
          }}
          className="flex items-center gap-1 text-[10px] font-mono text-amber-500 hover:text-amber-400 py-0.5 px-1 rounded bg-amber-500/10 hover:bg-amber-500/20 transition-colors"
          title={`Expand ${config.name}`}
        >
          <Plus className="w-3 h-3" />
          <span>show</span>
        </button>
      </div>
    );
  };

  const renderCollapsedHorizontalBar = (tab: EditorTab) => {
    const config = {
      html: { name: 'index.html', icon: FileCode, color: 'text-orange-500' },
      css: { name: 'style.css', icon: Palette, color: 'text-blue-500' },
      js: { name: 'script.js', icon: Code2, color: 'text-amber-500' },
    }[tab];
    const Icon = config.icon;

    return (
      <div
        key={`collapsed-horiz-${tab}`}
        onClick={() => toggleCollapseEditor(tab)}
        className="w-7 h-full shrink-0 flex flex-col items-center justify-between py-2 bg-[var(--bg-surface)] border-r border-[var(--border-default)] select-none cursor-pointer hover:bg-[var(--bg-surface-hover)] transition-colors"
        title={`Expand ${config.name}`}
      >
        <Icon className={`w-3.5 h-3.5 ${config.color}`} />
        <span className="text-[10px] font-mono text-[var(--text-muted)] tracking-wide [writing-mode:vertical-rl] rotate-180">
          {config.name}
        </span>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            toggleCollapseEditor(tab);
          }}
          className="p-1 rounded text-amber-500 hover:bg-amber-500/20 transition-colors"
          title={`Expand ${config.name}`}
        >
          <Plus className="w-3 h-3" />
        </button>
      </div>
    );
  };

  const renderVerticalEditorStack = () => {
    if (maximizedEditor) {
      return (
        <div className="h-full min-h-0 w-full overflow-hidden bg-[var(--bg-app)]">
          {maximizedEditor === 'html' && renderHtmlEditor()}
          {maximizedEditor === 'css' && renderCssEditor()}
          {maximizedEditor === 'js' && renderJsEditor()}
        </div>
      );
    }

    const openTabs = (['html', 'css', 'js'] as EditorTab[]).filter(
      (t) => !collapsedEditors[t]
    );

    if (openTabs.length === 1) {
      return (
        <div className="h-full min-h-0 w-full flex flex-col overflow-hidden bg-[var(--bg-app)]">
          {collapsedEditors.html && renderCollapsedVerticalBar('html')}
          {collapsedEditors.css && renderCollapsedVerticalBar('css')}
          <div className="flex-1 min-h-0 w-full overflow-hidden">
            {openTabs[0] === 'html' && renderHtmlEditor()}
            {openTabs[0] === 'css' && renderCssEditor()}
            {openTabs[0] === 'js' && renderJsEditor()}
          </div>
          {collapsedEditors.js && renderCollapsedVerticalBar('js')}
        </div>
      );
    }

    if (openTabs.length === 2) {
      return (
        <div className="h-full min-h-0 w-full flex flex-col overflow-hidden bg-[var(--bg-app)]">
          {collapsedEditors.html && renderCollapsedVerticalBar('html')}
          <div className="flex-1 min-h-0 w-full overflow-hidden">
            <Split
              direction="vertical"
              sizes={[50, 50]}
              minSize={80}
              gutterSize={6}
              className="split-vertical flex flex-col h-full w-full"
            >
              {openTabs[0] === 'html' &&
                renderHtmlEditor('border-b border-[var(--border-default)]')}
              {openTabs[0] === 'css' &&
                renderCssEditor('border-b border-[var(--border-default)]')}
              {openTabs[1] === 'css' && renderCssEditor('')}
              {openTabs[1] === 'js' && renderJsEditor('')}
            </Split>
          </div>
          {collapsedEditors.css && renderCollapsedVerticalBar('css')}
          {collapsedEditors.js && renderCollapsedVerticalBar('js')}
        </div>
      );
    }

    return (
      <div className="h-full min-h-0 w-full overflow-hidden bg-[var(--bg-app)]">
        <Split
          direction="vertical"
          sizes={[33.33, 33.33, 33.34]}
          minSize={80}
          gutterSize={6}
          className="split-vertical flex flex-col h-full w-full"
        >
          {renderHtmlEditor('border-b border-[var(--border-default)]')}
          {renderCssEditor('border-b border-[var(--border-default)]')}
          {renderJsEditor('')}
        </Split>
      </div>
    );
  };

  const renderHorizontalEditorRow = () => {
    if (maximizedEditor) {
      return (
        <div className="h-full min-h-0 w-full overflow-hidden bg-[var(--bg-app)]">
          {maximizedEditor === 'html' && renderHtmlEditor()}
          {maximizedEditor === 'css' && renderCssEditor()}
          {maximizedEditor === 'js' && renderJsEditor()}
        </div>
      );
    }

    const openTabs = (['html', 'css', 'js'] as EditorTab[]).filter(
      (t) => !collapsedEditors[t]
    );

    if (openTabs.length === 1) {
      return (
        <div className="h-full min-h-0 w-full flex overflow-hidden bg-[var(--bg-app)]">
          {collapsedEditors.html && renderCollapsedHorizontalBar('html')}
          {collapsedEditors.css && renderCollapsedHorizontalBar('css')}
          <div className="flex-1 min-w-0 h-full overflow-hidden">
            {openTabs[0] === 'html' && renderHtmlEditor()}
            {openTabs[0] === 'css' && renderCssEditor()}
            {openTabs[0] === 'js' && renderJsEditor()}
          </div>
          {collapsedEditors.js && renderCollapsedHorizontalBar('js')}
        </div>
      );
    }

    if (openTabs.length === 2) {
      return (
        <div className="h-full min-h-0 w-full flex overflow-hidden bg-[var(--bg-app)]">
          {collapsedEditors.html && renderCollapsedHorizontalBar('html')}
          <div className="flex-1 min-w-0 h-full overflow-hidden">
            <Split
              direction="horizontal"
              sizes={[50, 50]}
              minSize={120}
              gutterSize={6}
              className="split flex h-full w-full"
            >
              {openTabs[0] === 'html' &&
                renderHtmlEditor('border-r border-[var(--border-default)]')}
              {openTabs[0] === 'css' &&
                renderCssEditor('border-r border-[var(--border-default)]')}
              {openTabs[1] === 'css' && renderCssEditor('')}
              {openTabs[1] === 'js' && renderJsEditor('')}
            </Split>
          </div>
          {collapsedEditors.css && renderCollapsedHorizontalBar('css')}
          {collapsedEditors.js && renderCollapsedHorizontalBar('js')}
        </div>
      );
    }

    return (
      <div className="h-full min-h-0 w-full overflow-hidden bg-[var(--bg-app)]">
        <Split
          direction="horizontal"
          sizes={[33.33, 33.33, 33.34]}
          minSize={120}
          gutterSize={6}
          className="split flex h-full w-full"
        >
          {renderHtmlEditor('border-r border-[var(--border-default)]')}
          {renderCssEditor('border-r border-[var(--border-default)]')}
          {renderJsEditor('')}
        </Split>
      </div>
    );
  };

  const renderPreview = () => (
    <div className="h-full min-h-0 w-full overflow-hidden bg-[var(--bg-app)]">
      <HTMLPreview
        ref={previewRef}
        projectId={id}
        compiledDoc={compiledDoc}
        isCompiling={isCompiling}
        onManualReload={handleRun}
      />
    </div>
  );

  if (isLoadingProject) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-[var(--bg-app)] text-[var(--text-secondary)]">
        <div className="w-8 h-8 rounded-full border-2 border-amber-500 border-t-transparent animate-spin mb-3" />
        <p className="text-xs font-medium">Loading playground project...</p>
      </div>
    );
  }

  return (
    <Fragment>
      <SEO
        title="Online HTML, CSS & JavaScript Playground"
        description="Interactive frontend web playground with 3-panel HTML/CSS/JS editors, live iframe preview, console logging, and responsive layouts."
        keywords={[
          'html playground',
          'css editor',
          'javascript online editor',
          'frontend playground',
          'codepen alternative',
          'runjs html',
        ]}
        canonical={id ? `/html/${id}` : '/html'}
      />
      <main className="h-screen w-full flex flex-col bg-[var(--bg-app)] overflow-hidden">
        {/* Top Toolbar */}
        <nav className="h-10 w-full flex items-center justify-between px-3 bg-[var(--bg-surface)] border-b border-[var(--border-default)] z-30 shrink-0 select-none">
          {/* Left: Brand & Title */}
          <div className="flex items-center gap-2.5">
            <Link
              to={id ? '/dashboard' : '/'}
              title={id ? 'Back to Dashboard' : 'Back to Home'}
              className="flex items-center gap-1.5 px-2 py-1 rounded text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="font-mono font-bold text-orange-500 text-xs">
                HTML
              </span>
            </Link>

            <div className="hidden sm:flex items-center gap-2">
              <span className="text-xs font-medium text-[var(--text-primary)] truncate max-w-[200px]">
                {savedProject?.fileName
                  ? `${savedProject.fileName}`
                  : 'HTML/CSS/JS Playground'}
              </span>
              <span className="px-1.5 py-0.5 text-[10px] font-mono rounded bg-orange-500/10 text-orange-500 border border-orange-500/20">
                {id ? 'project' : 'scratchpad'}
              </span>
            </div>
          </div>

          {/* Center: Primary Actions (Run, Auto-Run, Reset, Format, Font, Download) */}
          <div className="flex items-center gap-1.5">
            {/* Run Button */}
            <button
              type="button"
              onClick={handleRun}
              disabled={isCompiling}
              title="Run code (Ctrl/Cmd + R)"
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold cursor-pointer disabled:opacity-50 transition-colors ${
                isDirty && !autoRun
                  ? 'bg-amber-500 text-black ring-1 ring-amber-400'
                  : 'bg-amber-500 hover:bg-amber-400 text-black'
              }`}
            >
              <Play
                className={`w-3.5 h-3.5 fill-black ${
                  isCompiling ? 'animate-spin' : ''
                }`}
              />
              <span>Run</span>
              <kbd className="hidden md:inline-block ml-1 px-1 py-0.2 text-[9px] font-mono bg-black/15 text-black rounded">
                ⌘R
              </kbd>
            </button>

            {/* Auto Run Toggle */}
            <button
              type="button"
              onClick={handleToggleAutoRun}
              title={
                autoRun
                  ? 'Auto Run is ON (click to switch to Manual Run)'
                  : 'Auto Run is OFF (click to switch to Auto Run)'
              }
              className={`flex items-center gap-1.5 px-2 py-1 rounded border text-xs font-medium transition-colors cursor-pointer ${
                autoRun
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                  : 'border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)]'
              }`}
            >
              <Zap
                className={`w-3.5 h-3.5 ${
                  autoRun
                    ? 'fill-emerald-500 text-emerald-500'
                    : 'text-[var(--text-muted)]'
                }`}
              />
              <span className="hidden sm:inline">Auto Run</span>
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  autoRun ? 'bg-emerald-500' : 'bg-slate-400'
                }`}
              />
            </button>

            {/* Reset Button */}
            <button
              type="button"
              onClick={() => setIsResetModalOpen(true)}
              title="Reset project to default template"
              className="flex items-center gap-1.5 px-2 py-1 rounded border border-[var(--border-default)] bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xs font-medium transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset</span>
            </button>

            {/* Format All Documents */}
            <button
              type="button"
              onClick={handleFormatAll}
              title="Format All Code (Shift + Alt + F)"
              className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded border border-[var(--border-default)] bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xs font-medium transition-colors cursor-pointer"
            >
              {isFormatting ? (
                <Check className="w-3.5 h-3.5 text-emerald-500" />
              ) : (
                <AlignLeft className="w-3.5 h-3.5" />
              )}
              <span className="hidden sm:inline">
                {isFormatting ? 'Formatted' : 'Format'}
              </span>
            </button>

            {/* Change View / Layout Switcher */}
            <div className="relative" ref={layoutMenuRef}>
              <button
                type="button"
                onClick={() => setIsLayoutMenuOpen((prev) => !prev)}
                title="Change View (Layout)"
                className={`hidden sm:flex items-center gap-1.5 px-2 py-1 rounded border text-xs font-medium transition-colors cursor-pointer ${
                  isLayoutMenuOpen
                    ? 'border-amber-500/50 bg-[var(--bg-surface-active)] text-[var(--text-primary)] ring-1 ring-amber-500/30'
                    : 'border-[var(--border-default)] bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                {layout === 'top' ? (
                  <PanelTop className="w-3.5 h-3.5 text-amber-500" />
                ) : layout === 'left' ? (
                  <PanelLeft className="w-3.5 h-3.5 text-amber-500" />
                ) : (
                  <PanelRight className="w-3.5 h-3.5 text-amber-500" />
                )}
                <span>View</span>
                <ChevronDown
                  className={`w-3 h-3 text-[var(--text-muted)] transition-transform duration-150 ${
                    isLayoutMenuOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {/* Layout Dropdown Popover */}
              {isLayoutMenuOpen && (
                <div className="absolute left-0 mt-1.5 w-56 rounded border border-[var(--border-default)] bg-[var(--bg-surface)] p-1.5 shadow-xl z-50">
                  <div className="px-2 py-1 text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-wider">
                    Editor Layout
                  </div>
                  <div className="mt-1 flex flex-col gap-0.5">
                    {(
                      [
                        {
                          id: 'top',
                          label: 'Top View',
                          desc: 'Editors on top, preview on bottom',
                          icon: PanelTop,
                        },
                        {
                          id: 'left',
                          label: 'Left View',
                          desc: 'Editors on left, preview on right',
                          icon: PanelLeft,
                        },
                        {
                          id: 'right',
                          label: 'Right View',
                          desc: 'Preview on left, editors on right',
                          icon: PanelRight,
                        },
                      ] as const
                    ).map((item) => {
                      const Icon = item.icon;
                      const isSelected = layout === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleLayoutChange(item.id)}
                          className={`flex items-start gap-2 p-1.5 rounded text-left transition-colors cursor-pointer ${
                            isSelected
                              ? 'bg-amber-500/10 text-[var(--text-primary)] border border-amber-500/30'
                              : 'hover:bg-[var(--bg-surface-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-transparent'
                          }`}
                        >
                          <div
                            className={`p-1 rounded mt-0.5 ${
                              isSelected
                                ? 'bg-amber-500 text-black'
                                : 'bg-[var(--bg-surface-muted)] text-[var(--text-muted)]'
                            }`}
                          >
                            <Icon className="w-3.5 h-3.5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-medium">
                                {item.label}
                              </span>
                              {isSelected && (
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                              )}
                            </div>
                            <p className="text-[10px] text-[var(--text-muted)] leading-tight">
                              {item.desc}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Font Size Adjusters */}
            <div className="hidden md:flex items-center rounded border border-[var(--border-default)] bg-[var(--bg-surface)] p-0.5">
              <button
                type="button"
                onClick={() => handleFontSize('decreaseFontSize')}
                title="Decrease font size"
                className="p-1 rounded text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors cursor-pointer"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="px-1.5 text-[11px] font-mono text-[var(--text-muted)] min-w-[34px] text-center">
                {numericFontSize}px
              </span>
              <button
                type="button"
                onClick={() => handleFontSize('increaseFontSize')}
                title="Increase font size"
                className="p-1 rounded text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors cursor-pointer"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Download ZIP */}
            <button
              type="button"
              onClick={handleDownloadZip}
              title="Download Project ZIP (HTML, CSS, JS)"
              className="hidden sm:flex items-center p-1.5 rounded border border-[var(--border-default)] bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Right: Theme, Help */}
          <div className="flex items-center gap-1.5">
            <ThemeSelector compact={true} />

            <button
              type="button"
              onClick={() => helpDialogRef.current?.open()}
              title="Keyboard Shortcuts"
              className="flex items-center p-1.5 rounded border border-[var(--border-default)] bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5" />
            </button>
          </div>
        </nav>

        {/* Mobile Viewport Tab Switcher */}
        {!isDesktop && (
          <div className="h-9 w-full flex items-center justify-between px-2 bg-[var(--bg-surface)] border-b border-[var(--border-default)] shrink-0 select-none overflow-x-auto">
            <div className="flex items-center gap-1">
              {(
                [
                  { id: 'html', label: 'HTML', color: 'text-orange-500' },
                  { id: 'css', label: 'CSS', color: 'text-blue-500' },
                  { id: 'js', label: 'JS', color: 'text-amber-500' },
                  {
                    id: 'preview',
                    label: 'Preview',
                    color: 'text-emerald-500',
                  },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveMobileTab(tab.id)}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                    activeMobileTab === tab.id
                      ? 'bg-[var(--bg-surface-active)] text-[var(--text-primary)] shadow-2xs'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <span className={activeMobileTab === tab.id ? tab.color : ''}>
                    {tab.label}
                  </span>
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleFormatAll}
                title="Format All Code"
                className="p-1 rounded text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              >
                {isFormatting ? (
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                ) : (
                  <AlignLeft className="w-3.5 h-3.5" />
                )}
              </button>
              <button
                type="button"
                onClick={handleDownloadZip}
                title="Download Project ZIP"
                className="p-1 rounded text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Main Workspace Area */}
        <section className="flex-1 w-full relative overflow-hidden">
          {isDesktop ? (
            layout === 'left' ? (
              /* Left View: Editors stacked vertically on left, Preview on right */
              <Split
                key="left-layout"
                direction="horizontal"
                sizes={[42, 58]}
                minSize={240}
                gutterSize={6}
                className="split flex h-full w-full"
              >
                {renderVerticalEditorStack()}
                {renderPreview()}
              </Split>
            ) : layout === 'right' ? (
              /* Right View: Preview on left, Editors stacked vertically on right */
              <Split
                key="right-layout"
                direction="horizontal"
                sizes={[58, 42]}
                minSize={240}
                gutterSize={6}
                className="split flex h-full w-full"
              >
                {renderPreview()}
                {renderVerticalEditorStack()}
              </Split>
            ) : (
              /* Top View (Default): Editors side-by-side on top, Preview on bottom */
              <Split
                key="top-layout"
                direction="vertical"
                sizes={[50, 50]}
                minSize={140}
                gutterSize={6}
                className="split-vertical flex flex-col h-full w-full"
              >
                {renderHorizontalEditorRow()}
                {renderPreview()}
              </Split>
            )
          ) : (
            /* Mobile Single View Tabs */
            <div className="h-full w-full relative">
              {/* HTML Tab */}
              <div
                className={`h-full flex flex-col bg-[var(--bg-app)] ${
                  activeMobileTab === 'html' ? '' : 'hidden'
                }`}
              >
                <Suspense fallback={<CodeEditorSkeleton />}>
                  <CodeEditor
                    language="html"
                    path="index.html"
                    code={html}
                    editorRef={htmlEditorRef}
                    currentFontSize={numericFontSize}
                    onChange={(val) => setHtml(val ?? '')}
                  />
                </Suspense>
              </div>

              {/* CSS Tab */}
              <div
                className={`h-full flex flex-col bg-[var(--bg-app)] ${
                  activeMobileTab === 'css' ? '' : 'hidden'
                }`}
              >
                <Suspense fallback={<CodeEditorSkeleton />}>
                  <CodeEditor
                    language="css"
                    path="style.css"
                    code={css}
                    editorRef={cssEditorRef}
                    currentFontSize={numericFontSize}
                    onChange={(val) => setCss(val ?? '')}
                  />
                </Suspense>
              </div>

              {/* JavaScript Tab */}
              <div
                className={`h-full flex flex-col bg-[var(--bg-app)] ${
                  activeMobileTab === 'js' ? '' : 'hidden'
                }`}
              >
                <Suspense fallback={<CodeEditorSkeleton />}>
                  <CodeEditor
                    language="javascript"
                    path="script.js"
                    code={javascript}
                    editorRef={jsEditorRef}
                    currentFontSize={numericFontSize}
                    onChange={(val) => setJavascript(val ?? '')}
                  />
                </Suspense>
              </div>

              {/* Live Preview & Console Tab */}
              <div
                className={`h-full ${
                  activeMobileTab === 'preview' ? '' : 'hidden'
                }`}
              >
                <HTMLPreview
                  ref={previewRef}
                  projectId={id}
                  compiledDoc={compiledDoc}
                  isCompiling={isCompiling}
                  onManualReload={handleRun}
                />
              </div>
            </div>
          )}
        </section>
      </main>

      <HelpModal ref={helpDialogRef} />
      <HTMLResetModal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        onConfirm={executeReset}
      />
    </Fragment>
  );
}

export default function HTMLPlayground() {
  const { id } = useParams<{ id: string }>();
  return (
    <HTMLPlaygroundCore
      key={id ? `project-${id}` : 'scratch-playground'}
      id={id}
    />
  );
}
