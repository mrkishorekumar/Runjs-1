import {
  AnyNode,
  inspectCallExpression,
  isFunctionNode,
  isLoopNode,
} from './astUtils';
import { detectPowerSetLoop } from './loopAnalyzer';
import { ComplexityFactor, ComplexityRank } from './types';

export interface SpaceAnalysisResult {
  spaceRank: ComplexityRank;
  factors: ComplexityFactor[];
  dataStructuresCreated: string[];
}

interface CollectionTracking {
  name: string;
  declaredDepth: number;
  maxPushDepth: number;
  storedCollectionNames: Set<string>;
}

export function analyzeSpace(
  ast: AnyNode,
  recursionSpaceRank: ComplexityRank
): SpaceAnalysisResult {
  const factors: ComplexityFactor[] = [];
  const dataStructuresCreated: string[] = [];

  let hasMatrixAllocation = false;
  let hasLinearDataStructure = false;
  let hasDynamicGrowthInLoop = false;
  let hasSortingSpace = false;

  // Track all collections created with their scope depth
  const trackedCollections = new Map<string, CollectionTracking>();

  let scopeCounter = 0;
  const scopeStack: number[] = [0];

  const getScopeKey = (varName: string): string => {
    const currentScopeId = scopeStack[scopeStack.length - 1] ?? 0;
    return `${currentScopeId}:${varName}`;
  };

  const resolveCollectionKey = (varName: string): string | null => {
    for (let i = scopeStack.length - 1; i >= 0; i--) {
      const key = `${scopeStack[i]}:${varName}`;
      if (trackedCollections.has(key)) return key;
    }
    return null;
  };

  const traverse = (curr: unknown, loopDepth: number) => {
    if (!curr || typeof curr !== 'object') return;
    const n = curr as AnyNode;

    const isFn = isFunctionNode(n);
    if (isFn) {
      scopeStack.push(++scopeCounter);
    }

    const isLoop = isLoopNode(n);
    const currentLoopDepth = isFn ? 0 : isLoop ? loopDepth + 1 : loopDepth;

    // 1. Check Variable Declarators
    const idNode = n.id as AnyNode | undefined;
    if (
      n.type === 'VariableDeclarator' &&
      idNode &&
      typeof idNode.name === 'string'
    ) {
      const varName = idNode.name;
      const collKey = getScopeKey(varName);
      const init = n.init as AnyNode | null;

      if (init) {
        // e.g. const matrix = Array.from({length: n}, () => new Array(n))
        if (checkIs2DMatrixAllocation(init)) {
          hasMatrixAllocation = true;
          dataStructuresCreated.push('2D Matrix / Nested Array');
          factors.push({
            type: 'data_structure',
            description: `Allocated 2D matrix or nested collection '${varName}', scaling quadratically O(n²) in memory`,
            impact: 'space',
            order: 'O(n²)',
          });
        }
        // e.g. new Set(), new Map(), new Array(n)
        else if (init.type === 'NewExpression') {
          const callee = init.callee as AnyNode;
          if (
            callee &&
            callee.type === 'Identifier' &&
            typeof callee.name === 'string'
          ) {
            if (['Set', 'Map', 'WeakMap', 'WeakSet'].includes(callee.name)) {
              hasLinearDataStructure = true;
              dataStructuresCreated.push(`new ${callee.name}()`);
              trackedCollections.set(collKey, {
                name: varName,
                declaredDepth: currentLoopDepth,
                maxPushDepth: 0,
                storedCollectionNames: new Set(),
              });
              factors.push({
                type: 'data_structure',
                description: `Created new '${callee.name}' collection '${varName}', using O(n) auxiliary memory`,
                impact: 'space',
                order: 'O(n)',
              });
            } else if (callee.name === 'Array') {
              hasLinearDataStructure = true;
              dataStructuresCreated.push('new Array()');
              trackedCollections.set(collKey, {
                name: varName,
                declaredDepth: currentLoopDepth,
                maxPushDepth: 0,
                storedCollectionNames: new Set(),
              });
              factors.push({
                type: 'data_structure',
                description: `Created dynamic Array '${varName}', requiring O(n) memory`,
                impact: 'space',
                order: 'O(n)',
              });
            }
          }
        }
        // e.g. Array.from(...)
        else if (init.type === 'CallExpression') {
          const callInfo = inspectCallExpression(init);
          if (callInfo && callInfo.createsNewDataStructure) {
            hasLinearDataStructure = true;
            dataStructuresCreated.push(callInfo.name);
            trackedCollections.set(collKey, {
              name: varName,
              declaredDepth: currentLoopDepth,
              maxPushDepth: 0,
              storedCollectionNames: new Set(),
            });
            factors.push({
              type: 'data_structure',
              description: `'${callInfo.name}()' creates and returns a new data structure of size O(n)`,
              impact: 'space',
              order: 'O(n)',
              line: callInfo.line,
            });
          }
        }
        // Array literal or object literal: const arr = [] or const obj = {}
        else if (init.type === 'ArrayExpression') {
          trackedCollections.set(collKey, {
            name: varName,
            declaredDepth: currentLoopDepth,
            maxPushDepth: 0,
            storedCollectionNames: new Set(),
          });
          if (currentLoopDepth > 0) {
            hasLinearDataStructure = true;
            dataStructuresCreated.push('Array literal in loop');
          }
        } else if (init.type === 'ObjectExpression') {
          trackedCollections.set(collKey, {
            name: varName,
            declaredDepth: currentLoopDepth,
            maxPushDepth: 0,
            storedCollectionNames: new Set(),
          });
        }
      }
    }

    // 2. Check Spread Elements: [...arr] or {...obj}
    if (n.type === 'SpreadElement') {
      hasLinearDataStructure = true;
      dataStructuresCreated.push('Spread operator shallow copy');
      factors.push({
        type: 'data_structure',
        description: `Spread syntax creates a shallow copy, allocating O(n) auxiliary memory`,
        impact: 'space',
        order: 'O(n)',
      });
    }

    // 3. Check calls inside loops: obj.push(arg), obj.unshift(arg), obj.add(arg), obj.set(arg)
    if (currentLoopDepth > 0 && n.type === 'CallExpression') {
      const callee = n.callee as AnyNode;
      if (callee && callee.type === 'MemberExpression') {
        const obj = callee.object as AnyNode;
        const prop = callee.property as AnyNode;

        if (
          obj &&
          obj.type === 'Identifier' &&
          typeof obj.name === 'string' &&
          prop &&
          prop.type === 'Identifier' &&
          typeof prop.name === 'string' &&
          ['push', 'unshift', 'add', 'set'].includes(prop.name)
        ) {
          const resolvedKey = resolveCollectionKey(obj.name);
          if (resolvedKey) {
            hasDynamicGrowthInLoop = true;
            hasLinearDataStructure = true;
            dataStructuresCreated.push(`${obj.name}.${prop.name}()`);

            const tracking = trackedCollections.get(resolvedKey)!;
            tracking.maxPushDepth = Math.max(
              tracking.maxPushDepth,
              currentLoopDepth
            );

            // Check argument: is it another collection?
            const args = (n.arguments as AnyNode[]) || [];
            if (args.length > 0 && args[0].type === 'Identifier') {
              const argName = args[0].name as string;
              const childKey = resolveCollectionKey(argName);
              if (childKey) {
                tracking.storedCollectionNames.add(childKey);
              }
            } else if (args.length > 0 && args[0].type === 'ArrayExpression') {
              tracking.storedCollectionNames.add('__inline_array__');
            }
          }
        }
      }
    }

    // 4. Object/Array assignment inside loop: hash[key] = val or matrix[i] = []
    if (currentLoopDepth > 0 && n.type === 'AssignmentExpression') {
      const left = n.left as AnyNode;
      if (
        left &&
        left.type === 'MemberExpression' &&
        left.object &&
        (left.object as AnyNode).type === 'Identifier' &&
        typeof (left.object as AnyNode).name === 'string'
      ) {
        const collName = (left.object as AnyNode).name as string;
        const resolvedKey = resolveCollectionKey(collName);
        if (resolvedKey) {
          hasDynamicGrowthInLoop = true;
          hasLinearDataStructure = true;
          dataStructuresCreated.push(`${collName}[key]`);

          const tracking = trackedCollections.get(resolvedKey)!;
          tracking.maxPushDepth = Math.max(
            tracking.maxPushDepth,
            currentLoopDepth
          );

          const right = n.right as AnyNode;
          if (right && right.type === 'Identifier') {
            const argName = right.name as string;
            const childKey = resolveCollectionKey(argName);
            if (childKey) {
              tracking.storedCollectionNames.add(childKey);
            }
          } else if (right && right.type === 'ArrayExpression') {
            tracking.storedCollectionNames.add('__inline_array__');
          }
        }
      }
    }

    // 5. Method calls that return new arrays (e.g. .map(), .filter(), .slice())
    if (n.type === 'CallExpression') {
      const callInfo = inspectCallExpression(n);
      if (callInfo && callInfo.createsNewDataStructure) {
        hasLinearDataStructure = true;
        dataStructuresCreated.push(callInfo.name);
      }
      if (callInfo && callInfo.name === 'sort') {
        hasSortingSpace = true;
        dataStructuresCreated.push('Array.prototype.sort');
      }
    }

    for (const [k, v] of Object.entries(n)) {
      if (k === 'loc' || k === 'range') continue;
      if (Array.isArray(v)) {
        for (const item of v) traverse(item, currentLoopDepth);
      } else {
        traverse(v, currentLoopDepth);
      }
    }

    if (isFn) {
      scopeStack.pop();
    }
  };

  traverse(ast, 0);

  const hasDirect2D = checkIs2DMatrixAllocation(ast);
  if (hasDirect2D) {
    hasMatrixAllocation = true;
    dataStructuresCreated.push('2D Matrix / Nested Array');
  }

  const hasPowerSet = detectPowerSetLoop(ast);

  // Check for dynamic 2D matrix / nested collection growth:
  // e.g. complexFive: result (depth 0) stores temp, and temp was pushed inside a loop (depth 2)
  for (const [, coll] of trackedCollections) {
    // Case A: collection declared at depth d, pushed inside nested loop >= d + 2
    if (coll.maxPushDepth >= coll.declaredDepth + 2) {
      hasMatrixAllocation = true;
      dataStructuresCreated.push(`${coll.name} (nested loop accumulation)`);
    }

    // Case B: collection stores child collections that themselves were populated in a loop
    if (coll.storedCollectionNames.size > 0 && coll.maxPushDepth >= 1) {
      for (const childName of coll.storedCollectionNames) {
        if (childName === '__inline_array__') {
          hasMatrixAllocation = true;
          dataStructuresCreated.push(`${coll.name} (nested 2D array)`);
        } else {
          const childColl = trackedCollections.get(childName);
          if (childColl && childColl.maxPushDepth >= 1) {
            hasMatrixAllocation = true;
            dataStructuresCreated.push(
              `${coll.name} -> ${childColl.name} (nested 2D collections)`
            );
          }
        }
      }
    }
  }

  if (hasPowerSet) {
    factors.push({
      type: 'data_structure',
      description:
        'Iterative power set generation accumulates 2ⁿ subsets of size up to n, requiring O(n * 2^n) auxiliary space',
      impact: 'space',
      order: 'O(n * 2^n)',
    });
  } else if (hasMatrixAllocation) {
    factors.push({
      type: 'data_structure',
      description: `Allocated 2D dynamic collections (nested loops storing n × n elements), requiring O(n²) auxiliary memory`,
      impact: 'space',
      order: 'O(n²)',
    });
  } else if (hasDynamicGrowthInLoop) {
    factors.push({
      type: 'data_structure',
      description: `Collection dynamically grows with items inserted across loop iterations (O(n) auxiliary space)`,
      impact: 'space',
      order: 'O(n)',
    });
  }

  // Determine auxiliary memory rank
  let auxSpaceRank: ComplexityRank = ComplexityRank.O_1;
  if (hasPowerSet) {
    auxSpaceRank = ComplexityRank.O_2_N;
  } else if (hasMatrixAllocation) {
    auxSpaceRank = ComplexityRank.O_N_2;
  } else if (hasLinearDataStructure || hasDynamicGrowthInLoop) {
    auxSpaceRank = ComplexityRank.O_N;
  } else if (hasSortingSpace) {
    auxSpaceRank = ComplexityRank.O_LOG_N;
    factors.push({
      type: 'data_structure',
      description:
        'Array.prototype.sort requires O(log n) to O(n) auxiliary call stack/buffer memory',
      impact: 'space',
      order: 'O(log n)',
    });
  }

  // Final space rank is maximum of auxiliary heap space and recursion call stack space
  const finalSpaceRank = Math.max(auxSpaceRank, recursionSpaceRank);

  if (finalSpaceRank === ComplexityRank.O_1) {
    factors.push({
      type: 'constant',
      description: `Only a fixed number of primitive variables and pointers are used (O(1) auxiliary space)`,
      impact: 'space',
      order: 'O(1)',
    });
  }

  return {
    spaceRank: finalSpaceRank,
    factors,
    dataStructuresCreated: Array.from(new Set(dataStructuresCreated)),
  };
}

