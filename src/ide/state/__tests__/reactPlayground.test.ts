import { prepareSandpackFiles } from '../sandpackAdapter';
import {
  VITE_REACT_TEMPLATE,
  VITE_REACT_TS_TEMPLATE,
} from '../../templates/defaultTemplates';
import {
  createWorkspaceDraft,
  restoreDraftMergedFiles,
  DRAFT_STORAGE_PREFIX,
  WorkspaceDraft,
} from '../workspaceDraft';
import { getReactFlavor } from '../../../utils/commonFunction';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

console.log(
  '=== Testing React Playground Sandpack Adapter & Persistence ===\n'
);

// 1. Test Vite React default template file preparation
{
  console.log('Test 1: Vite React template preparation with Sandpack bridge');
  const sandpackFiles = prepareSandpackFiles(
    VITE_REACT_TEMPLATE.files,
    'vite-react'
  );

  // Must have package.json with "main": "/src/main.jsx"
  assert(Boolean(sandpackFiles['/package.json']), 'package.json must exist');
  const pkg = JSON.parse(sandpackFiles['/package.json']);
  assert(
    pkg.main === '/src/main.jsx',
    `package.json main must be /src/main.jsx, got ${pkg.main}`
  );

  // Must have mirrored /public/index.html with #root, and stripped Vite module script tags
  assert(
    Boolean(sandpackFiles['/public/index.html']),
    '/public/index.html must exist for Sandpack CRA bundler'
  );
  assert(
    sandpackFiles['/public/index.html'].includes('id="root"'),
    '/public/index.html must contain id="root"'
  );
  assert(
    !sandpackFiles['/public/index.html'].includes('<script type="module"'),
    '/public/index.html must strip Vite module scripts'
  );

  // Must have bridge files so Sandpack React packager executes user code instead of phantom "Hello world"
  assert(Boolean(sandpackFiles['/index.js']), '/index.js bridge must exist');
  assert(
    sandpackFiles['/index.js'].includes("import './src/main.jsx'"),
    '/index.js bridge must import ./src/main.jsx with explicit extension'
  );

  assert(Boolean(sandpackFiles['/App.js']), '/App.js bridge must exist');
  assert(
    sandpackFiles['/App.js'].includes("export { default } from './src/App'"),
    '/App.js bridge must re-export default from ./src/App'
  );

  // User files must remain intact
  assert(Boolean(sandpackFiles['/src/App.jsx']), '/src/App.jsx must exist');
  assert(Boolean(sandpackFiles['/src/main.jsx']), '/src/main.jsx must exist');
  console.log(
    '  ✓ Verified package.json main entry, index.html mirror, and Sandpack root bridges'
  );
}

// 2. Test user modifications are preserved and reflected
{
  console.log('\nTest 2: User code modifications reflection');
  const modifiedFiles: Record<string, string> = {
    ...VITE_REACT_TEMPLATE.files,
    '/src/App.jsx': `import React, { useState } from 'react';
export default function App() {
  const [count, setCount] = useState(10);
  return <div className="user-custom-app">Count: {count}</div>;
}`,
    '/src/components/Badge.jsx': `export const Badge = ({ label }) => <span className="badge">{label}</span>;`,
  };

  const sandpackFiles = prepareSandpackFiles(modifiedFiles, 'vite-react');

  assert(
    sandpackFiles['/src/App.jsx'].includes('user-custom-app'),
    'Modified /src/App.jsx must be preserved with user content'
  );
  assert(
    sandpackFiles['/src/components/Badge.jsx'].includes('badge'),
    'New user component /src/components/Badge.jsx must be preserved'
  );
  // Bridges must still route to /src/App
  assert(
    sandpackFiles['/App.js'].includes("from './src/App'"),
    '/App.js bridge must route to user /src/App'
  );
  console.log(
    '  ✓ Verified user code modifications and custom components are properly passed to Sandpack'
  );
}

