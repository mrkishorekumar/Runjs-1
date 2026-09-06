import {
  AnyNode,
  isLoopNode,
  isFunctionNode,
  isConstantBound,
  isLogarithmicStep,
  isSquareRootBound,
  isDoubleLogarithmicStep,
  inspectCallExpression,
} from './astUtils';
import { ComplexityFactor, ComplexityRank } from './types';

export interface LoopAnalysisResult {
  totalLoopsCount: number;
  maxNestingDepth: number;
  hasLogarithmicLoop: boolean;
  hasLinearLoop: boolean;
  isAllConstantBound: boolean;
  timeRank: ComplexityRank;
  factors: ComplexityFactor[];
  builtinsInsideLoops: string[];
}

interface LoopContext {
  loopNode: AnyNode;
  depth: number;
  isLogarithmic: boolean;
  isConstant: boolean;
  isSqrt: boolean;
  isDoubleLog: boolean;
  isGeometric: boolean;
  loopVarName?: string;
  nestedBuiltinCount: number;
  line?: number;
}

export function analyzeLoops(
  ast: AnyNode,
  inputNames: Set<string>
): LoopAnalysisResult {
  const loopStack: LoopContext[] = [];
  const allLoops: LoopContext[] = [];
  const builtinsInsideLoops: string[] = [];
  const factors: ComplexityFactor[] = [];

  let maxDepth = 0;
  let hasLinearLoop = false;
  let hasLogarithmicLoop = false;
  const hasPowerSet = detectPowerSetLoop(ast);

  const chainTracker = {
    highestChainRank: ComplexityRank.O_1 as ComplexityRank,
    highestChainFactorDesc: '',
    highestChainFactorType: 'loop' as ComplexityFactor['type'],
  };

  const evaluateCurrentChain = (currentStack: LoopContext[]) => {
    if (currentStack.length === 0 && !hasPowerSet) return;

    let linearCount = 0;
    let logCount = 0;
    let sqrtCount = 0;
    let doubleLogCount = 0;
    let hasGeometric = false;

    for (const ctx of currentStack) {
      if (ctx.isGeometric) {
        hasGeometric = true;
      }
      if (ctx.isDoubleLog) {
        doubleLogCount++;
      } else if (ctx.isSqrt) {
        sqrtCount++;
      } else if (ctx.isLogarithmic) {
        logCount++;
      } else if (!ctx.isConstant) {
        linearCount++;
      }
      linearCount += ctx.nestedBuiltinCount;
    }

    let chainRank: ComplexityRank = ComplexityRank.O_1;
    let chainDesc = '';
    let chainType: ComplexityFactor['type'] = 'loop';

    if (hasPowerSet) {
      chainRank = ComplexityRank.O_2_N;
      chainType = 'nested_loop';
      chainDesc =
        'Iterative power set generation doubling subproblems each iteration, executing in O(n * 2^n) time';
    } else if (hasGeometric) {
      chainRank = ComplexityRank.O_N;
      chainType = 'loop';
      chainDesc =
        'Geometric nested loop where inner bounds decrease geometrically by half, summing to O(n) total operations';
    } else if (doubleLogCount >= 1 && linearCount === 0) {
      chainRank = ComplexityRank.O_LOG_LOG_N;
      chainType = 'loop';
      chainDesc =
        'Loop repeatedly taking square roots of the input, executing in O(log log n) time';
    } else if (linearCount >= 1 && sqrtCount >= 1) {
      chainRank = ComplexityRank.O_N_SQRT_N;
      chainType = 'nested_loop';
      chainDesc =
        'Nested loops: outer linear loop with inner square root loop, yielding O(n sqrt(n)) time';
    } else if (linearCount === 0 && sqrtCount >= 1) {
      chainRank = ComplexityRank.O_SQRT_N;
      chainType = 'loop';
      chainDesc =
        'Loop bounded by square root condition (e.g. i * i <= n), executing in O(sqrt(n)) time';
    } else if (linearCount === 0 && logCount >= 2) {
      chainRank = ComplexityRank.O_LOG_N_2;
      chainType = 'nested_loop';
      chainDesc = 'Two nested logarithmic loops executing in O((log n)²) time';
    } else if (linearCount >= 3) {
      chainRank = ComplexityRank.O_N_3;
      chainType = 'nested_loop';
      chainDesc = `${linearCount} levels of nested loops detected, scaling cubically with input size`;
    } else if (linearCount === 2) {
      chainRank = ComplexityRank.O_N_2;
      chainType = 'nested_loop';
      chainDesc =
        '2 nested loops detected (inner loop executes for each iteration of outer loop)';
    } else if (linearCount === 1 && logCount >= 1) {
      chainRank = ComplexityRank.O_N_LOG_N;
      chainType = 'nested_loop';
      chainDesc =
        'Nested loops: outer linear loop O(n) with inner logarithmic loop O(log n) yielding O(n log n) time';
    } else if (linearCount === 1 && logCount === 0) {
      chainRank = ComplexityRank.O_N;
      chainType = 'loop';
      chainDesc = 'Single loop iterating over input size in O(n) time';
    } else if (linearCount === 0 && logCount >= 1) {
      chainRank = ComplexityRank.O_LOG_N;
      chainType = 'loop';
      chainDesc =
        'Loop with logarithmic iteration step (dividing/halving search space)';
    } else {
      chainRank = ComplexityRank.O_1;
      chainType = 'constant';
      chainDesc = 'Loop with fixed constant bounds executing in O(1) time';
    }

    if (chainRank > chainTracker.highestChainRank) {
      chainTracker.highestChainRank = chainRank;
      chainTracker.highestChainFactorDesc = chainDesc;
      chainTracker.highestChainFactorType = chainType;
    }
  };

  const traverse = (node: unknown, currentLoopDepth: number) => {
    if (!node || typeof node !== 'object') return;
    const n = node as AnyNode;

    // 1. Check higher-order array iteration methods: map, forEach, filter, flatMap, reduce
    if (n.type === 'CallExpression') {
      const callee = n.callee as AnyNode;
      if (callee && callee.type === 'MemberExpression') {
        const prop = callee.property as AnyNode;
        if (
          prop &&
          prop.type === 'Identifier' &&
          ['map', 'forEach', 'filter', 'flatMap', 'reduce'].includes(
            prop.name as string
          )
        ) {
          const args = (n.arguments as AnyNode[]) || [];
          if (args.length > 0 && isFunctionNode(args[0])) {
            const line = n.loc
              ? (n.loc as { start: { line: number } }).start.line
              : undefined;
            const newDepth = currentLoopDepth + 1;
            hasLinearLoop = true;
            const loopCtx: LoopContext = {
              loopNode: n,
              depth: newDepth,
              isLogarithmic: false,
              isConstant: false,
              isSqrt: false,
              isDoubleLog: false,
              isGeometric: false,
              nestedBuiltinCount: 0,
              line,
            };
            loopStack.push(loopCtx);
            allLoops.push(loopCtx);
            if (newDepth > maxDepth) maxDepth = newDepth;
            evaluateCurrentChain(loopStack);

            // Traverse callback body inside loop depth
            traverse(args[0], newDepth);

            loopStack.pop();

            // Traverse object and remaining args outside loop depth
            traverse(callee.object, currentLoopDepth);
            for (let i = 1; i < args.length; i++) {
              traverse(args[i], currentLoopDepth);
            }
            return;
          }
        }
      }
    }

    // 2. Check for..of / for..in (evaluate right side at outer scope)
    if (n.type === 'ForOfStatement' || n.type === 'ForInStatement') {
      const line = n.loc
        ? (n.loc as { start: { line: number } }).start.line
        : undefined;
      const newDepth = currentLoopDepth + 1;
      hasLinearLoop = true;
      const loopCtx: LoopContext = {
        loopNode: n,
        depth: newDepth,
        isLogarithmic: false,
        isConstant: false,
        isSqrt: false,
        isDoubleLog: false,
        isGeometric: false,
        nestedBuiltinCount: 0,
        line,
      };
      loopStack.push(loopCtx);
      allLoops.push(loopCtx);
      if (newDepth > maxDepth) maxDepth = newDepth;
      evaluateCurrentChain(loopStack);

      // Crucial: n.right (e.g. Object.keys(obj)) runs once outside loop!
      traverse(n.right, currentLoopDepth);
      traverse(n.left, currentLoopDepth);
      traverse(n.body, newDepth);

      loopStack.pop();
      return;
    }

    // 3. Check ForStatement (evaluate init at outer scope)
    if (n.type === 'ForStatement') {
      const line = n.loc
        ? (n.loc as { start: { line: number } }).start.line
        : undefined;
      const newDepth = currentLoopDepth + 1;
      const isConst = isConstantBound(n.test as AnyNode, inputNames);
      const isLog = isLogarithmicStep(n.update as AnyNode);
      const isSqrt = isSquareRootBound(n.test as AnyNode);

      let loopVar = '';
      if (n.init && (n.init as AnyNode).type === 'VariableDeclaration') {
        const decls = ((n.init as AnyNode).declarations as AnyNode[]) || [];
        if (
          decls.length > 0 &&
          (decls[0].id as AnyNode)?.type === 'Identifier'
        ) {
          loopVar = (decls[0].id as AnyNode).name as string;
        }
      }

      let isGeometric = false;
      if (loopStack.length > 0) {
        const outer = loopStack[loopStack.length - 1];
        if (outer.isLogarithmic && outer.loopVarName) {
          if (n.test && referencesVar(n.test as AnyNode, outer.loopVarName)) {
            isGeometric = true;
          }
        }
      }

      if (isLog) hasLogarithmicLoop = true;
      else if (!isConst) hasLinearLoop = true;

      const loopCtx: LoopContext = {
        loopNode: n,
        depth: newDepth,
        isLogarithmic: isLog,
        isConstant: isConst,
        isSqrt,
        isDoubleLog: false,
        isGeometric,
        loopVarName: loopVar,
        nestedBuiltinCount: 0,
        line,
      };

      loopStack.push(loopCtx);
      allLoops.push(loopCtx);
      if (newDepth > maxDepth) maxDepth = newDepth;
      evaluateCurrentChain(loopStack);

      // Traverse init at currentLoopDepth (outside loop)
      traverse(n.init, currentLoopDepth);
      traverse(n.test, newDepth);
      traverse(n.update, newDepth);
      traverse(n.body, newDepth);

      loopStack.pop();
      return;
    }

    // 4. Check WhileStatement & DoWhileStatement
    if (n.type === 'WhileStatement' || n.type === 'DoWhileStatement') {
      const line = n.loc
        ? (n.loc as { start: { line: number } }).start.line
        : undefined;
      const newDepth = currentLoopDepth + 1;
      let isConst = isConstantBound(n.test as AnyNode, inputNames);
      const isLog = checkWhileBodyForLogStep(n.body as AnyNode);
      const isSqrt = isSquareRootBound(n.test as AnyNode);
      const isDoubleLog = checkWhileBodyForDoubleLogStep(n.body as AnyNode);

      if (isLog || isSqrt || isDoubleLog) {
        isConst = false;
      }

      if (isLog) hasLogarithmicLoop = true;
      else if (!isConst) hasLinearLoop = true;

      const loopCtx: LoopContext = {
        loopNode: n,
        depth: newDepth,
        isLogarithmic: isLog,
        isConstant: isConst,
        isSqrt,
        isDoubleLog,
        isGeometric: false,
        nestedBuiltinCount: 0,
        line,
      };

      loopStack.push(loopCtx);
      allLoops.push(loopCtx);
      if (newDepth > maxDepth) maxDepth = newDepth;
      evaluateCurrentChain(loopStack);

      traverse(n.test, newDepth);
      traverse(n.body, newDepth);

      loopStack.pop();
      return;
    }

    // 5. Check repeated array spread inside loop: result = [...result, value]
    if (n.type === 'SpreadElement' && currentLoopDepth > 0) {
      if (loopStack.length > 0) {
        loopStack[loopStack.length - 1].nestedBuiltinCount++;
        evaluateCurrentChain(loopStack);
        factors.push({
          type: 'nested_loop',
          description:
            'Array spread inside loop copies collection elements each iteration, yielding O(n²) time',
          impact: 'time',
          order: 'O(n²)',
        });
      }
    }

    // 6. Check method calls inside loops (e.g. arr.indexOf, arr.includes, arr.shift)
    if (n.type === 'CallExpression' && currentLoopDepth > 0) {
      const callInfo = inspectCallExpression(n);
      if (callInfo && callInfo.timeComplexity === 'O(n)') {
        builtinsInsideLoops.push(callInfo.name);
        if (loopStack.length > 0) {
          loopStack[loopStack.length - 1].nestedBuiltinCount++;
        }
        evaluateCurrentChain(loopStack);
        factors.push({
          type: 'nested_loop',
          description: `Linear method '${callInfo.name}()' is called inside a loop, multiplying operations`,
          impact: 'time',
          order: 'O(n²)',
          line: callInfo.line,
        });
      }
    }

    // Traverse children
    for (const [key, value] of Object.entries(n)) {
      if (key === 'loc' || key === 'range') continue;
      if (Array.isArray(value)) {
        for (const item of value) traverse(item, currentLoopDepth);
      } else {
        traverse(value, currentLoopDepth);
      }
    }
  };

  traverse(ast, 0);

  if (hasPowerSet) {
    evaluateCurrentChain([]);
  }

  const totalLoopsCount = allLoops.length;
  const isAllConstantBound =
    totalLoopsCount > 0 && allLoops.every((l) => l.isConstant);

  let timeRank: ComplexityRank = ComplexityRank.O_1;

  if (totalLoopsCount === 0 && !hasPowerSet) {
    timeRank = ComplexityRank.O_1;
  } else if (isAllConstantBound && !hasPowerSet) {
    timeRank = ComplexityRank.O_1;
    factors.push({
      type: 'constant',
      description: `All loop bounds (${totalLoopsCount}) are fixed constants, executing in O(1) time`,
      impact: 'time',
      order: 'O(1)',
    });
  } else {
    timeRank = chainTracker.highestChainRank;

    if (
      timeRank === ComplexityRank.O_N &&
      totalLoopsCount > 1 &&
      maxDepth === 1
    ) {
      factors.push({
        type: 'sequential_loop',
        description: `${totalLoopsCount} sequential loops execute one after another in O(n) time`,
        impact: 'time',
        order: 'O(n)',
      });
    } else if (chainTracker.highestChainFactorDesc) {
      factors.push({
        type: chainTracker.highestChainFactorType,
        description: chainTracker.highestChainFactorDesc,
        impact: 'time',
        order:
          timeRank === ComplexityRank.O_N_3
            ? 'O(n³)'
            : timeRank === ComplexityRank.O_N_2
              ? 'O(n²)'
              : timeRank === ComplexityRank.O_N_LOG_N
                ? 'O(n log n)'
                : timeRank === ComplexityRank.O_N_SQRT_N
                  ? 'O(n sqrt(n))'
                  : timeRank === ComplexityRank.O_SQRT_N
                    ? 'O(sqrt(n))'
                    : timeRank === ComplexityRank.O_LOG_N_2
                      ? 'O((log n)²)'
                      : timeRank === ComplexityRank.O_LOG_N
                        ? 'O(log n)'
                        : timeRank === ComplexityRank.O_LOG_LOG_N
                          ? 'O(log log n)'
                          : timeRank === ComplexityRank.O_2_N
                            ? chainTracker.highestChainFactorDesc.includes(
                                'power set'
                              )
                              ? 'O(n * 2^n)'
                              : 'O(2ⁿ)'
                            : 'O(n)',
      });
    }
  }

  return {
    totalLoopsCount,
    maxNestingDepth: maxDepth,
    hasLogarithmicLoop,
    hasLinearLoop,
    isAllConstantBound,
    timeRank,
    factors,
    builtinsInsideLoops,
  };
}

