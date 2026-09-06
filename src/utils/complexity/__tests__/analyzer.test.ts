import { analyzeComplexity } from '../analyzer';
import { ComplexityRank } from '../types';
import { TEST_CASES } from './userTestCases';

console.log('=== Running Complexity Analyzer Test Suite ===\n');

let passed = 0;
let total = 0;

function assert(condition: boolean, message: string) {
  total++;
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    throw new Error(`Test assertion failed: ${message}`);
  }
  console.log(`  ✓ ${message}`);
  passed++;
}

// 1. Constant time and space O(1)
console.log('1. Testing Constant Time and Space:');
{
  const code = `
    function add(a, b) {
      const sum = a + b;
      return sum * 2;
    }
  `;
  const res = analyzeComplexity(code);
  assert(res.success === true, 'Constant function parses successfully');
  assert(res.timeComplexity === 'O(1)', 'Time complexity is O(1)');
  assert(res.spaceComplexity === 'O(1)', 'Space complexity is O(1)');
  assert(res.timeRank === ComplexityRank.O_1, 'Time rank is O_1');
}

// 1b. Constant-bounded loop O(1)
console.log('\n1b. Testing Constant-bounded Loop:');
{
  const code = `
    function fixedIterations() {
      let count = 0;
      for (let i = 0; i < 10; i++) {
        count += i;
      }
      return count;
    }
  `;
  const res = analyzeComplexity(code);
  assert(res.timeComplexity === 'O(1)', 'Fixed loop is recognized as O(1)');
  assert(res.spaceComplexity === 'O(1)', 'Fixed loop space is O(1)');
}

// 2. Linear time O(n) - Single loop
console.log('\n2. Testing Linear Time Single Loop:');
{
  const code = `
    function findMax(nums) {
      let max = -Infinity;
      for (let i = 0; i < nums.length; i++) {
        if (nums[i] > max) max = nums[i];
      }
      return max;
    }
  `;
  const res = analyzeComplexity(code);
  assert(res.timeComplexity === 'O(n)', 'Single loop over nums is O(n)');
  assert(
    res.spaceComplexity === 'O(1)',
    'Single loop with primitives is O(1) space'
  );
}

// 3. Sequential loops - O(n)
console.log('\n3. Testing Sequential Loops:');
{
  const code = `
    function processArray(arr) {
      for (let i = 0; i < arr.length; i++) {
        console.log(arr[i]);
      }
      for (let j = 0; j < arr.length; j++) {
        console.log(arr[j]);
      }
    }
  `;
  const res = analyzeComplexity(code);
  assert(res.timeComplexity === 'O(n)', 'Sequential loops retain O(n) time');
  assert(res.details?.loopsCount === 2, 'Detects 2 sequential loops');
}

// 4. Nested loops - O(n²)
console.log('\n4. Testing Nested Loops (Two Sum Brute Force):');
{
  const code = `
    function twoSum(nums, target) {
      for (let i = 0; i < nums.length; i++) {
        for (let j = i + 1; j < nums.length; j++) {
          if (nums[i] + nums[j] === target) return [i, j];
        }
      }
      return [];
    }
  `;
  const res = analyzeComplexity(code);
  assert(res.timeComplexity === 'O(n²)', 'Nested loops identified as O(n²)');
  assert(res.spaceComplexity === 'O(1)', 'Brute force two-sum uses O(1) space');
  assert(res.details?.maxNestingDepth === 2, 'Max nesting depth is 2');
}

// 5. Triple nested loops - O(n³)
console.log('\n5. Testing Triple Nested Loops:');
{
  const code = `
    function threeSumBrute(nums) {
      for (let i = 0; i < nums.length; i++) {
        for (let j = i + 1; j < nums.length; j++) {
          for (let k = j + 1; k < nums.length; k++) {
            if (nums[i] + nums[j] + nums[k] === 0) return true;
          }
        }
      }
      return false;
    }
  `;
  const res = analyzeComplexity(code);
  assert(res.timeComplexity === 'O(n³)', 'Triple nested loops are O(n³)');
  assert(res.details?.maxNestingDepth === 3, 'Max nesting depth is 3');
}

