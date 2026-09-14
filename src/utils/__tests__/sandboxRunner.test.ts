// @ts-expect-error node:vm is built into Node.js test environment
import * as nodeVm from 'node:vm';
import { WORKER_BOOTSTRAP } from '../sandboxRunner';
import { addInfiniteLoopProtection } from '../addInfiniteLoopProtection';

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
      performance: performance,
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

    const vmModule = nodeVm as
      ({ default?: typeof nodeVm } & typeof nodeVm) | undefined;
    const vmRunner = vmModule?.default || vmModule;
    if (
      typeof vmRunner !== 'undefined' &&
      typeof vmRunner.createContext === 'function'
    ) {
      const context = vmRunner.createContext(workerScope);
      vmRunner.runInContext(WORKER_BOOTSTRAP, context);
      const onmessage = context.onmessage as (e: {
        data: { code: string; timeoutMs: number };
      }) => void;
      onmessage({ data: { code, timeoutMs } });
    } else {
      const bootstrapFn = new Function('self', 'globalThis', WORKER_BOOTSTRAP);
      bootstrapFn(workerScope, workerScope);
      const onmessage = workerScope.onmessage as (e: {
        data: { code: string; timeoutMs: number };
      }) => void;
      onmessage({ data: { code, timeoutMs } });
    }
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

  // Test 9: User's Example Snippet - Array, String, Number Prototypes
  console.log(
    '\nTest 9: Built-in Prototype Extensions (Array, String, Number)...'
  );
  const userPromptSnippet = `
    Array.prototype.myMap = function () {
      return this.length;
    };

    String.prototype.myCustomMethod = function () {
      return this.toUpperCase();
    };

    Number.prototype.myCustomMethod = function () {
      return this * 2;
    };

    console.log([1, 2, 3].myMap());
    console.log("hello".myCustomMethod());
    console.log((10).myCustomMethod());
  `;
  try {
    const res9 = await runScriptInWorkerBootstrap(userPromptSnippet);
    if (res9.error) {
      throw new Error(`Unexpected error in Test 9: ${res9.error}`);
    }
    const logs9 = res9.logs.map((l) => l.args[0]);
    if (
      logs9.length !== 3 ||
      logs9[0] !== 3 ||
      logs9[1] !== 'HELLO' ||
      logs9[2] !== 20
    ) {
      throw new Error(
        `Test 9 failed: expected [3, "HELLO", 20], got ${JSON.stringify(logs9)}`
      );
    }
    console.log(`  ✓ Prototype extensions executed: [${logs9.join(', ')}]`);
  } finally {
    delete (Array.prototype as Record<string, unknown>).myMap;
    delete (String.prototype as Record<string, unknown>).myCustomMethod;
    delete (Number.prototype as Record<string, unknown>).myCustomMethod;
  }

  // Test 10: All Built-in Prototypes (Object, Function, Date, RegExp, Map, Set)
  console.log(
    '\nTest 10: Prototype Extensions across Object, Function, Date, RegExp, Map, Set...'
  );
  const allBuiltinsSnippet = `
    Object.prototype.customObjFn = function() { return 'obj_ok'; };
    Function.prototype.customFnMethod = function() { return 'fn_ok'; };
    Date.prototype.customDateMethod = function() { return 2026; };
    RegExp.prototype.customRegexMethod = function() { return 're_' + this.source; };
    Map.prototype.customMapMethod = function() { return 'map_' + this.size; };
    Set.prototype.customSetMethod = function() { return 'set_' + this.size; };

    console.log(({ a: 1 }).customObjFn());
    console.log((() => {}).customFnMethod());
    console.log(new Date().customDateMethod());
    console.log(/hello/.customRegexMethod());
    const m = new Map(); m.set('x', 1);
    console.log(m.customMapMethod());
    const s = new Set([1, 2]);
    console.log(s.customSetMethod());
  `;
  try {
    const res10 = await runScriptInWorkerBootstrap(allBuiltinsSnippet);
    if (res10.error) {
      throw new Error(`Unexpected error in Test 10: ${res10.error}`);
    }
    const logs10 = res10.logs.map((l) => l.args[0]);
    const expected10 = ['obj_ok', 'fn_ok', 2026, 're_hello', 'map_1', 'set_2'];
    if (
      logs10.length !== 6 ||
      !expected10.every((val, idx) => logs10[idx] === val)
    ) {
      throw new Error(
        `Test 10 failed: expected ${JSON.stringify(expected10)}, got ${JSON.stringify(logs10)}`
      );
    }
    console.log(`  ✓ Built-in prototypes verified: [${logs10.join(', ')}]`);
  } finally {
    delete (Object.prototype as Record<string, unknown>).customObjFn;
    delete (Function.prototype as Record<string, unknown>).customFnMethod;
    delete (Date.prototype as Record<string, unknown>).customDateMethod;
    delete (RegExp.prototype as Record<string, unknown>).customRegexMethod;
    delete (Map.prototype as Record<string, unknown>).customMapMethod;
    delete (Set.prototype as Record<string, unknown>).customSetMethod;
  }

  // Test 11: Custom User-Defined Classes and Prototypes
  console.log('\nTest 11: Custom User-Defined Classes and Prototype Chains...');
  const userClassesSnippet = `
    class Vehicle {
      constructor(name) { this.name = name; }
    }
    Vehicle.prototype.honk = function() { return this.name + ' goes beep!'; };

    class Car extends Vehicle {}
    Car.prototype.wheels = function() { return 4; };

    const car = new Car('Sedan');
    console.log(car.honk());
    console.log(car.wheels());
  `;
  const res11 = await runScriptInWorkerBootstrap(userClassesSnippet);
  if (res11.error) {
    throw new Error(`Unexpected error in Test 11: ${res11.error}`);
  }
  const logs11 = res11.logs.map((l) => l.args[0]);
  if (logs11[0] !== 'Sedan goes beep!' || logs11[1] !== 4) {
    throw new Error(
      `Test 11 failed: expected ["Sedan goes beep!", 4], got ${JSON.stringify(logs11)}`
    );
  }
  console.log(
    `  ✓ User class prototype inheritance verified: [${logs11.join(', ')}]`
  );

  // Test 12: Prototype Modifications Persisting Across Async Statements
  console.log('\nTest 12: Prototype Persistence Across Async Statements...');
  const asyncPersistenceSnippet = `
    Array.prototype.asyncAdd = function(val) {
      const res = [];
      for (let i = 0; i < this.length; i++) res[i] = this[i];
      res[res.length] = val;
      return res;
    };

    await Promise.resolve();
    console.log([1].asyncAdd(2));

    setTimeout(() => {
      console.log([3].asyncAdd(4));
    }, 10);
  `;
  try {
    const res12 = await runScriptInWorkerBootstrap(asyncPersistenceSnippet);
    if (res12.error) {
      throw new Error(`Unexpected error in Test 12: ${res12.error}`);
    }
    const logs12 = res12.logs.map((l) => JSON.stringify(l.args[0]));
    if (logs12.length !== 2 || logs12[0] !== '[1,2]' || logs12[1] !== '[3,4]') {
      throw new Error(
        `Test 12 failed: expected ["[1,2]", "[3,4]"], got ${JSON.stringify(logs12)}`
      );
    }
    console.log(
      `  ✓ Async prototype persistence verified: ${logs12.join(' -> ')}`
    );
  } finally {
    delete (Array.prototype as Record<string, unknown>).asyncAdd;
  }

  // Test 13: Prototype Modifications Alongside Loop Protection
  console.log(
    '\nTest 13: Prototype Modifications alongside Infinite Loop Protection...'
  );
  const loopProtectionSnippet = `
    Map.prototype.customTag = function() { return 'custom-map-tag'; };
    Array.prototype.customSum = function() {
      let total = 0;
      for (let i = 0; i < this.length; i++) {
        total += this[i];
      }
      return total;
    };

    let total = 0;
    for (let i = 1; i <= 5; i++) {
      total += i;
    }

    const testMap = new Map();
    console.log('sum:', total);
    console.log('tag:', testMap.customTag());
    console.log('arrSum:', [10, 20, 30].customSum());
  `;
  try {
    const transformedCode = addInfiniteLoopProtection(loopProtectionSnippet);
    const res13 = await runScriptInWorkerBootstrap(transformedCode);
    if (res13.error) {
      throw new Error(`Unexpected error in Test 13: ${res13.error}`);
    }
    const logs13 = res13.logs.map((l) => l.args.join(' '));
    if (
      logs13.length !== 3 ||
      logs13[0] !== 'sum: 15' ||
      logs13[1] !== 'tag: custom-map-tag' ||
      logs13[2] !== 'arrSum: 60'
    ) {
      throw new Error(`Test 13 failed, got: ${JSON.stringify(logs13)}`);
    }
    console.log(
      `  ✓ Loop protection with modified prototypes passed: ${logs13.join(' | ')}`
    );
  } finally {
    delete (Map.prototype as Record<string, unknown>).customTag;
    delete (Array.prototype as Record<string, unknown>).customSum;
  }

  // Test 14: Runner Resilience Against Aggressive Prototype Overrides
  console.log(
    '\nTest 14: Runner Resilience against Prototype Overrides (map, slice, apply)...'
  );
  const aggressiveOverrideSnippet = `
    const origMap = Array.prototype.map;
    const origSlice = Array.prototype.slice;
    const origApply = Function.prototype.apply;

    // Aggressively modify native prototype methods
    Array.prototype.map = function() { return 'user_overridden_map'; };
    Array.prototype.slice = function() { return ['user_overridden_slice']; };
    Function.prototype.apply = function() { return 'user_overridden_apply'; };

    console.log("runner output intact");

    setTimeout(() => {
      console.log("runner async intact");
      // Restore before finishing
      Array.prototype.map = origMap;
      Array.prototype.slice = origSlice;
      Function.prototype.apply = origApply;
    }, 10);
  `;
  const res14 = await runScriptInWorkerBootstrap(aggressiveOverrideSnippet);
  if (res14.error) {
    throw new Error(`Unexpected error in Test 14: ${res14.error}`);
  }
  const logs14 = res14.logs.map((l) => l.args[0]);
  if (
    logs14.length !== 2 ||
    logs14[0] !== 'runner output intact' ||
    logs14[1] !== 'runner async intact'
  ) {
    throw new Error(`Test 14 failed, got: ${JSON.stringify(logs14)}`);
  }
  console.log(
    `  ✓ Runner internal mechanics remained uncorrupted under prototype overrides`
  );

  // Test 15: Adding, Modifying, and Deleting Prototype Properties
  console.log(
    '\nTest 15: Adding, Modifying, and Deleting Prototype Properties & Symbols...'
  );
  const addModifyDeleteSnippet = `
    // 1. Add and delete
    Array.prototype.tempMethod = function() { return 100; };
    console.log('before delete:', [].tempMethod());
    delete Array.prototype.tempMethod;
    console.log('after delete:', typeof [].tempMethod);

    // 2. Modify existing method
    const originalTrim = String.prototype.trim;
    String.prototype.trim = function() {
      return 'TRIMMED:' + originalTrim.call(this);
    };
    console.log('hello world   '.trim());

    // 3. Symbol property on prototype
    const customSymbol = Symbol('custom');
    Object.prototype[customSymbol] = function() { return 'symbol-prop-ok'; };
    console.log(({})[customSymbol]());
  `;
  const res15 = await runScriptInWorkerBootstrap(addModifyDeleteSnippet);
  if (res15.error) {
    throw new Error(`Unexpected error in Test 15: ${res15.error}`);
  }
  const logs15 = res15.logs.map((l) => l.args.join(' '));
  if (
    logs15.length !== 4 ||
    logs15[0] !== 'before delete: 100' ||
    logs15[1] !== 'after delete: undefined' ||
    logs15[2] !== 'TRIMMED:hello world' ||
    logs15[3] !== 'symbol-prop-ok'
  ) {
    throw new Error(`Test 15 failed, got: ${JSON.stringify(logs15)}`);
  }
  console.log(
    `  ✓ Add, modify, delete, and symbols verified: ${logs15.join(' | ')}`
  );

  // Test 16: Correct 'this' Binding and Method Chaining
  console.log('\nTest 16: Correct this Binding & Method Chaining...');
  const thisBindingSnippet = `
    Number.prototype.double = function() {
      return Number(this) * 2;
    };
    Number.prototype.add = function(n) {
      return Number(this) + n;
    };
    String.prototype.wrap = function(prefix, suffix) {
      return prefix + this + suffix;
    };
    Array.prototype.chainSquare = function() {
      const out = [];
      for (let i = 0; i < this.length; i++) out[i] = this[i] * this[i];
      return out;
    };

    console.log((5).double().add(10));
    console.log('world'.wrap('hello, ', '!'));
    console.log([1, 2, 3].chainSquare());
  `;
  const res16 = await runScriptInWorkerBootstrap(thisBindingSnippet);
  if (res16.error) {
    throw new Error(`Unexpected error in Test 16: ${res16.error}`);
  }
  const logs16 = res16.logs.map((l) => JSON.stringify(l.args[0]));
  if (
    logs16.length !== 3 ||
    logs16[0] !== '20' ||
    logs16[1] !== '"hello, world!"' ||
    logs16[2] !== '[1,4,9]'
  ) {
    throw new Error(`Test 16 failed, got: ${JSON.stringify(logs16)}`);
  }
  console.log(
    `  ✓ 'this' binding and chaining verified: ${logs16.join(' | ')}`
  );

  // Test 17: No Unwanted Leakage Between Consecutive Runs
  console.log('\nTest 17: No Leakage Between Consecutive Executions...');
  const run1Snippet = `
    Array.prototype.run1Method = function() { return 'from run 1'; };
    Object.prototype.run1Prop = 'run 1 object prop';
    String.prototype.run1Str = function() { return 'run 1 str'; };
    console.log([].run1Method());
    console.log(({}).run1Prop);
  `;
  const res17_1 = await runScriptInWorkerBootstrap(run1Snippet);
  if (res17_1.error) {
    throw new Error(`Unexpected error in Test 17 Run 1: ${res17_1.error}`);
  }
  if (res17_1.logs[0].args[0] !== 'from run 1') {
    throw new Error(`Test 17 Run 1 failed`);
  }

  // Second run simulating pressing "Run" again in playground
  const run2Snippet = `
    console.log(typeof [].run1Method);
    console.log(typeof ({}).run1Prop);
    console.log(typeof ''.run1Str);
  `;
  const res17_2 = await runScriptInWorkerBootstrap(run2Snippet);
  if (res17_2.error) {
    throw new Error(`Unexpected error in Test 17 Run 2: ${res17_2.error}`);
  }
  const logs17_2 = res17_2.logs.map((l) => l.args[0]);
  if (
    logs17_2.length !== 3 ||
    logs17_2[0] !== 'undefined' ||
    logs17_2[1] !== 'undefined' ||
    logs17_2[2] !== 'undefined'
  ) {
    throw new Error(
      `Test 17 failed: Prototype leakage detected between executions! ${JSON.stringify(logs17_2)}`
    );
  }
  console.log(
    `  ✓ Clean isolation between separate runs verified (no prototype leakage)`
  );

  // Test 18: Security Model Verification (Stripped Host APIs)
  console.log('\nTest 18: Security Model Verification (Stripped Host APIs)...');
  const securitySnippet = `
    console.log('fetch:', typeof fetch);
    console.log('indexedDB:', typeof indexedDB);
    console.log('caches:', typeof caches);
    console.log('XMLHttpRequest:', typeof XMLHttpRequest);
    console.log('importScripts:', typeof importScripts);
    console.log('WebSocket:', typeof WebSocket);
  `;
  const res18 = await runScriptInWorkerBootstrap(securitySnippet);
  if (res18.error) {
    throw new Error(`Unexpected error in Test 18: ${res18.error}`);
  }
  const logs18 = res18.logs.map((l) => l.args.join(' '));
  for (const entry of logs18) {
    if (!entry.endsWith(': undefined')) {
      throw new Error(`Security breach: API not stripped: ${entry}`);
    }
  }
  console.log(
    `  ✓ All host APIs securely stripped in worker realm: ${logs18.join(' | ')}`
  );

  console.log('\n=== All Sandbox Runner tests passed successfully! ===\n');
}

runAllTests();
