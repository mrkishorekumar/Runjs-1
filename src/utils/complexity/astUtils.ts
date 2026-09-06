import * as acorn from 'acorn';

export type AnyNode = acorn.Node & Record<string, unknown>;

export interface ParseResult {
  success: boolean;
  ast?: AnyNode;
  error?: string;
  errorLine?: number;
  errorColumn?: number;
}

/**
 * Safely parses JavaScript code using Acorn with modern syntax support.
 */
export function safeParseAST(code: string): ParseResult {
  if (!code || !code.trim()) {
    return {
      success: false,
      error:
        'Code editor is empty. Please enter some JavaScript code to analyze.',
    };
  }

  const options: acorn.Options = {
    ecmaVersion: 'latest',
    locations: true,
    ranges: true,
    allowReturnOutsideFunction: true,
    allowAwaitOutsideFunction: true,
    allowSuperOutsideMethod: true,
    sourceType: 'module',
  };

  try {
    const ast = acorn.parse(code, options) as unknown as AnyNode;
    return { success: true, ast };
  } catch (moduleErr: unknown) {
    // Try parsing as script if module parse fails
    try {
      const ast = acorn.parse(code, {
        ...options,
        sourceType: 'script',
      }) as unknown as AnyNode;
      return { success: true, ast };
    } catch (scriptErr: unknown) {
      const err = (scriptErr || moduleErr) as {
        message?: string;
        loc?: { line: number; column: number };
      };
      const cleanMsg = (err.message || 'Syntax error')
        .replace(/\s*\(\d+:\d+\)$/, '')
        .trim();

      return {
        success: false,
        error: cleanMsg,
        errorLine: err.loc?.line,
        errorColumn: err.loc?.column,
      };
    }
  }
}

/**
 * Checks whether an AST node represents a function declaration or expression.
 */
export function isFunctionNode(node: AnyNode | null | undefined): boolean {
  if (!node) return false;
  return (
    node.type === 'FunctionDeclaration' ||
    node.type === 'FunctionExpression' ||
    node.type === 'ArrowFunctionExpression'
  );
}

/**
 * Checks whether an AST node is a loop construct.
 */
export function isLoopNode(node: AnyNode | null | undefined): boolean {
  if (!node) return false;
  return (
    node.type === 'ForStatement' ||
    node.type === 'ForOfStatement' ||
    node.type === 'ForInStatement' ||
    node.type === 'WhileStatement' ||
    node.type === 'DoWhileStatement'
  );
}

/**
 * Extracts function parameter identifiers.
 */
export function getFunctionParamNames(fnNode: AnyNode): string[] {
  const names: string[] = [];
  const params = (fnNode.params as AnyNode[]) || [];

  for (const param of params) {
    if (param.type === 'Identifier') {
      names.push(param.name as string);
    } else if (param.type === 'AssignmentPattern') {
      const left = param.left as AnyNode;
      if (left.type === 'Identifier') {
        names.push(left.name as string);
      }
    } else if (param.type === 'RestElement') {
      const arg = param.argument as AnyNode;
      if (arg.type === 'Identifier') {
        names.push(arg.name as string);
      }
    }
  }

  return names;
}

/**
 * Checks whether an expression references any input/parameter or `.length` / `.size`.
 */
