import { useState } from 'react';
import { Link } from 'react-router';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import SEO from '../seo/SEO';
import { getBreadcrumbSchema, getCanonicalUrl } from '../seo/seoConfig';
import {
  Sparkles,
  Code2,
  Download,
  Mail,
  MapPin,
  Briefcase,
  GraduationCap,
  Terminal,
  Cpu,
  ShieldCheck,
  Zap,
  Play,
  Layers,
  CheckCircle2,
  TrendingUp,
  DollarSign,
  ArrowRight,
  Server,
  Boxes,
  RotateCw,
  FolderGit2,
  Check,
} from 'lucide-react';

function GithubIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
      <path d="M9 18c-4.51 2-5-2-7-2" />
    </svg>
  );
}

function LinkedinIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect x="2" y="9" width="4" height="12" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  );
}

export default function CreatorPortfolioPage() {
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [activeSkillCategory, setActiveSkillCategory] = useState<string>('all');

  const handleCopyEmail = () => {
    navigator.clipboard.writeText('mrkishorekumar18@gmail.com');
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  const skillCategories = [
    { id: 'all', label: 'All Technologies' },
    { id: 'frontend', label: 'Frontend & Web' },
    { id: 'mobile', label: 'Mobile Development' },
    { id: 'cloud', label: 'Cloud & APIs' },
    { id: 'growth', label: 'Analytics & Growth' },
    { id: 'ai', label: 'AI & Tools' },
  ];

  const skillsData = [
    // Frontend
    { name: 'JavaScript (ES6+)', category: 'frontend', highlight: true },
    { name: 'TypeScript', category: 'frontend', highlight: true },
    { name: 'React', category: 'frontend', highlight: true },
    { name: 'Next.js', category: 'frontend' },
    { name: 'Redux / Redux Toolkit', category: 'frontend' },
    { name: 'Monaco Editor Integration', category: 'frontend' },
    { name: 'WebAssembly (esbuild-wasm)', category: 'frontend' },
    { name: 'Acorn AST Parsing', category: 'frontend' },
    { name: 'Tailwind CSS', category: 'frontend' },
    { name: 'Python', category: 'frontend' },

    // Mobile
    { name: 'React Native', category: 'mobile', highlight: true },
    { name: 'Expo', category: 'mobile', highlight: true },
    {
      name: 'iOS & Android Cross-Platform',
      category: 'mobile',
      highlight: true,
    },
    { name: 'CodePush OTA Updates', category: 'mobile' },
    { name: 'Xcode & iOS Toolchain', category: 'mobile' },
    { name: 'Android Studio & Gradle', category: 'mobile' },
    { name: 'Mobile Crash Analytics', category: 'mobile' },
    { name: 'Codemagic CI/CD', category: 'mobile' },
    { name: 'Bundle Optimization', category: 'mobile' },

    // Cloud & Integrations
    { name: 'REST APIs & Webhooks', category: 'cloud', highlight: true },
    { name: 'Juspay Payments Flow', category: 'cloud', highlight: true },
    { name: 'Firebase & Cloud Messaging', category: 'cloud' },
    { name: 'AWS Secrets Manager', category: 'cloud' },
    { name: 'AWS API Gateway', category: 'cloud' },
    { name: 'AWS Lambda & Serverless', category: 'cloud' },
    { name: 'AWS S3 & DynamoDB', category: 'cloud' },
    { name: 'Algolia Search', category: 'cloud' },
    { name: 'IndexedDB (idb)', category: 'cloud' },

    // Analytics & Growth
    { name: 'CleverTap', category: 'growth' },
    { name: 'AppsFlyer Attribution', category: 'growth', highlight: true },
    { name: 'MoEngage', category: 'growth' },
    { name: 'Google Analytics', category: 'growth' },
    { name: 'Adobe Analytics', category: 'growth' },
    { name: 'Contentsquare Experience Analytics', category: 'growth' },
    { name: 'User Journey Tracking', category: 'growth' },

    // AI & Tooling
    { name: 'GitHub Copilot', category: 'ai' },
    { name: 'Claude Code', category: 'ai' },
    { name: 'Codex & Gemini AI', category: 'ai' },
    { name: 'Antigravity', category: 'ai' },
    { name: 'Ollama AI (Local Models)', category: 'ai' },
    { name: 'Cursor AI IDE', category: 'ai' },
    { name: 'Figma & Adobe XD', category: 'ai' },
    { name: 'Agile / Scrum & Code Reviews', category: 'ai' },
  ];

  const filteredSkills =
    activeSkillCategory === 'all'
      ? skillsData
      : skillsData.filter((s) => s.category === activeSkillCategory);

  const runjsPillars = [
    {
      icon: <Server className="w-5 h-5 text-amber-500" />,
      title: '100% In-Browser Execution',
      description:
        'Zero backend servers required for code evaluation. All JavaScript and TypeScript executions run client-side on the user device via isolated iframe sandboxes and WebAssembly.',
    },
    {
      icon: <Zap className="w-5 h-5 text-blue-500" />,
      title: 'Sub-10ms WebAssembly Transpiler',
      description:
        'TypeScript code is stripped, type-checked, and transpiled into vanilla ESNext inside the browser using esbuild-wasm without queuing for external build farms.',
    },
    {
      icon: <ShieldCheck className="w-5 h-5 text-emerald-500" />,
      title: 'AST Infinite Loop Protection',
      description:
        'Parses code into an Abstract Syntax Tree with Acorn and injects deterministic iteration guards into for, while, and do-while loops, preventing tab hangs and memory locks.',
    },
    {
      icon: <RotateCw className="w-5 h-5 text-purple-500" />,
      title: 'Interactive Event Loop Simulators',
      description:
        'Educational visualizers mapping Call Stack frames, Promise Microtask Queues, Timer Task Queues, and the rotating event loop wheel step-by-step in real time.',
    },
    {
      icon: <Boxes className="w-5 h-5 text-cyan-500" />,
      title: 'Execution Context Stepper',
      description:
        'Inspect Memory Allocation Phase (hoisting & TDZ) and Code Execution Phase side-by-side with global and function scope environment records.',
    },
    {
      icon: <Layers className="w-5 h-5 text-amber-500" />,
      title: 'Sandpack React IDE & Terminal',
      description:
        'Full multi-file React development with live bundler, virtual file system, responsive component viewport, and integrated xterm.js shell.',
    },
  ];

  return (
    <div className="min-h-screen w-full flex flex-col justify-between bg-[var(--bg-app)] text-[var(--text-primary)] transition-colors duration-150">
      <SEO
        title="M R Kishore Kumar - Creator & Maintainer of RunJS | Portfolio"
        description="Meet M R Kishore Kumar, React Native Engineer with 4.5 years shipping e-commerce apps at scale (1Cr+ downloads) and creator of RunJS, the 100% in-browser developer playground."
        canonical="/kishorekumar"
        keywords={[
          'M R Kishore Kumar',
          'M.R. KISHOREKUMAR',
          'Kishore Kumar',
          'Creator of RunJS',
          'React Native Engineer',
          'RunJS maintainer',
          'Software Engineer Bangalore',
          'Developer Tools Builder',
          'Frontend Engineer',
          'In-browser JavaScript playground',
          'mrkishorekumar',
          'MRKISHOREKUMAR',
          'm r kishore kumar',
          'kishorekumar',
          'kishore',
        ]}
        structuredData={[
          getBreadcrumbSchema([
            { name: 'Home', item: '/' },
            { name: 'About', item: '/about' },
            { name: 'M R Kishore Kumar', item: '/kishorekumar' },
          ]),
          {
            '@context': 'https://schema.org',
            '@type': 'ProfilePage',
            name: 'M R Kishore Kumar - Creator & Maintainer of RunJS',
            url: getCanonicalUrl('/kishorekumar'),
            mainEntity: {
              '@type': 'Person',
              name: 'M R Kishore Kumar',
              alternateName: 'Kishore Kumar',
              jobTitle: 'Creator & Maintainer of RunJS | React Native Engineer',
              worksFor: {
                '@type': 'Organization',
                name: 'Apparel Group (6thStreet.com)',
              },
              alumniOf: {
                '@type': 'EducationalOrganization',
                name: 'Sri Shakthi Institute of Engineering and Technology',
              },
              email: 'mrkishorekumar18@gmail.com',
              url: 'https://github.com/mrkishorekumar',
              sameAs: [
                'https://github.com/mrkishorekumar',
                'https://www.linkedin.com/in/mrkishorekumar/',
                'https://runjs.in',
              ],
              knowsAbout: [
                'React Native',
                'JavaScript',
                'TypeScript',
                'React',
                'Mobile App Architecture',
                'Performance Optimization',
                'Developer Tools',
                'In-Browser Compilers',
                'WebAssembly',
              ],
            },
          },
        ]}
      />
      <Navbar />

      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-16 sm:space-y-24">
        {/* ==================================================================== */}
        {/* SECTION 1: HERO SECTION */}
        {/* ==================================================================== */}
        <section className="relative pt-4 sm:pt-8">
          {/* Subtle background glow effect */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 max-w-2xl h-64 bg-gradient-to-b from-amber-500/10 via-amber-500/5 to-transparent rounded-full blur-3xl -z-10 pointer-events-none" />

          <div className="flex flex-col md:flex-row items-center md:items-start gap-8 md:gap-12">
            {/* Profile Avatar & Creator Badge */}
            <div className="flex flex-col items-center shrink-0">
              <div className="relative group">
                {/* Glow ring */}
                <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 opacity-70 blur-xs group-hover:opacity-100 transition duration-300" />
                <div className="relative w-36 h-36 sm:w-44 sm:h-44 rounded-2xl overflow-hidden border-2 border-[var(--border-default)] bg-[var(--bg-surface-elevated)] shadow-lg flex items-center justify-center">
                  <img
                    src="/mrkishorekumar.jpeg"
                    alt="M R Kishore Kumar"
                    className="w-full h-full object-cover object-center"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-amber-400 to-amber-600 text-black font-extrabold text-4xl -z-10">
                    MK
                  </div>
                </div>
                {/* Active Indicator dot */}
                <div
                  className="absolute -bottom-1.5 -right-1.5 px-2.5 py-0.5 rounded-full bg-[var(--bg-surface-elevated)] border border-[var(--border-default)] shadow-xs flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400"
                  title="Actively building & maintaining RunJS"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Online</span>
                </div>
              </div>

              {/* Location Badge */}
              <div className="mt-4 inline-flex items-center gap-1.5 text-xs text-[var(--text-secondary)] font-medium">
                <MapPin className="w-3.5 h-3.5 text-amber-500" />
                <span>Bangalore, India</span>
              </div>
            </div>

            {/* Hero Copy & Info */}
            <div className="flex-1 text-center md:text-left space-y-4">
              {/* Creator Status Tag */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-semibold shadow-2xs">
                <Sparkles className="w-3.5 h-3.5 shrink-0" />
                <span>Creator &amp; Maintainer of RunJS</span>
              </div>

              {/* Name & Title */}
              <div>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[var(--text-primary)]">
                  M R Kishore Kumar
                </h1>
                <p className="text-base sm:text-lg font-medium text-amber-600 dark:text-amber-400 mt-1.5">
                  React Native Engineer • Mobile &amp; Web Systems • Developer
                  Tools
                </p>
              </div>

              {/* Bio Summary directly based on Resume */}
              <p className="text-sm sm:text-base text-[var(--text-secondary)] leading-relaxed max-w-2xl">
                React Native Engineer with 4.5 years shipping consumer
                e-commerce apps at scale (6thStreet.com, Pantaloons, Aivi),
                collectively serving 1Cr+ downloads. Specializes in
                cross-platform mobile architecture, performance optimization,
                payment integrations, and analytics instrumentation. Creator and
                maintainer of{' '}
                <strong className="text-[var(--text-primary)] font-semibold">
                  RunJS
                </strong>
                , an open-source, 100% in-browser developer playground and
                learning engine.
              </p>

              {/* CTAs Row */}
              <div className="pt-2 flex flex-wrap items-center justify-center md:justify-start gap-3">
                <Link
                  to="/js"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-black text-xs sm:text-sm font-bold shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Play className="w-4 h-4 fill-black" />
                  <span>Launch RunJS</span>
                </Link>

                <a
                  href="https://github.com/mrkishorekumar/mrkishorekumar/blob/main/Kishore_Kumar.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] text-[var(--text-primary)] text-xs sm:text-sm font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Download className="w-4 h-4 text-amber-500" />
                  <span>View Resume</span>
                </a>

                <a
                  href="https://github.com/mrkishorekumar"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xs sm:text-sm font-medium transition-colors"
                  aria-label="Kishore Kumar on GitHub"
                >
                  <GithubIcon className="w-4 h-4" />
                  <span className="hidden sm:inline">GitHub</span>
                </a>

                <a
                  href="https://www.linkedin.com/in/mrkishorekumar/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] text-[var(--text-secondary)] hover:text-[#0a66c2] text-xs sm:text-sm font-medium transition-colors"
                  aria-label="Kishore Kumar on LinkedIn"
                >
                  <LinkedinIcon className="w-4 h-4" />
                  <span className="hidden sm:inline">LinkedIn</span>
                </a>

                <button
                  type="button"
                  onClick={handleCopyEmail}
                  className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xs sm:text-sm font-medium transition-colors cursor-pointer"
                  title="Copy email: mrkishorekumar18@gmail.com"
                >
                  {copiedEmail ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-500" />
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                        Copied!
                      </span>
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4 text-amber-500" />
                      <span className="hidden sm:inline">Email</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Quick Metrics Bar directly from verified resume facts */}
          <div className="mt-10 sm:mt-12 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="p-4 sm:p-5 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] shadow-2xs text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-2 text-xs font-semibold text-amber-500 uppercase tracking-wider mb-1">
                <Briefcase className="w-3.5 h-3.5" />
                <span>Experience</span>
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)]">
                4.5 Years
              </div>
              <p className="text-xs text-[var(--text-secondary)] mt-1">
                Shipping scaled consumer apps
              </p>
            </div>

            <div className="p-4 sm:p-5 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] shadow-2xs text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-2 text-xs font-semibold text-emerald-500 uppercase tracking-wider mb-1">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Scale</span>
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)]">
                1Cr+
              </div>
              <p className="text-xs text-[var(--text-secondary)] mt-1">
                Downloads served collectively
              </p>
            </div>

            <div className="p-4 sm:p-5 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] shadow-2xs text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-2 text-xs font-semibold text-blue-500 uppercase tracking-wider mb-1">
                <DollarSign className="w-3.5 h-3.5" />
                <span>Impact</span>
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)]">
                $220K/yr
              </div>
              <p className="text-xs text-[var(--text-secondary)] mt-1">
                Saved via in-house architecture
              </p>
            </div>

            <div className="p-4 sm:p-5 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] shadow-2xs text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-2 text-xs font-semibold text-purple-500 uppercase tracking-wider mb-1">
                <Cpu className="w-3.5 h-3.5" />
                <span>RunJS Engine</span>
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)]">
                100%
              </div>
              <p className="text-xs text-[var(--text-secondary)] mt-1">
                Client-side in-browser execution
              </p>
            </div>
          </div>
        </section>

        {/* ==================================================================== */}
        {/* SECTION 2: ABOUT ME */}
        {/* ==================================================================== */}
        <section className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-500 uppercase tracking-wider">
              <Sparkles className="w-4 h-4" />
              <span>Background &amp; Philosophy</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-primary)]">
              About Me
            </h2>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] max-w-2xl">
              Software engineer specializing in cross-platform mobile
              development, high-performance UI systems, and developer tooling.
            </p>
          </div>

          <div className="p-6 sm:p-8 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] shadow-xs space-y-5 text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
            <p>
              I am a{' '}
              <strong className="text-[var(--text-primary)] font-semibold">
                React Native Engineer
              </strong>{' '}
              based in Bangalore, India, with over 4 years of experience
              architecting and shipping consumer-facing mobile applications for
              major e-commerce platforms including{' '}
              <strong className="text-[var(--text-primary)] font-semibold">
                6thStreet.com
              </strong>
              ,{' '}
              <strong className="text-[var(--text-primary)] font-semibold">
                Pantaloons (Aditya Birla Fashion and Retail Ltd)
              </strong>
              , and{' '}
              <strong className="text-[var(--text-primary)] font-semibold">
                Aivi
              </strong>
              . Over my career, I have owned features end-to-end from design
              handoff to production release, delivered payment flows via Juspay,
              instrumented deep user attribution funnels, and optimized bundle
              sizes and OTA updates.
            </p>

            <p>
              My journey with browser-based developer tooling started early. At{' '}
              <strong className="text-[var(--text-primary)] font-semibold">
                Codingmart Technologies
              </strong>
              , I engineered an in-browser JavaScript code editor with real-time
              compilation and execution for technical candidate recruitment.
              That experience revealed something powerful: modern web browsers
              are not merely document viewers; they are robust, highly optimized
              execution runtimes powered by V8 and WebAssembly.
            </p>

            <p>
              <strong className="text-[var(--text-primary)] font-semibold">
                Why I created RunJS:
              </strong>{' '}
              Most online coding playgrounds rely on expensive cloud servers to
              receive code, queue execution, and transmit output back over the
              wire. This approach creates network latency, compromises user code
              privacy, incurs recurring server bills, and frequently leads to
              paywalls or usage limits. I built RunJS with a fundamentally
              different philosophy: make the web browser do the heavy lifting.
              By leveraging Monaco Editor, Acorn AST loop guarding, esbuild
              WebAssembly transpilation, and client-side sandbox execution,
              RunJS provides instant, private, and zero-cost code execution for
              everyone.
            </p>

            <div className="pt-2 grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
              <div className="p-3.5 rounded-xl bg-[var(--bg-surface-muted)] border border-[var(--border-default)] space-y-1">
                <span className="text-[11px] font-bold text-amber-500 uppercase tracking-wider">
                  Core Craft
                </span>
                <p className="text-[var(--text-primary)] font-semibold text-xs">
                  React Native &amp; TypeScript
                </p>
                <p className="text-[11px] text-[var(--text-muted)]">
                  Scalable mobile &amp; web architecture
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-[var(--bg-surface-muted)] border border-[var(--border-default)] space-y-1">
                <span className="text-[11px] font-bold text-emerald-500 uppercase tracking-wider">
                  Engineering Drive
                </span>
                <p className="text-[var(--text-primary)] font-semibold text-xs">
                  Measurable Business Impact
                </p>
                <p className="text-[11px] text-[var(--text-muted)]">
                  Cost reduction &amp; 150% growth
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-[var(--bg-surface-muted)] border border-[var(--border-default)] space-y-1">
                <span className="text-[11px] font-bold text-blue-500 uppercase tracking-wider">
                  Open Source Passion
                </span>
                <p className="text-[var(--text-primary)] font-semibold text-xs">
                  In-Browser Developer Tools
                </p>
                <p className="text-[11px] text-[var(--text-muted)]">
                  RunJS, AST visualizers &amp; local AI
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ==================================================================== */}
        {/* SECTION 3: PROFESSIONAL EXPERIENCE */}
        {/* ==================================================================== */}
        <section className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-500 uppercase tracking-wider">
              <Briefcase className="w-4 h-4" />
              <span>Career Journey</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-primary)]">
              Professional Experience
            </h2>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] max-w-2xl">
              Proven track record of measurable business impact, clean code
              review standards, and shipping scaled consumer apps.
            </p>
          </div>

          <div className="space-y-6">
            {/* Experience Item 1: 6thStreet.com */}
            <div className="p-6 sm:p-8 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] shadow-xs space-y-4 hover:border-[var(--border-hover)] transition-all">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--border-subtle)] pb-4">
                <div>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                    Current Role
                  </span>
                  <h3 className="text-lg sm:text-xl font-bold text-[var(--text-primary)] mt-1.5">
                    Software Engineer — React Native
                  </h3>
                  <p className="text-xs sm:text-sm font-medium text-[var(--text-secondary)]">
                    Apparel Group • 6thStreet.com (E-Commerce) &amp; Aivi
                  </p>
                </div>
                <div className="text-xs font-mono text-[var(--text-muted)] self-start sm:self-auto bg-[var(--bg-surface-muted)] px-3 py-1 rounded-lg border border-[var(--border-default)]">
                  Oct 2025 – Present
                </div>
              </div>

              <ul className="space-y-2.5 text-xs sm:text-sm text-[var(--text-secondary)]">
                <li className="flex items-start gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 shrink-0" />
                  <span>
                    Delivered{' '}
                    <strong className="text-[var(--text-primary)]">
                      20+ features
                    </strong>{' '}
                    for 6thStreet&apos;s React Native app (
                    <strong className="text-[var(--text-primary)]">
                      1M+ downloads, 4.1★ App Store rating
                    </strong>
                    ), owning end-to-end development from design handoff to
                    release.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 shrink-0" />
                  <span>
                    Led frontend development for the Gulf region&apos;s first{' '}
                    <strong className="text-[var(--text-primary)]">
                      Quick Delivery Service
                    </strong>
                    , enabling minute-level home deliveries and directly
                    expanding market share across regions.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 shrink-0" />
                  <span>
                    Designed and built an in-house{' '}
                    <strong className="text-[var(--text-primary)]">
                      Recently Viewed widget
                    </strong>
                    , replacing a third-party tool and{' '}
                    <strong className="text-[var(--text-primary)]">
                      saving $220K/year
                    </strong>{' '}
                    while improving user engagement.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 shrink-0" />
                  <span>
                    Integrated Google Analytics, AppsFlyer, and MoEngage to
                    enable personalized user journeys, driving a{' '}
                    <strong className="text-[var(--text-primary)]">
                      150% increase in user engagement
                    </strong>
                    .
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 shrink-0" />
                  <span>
                    Resolved{' '}
                    <strong className="text-[var(--text-primary)]">
                      100+ critical bugs
                    </strong>{' '}
                    and led UI revamps across the app, improving performance and
                    cross-platform stability.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 shrink-0" />
                  <span>
                    Authored a monthly code review checklist adopted team-wide,
                    reducing code-related defects and raising overall code
                    quality.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 shrink-0" />
                  <span>
                    Mentored junior developers through structured code reviews
                    and pairing sessions; adopted AI coding assistants into the
                    workflow to accelerate feature turnaround.
                  </span>
                </li>
              </ul>
            </div>

            {/* Experience Item 2: Pantaloons */}
            <div className="p-6 sm:p-8 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] shadow-xs space-y-4 hover:border-[var(--border-hover)] transition-all">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--border-subtle)] pb-4">
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-[var(--text-primary)]">
                    Product Engineer — React Native
                  </h3>
                  <p className="text-xs sm:text-sm font-medium text-[var(--text-secondary)]">
                    Aditya Birla Fashion and Retail Ltd — Pantaloons
                    (E-Commerce)
                  </p>
                </div>
                <div className="text-xs font-mono text-[var(--text-muted)] self-start sm:self-auto bg-[var(--bg-surface-muted)] px-3 py-1 rounded-lg border border-[var(--border-default)]">
                  Jul 2023 – Sep 2025
                </div>
              </div>

              <ul className="space-y-2.5 text-xs sm:text-sm text-[var(--text-secondary)]">
                <li className="flex items-start gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 shrink-0" />
                  <span>
                    Delivered{' '}
                    <strong className="text-[var(--text-primary)]">
                      30+ features
                    </strong>{' '}
                    for Pantaloons&apos; React Native app (
                    <strong className="text-[var(--text-primary)]">
                      1Cr+ downloads, 4.6★ App Store rating
                    </strong>
                    ), from architecture through release.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 shrink-0" />
                  <span>
                    Designed and implemented the{' '}
                    <strong className="text-[var(--text-primary)]">
                      frontend payment flow architecture
                    </strong>
                    , integrating{' '}
                    <strong className="text-[var(--text-primary)]">
                      Juspay
                    </strong>{' '}
                    for self-checkout and streamlining the purchase journey.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 shrink-0" />
                  <span>
                    Reduced Over-the-Air (OTA) update sizes by{' '}
                    <strong className="text-[var(--text-primary)]">15%</strong>{' '}
                    through build and bundle optimization, cutting update time
                    and data usage for users.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 shrink-0" />
                  <span>
                    Integrated{' '}
                    <strong className="text-[var(--text-primary)]">
                      AWS Secrets Manager
                    </strong>{' '}
                    for secure credential and API key management, and AWS Form
                    Validation in API Gateway to harden data input security.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 shrink-0" />
                  <span>
                    Revamped Profile, Home, and Cart screens, improving
                    usability and visual consistency across the app.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 shrink-0" />
                  <span>
                    Implemented Adobe Analytics event tracking to surface
                    actionable user behavior insights for product decisions.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 shrink-0" />
                  <span>
                    Upgraded the React Native version across the codebase,
                    improving app speed by{' '}
                    <strong className="text-[var(--text-primary)]">10%</strong>.
                  </span>
                </li>
              </ul>
            </div>

            {/* Experience Item 3: Codingmart */}
            <div className="p-6 sm:p-8 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] shadow-xs space-y-4 hover:border-[var(--border-hover)] transition-all">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--border-subtle)] pb-4">
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-[var(--text-primary)]">
                    Product Development Engineer
                  </h3>
                  <p className="text-xs sm:text-sm font-medium text-[var(--text-secondary)]">
                    Codingmart Technologies — quickrecruit.com
                  </p>
                </div>
                <div className="text-xs font-mono text-[var(--text-muted)] self-start sm:self-auto bg-[var(--bg-surface-muted)] px-3 py-1 rounded-lg border border-[var(--border-default)]">
                  Jul 2022 – Jun 2023
                </div>
              </div>

              <ul className="space-y-2.5 text-xs sm:text-sm text-[var(--text-secondary)]">
                <li className="flex items-start gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 shrink-0" />
                  <span>
                    <strong className="text-[var(--text-primary)]">
                      Built a browser-based code editor
                    </strong>{' '}
                    for writing, compiling, and executing JavaScript in real
                    time.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 shrink-0" />
                  <span>
                    Reduced development time by{' '}
                    <strong className="text-[var(--text-primary)]">25%</strong>{' '}
                    by writing reusable, maintainable components adopted across
                    the product.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 shrink-0" />
                  <span>
                    Optimized application performance, improving load times and
                    overall user experience.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 shrink-0" />
                  <span>
                    Managed CMS integration, enabling dynamic and seamless
                    content updates without redeploys.
                  </span>
                </li>
              </ul>
            </div>

            {/* Education Card */}
            <div className="p-6 sm:p-7 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-amber-500/10 text-amber-500 shrink-0">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-[var(--text-primary)]">
                    Bachelor of Engineering (B.E.)
                  </h3>
                  <p className="text-xs sm:text-sm text-[var(--text-secondary)]">
                    Sri Shakthi Institute of Engineering and Technology
                  </p>
                </div>
              </div>
              <span className="text-xs font-mono text-[var(--text-muted)] bg-[var(--bg-surface-muted)] px-3 py-1.5 rounded-lg border border-[var(--border-default)] self-start sm:self-auto">
                Engineering Graduate
              </span>
            </div>
          </div>
        </section>

        {/* ==================================================================== */}
        {/* SECTION 4: SKILLS & TECHNOLOGIES */}
        {/* ==================================================================== */}
        <section className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-500 uppercase tracking-wider">
              <Cpu className="w-4 h-4" />
              <span>Technical Stack</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-primary)]">
              Skills &amp; Technologies
            </h2>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] max-w-2xl">
              Curated technical stack verified directly through production
              deliverables and project architectures.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-2">
            {skillCategories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveSkillCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                  activeSkillCategory === cat.id
                    ? 'bg-amber-500 text-black font-semibold shadow-xs scale-102'
                    : 'border border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Skills Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-3">
            {filteredSkills.map((skill, index) => (
              <div
                key={index}
                className={`p-3 sm:p-3.5 rounded-xl border transition-all flex items-center justify-between gap-2 ${
                  skill.highlight
                    ? 'bg-amber-500/5 border-amber-500/30 text-[var(--text-primary)] shadow-2xs'
                    : 'bg-[var(--bg-surface)] border-[var(--border-default)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-hover)]'
                }`}
              >
                <span className="text-xs sm:text-sm font-semibold truncate">
                  {skill.name}
                </span>
                {skill.highlight && (
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                )}
              </div>
            ))}
          </div>
        </section>

        {/* ==================================================================== */}
        {/* SECTION 5: SELECTED PROJECTS (PORTFOLIO SHOWCASE) */}
        {/* ==================================================================== */}
        <section className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-500 uppercase tracking-wider">
              <FolderGit2 className="w-4 h-4" />
              <span>Portfolio Showcase</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-primary)]">
              Selected Projects
            </h2>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] max-w-2xl">
              Key engineering projects highlighting browser-based compilers,
              serverless AI architectures, and on-device privacy.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
            {/* Project 1: RunJS */}
            <div className="p-6 sm:p-7 rounded-2xl border border-amber-500/40 bg-gradient-to-br from-amber-500/5 via-[var(--bg-surface)] to-[var(--bg-surface)] shadow-xs flex flex-col justify-between space-y-4 hover:border-amber-500 transition-all">
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-amber-500 text-black flex items-center justify-center font-bold text-xs shadow-xs">
                      JS
                    </div>
                    <h3 className="text-lg font-bold text-[var(--text-primary)]">
                      RunJS
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-bold uppercase">
                    Flagship Project
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
                  Browser-based JavaScript, TypeScript, and React compiler
                  enabling users to write, compile, and execute code with zero
                  backend. Features AST infinite loop protection, esbuild-wasm
                  compilation, interactive Event Loop &amp; Execution Context
                  visualizers, and a 175+ lesson curriculum.
                </p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {[
                    'React',
                    'Vite',
                    'TypeScript',
                    'esbuild-wasm',
                    'Monaco',
                    'Sandpack',
                    'Acorn AST',
                  ].map((tag) => (
                    <span
                      key={tag}
                      className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-[var(--bg-surface-muted)] border border-[var(--border-default)] text-[var(--text-muted)]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between">
                <Link
                  to="/"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline"
                >
                  <span>Explore RunJS</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <span className="text-xs font-mono text-[var(--text-muted)]">
                  runjs.in
                </span>
              </div>
            </div>

            {/* Project 2: ParseFlowAI */}
            <div className="p-6 sm:p-7 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] shadow-xs flex flex-col justify-between space-y-4 hover:border-[var(--border-hover)] transition-all">
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-500 border border-blue-500/20 flex items-center justify-center font-bold text-xs">
                      AI
                    </div>
                    <h3 className="text-lg font-bold text-[var(--text-primary)]">
                      ParseFlowAI
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 font-bold uppercase">
                    Serverless API
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
                  Automated resume-to-data conversion engine powered by Gemini
                  AI. Automatically parses any resume PDF into structured JSON
                  strictly matching user-defined custom JSON schemas via a fast,
                  serverless developer API.
                </p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {[
                    'Hono',
                    'AWS Lambda',
                    'AWS S3',
                    'DynamoDB',
                    'Gemini AI',
                    'JSON Schema',
                  ].map((tag) => (
                    <span
                      key={tag}
                      className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-[var(--bg-surface-muted)] border border-[var(--border-default)] text-[var(--text-muted)]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between">
                <span className="text-xs font-medium text-[var(--text-secondary)]">
                  Custom Structured Extraction
                </span>
                <span className="text-xs font-mono text-[var(--text-muted)]">
                  Serverless AWS
                </span>
              </div>
            </div>

            {/* Project 3: HireLensAI */}
            <div className="p-6 sm:p-7 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] shadow-xs flex flex-col justify-between space-y-4 hover:border-[var(--border-hover)] transition-all">
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center justify-center font-bold text-xs">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <h3 className="text-lg font-bold text-[var(--text-primary)]">
                      HireLensAI
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-bold uppercase">
                    100% Privacy-First
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
                  Desktop application for candidate screening where resumes,
                  embeddings, and candidate data never leave the local computer.
                  Features hybrid explainable scoring (40% skill match, 25%
                  experience, 20% semantic, 15% AI) with on-device LLM models.
                </p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {[
                    'Tauri 2',
                    'Local LLMs',
                    'Explainable AI',
                    'Embeddings',
                    'Rust',
                    'TypeScript',
                  ].map((tag) => (
                    <span
                      key={tag}
                      className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-[var(--bg-surface-muted)] border border-[var(--border-default)] text-[var(--text-muted)]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between">
                <span className="text-xs font-medium text-[var(--text-secondary)]">
                  On-Device AI Engine
                </span>
                <span className="text-xs font-mono text-[var(--text-muted)]">
                  Tauri Desktop
                </span>
              </div>
            </div>

            {/* Project 4: QuickRecruit In-Browser Code Editor */}
            <div className="p-6 sm:p-7 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] shadow-xs flex flex-col justify-between space-y-4 hover:border-[var(--border-hover)] transition-all">
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-500 border border-purple-500/20 flex items-center justify-center font-bold text-xs">
                      <Terminal className="w-4 h-4" />
                    </div>
                    <h3 className="text-lg font-bold text-[var(--text-primary)]">
                      Codingmart Code Compiler
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 font-bold uppercase">
                    Recruitment Tool
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
                  Browser-based code editor and compiler built for
                  quickrecruit.com, enabling real-time JavaScript test
                  evaluation for developer candidates. Adopted reusable
                  component patterns cutting frontend development time by 25%.
                </p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {[
                    'JavaScript',
                    'React',
                    'Live Compiler',
                    'CMS Integration',
                    'Component Architecture',
                  ].map((tag) => (
                    <span
                      key={tag}
                      className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-[var(--bg-surface-muted)] border border-[var(--border-default)] text-[var(--text-muted)]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between">
                <span className="text-xs font-medium text-[var(--text-secondary)]">
                  Candidate Assessment Platform
                </span>
                <span className="text-xs font-mono text-[var(--text-muted)]">
                  Codingmart
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ==================================================================== */}
        {/* SECTION 6: MY WORK ON RUNJS (FLAGSHIP CREATION & SYSTEM CAPABILITIES) */}
        {/* ==================================================================== */}
        <section id="runjs-work" className="space-y-8 scroll-mt-20">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-500 uppercase tracking-wider">
                <Code2 className="w-4 h-4" />
                <span>Flagship Creation</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-primary)]">
                My Work on RunJS
              </h2>
              <p className="text-xs sm:text-sm text-[var(--text-secondary)] max-w-2xl">
                The architecture, tooling, and technical engineering behind
                RunJS — built from scratch to push the boundaries of in-browser
                developer environments.
              </p>
            </div>

            <Link
              to="/about"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline shrink-0"
            >
              <span>Explore Architecture Deep Dive</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Mission & Vision Card */}
          <div className="p-6 sm:p-8 rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-[var(--bg-surface)] to-[var(--bg-surface)] shadow-xs space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-amber-500 text-black font-bold text-base shadow-xs">
                JS
              </div>
              <div>
                <h3 className="text-lg font-bold text-[var(--text-primary)]">
                  The Vision Behind RunJS
                </h3>
                <p className="text-xs text-[var(--text-secondary)]">
                  Designed, architected, and continuously maintained by M R
                  Kishore Kumar
                </p>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
              RunJS is an all-in-one developer workspace designed to make
              practicing, learning, and experimenting with JavaScript,
              TypeScript, and React completely frictionless. As the sole creator
              and maintainer, I led every phase: from conceptualizing the
              client-side compiler pipeline and crafting the UI/UX design
              system, to authoring 175+ interactive curriculum lessons and
              building custom visualizers for JavaScript internal runtime
              mechanics.
            </p>
          </div>

          {/* 6 Technical Pillars of RunJS */}
          <div className="space-y-4">
            <div>
              <span className="text-xs font-semibold text-amber-500 uppercase tracking-wider">
                System Capabilities
              </span>
              <h3 className="text-lg sm:text-xl font-bold text-[var(--text-primary)] mt-0.5">
                Core Features &amp; Engineering Innovations
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
              {runjsPillars.map((pillar, idx) => (
                <div
                  key={idx}
                  className="p-5 sm:p-6 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] hover:border-[var(--border-hover)] transition-all shadow-2xs space-y-2.5"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-[var(--bg-surface-muted)] border border-[var(--border-subtle)] shrink-0">
                      {pillar.icon}
                    </div>
                    <h4 className="text-sm sm:text-base font-bold text-[var(--text-primary)]">
                      {pillar.title}
                    </h4>
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                    {pillar.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Product & Technical Challenges Overcome */}
          <div className="p-6 sm:p-8 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] shadow-xs space-y-5">
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-500 uppercase tracking-wider">
              <Terminal className="w-4 h-4" />
              <span>Engineering Hurdles</span>
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-[var(--text-primary)]">
              Product &amp; Technical Challenges Solved
            </h3>

            <div className="space-y-4 text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
              <div className="p-4 rounded-xl bg-[var(--bg-surface-muted)] border border-[var(--border-default)] space-y-1.5">
                <div className="flex items-center gap-2 font-semibold text-[var(--text-primary)]">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>
                    Preventing Tab Crashes from Infinite Loops Without a Backend
                  </span>
                </div>
                <p className="text-xs pl-6 text-[var(--text-secondary)]">
                  In server-backed platforms, runaway code is killed by timeout
                  signals. In the browser, an infinite while loop freezes the UI
                  thread immediately. To solve this, I built an AST-based loop
                  guard using Acorn that traverses all loop nodes (ForStatement,
                  WhileStatement, DoWhileStatement) and injects runtime counter
                  checks that terminate loops exceeding 5,000 iterations safely.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[var(--bg-surface-muted)] border border-[var(--border-default)] space-y-1.5">
                <div className="flex items-center gap-2 font-semibold text-[var(--text-primary)]">
                  <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0" />
                  <span>Ultra-Fast In-Browser TypeScript Compilation</span>
                </div>
                <p className="text-xs pl-6 text-[var(--text-secondary)]">
                  Standard TypeScript compiler packages (tsc) in the browser
                  exceed 15MB and take seconds to boot. By embedding a
                  WebAssembly build of esbuild (`esbuild-wasm`) and caching
                  initialization, TypeScript is transpiled with syntax errors
                  reported in single-digit milliseconds.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[var(--bg-surface-muted)] border border-[var(--border-default)] space-y-1.5">
                <div className="flex items-center gap-2 font-semibold text-[var(--text-primary)]">
                  <CheckCircle2 className="w-4 h-4 text-purple-500 shrink-0" />
                  <span>Visualizing Abstract JavaScript Runtime Concepts</span>
                </div>
                <p className="text-xs pl-6 text-[var(--text-secondary)]">
                  Engineers frequently struggle with asynchronous call order and
                  hoisting. I engineered the JS Visualizer and Execution Context
                  Visualizer from first principles, decomposing code into step
                  sequences that simulate the Call Stack, Microtask queue
                  (Promises), Task queue (timers), and Execution phases live.
                </p>
              </div>
            </div>

            {/* Quick launch interactive buttons */}
            <div className="pt-2 border-t border-[var(--border-subtle)] flex flex-wrap items-center gap-2.5">
              <span className="text-xs font-semibold text-[var(--text-primary)]">
                Try it live:
              </span>
              <Link
                to="/js"
                className="px-3 py-1.5 rounded-lg bg-[var(--bg-surface-muted)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-default)] text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              >
                JS Playground
              </Link>
              <Link
                to="/ts"
                className="px-3 py-1.5 rounded-lg bg-[var(--bg-surface-muted)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-default)] text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              >
                TypeScript
              </Link>
              <Link
                to="/visualizer"
                className="px-3 py-1.5 rounded-lg bg-[var(--bg-surface-muted)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-default)] text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              >
                Event Loop
              </Link>
              <Link
                to="/execution-context"
                className="px-3 py-1.5 rounded-lg bg-[var(--bg-surface-muted)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-default)] text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              >
                Execution Context
              </Link>
              <Link
                to="/problems"
                className="px-3 py-1.5 rounded-lg bg-[var(--bg-surface-muted)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-default)] text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              >
                Challenges
              </Link>
              <Link
                to="/learn"
                className="px-3 py-1.5 rounded-lg bg-[var(--bg-surface-muted)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-default)] text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              >
                Curriculum
              </Link>
            </div>
          </div>
        </section>

        {/* ==================================================================== */}
        {/* SECTION 7: CALL TO ACTION */}
        {/* ==================================================================== */}
        <section className="p-8 sm:p-12 rounded-3xl border border-amber-500/30 bg-gradient-to-b from-[var(--bg-surface)] to-[var(--bg-surface-muted)] text-center space-y-6 shadow-sm">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-500 border border-amber-500/30 mx-auto">
            <Sparkles className="w-6 h-6" />
          </div>

          <div className="space-y-2 max-w-xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)]">
              Let&apos;s Build Something Exceptional
            </h2>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
              Whether you are interested in discussing React Native
              architecture, collaborating on open-source developer tooling, or
              discussing professional opportunities, feel free to reach out.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              to="/js"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-black text-xs sm:text-sm font-bold shadow-xs transition-all hover:scale-102 active:scale-98"
            >
              <Play className="w-4 h-4 fill-black" />
              <span>Explore RunJS</span>
            </Link>

            <a
              href="https://www.linkedin.com/in/mrkishorekumar/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] text-[var(--text-primary)] text-xs sm:text-sm font-semibold transition-all hover:scale-102"
            >
              <LinkedinIcon className="w-4 h-4 text-[#0a66c2]" />
              <span>Connect on LinkedIn</span>
            </a>

            <a
              href="https://github.com/mrkishorekumar"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] text-[var(--text-primary)] text-xs sm:text-sm font-semibold transition-all hover:scale-102"
            >
              <GithubIcon className="w-4 h-4" />
              <span>Follow on GitHub</span>
            </a>

            <a
              href="https://raw.githubusercontent.com/mrkishorekumar/mrkishorekumar/main/Kishore_Kumar.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] text-[var(--text-primary)] text-xs sm:text-sm font-semibold transition-all hover:scale-102"
            >
              <Download className="w-4 h-4 text-amber-500" />
              <span>Download Resume</span>
            </a>
          </div>

          <div className="pt-4 text-xs text-[var(--text-muted)] flex items-center justify-center gap-2">
            <span>Email:</span>
            <a
              href="mailto:mrkishorekumar18@gmail.com"
              className="font-mono text-amber-600 dark:text-amber-400 hover:underline"
            >
              mrkishorekumar18@gmail.com
            </a>
            <span>•</span>
            <span>Phone: +91 7871013983</span>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