/**
 * Helper to inspect while-loop body for binary search or halving statements.
 */
function checkWhileBodyForLogStep(body: AnyNode | null | undefined): boolean {
  if (!body) return false;

  let found = false;
  const visit = (curr: unknown) => {
    if (found || !curr || typeof curr !== 'object') return;
    const n = curr as AnyNode;

    if (isLogarithmicStep(n)) {
      found = true;
      return;
    }

    // Binary search pattern: mid = Math.floor((low + high) / 2)
    if (n.type === 'AssignmentExpression' || n.type === 'VariableDeclarator') {
      const initOrRight = (
        n.type === 'AssignmentExpression' ? n.right : n.init
      ) as AnyNode;
      if (initOrRight && initOrRight.type === 'CallExpression') {
        const callee = initOrRight.callee as AnyNode;
        if (
          callee &&
          callee.type === 'MemberExpression' &&
          (callee.property as AnyNode)?.name === 'floor'
        ) {
          const args = initOrRight.arguments as AnyNode[];
          if (
            args &&
            args.length > 0 &&
            args[0].type === 'BinaryExpression' &&
            args[0].operator === '/'
          ) {
            found = true;
            return;
          }
        }
      }
    }

    for (const val of Object.values(n)) {
      if (Array.isArray(val)) {
        for (const item of val) visit(item);
      } else {
        visit(val);
      }
    }
  };

  visit(body);
  return found;
}

