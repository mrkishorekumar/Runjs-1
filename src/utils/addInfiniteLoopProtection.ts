import * as acorn from 'acorn';

/** Injects a private, monotonic iteration budget into every JavaScript loop. */
export function addInfiniteLoopProtection(
  code: string,
  maxIterations = 10000
): string {
  if (!code || !code.trim()) return code;

  const helper = `
const __runjs_check_loop = (() => {
  const counts = Object.create(null);
  return (id, max = ${maxIterations}) => {
    const count = (counts[id] || 0) + 1;
    counts[id] = count;
    if (count > max) {
      throw new RangeError('Potential infinite loop detected: exceeded ' + max + ' iterations.');
    }
  };
})();
`;

  try {
    const program = acorn.parse(code, {
      ecmaVersion: 'latest',
      sourceType: 'script',
      allowAwaitOutsideFunction: true,
      allowReturnOutsideFunction: true,
    }) as unknown as { body: unknown[] };
    const insertions = new Map<number, string[]>();
    let loopId = 0;
    const add = (position: number, text: string) => {
      insertions.set(position, [...(insertions.get(position) || []), text]);
    };
    const visit = (value: unknown) => {
      if (!value || typeof value !== 'object') return;
      const node = value as Record<string, unknown>;
      const type = node.type;
      if (
        type === 'ForStatement' ||
        type === 'ForInStatement' ||
        type === 'ForOfStatement' ||
        type === 'WhileStatement' ||
        type === 'DoWhileStatement'
      ) {
        const body = node.body as Record<string, unknown>;
        const id = loopId++;
        const check = `__runjs_check_loop(${id}, ${maxIterations});`;
        if (body.type === 'BlockStatement') {
          add((body.start as number) + 1, check);
        } else {
          add(body.start as number, `{${check}`);
          add(body.end as number, `}`);
        }
      }
      for (const child of Object.values(node)) {
        if (Array.isArray(child)) child.forEach(visit);
        else visit(child);
      }
    };
    program.body.forEach(visit);

    const points = [...insertions.keys()].sort((a, b) => b - a);
    let transformed = code;
    for (const point of points) {
      transformed =
        transformed.slice(0, point) +
        (insertions.get(point) || []).join('') +
        transformed.slice(point);
    }
    return loopId > 0 ? `${helper}\n${transformed}` : code;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Invalid JavaScript';
    return `${helper}\nthrow new SyntaxError(${JSON.stringify(message)});`;
  }
}
