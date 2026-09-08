import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

let totalTests = 0;
let passedTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    console.log(`  ✓ ${message}`);
    passedTests++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
  }
}

console.log('\n--- 1. Validating index.html Global Metadata ---');
const indexHtmlPath = path.join(rootDir, 'index.html');
const indexHtml = fs.readFileSync(indexHtmlPath, 'utf-8');

assert(indexHtml.includes('<html lang="en">'), 'Contains <html lang="en">');
assert(indexHtml.includes('<meta charset="utf-8" />') || indexHtml.includes('charset="utf-8"'), 'Contains utf-8 charset');
assert(indexHtml.includes('<meta name="viewport"'), 'Contains viewport meta tag');
assert(indexHtml.includes('<link rel="canonical" href="https://runjs.in/" />'), 'Contains canonical URL');
assert(
  indexHtml.includes('<title>RunJS.in - In-Browser JavaScript, TypeScript & React Playground</title>') ||
    indexHtml.includes('<title>RunJS - In-Browser JavaScript, TypeScript & React Playground</title>'),
  'Contains descriptive default title'
);
assert(indexHtml.includes('content="index, follow'), 'Contains robots index, follow');
assert(indexHtml.includes('<meta name="theme-color" content="#f59e0b"'), 'Contains light theme color');
assert(indexHtml.includes('<meta name="theme-color" content="#09090b"'), 'Contains dark theme color');
assert(indexHtml.includes('<meta property="og:title"'), 'Contains og:title');
assert(indexHtml.includes('<meta property="og:description"'), 'Contains og:description');
assert(indexHtml.includes('<meta property="og:image" content="https://runjs.in/og-image.png"'), 'Contains absolute og:image');
assert(indexHtml.includes('<meta property="og:url" content="https://runjs.in/" />'), 'Contains og:url');
assert(indexHtml.includes('<meta name="twitter:card" content="summary_large_image" />'), 'Contains twitter:card');
assert(indexHtml.includes('<meta name="twitter:creator" content="@mrkishorekumar" />'), 'Contains twitter:creator');
assert(indexHtml.includes('<meta name="twitter:image" content="https://runjs.in/og-image.png" />'), 'Contains twitter:image');

// JSON-LD validation in index.html
const jsonLdMatch = indexHtml.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
assert(Boolean(jsonLdMatch), 'Contains static JSON-LD script');
if (jsonLdMatch) {
  try {
    const parsed = JSON.parse(jsonLdMatch[1]);
    assert(parsed['@context'] === 'https://schema.org', 'JSON-LD context is https://schema.org');
    assert(Array.isArray(parsed['@graph']), 'JSON-LD has @graph array');
    const graph = Array.isArray(parsed['@graph']) ? parsed['@graph'] : [];
    const webApp = graph.find(item => item['@type'] === 'WebApplication');
    const webSite = graph.find(item => item['@type'] === 'WebSite');
    assert(Boolean(webApp), 'JSON-LD includes WebApplication schema');
    assert(Boolean(webSite), 'JSON-LD includes WebSite schema');
  } catch (e) {
    assert(false, `JSON-LD in index.html is invalid JSON: ${e.message}`);
  }
}

console.log('\n--- 2. Validating public/robots.txt ---');
const robotsPath = path.join(rootDir, 'public/robots.txt');
const robotsTxt = fs.readFileSync(robotsPath, 'utf-8');
assert(robotsTxt.includes('User-agent: *'), 'Specifies User-agent: *');
assert(robotsTxt.includes('Allow: /'), 'Allows public root');
assert(robotsTxt.includes('Disallow: /bin'), 'Disallows /bin');
assert(robotsTxt.includes('Disallow: /404'), 'Disallows /404');
assert(robotsTxt.includes('Disallow: /dashboard'), 'Disallows /dashboard');
assert(robotsTxt.includes('Sitemap: https://runjs.in/sitemap.xml'), 'References production sitemap.xml');
assert(robotsTxt.includes('Host: https://runjs.in'), 'References Host header');

