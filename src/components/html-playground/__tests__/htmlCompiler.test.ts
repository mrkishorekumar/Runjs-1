import fs from 'fs';
import path from 'path';
import vm from 'vm';
import {
  compileHtmlDocument,
  addHtmlLoopProtection,
  SENDER_KEY,
} from '../../../utils/htmlCompiler';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

console.log('=== Testing HTML Playground, Compiler & CSP Consistency ===\n');

// 1. Validate CSP across index.html, public/_headers, and src/worker.ts
{
  const rootDir = process.cwd();
  const indexHtml = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf-8');
  const headers = fs.readFileSync(
    path.join(rootDir, 'public/_headers'),
    'utf-8'
  );
  const worker = fs.readFileSync(path.join(rootDir, 'src/worker.ts'), 'utf-8');

  // Extract CSP strings
  const cspMetaMatch = indexHtml.match(
    /http-equiv="Content-Security-Policy"\s+content="([^"]+)"/i
  );
  assert(
    Boolean(cspMetaMatch),
    'index.html must contain Content-Security-Policy meta tag'
  );
  const indexCsp = cspMetaMatch![1];

  const headersCspMatch = headers.match(
    /Content-Security-Policy:\s*([^\r\n]+)/
  );
  assert(
    Boolean(headersCspMatch),
    'public/_headers must contain Content-Security-Policy header'
  );
  const headersCsp = headersCspMatch![1];

  assert(
    worker.includes("'Content-Security-Policy'"),
    'src/worker.ts must configure Content-Security-Policy'
  );

  // Verify 'unsafe-inline' is enabled for script-src and script-src-elem in all configs
  assert(
    indexCsp.includes("script-src 'self' 'unsafe-inline'") &&
      indexCsp.includes("script-src-elem 'self' 'unsafe-inline'"),
    "index.html CSP must contain 'unsafe-inline' in script-src and script-src-elem to allow playground execution"
  );
  assert(
    headersCsp.includes("script-src 'self' 'unsafe-inline'") &&
      headersCsp.includes("script-src-elem 'self' 'unsafe-inline'"),
    "public/_headers CSP must contain 'unsafe-inline' in script-src and script-src-elem"
  );
  assert(
    worker.includes("script-src 'self' 'unsafe-inline'") &&
      worker.includes("script-src-elem 'self' 'unsafe-inline'"),
    "src/worker.ts CSP must contain 'unsafe-inline' in script-src and script-src-elem"
  );

  // Ensure no sha256 hashes are present in script-src (which would cause browsers to ignore unsafe-inline)
  assert(
    !indexCsp.includes("'sha256-"),
    "index.html CSP must NOT contain static sha256 hashes in script-src as they disable 'unsafe-inline'"
  );
  assert(
    !headersCsp.includes("'sha256-"),
    'public/_headers CSP must NOT contain static sha256 hashes in script-src'
  );
  assert(
    !worker.includes("'sha256-"),
    'src/worker.ts CSP must NOT contain static sha256 hashes in script-src'
  );

  console.log(
    '  ✓ Verified CSP consistency across index.html, public/_headers, and worker.ts'
  );
  console.log(
    "  ✓ Verified 'unsafe-inline' is active and no conflicting sha256 hashes exist"
  );
}

// 2. Validate HTML Compiler Output
{
  const DEFAULT_HTML = `<div class="container">
  <h1>Hello RunJS</h1>
  <p>Start coding with HTML, CSS, and JavaScript...</p>
  <button id="counter-btn">Clicks: 0</button>
</div>`;
  const DEFAULT_CSS = `body { padding: 2rem; background: #f8fafc; }`;
  const DEFAULT_JS = `let count = 0;
const button = document.getElementById("counter-btn");
if (button) {
  button.addEventListener("click", () => {
    count++;
    button.textContent = \`Clicks: \${count}\`;
    console.log(\`Button clicked! New count: \${count}\`);
  });
}`;

  const compiled = compileHtmlDocument({
    html: DEFAULT_HTML,
    css: DEFAULT_CSS,
    javascript: DEFAULT_JS,
    enableLoopProtection: true,
  });

  assert(
    compiled.includes(SENDER_KEY),
    'Compiled document must include SENDER_KEY in harness script'
  );
  assert(
    compiled.includes('<style id="runjs-user-styles">'),
    'Compiled document must include user styles'
  );
  assert(
    compiled.includes('<script id="runjs-user-scripts">'),
    'Compiled document must include user script tag'
  );
  assert(
    compiled.includes('Clicks: 0'),
    'Compiled document must contain HTML boilerplate'
  );
  assert(
    compiled.includes('counter-btn'),
    'Compiled document must contain button ID'
  );

  console.log(
    '  ✓ Verified compileHtmlDocument output structure and harness script injection'
  );
}

