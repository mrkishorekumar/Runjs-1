import type { Monaco } from '@monaco-editor/react';
import { normalizePath, getDirname } from '../../fs/pathUtils';

// Common packages available in modern React ecosystem
const COMMON_PACKAGES = [
  'react',
  'react-dom',
  'react-dom/client',
  'lucide-react',
  'canvas-confetti',
  'react-router',
  '@reduxjs/toolkit',
  'react-redux',
  'clsx',
  'tailwind-merge',
  'axios',
  'framer-motion',
  'date-fns',
  'lodash',
];

const REACT_EXPORTS = [
  { name: 'useState', kind: 'Function', detail: 'React Hook: state variable' },
  { name: 'useEffect', kind: 'Function', detail: 'React Hook: side effect' },
  {
    name: 'useCallback',
    kind: 'Function',
    detail: 'React Hook: memoized callback',
  },
  { name: 'useMemo', kind: 'Function', detail: 'React Hook: memoized value' },
  { name: 'useRef', kind: 'Function', detail: 'React Hook: mutable reference' },
  { name: 'useReducer', kind: 'Function', detail: 'React Hook: reducer state' },
  {
    name: 'useContext',
    kind: 'Function',
    detail: 'React Hook: context consumer',
  },
  { name: 'useId', kind: 'Function', detail: 'React Hook: unique ID' },
  {
    name: 'useTransition',
    kind: 'Function',
    detail: 'React Hook: transition state',
  },
  {
    name: 'useDeferredValue',
    kind: 'Function',
    detail: 'React Hook: deferred value',
  },
  {
    name: 'useImperativeHandle',
    kind: 'Function',
    detail: 'React Hook: custom handle',
  },
  {
    name: 'useLayoutEffect',
    kind: 'Function',
    detail: 'React Hook: layout effect',
  },
  {
    name: 'memo',
    kind: 'Function',
    detail: 'Higher-Order Component memoization',
  },
  {
    name: 'createContext',
    kind: 'Function',
    detail: 'Creates a React Context',
  },
  {
    name: 'forwardRef',
    kind: 'Function',
    detail: 'Forwards refs to child components',
  },
  { name: 'lazy', kind: 'Function', detail: 'Lazy load a component' },
  { name: 'Suspense', kind: 'Class', detail: 'Suspense fallback boundary' },
  { name: 'Fragment', kind: 'Class', detail: 'React Fragment element (<>)' },
  { name: 'StrictMode', kind: 'Class', detail: 'React Strict Mode wrapper' },
  { name: 'Component', kind: 'Class', detail: 'React Class Component base' },
  {
    name: 'FC',
    kind: 'Interface',
    detail: 'TypeScript FunctionComponent type',
  },
  {
    name: 'ReactNode',
    kind: 'TypeParameter',
    detail: 'TypeScript ReactNode type',
  },
  {
    name: 'ReactElement',
    kind: 'TypeParameter',
    detail: 'TypeScript ReactElement type',
  },
  {
    name: 'CSSProperties',
    kind: 'Interface',
    detail: 'TypeScript CSSProperties type',
  },
  { name: 'FormEvent', kind: 'Interface', detail: 'TypeScript FormEvent type' },
  {
    name: 'ChangeEvent',
    kind: 'Interface',
    detail: 'TypeScript ChangeEvent type',
  },
  {
    name: 'MouseEvent',
    kind: 'Interface',
    detail: 'TypeScript MouseEvent type',
  },
  {
    name: 'KeyboardEvent',
    kind: 'Interface',
    detail: 'TypeScript KeyboardEvent type',
  },
  {
    name: 'Dispatch',
    kind: 'TypeParameter',
    detail: 'TypeScript Dispatch type',
  },
  {
    name: 'SetStateAction',
    kind: 'TypeParameter',
    detail: 'TypeScript SetStateAction type',
  },
];

