import { WORKER_BOOTSTRAP } from '../sandboxRunner';

interface TestLog {
  method: string;
  args: unknown[];
}

interface TestRunResult {
  logs: TestLog[];
  result?: unknown;
  error?: string;
  isCleared: boolean;
}

function runScriptInWorkerBootstrap(
  code: string,
  timeoutMs = 5000
): Promise<TestRunResult> {
  return new Promise((resolve) => {
    const logs: TestLog[] = [];
    let isCleared = false;

    const workerScope: Record<string, unknown> = {
      indexedDB: {},
      caches: {},
      setTimeout: setTimeout,
      clearTimeout: clearTimeout,
      setInterval: setInterval,
      clearInterval: clearInterval,
      queueMicrotask: queueMicrotask,
      postMessage: (data: Record<string, unknown>) => {
        if (data.type === 'LOG') {
          logs.push({
            method: data.method as string,
            args: data.args as unknown[],
          });
        } else if (data.type === 'CLEAR') {
          isCleared = true;
        } else if (data.type === 'DONE') {
          resolve({ logs, result: data.result, isCleared });
        } else if (data.type === 'ERROR') {
          resolve({ logs, error: data.error as string, isCleared });
        }
      },
    };
    workerScope.self = workerScope;
    workerScope.globalThis = workerScope;

    const bootstrapFn = new Function('self', 'globalThis', WORKER_BOOTSTRAP);
    bootstrapFn(workerScope, workerScope);

    const onmessage = workerScope.onmessage as (e: {
      data: { code: string; timeoutMs: number };
    }) => void;
    onmessage({ data: { code, timeoutMs } });
  });
}