function createsArrayLike(n: AnyNode | null | undefined): boolean {
  if (!n) return false;
  if (n.type === 'ArrayExpression') return true;
  if (n.type === 'NewExpression') {
    const callee = n.callee as AnyNode;
    if (callee && callee.type === 'Identifier' && callee.name === 'Array')
      return true;
  }
  if (n.type === 'CallExpression') {
    const callee = n.callee as AnyNode;
    if (callee && callee.type === 'Identifier' && callee.name === 'Array')
      return true;
    if (callee && callee.type === 'MemberExpression') {
      const obj = callee.object as AnyNode;
      const prop = callee.property as AnyNode;
      if (
        obj &&
        obj.type === 'Identifier' &&
        obj.name === 'Array' &&
        prop &&
        (prop.name === 'from' || prop.name === 'of')
      ) {
        return true;
      }
      if (
        prop &&
        (prop.name === 'map' ||
          prop.name === 'filter' ||
          prop.name === 'slice' ||
          prop.name === 'concat')
      ) {
        return true;
      }
      if (prop && prop.name === 'fill') {
        return createsArrayLike(obj);
      }
    }
  }
  return false;
}

/**
 * Checks whether an expression allocates a 2D matrix (e.g. Array.from(... () => new Array) or new Array.fill().map()).
 */
