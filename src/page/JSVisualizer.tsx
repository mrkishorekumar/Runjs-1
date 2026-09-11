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

import { simulateCode } from '../visualizer/engine/simulator';
import { VISUALIZER_PRESETS } from '../visualizer/engine/presets';
import { ExecutionStep, VisualizerPreset } from '../visualizer/engine/types';

import CallStackPanel from '../visualizer/components/CallStackPanel';
import EventLoopWheel from '../visualizer/components/EventLoopWheel';
import MicrotaskQueuePanel from '../visualizer/components/MicrotaskQueuePanel';
import TaskQueuePanel from '../visualizer/components/TaskQueuePanel';
import VisualizerControls from '../visualizer/components/VisualizerControls';
import StepNarration from '../visualizer/components/StepNarration';
import VisualizerConsole from '../visualizer/components/VisualizerConsole';
import PresetsDropdown from '../visualizer/components/PresetsDropdown';
import ToolInterlinkMenu from '../components/ToolInterlinkMenu';
import ImportNotificationToast from '../components/ImportNotificationToast';
import { consumeTransferredCode } from '../utils/crossToolTransfer';

function JSVisualizer() {
  const location = useLocation();
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const [currentFontSize, setFontSize] = useLocalStorageState(
    'visualizerFontSize',
    '14'
  );

  // Active preset & code state
  const defaultPreset = VISUALIZER_PRESETS[0];
  const [currentPresetId, setCurrentPresetId] = useState<string | null>(
    defaultPreset.id
  );
  const [code, setCode] = useState<string>(defaultPreset.code);

  // Stepping & simulation state
  const [steps, setSteps] = useState<ExecutionStep[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [speed, setSpeed] = useState<number>(1);
  const [syntaxError, setSyntaxError] = useState<string | null>(null);
  const [importSource, setImportSource] = useState<string | null>(null);

  // Mobile navigation tab
  const [activeMobileTab, setActiveMobileTab] = useState<
    'editor' | 'visualizer' | 'console'
  >('visualizer');

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

      const result = simulateCode(codeToRun);
      if (!result.success) {
        setSyntaxError(result.error);
        setSteps([]);
        setCurrentStepIndex(0);
        return;
      }

      setSyntaxError(null);
      setSteps(result.steps);
      setCurrentStepIndex(0);

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

      // If user cleared the code completely, clear execution immediately
      if (!newCode || newCode.trim() === '') {
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
          debounceTimerRef.current = null;
        }
        runSimulation(newCode, false);
        return;
      }

      // Debounce auto-simulation while typing so steps stay synced
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

  // Run initial simulation on mount, prioritizing code passed via state/sessionStorage/query
  useEffect(() => {
    const transferred = consumeTransferredCode(
      'visualizer',
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

  // Handle Preset selection
  const handleSelectPreset = useCallback(
    (preset: VisualizerPreset) => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
      setCurrentPresetId(preset.id);
      setCode(preset.code);
      runSimulation(preset.code, false);
      if (!isDesktop) {
        setActiveMobileTab('visualizer');
      }
    },
    [runSimulation, isDesktop]
  );

  // Current active step snapshot
  const currentStep = useMemo(() => {
    if (steps.length === 0 || currentStepIndex >= steps.length) return null;
    return steps[currentStepIndex];
  }, [steps, currentStepIndex]);

  // Step Forward (auto-simulates if code was edited)
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

  // Play / Pause toggle (auto-simulates modified code immediately before playing)
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
      // If at the end, restart and play
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

  // Keyboard navigation shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing inside an input/textarea or Monaco editor focus
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

  // Font Size Adjustment Handlers
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
        title="JavaScript Visualizer - Interactive Call Stack, Event Loop & Queues | RunJS"
        description="Interactive visualizer for JavaScript execution. Step through the Call Stack, Event Loop, Microtask Queue (Promises), and Task Queue (setTimeout) in real time."
        canonical="/visualizer"
        keywords={[
          'JavaScript visualizer',
          'event loop visualizer',
          'call stack visualizer',
          'microtask queue visualizer',
          'jsv9000 online',
          'loupe javascript',
          'javascript execution visualizer',
          'promises vs settimeout visualizer',
        ]}
        structuredData={[
          getBreadcrumbSchema([
            { name: 'Home', item: '/' },
            { name: 'JavaScript Visualizer', item: '/visualizer' },
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
                Event Loop
              </span>
            </div>
          </div>

          {/* Center: Presets & Action Button */}
          <div className="flex items-center gap-2">
            {/* Presets Dropdown */}
            <PresetsDropdown
              currentPresetId={currentPresetId}
              onSelectPreset={handleSelectPreset}
            />

            {/* Run & Visualize Primary Action */}
            <button
              type="button"
              onClick={() => {
                runSimulation(code, true);
                if (!isDesktop) setActiveMobileTab('visualizer');
              }}
              title="Run & Visualize Code (Ctrl/Cmd + Enter)"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-black text-xs font-semibold shadow-xs transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/60"
            >
              <Play className="w-3.5 h-3.5 fill-black shrink-0" />
              <span className="hidden sm:inline">Run & Visualize</span>
              <span className="sm:hidden">Run</span>
            </button>

            {/* Cross-Tool Interlink Menu */}
            <ToolInterlinkMenu currentTool="visualizer" getCode={() => code} />

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
              className="hidden md:flex items-center p-1.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              <AlignLeft className="w-4 h-4" />
            </button>

            {/* Font Size Adjusters */}
            <div className="hidden lg:flex items-center rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] p-0.5">
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
            onClick={() => setActiveMobileTab('visualizer')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer text-center ${
              activeMobileTab === 'visualizer'
                ? 'bg-amber-500 text-black shadow-xs'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]'
            }`}
          >
            Visualizer
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

        {/* Syntax Error Alert Banner (if any) */}
        {syntaxError && (
          <div className="px-4 py-2 bg-rose-500/10 border-b border-rose-500/20 text-xs text-rose-600 dark:text-rose-400 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>
                <strong>JavaScript Parse Error:</strong> {syntaxError}
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
                {/* Editor File Tab Strip */}
                <div className="flex items-center justify-between px-3 py-1.5 bg-[var(--bg-surface)] border-b border-[var(--border-default)] text-xs no-select">
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

              {/* Right Column: Visualizer Panels & Playback */}
              <div className="h-full flex flex-col overflow-hidden bg-[var(--bg-app)]">
                {/* 1. Playback Controls Toolbar */}
                <VisualizerControls
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
                <StepNarration currentStep={currentStep} code={code} />

                {/* 3. Four Main Visualizer Panels */}
                <div className="flex-1 p-3 overflow-y-auto flex flex-col gap-3 min-h-0">
                  {/* Top Grid: Call Stack & Event Loop Wheel */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 min-h-[260px] shrink-0">
                    {/* Panel 1: Call Stack */}
                    <CallStackPanel
                      stack={currentStep?.callStack || []}
                      highlightedItemId={currentStep?.highlightedItemId}
                    />

                    {/* Panel 2: Event Loop Wheel */}
                    <EventLoopWheel
                      phase={currentStep?.eventLoopPhase || 'idle'}
                      degrees={currentStep?.eventLoopDegrees || 0}
                      microtasksCount={currentStep?.microtaskQueue?.length || 0}
                      tasksCount={currentStep?.taskQueue?.length || 0}
                      stackCount={currentStep?.callStack?.length || 0}
                    />
                  </div>

                  {/* Bottom Grid: Microtask Queue & Task Queue */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 min-h-[240px] shrink-0">
                    {/* Panel 3: Microtask Queue (Promises) */}
                    <MicrotaskQueuePanel
                      queue={currentStep?.microtaskQueue || []}
                      highlightedItemId={currentStep?.highlightedItemId}
                      isDraining={
                        currentStep?.eventLoopPhase === 'check_microtasks' ||
                        currentStep?.eventLoopPhase === 'drain_microtasks'
                      }
                    />

                    {/* Panel 4: Task Queue (setTimeout & Web APIs) */}
                    <TaskQueuePanel
                      queue={currentStep?.taskQueue || []}
                      webApis={currentStep?.webApis || []}
                      highlightedItemId={currentStep?.highlightedItemId}
                      isPicking={
                        currentStep?.eventLoopPhase === 'check_tasks' ||
                        currentStep?.eventLoopPhase === 'pick_task'
                      }
                    />
                  </div>

                  {/* Bottom Panel: Live Time-Travel Console Output */}
                  <div className="min-h-[160px] shrink-0">
                    <VisualizerConsole logs={currentStep?.logs || []} />
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

              {/* Mobile Visualizer Tab */}
              <div
                className={`h-full flex flex-col bg-[var(--bg-app)] overflow-hidden ${
                  activeMobileTab === 'visualizer' ? '' : 'hidden'
                }`}
              >
                <VisualizerControls
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

                <StepNarration currentStep={currentStep} code={code} />

                <div className="flex-1 p-2.5 overflow-y-auto space-y-2.5">
                  <div className="min-h-[260px]">
                    <EventLoopWheel
                      phase={currentStep?.eventLoopPhase || 'idle'}
                      degrees={currentStep?.eventLoopDegrees || 0}
                      microtasksCount={currentStep?.microtaskQueue?.length || 0}
                      tasksCount={currentStep?.taskQueue?.length || 0}
                      stackCount={currentStep?.callStack?.length || 0}
                    />
                  </div>

                  <div className="h-[200px]">
                    <CallStackPanel
                      stack={currentStep?.callStack || []}
                      highlightedItemId={currentStep?.highlightedItemId}
                    />
                  </div>

                  <div className="h-[190px]">
                    <MicrotaskQueuePanel
                      queue={currentStep?.microtaskQueue || []}
                      highlightedItemId={currentStep?.highlightedItemId}
                      isDraining={
                        currentStep?.eventLoopPhase === 'check_microtasks' ||
                        currentStep?.eventLoopPhase === 'drain_microtasks'
                      }
                    />
                  </div>

                  <div className="h-[210px]">
                    <TaskQueuePanel
                      queue={currentStep?.taskQueue || []}
                      webApis={currentStep?.webApis || []}
                      highlightedItemId={currentStep?.highlightedItemId}
                      isPicking={
                        currentStep?.eventLoopPhase === 'check_tasks' ||
                        currentStep?.eventLoopPhase === 'pick_task'
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Mobile Console Tab */}
              <div
                className={`h-full p-2.5 bg-[var(--bg-app)] ${
                  activeMobileTab === 'console' ? '' : 'hidden'
                }`}
              >
                <VisualizerConsole logs={currentStep?.logs || []} />
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

export default JSVisualizer;
