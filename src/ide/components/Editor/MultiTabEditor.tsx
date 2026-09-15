import React, {
  useEffect,
  useRef,
  useState,
  useMemo,
  useCallback,
} from 'react';
import Editor, { Monaco } from '@monaco-editor/react';
import {
  getBasename,
  getLanguageFromPath,
  normalizePath,
} from '../../fs/pathUtils';
import { FileIcon } from '../FileExplorer/FileIcon';
import { ContextMenu, ContextMenuItem } from '../FileExplorer/ContextMenu';
import { emmetJSX, emmetCSS, emmetHTML } from 'emmet-monaco-es';
import useTheme from '../../../hook/useTheme';
import {
  getMonacoThemeName,
  registerMonacoThemes,
} from '../../../utils/monacoThemes';
import AppLoading from '../../../components/AppLoading';
import { X, AlignLeft, Save, ChevronRight, Code2 } from 'lucide-react';
import { registerReactSnippets } from '../../languages/snippets/reactSnippets';
import {
  setupTypeScript,
  syncVfsToMonacoTypeScript,
} from '../../languages/typescript/setupTypeScript';
import { registerImportCompletion } from '../../languages/imports/importCompletion';
import {
  registerDefinitionProvider,
  findSymbolLocationInContent,
  findLocalSymbolLocation,
  isJsxTagAtPosition,
  parseImportMap,
  resolveModuleTarget,
} from '../../languages/navigation/definitionProvider';
import { getAllPackageVirtualFiles } from '../../languages/typescript/packageDefinitions';

interface MultiTabEditorProps {
  activeFile: string;
  openFiles: string[];
  dirtyFiles: Set<string>;
  content: string;
  onSelectTab: (path: string) => void;
  onCloseTab: (path: string) => void;
  onCloseOtherTabs: (path: string) => void;
  onCloseAllTabs: () => void;
  onChangeCode: (path: string, newCode: string) => void;
  onSaveFile: (path: string) => void;
  onSaveProject?: () => void;
  fontSize: number;
  /* eslint-disable @typescript-eslint/no-explicit-any */
  editorRef?: React.MutableRefObject<any>;
  allFiles?: Record<string, string>;
}