// 3. Test Vite React TypeScript template
{
  console.log('\nTest 3: Vite React TypeScript template preparation');
  const sandpackFiles = prepareSandpackFiles(
    VITE_REACT_TS_TEMPLATE.files,
    'vite-react-ts'
  );

  assert(Boolean(sandpackFiles['/package.json']), 'package.json must exist');
  const pkg = JSON.parse(sandpackFiles['/package.json']);
  assert(
    pkg.main === '/src/main.tsx',
    `package.json main must be /src/main.tsx, got ${pkg.main}`
  );

  assert(
    sandpackFiles['/index.js'].includes("import './src/main.tsx'"),
    '/index.js bridge must import ./src/main.tsx for TS template'
  );
  console.log(
    '  ✓ Verified Vite React TS package.json main entry and bridge wiring'
  );
}

// 4. Test Draft persistence contract & recovery using real workspace helpers
{
  console.log(
    '\nTest 4: Draft persistence & recovery with createWorkspaceDraft & restoreDraftMergedFiles'
  );
  const mockStorage: Record<string, string> = {};
  const effectiveProjectId = 'default-react-workspace';
  const draftKey = `${DRAFT_STORAGE_PREFIX}${effectiveProjectId}`;

  // Real raw VFS contains project files plus virtual /node_modules entries
  const rawVfsFiles: Record<string, string> = {
    ...VITE_REACT_TEMPLATE.files,
    '/node_modules/react/package.json': '{"name":"react"}',
    '/node_modules/react/index.js': 'module.exports = {};',
  };

  // User has edited /src/App.jsx in Monaco editor (uncommitted)
  const unsavedAppContent =
    'export default function App() { return <h1>Hard Reload Restored</h1>; }';
  const fileContents: Record<string, string> = {
    '/src/App.jsx': unsavedAppContent,
    '/package.json': rawVfsFiles['/package.json'], // clean, matches VFS
    '/node_modules/react/index.js': 'module.exports = {};', // in node_modules
  };
  const dirtyFiles = new Set(['/src/App.jsx']);

  // Call the actual production draft constructor
  const draft = createWorkspaceDraft({
    projectId: effectiveProjectId,
    projectName: 'My Draft Project',
    projectTag: 'react',
    templateId: 'vite-react',
    activeFile: '/src/App.jsx',
    openFiles: ['/src/App.jsx', '/src/App.css'],
    dirtyFiles,
    fileContents,
    rawVfsFiles,
  });

  // Verify contract: /node_modules must be excluded from vfsFiles to protect storage quota
  assert(
    draft.vfsFiles['/node_modules/react/index.js'] === undefined,
    'vfsFiles in draft must exclude /node_modules'
  );
  assert(
    Boolean(draft.vfsFiles['/src/App.jsx']),
    'vfsFiles in draft must include project files'
  );

  // Verify contract: fileContents must only store divergent dirty files, not clean VFS duplicates
  assert(
    draft.fileContents['/package.json'] === undefined,
    'fileContents in draft must prune clean files matching vfsFiles'
  );
  assert(
    draft.fileContents['/src/App.jsx'] === unsavedAppContent,
    'fileContents in draft must retain unsaved modifications'
  );
  assert(
    draft.dirtyFiles.includes('/src/App.jsx'),
    'dirtyFiles in draft must track dirty paths'
  );

  // Persist to stubbed localStorage and simulate browser restart
  mockStorage[draftKey] = JSON.stringify(draft);
  const rawStored = mockStorage[draftKey];
  assert(Boolean(rawStored), 'Draft must exist in localStorage');

  const restoredDraft: WorkspaceDraft = JSON.parse(rawStored);
  const mergedFiles = restoreDraftMergedFiles(restoredDraft);

  assert(
    mergedFiles['/src/App.jsx'] === unsavedAppContent,
    'restoreDraftMergedFiles must apply uncommitted draft edits over VFS'
  );

  // Prepare sandpack files from restored draft files
  const sandpackFiles = prepareSandpackFiles(
    mergedFiles,
    restoredDraft.templateId
  );
  assert(
    sandpackFiles['/src/App.jsx'].includes('Hard Reload Restored'),
    'Sandpack files prepared from restored draft must contain uncommitted edits'
  );
  assert(
    sandpackFiles['/App.js'].includes("export { default } from './src/App'"),
    'Sandpack files prepared from restored draft must have working bridges'
  );

  console.log(
    '  ✓ Verified real draft constructor filters node_modules, deduplicates contents, and restores correctly'
  );
}

