export interface NavItem {
  title: string;
  link: string;
  badge?: string;
}

export interface PlaygroundItem {
  title: string;
  link: string;
  description: string;
  badge?: string;
  iconName: 'js' | 'ts' | 'html' | 'react' | 'visualizer' | 'context';
}

export const playgroundLinks: PlaygroundItem[] = [
  {
    title: 'JavaScript',
    link: '/js',
    description: 'Instant JS execution with interactive console',
    badge: 'ES2024',
    iconName: 'js',
  },
  {
    title: 'JS Visualizer',
    link: '/visualizer',
    description: 'Interactive Call Stack, Event Loop & Queue visualizer',
    badge: 'Event Loop',
    iconName: 'visualizer',
  },
  {
    title: 'Context Visualizer',
    link: '/execution-context',
    description: 'Interactive Memory Allocation, Execution Phase & Call Stack',
    badge: 'New',
    iconName: 'context',
  },
  {
    title: 'TypeScript',
    link: '/ts',
    description: 'Static typing with live compiler diagnostics',
    badge: 'v5.8',
    iconName: 'ts',
  },
  {
    title: 'HTML / CSS / JS',
    link: '/html',
    description: 'Frontend web playground with live preview & multi-tabs',
    badge: 'Live',
    iconName: 'html',
  },
  {
    title: 'React + Vite',
    link: '/react',
    description: 'Full-featured component sandbox with file tree & terminal',
    badge: 'IDE',
    iconName: 'react',
  },
];

export interface InterviewItem {
  title: string;
  link: string;
  description: string;
  badge?: string;
  iconName: 'qa' | 'quiz';
}

export const interviewLinks: InterviewItem[] = [
  {
    title: 'Technical Q&A',
    link: '/interview',
    description: 'Core JavaScript theory, architectural deep-dives & solutions',
    badge: 'Theory',
    iconName: 'qa',
  },
  {
    title: 'Output Quiz',
    link: '/output-questions',
    description: '100 predict-the-output questions across 3 difficulty tiers',
    badge: '100 MCQs',
    iconName: 'quiz',
  },
];

export const primaryNavLinks: NavItem[] = [
  { title: 'Learn JS', link: '/learn', badge: '0 → Hero' },
  { title: 'Problems', link: '/problems', badge: 'DSA' },
  { title: 'Dashboard', link: '/dashboard' },
];

export interface MoreNavItem {
  title: string;
  link: string;
  description: string;
  iconName: 'about' | 'bin' | 'github' | 'privacy' | 'terms' | 'creator';
  isExternal?: boolean;
}

export const moreNavLinks: MoreNavItem[] = [
  {
    title: 'About RunJS',
    link: '/about',
    description: 'App architecture, packages, and technical credits',
    iconName: 'about',
  },
  {
    title: 'Privacy Policy',
    link: '/privacy',
    description: 'Client-side privacy and local data handling guarantees',
    iconName: 'privacy',
  },
  {
    title: 'Terms and Conditions',
    link: '/terms',
    description: 'Terms of use, code ownership, and MIT licensing',
    iconName: 'terms',
  },
  {
    title: 'Recycle Bin',
    link: '/bin',
    description: 'Review and permanently remove deleted playgrounds',
    iconName: 'bin',
  },
  {
    title: 'GitHub Repository',
    link: 'https://github.com/rigial/Runjs',
    description: 'View source code, star the project, and report issues',
    iconName: 'github',
    isExternal: true,
  },
  {
    title: 'Creator Portfolio',
    link: '/kishorekumar',
    description: 'Meet M R Kishore Kumar, creator & maintainer of RunJS',
    iconName: 'creator',
  },
];

const navigation = [
  {
    title: 'Home',
    link: '/',
  },
  {
    title: 'Learn JS',
    link: '/learn',
  },
  {
    title: 'Problems',
    link: '/problems',
  },
  {
    title: 'Dashboard',
    link: '/dashboard',
  },
  {
    title: 'JS Interview Question',
    link: '/interview',
  },
  {
    title: 'Output Questions',
    link: '/output-questions',
  },
  {
    title: 'React',
    link: '/react',
  },
  {
    title: 'HTML/CSS/JS',
    link: '/html',
  },
  {
    title: 'JavaScript',
    link: '/js',
  },
  {
    title: 'JS Visualizer',
    link: '/visualizer',
  },
  {
    title: 'TypeScript',
    link: '/ts',
  },
  {
    title: 'Bin',
    link: '/bin',
  },
  {
    title: 'Creator Portfolio',
    link: '/kishorekumar',
  },
  {
    title: 'About',
    link: '/about',
  },
  {
    title: 'Privacy Policy',
    link: '/privacy',
  },
  {
    title: 'Terms and Conditions',
    link: '/terms',
  },
];

export interface PackageItem {
  packageName: string;
  packageLink: string;
  packageDescription: string;
  category: string;
}

