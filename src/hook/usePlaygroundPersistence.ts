import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router';
import { v4 as uuidv4 } from 'uuid';
import { UserCodeBase } from '../utils/interface';
import { addCode, updateCode, getCode } from '../db/operations';

export interface UsePlaygroundPersistenceOptions {
  id?: string;
  type: 'js' | 'ts' | 'react' | 'html';
  initialName?: string;
  getCurrentData: () => Partial<UserCodeBase>;
  onSaved?: (doc: UserCodeBase) => void;
  disabled?: boolean;
}

export function getDefaultPlaygroundName(
  type: 'js' | 'ts' | 'react' | 'html'
): string {
  switch (type) {
    case 'js':
      return 'JavaScript Playground';
    case 'ts':
      return 'TypeScript Playground';
    case 'react':
      return 'React Playground';
    case 'html':
      return 'HTML Playground';
    default:
      return 'Code Playground';
  }
}

export function normalizePlaygroundType(
  raw?: string
): 'js' | 'ts' | 'react' | 'html' | null {
  if (!raw) return null;
  const lower = raw.toLowerCase().trim();
  if (lower.startsWith('react')) return 'react';
  if (lower.startsWith('ts') || lower.startsWith('typescript')) return 'ts';
  if (lower.startsWith('html')) return 'html';
  if (lower.startsWith('js') || lower.startsWith('javascript')) return 'js';
  return null;
}

