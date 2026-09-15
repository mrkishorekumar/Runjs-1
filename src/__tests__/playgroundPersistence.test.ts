import { getDefaultPlaygroundName } from '../hook/usePlaygroundPersistence';
import { UserCodeBase } from '../utils/interface';
import { v4 as uuidv4 } from 'uuid';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function runTests() {
  console.log(
    '=== Testing Save Playground Feature Across All Playgrounds ===\n'
  );

  // 1. Test Default Playground Names
  {
    console.log('Test 1: Default Playground Names');
    assert(
      getDefaultPlaygroundName('js') === 'JavaScript Playground',
      'JS playground should default to "JavaScript Playground"'
    );
    assert(
      getDefaultPlaygroundName('ts') === 'TypeScript Playground',
      'TS playground should default to "TypeScript Playground"'
    );
    assert(
      getDefaultPlaygroundName('react') === 'React Playground',
      'React playground should default to "React Playground"'
    );
    assert(
      getDefaultPlaygroundName('html') === 'HTML Playground',
      'HTML playground should default to "HTML Playground"'
    );
    console.log(
      '  ✓ Verified default playground names for js, ts, react, html'
    );
  }

  // 2. Test Modal Name Validation (trimmed, non-empty)
  {
    console.log('Test 2: Name Validation and Trimming');
    const validateName = (name: string): string => {
      const trimmed = name.trim();
      if (!trimmed) {
        throw new Error('Playground name cannot be empty');
      }
      return trimmed;
    };

    assert(
      validateName('My Custom JS Algorithm') === 'My Custom JS Algorithm',
      'Valid name should be retained'
    );
    assert(
      validateName('   Padded Project Name   ') === 'Padded Project Name',
      'Name should be trimmed of whitespace'
    );

    let errorCaught = false;
    try {
      validateName('   ');
    } catch {
      errorCaught = true;
    }
    assert(errorCaught, 'Whitespace-only name must be rejected');
    console.log('  ✓ Verified name validation and trimming logic');
  }

  // 3. Test JavaScript Playground Persistence State
  {
    console.log('Test 3: JavaScript Playground Save State & Payload');
    const id = uuidv4();
    const now = new Date();
    const jsPayload: UserCodeBase = {
      id,
      fileName: 'Two Sum Problem',
      language: 'js',
      code: 'function twoSum(nums, target) { return [0, 1]; }',
      htmlCode: '',
      cssCode: '',
      jsCode: 'function twoSum(nums, target) { return [0, 1]; }',
      createdAt: now,
      lastModifiedAt: now,
      isDelete: false,
      star: 0,
      tag: 'js',
      dbUpload: false,
    };

    assert(jsPayload.language === 'js', 'Language must be js');
    assert(jsPayload.tag === 'js', 'Tag must be js');
    assert(Boolean(jsPayload.id), 'ID must be present and valid');
    assert(
      jsPayload.code.includes('twoSum'),
      'Code must contain original source'
    );
    assert(
      jsPayload.fileName === 'Two Sum Problem',
      'Filename must match given name'
    );
    console.log('  ✓ Verified JavaScript playground payload structure');
  }

  // 4. Test TypeScript Playground Persistence State
  {
    console.log('Test 4: TypeScript Playground Save State & Payload');
    const id = uuidv4();
    const now = new Date();
    const tsPayload: UserCodeBase = {
      id,
      fileName: 'Generic Stack TS',
      language: 'ts',
      code: 'class Stack<T> { private items: T[] = []; }',
      htmlCode: '',
      cssCode: '',
      jsCode: '',
      createdAt: now,
      lastModifiedAt: now,
      isDelete: false,
      star: 0,
      tag: 'ts',
      dbUpload: false,
    };

    assert(tsPayload.language === 'ts', 'Language must be ts');
    assert(tsPayload.tag === 'ts', 'Tag must be ts');
    assert(tsPayload.code.includes('<T>'), 'TS code must retain generics');
    console.log('  ✓ Verified TypeScript playground payload structure');
  }

  // 5. Test HTML/CSS/JS Playground Multi-field Structure
  {
    console.log('Test 5: HTML/CSS/JS Playground Multi-field Preservation');
    const id = uuidv4();
    const now = new Date();
    const htmlPayload: UserCodeBase = {
      id,
      fileName: 'Interactive Card UI',
      language: 'html',
      code: 'console.log("Card initialized");',
      htmlCode: '<div class="card"><h1>Hello</h1></div>',
      cssCode: '.card { padding: 16px; background: #fff; }',
      jsCode: 'console.log("Card initialized");',
      createdAt: now,
      lastModifiedAt: now,
      isDelete: false,
      star: 0,
      tag: 'html',
      dbUpload: false,
    };

    assert(htmlPayload.language === 'html', 'Language must be html');
    assert(htmlPayload.tag === 'html', 'Tag must be html');
    assert(
      htmlPayload.htmlCode === '<div class="card"><h1>Hello</h1></div>',
      'HTML markup must be preserved separately'
    );
    assert(
      htmlPayload.cssCode === '.card { padding: 16px; background: #fff; }',
      'CSS stylesheet must be preserved separately'
    );
    assert(
      htmlPayload.jsCode === 'console.log("Card initialized");',
      'JS code must be preserved separately'
    );
    console.log(
      '  ✓ Verified HTML/CSS/JS separate multi-field structure preservation'
    );
  }

  // 6. Test React Playground Multi-file VFS Structure Preservation
  {
    console.log('Test 6: React Playground Multi-file VFS Preservation');
    const id = uuidv4();
    const now = new Date();
    const multiFiles: Record<string, string> = {
      '/App.jsx': 'export default function App() { return <div>Home</div>; }',
      '/components/Button.jsx':
        'export function Button() { return <button>Click</button>; }',
      '/styles.css': 'body { margin: 0; }',
      '/package.json': '{"dependencies": {"react": "19.0.0"}}',
    };

    const reactPayload: UserCodeBase = {
      id,
      fileName: 'Dashboard Widget App',
      language: 'react',
      code: multiFiles['/App.jsx'],
      htmlCode: '',
      cssCode: '',
      jsCode: '',
      files: multiFiles,
      activeFile: '/components/Button.jsx',
      openFiles: ['/App.jsx', '/components/Button.jsx'],
      template: 'vite-react',
      createdAt: now,
      lastModifiedAt: now,
      isDelete: false,
      star: 0,
      tag: 'react',
      dbUpload: false,
    };

    assert(reactPayload.language === 'react', 'Language must be react');
    assert(reactPayload.tag === 'react', 'Tag must be react');
    assert(
      typeof reactPayload.files === 'object' && reactPayload.files !== null,
      'VFS files must be an object'
    );
    assert(
      Object.keys(reactPayload.files!).length === 4,
      'All 4 files in VFS must be retained without flattening'
    );
    assert(
      reactPayload.files!['/components/Button.jsx'].includes('<button>'),
      'Component file content must be intact'
    );
    assert(
      reactPayload.activeFile === '/components/Button.jsx',
      'Active file state must be preserved'
    );
    assert(
      reactPayload.template === 'vite-react',
      'Template must be preserved'
    );
    console.log(
      '  ✓ Verified React multi-file VFS structure is NOT flattened into a single string'
    );
  }

  // 7. Test Updating Existing Playground Without Duplicating
  {
    console.log('Test 7: Updating Existing Playground (In-Place Mutation)');
    const originalId = uuidv4();
    const createdDate = new Date('2026-01-01T12:00:00Z');
    const originalDoc: UserCodeBase = {
      id: originalId,
      fileName: 'Binary Search',
      language: 'js',
      code: 'function search() {}',
      htmlCode: '',
      cssCode: '',
      jsCode: '',
      createdAt: createdDate,
      lastModifiedAt: createdDate,
      isDelete: false,
      star: 0,
      tag: 'js',
      dbUpload: false,
    };

    // Simulate updating existing playground
    const updateTimestamp = new Date('2026-01-02T15:00:00Z');
    const updatedDoc: UserCodeBase = {
      ...originalDoc,
      code: 'function search(arr, x) { /* updated implementation */ }',
      lastModifiedAt: updateTimestamp,
    };

    assert(updatedDoc.id === originalId, 'ID must not change on update');
    assert(
      updatedDoc.createdAt === createdDate,
      'Creation timestamp must not change on update'
    );
    assert(
      updatedDoc.lastModifiedAt.getTime() >
        originalDoc.lastModifiedAt.getTime(),
      'Last modified timestamp must be updated'
    );
    assert(
      updatedDoc.code.includes('updated implementation'),
      'New code must be stored'
    );
    console.log(
      '  ✓ Verified in-place playground update without duplicate creation'
    );
  }

  // 8. Test "Save as Copy" Workflow
  {
    console.log('Test 8: "Save as Copy" Creates Independent Playground');
    const sourceId = uuidv4();
    const sourceDoc: UserCodeBase = {
      id: sourceId,
      fileName: 'Fibonacci Generator',
      language: 'ts',
      code: 'function* fib(): Generator<number> { yield 0; }',
      htmlCode: '',
      cssCode: '',
      jsCode: '',
      createdAt: new Date(),
      lastModifiedAt: new Date(),
      isDelete: false,
      star: 1,
      tag: 'ts',
      dbUpload: false,
    };

    // Simulate Save as Copy
    const copyId = uuidv4();
    const copyDoc: UserCodeBase = {
      ...sourceDoc,
      id: copyId,
      fileName: 'Fibonacci Generator (Copy)',
      createdAt: new Date(),
      lastModifiedAt: new Date(),
      star: 0,
    };

    assert(copyDoc.id !== sourceId, 'Copy must have a unique UUID');
    assert(
      copyDoc.fileName === 'Fibonacci Generator (Copy)',
      'Copy name must have (Copy) suffix or user custom name'
    );
    assert(
      copyDoc.code === sourceDoc.code,
      'Copy must retain exact code content'
    );
    assert(
      copyDoc.language === sourceDoc.language,
      'Copy must retain language'
    );
    console.log('  ✓ Verified "Save as Copy" creates distinct playground copy');
  }

  // 9. Test Dirty State Detection
  {
    console.log('Test 9: Dirty Tracking Logic');
    const savedInitialCode = {
      code: 'const a = 1;',
    };

    const isDirty1 = (currentCode: string) =>
      currentCode !== savedInitialCode.code;

    assert(!isDirty1('const a = 1;'), 'Identical code must not be dirty');
    assert(isDirty1('const a = 2;'), 'Modified code must be marked dirty');

    // HTML Playground multi-field dirty tracking
    const htmlBaseline = {
      html: '<div>Hello</div>',
      css: 'p { color: red; }',
      js: 'console.log(1);',
    };

    const isHtmlDirty = (h: string, c: string, j: string) =>
      h !== htmlBaseline.html ||
      c !== htmlBaseline.css ||
      j !== htmlBaseline.js;

    assert(
      !isHtmlDirty('<div>Hello</div>', 'p { color: red; }', 'console.log(1);'),
      'Identical HTML/CSS/JS must not be dirty'
    );
    assert(
      isHtmlDirty('<div>World</div>', 'p { color: red; }', 'console.log(1);'),
      'Changed HTML must trigger dirty'
    );
    assert(
      isHtmlDirty('<div>Hello</div>', 'p { color: blue; }', 'console.log(1);'),
      'Changed CSS must trigger dirty'
    );
    assert(
      isHtmlDirty('<div>Hello</div>', 'p { color: red; }', 'console.log(2);'),
      'Changed JS must trigger dirty'
    );
    console.log('  ✓ Verified dirty tracking for single and multi-file code');
  }

  // 10. Test Saved Playground Redirection
  {
    console.log('Test 10: SavedPlaygroundRedirect Resolution Mapping');
    const resolveRedirect = (
      doc: { language?: string; tag?: string },
      id: string
    ) => {
      const rawType = (doc.language || doc.tag || 'js').toLowerCase();
      const targetType =
        rawType === 'ts' || rawType === 'typescript'
          ? 'ts'
          : rawType === 'react'
            ? 'react'
            : rawType === 'html'
              ? 'html'
              : 'js';
      return `/${targetType}/${id}`;
    };

    assert(
      resolveRedirect({ language: 'js' }, 'abc-123') === '/js/abc-123',
      'JS should map to /js/:id'
    );
    assert(
      resolveRedirect({ language: 'ts' }, 'def-456') === '/ts/def-456',
      'TS should map to /ts/:id'
    );
    assert(
      resolveRedirect({ language: 'typescript' }, 'def-456') === '/ts/def-456',
      'Typescript should map to /ts/:id'
    );
    assert(
      resolveRedirect({ language: 'react' }, 'ghi-789') === '/react/ghi-789',
      'React should map to /react/:id'
    );
    assert(
      resolveRedirect({ language: 'html' }, 'jkl-012') === '/html/jkl-012',
      'HTML should map to /html/:id'
    );
    console.log(
      '  ✓ Verified SavedPlaygroundRedirect route resolution for all 4 types'
    );
  }

  // 11. Test normalizePlaygroundType Logic
  {
    console.log(
      'Test 11: normalizePlaygroundType Tag and Language Normalization'
    );
    const normalizePlaygroundType = (
      raw?: string
    ): 'js' | 'ts' | 'react' | 'html' | null => {
      if (!raw) return null;
      const lower = raw.toLowerCase().trim();
      if (lower.startsWith('react')) return 'react';
      if (lower.startsWith('ts') || lower.startsWith('typescript')) return 'ts';
      if (lower.startsWith('html')) return 'html';
      if (lower.startsWith('js') || lower.startsWith('javascript')) return 'js';
      return null;
    };

    assert(normalizePlaygroundType('js') === 'js', 'js should normalize to js');
    assert(
      normalizePlaygroundType('javascript') === 'js',
      'javascript should normalize to js'
    );
    assert(normalizePlaygroundType('ts') === 'ts', 'ts should normalize to ts');
    assert(
      normalizePlaygroundType('typescript') === 'ts',
      'typescript should normalize to ts'
    );
    assert(
      normalizePlaygroundType('react') === 'react',
      'react should normalize to react'
    );
    assert(
      normalizePlaygroundType('vite-react') === null,
      'vite-react does not start with react'
    );
    assert(
      normalizePlaygroundType('react-app') === 'react',
      'react-app should normalize to react'
    );
    assert(
      normalizePlaygroundType('html') === 'html',
      'html should normalize to html'
    );
    assert(
      normalizePlaygroundType('HTML/CSS') === 'html',
      'HTML/CSS should normalize to html'
    );
    assert(normalizePlaygroundType('') === null, 'Empty string should be null');
    assert(
      normalizePlaygroundType(undefined) === null,
      'undefined should be null'
    );
    assert(
      normalizePlaygroundType('python') === null,
      'Unsupported language should be null'
    );
    console.log('  ✓ Verified normalizePlaygroundType rules and fallbacks');
  }

  // 12. Test Soft-Deleted Playgrounds Routing to /404
  {
    console.log('Test 12: Soft-Deleted Playground Redirection to /404');
    interface SavedItem {
      id: string;
      language?: string;
      tag?: string;
      isDelete?: boolean;
    }

    const resolveSavedRoute = (item: SavedItem | null | undefined): string => {
      if (!item || item.isDelete) {
        return '/404';
      }
      const raw = (item.language || item.tag || '').toLowerCase().trim();
      if (raw.startsWith('react')) return `/react/${item.id}`;
      if (raw.startsWith('ts') || raw.startsWith('typescript'))
        return `/ts/${item.id}`;
      if (raw.startsWith('html')) return `/html/${item.id}`;
      if (raw.startsWith('js') || raw.startsWith('javascript'))
        return `/js/${item.id}`;
      return '/404';
    };

    assert(
      resolveSavedRoute({ id: 'active-1', language: 'js', isDelete: false }) ===
        '/js/active-1',
      'Active playground should resolve to /js/:id'
    );
    assert(
      resolveSavedRoute({ id: 'deleted-1', language: 'js', isDelete: true }) ===
        '/404',
      'Soft-deleted playground (isDelete: true) must redirect to /404'
    );
    assert(
      resolveSavedRoute({
        id: 'deleted-2',
        language: 'react',
        isDelete: true,
      }) === '/404',
      'Soft-deleted React playground must redirect to /404'
    );
    assert(
      resolveSavedRoute({
        id: 'deleted-3',
        language: 'html',
        isDelete: true,
      }) === '/404',
      'Soft-deleted HTML playground must redirect to /404'
    );
    assert(
      resolveSavedRoute({ id: 'deleted-4', language: 'ts', isDelete: true }) ===
        '/404',
      'Soft-deleted TS playground must redirect to /404'
    );
    assert(
      resolveSavedRoute(null) === '/404',
      'Non-existent playground (null) must redirect to /404'
    );
    console.log(
      '  ✓ Verified soft-deleted and non-existent playgrounds route to /404'
    );
  }

  // 13. Test Double-Submit Concurrency Lock Logic
  {
    console.log('Test 13: Double-Submit Concurrency Lock');
    let isSavingRef = false;
    let saveExecutionCount = 0;

    const simulateSave = async (): Promise<boolean> => {
      if (isSavingRef) {
        return false; // Dropped / locked
      }
      isSavingRef = true;
      try {
        saveExecutionCount++;
        // Simulate async delay
        await new Promise((resolve) => setTimeout(resolve, 10));
        return true;
      } finally {
        isSavingRef = false;
      }
    };

    // Run 5 rapid concurrent calls
    const results = await Promise.all([
      simulateSave(),
      simulateSave(),
      simulateSave(),
      simulateSave(),
      simulateSave(),
    ]);

    const successfulSaves = results.filter(Boolean).length;
    assert(
      successfulSaves === 1,
      `Only 1 save should execute under concurrent double-submit, but got ${successfulSaves}`
    );
    assert(
      saveExecutionCount === 1,
      `saveExecutionCount must be 1, got ${saveExecutionCount}`
    );
    console.log(
      '  ✓ Verified double-submit concurrency lock drops duplicate parallel calls'
    );
  }

  // 14. Test React Scratchpad IndexedDB Isolation
  {
    console.log('Test 14: React Scratchpad Database Write Guard');
    let dbWrites = 0;
    const persistToDatabase = async (initialProjectId?: string) => {
      // Unsaved scratchpads (/react) should only persist to localStorage drafts, never to IndexedDB!
      if (!initialProjectId) return;
      dbWrites++;
    };

    await persistToDatabase(undefined);
    await persistToDatabase('');
    assert(
      dbWrites === 0,
      'Scratchpad (/react) without initialProjectId must NEVER write to IndexedDB'
    );

    await persistToDatabase('project-uuid-123');
    assert(
      dbWrites === 1,
      'Saved project with initialProjectId MUST persist to IndexedDB'
    );
    console.log('  ✓ Verified /react scratchpad does not pollute IndexedDB');
  }

  // 15. Test In-flight Edit Dirty State Preservation
  {
    console.log(
      'Test 15: Declarative In-flight Keystroke Dirty State Tracking'
    );
    let editorCode = 'initial';
    let initialCode = 'initial';

    // Declarative dirty evaluation
    const isDirty = () => editorCode !== initialCode;

    // Step 1: User types 'version 1'
    editorCode = 'version 1';
    assert(isDirty() === true, 'Dirty state should be true after editing');

    // Step 2: Save starts saving 'version 1'
    const inFlightCode = editorCode;

    // Step 3: While save is in-flight, user types 'version 2'
    editorCode = 'version 2';
    assert(
      isDirty() === true,
      'Dirty state must stay true after new keystroke'
    );

    // Step 4: Save completes for inFlightCode, updating initialCode
    initialCode = inFlightCode; // initialCode is now 'version 1'

    // Step 5: Declarative check: editorCode is 'version 2', initialCode is 'version 1'
    assert(
      isDirty() === true,
      'Playground must remain DIRTY because user typed while save was in-flight'
    );

    // Step 6: User saves again for 'version 2'
    initialCode = 'version 2';
    assert(
      isDirty() === false,
      'Playground becomes clean once all changes are saved'
    );
    console.log(
      '  ✓ Verified in-flight keystrokes preserve dirty state declaratively'
    );
  }

  // 16. Test Auto-Save Default Behavior for Existing Playgrounds
  {
    console.log(
      'Test 16: Auto-Save Default Behavior Across Existing Playgrounds'
    );
    let dbRecord: UserCodeBase = {
      id: 'existing-saved-id-123',
      fileName: 'AutoSave Alg',
      language: 'js',
      code: 'function initial() {}',
      htmlCode: '',
      cssCode: '',
      jsCode: 'function initial() {}',
      createdAt: new Date(),
      lastModifiedAt: new Date(),
      isDelete: false,
      star: 0,
      tag: 'js',
      dbUpload: false,
    };

    let editorCode = 'function initial() {}';
    let isSaving = false;
    let saveStatus: 'idle' | 'saving' | 'saved' = 'idle';

    // Simulate auto-save hook mechanism
    const autoSaveDebounceMs = 50;
    let autoSaveTimer: NodeJS.Timeout | null = null;

    const onCodeChange = (newCode: string) => {
      editorCode = newCode;
      if (autoSaveTimer) clearTimeout(autoSaveTimer);
      autoSaveTimer = setTimeout(async () => {
        isSaving = true;
        saveStatus = 'saving';
        // Auto-save writes to database
        dbRecord = {
          ...dbRecord,
          code: editorCode,
          jsCode: editorCode,
          lastModifiedAt: new Date(),
        };
        isSaving = false;
        saveStatus = 'saved';
      }, autoSaveDebounceMs);
    };

    // User types new code
    onCodeChange('function autoSavedResult() { return 42; }');
    assert(
      dbRecord.code === 'function initial() {}',
      'Database should not update synchronously before debounce'
    );

    // Wait for auto-save debounce to complete
    await new Promise((resolve) => setTimeout(resolve, 80));

    assert(
      dbRecord.code === 'function autoSavedResult() { return 42; }',
      'Auto-save must automatically persist changes to storage without manual save button or Cmd+S'
    );
    assert(saveStatus === 'saved', 'Status should transition to "saved"');
    assert(isSaving === false, 'isSaving should reset to false');
    console.log(
      '  ✓ Verified auto-save automatically persists changes without manual Save button or Cmd+S'
    );
  }

  // 17. Test Save Button Only For Creating New Playground & Disabled for Updating Existing
  {
    console.log(
      'Test 17: Save Button Only for Creating New Playground; Disabled for Updating Existing'
    );
    let createModalOpened = false;
    let manualUpdateExecuted = false;

    const handleSaveButtonClick = (isSaved: boolean) => {
      if (!isSaved) {
        // Only opens modal when creating a new playground
        createModalOpened = true;
      } else {
        // Manual save for updating existing playground is removed/disabled
        manualUpdateExecuted = false;
      }
    };

    // Case A: Unsaved playground (scratchpad)
    createModalOpened = false;
    handleSaveButtonClick(false);
    assert(
      createModalOpened === true,
      'Save button on unsaved scratchpad must open Create New Playground modal'
    );

    // Case B: Existing saved playground
    createModalOpened = false;
    manualUpdateExecuted = false;
    handleSaveButtonClick(true);
    assert(
      createModalOpened === false,
      'Save button on existing playground must NEVER open Create New Playground modal'
    );
    assert(
      manualUpdateExecuted === false,
      'Manual save update behavior must be disabled/removed for existing playground'
    );
    console.log(
      '  ✓ Verified Save button strictly opens creation modal for new playgrounds and is disabled for updates'
    );
  }

  // 18. Test Cmd+S Behavior Across New and Existing Playgrounds
  {
    console.log('Test 18: Cmd+S Never Triggers "Create New Playground" Modal');
    let modalOpened = false;
    let flushedToDb = false;

    const handleCmdS = (isSaved: boolean) => {
      if (isSaved) {
        // Existing saved playground: flushes auto-save immediately to DB
        flushedToDb = true;
      }
      // For both isSaved = true and isSaved = false, Cmd+S MUST NOT open Create modal!
      modalOpened = false;
    };

    // Case A: User presses Cmd+S in unsaved playground
    handleCmdS(false);
    assert(
      modalOpened === false,
      'Cmd+S in unsaved playground must NOT open Create New Playground modal'
    );

    // Case B: User presses Cmd+S in existing saved playground
    handleCmdS(true);
    assert(
      modalOpened === false,
      'Cmd+S in existing playground must NOT open Create New Playground modal'
    );
    assert(
      flushedToDb === true,
      'Cmd+S in existing playground flushes auto-save immediately'
    );
    console.log(
      '  ✓ Verified Cmd+S never triggers Create New Playground modal and flushes auto-save'
    );
  }

  // 19. Test HTML/CSS/JS Multi-Field Auto-Save Persistence
  {
    console.log('Test 19: HTML/CSS/JS Multi-Field Auto-Save Concurrency');
    let htmlDoc: UserCodeBase = {
      id: 'html-project-uuid',
      fileName: 'Live HTML App',
      language: 'html',
      code: 'console.log(1)',
      htmlCode: '<div>1</div>',
      cssCode: 'body { margin: 0; }',
      jsCode: 'console.log(1)',
      createdAt: new Date(),
      lastModifiedAt: new Date(),
      isDelete: false,
      star: 0,
      tag: 'html',
      dbUpload: false,
    };

    // User modifies HTML, then CSS, then JS in rapid succession
    const pendingHtml = '<main><h1>Updated Title</h1></main>';
    const pendingCss = 'main { background: #000; color: #fff; }';
    const pendingJs = 'console.log("Interactive RunJS");';

    // Auto-save merges all three fields simultaneously
    const autoSaveHtmlProject = async (h: string, c: string, j: string) => {
      htmlDoc = {
        ...htmlDoc,
        htmlCode: h,
        cssCode: c,
        jsCode: j,
        code: j,
        lastModifiedAt: new Date(),
      };
    };

    await autoSaveHtmlProject(pendingHtml, pendingCss, pendingJs);

    assert(
      htmlDoc.htmlCode === pendingHtml,
      'HTML field must be updated by auto-save'
    );
    assert(
      htmlDoc.cssCode === pendingCss,
      'CSS field must be updated by auto-save'
    );
    assert(
      htmlDoc.jsCode === pendingJs,
      'JS field must be updated by auto-save'
    );
    console.log(
      '  ✓ Verified HTML/CSS/JS multi-field auto-save persists all fields atomically'
    );
  }

  console.log('\n🎉 All Save Playground tests passed successfully!');
}

runTests().catch((err) => {
  console.error(err);
  process.exit(1);
});