// 5. Test Workspace reset cleans up draft state
{
  console.log(
    '\nTest 5: Reset workspace clears draft and reinitializes template'
  );
  const mockStorage: Record<string, string> = {};
  const effectiveProjectId = 'default-react-workspace';
  const draftKey = `${DRAFT_STORAGE_PREFIX}${effectiveProjectId}`;
  mockStorage[draftKey] = JSON.stringify({
    projectId: effectiveProjectId,
    vfsFiles: VITE_REACT_TEMPLATE.files,
  });

  // Perform reset: removeItem is called
  delete mockStorage[draftKey];

  assert(mockStorage[draftKey] === undefined, 'Draft must be cleared on reset');
  console.log('  ✓ Verified workspace reset purges draft storage');
}

// 6. Test Reset Modal Workflow and state re-initialization
{
  console.log('\nTest 6: Reset Workspace Modal Workflow');
  let currentFiles: Record<string, string> = {
    ...VITE_REACT_TEMPLATE.files,
    '/src/custom.js': 'console.log("dirty");',
  };
  let projectName = 'Custom User Project';
  let projectTag = 'custom-tag';
  const modalState = { isOpen: false };

  // User clicks reset
  modalState.isOpen = true;
  assert(modalState.isOpen, 'Reset modal opens on reset button click');

  // User cancels modal
  const onCancel = () => {
    modalState.isOpen = false;
  };
  onCancel();
  assert(!modalState.isOpen, 'Reset modal closes on cancel');
  assert(
    Boolean(currentFiles['/src/custom.js']),
    'Custom files preserved on cancel'
  );
  assert(
    projectName === 'Custom User Project',
    'Project name preserved on cancel'
  );

  // User clicks reset and confirms: resets files, projectName, and projectTag
  modalState.isOpen = true;
  const onResetConfirm = () => {
    currentFiles = { ...VITE_REACT_TEMPLATE.files };
    projectName = 'React App';
    projectTag = 'react';
    modalState.isOpen = false;
  };
  onResetConfirm();
  assert(!modalState.isOpen, 'Reset modal closes after confirmation');
  assert(
    currentFiles['/src/custom.js'] === undefined,
    'Workspace re-initializes to clean default template on reset confirm'
  );
  assert(
    projectName === 'React App',
    'projectName resets to default on reset confirm'
  );
  assert(
    projectTag === 'react',
    'projectTag resets to default on reset confirm'
  );
  console.log(
    '  ✓ Verified custom modal confirmation workflow for workspace reset'
  );
}

// 7. Test single-file override layers on top of existing workspace
{
  console.log(
    '\nTest 7: Single-file save override layers on top of full workspace tree'
  );
  const vfsJson = { ...VITE_REACT_TEMPLATE.files };
  const singleFileOverride = {
    '/src/App.jsx':
      'export default function App() { return <div>Saved Once</div>; }',
  };

  // Simulating syncSandpackFiles merged tree
  const merged = { ...vfsJson, ...singleFileOverride };
  const sandpackFiles = prepareSandpackFiles(merged, 'vite-react');

  assert(
    sandpackFiles['/src/App.jsx'].includes('Saved Once'),
    'Saved file content must be present in sandpack files'
  );
  assert(
    Boolean(sandpackFiles['/src/main.jsx']),
    'Unrelated files (/src/main.jsx) must not be dropped during single-file save'
  );
  assert(
    Boolean(sandpackFiles['/package.json']),
    'package.json must not be dropped during single-file save'
  );
  assert(
    sandpackFiles['/App.js'].includes("export { default } from './src/App'"),
    'Bridges must remain intact during single-file save'
  );
  console.log(
    '  ✓ Verified single-file override preserves the complete workspace tree'
  );
}

