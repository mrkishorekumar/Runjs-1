import {
  AnyNode,
  isFunctionNode,
  isLoopNode,
  isConstantBound,
  inspectCallExpression,
} from './astUtils';
import { ComplexityFactor, ComplexityRank } from './types';

export interface RecursionInfo {
  functionName: string;
  callSitesCount: number;
  isInsideLoop: boolean;
  isHalvingArg: boolean;
  timeRank: ComplexityRank;
  spaceRank: ComplexityRank;
  timeComplexity: string;
  spaceComplexity: string;
  explanation: string;
  line?: number;
}

export interface RecursionAnalysisResult {
  hasRecursion: boolean;
  recursions: RecursionInfo[];
  timeRank: ComplexityRank;
  spaceRank: ComplexityRank;
  factors: ComplexityFactor[];
}

export function analyzeRecursion(ast: AnyNode): RecursionAnalysisResult {
  const recursions: RecursionInfo[] = [];
  const factors: ComplexityFactor[] = [];

  // 1. Find all named functions
  const functionsToAnalyze: { name: string; node: AnyNode; line?: number }[] =
    [];

  const findFunctions = (curr: unknown) => {
    if (!curr || typeof curr !== 'object') return;
    const n = curr as AnyNode;

    const idNode = n.id as AnyNode | undefined;

    if (
      n.type === 'FunctionDeclaration' &&
      idNode &&
      typeof idNode.name === 'string'
    ) {
      const line = n.loc
        ? (n.loc as { start: { line: number } }).start.line
        : undefined;
      functionsToAnalyze.push({ name: idNode.name, node: n, line });
    } else if (
      n.type === 'VariableDeclarator' &&
      idNode &&
      typeof idNode.name === 'string'
    ) {
      if (n.init && isFunctionNode(n.init as AnyNode)) {
        const line = n.loc
          ? (n.loc as { start: { line: number } }).start.line
          : undefined;
        functionsToAnalyze.push({
          name: idNode.name,
          node: n.init as AnyNode,
          line,
        });
      }
    }

    for (const [k, v] of Object.entries(n)) {
      if (k === 'loc' || k === 'range') continue;
      if (Array.isArray(v)) {
        for (const item of v) findFunctions(item);
      } else {
        findFunctions(v);
      }
    }
  };

  findFunctions(ast);

  // 2. Check each function for recursive calls to itself
  for (const { name, node, line } of functionsToAnalyze) {
    const callSites: {
      node: AnyNode;
      isInsideLoop: boolean;
      isHalving: boolean;
    }[] = [];

    const inspectBody = (curr: unknown, loopDepth: number) => {
      if (!curr || typeof curr !== 'object') return;
      const n = curr as AnyNode;

      const isLoop = isLoopNode(n);
      const currentDepth = isLoop ? loopDepth + 1 : loopDepth;

      if (n.type === 'CallExpression') {
        const callee = n.callee as AnyNode;
        if (callee && callee.type === 'Identifier' && callee.name === name) {
          const isHalving = checkIfCallHalvesInput(n);
          callSites.push({
            node: n,
            isInsideLoop: currentDepth > 0,
            isHalving,
          });
        }
      }

      for (const [k, v] of Object.entries(n)) {
        if (k === 'loc' || k === 'range') continue;
        if (Array.isArray(v)) {
          for (const item of v) inspectBody(item, currentDepth);
        } else {
          inspectBody(v, currentDepth);
        }
      }
    };

    const body = (node.body as AnyNode) || node;
    inspectBody(body, 0);

    if (callSites.length > 0) {
      const isInsideLoop = callSites.some((c) => c.isInsideLoop);
      const isHalvingArg = callSites.some((c) => c.isHalving);
      const callNodes = callSites.map((c) => c.node);
      const callCount = callSites.length;
      const canMultipleCallsExecute = checkCanMultipleCallsExecute(
        callNodes,
        body
      );

      let timeRank = ComplexityRank.O_N;
      let spaceRank = ComplexityRank.O_N;
      let timeComplexity = 'O(n)';
      let spaceComplexity = 'O(n)';
      let explanation = '';

      if (isPermutationGeneration(node, name)) {
        // e.g. permute(arr)
        timeRank = ComplexityRank.O_N_FACT;
        spaceRank = ComplexityRank.O_N_FACT;
        timeComplexity = 'O(n * n!)';
        spaceComplexity = 'O(n * n!)';
        explanation = `Function '${name}' generates permutations recursively, computing n! permutations of length n in O(n * n!) time and space.`;
      } else if (isFactorialRecursionInsideLoop(node, name)) {
        // e.g. mystery(n) calling mystery(n - 1) inside a loop from 0 to n
        timeRank = ComplexityRank.O_N_FACT;
        spaceRank = ComplexityRank.O_N;
        timeComplexity = 'O(n!)';
        spaceComplexity = 'O(n)';
        explanation = `Function '${name}' makes recursive calls inside a loop of size n (T(n) = n·T(n-1)), resulting in factorial O(n!) time complexity and O(n) call stack space.`;
      } else if (isRecursiveArrayGeneration(node, name)) {
        // e.g. generate(n) duplicating previous subsets: O(n * 2^n)
        timeRank = ComplexityRank.O_2_N;
        spaceRank = ComplexityRank.O_2_N;
        timeComplexity = 'O(n * 2^n)';
        spaceComplexity = 'O(n * 2^n)';
        explanation = `Function '${name}' generates 2ⁿ subsets recursively and copies elements of size up to n, requiring O(n * 2^n) time and space.`;
      } else if (hasMemoization(node)) {
        // e.g. fibonacci_memoized
        timeRank = ComplexityRank.O_N;
        spaceRank = ComplexityRank.O_N;
        timeComplexity = 'O(n)';
        spaceComplexity = 'O(n)';
        explanation = `Function '${name}' uses memoization to cache subproblem results; each state is evaluated once in O(n) time with O(n) auxiliary space.`;
      } else if (isTreeTraversal(callNodes)) {
        // e.g. dfs(node.left) and dfs(node.right)
        timeRank = ComplexityRank.O_N;
        spaceRank = ComplexityRank.O_N;
        timeComplexity = 'O(n)';
        spaceComplexity = 'O(n)';
        explanation = `Function '${name}' performs a tree traversal visiting all n nodes in O(n) time, with call stack space bounded by the tree height O(h).`;
      } else if (isQuickSortPattern(callNodes)) {
        // e.g. quickSort(arr)
        timeRank = ComplexityRank.O_N_2;
        spaceRank = ComplexityRank.O_N;
        timeComplexity = 'O(n²)';
        spaceComplexity = 'O(n)';
        explanation = `Function '${name}' implements QuickSort with simple partitioning, requiring O(n²) time in the worst case (O(n log n) average) and O(n) space.`;
      } else if (
        !canMultipleCallsExecute &&
        checkIfCallSlicesInput(callSites[0].node)
      ) {
        // e.g. sum(arr.slice(1))
        timeRank = ComplexityRank.O_N_2;
        spaceRank = ComplexityRank.O_N_2;
        timeComplexity = 'O(n²)';
        spaceComplexity = 'O(n²)';
        explanation = `Function '${name}' creates a new array via slice() on every recursive frame across n calls, multiplying time and space to O(n²).`;
      } else if (isInsideLoop) {
        // General backtracking in loops
        timeRank = ComplexityRank.O_2_N;
        spaceRank = ComplexityRank.O_N;
        timeComplexity = 'O(2ⁿ)';
        spaceComplexity = 'O(n)';
        explanation = `Function '${name}' makes recursive calls inside a loop, yielding exponential O(2ⁿ) time and O(n) call stack depth.`;
      } else if (canMultipleCallsExecute) {
        if (isHalvingArg) {
          if (callCount === 3) {
            // T(n) = 3T(n/2) + O(1) => O(n^log2(3))
            timeRank = ComplexityRank.O_N_SQRT_N;
            spaceRank = ComplexityRank.O_LOG_N;
            timeComplexity = 'O(n^log2(3))';
            spaceComplexity = 'O(log n)';
            explanation = `Function '${name}' branches 3 times on halved input sizes (T(n) = 3T(n/2) + O(1)), yielding O(n^log2(3)) time and O(log n) stack space.`;
          } else {
            const hasLinearWork = checkIfFunctionHasLinearWork(body);
            if (hasLinearWork) {
              // e.g. MergeSort: T(n) = 2T(n/2) + O(n) => O(n log n)
              timeRank = ComplexityRank.O_N_LOG_N;
              spaceRank = ComplexityRank.O_N;
              timeComplexity = 'O(n log n)';
              spaceComplexity = 'O(n)';
              explanation = `Function '${name}' exhibits divide-and-conquer recursion with linear work per level (e.g. merge/slice), running in O(n log n) time and requiring O(n) space.`;
            } else {
              // e.g. Recursive binary splitting: T(n) = 2T(n/2) + O(1) => O(n)
              timeRank = ComplexityRank.O_N;
              spaceRank = ComplexityRank.O_LOG_N;
              timeComplexity = 'O(n)';
              spaceComplexity = 'O(log n)';
              explanation = `Function '${name}' exhibits recursive binary splitting with constant work per node (T(n) = 2T(n/2) + O(1)), executing in O(n) time with O(log n) call stack space.`;
            }
          }
        } else {
          // Non-halving branching: Fibonacci, 3^n, etc.
          if (callCount >= 3) {
            timeRank = ComplexityRank.O_2_N;
            spaceRank = ComplexityRank.O_N;
            timeComplexity = 'O(3ⁿ)';
            spaceComplexity = 'O(n)';
            explanation = `Function '${name}' branches 3 times per frame with linear reduction (T(n) = 3T(n-1)), yielding exponential O(3ⁿ) time and O(n) call stack depth.`;
          } else {
            timeRank = ComplexityRank.O_2_N;
            spaceRank = ComplexityRank.O_N;
            timeComplexity = 'O(2ⁿ)';
            spaceComplexity = 'O(n)';
            explanation = `Function '${name}' branches into multiple recursive calls per invocation without memoization, resulting in exponential O(2ⁿ) time complexity and O(n) maximum call stack depth.`;
          }
        }
      } else {
        // At most one recursive call executes per invocation
        if (isHalvingArg) {
          timeRank = ComplexityRank.O_LOG_N;
          spaceRank = ComplexityRank.O_LOG_N;
          timeComplexity = 'O(log n)';
          spaceComplexity = 'O(log n)';
          explanation = `Function '${name}' uses logarithmic recursion by halving the search space per call on each execution branch, requiring O(log n) time and O(log n) call stack space.`;
        } else {
          timeRank = ComplexityRank.O_N;
          spaceRank = ComplexityRank.O_N;
          timeComplexity = 'O(n)';
          spaceComplexity = 'O(n)';
          explanation = `Function '${name}' makes a single recursive call per step with linear reduction, producing a call stack depth of up to n and O(n) time.`;
        }
      }

      recursions.push({
        functionName: name,
        callSitesCount: callCount,
        isInsideLoop,
        isHalvingArg,
        timeRank,
        spaceRank,
        timeComplexity,
        spaceComplexity,
        explanation,
        line,
      });

      factors.push({
        type: 'recursion',
        description: `Recursive function '${name}()' detected (${timeComplexity} time, ${spaceComplexity} call stack space)`,
        impact: 'both',
        order: timeComplexity,
        line,
      });
    }
  }

  // Determine highest rank among recursions
  let maxTimeRank = ComplexityRank.O_1;
  let maxSpaceRank = ComplexityRank.O_1;

  for (const rec of recursions) {
    if (rec.timeRank > maxTimeRank) maxTimeRank = rec.timeRank;
    if (rec.spaceRank > maxSpaceRank) maxSpaceRank = rec.spaceRank;
  }

  return {
    hasRecursion: recursions.length > 0,
    recursions,
    timeRank: maxTimeRank,
    spaceRank: maxSpaceRank,
    factors,
  };
}