console.log('\n--- 3. Validating public/sitemap.xml ---');
const sitemapPath = path.join(rootDir, 'public/sitemap.xml');
const sitemapXml = fs.readFileSync(sitemapPath, 'utf-8');
assert(sitemapXml.startsWith('<?xml version="1.0" encoding="UTF-8"?>'), 'Valid XML header');
assert(sitemapXml.includes('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'), 'Valid sitemap namespace');
assert(sitemapXml.includes('<loc>https://runjs.in/</loc>'), 'Includes homepage');
assert(sitemapXml.includes('<loc>https://runjs.in/problems</loc>'), 'Includes /problems');
assert(sitemapXml.includes('<loc>https://runjs.in/js</loc>'), 'Includes /js');
assert(sitemapXml.includes('<loc>https://runjs.in/visualizer</loc>'), 'Includes /visualizer');
assert(sitemapXml.includes('<loc>https://runjs.in/execution-context</loc>'), 'Includes /execution-context');
assert(sitemapXml.includes('<loc>https://runjs.in/ts</loc>'), 'Includes /ts');
assert(sitemapXml.includes('<loc>https://runjs.in/react</loc>'), 'Includes /react');
assert(sitemapXml.includes('<loc>https://runjs.in/interview</loc>'), 'Includes /interview');
assert(sitemapXml.includes('<loc>https://runjs.in/about</loc>'), 'Includes /about');
assert(sitemapXml.includes('<loc>https://runjs.in/kishorekumar</loc>'), 'Includes /kishorekumar');
assert(sitemapXml.includes('<loc>https://runjs.in/privacy</loc>'), 'Includes /privacy');
assert(sitemapXml.includes('<loc>https://runjs.in/terms</loc>'), 'Includes /terms');
assert(sitemapXml.includes('<loc>https://runjs.in/problems/two-sum</loc>'), 'Includes /problems/two-sum');
assert(!sitemapXml.includes('<loc>https://runjs.in/dashboard</loc>') && !sitemapXml.includes('/dashboard<'), 'Excludes private /dashboard');
assert(!sitemapXml.includes('<loc>https://runjs.in/bin</loc>') && !sitemapXml.includes('/bin<'), 'Excludes private /bin');
assert(!sitemapXml.includes('<loc>https://runjs.in/404</loc>') && !sitemapXml.includes('/404<'), 'Excludes /404');

console.log('\n--- 4. Validating Social Assets ---');
const ogImagePath = path.join(rootDir, 'public/og-image.png');
assert(fs.existsSync(ogImagePath), 'public/og-image.png exists');
const ogStat = fs.statSync(ogImagePath);
assert(ogStat.size > 1000, `og-image.png has valid file size (${ogStat.size} bytes)`);

console.log('\n--- 5. Validating Prerendered Static HTML Files in dist/ ---');
const distDir = path.join(rootDir, 'dist');

if (fs.existsSync(path.join(distDir, 'index.html'))) {
  const distIndexHtml = fs.readFileSync(path.join(distDir, 'index.html'), 'utf-8');
  assert(distIndexHtml.includes('data-prerendered="true"'), 'dist/index.html has data-prerendered tag');
  assert(distIndexHtml.includes('<h1'), 'dist/index.html contains prerendered <h1 heading');
  assert(distIndexHtml.includes('<link rel="canonical" href="https://runjs.in/" />'), 'dist/index.html canonical matches root /');

  // Validate problem prerender
  const twoSumHtmlPath = path.join(distDir, 'problems/two-sum/index.html');
  if (fs.existsSync(twoSumHtmlPath)) {
    const twoSumHtml = fs.readFileSync(twoSumHtmlPath, 'utf-8');
    assert(twoSumHtml.includes('<h1'), 'dist/problems/two-sum has prerendered <h1 heading');
    assert(twoSumHtml.includes('Two Sum'), 'dist/problems/two-sum contains problem title text');
    assert(twoSumHtml.includes('<link rel="canonical" href="https://runjs.in/problems/two-sum" />'), 'dist/problems/two-sum canonical matches clean URL without trailing slash');
    assert(twoSumHtml.includes('SoftwareSourceCode'), 'dist/problems/two-sum contains SoftwareSourceCode JSON-LD schema');
  } else {
    assert(false, 'dist/problems/two-sum/index.html exists');
  }

  // Validate lesson prerender
  const introHtmlPath = path.join(distDir, 'learn/intro/index.html');
  if (fs.existsSync(introHtmlPath)) {
    const introHtml = fs.readFileSync(introHtmlPath, 'utf-8');
    assert(introHtml.includes('<h1'), 'dist/learn/intro has prerendered <h1 heading');
    assert(introHtml.includes('<link rel="canonical" href="https://runjs.in/learn/intro" />'), 'dist/learn/intro canonical matches clean URL without trailing slash');
    assert(introHtml.includes('TechArticle'), 'dist/learn/intro contains TechArticle JSON-LD schema');
  } else {
    assert(false, 'dist/learn/intro/index.html exists');
  }

  // Validate 404 page
  const fourOhFourPath = path.join(distDir, '404.html');
  if (fs.existsSync(fourOhFourPath)) {
    const fourOhFourHtml = fs.readFileSync(fourOhFourPath, 'utf-8');
    assert(fourOhFourHtml.includes('noindex'), 'dist/404.html contains noindex meta tag');
  } else {
    assert(false, 'dist/404.html exists');
  }
} else {
  console.log('  ⓘ dist/ not built yet. Run `pnpm run build` to validate prerendered static HTML files.');
}

console.log(`\n========================================`);
console.log(`SEO Verification Summary: ${passedTests}/${totalTests} Tests Passed`);
console.log(`========================================\n`);

if (passedTests !== totalTests) {
  process.exit(1);
}