export function MultiTabEditor({
  activeFile,
  openFiles,
  dirtyFiles,
  content,
  onSelectTab,
  onCloseTab,
  onCloseOtherTabs,
  onCloseAllTabs,
  onChangeCode,
  onSaveFile,
  onSaveProject,
  fontSize,
  editorRef: externalEditorRef,
  allFiles = {},
}: MultiTabEditorProps) {
  const { resolvedTheme } = useTheme();
  const internalEditorRef = useRef<any>(null);
  const monacoInstanceRef = useRef<Monaco | null>(null);
  const activeFileRef = useRef(activeFile);
  const onSaveFileRef = useRef(onSaveFile);
  const onSaveProjectRef = useRef(onSaveProject);
  const allFilesRef = useRef(allFiles);
  const languageDisposersRef = useRef<Array<() => void>>([]);
  const pendingPositionRef = useRef<{
    lineNumber: number;
    column: number;
  } | null>(null);

  useEffect(() => {
    activeFileRef.current = activeFile;
  }, [activeFile]);

  useEffect(() => {
    onSaveFileRef.current = onSaveFile;
  }, [onSaveFile]);

  useEffect(() => {
    onSaveProjectRef.current = onSaveProject;
  }, [onSaveProject]);

  useEffect(() => {
    const packageVirtualFiles = getAllPackageVirtualFiles();
    const merged = { ...packageVirtualFiles, ...allFiles };
    allFilesRef.current = merged;

    const timer = setTimeout(() => {
      if (monacoInstanceRef.current) {
        syncVfsToMonacoTypeScript(monacoInstanceRef.current, merged);
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [allFiles]);

  // Clean up registered providers on unmount
  useEffect(() => {
    return () => {
      languageDisposersRef.current.forEach((dispose) => dispose());
      languageDisposersRef.current = [];
    };
  }, []);

  const [tabContextMenu, setTabContextMenu] = useState<{
    x: number;
    y: number;
    path: string;
    items: ContextMenuItem[];
  } | null>(null);

  const language = useMemo(() => getLanguageFromPath(activeFile), [activeFile]);

  // Sync theme changes
  useEffect(() => {
    if (monacoInstanceRef.current) {
      monacoInstanceRef.current.editor.setTheme(
        getMonacoThemeName(resolvedTheme)
      );
    }
  }, [resolvedTheme]);

  // Handle jump-to-position when switching tabs via Go to Definition / Ctrl+Click
  useEffect(() => {
    if (pendingPositionRef.current) {
      const pos = pendingPositionRef.current;
      pendingPositionRef.current = null;
      const editor = externalEditorRef?.current || internalEditorRef.current;
      if (editor) {
        setTimeout(() => {
          try {
            editor.setPosition(pos);
            editor.revealPositionInCenter(pos);
            editor.focus();
          } catch {
            // Model may be transitioning
          }
        }, 50);
      }
    }
  }, [activeFile, externalEditorRef]);

  const handleOpenFile = useCallback(
    (path: string, position?: { lineNumber: number; column: number }) => {
      const norm = normalizePath(path);
      if (position) {
        pendingPositionRef.current = position;
      }
      onSelectTab(norm);
    },
    [onSelectTab]
  );

  const handleTabContextMenu = (e: React.MouseEvent, path: string) => {
    e.preventDefault();
    e.stopPropagation();

    setTabContextMenu({
      x: e.clientX,
      y: e.clientY,
      path,
      items: [
        {
          label: 'Close',
          action: () => onCloseTab(path),
        },
        {
          label: 'Close Others',
          action: () => onCloseOtherTabs(path),
        },
        {
          label: 'Close All',
          action: () => onCloseAllTabs(),
        },
        { divider: true, label: '', action: () => {} },
        {
          label: 'Save',
          shortcut: '⌘S',
          action: () => onSaveFile(path),
        },
      ],
    });
  };

  const handleFormat = () => {
    const editor = externalEditorRef?.current || internalEditorRef.current;
    if (editor) {
      editor.getAction('editor.action.formatDocument')?.run();
    }
  };

  // Build breadcrumb segments
  const breadcrumbs = useMemo(() => {
    if (!activeFile) return [];
    const norm = normalizePath(activeFile);
    return norm.split('/').filter(Boolean);
  }, [activeFile]);

  // Effective content including virtual package files fallback
  const effectiveContent = useMemo(() => {
    if (content !== undefined) return content;
    const pkgFiles = getAllPackageVirtualFiles();
    if (pkgFiles[activeFile]) return pkgFiles[activeFile];
    return allFiles[activeFile] ?? '';
  }, [content, activeFile, allFiles]);

  return (
    <div className="h-full w-full flex flex-col bg-[var(--bg-app)] overflow-hidden">
      {/* Tab Strip */}
      <div className="h-9 w-full flex items-center bg-[var(--bg-surface)] border-b border-[var(--border-default)] overflow-x-auto no-scrollbar shrink-0 select-none">
        {openFiles.map((path) => {
          const isActive = path === activeFile;
          const isDirty = dirtyFiles.has(path);
          const name = path.startsWith('/node_modules/')
            ? path
                .replace('/node_modules/', '')
                .replace(/\/index\.d\.ts$/, '.d.ts')
            : getBasename(path);

          return (
            <div
              key={path}
              onClick={() => onSelectTab(path)}
              onContextMenu={(e) => handleTabContextMenu(e, path)}
              className={`group h-full flex items-center gap-2 px-3 border-r border-[var(--border-default)] cursor-pointer text-xs transition-colors shrink-0 ${
                isActive
                  ? 'bg-[var(--bg-app)] text-[var(--text-primary)] font-medium border-t-2 border-t-cyan-500'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-primary)]'
              }`}
            >
              <FileIcon path={path} className="w-3.5 h-3.5" />
              <span className="truncate max-w-[130px]">{name}</span>

              {/* Close or Dirty Dot */}
              <div className="flex items-center justify-center w-4 h-4 ml-0.5">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onCloseTab(path);
                  }}
                  title="Close"
                  className={`w-full h-full flex items-center justify-center rounded hover:bg-[var(--bg-surface-hover)] ${
                    isDirty
                      ? ''
                      : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {isDirty ? (
                    <>
                      <span className="w-2 h-2 rounded-full bg-cyan-400 group-hover:hidden" />
                      <X className="w-3 h-3 hidden group-hover:block text-[var(--text-muted)] hover:text-[var(--text-primary)]" />
                    </>
                  ) : (
                    <X className="w-3 h-3" />
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Breadcrumbs & Editor Action Toolbar */}
      <div className="h-7 px-3 flex items-center justify-between bg-[var(--bg-surface-muted)] border-b border-[var(--border-subtle)] text-[11px] text-[var(--text-muted)] select-none shrink-0">
        {/* Left: Breadcrumbs */}
        <div className="flex items-center gap-1 font-mono truncate">
          <Code2 className="w-3 h-3 text-amber-500 shrink-0" />
          <span>project</span>
          {breadcrumbs.map((seg, i) => (
            <React.Fragment key={i}>
              <ChevronRight className="w-3 h-3 opacity-50 shrink-0" />
              <span
                className={
                  i === breadcrumbs.length - 1
                    ? 'text-[var(--text-primary)] font-medium'
                    : ''
                }
              >
                {seg}
              </span>
            </React.Fragment>
          ))}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {dirtyFiles.has(activeFile) && (
            <button
              type="button"
              onClick={() => onSaveFile(activeFile)}
              title="Save File (⌘S)"
              className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500/20 transition-colors"
            >
              <Save className="w-3 h-3" />
              <span>Save</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleFormat}
            title="Format Document (Shift+Alt+F)"
            className="flex items-center gap-1 p-0.5 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors"
          >
            <AlignLeft className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Monaco Editor Container */}
      <div className="flex-1 w-full overflow-hidden bg-[var(--bg-app)] relative">
        {activeFile ? (
          <Editor
            loading={<AppLoading freeLoading={true} />}
            theme={getMonacoThemeName(resolvedTheme)}
            width="100%"
            height="100%"
            language={language}
            path={activeFile}
            value={effectiveContent}
            onChange={(value) => onChangeCode(activeFile, value ?? '')}
            onMount={(editor, monaco) => {
              internalEditorRef.current = editor;
              if (externalEditorRef) {
                externalEditorRef.current = editor;
              }
              monacoInstanceRef.current = monaco;
              registerMonacoThemes(monaco);
              monaco.editor.setTheme(getMonacoThemeName(resolvedTheme));

              // Add Save shortcut (Cmd+S / Ctrl+S)
              editor.addCommand(
                monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS,
                () => {
                  if (activeFileRef.current) {
                    onSaveFileRef.current(activeFileRef.current);
                  } else if (onSaveProjectRef.current) {
                    onSaveProjectRef.current();
                  }
                }
              );

              // Mouse Down Handler for seamless Ctrl/Cmd + click navigation
              editor.onMouseDown((e: any) => {
                if (e.event.ctrlKey || e.event.metaKey) {
                  const pos = e.target.position;
                  if (!pos) return;
                  const model = editor.getModel();
                  if (!model) return;

                  const lineContent = model.getLineContent(pos.lineNumber);
                  const files = allFilesRef.current;
                  const currentFilePath = activeFileRef.current;

                  // 1. Check if clicking on import path string (e.g. 'lucide-react', 'react', './types', './components/Button')
                  const stringMatches =
                    lineContent.matchAll(/['"]([^'"]+)['"]/g);
                  for (const m of stringMatches) {
                    const rawStr = m[0];
                    const innerStr = m[1];
                    const startCol = m.index !== undefined ? m.index + 1 : 1;
                    const endCol = startCol + rawStr.length;

                    if (pos.column >= startCol && pos.column <= endCol) {
                      const target = resolveModuleTarget(
                        currentFilePath,
                        innerStr,
                        files
                      );
                      if (target) {
                        e.event.preventDefault();
                        e.event.stopPropagation();
                        handleOpenFile(target.targetPath, {
                          lineNumber: 1,
                          column: 1,
                        });
                        return;
                      }
                    }
                  }

                  // 2. Check if clicking on an identifier, JSX tag, or local variable
                  const word = model.getWordAtPosition(pos);
                  if (word) {
                    const symbolName = word.word;
                    const fullContent = model.getValue();

                    // A. If clicking on an HTML JSX tag (e.g. <input, <button, <form)
                    if (
                      isJsxTagAtPosition(lineContent, word.startColumn) &&
                      /^[a-z]+$/.test(symbolName)
                    ) {
                      const reactTarget = resolveModuleTarget(
                        currentFilePath,
                        'react',
                        files
                      );
                      if (reactTarget) {
                        const loc = findSymbolLocationInContent(
                          reactTarget.content,
                          symbolName
                        );
                        e.event.preventDefault();
                        e.event.stopPropagation();
                        handleOpenFile(reactTarget.targetPath, {
                          lineNumber: loc?.lineNumber || 1,
                          column: loc?.column || 1,
                        });
                        return;
                      }
                    }

                    // B. If clicking on an imported symbol
                    const importMap = parseImportMap(fullContent);
                    const imported = importMap.get(symbolName);
                    if (imported) {
                      const target = resolveModuleTarget(
                        currentFilePath,
                        imported.moduleSpecifier,
                        files
                      );
                      if (target) {
                        const loc = findSymbolLocationInContent(
                          target.content,
                          symbolName
                        );
                        e.event.preventDefault();
                        e.event.stopPropagation();
                        handleOpenFile(target.targetPath, {
                          lineNumber: loc?.lineNumber || 1,
                          column: loc?.column || 1,
                        });
                        return;
                      }
                    }

                    // C. If clicking on a local variable / function in the current file
                    const localLoc = findLocalSymbolLocation(
                      fullContent,
                      symbolName
                    );
                    if (localLoc) {
                      e.event.preventDefault();
                      e.event.stopPropagation();
                      if (currentFilePath === activeFileRef.current) {
                        pendingPositionRef.current = null;
                        editor.setPosition({
                          lineNumber: localLoc.lineNumber,
                          column: localLoc.column,
                        });
                        editor.revealPositionInCenter({
                          lineNumber: localLoc.lineNumber,
                          column: localLoc.column,
                        });
                        editor.focus();
                      } else {
                        handleOpenFile(currentFilePath, {
                          lineNumber: localLoc.lineNumber,
                          column: localLoc.column,
                        });
                      }
                      return;
                    }
                  }
                }
              });
            }}
            beforeMount={(monaco) => {
              registerMonacoThemes(monaco);
              setupTypeScript(monaco);
              syncVfsToMonacoTypeScript(monaco, allFilesRef.current);
              const snippetsDisposer = registerReactSnippets(monaco);
              const importDisposer = registerImportCompletion(
                monaco,
                () => allFilesRef.current
              );
              const defDisposer = registerDefinitionProvider(
                monaco,
                () => allFilesRef.current,
                handleOpenFile
              );
              languageDisposersRef.current = [
                snippetsDisposer,
                importDisposer,
                defDisposer,
              ];
              emmetJSX(monaco, ['javascript', 'typescript', 'jsx', 'tsx']);
              emmetCSS(monaco, ['css', 'scss', 'sass', 'less']);
              emmetHTML(monaco, ['html']);
            }}
            options={{
              fontSize,
              fontFamily:
                "'JetBrains Mono', 'Fira Code', 'Cascadia Code', Menlo, Monaco, Consolas, monospace",
              fontLigatures: true,
              lineHeight: 22,
              renderLineHighlight: 'all',
              cursorBlinking: 'smooth',
              cursorSmoothCaretAnimation: 'on',
              automaticLayout: true,
              minimap: { enabled: false },
              padding: { top: 10, bottom: 10 },
              scrollbar: {
                verticalScrollbarSize: 8,
                horizontalScrollbarSize: 8,
              },
              tabSize: 2,
              wordWrap: 'off',
              bracketPairColorization: { enabled: true },
              guides: {
                bracketPairs: true,
                indentation: true,
              },
              quickSuggestions: {
                other: true,
                comments: false,
                strings: true,
              },
              suggestOnTriggerCharacters: true,
              acceptSuggestionOnEnter: 'on',
              acceptSuggestionOnCommitCharacter: true,
              tabCompletion: 'on',
              wordBasedSuggestions: 'matchingDocuments',
              parameterHints: { enabled: true },
              renderValidationDecorations: 'on',
              glyphMargin: true,
              lightbulb: { enabled: 'on' as any },
              hover: { enabled: 'on' as any, delay: 200 },
            }}
          />
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-[var(--text-muted)] select-none">
            <Code2 className="w-10 h-10 mb-2 opacity-40" />
            <p className="text-sm font-medium">No file is currently open</p>
            <p className="text-xs mt-1">
              Select a file from the explorer on the left
            </p>
          </div>
        )}
      </div>

      {/* Tab Context Menu */}
      {tabContextMenu && (
        <ContextMenu
          x={tabContextMenu.x}
          y={tabContextMenu.y}
          items={tabContextMenu.items}
          onClose={() => setTabContextMenu(null)}
        />
      )}
    </div>
  );
}
