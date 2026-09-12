import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const publicDir = path.resolve(rootDir, 'public');
const tmpDir = path.resolve(rootDir, '.tmp_favicon_gen');

if (!fs.existsSync(tmpDir)) {
  fs.mkdirSync(tmpDir, { recursive: true });
}

// 1. Generate public/favicon.svg
const faviconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32">
  <defs>
    <linearGradient id="amber-grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fbbf24" />
      <stop offset="50%" stop-color="#f59e0b" />
      <stop offset="100%" stop-color="#d97706" />
    </linearGradient>
  </defs>
  <rect width="32" height="32" rx="8" fill="url(#amber-grad)" />
  <g transform="translate(8, 8) scale(0.6666667)">
    <path d="m18 16 4-4-4-4" fill="none" stroke="#000000" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
    <path d="m6 8-4 4 4 4" fill="none" stroke="#000000" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
    <path d="m14.5 4-5 16" fill="none" stroke="#000000" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
  </g>
</svg>
`;

fs.writeFileSync(path.join(publicDir, 'favicon.svg'), faviconSvg, 'utf8');
console.log('✔ Generated public/favicon.svg');

// 2. Helper to render HTML with exact styles and take Chrome screenshot
const CHROME_BIN =
  process.env.CHROME_BIN ||
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

/**
 * Renders a desktop / standard PWA icon ("purpose": "any")
 * Follows macOS / desktop app icon grid guidelines:
 * - Centered squircle occupying ~80.5% of the canvas with transparent padding
 * - Smooth corner curvature (~22.4% of squircle dimension)
 * - Subtle elevation shadow
 */
function renderAnyPng(
  size,
  squircleSize,
  cornerRadius,
  iconSize,
  strokeWidth,
  shadowY,
  shadowBlur,
  outPath
) {
  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
html, body {
  width: ${size}px;
  height: ${size}px;
  overflow: hidden;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
}
.box {
  width: ${squircleSize}px;
  height: ${squircleSize}px;
  border-radius: ${cornerRadius}px;
  background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #d97706 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 ${shadowY}px ${shadowBlur}px rgba(0, 0, 0, 0.28);
}
svg {
  width: ${iconSize}px;
  height: ${iconSize}px;
  stroke: #000000;
  stroke-width: ${strokeWidth};
  stroke-linecap: round;
  stroke-linejoin: round;
  fill: none;
}
</style>
</head>
<body>
<div class="box">
  <svg viewBox="0 0 24 24">
    <path d="m18 16 4-4-4-4" />
    <path d="m6 8-4 4 4 4" />
    <path d="m14.5 4-5 16" />
  </svg>
</div>
</body>
</html>`;

  const htmlPath = path.join(tmpDir, `any_${size}.html`);
  fs.writeFileSync(htmlPath, html, 'utf8');
  execSync(
    `"${CHROME_BIN}" --headless --disable-gpu --default-background-color=00000000 --window-size=${size},${size} --screenshot="${outPath}" "${htmlPath}"`,
    { stdio: 'ignore' }
  );
}

/**
 * Renders a full-bleed maskable icon ("purpose": "maskable" and apple-touch-icon)
 * - Fills 100% of canvas with amber gradient
 * - Foreground icon centered within the safe zone (80% diameter inner circle)
 */
