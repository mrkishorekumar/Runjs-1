import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// 1. Extract coding challenge slugs
const problemsFilePath = path.join(
  rootDir,
  'src/problem-engine/data/problems.ts'
);
const problemsContent = fs.readFileSync(problemsFilePath, 'utf-8');
const problemSlugRegex = /slug:\s*'([^']+)'/g;
let match;
const problemSlugs = [];
while ((match = problemSlugRegex.exec(problemsContent)) !== null) {
  problemSlugs.push(match[1]);
}

// 2. Extract learn curriculum lesson slugs
const curriculumFilePath = path.join(rootDir, 'src/learn/data/curriculum.ts');
const lessonSlugs = [];
if (fs.existsSync(curriculumFilePath)) {
  const curriculumContent = fs.readFileSync(curriculumFilePath, 'utf-8');
  const lessonGroupRegex = /lessonSlugs:\s*\[([\s\S]*?)\]/g;
  let groupMatch;
  while ((groupMatch = lessonGroupRegex.exec(curriculumContent)) !== null) {
    const itemRegex = /'([^']+)'/g;
    let itemMatch;
    while ((itemMatch = itemRegex.exec(groupMatch[1])) !== null) {
      lessonSlugs.push(itemMatch[1]);
    }
  }
}

const baseUrl = process.env.VITE_SITE_URL || 'https://runjs.in';
const lastMod = new Date().toISOString().split('T')[0] + 'T00:00:00+00:00';

const coreRoutes = [
  { path: '', changefreq: 'daily', priority: '1.0' },
  { path: '/learn', changefreq: 'daily', priority: '0.95' },
  { path: '/problems', changefreq: 'daily', priority: '0.9' },
  { path: '/js', changefreq: 'weekly', priority: '0.85' },
  { path: '/visualizer', changefreq: 'weekly', priority: '0.85' },
  { path: '/execution-context', changefreq: 'weekly', priority: '0.85' },
  { path: '/ts', changefreq: 'weekly', priority: '0.85' },
  { path: '/react', changefreq: 'weekly', priority: '0.85' },
  { path: '/html', changefreq: 'weekly', priority: '0.85' },
  { path: '/interview', changefreq: 'weekly', priority: '0.8' },
  { path: '/output-questions', changefreq: 'weekly', priority: '0.8' },
  { path: '/about', changefreq: 'monthly', priority: '0.7' },
  { path: '/kishorekumar', changefreq: 'monthly', priority: '0.7' },
  { path: '/privacy', changefreq: 'monthly', priority: '0.5' },
  { path: '/terms', changefreq: 'monthly', priority: '0.5' },
  { path: '/contact', changefreq: 'monthly', priority: '0.6' },
];

let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

for (const route of coreRoutes) {
  xml += '  <url>\n';
  xml += `    <loc>${baseUrl}${route.path ? route.path : '/'}</loc>\n`;
  xml += `    <lastmod>${lastMod}</lastmod>\n`;
  xml += `    <changefreq>${route.changefreq}</changefreq>\n`;
  xml += `    <priority>${route.priority}</priority>\n`;
  xml += '  </url>\n';
}

for (const slug of lessonSlugs) {
  xml += '  <url>\n';
  xml += `    <loc>${baseUrl}/learn/${slug}</loc>\n`;
  xml += `    <lastmod>${lastMod}</lastmod>\n`;
  xml += `    <changefreq>weekly</changefreq>\n`;
  xml += `    <priority>0.8</priority>\n`;
  xml += '  </url>\n';
}

for (const slug of problemSlugs) {
  xml += '  <url>\n';
  xml += `    <loc>${baseUrl}/problems/${slug}</loc>\n`;
  xml += `    <lastmod>${lastMod}</lastmod>\n`;
  xml += `    <changefreq>monthly</changefreq>\n`;
  xml += `    <priority>0.8</priority>\n`;
  xml += '  </url>\n';
}

xml += '</urlset>\n';

const publicSitemapPath = path.join(rootDir, 'public/sitemap.xml');
fs.writeFileSync(publicSitemapPath, xml, 'utf-8');

const totalUrls = coreRoutes.length + lessonSlugs.length + problemSlugs.length;
console.log(
  `Generated sitemap.xml at ${publicSitemapPath} with ${totalUrls} URLs.`
);
