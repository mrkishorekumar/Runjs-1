import { useState, useRef, useEffect, useMemo } from 'react';
import { Link } from 'react-router';
import { UserCodeBase } from '../../utils/interface';
import { compileHtmlDocument, SENDER_KEY } from '../../utils/htmlCompiler';
import { saveLivePreviewDoc } from '../../utils/previewStorage';
import { HTMLConsoleDrawer, HTMLConsoleRef } from './HTMLConsoleDrawer';
import {
  X,
  ExternalLink,
  RotateCw,
  Code2,
  Monitor,
  Tablet,
  Smartphone,
  Maximize2,
  Eye,
} from 'lucide-react';

interface HTMLDashboardPreviewModalProps {
  project: UserCodeBase | null;
  onClose: () => void;
}

type ViewportMode = 'responsive' | 'mobile' | 'tablet' | 'desktop';

export default function HTMLDashboardPreviewModal({
  project,
  onClose,
}: HTMLDashboardPreviewModalProps) {
  const [viewport, setViewport] = useState<ViewportMode>('responsive');
  const [iframeKey, setIframeKey] = useState(0);
  const [isConsoleOpen, setIsConsoleOpen] = useState(false);
  const consoleDrawerRef = useRef<HTMLConsoleRef>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Close on Escape
  useEffect(() => {
    if (!project) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [project, onClose]);

  // Compile document
  const compiledDoc = useMemo(() => {
    if (!project) return '';
    return compileHtmlDocument({
      html: project.htmlCode || '',
      css: project.cssCode || '',
      javascript: project.jsCode || project.code || '',
      enableLoopProtection: true,
    });
  }, [project]);

  // Listen to iframe console messages
  useEffect(() => {
    if (!project) return;
    const handleMessage = (event: MessageEvent) => {
      if (
        !iframeRef.current ||
        event.source !== iframeRef.current.contentWindow
      ) {
        return;
      }

      const data = event.data;
      if (!data || typeof data !== 'object' || data.source !== SENDER_KEY)
        return;

      if (data.type === 'console' && data.method && Array.isArray(data.args)) {
        const method = (
          typeof consoleDrawerRef.current?.[
            data.method as keyof HTMLConsoleRef
          ] === 'function'
            ? data.method
            : 'log'
        ) as 'log' | 'info' | 'warn' | 'error';
        if (typeof consoleDrawerRef.current?.[method] === 'function') {
          consoleDrawerRef.current[method](...data.args);
        }
      } else if (data.type === 'error') {
        consoleDrawerRef.current?.error(
          `${data.message || 'Error'} (Line ${data.lineno ?? '?'})`
        );
        setIsConsoleOpen(true);
      } else if (data.type === 'clear') {
        consoleDrawerRef.current?.clear();
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [project, iframeKey]);

  if (!project) return null;

  const getViewportWidth = () => {
    switch (viewport) {
      case 'mobile':
        return '375px';
      case 'tablet':
        return '768px';
      case 'desktop':
        return '1024px';
      default:
        return '100%';
    }
  };

  const handleReload = () => {
    consoleDrawerRef.current?.clear();
    setIframeKey((prev) => prev + 1);
  };

  const handleOpenInNewTab = () => {
    saveLivePreviewDoc(project.id, compiledDoc);
    const previewUrl = `${window.location.origin}/html-preview?target=${project.id}`;
    window.open(previewUrl, `runjs_html_preview_${project.id}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Backdrop click to close */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal Dialog Card */}
      <div
        className="relative z-10 w-full max-w-6xl h-[90vh] flex flex-col rounded-xl overflow-hidden bg-[var(--bg-surface-elevated)] border border-[var(--border-default)] shadow-2xl animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Bar */}
        <div className="h-12 w-full shrink-0 flex items-center justify-between px-4 bg-[var(--bg-surface)] border-b border-[var(--border-default)] select-none">
          {/* Left: Project title & badge */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex items-center justify-center w-7 h-7 rounded-md bg-gradient-to-br from-orange-500 to-amber-600 text-white shadow-xs shrink-0">
              <Eye className="w-4 h-4" />
            </div>
            <div className="flex items-center gap-2 truncate">
              <span className="text-sm font-semibold text-[var(--text-primary)] truncate">
                {project.fileName}
              </span>
              <span className="hidden sm:inline-flex px-2 py-0.5 text-[10px] font-semibold rounded bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20 shrink-0">
                HTML Live Preview
              </span>
            </div>
          </div>

          {/* Center: Viewport Controls */}
          <div className="hidden md:flex items-center bg-[var(--bg-surface-hover)] rounded-lg p-0.5 border border-[var(--border-default)] gap-0.5">
            <button
              type="button"
              onClick={() => setViewport('responsive')}
              title="Responsive View (100%)"
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                viewport === 'responsive'
                  ? 'bg-[var(--bg-surface-active)] text-[var(--text-primary)] shadow-xs'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>Full</span>
            </button>
            <button
              type="button"
              onClick={() => setViewport('desktop')}
              title="Desktop (1024px)"
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                viewport === 'desktop'
                  ? 'bg-[var(--bg-surface-active)] text-[var(--text-primary)] shadow-xs'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>Desktop</span>
            </button>
            <button
              type="button"
              onClick={() => setViewport('tablet')}
              title="Tablet (768px)"
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                viewport === 'tablet'
                  ? 'bg-[var(--bg-surface-active)] text-[var(--text-primary)] shadow-xs'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Tablet className="w-3.5 h-3.5" />
              <span>Tablet</span>
            </button>
            <button
              type="button"
              onClick={() => setViewport('mobile')}
              title="Mobile (375px)"
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                viewport === 'mobile'
                  ? 'bg-[var(--bg-surface-active)] text-[var(--text-primary)] shadow-xs'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Mobile</span>
            </button>
          </div>

          {/* Right: Actions (Reload, New Tab, Open Editor, Close) */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleReload}
              title="Reload preview"
              className="p-1.5 rounded-md text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors cursor-pointer"
            >
              <RotateCw className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={handleOpenInNewTab}
              title="Open in new tab"
              className="p-1.5 rounded-md text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors cursor-pointer"
            >
              <ExternalLink className="w-4 h-4" />
            </button>

            <Link
              to={`/html/${project.id}`}
              title="Open in CodePen Editor"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white shadow-xs transition-all active:scale-[0.98]"
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>Open Editor</span>
            </Link>

            <div className="h-4 w-px bg-[var(--border-default)] mx-1" />

            <button
              type="button"
              onClick={onClose}
              title="Close preview (Esc)"
              className="p-1.5 rounded-md text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Live Canvas Area */}
        <div className="flex-1 min-h-0 w-full flex flex-col bg-[var(--bg-app)] overflow-hidden relative">
          <div className="flex-1 min-h-0 w-full flex items-center justify-center p-2 sm:p-4 overflow-auto">
            <div
              style={{ width: getViewportWidth(), maxWidth: '100%' }}
              className="h-full bg-white rounded-lg shadow-lg border border-[var(--border-default)] overflow-hidden transition-all duration-200"
            >
              <iframe
                ref={iframeRef}
                key={iframeKey}
                title={`Live Preview - ${project.fileName}`}
                srcDoc={compiledDoc}
                sandbox="allow-scripts allow-modals"
                className="w-full h-full border-none bg-white block"
              />
            </div>
          </div>

          {/* Console Drawer */}
          <div
            style={{ height: isConsoleOpen ? '180px' : '36px' }}
            className="w-full shrink-0 border-t border-[var(--border-default)] transition-[height] duration-150 ease-out"
          >
            <HTMLConsoleDrawer
              ref={consoleDrawerRef}
              isOpen={isConsoleOpen}
              onToggle={() => setIsConsoleOpen((prev) => !prev)}
              onClear={() => consoleDrawerRef.current?.clear()}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