function checkIs2DMatrixAllocation(expr: AnyNode): boolean {
  let is2D = false;

  const checkNode = (n: unknown) => {
    if (is2D || !n || typeof n !== 'object') return;
    const node = n as AnyNode;

    if (node.type === 'CallExpression') {
      const callee = node.callee as AnyNode;
      if (callee && callee.type === 'MemberExpression') {
        const prop = callee.property as AnyNode;
        if (prop && (prop.name === 'map' || prop.name === 'from')) {
          const args = node.arguments as AnyNode[];
          for (const arg of args) {
            if (
              arg &&
              (arg.type === 'ArrowFunctionExpression' ||
                arg.type === 'FunctionExpression')
            ) {
              const body = arg.body as AnyNode;
              if (createsArrayLike(body)) {
                is2D = true;
                return;
              }
              // Check return statements in block body
              if (body && body.type === 'BlockStatement') {
                const bodyStatements = (body.body as AnyNode[]) || [];
                for (const stmt of bodyStatements) {
                  if (
                    stmt.type === 'ReturnStatement' &&
                    createsArrayLike(stmt.argument as AnyNode)
                  ) {
                    is2D = true;
                    return;
                  }
                }
              }
            }
          }
        }
      }
    }

    for (const val of Object.values(node)) {
      if (Array.isArray(val)) {
        for (const item of val) checkNode(item);
      } else {
        checkNode(val);
      }
    }
  };

  checkNode(expr);
  return is2D;
}