export function referencesInput(
  node: AnyNode | null | undefined,
  inputNames: Set<string>
): boolean {
  if (!node) return false;

  let found = false;
  const visit = (curr: unknown) => {
    if (found || !curr || typeof curr !== 'object') return;
    const n = curr as AnyNode;

    if (n.type === 'Identifier' && typeof n.name === 'string') {
      if (
        inputNames.has(n.name) ||
        n.name === 'n' ||
        n.name === 'length' ||
        n.name === 'size'
      ) {
        found = true;
        return;
      }
    }

    if (n.type === 'MemberExpression') {
      const prop = n.property as AnyNode;
      if (
        prop &&
        ((prop.type === 'Identifier' &&
          (prop.name === 'length' || prop.name === 'size')) ||
          (prop.type === 'Literal' &&
            (prop.value === 'length' || prop.value === 'size')))
      ) {
        found = true;
        return;
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

  visit(node);
  return found;
}

/**
 * Checks whether an update expression or assignment modifies a variable logarithmically (e.g. i *= 2, i /= 2, i >>= 1).
 */
export function isLogarithmicStep(node: AnyNode | null | undefined): boolean {
  if (!node) return false;

  // e.g. i *= 2, i /= 2, i >>= 1, i <<= 1, i >>>= 1
  if (node.type === 'AssignmentExpression') {
    const operator = node.operator as string;
    if (
      operator === '*=' ||
      operator === '/=' ||
      operator === '>>=' ||
      operator === '<<=' ||
      operator === '>>>='
    ) {
      return true;
    }

    // e.g. i = i * 2, i = Math.floor(i / 2), i = i >> 1, i = parseInt(i / 2)
    const right = node.right as AnyNode;
    if (right) {
      if (
        right.type === 'BinaryExpression' &&
        (right.operator === '*' ||
          right.operator === '/' ||
          right.operator === '>>' ||
          right.operator === '<<' ||
          right.operator === '>>>')
      ) {
        return true;
      }
      if (right.type === 'CallExpression') {
        const callee = right.callee as AnyNode;
        if (
          callee &&
          callee.type === 'MemberExpression' &&
          typeof (callee.property as AnyNode)?.name === 'string' &&
          ['floor', 'trunc', 'round', 'ceil'].includes(
            (callee.property as AnyNode).name as string
          )
        ) {
          return true;
        }
        if (
          callee &&
          callee.type === 'Identifier' &&
          callee.name === 'parseInt'
        ) {
          return true;
        }
      }
      // Bitwise truncation: (i / 2) | 0 or ~~(i / 2)
      if (right.type === 'BinaryExpression' && right.operator === '|') {
        const left = right.left as AnyNode;
        if (left && left.type === 'BinaryExpression' && left.operator === '/') {
          return true;
        }
      }
    }
  }

  return false;
}

/**
 * Checks whether a loop test condition is bounded by a constant literal (e.g. i < 10, i < 5).
 */
export function isConstantBound(
  testNode: AnyNode | null | undefined,
  inputNames: Set<string>
): boolean {
  if (!testNode) return false;

  if (testNode.type === 'BinaryExpression') {
    const right = testNode.right as AnyNode;
    const left = testNode.left as AnyNode;

    // Both sides do NOT reference input names, and one side is a literal number
    const rightIsConst =
      right.type === 'Literal' && typeof right.value === 'number';
    const leftIsConst =
      left.type === 'Literal' && typeof left.value === 'number';

    if (
      (rightIsConst || leftIsConst) &&
      !referencesInput(testNode, inputNames)
    ) {
      return true;
    }
  }

  return false;
}

export interface MethodCallInfo {
  name: string;
  isBuiltinArrayMethod: boolean;
  isBuiltinObjectMethod: boolean;
  timeComplexity: 'O(1)' | 'O(n)' | 'O(n log n)';
  createsNewDataStructure: boolean;
  line?: number;
}

const LINEAR_ARRAY_METHODS = new Set([
  'map',
  'filter',
  'reduce',
  'reduceRight',
  'forEach',
  'find',
  'findIndex',
  'findLast',
  'findLastIndex',
  'some',
  'every',
  'includes',
  'indexOf',
  'lastIndexOf',
  'shift',
  'unshift',
  'slice',
  'splice',
  'concat',
  'join',
  'reverse',
  'flat',
  'flatMap',
  'fill',
]);

const ARRAY_CREATING_METHODS = new Set([
  'map',
  'filter',
  'slice',
  'concat',
  'flat',
  'flatMap',
]);

/**
 * Inspects a CallExpression to determine if it is a notable standard JS method call.
 */
export function inspectCallExpression(node: AnyNode): MethodCallInfo | null {
  if (node.type !== 'CallExpression') return null;

  const callee = node.callee as AnyNode;
  const line = node.loc
    ? (node.loc as { start: { line: number } }).start.line
    : undefined;

  // Object.keys(obj), Object.values(obj), Object.entries(obj), Array.from(...)
  if (
    callee.type === 'MemberExpression' &&
    (callee.object as AnyNode)?.type === 'Identifier'
  ) {
    const objName = (callee.object as AnyNode).name as string;
    const propName = (callee.property as AnyNode)?.name as string;

    if (
      objName === 'Object' &&
      ['keys', 'values', 'entries'].includes(propName)
    ) {
      return {
        name: `Object.${propName}`,
        isBuiltinArrayMethod: false,
        isBuiltinObjectMethod: true,
        timeComplexity: 'O(n)',
        createsNewDataStructure: true,
        line,
      };
    }

    if (objName === 'Array' && propName === 'from') {
      return {
        name: 'Array.from',
        isBuiltinArrayMethod: true,
        isBuiltinObjectMethod: false,
        timeComplexity: 'O(n)',
        createsNewDataStructure: true,
        line,
      };
    }
  }

  // Instance methods: arr.map(), arr.sort(), etc.
  if (callee.type === 'MemberExpression') {
    const prop = callee.property as AnyNode;
    const methodName = prop?.type === 'Identifier' ? (prop.name as string) : '';

    if (methodName === 'sort') {
      return {
        name: 'sort',
        isBuiltinArrayMethod: true,
        isBuiltinObjectMethod: false,
        timeComplexity: 'O(n log n)',
        createsNewDataStructure: false,
        line,
      };
    }

    if (LINEAR_ARRAY_METHODS.has(methodName)) {
      return {
        name: methodName,
        isBuiltinArrayMethod: true,
        isBuiltinObjectMethod: false,
        timeComplexity: 'O(n)',
        createsNewDataStructure: ARRAY_CREATING_METHODS.has(methodName),
        line,
      };
    }
  }

  return null;
}

/**
 * Checks whether a loop condition represents a square root bound (e.g. i * i <= n, j * j <= n, or i <= Math.sqrt(n)).
 */
export function isSquareRootBound(
  testNode: AnyNode | null | undefined
): boolean {
  if (!testNode || testNode.type !== 'BinaryExpression') return false;
  const left = testNode.left as AnyNode;
  const right = testNode.right as AnyNode;

  // Check left: i * i <= n or j * j <= n
  if (left && left.type === 'BinaryExpression' && left.operator === '*') {
    const l1 = left.left as AnyNode;
    const l2 = left.right as AnyNode;
    if (
      l1 &&
      l2 &&
      l1.type === 'Identifier' &&
      l2.type === 'Identifier' &&
      l1.name === l2.name
    ) {
      return true;
    }
  }

  // Check right: i <= Math.sqrt(n)
  if (right && right.type === 'CallExpression') {
    const callee = right.callee as AnyNode;
    if (
      callee &&
      callee.type === 'MemberExpression' &&
      (callee.object as AnyNode)?.name === 'Math' &&
      (callee.property as AnyNode)?.name === 'sqrt'
    ) {
      return true;
    }
  }

  return false;
}

/**
 * Checks whether a loop step takes repeated square roots (e.g. i = Math.floor(Math.sqrt(i))).
 */
export function isDoubleLogarithmicStep(
  node: AnyNode | null | undefined
): boolean {
  if (!node) return false;

  let target = node;
  if (node.type === 'ExpressionStatement') {
    target = node.expression as AnyNode;
  }

  if (target && target.type === 'AssignmentExpression') {
    const right = target.right as AnyNode;
    if (right && right.type === 'CallExpression') {
      const callee = right.callee as AnyNode;
      // Direct Math.sqrt(...)
      if (
        callee?.type === 'MemberExpression' &&
        (callee.object as AnyNode)?.name === 'Math' &&
        (callee.property as AnyNode)?.name === 'sqrt'
      ) {
        return true;
      }
      // Math.floor(Math.sqrt(...))
      if (
        callee?.type === 'MemberExpression' &&
        (callee.object as AnyNode)?.name === 'Math' &&
        (callee.property as AnyNode)?.name === 'floor'
      ) {
        const args = (right.arguments as AnyNode[]) || [];
        if (args.length > 0 && args[0].type === 'CallExpression') {
          const innerCallee = args[0].callee as AnyNode;
          if (
            innerCallee?.type === 'MemberExpression' &&
            (innerCallee.object as AnyNode)?.name === 'Math' &&
            (innerCallee.property as AnyNode)?.name === 'sqrt'
          ) {
            return true;
          }
        }
      }
    }
  }

  return false;
}
