import { createContext } from 'react';
import { FileSystem } from '../fs/FileSystem';

export interface WorkspaceContextType {
  vfs: FileSystem;
  projectId: string;
  projectName: string;
  projectTag: string;
  templateId: string;
  activeFile: string;
  openFiles: string[];
  dirtyFiles: Set<string>;
  fileContents: Record<string, string>;
  isSaving: boolean;
  isSaved: boolean;
  isLoading: boolean;
  fontSize: number;
  isExplorerOpen: boolean;
  isTerminalOpen: boolean;
  isConsoleOpen: boolean;
  sandpackFiles: Record<string, string>;
  syncSandpackFiles: (
    fileOverrides?: Record<string, string>
  ) => Promise<Record<string, string>>;
  setActiveFile: (path: string) => void;
  openFile: (path: string) => void;
  closeFile: (path: string) => void;
  closeOtherFiles: (path: string) => void;
  closeAllFiles: () => void;
  updateFileContent: (path: string, content: string) => void;
  saveFile: (path: string) => Promise<void>;
  saveProject: () => Promise<void>;
  saveProjectAs: (name: string, overrideId?: string) => Promise<string>;
  saveProjectAsCopy: (copyName: string) => Promise<string>;
  setProjectName: (name: string) => void;
  setProjectTag: (tag: string) => void;
  switchTemplate: (templateId: string) => Promise<void>;
  resetWorkspace: () => Promise<void>;
  toggleExplorer: () => void;
  toggleTerminal: () => void;
  toggleConsole: () => void;
  setFontSize: (size: number) => void;
  handleFileDeleted: (path: string) => void;
  handleFileRenamed: (oldPath: string, newPath: string) => void;
}

export const WorkspaceContext = createContext<WorkspaceContextType | null>(
  null
);