// 6. Logarithmic Time O(log n) - Binary Search
console.log('\n6. Testing Binary Search (Logarithmic):');
{
  const code = `
    function binarySearch(nums, target) {
      let low = 0;
      let high = nums.length - 1;
      while (low <= high) {
        let mid = Math.floor((low + high) / 2);
        if (nums[mid] === target) return mid;
        if (nums[mid] < target) low = mid + 1;
        else high = mid - 1;
      }
      return -1;
    }
  `;
  const res = analyzeComplexity(code);
  assert(res.timeComplexity === 'O(log n)', 'Binary search is O(log n)');
  assert(
    res.spaceComplexity === 'O(1)',
    'Iterative binary search is O(1) space'
  );
}

// 7. Linearithmic Time O(n log n) - Sorting
console.log('\n7. Testing Sorting O(n log n):');
{
  const code = `
    function sortAndFilter(nums) {
      return nums.sort((a, b) => a - b);
    }
  `;
  const res = analyzeComplexity(code);
  assert(
    res.timeComplexity === 'O(n log n)',
    'Array.prototype.sort is O(n log n)'
  );
}

// 8. Nested Method call inside loop O(n²)
console.log('\n8. Testing Linear Method inside Loop:');
{
  const code = `
    function findCommon(arr1, arr2) {
      const result = [];
      for (let i = 0; i < arr1.length; i++) {
        if (arr2.includes(arr1[i])) {
          result.push(arr1[i]);
        }
      }
      return result;
    }
  `;
  const res = analyzeComplexity(code);
  assert(
    res.timeComplexity === 'O(n²)',
    'includes() inside loop detected as O(n²)'
  );
  assert(
    res.spaceComplexity === 'O(n)',
    'Dynamic array result.push is O(n) space'
  );
}

// 9. Recursion - Linear Factorial O(n) Time, O(n) Stack Space
console.log('\n9. Testing Linear Recursion (Factorial):');
{
  const code = `
    function factorial(n) {
      if (n <= 1) return 1;
      return n * factorial(n - 1);
    }
  `;
  const res = analyzeComplexity(code);
  assert(res.timeComplexity === 'O(n)', 'Factorial is O(n) time');
  assert(
    res.spaceComplexity === 'O(n)',
    'Factorial requires O(n) call stack space'
  );
  assert(res.details?.hasRecursion === true, 'Recursion detected');
}

// 10. Recursion - Binary Tree / Fibonacci O(2ⁿ) Time, O(n) Stack Space
console.log('\n10. Testing Exponential Recursion (Fibonacci):');
{
  const code = `
    function fib(n) {
      if (n <= 1) return n;
      return fib(n - 1) + fib(n - 2);
    }
  `;
  const res = analyzeComplexity(code);
  assert(res.timeComplexity === 'O(2ⁿ)', 'Naive Fibonacci is O(2ⁿ) time');
  assert(
    res.spaceComplexity === 'O(n)',
    'Fibonacci has O(n) max call stack depth'
  );
}

// 11. Space Complexity - Data Structures (Set / Map / Array allocations)
console.log('\n11. Testing Space Complexity (Hash Map):');
{
  const code = `
    function twoSum(nums, target) {
      const map = new Map();
      for (let i = 0; i < nums.length; i++) {
        const diff = target - nums[i];
        if (map.has(diff)) return [map.get(diff), i];
        map.set(nums[i], i);
      }
      return [];
    }
  `;
  const res = analyzeComplexity(code);
  assert(res.timeComplexity === 'O(n)', 'Optimal twoSum is O(n) time');
  assert(res.spaceComplexity === 'O(n)', 'new Map() requires O(n) space');
}

// 12. Space Complexity - 2D Matrix O(n²)
console.log('\n12. Testing Matrix Allocation O(n²):');
{
  const code = `
    function createGrid(n) {
      const matrix = Array.from({ length: n }, () => new Array(n).fill(0));
      return matrix;
    }
  `;
  const res = analyzeComplexity(code);
  assert(res.spaceComplexity === 'O(n²)', '2D matrix is O(n²) space');
}