function renderMaskablePng(size, iconSize, strokeWidth, outPath) {
  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
html, body {
  width: ${size}px;
  height: ${size}px;
  overflow: hidden;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
}
.box {
  width: ${size}px;
  height: ${size}px;
  background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #d97706 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}
svg {
  width: ${iconSize}px;
  height: ${iconSize}px;
  stroke: #000000;
  stroke-width: ${strokeWidth};
  stroke-linecap: round;
  stroke-linejoin: round;
  fill: none;
}
</style>
</head>
<body>
<div class="box">
  <svg viewBox="0 0 24 24">
    <path d="m18 16 4-4-4-4" />
    <path d="m6 8-4 4 4 4" />
    <path d="m14.5 4-5 16" />
  </svg>
</div>
</body>
</html>`;

  const htmlPath = path.join(tmpDir, `mask_${size}.html`);
  fs.writeFileSync(htmlPath, html, 'utf8');
  execSync(
    `"${CHROME_BIN}" --headless --disable-gpu --default-background-color=00000000 --window-size=${size},${size} --screenshot="${outPath}" "${htmlPath}"`,
    { stdio: 'ignore' }
  );
}

/**
 * Renders browser favicon raster assets (for favicon.ico and runjs.in.webp)
 */
function renderFaviconPng(size, iconSize, strokeWidth, outPath) {
  const radius = size * 0.25;
  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
html, body {
  width: ${size}px;
  height: ${size}px;
  overflow: hidden;
  background: transparent;
}
.box {
  width: ${size}px;
  height: ${size}px;
  border-radius: ${radius}px;
  background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #d97706 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}
svg {
  width: ${iconSize}px;
  height: ${iconSize}px;
  stroke: #000000;
  stroke-width: ${strokeWidth};
  stroke-linecap: round;
  stroke-linejoin: round;
  fill: none;
}
</style>
</head>
<body>
<div class="box">
  <svg viewBox="0 0 24 24">
    <path d="m18 16 4-4-4-4" />
    <path d="m6 8-4 4 4 4" />
    <path d="m14.5 4-5 16" />
  </svg>
</div>
</body>
</html>`;

  const htmlPath = path.join(tmpDir, `fav_${size}.html`);
  fs.writeFileSync(htmlPath, html, 'utf8');
  execSync(
    `"${CHROME_BIN}" --headless --disable-gpu --default-background-color=00000000 --window-size=${size},${size} --screenshot="${outPath}" "${htmlPath}"`,
    { stdio: 'ignore' }
  );
}

console.log('Rendering PWA desktop standard ("any") assets...');
// 512x512 standard desktop icon (412x412 squircle, 92px corner radius, 5px shadow, 206px logo)
const pwa512Path = path.join(publicDir, 'RunJS-512.png');
renderAnyPng(512, 412, 92, 206, 2.4, 5, 6, pwa512Path);
console.log(
  '  ✔ Rendered and saved RunJS-512.png (standard squircle with macOS padding & shadow)'
);

// 192x192 standard desktop icon (154x154 squircle, 35px corner radius, 2px shadow, 77px logo)
const pwa192Path = path.join(publicDir, 'RunJS-192.png');
renderAnyPng(192, 154, 35, 77, 2.4, 2, 3, pwa192Path);
console.log(
  '  ✔ Rendered and saved RunJS-192.png (standard squircle with macOS padding & shadow)'
);

console.log('Rendering PWA maskable assets...');
// 512x512 maskable icon (full-bleed, 216px safe-zone logo)
const mask512Path = path.join(publicDir, 'RunJS-maskable-512.png');
renderMaskablePng(512, 216, 2.4, mask512Path);
console.log(
  '  ✔ Rendered and saved RunJS-maskable-512.png (full-bleed safe-zone)'
);

// 192x192 maskable icon (full-bleed, 81px safe-zone logo)
const mask192Path = path.join(publicDir, 'RunJS-maskable-192.png');
renderMaskablePng(192, 81, 2.4, mask192Path);
console.log(
  '  ✔ Rendered and saved RunJS-maskable-192.png (full-bleed safe-zone)'
);

// 180x180 Apple Touch Icon (full-bleed, 76px safe-zone logo)
const appleTouchPath = path.join(publicDir, 'apple-touch-icon.png');
renderMaskablePng(180, 76, 2.4, appleTouchPath);
console.log(
  '  ✔ Rendered and saved apple-touch-icon.png (180x180 Retina full-bleed)'
);

// Render favicon raster sizes
const faviconSizes = [
  { size: 16, iconSize: 10, stroke: 3.0 },
  { size: 32, iconSize: 17, stroke: 2.7 },
  { size: 48, iconSize: 24, stroke: 2.5 },
  { size: 64, iconSize: 32, stroke: 2.5 },
  { size: 128, iconSize: 64, stroke: 2.5 },
  { size: 256, iconSize: 128, stroke: 2.5 },
];

console.log('Rendering favicon raster assets...');
for (const config of faviconSizes) {
  const pngPath = path.join(tmpDir, `icon_${config.size}.png`);
  renderFaviconPng(config.size, config.iconSize, config.stroke, pngPath);
  console.log(`  ✔ Rendered ${config.size}x${config.size} PNG`);
}

// 3. Render 256x256 WebP
const webpPath = path.join(publicDir, 'runjs.in.webp');
execSync(
  `"${CHROME_BIN}" --headless --disable-gpu --default-background-color=00000000 --window-size=256,256 --screenshot="${webpPath}" "${path.join(tmpDir, 'icon_256.html')}"`,
  { stdio: 'ignore' }
);
console.log('✔ Generated public/runjs.in.webp');

// 4. Extract DIBs for 16, 32, 48 using macOS sips for standard ICO format
function getDIB(pngPath) {
  const tmpIco = path.join(tmpDir, `${path.basename(pngPath, '.png')}.ico`);
  execSync(`sips -s format ico "${pngPath}" --out "${tmpIco}"`, {
    stdio: 'ignore',
  });
  const buf = fs.readFileSync(tmpIco);
  const offset = buf.readUInt32LE(18);
  const size = buf.readUInt32LE(14);
  return buf.subarray(offset, offset + size);
}

const dib16 = getDIB(path.join(tmpDir, 'icon_16.png'));
const dib32 = getDIB(path.join(tmpDir, 'icon_32.png'));
const dib48 = getDIB(path.join(tmpDir, 'icon_48.png'));
const png64 = fs.readFileSync(path.join(tmpDir, 'icon_64.png'));
const png128 = fs.readFileSync(path.join(tmpDir, 'icon_128.png'));
const png256 = fs.readFileSync(path.join(tmpDir, 'icon_256.png'));

const icoImages = [
  { width: 16, height: 16, bpp: 32, data: dib16 },
  { width: 32, height: 32, bpp: 32, data: dib32 },
  { width: 48, height: 48, bpp: 32, data: dib48 },
  { width: 64, height: 64, bpp: 32, data: png64 },
  { width: 128, height: 128, bpp: 32, data: png128 },
  { width: 256, height: 256, bpp: 32, data: png256 },
];

const header = Buffer.alloc(6);
header.writeUInt16LE(0, 0); // reserved
header.writeUInt16LE(1, 2); // icon type
header.writeUInt16LE(icoImages.length, 4); // count

let offset = 6 + 16 * icoImages.length;
const entries = [];
for (const img of icoImages) {
  const entry = Buffer.alloc(16);
  entry.writeUInt8(img.width >= 256 ? 0 : img.width, 0);
  entry.writeUInt8(img.height >= 256 ? 0 : img.height, 1);
  entry.writeUInt8(0, 2); // color palette count
  entry.writeUInt8(0, 3); // reserved
  entry.writeUInt16LE(1, 4); // color planes
  entry.writeUInt16LE(img.bpp, 6); // bits per pixel
  entry.writeUInt32LE(img.data.length, 8); // image size
  entry.writeUInt32LE(offset, 12); // image offset
  entries.push(entry);
  offset += img.data.length;
}

const finalIco = Buffer.concat([
  header,
  ...entries,
  ...icoImages.map((img) => img.data),
]);
fs.writeFileSync(path.join(publicDir, 'favicon.ico'), finalIco);
console.log(
  `✔ Generated public/favicon.ico (${finalIco.length} bytes, 6 resolutions)`
);

// Clean up tmp dir
fs.rmSync(tmpDir, { recursive: true, force: true });
console.log('✔ Cleanup complete');