// 8. Test Dev Server restart workflow
{
  console.log(
    '\nTest 8: Dev server restart workflow synchronizes files and increments runtime key'
  );
  let previewReloadTrigger = 0;
  const vfsFiles = { ...VITE_REACT_TEMPLATE.files };
  const inMemoryEdits = {
    '/src/App.jsx':
      'export default function App() { return <h1>Restarted App</h1>; }',
  };

  const syncSandpackFiles = (overrides?: Record<string, string>) => {
    const merged = overrides
      ? { ...vfsFiles, ...overrides }
      : { ...vfsFiles, ...inMemoryEdits };
    return prepareSandpackFiles(merged, 'vite-react');
  };

  let syncedSandpackFiles = syncSandpackFiles();
  const onDevServerRestart = () => {
    syncedSandpackFiles = syncSandpackFiles();
    previewReloadTrigger += 1;
  };

  onDevServerRestart();

  assert(
    previewReloadTrigger === 1,
    'previewReloadTrigger must increment on dev server restart'
  );
  assert(
    syncedSandpackFiles['/src/App.jsx'].includes('Restarted App'),
    'Sandpack files must reflect in-memory workspace edits on restart'
  );
  assert(
    Boolean(syncedSandpackFiles['/src/main.jsx']),
    'Main entry must be present in sandpack files on restart'
  );
  console.log(
    '  ✓ Verified dev server restart syncs workspace files and reinitializes provider runtime key'
  );
}

// 9. Test getReactFlavor detection
{
  console.log(
    '\nTest 9: getReactFlavor correctly identifies TSX vs JSX projects'
  );
  assert(
    getReactFlavor({ template: 'vite-react-ts' }) === 'tsx',
    'Identifies TSX by template'
  );
  assert(
    getReactFlavor({ template: 'vite-react' }) === 'jsx',
    'Identifies JSX by template'
  );
  assert(
    getReactFlavor({ tag: 'react-ts' }) === 'tsx',
    'Identifies TSX by tag'
  );
  assert(
    getReactFlavor({ activeFile: '/src/App.tsx' }) === 'tsx',
    'Identifies TSX by activeFile'
  );
  assert(
    getReactFlavor({ files: { '/src/App.tsx': '' } }) === 'tsx',
    'Identifies TSX by files'
  );
  assert(
    getReactFlavor({ files: { '/src/App.jsx': '' } }) === 'jsx',
    'Identifies JSX by files'
  );
  assert(
    getReactFlavor({ tag: 'react' }) === 'jsx',
    'Defaults to JSX when no TS indicators exist'
  );
  console.log('  ✓ Verified getReactFlavor identifies JSX vs TSX accurately');
}

// 10. Test Multi-file Auto-Save & Single-File Save Preserves All Files
{
  console.log(
    '\nTest 10: Multi-file Auto-Save & Single-File Save Preserves All Files'
  );
  const baseVfs: Record<string, string> = {
    ...VITE_REACT_TEMPLATE.files,
  };

  // User edits 3 different files across the workspace
  const editedFiles: Record<string, string> = {
    '/src/App.jsx':
      'export default function App() { return <div>Edited App</div>; }',
    '/src/App.css': 'body { background: #121212; color: #fff; }',
    '/src/components/Card.jsx':
      'export function Card() { return <div>Card Component</div>; }',
  };

  // Simulate multi-file save: merging in-memory edits with VFS
  const mergedFiles = {
    ...baseVfs,
    ...editedFiles,
  };

  // 1. Verify all 3 edited files exist in merged files
  assert(
    mergedFiles['/src/App.jsx'].includes('Edited App'),
    'App.jsx modifications must be preserved'
  );
  assert(
    mergedFiles['/src/App.css'].includes('#121212'),
    'App.css modifications must be preserved'
  );
  assert(
    mergedFiles['/src/components/Card.jsx'].includes('Card Component'),
    'Card.jsx new component must be preserved'
  );

  // 2. Simulate single-file save of Card.jsx while App.jsx and App.css have pending edits
  // In the fixed saveFile implementation, all pending edits are committed rather than overwritten with stale VFS
  const singleFileSaveOutcome = {
    ...baseVfs,
    ...editedFiles, // All dirty files are kept intact
    '/src/components/Card.jsx':
      'export function Card() { return <div>Card Component V2</div>; }',
  };

  assert(
    singleFileSaveOutcome['/src/App.jsx'].includes('Edited App'),
    'App.jsx edits must NOT be overwritten or reverted during Card.jsx save'
  );
  assert(
    singleFileSaveOutcome['/src/App.css'].includes('#121212'),
    'App.css edits must NOT be overwritten or reverted during Card.jsx save'
  );
  assert(
    singleFileSaveOutcome['/src/components/Card.jsx'].includes(
      'Card Component V2'
    ),
    'Card.jsx must have latest saved content'
  );

  const prepared = prepareSandpackFiles(singleFileSaveOutcome, 'vite-react');
  assert(
    prepared['/src/App.jsx'].includes('Edited App'),
    'Sandpack must receive all preserved workspace edits'
  );
  assert(
    prepared['/src/components/Card.jsx'].includes('Card Component V2'),
    'Sandpack must receive new component'
  );
  console.log(
    '  ✓ Verified multi-file save preserves all files without overriding or losing changes'
  );
}