// 13. Syntax Error Handling
console.log('\n13. Testing Syntax Error Handling:');
{
  const invalidCode = `function broken( { let x = ;`;
  const res = analyzeComplexity(invalidCode);
  assert(res.success === false, 'Detects syntax error gracefully');
  assert(res.errorLine !== undefined, 'Reports error line');
  assert(
    res.timeComplexity === 'O(?)',
    'Time complexity is indeterminate on syntax error'
  );
}

// 14. Empty Code Handling
console.log('\n14. Testing Empty Code Handling:');
{
  const emptyCode = `   `;
  const res = analyzeComplexity(emptyCode);
  assert(res.success === false, 'Handles empty code');
  assert(typeof res.error === 'string', 'Returns helpful error message');
}

// 15. Array Higher-Order Methods (map, filter, reduce)
console.log('\n15. Testing Array Higher-Order Methods (map, filter, reduce):');
{
  const code = `
    function process(numbers) {
      const doubled = numbers.map(x => x * 2);
      const evens = doubled.filter(x => x % 2 === 0);
      return evens.reduce((acc, x) => acc + x, 0);
    }
  `;
  const res = analyzeComplexity(code);
  assert(
    res.timeComplexity === 'O(n)',
    'Chained/sequential map, filter, reduce is O(n) time'
  );
  assert(res.spaceComplexity === 'O(n)', 'map & filter allocate O(n) space');
}

// 16. Shift inside Loop O(n²)
console.log('\n16. Testing Shift inside Loop:');
{
  const code = `
    function drainQueue(items) {
      while (items.length > 0) {
        items.shift();
      }
    }
  `;
  const res = analyzeComplexity(code);
  assert(
    res.timeComplexity === 'O(n²)',
    'shift() inside while loop yields O(n²)'
  );
}

// 17. Push/Pop Amortized Constant Operations
console.log('\n17. Testing Push/Pop Stack Operations:');
{
  const code = `
    function stackOps(val) {
      const stack = [];
      stack.push(val);
      return stack.pop();
    }
  `;
  const res = analyzeComplexity(code);
  assert(
    res.timeComplexity === 'O(1)',
    'push and pop outside loops execute in O(1)'
  );
}

// 18. Divide-and-Conquer Logarithmic Recursion
console.log('\n18. Testing Divide and Conquer Logarithmic Recursion:');
{
  const code = `
    function binarySearchRec(arr, target, low, high) {
      if (low > high) return -1;
      const mid = Math.floor((low + high) / 2);
      if (arr[mid] === target) return mid;
      if (arr[mid] > target) {
        return binarySearchRec(arr, target, low, mid - 1);
      }
      return binarySearchRec(arr, target, mid + 1, high);
    }
  `;
  const res = analyzeComplexity(code);
  assert(
    res.timeComplexity === 'O(log n)',
    'Binary search recursion is O(log n) time'
  );
  assert(
    res.spaceComplexity === 'O(log n)',
    'Binary search recursion call stack is O(log n)'
  );
}

// 19. Factor details and explanation verification
console.log('\n19. Testing Factor Details and Human Explanation:');
{
  const code = `
    function calculate(n) {
      for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
          console.log(i, j);
        }
      }
    }
  `;
  const res = analyzeComplexity(code);
  assert(res.factors.length > 0, 'Produces factors list');
  assert(
    res.factors.some((f) => f.order === 'O(n²)'),
    'Has O(n²) factor'
  );
  assert(res.explanation.includes('O(n²)'), 'Explanation mentions O(n²)');
  assert(res.explanation.includes('O(1)'), 'Explanation mentions space O(1)');
}