const LUCIDE_EXPORTS = [
  'CheckCircle2',
  'Circle',
  'Plus',
  'Trash2',
  'ShieldCheck',
  'Sparkles',
  'Code2',
  'Terminal',
  'Layers',
  'RotateCcw',
  'PackageCheck',
  'Save',
  'Search',
  'FolderTree',
  'MessageSquare',
  'Edit2',
  'Check',
  'X',
  'ChevronRight',
  'ChevronLeft',
  'ChevronDown',
  'ChevronUp',
  'Download',
  'Upload',
  'RefreshCw',
  'FilePlus',
  'FolderPlus',
  'Play',
  'Zap',
  'BookOpen',
  'Copy',
  'FileText',
  'Star',
  'AlertCircle',
  'Info',
  'Settings',
  'Menu',
  'User',
  'Sun',
  'Moon',
];

const ROUTER_EXPORTS = [
  { name: 'Link', kind: 'Class', detail: 'Navigate to target route' },
  {
    name: 'NavLink',
    kind: 'Class',
    detail: 'Navigation link with active state',
  },
  { name: 'Outlet', kind: 'Class', detail: 'Renders child route elements' },
  { name: 'Routes', kind: 'Class', detail: 'Route configuration container' },
  { name: 'Route', kind: 'Class', detail: 'Declares an element route' },
  {
    name: 'useNavigate',
    kind: 'Function',
    detail: 'Programmatic navigation hook',
  },
  { name: 'useParams', kind: 'Function', detail: 'Route URL parameters hook' },
  {
    name: 'useLocation',
    kind: 'Function',
    detail: 'Current location object hook',
  },
  {
    name: 'useSearchParams',
    kind: 'Function',
    detail: 'URL search query params hook',
  },
];

/**
 * Calculates the relative import path from one normalized path to another.
 * e.g. from '/src/App.tsx' to '/src/types.ts' -> './types'
 * e.g. from '/src/components/Header.tsx' to '/src/types.ts' -> '../types'
 */
export function getRelativeImportPath(
  fromFile: string,
  toFile: string
): string {
  const fromDir = getDirname(normalizePath(fromFile));
  const targetNorm = normalizePath(toFile);

  const fromSegs = fromDir === '/' ? [] : fromDir.split('/').filter(Boolean);
  const toSegs = targetNorm.split('/').filter(Boolean);

  // Find common ancestor
  let common = 0;
  while (
    common < fromSegs.length &&
    common < toSegs.length &&
    fromSegs[common] === toSegs[common]
  ) {
    common++;
  }

  const upCount = fromSegs.length - common;
  const remaining = toSegs.slice(common);

  let rel = '';
  if (upCount === 0) {
    rel = './' + remaining.join('/');
  } else {
    rel = '../'.repeat(upCount) + remaining.join('/');
  }

  // Format import specifier (strip js/ts/jsx/tsx extension)
  const dotIdx = rel.lastIndexOf('.');
  if (dotIdx > 0) {
    const ext = rel.substring(dotIdx + 1).toLowerCase();
    if (['ts', 'tsx', 'js', 'jsx'].includes(ext)) {
      rel = rel.substring(0, dotIdx);
    }
  }

  return rel;
}

export interface ExportedSymbol {
  name: string;
  kind:
    'Function' | 'Interface' | 'TypeParameter' | 'Variable' | 'Class' | 'Enum';
  detail?: string;
}

/**
 * Parses exported symbols (functions, types, interfaces, variables, classes) from file content.
 */