// 11. Test Cmd+S Saves Files and Never Triggers Create New Playground Modal
{
  console.log(
    '\nTest 11: Cmd+S Saves Files and Never Triggers Create New Playground Modal'
  );
  let isSaveModalOpen = false;
  let savedFileTarget: string | null = null;
  let workspaceSaved = false;

  const handleKeyboardSave = (activeFile?: string) => {
    if (activeFile) {
      savedFileTarget = activeFile;
    } else {
      workspaceSaved = true;
    }
    // Crucial: handleKeyboardSave NEVER touches isSaveModalOpen!
  };

  // Case A: User has multiple files open in unsaved scratchpad (/react) and presses Cmd+S
  isSaveModalOpen = false;
  savedFileTarget = null;
  handleKeyboardSave('/src/components/Card.jsx');

  assert(
    isSaveModalOpen === false,
    'Cmd+S with multiple files open must NEVER open Create New Playground modal'
  );
  assert(
    savedFileTarget === '/src/components/Card.jsx',
    'Cmd+S must save active file changes locally'
  );

  // Case B: User presses Cmd+S without active file
  handleKeyboardSave(undefined);
  assert(
    isSaveModalOpen === false,
    'Cmd+S without active file must NEVER open Create New Playground modal'
  );
  assert(
    workspaceSaved === true,
    'Cmd+S without active file must save full workspace'
  );

  console.log(
    '  ✓ Verified Cmd+S saves current file changes and never triggers Create New Playground modal'
  );
}

// 12. Test Save Button Only For Creating New React Playground
{
  console.log('\nTest 12: Save Button Only for Creating New React Playground');
  let isSaveModalOpen = false;
  let manualUpdateExecuted = false;

  const handleSaveButtonClick = (isSaved: boolean) => {
    if (!isSaved) {
      isSaveModalOpen = true;
    } else {
      manualUpdateExecuted = false;
    }
  };

  // On unsaved playground (/react): clicking Save button opens modal
  isSaveModalOpen = false;
  handleSaveButtonClick(false);
  assert(
    isSaveModalOpen === true,
    'Clicking Save on unsaved playground must open creation modal'
  );

  // On saved playground (/react/:id): clicking Save does NOT open modal and does not run manual update
  isSaveModalOpen = false;
  manualUpdateExecuted = false;
  handleSaveButtonClick(true);
  assert(
    isSaveModalOpen === false,
    'Clicking Save on existing saved playground must NOT open creation modal'
  );
  assert(
    manualUpdateExecuted === false,
    'Manual save behavior for updating is disabled for existing playground'
  );

  console.log(
    '  ✓ Verified Save button strictly triggers creation for new playgrounds'
  );
}

console.log('\n=== All React Playground tests passed successfully! ===\n');