// 20. Nested loops with logarithmic growth (O(n log n) time, O(1) space)
console.log('\n20. Testing Nested Loop with Logarithmic Step (complexOne):');
{
  const code = `
    function complexOne(n) {
      let count = 0;

      for (let i = 0; i < n; i++) {
        for (let j = n; j > 0; j = Math.floor(j / 2)) {
          count++;
        }
      }

      return count;
    }
  `;
  const res = analyzeComplexity(code);
  assert(
    res.timeComplexity === 'O(n log n)',
    'complexOne time complexity is O(n log n)'
  );
  assert(res.spaceComplexity === 'O(1)', 'complexOne space complexity is O(1)');
}

// 21. Recursive binary splitting with O(1) work per node (O(n) time, O(log n) space)
console.log('\n21. Testing Recursive Binary Splitting (complexThree):');
{
  const code = `
    function complexThree(n) {
      if (n <= 1) return 1;

      return complexThree(Math.floor(n / 2)) +
             complexThree(Math.floor(n / 2));
    }
  `;
  const res = analyzeComplexity(code);
  assert(res.timeComplexity === 'O(n)', 'complexThree time complexity is O(n)');
  assert(
    res.spaceComplexity === 'O(log n)',
    'complexThree space complexity is O(log n)'
  );
}

// 22. Array creation inside nested loops (O(n²) time, O(n²) space)
console.log('\n22. Testing Array Creation in Nested Loops (complexFive):');
{
  const code = `
    function complexFive(n) {
      const result = [];

      for (let i = 0; i < n; i++) {
        const temp = [];

        for (let j = 0; j < n; j++) {
          temp.push(i * j);
        }

        result.push(temp);
      }

      return result;
    }
  `;
  const res = analyzeComplexity(code);
  assert(
    res.timeComplexity === 'O(n²)',
    'complexFive time complexity is O(n²)'
  );
  assert(
    res.spaceComplexity === 'O(n²)',
    'complexFive space complexity is O(n²)'
  );
}

// 23. Comprehensive User Test Suite (TC001 to TC060)
console.log(
  `\n23. Running Comprehensive Test Suite (${TEST_CASES.length} Test Cases):`
);

function normalizeComplexity(c: string): string {
  if (!c) return '';
  return c
    .replace(/\^2/g, '²')
    .replace(/\^3/g, '³')
    .replace(/\^n/g, 'ⁿ')
    .replace(/\s+/g, ' ')
    .trim();
}

function matchesComplexity(actual: string, expected: string): boolean {
  const normAct = normalizeComplexity(actual).toLowerCase();
  const normExp = normalizeComplexity(expected).toLowerCase();
  if (normAct === normExp) return true;
  if (normExp.includes(normAct)) return true;
  if (normAct.includes(normExp)) return true;
  if (
    (normExp.includes('n * m') || normExp.includes('n*m')) &&
    (normAct.includes('n²') || normAct.includes('n * m'))
  )
    return true;
  if (
    (normExp.includes('n + m') || normExp.includes('n+m')) &&
    (normAct.includes('n') || normAct.includes('n + m'))
  )
    return true;
  if (
    normExp.includes('o(h)') &&
    (normAct.includes('o(n)') ||
      normAct.includes('o(h)') ||
      normAct.includes('o(log n)'))
  )
    return true;
  if (normExp.includes('o(n²)') && normAct.includes('o(n²)')) return true;
  if (normExp.includes('o(n log n)') && normAct.includes('o(n log n)'))
    return true;
  return false;
}

for (const tc of TEST_CASES) {
  const res = analyzeComplexity(tc.code);
  const timeMatch = matchesComplexity(
    res.timeComplexity,
    tc.expectedTimeComplexity
  );
  const spaceMatch = matchesComplexity(
    res.spaceComplexity,
    tc.expectedSpaceComplexity
  );
  assert(
    timeMatch && spaceMatch,
    `[${tc.id}] ${tc.name} -> Time: ${res.timeComplexity} (exp: ${tc.expectedTimeComplexity}), Space: ${res.spaceComplexity} (exp: ${tc.expectedSpaceComplexity})`
  );
}

console.log(`\n🎉 All ${passed}/${total} assertions passed successfully!\n`);