export function parseExportedSymbols(content: string): ExportedSymbol[] {
  const symbols: ExportedSymbol[] = [];
  const seen = new Set<string>();

  const add = (name: string, kind: ExportedSymbol['kind'], detail?: string) => {
    if (name && !seen.has(name)) {
      seen.add(name);
      symbols.push({ name, kind, detail });
    }
  };

  // export default function/class/const
  const defaultFuncMatch = content.match(
    /export\s+default\s+function\s+([A-Za-z0-9_$]+)/
  );
  if (defaultFuncMatch && defaultFuncMatch[1]) {
    add(defaultFuncMatch[1], 'Function', 'Default exported function');
  }

  const defaultClassMatch = content.match(
    /export\s+default\s+class\s+([A-Za-z0-9_$]+)/
  );
  if (defaultClassMatch && defaultClassMatch[1]) {
    add(defaultClassMatch[1], 'Class', 'Default exported class');
  }

  // export interface Foo
  const interfaceMatches = content.matchAll(
    /export\s+interface\s+([A-Za-z0-9_$]+)/g
  );
  for (const m of interfaceMatches) {
    if (m[1]) add(m[1], 'Interface', 'Exported interface');
  }

  // export type Bar
  const typeMatches = content.matchAll(/export\s+type\s+([A-Za-z0-9_$]+)/g);
  for (const m of typeMatches) {
    if (m[1]) add(m[1], 'TypeParameter', 'Exported type alias');
  }

  // export function Foo
  const funcMatches = content.matchAll(
    /export\s+(?:async\s+)?function\s+([A-Za-z0-9_$]+)/g
  );
  for (const m of funcMatches) {
    if (m[1]) add(m[1], 'Function', 'Exported function');
  }

  // export const/let/var Foo
  const varMatches = content.matchAll(
    /export\s+(?:const|let|var)\s+([A-Za-z0-9_$]+)/g
  );
  for (const m of varMatches) {
    if (m[1]) add(m[1], 'Variable', 'Exported variable / constant');
  }

  // export class Foo
  const classMatches = content.matchAll(/export\s+class\s+([A-Za-z0-9_$]+)/g);
  for (const m of classMatches) {
    if (m[1]) add(m[1], 'Class', 'Exported class');
  }

  // export enum Foo
  const enumMatches = content.matchAll(/export\s+enum\s+([A-Za-z0-9_$]+)/g);
  for (const m of enumMatches) {
    if (m[1]) add(m[1], 'Enum', 'Exported enum');
  }

  // export { A, B as C }
  const namedExportsMatch = content.matchAll(/export\s*\{([^}]+)\}/g);
  for (const block of namedExportsMatch) {
    if (block[1]) {
      const parts = block[1].split(',');
      for (const p of parts) {
        const trimmed = p.trim();
        if (trimmed) {
          const aliasParts = trimmed.split(/\s+as\s+/);
          const exportName = (aliasParts[1] || aliasParts[0]).trim();
          if (exportName) {
            add(exportName, 'Variable', 'Exported member');
          }
        }
      }
    }
  }

  return symbols;
}

/**
 * Resolves an import specifier (e.g. './types', './components/Button') to an actual file path in VFS.
 */
export function resolveImportPath(
  currentFile: string,
  importSpecifier: string,
  availablePaths: string[]
): string | null {
  const normCurrent = normalizePath(currentFile);
  const currentDir = getDirname(normCurrent);

  let targetPath = '';
  if (importSpecifier.startsWith('.')) {
    // Relative path
    const parts =
      (currentDir === '/' ? '' : currentDir) + '/' + importSpecifier;
    targetPath = normalizePath(parts);
  } else {
    targetPath = normalizePath('/' + importSpecifier);
  }

  // Exact match
  if (availablePaths.includes(targetPath)) {
    return targetPath;
  }

  // Check with extensions
  const extensions = [
    '.tsx',
    '.ts',
    '.jsx',
    '.js',
    '.d.ts',
    '.json',
    '.css',
    '.svg',
  ];
  for (const ext of extensions) {
    if (availablePaths.includes(targetPath + ext)) {
      return targetPath + ext;
    }
  }

  // Check /index
  for (const ext of extensions) {
    const indexPath = normalizePath(targetPath + '/index' + ext);
    if (availablePaths.includes(indexPath)) {
      return indexPath;
    }
  }

  return null;
}

let activeGetVfsFiles: (() => Record<string, string>) | null = null;
let isRegistered = false;

/**
 * Registers intelligent Import Path and Import Symbol Auto-Suggestion providers in Monaco.
 */
