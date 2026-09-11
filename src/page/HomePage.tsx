import { Link } from 'react-router';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import HomeIdeDemo from '../components/HomeIdeDemo';
import SEO from '../seo/SEO';
import { getWebApplicationSchema, getWebSiteSchema } from '../seo/seoConfig';
import {
  Play,
  Zap,
  ShieldCheck,
  Database,
  Layers,
  BookOpen,
  Cpu,
  GraduationCap,
  FileQuestion,
  Brain,
  RotateCw,
  Boxes,
  ArrowRight,
  Code2,
} from 'lucide-react';

function HomePage() {
  return (
    <div className="min-h-screen w-full flex flex-col justify-between bg-[var(--bg-app)] text-[var(--text-primary)] transition-colors duration-150">
      <SEO
        title="RunJS - In-Browser JavaScript, TypeScript & React Playground"
        description="Run, practice, and master JavaScript, TypeScript, and React directly in your browser. Zero setup, Monaco editor, esbuild WebAssembly compilation, and interactive coding challenges."
        canonical="/"
        keywords={[
          'JavaScript playground',
          'online JS compiler',
          'TypeScript online',
          'React playground',
          'coding challenges',
          'esbuild wasm',
          'web IDE',
        ]}
        structuredData={[getWebApplicationSchema(), getWebSiteSchema()]}
      />
      <Navbar />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
        {/* Hero Section */}
        <section className="flex flex-col items-center text-center max-w-3xl mx-auto">
          {/* Top Announcement Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md border border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-secondary)] font-mono text-xs mb-6 max-w-full">
            <Code2 className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span className="hidden sm:inline">
              runjs_2.0 // modern in-browser developer playground
            </span>
            <span className="sm:hidden truncate">
              runjs_2.0 // developer playground
            </span>
          </div>

          {/* Main Headline */}
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-[var(--text-primary)] leading-[1.15]">
            Run, Practice & Master{' '}
            <span className="text-amber-500">JavaScript</span> in Your Browser
          </h1>

          {/* Subtitle */}
          <p className="mt-4 text-sm sm:text-base text-[var(--text-secondary)] leading-relaxed max-w-2xl">
            A fast, lightweight developer playground with zero setup. Write
            modern JavaScript, compile TypeScript with esbuild WASM, build React
            components, and master technical coding challenges.
          </p>

          {/* CTA Buttons */}
          <div className="mt-7 w-full max-w-sm sm:max-w-none mx-auto flex flex-col sm:flex-row sm:flex-wrap items-center justify-center gap-2.5">
            {/* Primary Hero CTA Button */}
            <Link
              to="/learn"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 h-9 px-5 rounded-md bg-amber-500 hover:bg-amber-400 text-black text-xs font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/60 focus-visible:ring-offset-1"
            >
              <GraduationCap className="w-4 h-4 shrink-0" />
              <span>Learn JavaScript 0 → Hero</span>
            </Link>

            {/* Secondary Action Buttons */}
            <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 w-full sm:w-auto">
              <Link
                to="/problems"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 h-9 px-3.5 rounded-md border border-[var(--border-default)] bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] text-[var(--text-primary)] text-xs font-medium transition-colors font-mono focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/60 focus-visible:ring-offset-1"
              >
                <Zap className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span>challenges</span>
              </Link>

              <Link
                to="/interview"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 h-9 px-3.5 rounded-md border border-[var(--border-default)] bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] text-[var(--text-primary)] text-xs font-medium transition-colors font-mono focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/60 focus-visible:ring-offset-1"
              >
                <FileQuestion className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span>interview_prep</span>
              </Link>
            </div>

            <Link
              to="/js"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 h-9 px-4 rounded-md border border-[var(--border-default)] bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] text-[var(--text-primary)] text-xs font-medium transition-colors font-mono focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/60 focus-visible:ring-offset-1"
            >
              <Play className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />
              <span>open_playground</span>
            </Link>
          </div>

          {/* Featured Interactive Visualizers Showcase */}
          <div className="mt-8 sm:mt-10 w-full max-w-2xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
            {/* Event Loop Visualizer Card */}
            <Link
              to="/visualizer"
              className="group p-4 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] hover:border-amber-500/50 transition-colors flex flex-col justify-between focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/60 focus-visible:ring-offset-1"
            >
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center justify-center w-8 h-8 rounded-md bg-amber-500/10 text-amber-500 border border-amber-500/20">
                    <RotateCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[var(--bg-app)] text-amber-600 dark:text-amber-400 border border-[var(--border-subtle)]">
                    tool
                  </span>
                </div>
                <h3 className="text-xs font-semibold text-[var(--text-primary)] group-hover:text-amber-500 transition-colors font-mono">
                  event_loop_visualizer
                </h3>
                <p className="text-xs text-[var(--text-secondary)] mt-1 leading-relaxed">
                  Step through Call Stack, Microtasks & Tasks live with the
                  interactive rotating wheel.
                </p>
              </div>
              <div className="mt-3 flex items-center gap-1 text-xs font-mono text-amber-600 dark:text-amber-400">
                <span>launch_visualizer</span>
                <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Link>

            {/* Execution Context Visualizer Card */}
            <Link
              to="/execution-context"
              className="group p-4 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] hover:border-blue-500/50 transition-colors flex flex-col justify-between focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60 focus-visible:ring-offset-1"
            >
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center justify-center w-8 h-8 rounded-md bg-blue-500/10 text-blue-500 border border-blue-500/20">
                    <Boxes className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[var(--bg-app)] text-blue-600 dark:text-blue-400 border border-[var(--border-subtle)]">
                    deep_dive
                  </span>
                </div>
                <h3 className="text-xs font-semibold text-[var(--text-primary)] group-hover:text-blue-500 transition-colors font-mono">
                  execution_context
                </h3>
                <p className="text-xs text-[var(--text-secondary)] mt-1 leading-relaxed">
                  Inspect Memory Creation vs Code Execution phases, variable
                  environments & call stack frames.
                </p>
              </div>
              <div className="mt-3 flex items-center gap-1 text-xs font-mono text-blue-600 dark:text-blue-400">
                <span>explore_contexts</span>
                <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Link>
          </div>
        </section>

        {/* Language & Problem Cards Quick Links */}
        <section className="mt-12 max-w-6xl mx-auto w-full">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 w-full text-left">
            {/* Learn JS Card */}
            <Link
              to="/learn"
              className="group p-4 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] hover:border-amber-500/50 transition-colors flex flex-col justify-between focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/60 focus-visible:ring-offset-1"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-md bg-[var(--bg-app)] text-amber-500 border border-[var(--border-subtle)] text-xs">
                    <GraduationCap className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[var(--bg-app)] text-amber-600 dark:text-amber-400 border border-[var(--border-subtle)]">
                    course
                  </span>
                </div>
                <h2 className="text-xs font-semibold text-[var(--text-primary)] group-hover:text-amber-500 transition-colors font-mono">
                  learn_javascript
                </h2>
                <p className="text-xs text-[var(--text-secondary)] mt-1 leading-relaxed">
                  Interactive lessons, runnable Monaco examples, quizzes &
                  sandbox exercises.
                </p>
              </div>
            </Link>

            {/* Coding Problems Card */}
            <Link
              to="/problems"
              className="group p-4 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] hover:border-amber-500/50 transition-colors flex flex-col justify-between focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/60 focus-visible:ring-offset-1"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-md bg-[var(--bg-app)] text-amber-500 border border-[var(--border-subtle)] text-xs">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[var(--bg-app)] text-emerald-600 dark:text-emerald-400 border border-[var(--border-subtle)]">
                    challenges
                  </span>
                </div>
                <h2 className="text-xs font-semibold text-[var(--text-primary)] group-hover:text-amber-500 transition-colors font-mono">
                  coding_challenges
                </h2>
                <p className="text-xs text-[var(--text-secondary)] mt-1 leading-relaxed">
                  Algorithm challenges with test runner, progressive hints, and
                  submission history.
                </p>
              </div>
            </Link>

            {/* Technical Interview Q&A Card */}
            <Link
              to="/interview"
              className="group p-4 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] hover:border-amber-500/50 transition-colors flex flex-col justify-between focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/60 focus-visible:ring-offset-1"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-md bg-[var(--bg-app)] text-amber-500 border border-[var(--border-subtle)] text-xs">
                    <FileQuestion className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[var(--bg-app)] text-amber-600 dark:text-amber-400 border border-[var(--border-subtle)]">
                    80+_q&a
                  </span>
                </div>
                <h2 className="text-xs font-semibold text-[var(--text-primary)] group-hover:text-amber-500 transition-colors font-mono">
                  interview_questions
                </h2>
                <p className="text-xs text-[var(--text-secondary)] mt-1 leading-relaxed">
                  Technical interview Q&A with active recall, detailed
                  solutions, and live sandboxes.
                </p>
              </div>
            </Link>

            {/* JavaScript Output Questions Card */}
            <Link
              to="/output-questions"
              className="group p-4 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] hover:border-emerald-500/50 transition-colors flex flex-col justify-between focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/60 focus-visible:ring-offset-1"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-md bg-[var(--bg-app)] text-emerald-500 border border-[var(--border-subtle)] text-xs">
                    <Brain className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[var(--bg-app)] text-emerald-600 dark:text-emerald-400 border border-[var(--border-subtle)]">
                    100_mcqs
                  </span>
                </div>
                <h2 className="text-xs font-semibold text-[var(--text-primary)] group-hover:text-emerald-500 transition-colors font-mono">
                  output_questions
                </h2>
                <p className="text-xs text-[var(--text-secondary)] mt-1 leading-relaxed">
                  Predict output quiz covering closures, event loop, hoisting,
                  and coercion quirks.
                </p>
              </div>
            </Link>

            {/* JavaScript Sandbox Card */}
            <Link
              to="/js"
              className="group p-4 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] hover:border-amber-500/50 transition-colors flex flex-col justify-between focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/60 focus-visible:ring-offset-1"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-md bg-[var(--bg-app)] text-amber-500 border border-[var(--border-subtle)] font-mono text-xs font-bold">
                    JS
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[var(--bg-app)] text-amber-600 dark:text-amber-400 border border-[var(--border-subtle)]">
                    instant
                  </span>
                </div>
                <h2 className="text-xs font-semibold text-[var(--text-primary)] group-hover:text-amber-500 transition-colors font-mono">
                  javascript_ide
                </h2>
                <p className="text-xs text-[var(--text-secondary)] mt-1 leading-relaxed">
                  Monaco editor with loop protection guard and Luna terminal
                  console.
                </p>
              </div>
            </Link>

            {/* TypeScript Sandbox Card */}
            <Link
              to="/ts"
              className="group p-4 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] hover:border-blue-500/50 transition-colors flex flex-col justify-between focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60 focus-visible:ring-offset-1"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-md bg-[var(--bg-app)] text-blue-500 border border-[var(--border-subtle)] font-mono text-xs font-bold">
                    TS
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[var(--bg-app)] text-blue-600 dark:text-blue-400 border border-[var(--border-subtle)]">
                    esbuild_wasm
                  </span>
                </div>
                <h2 className="text-xs font-semibold text-[var(--text-primary)] group-hover:text-blue-500 transition-colors font-mono">
                  typescript_ide
                </h2>
                <p className="text-xs text-[var(--text-secondary)] mt-1 leading-relaxed">
                  Sub-millisecond WebAssembly esbuild compiler running locally
                  in-tab.
                </p>
              </div>
            </Link>

            {/* React Sandpack Card */}
            <Link
              to="/react"
              className="group p-4 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] hover:border-cyan-500/50 transition-colors flex flex-col justify-between focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/60 focus-visible:ring-offset-1"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-md bg-[var(--bg-app)] text-cyan-500 border border-[var(--border-subtle)] font-mono text-xs font-bold">
                    ⚛
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[var(--bg-app)] text-cyan-600 dark:text-cyan-400 border border-[var(--border-subtle)]">
                    sandpack
                  </span>
                </div>
                <h2 className="text-xs font-semibold text-[var(--text-primary)] group-hover:text-cyan-500 transition-colors font-mono">
                  react_sandpack
                </h2>
                <p className="text-xs text-[var(--text-secondary)] mt-1 leading-relaxed">
                  Multi-file tree explorer, live component previews, and React
                  bundler support.
                </p>
              </div>
            </Link>

            {/* HTML/CSS/JS Card */}
            <Link
              to="/html"
              className="group p-4 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] hover:border-orange-500/50 transition-colors flex flex-col justify-between focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/60 focus-visible:ring-offset-1"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-md bg-[var(--bg-app)] text-orange-500 border border-[var(--border-subtle)] font-mono text-xs font-bold">
                    &lt;/&gt;
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[var(--bg-app)] text-orange-600 dark:text-orange-400 border border-[var(--border-subtle)]">
                    3_pane
                  </span>
                </div>
                <h2 className="text-xs font-semibold text-[var(--text-primary)] group-hover:text-orange-500 transition-colors font-mono">
                  html_css_js
                </h2>
                <p className="text-xs text-[var(--text-secondary)] mt-1 leading-relaxed">
                  3-pane Monaco editors with sandboxed live preview and layout
                  controls.
                </p>
              </div>
            </Link>
          </div>
        </section>

        {/* IDE UI Preview Animated Demo */}
        <section className="mt-14 max-w-6xl mx-auto w-full">
          <HomeIdeDemo />
        </section>

        {/* Feature Grid */}
        <section className="mt-16 sm:mt-20">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--text-primary)]">
              Engineered for Speed & Developer Focus
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-[var(--text-secondary)]">
              Everything you need to write, test, format, and evaluate code
              without IDE overhead.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)]">
              <div className="w-7 h-7 rounded-md bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center justify-center mb-2.5">
                <Zap className="w-3.5 h-3.5" />
              </div>
              <h3 className="text-xs font-semibold text-[var(--text-primary)] font-mono">
                in_browser_execution
              </h3>
              <p className="text-xs text-[var(--text-secondary)] mt-1 leading-relaxed">
                Code executes in browser sandbox. Zero cold starts, no backend
                queues.
              </p>
            </div>

            <div className="p-4 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)]">
              <div className="w-7 h-7 rounded-md bg-blue-500/10 text-blue-500 border border-blue-500/20 flex items-center justify-center mb-2.5">
                <Cpu className="w-3.5 h-3.5" />
              </div>
              <h3 className="text-xs font-semibold text-[var(--text-primary)] font-mono">
                wasm_esbuild_engine
              </h3>
              <p className="text-xs text-[var(--text-secondary)] mt-1 leading-relaxed">
                esbuild compiled to WebAssembly for sub-millisecond TypeScript
                compilation.
              </p>
            </div>

            <div className="p-4 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)]">
              <div className="w-7 h-7 rounded-md bg-purple-500/10 text-purple-500 border border-purple-500/20 flex items-center justify-center mb-2.5">
                <Database className="w-3.5 h-3.5" />
              </div>
              <h3 className="text-xs font-semibold text-[var(--text-primary)] font-mono">
                indexeddb_persistence
              </h3>
              <p className="text-xs text-[var(--text-secondary)] mt-1 leading-relaxed">
                Persistent local storage for all snippets, solutions, and
                starred projects.
              </p>
            </div>

            <div className="p-4 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)]">
              <div className="w-7 h-7 rounded-md bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center justify-center mb-2.5">
                <ShieldCheck className="w-3.5 h-3.5" />
              </div>
              <h3 className="text-xs font-semibold text-[var(--text-primary)] font-mono">
                loop_protection
              </h3>
              <p className="text-xs text-[var(--text-secondary)] mt-1 leading-relaxed">
                Babel AST transform inserts timeout guards preventing browser
                hangs.
              </p>
            </div>

            <Link
              to="/interview"
              className="p-4 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] hover:border-amber-500/50 transition-colors block group focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/60 focus-visible:ring-offset-1"
            >
              <div className="w-7 h-7 rounded-md bg-rose-500/10 text-rose-500 border border-rose-500/20 flex items-center justify-center mb-2.5">
                <FileQuestion className="w-3.5 h-3.5" />
              </div>
              <h3 className="text-xs font-semibold text-[var(--text-primary)] group-hover:text-amber-500 transition-colors font-mono">
                interview_practice
              </h3>
              <p className="text-xs text-[var(--text-secondary)] mt-1 leading-relaxed">
                80+ technical Q&A with active recall and 100 predict-the-output
                MCQs.
              </p>
            </Link>

            <div className="p-4 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)]">
              <div className="w-7 h-7 rounded-md bg-cyan-500/10 text-cyan-500 border border-cyan-500/20 flex items-center justify-center mb-2.5">
                <Layers className="w-3.5 h-3.5" />
              </div>
              <h3 className="text-xs font-semibold text-[var(--text-primary)] font-mono">
                theme_parity
              </h3>
              <p className="text-xs text-[var(--text-secondary)] mt-1 leading-relaxed">
                Engineered CSS variables with strict parity across both dark and
                light themes.
              </p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default HomePage;
