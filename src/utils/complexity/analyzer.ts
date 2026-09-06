import {
  safeParseAST,
  AnyNode,
  getFunctionParamNames,
  inspectCallExpression,
} from './astUtils';
import { analyzeLoops } from './loopAnalyzer';
import { analyzeRecursion } from './recursionAnalyzer';
import { analyzeSpace } from './spaceAnalyzer';
import {
  ComplexityRank,
  ComplexityResult,
  ComplexityFactor,
  ComplexityString,
  COMPLEXITY_LABELS,
} from './types';

function analyzeBuiltins(ast: AnyNode): {
  builtinTimeRank: ComplexityRank;
  builtinFactors: ComplexityFactor[];
  topLevelBuiltins: string[];
} {
  const topLevelBuiltins: string[] = [];
  let builtinTimeRank: ComplexityRank = ComplexityRank.O_1;
  const builtinFactors: ComplexityFactor[] = [];

  const checkBuiltins = (n: unknown) => {
    if (!n || typeof n !== 'object') return;
    const node = n as AnyNode;

    if (node.type === 'CallExpression') {
      const callInfo = inspectCallExpression(node);
      if (callInfo) {
        topLevelBuiltins.push(callInfo.name);
        if (callInfo.timeComplexity === 'O(n log n)') {
          if (builtinTimeRank < ComplexityRank.O_N_LOG_N) {
            builtinTimeRank = ComplexityRank.O_N_LOG_N;
          }
          builtinFactors.push({
            type: 'builtin',
            description: `Built-in '${callInfo.name}()' uses comparison-based sorting running in O(n log n) time`,
            impact: 'time',
            order: 'O(n log n)',
            line: callInfo.line,
          });
        } else if (callInfo.timeComplexity === 'O(n)') {
          if (builtinTimeRank < ComplexityRank.O_N) {
            builtinTimeRank = ComplexityRank.O_N;
          }
          builtinFactors.push({
            type: 'builtin',
            description: `Built-in '${callInfo.name}()' iterates over collection elements in O(n) time`,
            impact: 'time',
            order: 'O(n)',
            line: callInfo.line,
          });
        }
      }
    }

    if (node.type === 'NewExpression') {
      const callee = node.callee as AnyNode;
      if (
        callee &&
        callee.type === 'Identifier' &&
        ['Set', 'Map'].includes(callee.name as string) &&
        ((node.arguments as AnyNode[]) || []).length > 0
      ) {
        topLevelBuiltins.push(`new ${callee.name}(...)`);
        if (builtinTimeRank < ComplexityRank.O_N) {
          builtinTimeRank = ComplexityRank.O_N;
        }
        builtinFactors.push({
          type: 'builtin',
          description: `Constructor 'new ${callee.name}(...)' iterates over input elements in O(n) time`,
          impact: 'time',
          order: 'O(n)',
        });
      }
    }

    if (node.type === 'SpreadElement') {
      if (builtinTimeRank < ComplexityRank.O_N) {
        builtinTimeRank = ComplexityRank.O_N;
      }
      builtinFactors.push({
        type: 'builtin',
        description:
          'Spread syntax expands every element of the collection, taking O(n) time',
        impact: 'time',
        order: 'O(n)',
      });
    }

    for (const [k, v] of Object.entries(node)) {
      if (k === 'loc' || k === 'range') continue;
      if (Array.isArray(v)) {
        for (const item of v) checkBuiltins(item);
      } else {
        checkBuiltins(v);
      }
    }
  };

  checkBuiltins(ast);
  return { builtinTimeRank, builtinFactors, topLevelBuiltins };
}