async function runAllTests() {
  console.log('=== Running Sandbox Runner Event Loop & Async Tests ===\n');

  // Test 1: User Snippet with Async/Await, Microtasks, and Macrotasks
  console.log(
    'Test 1: Full Output Preservation for Complex Event Loop Code...'
  );
  const userSnippet = `
console.log("1");

setTimeout(() => { // 1st callback to Macro - id - 111
  console.log("2");

  Promise.resolve().then(() => { // 8st callback to Micro - id - 188
    console.log("3");
  });
}, 0);

Promise.resolve().then(() => { // 2st callback to Micro - id - 122
  console.log("4");

  setTimeout(() => { // 6st callback to Macro - id - 166
    console.log("5");
  }, 0);
}).then(() => { // // 7st callback to Micro - id - 177
  console.log("6");
});



(async function () {
  console.log("7");

  await Promise.resolve(); // 3st callback to Micro - id - 133

  console.log("8");

  setTimeout(() => {  // 4st callback to Macro - id - 144
    console.log("9");
  }, 0);

  await Promise.resolve(); // 5st callback to Micro - id - 155

  console.log("10");
})();

console.log("11");
`;

  const res1 = await runScriptInWorkerBootstrap(userSnippet);
  const printed1 = res1.logs.map((l) => String(l.args[0]));

  if (res1.logs.length !== 11) {
    throw new Error(
      `Expected exactly 11 logs for user snippet, but got ${res1.logs.length}: [${printed1.join(', ')}]`
    );
  }

  // Ensure all numbers from 1 to 11 are present
  for (let i = 1; i <= 11; i++) {
    if (!printed1.includes(String(i))) {
      throw new Error(
        `Missing expected log output: "${i}" in [${printed1.join(', ')}]`
      );
    }
  }

  // Ensure macrotask outputs (2, 3, 5, 9) executed
  const requiredMacroLogs = ['2', '3', '5', '9'];
  for (const macroLog of requiredMacroLogs) {
    if (!printed1.includes(macroLog)) {
      throw new Error(`Macrotask log "${macroLog}" was dropped!`);
    }
  }

  console.log(`  ✓ All 11 logs captured: ${printed1.join(' ')}`);

  // Test 2: Synchronous Code Execution
  console.log('\nTest 2: Fast Synchronous Code Execution...');
  const startSync = performance.now();
  const res2 = await runScriptInWorkerBootstrap(
    'console.log("sync1"); console.log("sync2");'
  );
  const syncDuration = performance.now() - startSync;
  if (
    res2.logs.length !== 2 ||
    res2.logs[0].args[0] !== 'sync1' ||
    res2.logs[1].args[0] !== 'sync2'
  ) {
    throw new Error(
      `Unexpected synchronous output: ${JSON.stringify(res2.logs)}`
    );
  }
  console.log(
    `  ✓ Synchronous output correct in ${Math.round(syncDuration)}ms`
  );

  // Test 3: Nested Timers and Chaining
  console.log('\nTest 3: Nested and Chained Timers...');
  const res3 = await runScriptInWorkerBootstrap(`
    setTimeout(() => {
      console.log("step 1");
      setTimeout(() => {
        console.log("step 2");
      }, 10);
    }, 10);
  `);
  const logs3 = res3.logs.map((l) => l.args[0]);
  if (logs3.length !== 2 || logs3[0] !== 'step 1' || logs3[1] !== 'step 2') {
    throw new Error(
      `Nested timer failed: expected ["step 1", "step 2"], got: ${JSON.stringify(logs3)}`
    );
  }
  console.log(`  ✓ Nested timers drained accurately: ${logs3.join(' -> ')}`);

  // Test 4: Intervals with Clean Termination
  console.log('\nTest 4: setInterval and clearInterval Tracking...');
  const res4 = await runScriptInWorkerBootstrap(`
    let counter = 0;
    const intervalId = setInterval(() => {
      counter++;
      console.log("tick " + counter);
      if (counter === 3) {
        clearInterval(intervalId);
      }
    }, 10);
  `);
  const logs4 = res4.logs.map((l) => l.args[0]);
  if (
    logs4.length !== 3 ||
    logs4[0] !== 'tick 1' ||
    logs4[1] !== 'tick 2' ||
    logs4[2] !== 'tick 3'
  ) {
    throw new Error(
      `Interval tracking failed: expected 3 ticks, got: ${JSON.stringify(logs4)}`
    );
  }
  console.log(
    `  ✓ Intervals cleanly captured and finished: ${logs4.join(', ')}`
  );

  // Test 5: Top-Level Await Support
  console.log('\nTest 5: Top-Level Await Execution...');
  const res5 = await runScriptInWorkerBootstrap(`
    const data = await Promise.resolve({ status: "success", code: 200 });
    console.log(data.status, data.code);
  `);
  if (res5.logs.length !== 1 || res5.logs[0].args.join(' ') !== 'success 200') {
    throw new Error(`Top-level await failed: ${JSON.stringify(res5.logs)}`);
  }
  console.log(
    `  ✓ Top-level await executed successfully: ${res5.logs[0].args.join(' ')}`
  );

  // Test 6: clearTimeout Cancels Execution
  console.log('\nTest 6: clearTimeout Cancels Execution Properly...');
  const res6 = await runScriptInWorkerBootstrap(`
    const id = setTimeout(() => {
      console.log("SHOULD NOT APPEAR");
    }, 10);
    clearTimeout(id);
    console.log("cancelled");
  `);
  const logs6 = res6.logs.map((l) => l.args[0]);
  if (logs6.length !== 1 || logs6[0] !== 'cancelled') {
    throw new Error(`clearTimeout failed: ${JSON.stringify(logs6)}`);
  }
  console.log(`  ✓ Cancelled timer successfully prevented from executing`);

  // Test 7: console.clear() Emits CLEAR Message
  console.log('\nTest 7: console.clear() Emits CLEAR Message...');
  const res7 = await runScriptInWorkerBootstrap(`
    console.log("before clear");
    console.clear();
    console.log("after clear");
  `);
  if (!res7.isCleared) {
    throw new Error(`console.clear() did not trigger CLEAR message`);
  }
  console.log(`  ✓ console.clear() correctly sent CLEAR message`);

  // Test 8: Error Caught Inside Async Timer
  console.log('\nTest 8: Error Handling Inside Async Callback...');
  const res8 = await runScriptInWorkerBootstrap(`
    setTimeout(() => {
      throw new Error("Deliberate timer failure");
    }, 0);
  `);
  if (!res8.error && !res8.logs.some((l) => l.method === 'error')) {
    throw new Error(`Error inside timer was not reported`);
  }
  console.log(`  ✓ Asynchronous error properly caught and reported`);

  console.log('\n=== All Sandbox Runner tests passed successfully! ===\n');
}

runAllTests();