export function registerImportCompletion(
  monaco: Monaco,
  getVfsFiles: () => Record<string, string>
): () => void {
  activeGetVfsFiles = getVfsFiles;
  if (isRegistered) return () => {};

  const disposers: Array<{ dispose: () => void }> = [];
  const targetLanguages = ['javascript', 'typescript', 'jsx', 'tsx'];

  for (const lang of targetLanguages) {
    /* eslint-disable @typescript-eslint/no-explicit-any */
    const provider = monaco.languages.registerCompletionItemProvider(lang, {
      triggerCharacters: ["'", '"', '/', '.', '{', ',', ' '],
      provideCompletionItems(model: any, position: any): any {
        const lineContent = model.getLineContent(position.lineNumber);
        const lineUntilCursor = lineContent.substring(0, position.column - 1);
        const files = activeGetVfsFiles ? activeGetVfsFiles() : getVfsFiles();
        const availablePaths = Object.keys(files).map((p) => normalizePath(p));
        const currentFile = model.uri.path || '/src/App.tsx';

        // 1. Check if user is typing inside quotes in an import or require statement:
        // e.g. import ... from '|' or import '|' or require('|')
        const importFromQuoteMatch = lineUntilCursor.match(
          /(?:import\s+(?:(?:[\w*${}\s,]+)\s+from\s+)?|require\s*\(\s*)['"]([^'"]*)$/
        );

        if (importFromQuoteMatch) {
          const currentTyped = importFromQuoteMatch[1] || '';
          const matchText = importFromQuoteMatch[0];
          const matchStart =
            importFromQuoteMatch.index ??
            lineUntilCursor.lastIndexOf(matchText);
          const quoteStartIndex =
            matchStart + matchText.length - currentTyped.length - 1;

          const range = {
            startLineNumber: position.lineNumber,
            endLineNumber: position.lineNumber,
            startColumn: quoteStartIndex + 2,
            endColumn: position.column,
          };

          const suggestions: any[] = [];

          // Package Suggestions
          if (!currentTyped.startsWith('.')) {
            // Read packages from package.json if present
            let pkgDeps: string[] = [];
            const pkgJsonContent = files['/package.json'];
            if (pkgJsonContent) {
              try {
                const parsed = JSON.parse(pkgJsonContent);
                pkgDeps = [
                  ...Object.keys(parsed.dependencies || {}),
                  ...Object.keys(parsed.devDependencies || {}),
                ];
              } catch {
                // Ignore parse errors
              }
            }

            const allPackages = Array.from(
              new Set([...pkgDeps, ...COMMON_PACKAGES])
            );

            for (const pkg of allPackages) {
              suggestions.push({
                label: pkg,
                kind: monaco.languages.CompletionItemKind.Module,
                detail: 'NPM Package',
                documentation: `Import from package '${pkg}'`,
                insertText: pkg,
                range,
                sortText: `01_${pkg}`,
              });
            }
          }

          // Relative Project File Suggestions (exclude virtual package declaration files under /node_modules/)
          for (const filePath of availablePaths) {
            if (filePath === normalizePath(currentFile)) continue;
            if (filePath.startsWith('/node_modules/')) continue;
            const relPath = getRelativeImportPath(currentFile, filePath);

            suggestions.push({
              label: relPath,
              kind: filePath.endsWith('.css')
                ? monaco.languages.CompletionItemKind.Color
                : filePath.endsWith('.json')
                  ? monaco.languages.CompletionItemKind.Property
                  : monaco.languages.CompletionItemKind.File,
              detail: `Project file: ${filePath}`,
              documentation: `Import relative file '${filePath}'`,
              insertText: relPath,
              range,
              sortText: `00_${relPath}`,
            });
          }

          return {
            suggestions,
          };
        }

        // 2. Check if user is typing inside { ... } in import { | } from 'module'
        // e.g. import { To| } from './types' or import { use| } from 'react'
        const fullLine = lineContent;
        const insideNamedImport = fullLine.match(
          /import\s*\{([^}]*)\}\s*from\s*['"]([^'"]+)['"]/
        );

        if (insideNamedImport) {
          const openBraceCol = fullLine.indexOf('{') + 1;
          const closeBraceCol = fullLine.indexOf('}') + 1;

          if (
            position.column > openBraceCol &&
            position.column <= closeBraceCol
          ) {
            const moduleSpecifier = insideNamedImport[2];
            const wordUntil = model.getWordUntilPosition(position);
            const range = {
              startLineNumber: position.lineNumber,
              endLineNumber: position.lineNumber,
              startColumn: wordUntil.startColumn,
              endColumn: wordUntil.endColumn,
            };

            const suggestions: any[] = [];

            // A. React exports
            if (moduleSpecifier === 'react') {
              for (const sym of REACT_EXPORTS) {
                const kind =
                  sym.kind === 'Function'
                    ? monaco.languages.CompletionItemKind.Function
                    : sym.kind === 'Interface'
                      ? monaco.languages.CompletionItemKind.Interface
                      : sym.kind === 'Class'
                        ? monaco.languages.CompletionItemKind.Class
                        : monaco.languages.CompletionItemKind.TypeParameter;

                suggestions.push({
                  label: sym.name,
                  kind,
                  detail: sym.detail,
                  documentation: `React export: ${sym.name}`,
                  insertText: sym.name,
                  range,
                  sortText: `00_${sym.name}`,
                });
              }
            }

            // B. Lucide React exports
            else if (moduleSpecifier === 'lucide-react') {
              for (const icon of LUCIDE_EXPORTS) {
                suggestions.push({
                  label: icon,
                  kind: monaco.languages.CompletionItemKind.Variable,
                  detail: 'Lucide React Icon',
                  documentation: `<${icon} className="w-4 h-4" />`,
                  insertText: icon,
                  range,
                  sortText: `00_${icon}`,
                });
              }
            }

            // C. React Router exports
            else if (
              moduleSpecifier === 'react-router' ||
              moduleSpecifier === 'react-router-dom'
            ) {
              for (const sym of ROUTER_EXPORTS) {
                suggestions.push({
                  label: sym.name,
                  kind:
                    sym.kind === 'Function'
                      ? monaco.languages.CompletionItemKind.Function
                      : monaco.languages.CompletionItemKind.Class,
                  detail: sym.detail,
                  documentation: `React Router export: ${sym.name}`,
                  insertText: sym.name,
                  range,
                  sortText: `00_${sym.name}`,
                });
              }
            }

            // D. Local Project File exports
            else {
              const resolvedPath = resolveImportPath(
                currentFile,
                moduleSpecifier,
                availablePaths
              );

              if (resolvedPath && files[resolvedPath]) {
                const exportedSymbols = parseExportedSymbols(
                  files[resolvedPath]
                );

                for (const sym of exportedSymbols) {
                  let kind = monaco.languages.CompletionItemKind.Variable;
                  if (sym.kind === 'Function')
                    kind = monaco.languages.CompletionItemKind.Function;
                  else if (sym.kind === 'Interface')
                    kind = monaco.languages.CompletionItemKind.Interface;
                  else if (sym.kind === 'TypeParameter')
                    kind = monaco.languages.CompletionItemKind.TypeParameter;
                  else if (sym.kind === 'Class')
                    kind = monaco.languages.CompletionItemKind.Class;
                  else if (sym.kind === 'Enum')
                    kind = monaco.languages.CompletionItemKind.Enum;

                  suggestions.push({
                    label: sym.name,
                    kind,
                    detail: sym.detail || `Export from ${resolvedPath}`,
                    documentation: `Exported from file: ${resolvedPath}`,
                    insertText: sym.name,
                    range,
                    sortText: `00_${sym.name}`,
                  });
                }
              }
            }

            if (suggestions.length > 0) {
              return { suggestions };
            }
          }
        }

        return { suggestions: [] };
      },
    });

    disposers.push(provider);
  }

  isRegistered = true;

  return () => {
    disposers.forEach((d) => d.dispose());
    isRegistered = false;
  };
}