/**
 * Helper to inspect while-loop body for double logarithmic steps (i = Math.floor(Math.sqrt(i))).
 */
function checkWhileBodyForDoubleLogStep(
  body: AnyNode | null | undefined
): boolean {
  if (!body) return false;

  let found = false;
  const visit = (curr: unknown) => {
    if (found || !curr || typeof curr !== 'object') return;
    const n = curr as AnyNode;

    if (isDoubleLogarithmicStep(n)) {
      found = true;
      return;
    }

    for (const val of Object.values(n)) {
      if (Array.isArray(val)) {
        for (const item of val) visit(item);
      } else {
        visit(val);
      }
    }
  };

  visit(body);
  return found;
}

/**
 * Checks whether an AST node references a specific variable name.
 */
function referencesVar(node: AnyNode, varName: string): boolean {
  let found = false;
  const visit = (curr: unknown) => {
    if (found || !curr || typeof curr !== 'object') return;
    const n = curr as AnyNode;

    if (n.type === 'Identifier' && n.name === varName) {
      found = true;
      return;
    }

    for (const val of Object.values(n)) {
      if (Array.isArray(val)) {
        for (const item of val) visit(item);
      } else {
        visit(val);
      }
    }
  };

  visit(node);
  return found;
}

/**
 * Detects iterative power set generation: nested loops doubling result collection.
 */
