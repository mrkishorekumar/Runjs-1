import React, { useState, useEffect, useCallback, useRef } from 'react';
import { VirtualFileSystem } from '../fs/VirtualFileSystem';
import { TEMPLATES, VITE_REACT_TEMPLATE } from '../templates/defaultTemplates';
import { UserCodeBase } from '../../utils/interface';
import { getCode, updateCode, addCode } from '../../db/operations';
import { normalizePath } from '../fs/pathUtils';
import { v4 as uuidv4 } from 'uuid';
import useLocalStorageState from '../../hook/useLocalStorageState';
import { WorkspaceContext } from './workspaceTypes';
import { getAllPackageVirtualFiles } from '../languages/typescript/packageDefinitions';
import { prepareSandpackFiles } from './sandpackAdapter';
import {
  DRAFT_STORAGE_PREFIX,
  WorkspaceDraft,
  createWorkspaceDraft,
  restoreDraftMergedFiles,
} from './workspaceDraft';

interface WorkspaceProviderProps {
  initialProjectId?: string;
  onNotFound?: () => void;
  children: React.ReactNode;
}

export function WorkspaceProvider({
  initialProjectId,
  onNotFound,
  children,
}: WorkspaceProviderProps) {
  const effectiveProjectId = initialProjectId || 'default-react-workspace';
  const draftKey = `${DRAFT_STORAGE_PREFIX}${effectiveProjectId}`;

  const [projectId, setProjectId] = useState(effectiveProjectId);
  const [projectName, setProjectName] = useState('React App');
  const [projectTag, setProjectTag] = useState('react');
  const [templateId, setTemplateId] = useState('vite-react');
  const [activeFile, setActiveFileState] = useState('/src/App.jsx');
  const [openFiles, setOpenFiles] = useState<string[]>([
    '/src/App.jsx',
    '/src/App.css',
    '/package.json',
  ]);
  const [dirtyFiles, setDirtyFiles] = useState<Set<string>>(new Set());
  const [fileContents, setFileContents] = useState<Record<string, string>>({});
  const [sandpackFiles, setSandpackFiles] = useState<Record<string, string>>(
    () => prepareSandpackFiles(VITE_REACT_TEMPLATE.files, 'vite-react')
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Layout states
  const [isExplorerOpen, setIsExplorerOpen] = useState(true);
  const [isTerminalOpen, setIsTerminalOpen] = useState(true);
  const [isConsoleOpen, setIsConsoleOpen] = useState(true);

  // Font size sync
  const [currentFontSize, setFontSizeState] = useLocalStorageState(
    'fontSize',
    '14'
  );
  const fontSize = Number(currentFontSize) || 14;

  const vfsRef = useRef<VirtualFileSystem | null>(null);
  if (!vfsRef.current) {
    vfsRef.current = new VirtualFileSystem(VITE_REACT_TEMPLATE.files);
  }
  const vfs = vfsRef.current;

  // Sync VFS + active editor contents to sandpackFiles for runtime bundler
  const syncSandpackFiles = useCallback(
    async (fileOverrides?: Record<string, string>) => {
      const vfsJson = await vfs.toJSON();
      const mergedWithEditor = {
        ...vfsJson,
        ...fileContents,
        ...(fileOverrides || {}),
      };

      const prepared = prepareSandpackFiles(mergedWithEditor, templateId);
      setSandpackFiles(prepared);
      return prepared;
    },
    [vfs, fileContents, templateId]
  );

  // Helper to persist current VFS state to IndexedDB
  const persistToDatabase = useCallback(
    async (currentVfsFiles: Record<string, string>) => {
      // Unsaved scratchpads (/react) should only persist to localStorage drafts, never to IndexedDB!
      if (!initialProjectId) return;

      try {
        const mainCode =
          currentVfsFiles['/src/App.jsx'] ||
          currentVfsFiles['/src/App.tsx'] ||
          currentVfsFiles['/src/main.jsx'] ||
          currentVfsFiles['/src/main.tsx'] ||
          '';

        const existing = await getCode(projectId);

        const payload: UserCodeBase = {
          id: projectId,
          fileName: projectName,
          tag: projectTag,
          language: 'react',
          template: templateId,
          code: mainCode,
          htmlCode: currentVfsFiles['/index.html'] || '',
          cssCode:
            currentVfsFiles['/src/App.css'] ||
            currentVfsFiles['/src/index.css'] ||
            '',
          jsCode: mainCode,
          createdAt: existing?.createdAt || new Date(),
          lastModifiedAt: new Date(),
          isDelete: false,
          star: existing?.star ?? 0,
          dbUpload: false,
          files: currentVfsFiles,
          activeFile,
          openFiles,
        };

        if (existing) {
          await updateCode(projectId, payload);
        } else {
          await addCode(payload);
        }
      } catch (err) {
        console.error('Failed to persist project to IndexedDB:', err);
      }
    },
    [
      initialProjectId,
      projectId,
      projectName,
      projectTag,
      activeFile,
      openFiles,
    ]
  );

  // Dual-tier Workspace Loading on mount (Draft Storage -> IndexedDB -> Default Template)
  useEffect(() => {
    let isCancelled = false;

    async function loadWorkspace() {
      setIsLoading(true);
      try {
        // Tier 1: Check for working draft in localStorage
        try {
          const rawDraft = localStorage.getItem(draftKey);
          if (rawDraft) {
            const draft: WorkspaceDraft = JSON.parse(rawDraft);
            if (
              draft &&
              draft.vfsFiles &&
              Object.keys(draft.vfsFiles).length > 0 &&
              !isCancelled
            ) {
              await vfs.fromJSON(draft.vfsFiles);
              setProjectId(draft.projectId || effectiveProjectId);
              setProjectName(draft.projectName || 'React App');
              setProjectTag(draft.projectTag || 'react');
              const tpl = draft.templateId || 'vite-react';
              setTemplateId(tpl);
              setOpenFiles(draft.openFiles || VITE_REACT_TEMPLATE.openFiles);
              setActiveFileState(
                draft.activeFile || VITE_REACT_TEMPLATE.activeFile
              );

              if (
                draft.fileContents &&
                typeof draft.fileContents === 'object'
              ) {
                setFileContents(draft.fileContents);
              }
              if (Array.isArray(draft.dirtyFiles)) {
                setDirtyFiles(new Set(draft.dirtyFiles));
              }

              const merged = restoreDraftMergedFiles(draft);
              const prepared = prepareSandpackFiles(merged, tpl);
              setSandpackFiles(prepared);
              return;
            }
          }
        } catch (e) {
          console.warn('Failed to restore from workspace draft storage:', e);
        }

        // Tier 2: Check IndexedDB (for initialProjectId or saved default workspace)
        try {
          const dbCode = await getCode(effectiveProjectId);
          if (dbCode && !dbCode.isDelete && !isCancelled) {
            setProjectId(dbCode.id);
            setProjectName(dbCode.fileName || 'React App');
            setProjectTag(dbCode.tag || 'react');

            if (dbCode.files && Object.keys(dbCode.files).length > 0) {
              await vfs.fromJSON(dbCode.files);
              setOpenFiles(
                dbCode.openFiles || [
                  '/src/App.jsx',
                  '/src/App.css',
                  '/package.json',
                ]
              );
              setActiveFileState(dbCode.activeFile || '/src/App.jsx');
              const detectedTpl = dbCode.files['/src/App.tsx']
                ? 'vite-react-ts'
                : 'vite-react';
              setTemplateId(detectedTpl);
              setDirtyFiles(new Set());
              setFileContents({});
              const prepared = prepareSandpackFiles(dbCode.files, detectedTpl);
              setSandpackFiles(prepared);
              return;
            } else if (dbCode.code) {
              const template = { ...VITE_REACT_TEMPLATE.files };
              template['/src/App.jsx'] = dbCode.code;
              await vfs.fromJSON(template);
              setTemplateId('vite-react');
              setDirtyFiles(new Set());
              setFileContents({});
              const prepared = prepareSandpackFiles(template, 'vite-react');
              setSandpackFiles(prepared);
              return;
            }
          }
        } catch (e) {
          console.error('Failed to load project from IndexedDB:', e);
        }

        // If an initialProjectId was requested but not found in draft or IndexedDB, trigger not found
        if (initialProjectId && !isCancelled) {
          onNotFound?.();
          return;
        }

        // Tier 3: Fresh Default Template (for /react scratchpad)
        if (!isCancelled) {
          await vfs.fromJSON(VITE_REACT_TEMPLATE.files);
          setOpenFiles(VITE_REACT_TEMPLATE.openFiles);
          setActiveFileState(VITE_REACT_TEMPLATE.activeFile);
          setTemplateId('vite-react');
          setDirtyFiles(new Set());
          setFileContents({});
          const prepared = prepareSandpackFiles(
            VITE_REACT_TEMPLATE.files,
            'vite-react'
          );
          setSandpackFiles(prepared);
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    loadWorkspace();

    return () => {
      isCancelled = true;
    };
  }, [initialProjectId, onNotFound, effectiveProjectId, draftKey, vfs]);

  // Debounced draft persistence to localStorage
  useEffect(() => {
    if (isLoading) return;

    const timer = setTimeout(async () => {
      try {
        const rawVfsFiles = await vfs.toJSON();
        const draft = createWorkspaceDraft({
          projectId,
          projectName,
          projectTag,
          templateId,
          activeFile,
          openFiles,
          dirtyFiles,
          fileContents,
          rawVfsFiles,
        });
        try {
          localStorage.setItem(draftKey, JSON.stringify(draft));
        } catch (e: unknown) {
          const err = e as { name?: string; code?: number };
          if (
            err?.name === 'QuotaExceededError' ||
            err?.code === 22 ||
            err?.code === 1014
          ) {
            console.error(
              'LocalStorage quota exceeded while persisting workspace draft:',
              e
            );
          } else {
            console.warn('Failed to persist draft to localStorage:', e);
          }
        }
      } catch (e) {
        console.warn('Failed to prepare workspace draft:', e);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [
    isLoading,
    draftKey,
    projectId,
    projectName,
    projectTag,
    templateId,
    activeFile,
    openFiles,
    dirtyFiles,
    fileContents,
    vfs,
  ]);

  // Read current active file content whenever active file or VFS updates
  useEffect(() => {
    async function loadActiveContent() {
      if (!activeFile || dirtyFiles.has(activeFile)) return;
      if (fileContents[activeFile] !== undefined) return;
      if (activeFile.startsWith('/node_modules/')) {
        const pkgFiles = getAllPackageVirtualFiles();
        if (pkgFiles[activeFile]) {
          setFileContents((prev) => ({
            ...prev,
            [activeFile]: pkgFiles[activeFile],
          }));
          return;
        }
      }
      if (await vfs.exists(activeFile)) {
        const content = await vfs.readFile(activeFile);
        setFileContents((prev) =>
          prev[activeFile] === content
            ? prev
            : { ...prev, [activeFile]: content }
        );
      }
    }
    loadActiveContent();
  }, [activeFile, vfs, dirtyFiles, fileContents]);

  // Subscribe to external VFS modifications (e.g. from PackageManager / Terminal)
  useEffect(() => {
    let syncTimer: ReturnType<typeof setTimeout> | null = null;
    const unsub = vfs.on('*', (event) => {
      if (event.path === activeFile && event.content !== undefined) {
        setFileContents((prev) => ({ ...prev, [event.path]: event.content! }));
      }

      if (syncTimer) clearTimeout(syncTimer);
      syncTimer = setTimeout(async () => {
        await syncSandpackFiles();
      }, 50);
    });

    return () => {
      if (syncTimer) clearTimeout(syncTimer);
      unsub();
    };
  }, [vfs, activeFile, syncSandpackFiles]);

  const setActiveFile = useCallback((path: string) => {
    const norm = normalizePath(path);
    setActiveFileState(norm);
    setOpenFiles((prev) => (prev.includes(norm) ? prev : [...prev, norm]));
  }, []);

  const openFile = useCallback(
    (path: string) => {
      setActiveFile(path);
    },
    [setActiveFile]
  );

  const closeFile = useCallback(
    (path: string) => {
      const norm = normalizePath(path);
      let nextActive: string | null = null;

      setOpenFiles((prev) => {
        const next = prev.filter((p) => p !== norm);
        if (activeFile === norm) {
          const idx = prev.indexOf(norm);
          nextActive = next[idx] || next[idx - 1] || '';
        }
        return next;
      });

      if (nextActive !== null) {
        setActiveFileState(nextActive);
      }

      setDirtyFiles((prev) => {
        const next = new Set(prev);
        next.delete(norm);
        return next;
      });
    },
    [activeFile]
  );

  const closeOtherFiles = useCallback((keepPath: string) => {
    const norm = normalizePath(keepPath);
    setOpenFiles([norm]);
    setActiveFileState(norm);
    setDirtyFiles((prev) => {
      const next = new Set<string>();
      if (prev.has(norm)) next.add(norm);
      return next;
    });
  }, []);

  const closeAllFiles = useCallback(() => {
    setOpenFiles([]);
    setActiveFileState('');
    setDirtyFiles(new Set());
  }, []);

  // Update file content as user types in Monaco
  const updateFileContent = useCallback((path: string, content: string) => {
    const norm = normalizePath(path);
    if (norm.startsWith('/node_modules/')) return;
    setFileContents((prev) => ({ ...prev, [norm]: content }));
    setDirtyFiles((prev) => new Set(prev).add(norm));
  }, []);

  // Save a single file: commits to VFS, saves to DB, and instantly updates Sandpack preview
  const saveFile = useCallback(
    async (path: string) => {
      const norm = normalizePath(path);
      if (norm.startsWith('/node_modules/')) return;
      const content = fileContents[norm];
      if (content !== undefined) {
        await vfs.writeFile(norm, content);
        setDirtyFiles((prev) => {
          const next = new Set(prev);
          next.delete(norm);
          return next;
        });

        const vfsJson = await vfs.toJSON();
        vfsJson[norm] = content;

        // Instantly push to Sandpack preview
        await syncSandpackFiles({ [norm]: content });

        // Persist to IndexedDB
        await persistToDatabase(vfsJson);
      }
    },
    [fileContents, vfs, syncSandpackFiles, persistToDatabase]
  );

  // Save entire project: commits all dirty files to VFS, saves to DB, and instantly updates preview
  const saveProject = useCallback(async () => {
    setIsSaving(true);
    try {
      // Save all dirty files into VFS
      for (const dirtyPath of dirtyFiles) {
        if (dirtyPath.startsWith('/node_modules/')) continue;
        const content = fileContents[dirtyPath];
        if (content !== undefined) {
          await vfs.writeFile(dirtyPath, content);
        }
      }
      setDirtyFiles(new Set());

      const allFiles = await vfs.toJSON();

      // Instantly push to Sandpack preview
      await syncSandpackFiles();

      // Persist to IndexedDB
      await persistToDatabase(allFiles);

      // Update draft in localStorage
      const draft: WorkspaceDraft = {
        projectId,
        projectName,
        projectTag,
        templateId,
        activeFile,
        openFiles,
        dirtyFiles: [],
        fileContents,
        vfsFiles: allFiles,
        updatedAt: Date.now(),
      };
      localStorage.setItem(draftKey, JSON.stringify(draft));
    } catch (e) {
      console.error('Failed to save project:', e);
    } finally {
      setIsSaving(false);
    }
  }, [
    dirtyFiles,
    fileContents,
    vfs,
    syncSandpackFiles,
    persistToDatabase,
    projectId,
    projectName,
    projectTag,
    templateId,
    activeFile,
    openFiles,
    draftKey,
  ]);

  const saveProjectAs = useCallback(
    async (name: string, overrideId?: string): Promise<string> => {
      setIsSaving(true);
      try {
        for (const dirtyPath of dirtyFiles) {
          if (dirtyPath.startsWith('/node_modules/')) continue;
          const content = fileContents[dirtyPath];
          if (content !== undefined) {
            await vfs.writeFile(dirtyPath, content);
          }
        }
        setDirtyFiles(new Set());

        const allFiles = await vfs.toJSON();
        const mainCode =
          allFiles['/src/App.jsx'] ||
          allFiles['/src/App.tsx'] ||
          allFiles['/src/main.jsx'] ||
          allFiles['/src/main.tsx'] ||
          '';

        const targetId = overrideId || uuidv4();
        const cleanName = name.trim() || 'React Playground';

        const payload: UserCodeBase = {
          id: targetId,
          fileName: cleanName,
          tag: projectTag || 'react',
          language: 'react',
          template: templateId,
          code: mainCode,
          htmlCode: allFiles['/index.html'] || '',
          cssCode: allFiles['/src/App.css'] || allFiles['/src/index.css'] || '',
          jsCode: mainCode,
          createdAt: new Date(),
          lastModifiedAt: new Date(),
          isDelete: false,
          star: 0,
          dbUpload: false,
          files: allFiles,
          activeFile,
          openFiles,
        };

        await addCode(payload);
        setProjectId(targetId);
        setProjectName(cleanName);

        const draft: WorkspaceDraft = {
          projectId: targetId,
          projectName: cleanName,
          projectTag,
          templateId,
          activeFile,
          openFiles,
          dirtyFiles: [],
          fileContents,
          vfsFiles: allFiles,
          updatedAt: Date.now(),
        };
        localStorage.setItem(
          `${DRAFT_STORAGE_PREFIX}${targetId}`,
          JSON.stringify(draft)
        );

        await syncSandpackFiles();
        return targetId;
      } finally {
        setIsSaving(false);
      }
    },
    [
      dirtyFiles,
      fileContents,
      vfs,
      projectTag,
      templateId,
      activeFile,
      openFiles,
      syncSandpackFiles,
    ]
  );

  const saveProjectAsCopy = useCallback(
    async (copyName: string): Promise<string> => {
      return saveProjectAs(copyName);
    },
    [saveProjectAs]
  );

  const switchTemplate = useCallback(
    async (newTemplateId: string) => {
      const template =
        TEMPLATES.find((t) => t.id === newTemplateId) || VITE_REACT_TEMPLATE;
      await vfs.fromJSON(template.files);
      setOpenFiles(template.openFiles);
      setActiveFileState(template.activeFile);
      setTemplateId(template.id);
      setDirtyFiles(new Set());
      setFileContents({});

      await syncSandpackFiles(template.files);

      // Clear previous draft and update DB
      localStorage.removeItem(draftKey);
      await persistToDatabase(template.files);
    },
    [vfs, draftKey, syncSandpackFiles, persistToDatabase]
  );

  const resetWorkspace = useCallback(async () => {
    await vfs.fromJSON(VITE_REACT_TEMPLATE.files);
    setProjectName('React App');
    setProjectTag('react');
    setOpenFiles(VITE_REACT_TEMPLATE.openFiles);
    setActiveFileState(VITE_REACT_TEMPLATE.activeFile);
    setTemplateId('vite-react');
    setDirtyFiles(new Set());
    setFileContents({});

    await syncSandpackFiles(VITE_REACT_TEMPLATE.files);

    localStorage.removeItem(draftKey);
    await persistToDatabase(VITE_REACT_TEMPLATE.files);
  }, [vfs, draftKey, syncSandpackFiles, persistToDatabase]);

  const handleFileDeleted = useCallback(
    (path: string) => {
      const norm = normalizePath(path);
      closeFile(norm);
    },
    [closeFile]
  );

  const handleFileRenamed = useCallback(
    (oldPath: string, newPath: string) => {
      const normOld = normalizePath(oldPath);
      const normNew = normalizePath(newPath);

      setOpenFiles((prev) => prev.map((p) => (p === normOld ? normNew : p)));
      if (activeFile === normOld) {
        setActiveFileState(normNew);
      }
      setDirtyFiles((prev) => {
        const next = new Set(prev);
        if (next.has(normOld)) {
          next.delete(normOld);
          next.add(normNew);
        }
        return next;
      });
      setFileContents((prev) => {
        if (prev[normOld] !== undefined) {
          const next = { ...prev, [normNew]: prev[normOld] };
          delete next[normOld];
          return next;
        }
        return prev;
      });
    },
    [activeFile]
  );

  const setFontSize = (size: number) => {
    setFontSizeState(size.toString());
  };

  const toggleExplorer = () => setIsExplorerOpen((prev) => !prev);
  const toggleTerminal = () => setIsTerminalOpen((prev) => !prev);
  const toggleConsole = () => setIsConsoleOpen((prev) => !prev);

  return (
    <WorkspaceContext.Provider
      value={{
        vfs,
        projectId,
        projectName,
        projectTag,
        templateId,
        activeFile,
        openFiles,
        dirtyFiles,
        fileContents,
        isSaving,
        isSaved: Boolean(initialProjectId),
        isLoading,
        fontSize,
        isExplorerOpen,
        isTerminalOpen,
        isConsoleOpen,
        sandpackFiles,
        syncSandpackFiles,
        setActiveFile,
        openFile,
        closeFile,
        closeOtherFiles,
        closeAllFiles,
        updateFileContent,
        saveFile,
        saveProject,
        saveProjectAs,
        saveProjectAsCopy,
        setProjectName,
        setProjectTag,
        switchTemplate,
        resetWorkspace,
        toggleExplorer,
        toggleTerminal,
        toggleConsole,
        setFontSize,
        handleFileDeleted,
        handleFileRenamed,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}