export function usePlaygroundPersistence({
  id,
  type,
  initialName,
  getCurrentData,
  onSaved,
  disabled = false,
}: UsePlaygroundPersistenceOptions) {
  const navigate = useNavigate();
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const isSavingRef = useRef(false);
  const statusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [saveStatus, setSaveStatus] = useState<
    'idle' | 'saving' | 'saved' | 'unsaved'
  >('idle');
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [isSaveCopyModalOpen, setIsSaveCopyModalOpen] = useState(false);

  const isSaved = Boolean(id);
  const defaultName = initialName || getDefaultPlaygroundName(type);

  // Platform shortcut text
  const isMac =
    typeof window !== 'undefined' &&
    /Mac|iPod|iPhone|iPad/.test(navigator.userAgent);
  const shortcutText = isMac ? '⌘S' : 'Ctrl+S';

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (statusTimerRef.current) {
        clearTimeout(statusTimerRef.current);
      }
    };
  }, []);

  const setTemporarySaveStatus = useCallback(
    (status: 'idle' | 'saving' | 'saved' | 'unsaved', timeoutMs = 2500) => {
      if (statusTimerRef.current) {
        clearTimeout(statusTimerRef.current);
        statusTimerRef.current = null;
      }
      setSaveStatus(status);
      if (status !== 'idle' && status !== 'saving') {
        statusTimerRef.current = setTimeout(() => {
          setSaveStatus('idle');
          statusTimerRef.current = null;
        }, timeoutMs);
      }
    },
    []
  );

  // Keep references to latest callbacks to avoid stale closures in event listeners
  const getCurrentDataRef = useRef(getCurrentData);
  useEffect(() => {
    getCurrentDataRef.current = getCurrentData;
  }, [getCurrentData]);

  const onSavedRef = useRef(onSaved);
  useEffect(() => {
    onSavedRef.current = onSaved;
  }, [onSaved]);

  const openSaveModal = useCallback(() => setIsSaveModalOpen(true), []);
  const closeSaveModal = useCallback(() => setIsSaveModalOpen(false), []);

  const openSaveCopyModal = useCallback(() => setIsSaveCopyModalOpen(true), []);
  const closeSaveCopyModal = useCallback(
    () => setIsSaveCopyModalOpen(false),
    []
  );

  // Save changes to an existing saved playground
  const saveExisting = useCallback(async (): Promise<void> => {
    if (!id || isSavingRef.current) return;
    isSavingRef.current = true;
    setIsSaving(true);
    setSaveStatus('saving');
    try {
      const currentData = getCurrentDataRef.current();
      const existing = await getCode(id);

      const updatedPayload: UserCodeBase = {
        id,
        fileName: existing?.fileName || defaultName,
        language: type,
        createdAt: existing?.createdAt || new Date(),
        lastModifiedAt: new Date(),
        isDelete: existing?.isDelete ?? false,
        star: existing?.star ?? 0,
        tag: existing?.tag ?? type,
        dbUpload: false,
        code: currentData.code ?? existing?.code ?? '',
        htmlCode: currentData.htmlCode ?? existing?.htmlCode ?? '',
        cssCode: currentData.cssCode ?? existing?.cssCode ?? '',
        jsCode: currentData.jsCode ?? existing?.jsCode ?? '',
        files: currentData.files ?? existing?.files,
        activeFile: currentData.activeFile ?? existing?.activeFile,
        openFiles: currentData.openFiles ?? existing?.openFiles,
        template: currentData.template ?? existing?.template,
      };

      await updateCode(id, updatedPayload);
      setIsDirty(false);
      setTemporarySaveStatus('saved');
      if (onSavedRef.current) {
        onSavedRef.current(updatedPayload);
      }
    } catch (err) {
      console.error('Failed to update playground in IndexedDB', err);
      setTemporarySaveStatus('idle');
    } finally {
      isSavingRef.current = false;
      setIsSaving(false);
    }
  }, [id, defaultName, type, setTemporarySaveStatus]);

  // Save new playground (from unsaved route)
  const confirmSaveNew = useCallback(
    async (name: string): Promise<string> => {
      if (isSavingRef.current) return '';
      isSavingRef.current = true;
      setIsSaving(true);
      setSaveStatus('saving');
      try {
        const newId = uuidv4();
        const currentData = getCurrentDataRef.current();

        const newPlayground: UserCodeBase = {
          id: newId,
          fileName: name.trim() || defaultName,
          language: type,
          createdAt: new Date(),
          lastModifiedAt: new Date(),
          isDelete: false,
          star: 0,
          tag: type,
          dbUpload: false,
          code: currentData.code ?? '',
          htmlCode: currentData.htmlCode ?? '',
          cssCode: currentData.cssCode ?? '',
          jsCode: currentData.jsCode ?? '',
          files: currentData.files,
          activeFile: currentData.activeFile,
          openFiles: currentData.openFiles,
          template: currentData.template,
        };

        await addCode(newPlayground);
        setIsDirty(false);
        setTemporarySaveStatus('saved');
        setIsSaveModalOpen(false);

        if (onSavedRef.current) {
          onSavedRef.current(newPlayground);
        }

        // Navigate to the saved playground URL
        navigate(`/${type}/${newId}`);
        return newId;
      } catch (err) {
        console.error('Failed to create playground in IndexedDB', err);
        setTemporarySaveStatus('idle');
        throw err;
      } finally {
        isSavingRef.current = false;
        setIsSaving(false);
      }
    },
    [defaultName, type, navigate, setTemporarySaveStatus]
  );

  // Save a copy of an existing playground
  const confirmSaveCopy = useCallback(
    async (copyName: string): Promise<string> => {
      if (isSavingRef.current) return '';
      isSavingRef.current = true;
      setIsSaving(true);
      setSaveStatus('saving');
      try {
        const copyId = uuidv4();
        const currentData = getCurrentDataRef.current();
        const existing = id ? await getCode(id) : null;

        const newPlayground: UserCodeBase = {
          id: copyId,
          fileName: copyName.trim() || `${defaultName} (Copy)`,
          language: type,
          createdAt: new Date(),
          lastModifiedAt: new Date(),
          isDelete: false,
          star: 0,
          tag: existing?.tag || type,
          dbUpload: false,
          code: currentData.code ?? existing?.code ?? '',
          htmlCode: currentData.htmlCode ?? existing?.htmlCode ?? '',
          cssCode: currentData.cssCode ?? existing?.cssCode ?? '',
          jsCode: currentData.jsCode ?? existing?.jsCode ?? '',
          files: currentData.files ?? existing?.files,
          activeFile: currentData.activeFile ?? existing?.activeFile,
          openFiles: currentData.openFiles ?? existing?.openFiles,
          template: currentData.template ?? existing?.template,
        };

        await addCode(newPlayground);
        setIsDirty(false);
        setTemporarySaveStatus('saved');
        setIsSaveCopyModalOpen(false);

        if (onSavedRef.current) {
          onSavedRef.current(newPlayground);
        }

        navigate(`/${type}/${copyId}`);
        return copyId;
      } catch (err) {
        console.error('Failed to save copy of playground', err);
        setTemporarySaveStatus('idle');
        throw err;
      } finally {
        isSavingRef.current = false;
        setIsSaving(false);
      }
    },
    [defaultName, type, id, navigate, setTemporarySaveStatus]
  );

  // Unified save trigger (button click or Cmd+S)
  const triggerSave = useCallback(async () => {
    if (disabled || isSaving || isSavingRef.current) return;

    if (!id) {
      // Unsaved playground: open modal to get playground name
      openSaveModal();
    } else {
      // Existing saved playground: update record directly
      await saveExisting();
    }
  }, [id, disabled, isSaving, openSaveModal, saveExisting]);

  // Keep triggerSave reference for keyboard listener
  const triggerSaveRef = useRef(triggerSave);
  useEffect(() => {
    triggerSaveRef.current = triggerSave;
  }, [triggerSave]);

  // Global keyboard shortcut listener for Cmd+S / Ctrl+S
  useEffect(() => {
    if (disabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const isCmdOrCtrl = e.metaKey || e.ctrlKey;
      if (!isCmdOrCtrl || e.altKey) return;

      const isS = e.key === 's' || e.key === 'S';
      if (!isS) return;

      const isNormalSave = !e.shiftKey;
      const isSaveCopy = e.shiftKey;

      // Always prevent browser default "Save page as"
      e.preventDefault();

      // Check if user is typing into a form input (like search or save modal input)
      const target = e.target as HTMLElement | null;
      if (target) {
        const isFormInput =
          target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable;

        // If inside a form input that is NOT monaco editor, avoid triggering secondary save modal
        if (isFormInput && !target.closest('.monaco-editor')) {
          return;
        }
      }

      // If save modal is already open, do not re-trigger
      if (isSaveModalOpen || isSaveCopyModalOpen) {
        return;
      }

      if (isSaveCopy && id) {
        openSaveCopyModal();
      } else if (isNormalSave) {
        triggerSaveRef.current?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => {
      window.removeEventListener('keydown', handleKeyDown, { capture: true });
    };
  }, [disabled, isSaveModalOpen, isSaveCopyModalOpen, id, openSaveCopyModal]);

  return {
    isSaved,
    isDirty,
    setIsDirty,
    isSaving,
    saveStatus,
    shortcutText,
    isSaveModalOpen,
    isSaveCopyModalOpen,
    defaultName,
    openSaveModal,
    closeSaveModal,
    openSaveCopyModal,
    closeSaveCopyModal,
    triggerSave,
    confirmSaveNew,
    confirmSaveCopy,
  };
}