export function detectPowerSetLoop(ast: AnyNode): boolean {
  let found = false;

  const visit = (curr: unknown) => {
    if (found || !curr || typeof curr !== 'object') return;
    const n = curr as AnyNode;

    if (isLoopNode(n)) {
      const body = (n.body as AnyNode) || n;
      let innerLoop: AnyNode | null = null;
      const findInner = (c: unknown) => {
        if (innerLoop || !c || typeof c !== 'object') return;
        const cn = c as AnyNode;
        if (isLoopNode(cn) && cn !== n) {
          innerLoop = cn;
          return;
        }
        for (const v of Object.values(cn)) {
          if (Array.isArray(v)) for (const item of v) findInner(item);
          else findInner(v);
        }
      };
      findInner(body);

      if (innerLoop) {
        let hasSpreadPush = false;
        const checkPush = (c: unknown) => {
          if (hasSpreadPush || !c || typeof c !== 'object') return;
          const cn = c as AnyNode;
          if (
            cn.type === 'CallExpression' &&
            (cn.callee as AnyNode)?.type === 'MemberExpression' &&
            ((cn.callee as AnyNode).property as AnyNode)?.name === 'push'
          ) {
            const args = (cn.arguments as AnyNode[]) || [];
            if (args.length > 0 && args[0].type === 'ArrayExpression') {
              const elements = (args[0].elements as AnyNode[]) || [];
              if (elements.some((el) => el && el.type === 'SpreadElement')) {
                hasSpreadPush = true;
                return;
              }
            }
          }
          for (const v of Object.values(cn)) {
            if (Array.isArray(v)) for (const item of v) checkPush(item);
            else checkPush(v);
          }
        };
        checkPush((innerLoop as AnyNode).body || innerLoop);

        if (hasSpreadPush) {
          found = true;
          return;
        }
      }
    }

    for (const v of Object.values(n)) {
      if (Array.isArray(v)) for (const item of v) visit(item);
      else visit(v);
    }
  };

  visit(ast);
  return found;
}
