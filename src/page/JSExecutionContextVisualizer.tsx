import {
  Fragment,
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
  Suspense,
} from 'react';
import { Link, useLocation } from 'react-router';
import Split from 'react-split';
import {
  Play,
  ChevronLeft,
  ZoomIn,
  ZoomOut,
  AlignLeft,
  RotateCcw,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import CodeEditorSkeleton from '../components/skeletons/CodeEditorSkeleton';
import { lazyWithRetry } from '../utils/lazyWithRetry';

const CodeEditor = lazyWithRetry(() => import('../components/CodeEditor'));
import ThemeSelector from '../components/ThemeSelector';
import SEO from '../seo/SEO';
import { getBreadcrumbSchema, getWebApplicationSchema } from '../seo/seoConfig';
import useMediaQuery from '../hook/useMediaQuery';
import useLocalStorageState from '../hook/useLocalStorageState';
import useAdjustFontSize from '../hook/useAdjustFontSize';
import useFormatDocument from '../hook/useFormatDocument';
import HelpModal from '../components/HelpModal';
import { ModalRef } from '../utils/interface';

import { simulateExecutionContext } from '../execution-context/engine/interpreter';
import { CONTEXT_PRESETS } from '../execution-context/engine/presets';
import {
  ContextExecutionStep,
  ContextPreset,
} from '../execution-context/engine/types';

import ExecutionContextBox from '../execution-context/components/ExecutionContextBox';
import ContextCallStack from '../execution-context/components/ContextCallStack';
import ContextControls from '../execution-context/components/ContextControls';
import ContextNarration from '../execution-context/components/ContextNarration';
import ContextConsole from '../execution-context/components/ContextConsole';
import ContextPresetsDropdown from '../execution-context/components/ContextPresetsDropdown';
import ToolInterlinkMenu from '../components/ToolInterlinkMenu';
import ImportNotificationToast from '../components/ImportNotificationToast';
import { consumeTransferredCode } from '../utils/crossToolTransfer';

function JSExecutionContextVisualizer() {
  const location = useLocation();
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const [currentFontSize, setFontSize] = useLocalStorageState(
    'executionContextFontSize',
    '14'
  );

  // Active preset & code state
  const defaultPreset = CONTEXT_PRESETS[0];
  const [currentPresetId, setCurrentPresetId] = useState<string | null>(
    defaultPreset.id
  );
  const [code, setCode] = useState<string>(defaultPreset.code);

  // Stepping & simulation state
  const [steps, setSteps] = useState<ContextExecutionStep[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [speed, setSpeed] = useState<number>(1);
  const [syntaxError, setSyntaxError] = useState<string | null>(null);
  const [importSource, setImportSource] = useState<string | null>(null);

  // Selected execution context for inspector
  const [selectedContextId, setSelectedContextId] = useState<string>('gec');

  // Mobile navigation tab
  const [activeMobileTab, setActiveMobileTab] = useState<
    'editor' | 'context' | 'stack' | 'console'
  >('context');

  /* eslint-disable  @typescript-eslint/no-explicit-any */
  const editorRef = useRef<any>(null);
  const decorationsRef = useRef<string[]>([]);
  const dialogRef = useRef<ModalRef>(null);
  const playbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSimulatedCodeRef = useRef<string>('');

  // Execute simulation and generate steps
  const runSimulation = useCallback(
    (codeToRun: string, startPlaying: boolean = false) => {
      setIsPlaying(false);
      if (playbackTimerRef.current) {
        clearTimeout(playbackTimerRef.current);
        playbackTimerRef.current = null;
      }

      lastSimulatedCodeRef.current = codeToRun;

      if (!codeToRun || codeToRun.trim() === '') {
        setSyntaxError(null);
        setSteps([]);
        setCurrentStepIndex(0);
        return;
      }

      const result = simulateExecutionContext(codeToRun);
      if (!result.success) {
        setSyntaxError(result.error);
        setSteps([]);
        setCurrentStepIndex(0);
        return;
      }

      setSyntaxError(null);
      setSteps(result.steps);
      setCurrentStepIndex(0);
      if (result.steps.length > 0) {
        setSelectedContextId(result.steps[0].activeContextId);
      }

      if (startPlaying && result.steps.length > 1) {
        setIsPlaying(true);
      }
    },
    []
  );

  // Handle editor code change with debounced live simulation
  const handleCodeChange = useCallback(
    (newCode: string) => {
      setCode(newCode);
      setCurrentPresetId(null);

      // Stop any active playback immediately on code change
      setIsPlaying(false);
      if (playbackTimerRef.current) {
        clearTimeout(playbackTimerRef.current);
        playbackTimerRef.current = null;
      }

      // If user cleared code completely
      if (!newCode || newCode.trim() === '') {
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
          debounceTimerRef.current = null;
        }
        runSimulation(newCode, false);
        return;
      }

      // Debounce simulation while typing
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = setTimeout(() => {
        runSimulation(newCode, false);
      }, 600);
    },
    [runSimulation]
  );

  // Clean up debounce and playback timers on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (playbackTimerRef.current) {
        clearTimeout(playbackTimerRef.current);
      }
    };
  }, []);

  // Run initial simulation on mount
  useEffect(() => {
    const transferred = consumeTransferredCode(
      'execution-context',
      location.state as { code?: string; source?: string } | undefined,
      location.search
    );

    if (transferred && transferred.code !== undefined) {
      setCode(transferred.code);
      setCurrentPresetId(null);
      runSimulation(transferred.code, false);
      if (transferred.source) {
        setImportSource(transferred.source);
      }
      if (location.state && (location.state as { code?: string }).code) {
        window.history.replaceState({}, document.title);
      }
    } else {
      runSimulation(defaultPreset.code, false);
    }
  }, [location.state, location.search, runSimulation, defaultPreset.code]);

  // Handle preset selection
  const handleSelectPreset = useCallback(
    (preset: ContextPreset) => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
      setCurrentPresetId(preset.id);
      setCode(preset.code);
      runSimulation(preset.code, false);
      if (!isDesktop) {
        setActiveMobileTab('context');
      }
    },
    [runSimulation, isDesktop]
  );

  // Current active step snapshot
  const currentStep = useMemo(() => {
    if (steps.length === 0 || currentStepIndex >= steps.length) return null;
    return steps[currentStepIndex];
  }, [steps, currentStepIndex]);

  // Keep selected context updated when step changes unless user explicitly switched
  useEffect(() => {
    if (currentStep) {
      setSelectedContextId(currentStep.activeContextId);
    }
  }, [currentStep]);

  // Step Forward
  const handleStepForward = useCallback(() => {
    if (code !== lastSimulatedCodeRef.current) {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
      runSimulation(code, false);
      return;
    }

    setCurrentStepIndex((prev) => {
      if (prev < steps.length - 1) {
        return prev + 1;
      }
      setIsPlaying(false);
      return prev;
    });
  }, [code, steps.length, runSimulation]);

  // Step Backward
  const handleStepBackward = useCallback(() => {
    if (code !== lastSimulatedCodeRef.current) {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
      runSimulation(code, false);
      return;
    }
    setCurrentStepIndex((prev) => Math.max(0, prev - 1));
  }, [code, runSimulation]);

  // Reset to beginning
  const handleReset = useCallback(() => {
    setIsPlaying(false);
    if (code !== lastSimulatedCodeRef.current) {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
      runSimulation(code, false);
      return;
    }
    setCurrentStepIndex(0);
  }, [code, runSimulation]);

  // Seek / Scrub
  const handleSeek = useCallback(
    (stepIndex: number) => {
      setIsPlaying(false);
      if (code !== lastSimulatedCodeRef.current) {
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
          debounceTimerRef.current = null;
        }
        runSimulation(code, false);
        return;
      }
      setCurrentStepIndex(stepIndex);
    },
    [code, runSimulation]
  );

  // Play / Pause toggle
  const handlePlayToggle = useCallback(() => {
    if (code !== lastSimulatedCodeRef.current) {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
      runSimulation(code, true);
      return;
    }

    if (steps.length === 0) {
      if (code && code.trim() !== '') {
        runSimulation(code, true);
      }
      return;
    }

    if (currentStepIndex >= steps.length - 1) {
      setCurrentStepIndex(0);
      setIsPlaying(true);
      return;
    }

    setIsPlaying((prev) => !prev);
  }, [code, steps.length, currentStepIndex, runSimulation]);

  // Playback loop
  useEffect(() => {
    if (!isPlaying) {
      if (playbackTimerRef.current) {
        clearTimeout(playbackTimerRef.current);
        playbackTimerRef.current = null;
      }
      return;
    }

    const intervalMs = Math.round(900 / speed);

    playbackTimerRef.current = setTimeout(() => {
      setCurrentStepIndex((prev) => {
        if (prev >= steps.length - 1) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, intervalMs);

    return () => {
      if (playbackTimerRef.current) {
        clearTimeout(playbackTimerRef.current);
      }
    };
  }, [isPlaying, currentStepIndex, steps.length, speed]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.closest('.monaco-editor')
      ) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        handlePlayToggle();
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        handleStepForward();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        handleStepBackward();
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        handleReset();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlePlayToggle, handleStepForward, handleStepBackward, handleReset]);

  // Synchronize active code line in Monaco editor
  useEffect(() => {
    if (!editorRef.current) return;
    const editor = editorRef.current;

    if (currentStep && currentStep.activeLine !== null) {
      const line = currentStep.activeLine;
      decorationsRef.current = editor.deltaDecorations(decorationsRef.current, [
        {
          range: {
            startLineNumber: line,
            startColumn: 1,
            endLineNumber: line,
            endColumn: 1,
          },
          options: {
            isWholeLine: true,
            className: 'monaco-execution-line-highlight',
            glyphMarginClassName: 'monaco-execution-glyph',
          },
        },
      ]);
      editor.revealLineInCenterIfOutsideViewport(line);
    } else {
      decorationsRef.current = editor.deltaDecorations(
        decorationsRef.current,
        []
      );
    }
  }, [currentStep]);

  // Font Size Adjustment
  function handleFontSize(operation: 'increaseFontSize' | 'decreaseFontSize') {
    let fontSize = Number(currentFontSize);
    if (operation === 'increaseFontSize') {
      fontSize = Math.min(fontSize + 1, 28);
    } else {
      fontSize = Math.max(fontSize - 1, 10);
    }
    setFontSize(fontSize.toString());
  }

  useAdjustFontSize(handleFontSize);
  useFormatDocument(() => {
    if (editorRef.current) {
      editorRef.current.getAction('editor.action.formatDocument')?.run();
    }
  });

  return (
    <Fragment>
      <SEO
        title="JavaScript Execution Context Visualizer - Memory Allocation, Hoisting & Call Stack | RunJS"
        description="Interactive visualizer for the JavaScript Execution Context. Step through the Memory Allocation Phase, Code Execution Phase line by line, Global and Function Execution Contexts, and the Call Stack in real time."
        canonical="/execution-context"
        keywords={[
          'JavaScript execution context visualizer',
          'memory creation phase javascript',
          'code execution phase javascript',
          'hoisting visualizer',
          'call stack execution context',
          'namaste javascript visualizer',
          'variable environment visualizer',
          'temporal dead zone visualizer',
        ]}
        structuredData={[
          getBreadcrumbSchema([
            { name: 'Home', item: '/' },
            {
              name: 'JavaScript Execution Context Visualizer',
              item: '/execution-context',
            },
          ]),
          getWebApplicationSchema(),
        ]}
      />

      <main className="h-screen w-full flex flex-col bg-[var(--bg-app)] overflow-hidden">
        {/* Top Navigation Toolbar */}
        <nav className="h-12 w-full flex items-center justify-between px-3 bg-[var(--bg-surface)] border-b border-[var(--border-default)] z-30 shrink-0 select-none">
          {/* Left: Brand / Title */}
          <div className="flex items-center gap-3">
            <Link
              to="/dashboard"
              title="Back to Dashboard"
              className="flex items-center gap-1.5 p-1.5 rounded-md hover:bg-[var(--bg-surface-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/60"
            >
              <ChevronLeft className="w-4 h-4" />
              <div className="flex items-center justify-center w-6 h-6 rounded bg-amber-500 text-black font-bold font-mono text-xs shadow-xs">
                JS
              </div>
            </Link>

            <div className="hidden sm:flex items-center gap-2">
              <span className="text-xs font-bold text-[var(--text-primary)]">
                JavaScript Visualizer
              </span>
              <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 uppercase tracking-wider font-mono">
                Execution Context
              </span>
            </div>
          </div>

          {/* Center: Presets & Action Button */}
          <div className="flex items-center gap-2">
            <ContextPresetsDropdown
              currentPresetId={currentPresetId}
              onSelectPreset={handleSelectPreset}
            />

            {/* Run & Visualize Primary Action */}
            <button
              type="button"
              onClick={() => {
                runSimulation(code, true);
                if (!isDesktop) setActiveMobileTab('context');
              }}
              title="Run & Visualize Code (Ctrl/Cmd + Enter)"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-black text-xs font-semibold shadow-xs transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/60"
            >
              <Play className="w-3.5 h-3.5 fill-black shrink-0" />
              <span className="hidden sm:inline">Run & Visualize</span>
              <span className="sm:hidden">Run</span>
            </button>

            {/* Cross-Tool Interlink Menu */}
            <ToolInterlinkMenu
              currentTool="execution-context"
              getCode={() => code}
            />

            {/* Format Document Button */}
            <button
              type="button"
              onClick={() => {
                if (editorRef.current) {
                  editorRef.current
                    .getAction('editor.action.formatDocument')
                    ?.run();
                }
              }}
              title="Format Code"
              aria-label="Format Code"
              className="hidden md:flex items-center p-1.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
            >
              <AlignLeft className="w-4 h-4" />
            </button>

            {/* Font Size Adjusters */}
            <div className="hidden lg:flex items-center rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] p-0.5">
              <button
                type="button"
                onClick={() => handleFontSize('decreaseFontSize')}
                title="Decrease font size"
                className="p-1 rounded text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors cursor-pointer"
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
                className="p-1 rounded text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors cursor-pointer"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Right: Theme & Help Buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Theme Selector */}
            <ThemeSelector compact={true} />

            {/* Help / Shortcuts Button */}
            <button
              type="button"
              onClick={() => dialogRef?.current?.open()}
              title="Keyboard Shortcuts & Visualizer Guide"
              aria-label="Help"
              className="p-1.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer shrink-0"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
          </div>
        </nav>

        {/* Mobile View Toggle Bar (visible only on mobile/tablet <lg) */}
        <div className="lg:hidden flex border-b border-[var(--border-default)] bg-[var(--bg-surface)] px-2 py-1.5 gap-1 shrink-0">
          <button
            type="button"
            onClick={() => setActiveMobileTab('editor')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer text-center ${
              activeMobileTab === 'editor'
                ? 'bg-amber-500 text-black shadow-xs'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]'
            }`}
          >
            Code
          </button>
          <button
            type="button"
            onClick={() => setActiveMobileTab('context')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer text-center ${
              activeMobileTab === 'context'
                ? 'bg-amber-500 text-black shadow-xs'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]'
            }`}
          >
            Context
          </button>
          <button
            type="button"
            onClick={() => setActiveMobileTab('stack')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer text-center ${
              activeMobileTab === 'stack'
                ? 'bg-amber-500 text-black shadow-xs'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]'
            }`}
          >
            Stack
          </button>
          <button
            type="button"
            onClick={() => setActiveMobileTab('console')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer text-center ${
              activeMobileTab === 'console'
                ? 'bg-amber-500 text-black shadow-xs'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]'
            }`}
          >
            Console
          </button>
        </div>

        {/* Syntax Error Alert Banner */}
        {syntaxError && (
          <div className="px-4 py-2 bg-rose-500/10 border-b border-rose-500/20 text-xs text-rose-600 dark:text-rose-400 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>
                <strong>JavaScript Execution Error:</strong> {syntaxError}
              </span>
            </div>
            <button
              type="button"
              onClick={() => runSimulation(code, false)}
              className="flex items-center gap-1 text-[11px] font-bold underline hover:opacity-80 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Retry</span>
            </button>
          </div>
        )}

        {/* Main Split-Pane Workspace */}
        <section className="flex-1 w-full relative overflow-hidden">
          {isDesktop ? (
            /* Desktop Split Pane View */
            <Split
              className="split h-full w-full"
              sizes={[38, 62]}
              minSize={300}
              gutterSize={6}
            >
              {/* Left Column: Monaco Code Editor */}
              <div className="h-full flex flex-col overflow-hidden bg-[var(--bg-app)] border-r border-[var(--border-default)]">
                {/* Editor Tab Bar */}
                <div className="flex items-center justify-between px-3 py-1.5 bg-[var(--bg-surface)] border-b border-[var(--border-default)] text-xs select-none">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-semibold text-[var(--text-primary)]">
                      script.js
                    </span>
                    <span className="text-[10px] text-[var(--text-muted)] font-mono">
                      • Editable Code
                    </span>
                  </div>
                  <span className="text-[10px] text-amber-500 font-semibold">
                    {currentStep?.activeLine
                      ? `Executing Line ${currentStep.activeLine}`
                      : currentStep?.phase === 'memory'
                        ? 'Memory Allocation Phase'
                        : 'Ready'}
                  </span>
                </div>

                <div className="flex-1 overflow-hidden">
                  <Suspense fallback={<CodeEditorSkeleton />}>
                    <CodeEditor
                      language="javascript"
                      code={code}
                      editorRef={editorRef}
                      currentFontSize={Number(currentFontSize)}
                      onChange={(value) => handleCodeChange(value ?? '')}
                    />
                  </Suspense>
                </div>
              </div>

              {/* Right Column: Execution Context Visualizer Panels */}
              <div className="h-full flex flex-col overflow-hidden bg-[var(--bg-app)]">
                {/* 1. Playback Controls Toolbar */}
                <ContextControls
                  currentStepIndex={currentStepIndex}
                  totalSteps={steps.length}
                  isPlaying={isPlaying}
                  speed={speed}
                  onPlayToggle={handlePlayToggle}
                  onStepForward={handleStepForward}
                  onStepBackward={handleStepBackward}
                  onReset={handleReset}
                  onSeek={handleSeek}
                  onSpeedChange={setSpeed}
                />

                {/* 2. Educational Step Narration Banner */}
                <ContextNarration currentStep={currentStep} code={code} />

                {/* 3. Main Visualizer Panels */}
                <div className="flex-1 p-3 overflow-y-auto flex flex-col gap-3 min-h-0">
                  {/* Top: Two-Column Execution Context Box */}
                  <div className="min-h-[300px] flex-1">
                    <ExecutionContextBox
                      contexts={currentStep?.contexts || []}
                      activeContextId={currentStep?.activeContextId || 'gec'}
                      selectedContextId={selectedContextId}
                      onSelectContext={setSelectedContextId}
                      updatedVariableName={currentStep?.updatedVariableName}
                      updatedContextId={currentStep?.updatedContextId}
                      activeLine={currentStep?.activeLine || null}
                    />
                  </div>

                  {/* Bottom Grid: Call Stack & Console Output */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 min-h-[220px] shrink-0">
                    {/* Call Stack Panel */}
                    <ContextCallStack
                      stack={currentStep?.callStack || []}
                      selectedContextId={selectedContextId}
                      onSelectContext={setSelectedContextId}
                    />

                    {/* Console Panel */}
                    <ContextConsole logs={currentStep?.logs || []} />
                  </div>
                </div>
              </div>
            </Split>
          ) : (
            /* Mobile Single Tab View */
            <div className="h-full w-full flex flex-col">
              {/* Mobile Editor Tab */}
              <div
                className={`h-full flex flex-col bg-[var(--bg-app)] ${
                  activeMobileTab === 'editor' ? '' : 'hidden'
                }`}
              >
                <div className="flex-1 overflow-hidden">
                  <Suspense fallback={<CodeEditorSkeleton />}>
                    <CodeEditor
                      language="javascript"
                      code={code}
                      editorRef={editorRef}
                      currentFontSize={Number(currentFontSize)}
                      onChange={(value) => handleCodeChange(value ?? '')}
                    />
                  </Suspense>
                </div>
              </div>

              {/* Mobile Context Tab */}
              <div
                className={`h-full flex flex-col bg-[var(--bg-app)] overflow-hidden ${
                  activeMobileTab === 'context' ? '' : 'hidden'
                }`}
              >
                <ContextControls
                  currentStepIndex={currentStepIndex}
                  totalSteps={steps.length}
                  isPlaying={isPlaying}
                  speed={speed}
                  onPlayToggle={handlePlayToggle}
                  onStepForward={handleStepForward}
                  onStepBackward={handleStepBackward}
                  onReset={handleReset}
                  onSeek={handleSeek}
                  onSpeedChange={setSpeed}
                />

                <ContextNarration currentStep={currentStep} code={code} />

                <div className="flex-1 p-2.5 overflow-y-auto">
                  <ExecutionContextBox
                    contexts={currentStep?.contexts || []}
                    activeContextId={currentStep?.activeContextId || 'gec'}
                    selectedContextId={selectedContextId}
                    onSelectContext={setSelectedContextId}
                    updatedVariableName={currentStep?.updatedVariableName}
                    updatedContextId={currentStep?.updatedContextId}
                    activeLine={currentStep?.activeLine || null}
                  />
                </div>
              </div>

              {/* Mobile Stack Tab */}
              <div
                className={`h-full p-2.5 bg-[var(--bg-app)] overflow-y-auto ${
                  activeMobileTab === 'stack' ? '' : 'hidden'
                }`}
              >
                <ContextCallStack
                  stack={currentStep?.callStack || []}
                  selectedContextId={selectedContextId}
                  onSelectContext={setSelectedContextId}
                />
              </div>

              {/* Mobile Console Tab */}
              <div
                className={`h-full p-2.5 bg-[var(--bg-app)] overflow-y-auto ${
                  activeMobileTab === 'console' ? '' : 'hidden'
                }`}
              >
                <ContextConsole logs={currentStep?.logs || []} />
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

export default JSExecutionContextVisualizer;