/**
 * Checks if a recursive call expression passes halved arguments (e.g. n / 2, mid - 1, mid + 1, Math.floor, or arr.slice(0, mid)).
 */
function checkIfCallHalvesInput(callNode: AnyNode): boolean {
  const args = (callNode.arguments as AnyNode[]) || [];

  for (const arg of args) {
    if (
      arg.type === 'BinaryExpression' &&
      (arg.operator === '/' || arg.operator === '>>')
    ) {
      return true;
    }
    if (arg.type === 'CallExpression') {
      const callee = arg.callee as AnyNode;
      if (callee && callee.type === 'MemberExpression') {
        const propName = (callee.property as AnyNode)?.name as string;
        if (['floor', 'trunc', 'round', 'ceil'].includes(propName)) {
          return true;
        }
        if (propName === 'slice') {
          const sliceArgs = (arg.arguments as AnyNode[]) || [];
          for (const sArg of sliceArgs) {
            if (
              sArg.type === 'Identifier' &&
              (sArg.name === 'mid' || sArg.name === 'half')
            ) {
              return true;
            }
            if (sArg.type === 'BinaryExpression' && sArg.operator === '/') {
              return true;
            }
            if (sArg.type === 'CallExpression') {
              return true;
            }
          }
        }
      }
    }
    // mid - 1 or mid + 1
    if (arg.type === 'BinaryExpression') {
      const left = arg.left as AnyNode;
      if (
        left &&
        left.type === 'Identifier' &&
        (left.name === 'mid' || left.name === 'half')
      ) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Checks if a recursive call passes a slice of the input array (e.g. arr.slice(1)).
 */
function checkIfCallSlicesInput(callNode: AnyNode): boolean {
  const args = (callNode.arguments as AnyNode[]) || [];
  for (const arg of args) {
    if (arg.type === 'CallExpression') {
      const callee = arg.callee as AnyNode;
      if (
        callee?.type === 'MemberExpression' &&
        (callee.property as AnyNode)?.name === 'slice'
      ) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Checks if multiple recursive call sites can execute along a single execution path.
 */
function checkCanMultipleCallsExecute(
  callNodes: AnyNode[],
  body: AnyNode
): boolean {
  if (callNodes.length <= 1) return false;

  const enclosingStatements: AnyNode[] = [];

  for (const callNode of callNodes) {
    let stmt: AnyNode | null = null;

    const findEnclosing = (curr: unknown, parentStmt: AnyNode | null) => {
      if (stmt || !curr || typeof curr !== 'object') return;
      const n = curr as AnyNode;

      const isStmt =
        n.type?.endsWith('Statement') || n.type === 'VariableDeclaration';
      const currentParent = isStmt ? n : parentStmt;

      if (n === callNode) {
        stmt = currentParent;
        return;
      }

      for (const val of Object.values(n)) {
        if (Array.isArray(val)) {
          for (const item of val) findEnclosing(item, currentParent);
        } else {
          findEnclosing(val, currentParent);
        }
      }
    };

    findEnclosing(body, null);
    if (stmt) enclosingStatements.push(stmt);
  }

  // 1. If two calls share the exact same enclosing statement (e.g. return f(n-1) + f(n-2)), both execute!
  const stmtCounts = new Map<AnyNode, number>();
  for (const s of enclosingStatements) {
    stmtCounts.set(s, (stmtCounts.get(s) || 0) + 1);
    if (stmtCounts.get(s)! > 1) {
      return true;
    }
  }

  // 2. Otherwise check if statements in the same block are sequential
  if (enclosingStatements.length > 1) {
    const parentBlocks = new Map<AnyNode, number[]>();

    const mapStatements = (curr: unknown) => {
      if (!curr || typeof curr !== 'object') return;
      const n = curr as AnyNode;

      if (n.type === 'BlockStatement' || n.type === 'Program') {
        const stmts = (n.body as AnyNode[]) || [];
        for (let i = 0; i < stmts.length; i++) {
          if (enclosingStatements.includes(stmts[i])) {
            const list = parentBlocks.get(n) || [];
            list.push(i);
            parentBlocks.set(n, list);
          }
        }
      }

      for (const val of Object.values(n)) {
        if (Array.isArray(val)) {
          for (const item of val) mapStatements(item);
        } else {
          mapStatements(val);
        }
      }
    };

    mapStatements(body);

    for (const [block, indices] of parentBlocks) {
      if (indices.length > 1) {
        const stmts = (block.body as AnyNode[]) || [];
        let prevIndex = -1;
        for (const idx of indices) {
          if (prevIndex !== -1 && idx === prevIndex + 1) {
            if (stmts[prevIndex].type !== 'ReturnStatement') {
              return true;
            }
          }
          prevIndex = idx;
        }
      }
    }
  }

  return false;
}

/**
 * Checks whether a function has memoization parameters and cache lookups.
 */
function hasMemoization(node: AnyNode): boolean {
  const params = (node.params as AnyNode[]) || [];
  const hasMemoParam = params.some((p) => {
    let name = '';
    if (p.type === 'Identifier') name = p.name as string;
    else if (
      p.type === 'AssignmentPattern' &&
      (p.left as AnyNode)?.type === 'Identifier'
    ) {
      name = (p.left as AnyNode).name as string;
    }
    return /^(memo|cache|dp)/i.test(name);
  });

  let hasMemoCheck = false;
  const visit = (curr: unknown) => {
    if (hasMemoCheck || !curr || typeof curr !== 'object') return;
    const n = curr as AnyNode;
    if (n.type === 'MemberExpression') {
      const obj = n.object as AnyNode;
      if (
        obj &&
        obj.type === 'Identifier' &&
        /^(memo|cache|dp)/i.test(obj.name as string)
      ) {
        hasMemoCheck = true;
        return;
      }
    }
    for (const v of Object.values(n)) {
      if (Array.isArray(v)) for (const item of v) visit(item);
      else visit(v);
    }
  };
  visit(node.body);

  return hasMemoParam && hasMemoCheck;
}

/**
 * Checks if recursive calls pass tree node references (e.g. node.left, node.right).
 */
function isTreeTraversal(callNodes: AnyNode[]): boolean {
  if (callNodes.length < 2) return false;
  return callNodes.every((call) => {
    const args = (call.arguments as AnyNode[]) || [];
    return args.some((a) => {
      if (a.type === 'MemberExpression') {
        const prop = (a.property as AnyNode)?.name;
        return ['left', 'right', 'children', 'child'].includes(prop as string);
      }
      return false;
    });
  });
}

/**
 * Checks if function implements QuickSort partitioning pattern.
 */
function isQuickSortPattern(callNodes: AnyNode[]): boolean {
  if (callNodes.length !== 2) return false;
  const argNames: string[] = [];
  for (const call of callNodes) {
    const args = (call.arguments as AnyNode[]) || [];
    if (args.length > 0 && args[0].type === 'Identifier') {
      argNames.push(args[0].name as string);
    }
  }
  return argNames.includes('left') && argNames.includes('right');
}

/**
 * Checks if function duplicates array elements recursively (e.g. generate(n)).
 */
function isRecursiveArrayGeneration(node: AnyNode, fnName: string): boolean {
  let hasRecursiveResultLoop = false;
  const body = (node.body as AnyNode) || node;

  let recVarName = '';
  const findRecVar = (curr: unknown) => {
    if (recVarName || !curr || typeof curr !== 'object') return;
    const n = curr as AnyNode;
    const init = n.init as AnyNode | undefined;
    const callee = init?.callee as AnyNode | undefined;
    if (
      n.type === 'VariableDeclarator' &&
      init?.type === 'CallExpression' &&
      callee?.type === 'Identifier' &&
      callee.name === fnName
    ) {
      const id = n.id as AnyNode | undefined;
      if (id?.type === 'Identifier') {
        recVarName = id.name as string;
        return;
      }
    }
    for (const v of Object.values(n)) {
      if (Array.isArray(v)) for (const item of v) findRecVar(item);
      else findRecVar(v);
    }
  };
  findRecVar(body);

  if (recVarName) {
    const checkLoop = (curr: unknown) => {
      if (hasRecursiveResultLoop || !curr || typeof curr !== 'object') return;
      const n = curr as AnyNode;
      if (n.type === 'ForOfStatement' || n.type === 'ForInStatement') {
        const right = n.right as AnyNode | undefined;
        if (right?.type === 'Identifier' && right.name === recVarName) {
          hasRecursiveResultLoop = true;
          return;
        }
      }
      for (const v of Object.values(n)) {
        if (Array.isArray(v)) for (const item of v) checkLoop(item);
        else checkLoop(v);
      }
    };
    checkLoop(body);
  }

  return hasRecursiveResultLoop;
}

/**
 * Checks if function implements permutation generation with nested loops.
 */
function isPermutationGeneration(node: AnyNode, fnName: string): boolean {
  let hasPermLoop = false;
  const body = (node.body as AnyNode) || node;

  const visit = (curr: unknown) => {
    if (hasPermLoop || !curr || typeof curr !== 'object') return;
    const n = curr as AnyNode;
    if (isLoopNode(n)) {
      let hasCall = false;
      let hasInner = false;
      const scan = (c: unknown) => {
        if (!c || typeof c !== 'object') return;
        const cn = c as AnyNode;
        if (
          cn.type === 'CallExpression' &&
          (cn.callee as AnyNode)?.name === fnName
        ) {
          hasCall = true;
        }
        if (isLoopNode(cn) && cn !== n) {
          hasInner = true;
        }
        for (const v of Object.values(cn)) {
          if (Array.isArray(v)) for (const item of v) scan(item);
          else scan(v);
        }
      };
      scan((n.body as AnyNode) || n);
      if (hasCall && hasInner) {
        hasPermLoop = true;
        return;
      }
    }
    for (const v of Object.values(n)) {
      if (Array.isArray(v)) for (const item of v) visit(item);
      else visit(v);
    }
  };
  visit(body);
  return hasPermLoop;
}

/**
 * Checks if recursive call occurs inside a linear loop without spreads (e.g. mystery(n)).
 */
function isFactorialRecursionInsideLoop(
  node: AnyNode,
  fnName: string
): boolean {
  let found = false;
  const body = (node.body as AnyNode) || node;

  const visit = (curr: unknown) => {
    if (found || !curr || typeof curr !== 'object') return;
    const n = curr as AnyNode;
    if (isLoopNode(n)) {
      let callCount = 0;
      let hasSpread = false;
      const scan = (c: unknown) => {
        if (!c || typeof c !== 'object') return;
        const cn = c as AnyNode;
        if (
          cn.type === 'CallExpression' &&
          (cn.callee as AnyNode)?.name === fnName
        ) {
          callCount++;
        }
        if (cn.type === 'SpreadElement') {
          hasSpread = true;
        }
        for (const v of Object.values(cn)) {
          if (Array.isArray(v)) for (const item of v) scan(item);
          else scan(v);
        }
      };
      scan((n.body as AnyNode) || n);
      if (callCount > 0 && !hasSpread) {
        found = true;
        return;
      }
    }
    for (const v of Object.values(n)) {
      if (Array.isArray(v)) for (const item of v) visit(item);
      else visit(v);
    }
  };
  visit(body);
  return found;
}

/**
 * Checks whether a function body contains linear work outside the recursive calls.
 */
function checkIfFunctionHasLinearWork(body: AnyNode): boolean {
  let hasLinear = false;

  const visit = (curr: unknown) => {
    if (hasLinear || !curr || typeof curr !== 'object') return;
    const n = curr as AnyNode;

    // Check for loops (excluding constant loops)
    if (isLoopNode(n)) {
      if (
        n.type === 'ForStatement' &&
        isConstantBound(n.test as AnyNode, new Set())
      ) {
        // Constant bound
      } else {
        hasLinear = true;
        return;
      }
    }

    // Check for linear methods: slice, concat, splice, map, filter, etc.
    if (n.type === 'CallExpression') {
      const callInfo = inspectCallExpression(n);
      if (
        callInfo &&
        (callInfo.timeComplexity === 'O(n)' ||
          callInfo.timeComplexity === 'O(n log n)')
      ) {
        hasLinear = true;
        return;
      }
    }

    for (const [k, v] of Object.entries(n)) {
      if (k === 'loc' || k === 'range') continue;
      if (Array.isArray(v)) {
        for (const item of v) visit(item);
      } else {
        visit(v);
      }
    }
  };

  visit(body);
  return hasLinear;
}
