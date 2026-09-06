export enum ComplexityRank {
  UNKNOWN = 0,
  O_1 = 1, // Constant
  O_LOG_LOG_N = 2, // Double Logarithmic O(log log n)
  O_LOG_N = 3, // Logarithmic O(log n)
  O_LOG_N_2 = 4, // Log-squared O((log n)²)
  O_SQRT_N = 5, // Square root O(sqrt(n))
  O_N = 6, // Linear O(n)
  O_N_LOG_N = 7, // Linearithmic O(n log n)
  O_N_SQRT_N = 8, // Fractional power O(n sqrt(n))
  O_N_2 = 9, // Quadratic O(n²) or O(n * m)
  O_N_3 = 10, // Cubic O(n³)
  O_2_N = 11, // Exponential O(2ⁿ), O(3ⁿ), O(n * 2ⁿ)
  O_N_FACT = 12, // Factorial O(n!), O(n * n!)
}

export type ComplexityString =
  | 'O(1)'
  | 'O(log log n)'
  | 'O(log n)'
  | 'O((log n)²)'
  | 'O((log n)^2)'
  | 'O(sqrt(n))'
  | 'O(n)'
  | 'O(n + m)'
  | 'O(n sqrt(n))'
  | 'O(n log n)'
  | 'O(n²)'
  | 'O(n * m)'
  | 'O(n³)'
  | 'O(2ⁿ)'
  | 'O(3ⁿ)'
  | 'O(n * 2ⁿ)'
  | 'O(n * 2^n)'
  | 'O(n^log2(3))'
  | 'O(n!)'
  | 'O(n * n!)'
  | 'O(?)'
  | string;

export interface ComplexityFactor {
  type:
    | 'loop'
    | 'nested_loop'
    | 'sequential_loop'
    | 'recursion'
    | 'builtin'
    | 'data_structure'
    | 'input_dependency'
    | 'constant';
  description: string;
  impact: 'time' | 'space' | 'both';
  order: ComplexityString;
  line?: number;
}

export interface ComplexityResult {
  success: boolean;
  timeComplexity: ComplexityString;
  spaceComplexity: ComplexityString;
  timeRank: ComplexityRank;
  spaceRank: ComplexityRank;
  timeClassification: string;
  spaceClassification: string;
  explanation: string;
  factors: ComplexityFactor[];
  isEstimate: boolean;
  notes: string[];
  suggestions: string[];
  error?: string;
  errorLine?: number;
  details?: {
    loopsCount: number;
    maxNestingDepth: number;
    hasRecursion: boolean;
    recursionType?: 'linear' | 'multiple' | 'divide_and_conquer';
    dataStructuresCreated: string[];
    builtinsDetected: string[];
  };
}

export const COMPLEXITY_LABELS: Record<
  ComplexityRank,
  { notation: ComplexityString; label: string; color: string }
> = {
  [ComplexityRank.UNKNOWN]: {
    notation: 'O(?)',
    label: 'Indeterminate',
    color: 'amber',
  },
  [ComplexityRank.O_1]: {
    notation: 'O(1)',
    label: 'Constant',
    color: 'emerald',
  },
  [ComplexityRank.O_LOG_LOG_N]: {
    notation: 'O(log log n)',
    label: 'Double Logarithmic',
    color: 'emerald',
  },
  [ComplexityRank.O_LOG_N]: {
    notation: 'O(log n)',
    label: 'Logarithmic',
    color: 'emerald',
  },
  [ComplexityRank.O_LOG_N_2]: {
    notation: 'O((log n)²)',
    label: 'Log-Squared',
    color: 'emerald',
  },
  [ComplexityRank.O_SQRT_N]: {
    notation: 'O(sqrt(n))',
    label: 'Square Root',
    color: 'blue',
  },
  [ComplexityRank.O_N]: {
    notation: 'O(n)',
    label: 'Linear',
    color: 'blue',
  },
  [ComplexityRank.O_N_LOG_N]: {
    notation: 'O(n log n)',
    label: 'Linearithmic',
    color: 'amber',
  },
  [ComplexityRank.O_N_SQRT_N]: {
    notation: 'O(n sqrt(n))',
    label: 'Fractional Power',
    color: 'amber',
  },
  [ComplexityRank.O_N_2]: {
    notation: 'O(n²)',
    label: 'Quadratic',
    color: 'rose',
  },
  [ComplexityRank.O_N_3]: {
    notation: 'O(n³)',
    label: 'Cubic',
    color: 'rose',
  },
  [ComplexityRank.O_2_N]: {
    notation: 'O(2ⁿ)',
    label: 'Exponential',
    color: 'purple',
  },
  [ComplexityRank.O_N_FACT]: {
    notation: 'O(n!)',
    label: 'Factorial',
    color: 'purple',
  },
};
