import {
  useEffect,
  useRef,
  useState,
  useImperativeHandle,
  forwardRef,
} from 'react';
import {
  RotateCcw,
  Smartphone,
  Tablet,
  Monitor,
  Maximize2,
  Globe,
  ExternalLink,
} from 'lucide-react';
import { HTMLConsoleDrawer, HTMLConsoleRef } from './HTMLConsoleDrawer';
import { SENDER_KEY } from '../../utils/htmlCompiler';
import { saveLivePreviewDoc } from '../../utils/previewStorage';

export interface HTMLPreviewRef {
  reload: () => void;
  getConsoleRef: () => HTMLConsoleRef | null;
}

interface HTMLPreviewProps {
  compiledDoc: string;
  isCompiling?: boolean;
  onManualReload?: () => void;
  className?: string;
  projectId?: string;
}

type ViewportMode = 'responsive' | 'mobile' | 'tablet' | 'desktop';

export const HTMLPreview = forwardRef<HTMLPreviewRef, HTMLPreviewProps>(
  function HTMLPreview(
    {
      compiledDoc,
      isCompiling = false,
      onManualReload,
      className = '',
      projectId,
    },
    ref
  ) {
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const consoleDrawerRef = useRef<HTMLConsoleRef>(null);
    const previewContainerRef = useRef<HTMLDivElement>(null);
    const drawerWrapperRef = useRef<HTMLDivElement>(null);
    const [viewport, setViewport] = useState<ViewportMode>('responsive');
    const [iframeKey, setIframeKey] = useState(0);
    const [isConsoleOpen, setIsConsoleOpen] = useState(false);
    const [isConsoleMaximized, setIsConsoleMaximized] = useState(false);
    const [consoleHeight, setConsoleHeight] = useState(220);
    const [isDraggingConsole, setIsDraggingConsole] = useState(false);

    const handleStartResize = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const startY = e.clientY;
      const initialHeight =
        drawerWrapperRef.current?.clientHeight || consoleHeight;
      let currentHeight = initialHeight;
      let rafId: number | null = null;
      let hasDragged = false;

      const handleMouseMove = (moveEvent: MouseEvent) => {
        const deltaY = startY - moveEvent.clientY; // moving upward increases height
        if (Math.abs(deltaY) > 2) {
          hasDragged = true;
        }

        const containerH =
          previewContainerRef.current?.clientHeight || window.innerHeight;
        const maxH = Math.max(120, containerH - 60);
        const minH = 50;
        currentHeight = Math.max(minH, Math.min(maxH, initialHeight + deltaY));

        if (rafId === null) {
          rafId = requestAnimationFrame(() => {
            if (drawerWrapperRef.current) {
              drawerWrapperRef.current.style.height = `${currentHeight}px`;
            }
            rafId = null;
          });
        }
      };

      const handleMouseUp = () => {
        if (rafId !== null) cancelAnimationFrame(rafId);
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        setIsDraggingConsole(false);

        if (hasDragged) {
          setConsoleHeight(currentHeight);
        }
      };

      setIsDraggingConsole(true);
      document.body.style.cursor = 'row-resize';
      document.body.style.userSelect = 'none';
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    };

    // Listen for postMessage from the sandboxed iframe
    useEffect(() => {
      const handleMessage = (event: MessageEvent) => {
        if (
          !iframeRef.current ||
          event.source !== iframeRef.current.contentWindow
        ) {
          return;
        }

        const data = event.data;
        if (!data || typeof data !== 'object' || data.source !== SENDER_KEY) {
          return;
        }

        if (
          data.type === 'console' &&
          data.method &&
          Array.isArray(data.args)
        ) {
          const method = (
            consoleDrawerRef.current &&
            typeof consoleDrawerRef.current[
              data.method as keyof HTMLConsoleRef
            ] === 'function'
              ? data.method
              : 'log'
          ) as 'log' | 'info' | 'warn' | 'error';
          if (
            consoleDrawerRef.current &&
            typeof consoleDrawerRef.current[method] === 'function'
          ) {
            consoleDrawerRef.current[method](...data.args);
          }
        } else if (data.type === 'error') {
          if (consoleDrawerRef.current) {
            consoleDrawerRef.current.error(...(data.args || [data.message]));
          }
          // Optionally auto-open console on error if closed
          setIsConsoleOpen(true);
        } else if (data.type === 'clear') {
          consoleDrawerRef.current?.clear();
        }
      };

      window.addEventListener('message', handleMessage);
      return () => {
        window.removeEventListener('message', handleMessage);
      };
    }, []);

    // Clear console when code recompiles and broadcast to standalone preview tabs
    useEffect(() => {
      consoleDrawerRef.current?.clear();

      if (compiledDoc) {
        const targetId = projectId || 'scratch';
        // 1. Sync to localStorage for initial load / persistence
        saveLivePreviewDoc(targetId, compiledDoc);

        // 2. Broadcast immediately over BroadcastChannel to open preview tabs
        if (typeof BroadcastChannel !== 'undefined') {
          try {
            const channel = new BroadcastChannel('runjs_html_live_preview');
            channel.postMessage({
              type: 'LIVE_DOC_UPDATE',
              targetId,
              compiledDoc,
              timestamp: Date.now(),
            });
            channel.close();
          } catch (e) {
            console.error('BroadcastChannel error', e);
          }
        }
      }
    }, [compiledDoc, projectId]);

    const reloadIframe = () => {
      consoleDrawerRef.current?.clear();
      setIframeKey((prev) => prev + 1);
    };

    const handleReload = () => {
      reloadIframe();
      onManualReload?.();
    };

    useImperativeHandle(ref, () => ({
      reload: reloadIframe,
      getConsoleRef: () => consoleDrawerRef.current,
    }));

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

    const handleOpenInNewTab = () => {
      const targetId = projectId || 'scratch';
      saveLivePreviewDoc(targetId, compiledDoc);
      const previewUrl = `${window.location.origin}/html-preview?target=${targetId}`;
      window.open(previewUrl, `runjs_html_preview_${targetId}`);
    };

    return (
      <div
        ref={previewContainerRef}
        className={`h-full w-full flex flex-col bg-[var(--bg-app)] overflow-hidden relative ${className}`}
      >
        {/* Full-screen drag overlay when resizing console to prevent iframe mouse eating and guarantee smooth drag */}
        {isDraggingConsole && (
          <div className="fixed inset-0 z-50 cursor-row-resize select-none" />
        )}

        {/* Preview Top Toolbar */}
        <div className="h-8 px-3 flex items-center justify-between bg-[var(--bg-surface)] border-b border-[var(--border-default)] select-none shrink-0 text-xs">
          {/* Left: Reload & URL Bar */}
          <div className="flex items-center gap-2 flex-1 max-w-md mr-2">
            <button
              type="button"
              onClick={handleReload}
              title="Reload Preview (Ctrl/Cmd + R)"
              className="p-1 rounded text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors"
            >
              <RotateCcw
                className={`w-3.5 h-3.5 ${isCompiling ? 'animate-spin' : ''}`}
              />
            </button>

            {/* URL Display */}
            <div className="flex-1 flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-[var(--bg-surface-muted)] border border-[var(--border-default)] text-[11px] font-mono text-[var(--text-secondary)]">
              <Globe className="w-3 h-3 text-[var(--text-muted)] shrink-0" />
              <span className="truncate">preview://output</span>
              <div className="ml-auto flex items-center gap-1">
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isCompiling ? 'bg-amber-500 animate-ping' : 'bg-emerald-500'
                  }`}
                />
                <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-semibold">
                  {isCompiling ? 'Compiling' : 'Live'}
                </span>
              </div>
            </div>
          </div>

          {/* Right: Viewport Modes & Popout */}
          <div className="flex items-center gap-1">
            <div className="hidden sm:flex items-center rounded-md border border-[var(--border-default)] bg-[var(--bg-surface-muted)] p-0.5">
              <button
                type="button"
                onClick={() => setViewport('responsive')}
                title="Fluid Responsive"
                className={`p-1 rounded transition-colors ${
                  viewport === 'responsive'
                    ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-2xs'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                <Maximize2 className="w-3 h-3" />
              </button>
              <button
                type="button"
                onClick={() => setViewport('desktop')}
                title="Desktop (1024px)"
                className={`p-1 rounded transition-colors ${
                  viewport === 'desktop'
                    ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-2xs'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                <Monitor className="w-3 h-3" />
              </button>
              <button
                type="button"
                onClick={() => setViewport('tablet')}
                title="Tablet (768px)"
                className={`p-1 rounded transition-colors ${
                  viewport === 'tablet'
                    ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-2xs'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                <Tablet className="w-3 h-3" />
              </button>
              <button
                type="button"
                onClick={() => setViewport('mobile')}
                title="Mobile (375px)"
                className={`p-1 rounded transition-colors ${
                  viewport === 'mobile'
                    ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-2xs'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                <Smartphone className="w-3 h-3" />
              </button>
            </div>

            <button
              type="button"
              onClick={handleOpenInNewTab}
              title="Open Preview in New Tab"
              className="p-1 rounded text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Live Canvas Area */}
        <div className="flex-1 min-h-0 w-full flex items-center justify-center bg-[var(--bg-app)] overflow-auto p-1 relative">
          <div
            style={{
              width: getViewportWidth(),
              height: '100%',
              transition: 'width 200ms ease',
            }}
            className={`h-full relative overflow-hidden bg-white ${
              viewport !== 'responsive'
                ? 'rounded-lg border border-[var(--border-default)] shadow-lg'
                : ''
            }`}
          >
            <iframe
              ref={iframeRef}
              key={iframeKey}
              title="RunJS Live Preview"
              sandbox="allow-scripts allow-modals"
              srcDoc={compiledDoc}
              className="w-full h-full border-none bg-white"
            />
          </div>
        </div>

        {/* Console Resizer Gutter (Clean, subtle splitter line matching IDE theme) */}
        {!isConsoleMaximized && isConsoleOpen && (
          <div
            onMouseDown={handleStartResize}
            title="Drag to resize console"
            className="h-2 w-full shrink-0 cursor-row-resize bg-[var(--border-default)] hover:bg-amber-500/50 active:bg-amber-500 transition-colors z-30 flex items-center justify-center select-none group"
          >
            <div className="w-8 h-0.5 rounded-full bg-[var(--text-muted)] opacity-40 group-hover:opacity-100 group-hover:bg-white transition-opacity" />
          </div>
        )}

        {/* Bottom Console Drawer Wrapper */}
        <div
          ref={drawerWrapperRef}
          style={{
            height: isConsoleMaximized
              ? undefined
              : isConsoleOpen
                ? `${consoleHeight}px`
                : '32px',
            transition: isDraggingConsole ? 'none' : 'height 150ms ease',
          }}
          className={`relative flex flex-col bg-[var(--bg-app)] border-t border-[var(--border-default)] z-20 overflow-hidden ${
            isConsoleMaximized
              ? 'h-full w-full absolute inset-0 z-30'
              : 'shrink-0'
          }`}
        >
          <HTMLConsoleDrawer
            ref={consoleDrawerRef}
            isOpen={isConsoleOpen}
            onToggle={() => setIsConsoleOpen((prev) => !prev)}
            isMaximized={isConsoleMaximized}
            onToggleMaximize={() => setIsConsoleMaximized((prev) => !prev)}
          />
        </div>
      </div>
    );
  }
);