// 3. Test Full Boilerplate Interactivity via VM DOM Simulation
{
  const DEFAULT_JS = `console.log("Hello from RunJS HTML/CSS/JS Playground!");

let count = 0;
const button = document.getElementById("counter-btn");

if (button) {
  button.addEventListener("click", () => {
    count++;
    button.textContent = \`Clicks: \${count}\`;
    console.log(\`Button clicked! New count: \${count}\`);
  });
}`;

  const logs: string[] = [];
  const eventListeners: Record<string, (() => void)[]> = {};

  const mockButton = {
    id: 'counter-btn',
    textContent: 'Clicks: 0',
    addEventListener(event: string, callback: () => void) {
      if (!eventListeners[event]) eventListeners[event] = [];
      eventListeners[event].push(callback);
    },
    click() {
      const listeners = eventListeners['click'] || [];
      listeners.forEach((fn) => fn());
    },
  };

  const mockDocument = {
    getElementById(id: string) {
      if (id === 'counter-btn') return mockButton;
      return null;
    },
  };

  const mockConsole = {
    log: (...args: unknown[]) => {
      logs.push(args.map(String).join(' '));
    },
    error: (...args: unknown[]) => {
      logs.push(`[error] ${args.map(String).join(' ')}`);
    },
  };

  const sandbox = {
    document: mockDocument,
    console: mockConsole,
    window: {},
  };

  vm.createContext(sandbox);
  vm.runInContext(DEFAULT_JS, sandbox);

  assert(logs.length === 1, 'Script must run and emit initial log');
  assert(
    logs[0] === 'Hello from RunJS HTML/CSS/JS Playground!',
    'Initial log message matches'
  );
  assert(
    eventListeners['click']?.length === 1,
    'Click listener must be registered on counter-btn'
  );

  // Simulate first click
  mockButton.click();
  assert(
    mockButton.textContent === 'Clicks: 1',
    'Button text must increment to Clicks: 1'
  );
  assert(
    logs[1] === 'Button clicked! New count: 1',
    'Click handler must log updated count'
  );

  // Simulate second click
  mockButton.click();
  assert(
    mockButton.textContent === 'Clicks: 2',
    'Button text must increment to Clicks: 2'
  );
  assert(
    logs[2] === 'Button clicked! New count: 2',
    'Click handler must log updated count 2'
  );

  console.log(
    '  ✓ Verified button click handler increments counter and logs to console'
  );
}

// 4. Test Infinite Loop Protection
{
  const infiniteLoopCode = `
let i = 0;
while (true) {
  i++;
}
`;
  const protectedCode = addHtmlLoopProtection(infiniteLoopCode, 100);
  assert(
    protectedCode.includes('__runjs_check_loop'),
    'Protected code must include loop guard'
  );

  let errorThrown = false;
  try {
    const sandbox = {
      Date,
      Map,
      RangeError,
      console,
    };
    vm.createContext(sandbox);
    vm.runInContext(protectedCode, sandbox);
  } catch (err) {
    if (err instanceof RangeError && err.message.includes('infinite loop')) {
      errorThrown = true;
    }
  }

  assert(errorThrown, 'Loop protection must catch infinite while loop');
  console.log(
    '  ✓ Verified infinite loop protection in HTML playground JavaScript'
  );
}

console.log('\nAll HTML Playground tests passed successfully! 🎉');
