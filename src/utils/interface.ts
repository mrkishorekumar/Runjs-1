import type { OnChange } from '@monaco-editor/react';

export type ConsoleMethods = 'log' | 'info' | 'warn' | 'error';

export interface UserCodeBase {
  code: string;
  htmlCode: string;
  cssCode: string;
  jsCode: string;
  createdAt: Date;
  fileName: string;
  isDelete: boolean;
  language: 'js' | 'ts' | 'html' | 'react';
  lastModifiedAt: Date;
  star: number;
  tag: string;
  id: string;
  dbUpload: boolean;
  files?: Record<string, string>;
  activeFile?: string;
  openFiles?: string[];
  template?: string;
}

export interface TaggedResult {
  tag: string;
  count: number;
  searchTerm: string;
  setSearchTerm: React.Dispatch<React.SetStateAction<string>>;
}

export interface ModalRef {
  open: () => void;
  close: () => void;
}

export interface Tag {
  [key: string]: number;
}

export type BuiltinTheme = 'vs' | 'vs-dark' | 'hc-black' | 'hc-light';

export interface CustomIStandaloneThemeData {
  base: BuiltinTheme;
  inherit: boolean;
  rules: ITokenThemeRule[];
  encodedTokensColors?: string[];
  colors: IColors;
}

export type IColors = {
  [colorId: string]: string;
};

export interface ITokenThemeRule {
  token: string;
  foreground?: string;
  background?: string;
  fontStyle?: string;
}

export interface ITypeScriptError {
  message: string;
  code?: string | number;
  startLineNumber: number;
  startColumn: number;
  endLineNumber: number;
  endColumn: number;
  severity: 'error' | 'warning' | 'info';
}

export interface HtmlPlaygroundProject {
  id?: string;
  html: string;
  css: string;
  javascript: string;
  fileName?: string;
  tag?: string;
  settings: {
    autoRun: boolean;
    fontSize: number;
    theme?: string;
  };
}

export interface ICodeEditor {
  code: string;
  language: 'javascript' | 'typescript' | 'html' | 'css';
  onChange: OnChange;
  currentFontSize: number;
  /* eslint-disable  @typescript-eslint/no-explicit-any */
  editorRef: React.RefObject<any>;
  disableAutoSuggestion?: boolean;
  path?: string;
  /* eslint-disable  @typescript-eslint/no-explicit-any */
  onValidate?: (markers: any[]) => void;
}

export interface IAppLoading {
  freeLoading?: boolean;
}

export interface IModalProps {
  tagSuggestions: string[];
  edit: boolean;
  renameData?: UserCodeBase;
  dbcall?: () => Promise<void>;
  ref?: React.Ref<ModalRef>;
}

export interface IProjectTable {
  data: UserCodeBase[];
  bin: boolean;
  createPlayground?: () => void;
  dbcall: () => Promise<void>;
  tagSuggestions: string[];
  isLoading?: boolean;
}

export interface ISearchInput {
  showFavourite: boolean;
  isFavouriteSelected: boolean;
  dialogRef: React.RefObject<ModalRef | null>;
  onInputChange: (e: string) => void;
  searchTerm: string;
  setIsFavouriteSelected: React.Dispatch<React.SetStateAction<boolean>>;
}

export interface ITerminal {
  consoleRef: React.RefObject<HTMLDivElement | null>;
  clearTerminal: () => void;
  language?: 'javascript' | 'typescript';
  tsErrors?: ITypeScriptError[];
  onErrorClick?: (error: ITypeScriptError) => void;
  activeTab?: 'console' | 'tsErrors';
  onTabChange?: (tab: 'console' | 'tsErrors') => void;
}

export type AnswerBlockType = 'para' | 'heading' | 'points' | 'code';
export interface AnswerBlock {
  type: AnswerBlockType;
  data: string[];
}

export type InterviewCategory =
  'All' | 'JavaScript' | 'React' | 'TypeScript' | 'Node.js' | 'Architecture';

export type QuestionCategory = Exclude<InterviewCategory, 'All'>;

export type InterviewDifficulty = 'easy' | 'medium' | 'hard';
export type InterviewMasteryStatus = 'unreviewed' | 'review' | 'mastered';
export type InterviewMasteryMap = Record<
  number,
  Exclude<InterviewMasteryStatus, 'unreviewed'>
>;
export type InterviewBookmarkMap = Record<number, boolean>;

export interface JSInterviewQuestion {
  id?: number;
  question: string;
  category?: QuestionCategory;
  difficulty?: InterviewDifficulty;
  tags?: string[];
  tip?: string;
  answer: AnswerBlock[];
}

export type JSInterviewQuestionList = JSInterviewQuestion[];

export interface IQuestionAccordion {
  data: JSInterviewQuestion;
  questionNumber: number;
  isOpened: boolean;
  changeActiveQuestion: () => void;
  isMastered?: boolean;
  isBookmarked?: boolean;
  onToggleMastered?: () => void;
  onToggleBookmark?: () => void;
}
