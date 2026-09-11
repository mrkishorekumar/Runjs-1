/* eslint-disable  @typescript-eslint/no-explicit-any */
export type Difficulty = 'easy' | 'medium' | 'hard';

export interface ProblemExample {
  input: string;
  output: string;
  explanation?: string;
}

export interface TestCase {
  id?: string;
  name?: string;
  input: any[];
  expected: any;
  explanation?: string;
  isHidden?: boolean;
  isCustom?: boolean;
}

export interface ProblemSolution {
  explanation: string;
  code: string;
  complexity: {
    time: string;
    space: string;
  };
}

export interface Problem {
  id: string;
  slug: string;
  title: string;
  difficulty: Difficulty;
  topics: string[];
  acceptanceRate: string;
  description: string;
  examples: ProblemExample[];
  constraints: string[];
  starterCode: {
    javascript: string;
    typescript?: string;
  };
  functionName: string;
  isClass?: boolean;
  isPolyfill?: boolean;
  polyfillTarget?: string;
  isAsync?: boolean;
  testCases: TestCase[];
  hiddenTestCases?: TestCase[];
  hints?: string[];
  solution?: ProblemSolution;
}

export interface TestResult {
  testCaseIndex: number;
  name?: string;
  passed: boolean;
  input: any[];
  expected: any;
  actual: any;
  runtimeMs: number;
  logs: string[];
  error?: string;
  isHidden?: boolean;
}

export type VerdictStatus =
  'accepted' | 'wrong_answer' | 'runtime_error' | 'time_limit_exceeded';

export interface SubmissionResult {
  id: string;
  problemSlug: string;
  status: VerdictStatus;
  totalCases: number;
  passedCases: number;
  runtimeMs: number;
  memoryMB?: number;
  failedCase?: TestResult;
  allResults: TestResult[];
  timestamp: string;
  code: string;
  language: 'javascript' | 'typescript';
}

export interface UserProblemState {
  code: string;
  language?: 'javascript' | 'typescript';
  isSolved: boolean;
  isStarred: boolean;
  lastAttemptedAt?: string;
  lastSolvedAt?: string;
  submissions: SubmissionResult[];
}

export type ProblemFilterStatus = 'all' | 'unsolved' | 'solved' | 'starred';

export interface ProblemFilterOptions {
  search: string;
  difficulty: 'all' | Difficulty;
  topic: string;
  status: ProblemFilterStatus;
  sortBy?: 'id' | 'title' | 'difficulty' | 'acceptance';
  sortOrder?: 'asc' | 'desc';
}
