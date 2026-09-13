import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const testFile = path.join(
  rootDir,
  'src/utils/__tests__/sandboxRunner.test.ts'
);
const tempOut = path.join(rootDir, 'scratch_sandbox_runner_test.cjs');

try {
  execSync(
    `npx esbuild "${testFile}" --bundle --platform=node --outfile="${tempOut}"`,
    {
      stdio: 'inherit',
    }
  );
  execSync(`node "${tempOut}"`, { stdio: 'inherit' });
} finally {
  if (fs.existsSync(tempOut)) {
    fs.unlinkSync(tempOut);
  }
}