export function analyzeComplexity(code: string): ComplexityResult {
  const parseRes = safeParseAST(code);

  if (!parseRes.success || !parseRes.ast) {
    return {
      success: false,
      timeComplexity: 'O(?)',
      spaceComplexity: 'O(?)',
      timeRank: ComplexityRank.UNKNOWN,
      spaceRank: ComplexityRank.UNKNOWN,
      timeClassification: parseRes.errorLine ? 'Syntax Error' : 'No Input',
      spaceClassification: parseRes.errorLine ? 'Syntax Error' : 'No Input',
      explanation: parseRes.errorLine
        ? `Unable to analyze code due to a syntax error on line ${parseRes.errorLine}: ${parseRes.error}. Please ensure your code is valid JavaScript syntax.`
        : (parseRes.error ?? 'Unable to analyze the provided code.'),
      factors: [],
      isEstimate: false,
      notes: [
        'Static analysis requires valid JavaScript code without syntax errors.',
      ],
      suggestions: [
        'Check for missing parentheses, brackets, or semicolons.',
        'Ensure all variable and function declarations are syntactically well-formed.',
      ],
      error: parseRes.error,
      errorLine: parseRes.errorLine,
    };
  }

  const ast = parseRes.ast;

  // 1. Gather all function parameter names across the program
  const inputNames = new Set<string>([
    'n',
    'nums',
    'arr',
    's',
    'str',
    'matrix',
    'grid',
    'head',
    'root',
    'target',
    'k',
    'items',
    'list',
    'data',
    'values',
  ]);

  const findParams = (n: unknown) => {
    if (!n || typeof n !== 'object') return;
    const node = n as AnyNode;
    if (
      node.type === 'FunctionDeclaration' ||
      node.type === 'FunctionExpression' ||
      node.type === 'ArrowFunctionExpression'
    ) {
      const pNames = getFunctionParamNames(node);
      pNames.forEach((p) => inputNames.add(p));
    }
    for (const [k, v] of Object.entries(node)) {
      if (k === 'loc' || k === 'range') continue;
      if (Array.isArray(v)) {
        for (const item of v) findParams(item);
      } else {
        findParams(v);
      }
    }
  };
  findParams(ast);

  // 2. Analyze Recursion
  const recResult = analyzeRecursion(ast);

  // 3. Analyze Loops
  const loopResult = analyzeLoops(ast, inputNames);

  // 4. Analyze Built-in operations at top level / outside loops
  const { builtinTimeRank, builtinFactors, topLevelBuiltins } =
    analyzeBuiltins(ast);

  // 5. Analyze Space Complexity
  const spaceResult = analyzeSpace(ast, recResult.spaceRank);

  // 6. Combine Time Complexity
  const timeRank = Math.max(
    loopResult.timeRank,
    recResult.timeRank,
    builtinTimeRank
  ) as ComplexityRank;

  const spaceRank = spaceResult.spaceRank;

  const timeLabelInfo =
    COMPLEXITY_LABELS[timeRank] || COMPLEXITY_LABELS[ComplexityRank.O_1];
  const spaceLabelInfo =
    COMPLEXITY_LABELS[spaceRank] || COMPLEXITY_LABELS[ComplexityRank.O_1];

  // 7. Compile Factors
  const factors: ComplexityFactor[] = [
    ...loopResult.factors,
    ...recResult.factors,
    ...builtinFactors,
    ...spaceResult.factors,
  ];

  // Deduplicate factors by description
  const uniqueFactors: ComplexityFactor[] = [];
  const seenDesc = new Set<string>();
  for (const f of factors) {
    if (!seenDesc.has(f.description)) {
      seenDesc.add(f.description);
      uniqueFactors.push(f);
    }
  }

  // 8. If empty factors (e.g. basic constant arithmetic)
  if (uniqueFactors.length === 0 && timeRank === ComplexityRank.O_1) {
    uniqueFactors.push({
      type: 'constant',
      description:
        'The code performs a fixed sequence of basic arithmetic and variable assignments',
      impact: 'time',
      order: 'O(1)',
    });
    uniqueFactors.push({
      type: 'constant',
      description:
        'No additional dynamic memory or recursion call stack is required',
      impact: 'space',
      order: 'O(1)',
    });
  }

  // 9. Generate Human-Friendly Explanation
  const explanationParts: string[] = [];

  // Time explanation
  if (recResult.hasRecursion) {
    const rec = recResult.recursions[0];
    explanationParts.push(
      rec.explanation ||
        `Detected recursive function '${rec.functionName}'. The function calls itself, creating a call stack depth of up to n.`
    );
  } else if (
    timeRank === ComplexityRank.O_N_3 &&
    loopResult.maxNestingDepth >= 3
  ) {
    explanationParts.push(
      `The code contains ${loopResult.maxNestingDepth} levels of nested loops that depend on the input size. Because each nested layer multiplies iterations, the total number of operations grows as n³, resulting in cubic time complexity ${timeLabelInfo.notation}.`
    );
  } else if (
    timeRank === ComplexityRank.O_N_2 &&
    loopResult.maxNestingDepth === 2
  ) {
    explanationParts.push(
      `The code contains two nested loops that both depend on the input size. Because each iteration of the outer loop executes the inner loop, the total number of operations grows approximately as n × n, yielding ${timeLabelInfo.notation} time complexity.`
    );
  } else if (timeRank === ComplexityRank.O_N_LOG_N) {
    if (builtinTimeRank === ComplexityRank.O_N_LOG_N) {
      explanationParts.push(
        `The algorithm relies on sorting operations (e.g. Array.prototype.sort). Standard JavaScript engines use Timsort which executes in O(n log n) time.`
      );
    } else {
      explanationParts.push(
        `The code combines a linear traversal with logarithmic reductions (e.g. divide-and-conquer), producing an overall time complexity of O(n log n).`
      );
    }
  } else if (timeRank === ComplexityRank.O_LOG_N) {
    explanationParts.push(
      `The algorithm divides the problem or search space in half with each iteration (such as in binary search), running in logarithmic time O(log n).`
    );
  } else if (timeRank === ComplexityRank.O_N) {
    if (loopResult.totalLoopsCount > 1) {
      explanationParts.push(
        `The code executes ${loopResult.totalLoopsCount} sequential loops. Since the loops run one after another rather than nested, the operations add together (O(n) + O(n)), retaining an overall linear time complexity of O(n).`
      );
    } else {
      explanationParts.push(
        `The code contains a single loop or linear method iterating directly through the input data, executing in linear time O(n).`
      );
    }
  } else {
    explanationParts.push(
      `The code contains no unbounded loops, recursion, or linear-time methods. All operations execute in constant time O(1).`
    );
  }

  // Space explanation
  if (recResult.hasRecursion) {
    const rec = recResult.recursions[0];
    explanationParts.push(
      `For memory usage, each recursive invocation pushes a new stack frame. With a maximum depth of ${rec.spaceComplexity === 'O(log n)' ? 'log n' : 'n'}, the call stack requires ${rec.spaceComplexity} auxiliary space.`
    );
  } else if (spaceRank === ComplexityRank.O_N_2) {
    explanationParts.push(
      `The code allocates a 2D matrix or nested collections of size n × n, resulting in quadratic space complexity O(n²).`
    );
  } else if (spaceRank === ComplexityRank.O_N) {
    explanationParts.push(
      `The algorithm allocates auxiliary data structures (such as arrays, Maps, or Sets) that scale linearly with the input size, yielding O(n) space complexity.`
    );
  } else {
    explanationParts.push(
      `The algorithm only uses a fixed number of primitive variables and pointers, maintaining a constant space complexity of O(1).`
    );
  }

  const explanation = explanationParts.join('\n\n');

  // 10. Suggestions
  const suggestions: string[] = [];

  if (loopResult.builtinsInsideLoops.length > 0) {
    suggestions.push(
      `Calling '${loopResult.builtinsInsideLoops[0]}()' inside a loop results in an O(n²) bottleneck. Consider using a Set or Map for O(1) lookups instead.`
    );
  }

  if (timeRank >= ComplexityRank.O_N_2 && !recResult.hasRecursion) {
    suggestions.push(
      'Nested loops can often be optimized to O(n) using a hash table (Map/Set) or two-pointer technique.'
    );
  }

  if (recResult.hasRecursion && timeRank >= ComplexityRank.O_2_N) {
    suggestions.push(
      'Exponential recursion can be optimized to O(n) using memoization (caching results) or dynamic programming.'
    );
  }

  if (spaceRank >= ComplexityRank.O_N && timeRank >= ComplexityRank.O_N) {
    suggestions.push(
      'If memory is constrained, check if the algorithm can be solved in-place to achieve O(1) auxiliary space.'
    );
  }

  const hasWhileNode = (() => {
    let found = false;
    const visit = (node: unknown) => {
      if (found || !node || typeof node !== 'object') return;
      const n = node as AnyNode;
      if (n.type === 'WhileStatement' || n.type === 'DoWhileStatement') {
        found = true;
        return;
      }
      for (const [k, v] of Object.entries(n)) {
        if (k === 'loc' || k === 'range') continue;
        if (Array.isArray(v)) v.forEach(visit);
        else visit(v);
      }
    };
    visit(ast);
    return found;
  })();

  const isEstimate =
    loopResult.maxNestingDepth === 0 &&
    !recResult.hasRecursion &&
    builtinTimeRank === ComplexityRank.O_1 &&
    hasWhileNode;

  const notes: string[] = [
    'Static complexity analysis is estimated from the AST structure and common algorithmic patterns without executing arbitrary code.',
  ];
  if (isEstimate) {
    notes.push(
      'The exact complexity cannot be fully determined statically because dynamic while-loop conditions depend on runtime state.'
    );
  }

  let finalTimeComplexity: ComplexityString = timeLabelInfo.notation;
  let finalSpaceComplexity: ComplexityString = spaceLabelInfo.notation;

  if (recResult.hasRecursion && recResult.timeRank === timeRank) {
    const recOrder = recResult.recursions[0].timeComplexity;
    if (recOrder) {
      finalTimeComplexity = recOrder as ComplexityString;
    }
  }

  const RANK_BY_ORDER: Record<string, ComplexityRank> = {
    'O(log log n)': ComplexityRank.O_LOG_LOG_N,
    'O((log n)²)': ComplexityRank.O_LOG_N_2,
    'O(sqrt(n))': ComplexityRank.O_SQRT_N,
    'O(n sqrt(n))': ComplexityRank.O_N_SQRT_N,
    'O(n * 2^n)': ComplexityRank.O_2_N,
    'O(n + m)': ComplexityRank.O_N,
    'O(n * m)': ComplexityRank.O_N_2,
  };
  const specificLoopFactor = loopResult.factors.find(
    (f) => f.impact === 'time' && RANK_BY_ORDER[f.order] === timeRank
  );
  if (specificLoopFactor && loopResult.timeRank === timeRank) {
    finalTimeComplexity = specificLoopFactor.order;
  }

  if (recResult.hasRecursion && recResult.spaceRank === spaceRank) {
    const recSpace = recResult.recursions[0].spaceComplexity;
    if (
      recSpace &&
      (recSpace.includes('!') ||
        recSpace.includes('^') ||
        recSpace.includes('²'))
    ) {
      finalSpaceComplexity = recSpace as ComplexityString;
    }
  } else {
    if (
      finalTimeComplexity === 'O(n * m)' &&
      spaceRank === ComplexityRank.O_N_2
    ) {
      finalSpaceComplexity = 'O(n * m)';
    } else {
      const specificSpaceFactor =
        factors.find((f) => f.impact === 'space' && f.order === 'O(n * n!)') ||
        factors.find((f) => f.impact === 'space' && f.order === 'O(n * 2^n)') ||
        factors.find((f) => f.impact === 'space' && f.order === 'O(n²)');

      if (specificSpaceFactor && spaceRank >= ComplexityRank.O_N_2) {
        finalSpaceComplexity = specificSpaceFactor.order;
      }
    }
  }

  return {
    success: true,
    timeComplexity: finalTimeComplexity,
    spaceComplexity: finalSpaceComplexity,
    timeRank,
    spaceRank,
    timeClassification: `${timeLabelInfo.label} Time`,
    spaceClassification: `${spaceLabelInfo.label} Space`,
    explanation,
    factors: uniqueFactors,
    isEstimate,
    notes,
    suggestions,
    details: {
      loopsCount: loopResult.totalLoopsCount,
      maxNestingDepth: loopResult.maxNestingDepth,
      hasRecursion: recResult.hasRecursion,
      recursionType: recResult.hasRecursion
        ? recResult.recursions[0].isHalvingArg
          ? 'divide_and_conquer'
          : recResult.recursions[0].callSitesCount >= 2
            ? 'multiple'
            : 'linear'
        : undefined,
      dataStructuresCreated: spaceResult.dataStructuresCreated,
      builtinsDetected: Array.from(
        new Set([...topLevelBuiltins, ...loopResult.builtinsInsideLoops])
      ),
    },
  };
}