const packageList: PackageItem[] = [
  {
    packageLink: 'https://www.npmjs.com/package/@monaco-editor/react',
    packageName: '@monaco-editor/react',
    category: 'Code Editor',
    packageDescription:
      'Powers the VS Code-grade code editor with syntax highlighting, formatting, and theme support.',
  },
  {
    packageLink: 'https://www.npmjs.com/package/emmet-monaco-es',
    packageName: 'emmet-monaco-es',
    category: 'Code Editor',
    packageDescription:
      'Emmet expansion and abbreviations engine integrated with Monaco editor.',
  },
  {
    packageLink: 'https://www.npmjs.com/package/acorn',
    packageName: 'acorn',
    category: 'Compiler & AST',
    packageDescription:
      'Blazingly fast JavaScript parser generating Abstract Syntax Trees (AST) used for Event Loop simulation, execution context stepping, and infinite loop protection.',
  },
  {
    packageLink: 'https://www.npmjs.com/package/acorn-walk',
    packageName: 'acorn-walk',
    category: 'Compiler & AST',
    packageDescription:
      'Fast AST traversal utility for inspecting, scanning, and analyzing code syntax trees.',
  },
  {
    packageLink: 'https://www.npmjs.com/package/esbuild-wasm',
    packageName: 'esbuild-wasm',
    category: 'Compiler & AST',
    packageDescription:
      'WebAssembly-based JavaScript and TypeScript compiler running blazingly fast directly in the browser.',
  },
  {
    packageLink: 'https://www.npmjs.com/package/@codesandbox/sandpack-react',
    packageName: '@codesandbox/sandpack-react',
    category: 'Sandbox & Runtime',
    packageDescription:
      'In-browser live bundler and runtime container for the interactive React Playground.',
  },
  {
    packageLink: 'https://www.npmjs.com/package/@xterm/xterm',
    packageName: '@xterm/xterm',
    category: 'Terminal & Shell',
    packageDescription:
      'Full-featured in-browser terminal emulator with interactive shell and npm support.',
  },
  {
    packageLink: 'https://www.npmjs.com/package/@xterm/addon-fit',
    packageName: '@xterm/addon-fit',
    category: 'Terminal & Shell',
    packageDescription:
      'Addon for xterm.js that dynamically resizes the terminal to fit its parent layout container.',
  },
  {
    packageLink: 'https://www.npmjs.com/package/@xterm/addon-web-links',
    packageName: '@xterm/addon-web-links',
    category: 'Terminal & Shell',
    packageDescription:
      'Addon for xterm.js providing hyperlink detection and clickable URLs directly in terminal output.',
  },
  {
    packageLink: 'https://www.npmjs.com/package/luna-console',
    packageName: 'luna-console',
    category: 'Inspector & Console',
    packageDescription:
      'Developer console capturing stdout, warnings, errors, and object trees with theme parity.',
  },
  {
    packageLink: 'https://www.npmjs.com/package/luna-object-viewer',
    packageName: 'luna-object-viewer',
    category: 'Inspector & Console',
    packageDescription:
      'Interactive deep object inspector for complex JavaScript data structures.',
  },
  {
    packageLink: 'https://www.npmjs.com/package/react',
    packageName: 'react',
    category: 'Core Framework',
    packageDescription:
      'Core UI library for building reactive, component-driven user interfaces.',
  },
  {
    packageLink: 'https://www.npmjs.com/package/react-dom',
    packageName: 'react-dom',
    category: 'Core Framework',
    packageDescription:
      'DOM renderer for React handling high-performance client updates.',
  },
  {
    packageLink: 'https://www.npmjs.com/package/react-router',
    packageName: 'react-router',
    category: 'Core Framework',
    packageDescription:
      'Client-side declarative routing and URL synchronization across views.',
  },
  {
    packageLink: 'https://www.npmjs.com/package/react-split',
    packageName: 'react-split',
    category: 'Layout & UI',
    packageDescription:
      'Provides resizable split-pane layouts for the problem solver and playgrounds.',
  },
  {
    packageLink: 'https://www.npmjs.com/package/lucide-react',
    packageName: 'lucide-react',
    category: 'Layout & UI',
    packageDescription:
      'Beautiful, consistent vector icons powering navigation, buttons, and status indicators.',
  },
  {
    packageLink: 'https://www.npmjs.com/package/idb',
    packageName: 'idb',
    category: 'Storage & State',
    packageDescription:
      'IndexedDB wrapper providing fast, offline-first local storage for saved snippets and projects.',
  },
  {
    packageLink: 'https://www.npmjs.com/package/uuid',
    packageName: 'uuid',
    category: 'Utilities',
    packageDescription:
      'RFC4122 UUID generator for unique project keys and session identifiers.',
  },
  {
    packageLink: 'https://www.npmjs.com/package/jszip',
    packageName: 'jszip',
    category: 'Utilities',
    packageDescription:
      'In-browser ZIP archive generation for multi-file project export.',
  },
  {
    packageLink: 'https://www.npmjs.com/package/vite',
    packageName: 'vite',
    category: 'Build & Tooling',
    packageDescription:
      'Next-generation frontend tooling and bundler providing instant dev server startup and optimized client builds.',
  },
  {
    packageLink: 'https://www.npmjs.com/package/tailwindcss',
    packageName: 'tailwindcss',
    category: 'Build & Tooling',
    packageDescription:
      'Utility-first modern CSS framework powering responsive styling, fluid typography, and dark/light modes.',
  },
  {
    packageLink: 'https://www.npmjs.com/package/typescript',
    packageName: 'typescript',
    category: 'Build & Tooling',
    packageDescription:
      'Typed superset of JavaScript providing static type checking, language tooling, and compiler definitions.',
  },
];

export { navigation, packageList };
