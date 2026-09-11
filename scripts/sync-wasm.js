import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const source = path.join(rootDir, 'node_modules', 'esbuild-wasm', 'esbuild.wasm');
const target = path.join(rootDir, 'public', 'esbuild.wasm');

if (fs.existsSync(source)) {
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(source, target);
  console.log('✓ Synchronized public/esbuild.wasm with installed esbuild-wasm binary');
}
