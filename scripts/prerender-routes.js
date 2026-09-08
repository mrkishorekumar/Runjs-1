import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');
const indexHtmlPath = path.join(distDir, 'index.html');

if (!fs.existsSync(indexHtmlPath)) {
  console.log('dist/index.html not found, skipping prerender.');
  process.exit(0);
}

const templateHtml = fs.readFileSync(indexHtmlPath, 'utf-8');
const baseUrl = (process.env.VITE_SITE_URL || 'https://runjs.in').replace(/\/$/, '');

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function escapeAttr(str) {
  if (!str) return '';
  return String(str).replace(/"/g, '&quot;');
}

// Dynamically bundle and evaluate problem, curriculum, and lesson data using Vite
async function loadData() {
  const { build } = await import('vite');

  // 1. Problems data
  const probBuild = await build({
    build: {
      lib: {
        entry: path.join(rootDir, 'src/problem-engine/data/problems.ts'),
        formats: ['es'],
        fileName: 'problems',
      },
      write: false,
    },
    logLevel: 'silent',
  });
  const probCode = probBuild[0].output[0].code;
  const probMod = await import(
    'data:text/javascript;base64,' + Buffer.from(probCode).toString('base64')
  );

  // 2. Curriculum data
  const currBuild = await build({
    build: {
      lib: {
        entry: path.join(rootDir, 'src/learn/data/curriculum.ts'),
        formats: ['es'],
        fileName: 'curriculum',
      },
      write: false,
    },
    logLevel: 'silent',
  });
  const currCode = currBuild[0].output[0].code;
  const currMod = await import(
    'data:text/javascript;base64,' + Buffer.from(currCode).toString('base64')
  );

  // 3. Lesson registry data
  const lessonBuild = await build({
    build: {
      lib: {
        entry: path.join(rootDir, 'src/learn/data/lessonRegistry.ts'),
        formats: ['es'],
        fileName: 'lessons',
      },
      write: false,
    },
    logLevel: 'silent',
  });
  const lessonCode = lessonBuild[0].output[0].code;
  const lessonMod = await import(
    'data:text/javascript;base64,' + Buffer.from(lessonCode).toString('base64')
  );

  // 4. Interview questions JSON
  const interviewQuestionsPath = path.join(
    rootDir,
    'src/asset/interview_questions.json'
  );
  const interviewQuestions = JSON.parse(
    fs.readFileSync(interviewQuestionsPath, 'utf-8')
  );

  return {
    problems: probMod.PROBLEMS || [],
    curriculum: currMod.curriculum || [],
    lessons: lessonMod.allLessons || [],
    interviewQuestions,
  };
}

function renderHeaderNav() {
  return `
    <header style="border-bottom: 1px solid rgba(255,255,255,0.1); padding: 16px; background-color: #09090b;">
      <nav style="max-width: 1200px; margin: 0 auto; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
        <a href="/" style="font-weight: 800; font-size: 1.25rem; color: #f59e0b; text-decoration: none;">RunJS.in</a>
        <div style="display: flex; gap: 16px; flex-wrap: wrap; font-size: 0.875rem; color: #a1a1aa;">
          <a href="/learn" style="color: inherit; text-decoration: none;">Learn JS</a>
          <a href="/problems" style="color: inherit; text-decoration: none;">Coding Challenges</a>
          <a href="/js" style="color: inherit; text-decoration: none;">JS Playground</a>
          <a href="/visualizer" style="color: inherit; text-decoration: none;">Event Loop Visualizer</a>
          <a href="/execution-context" style="color: inherit; text-decoration: none;">Context Visualizer</a>
          <a href="/ts" style="color: inherit; text-decoration: none;">TypeScript</a>
          <a href="/react" style="color: inherit; text-decoration: none;">React Sandbox</a>
          <a href="/html" style="color: inherit; text-decoration: none;">HTML Studio</a>
          <a href="/interview" style="color: inherit; text-decoration: none;">Interview Q&amp;A</a>
          <a href="/output-questions" style="color: inherit; text-decoration: none;">Output Quiz</a>
        </div>
      </nav>
    </header>
  `;
}

function renderFooter() {
  return `
    <footer style="border-top: 1px solid rgba(255,255,255,0.1); padding: 32px 16px; margin-top: 48px; background-color: #09090b; font-size: 0.85rem; color: #71717a; text-align: center;">
      <div style="max-width: 1200px; margin: 0 auto; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;">
        <div>RunJS &copy; ${new Date().getFullYear()} • In-Browser Developer Playground &amp; Learning Platform</div>
        <div style="display: flex; gap: 16px; flex-wrap: wrap;">
          <a href="/about" style="color: inherit; text-decoration: none;">About</a>
          <a href="/kishorekumar" style="color: inherit; text-decoration: none;">Creator Portfolio</a>
          <a href="/privacy" style="color: inherit; text-decoration: none;">Privacy Policy</a>
          <a href="/terms" style="color: inherit; text-decoration: none;">Terms &amp; Conditions</a>
        </div>
      </div>
    </footer>
  `;
}

function renderLessonSections(sections) {
  if (!sections || !Array.isArray(sections)) return '';
  return sections
    .map((sec) => {
      let codeExamplesHtml = '';
      if (sec.codeExamples && Array.isArray(sec.codeExamples)) {
        codeExamplesHtml = sec.codeExamples
          .map((ce) => {
            const titleHtml = ce.title
              ? `<h4 style="font-size: 0.9rem; font-weight: 700; color: #f59e0b; margin-bottom: 6px;">${escapeHtml(ce.title)}</h4>`
              : '';
            const outputHtml = ce.output
              ? `<div style="font-size: 0.8rem; color: #10b981; font-family: monospace; margin-top: 4px;">// Output: ${escapeHtml(ce.output)}</div>`
              : '';
            const expHtml = ce.explanation
              ? `<p style="font-size: 0.85rem; color: #71717a; margin-top: 6px;">${escapeHtml(ce.explanation)}</p>`
              : '';
            return `<div style="margin: 16px 0 20px;">${titleHtml}<pre style="background: #18181b; padding: 16px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1); overflow-x: auto; font-family: monospace; font-size: 0.85rem; color: #f4f4f5;"><code>${escapeHtml(ce.code)}</code></pre>${outputHtml}${expHtml}</div>`;
          })
          .join('');
      }

      let bulletsHtml = '';
      if (sec.bulletPoints && Array.isArray(sec.bulletPoints)) {
        bulletsHtml = `<ul style="color: #a1a1aa; font-size: 0.95rem; line-height: 1.6; margin-bottom: 16px; padding-left: 20px;">${sec.bulletPoints.map((bp) => `<li>${escapeHtml(bp)}</li>`).join('')}</ul>`;
      }

      let calloutHtml = '';
      if (sec.callout) {
        calloutHtml = `<div style="padding: 14px 18px; border-left: 4px solid #f59e0b; background: rgba(245, 158, 11, 0.05); border-radius: 4px; margin: 16px 0;"><strong style="color: #f59e0b; text-transform: uppercase; font-size: 0.75rem;">${escapeHtml(sec.callout.type || 'Note')}</strong><p style="font-size: 0.9rem; color: #d4d4d8; margin: 4px 0 0;">${escapeHtml(sec.callout.text)}</p></div>`;
      }

      let paragraphsHtml = '';
      if (sec.paragraphs && Array.isArray(sec.paragraphs)) {
        paragraphsHtml = sec.paragraphs
          .map(
            (p) =>
              `<p style="font-size: 1rem; color: #d4d4d8; line-height: 1.7; margin-bottom: 12px;">${escapeHtml(p)}</p>`
          )
          .join('');
      }

      return `<section style="margin-bottom: 28px;"><h2 style="font-size: 1.35rem; font-weight: 800; color: #ffffff; margin-bottom: 12px;">${escapeHtml(sec.heading)}</h2>${paragraphsHtml}${bulletsHtml}${codeExamplesHtml}${calloutHtml}</section>`;
    })
    .join('');
}

async function main() {
  console.log('Loading dataset for prerendering...');
  const { problems, curriculum, lessons, interviewQuestions } = await loadData();
  console.log(`Loaded ${problems.length} problems, ${lessons.length} lessons, and ${interviewQuestions.length} interview questions.`);

  const lessonMap = new Map();
  for (const lesson of lessons) {
    lessonMap.set(lesson.slug, lesson);
  }

  const routes = [
    {
      path: '/',
      title: 'RunJS.in - In-Browser JavaScript, TypeScript & React Playground',
      description: 'Run, practice, and master JavaScript, TypeScript, and React directly in your browser. Zero setup, Monaco editor, esbuild WebAssembly compilation, 175+ lessons, and coding challenges.',
      type: 'home',
    },
    {
      path: '/learn',
      title: 'Learn JavaScript - 175+ Interactive Lessons & Exercises | RunJS',
      description: 'Master modern JavaScript from fundamentals to advanced concepts with 175+ interactive lessons, coding exercises, and instant browser execution.',
      type: 'learn-home',
    },
    {
      path: '/problems',
      title: 'JavaScript Coding Challenges & Algorithm Practice | RunJS',
      description: 'Practice JavaScript algorithms, data structures, closures, promises, and polyfills with instant in-browser test execution, hints, and complexity analysis.',
      type: 'problems-home',
    },
    {
      path: '/js',
      title: 'Online JavaScript Compiler & Scratchpad (ES2024+) | RunJS',
      description: 'Interactive in-browser JavaScript sandbox with Monaco editor, infinite loop protection, custom font controls, and interactive Luna console.',
      type: 'tool-js',
    },
    {
      path: '/visualizer',
      title: 'JavaScript Visualizer - Event Loop, Call Stack & Queues | RunJS',
      description: 'Interactive visualizer for JavaScript execution. Step through Call Stack frames, Event Loop phases, Microtask Queue (Promises), and Task Queue (setTimeout) in real time.',
      type: 'tool-visualizer',
    },
    {
      path: '/execution-context',
      title: 'JavaScript Execution Context Visualizer - Memory Allocation & Hoisting | RunJS',
      description: 'Interactive visualizer for JavaScript Execution Context. Step through Memory Allocation Phase (hoisting & TDZ), Code Execution Phase line by line, Global and Function Execution Contexts.',
      type: 'tool-execution-context',
    },
    {
      path: '/ts',
      title: 'Online TypeScript Playground with esbuild Wasm | RunJS',
      description: 'Fast, client-side TypeScript compiler powered by esbuild WebAssembly. Type check, compile, and execute TypeScript directly in your browser.',
      type: 'tool-ts',
    },
    {
      path: '/react',
      title: 'Online React & Vite Playground (Sandpack) | RunJS',
      description: 'In-browser React development environment with multi-file explorer, Sandpack live bundler, interactive preview, and xterm terminal.',
      type: 'tool-react',
    },
    {
      path: '/html',
      title: 'Online HTML & CSS Preview Studio | RunJS',
      description: 'Interactive in-browser HTML, CSS, and JavaScript preview studio with live reload, console drawer, and responsive viewport controls.',
      type: 'tool-html',
    },
    {
      path: '/interview',
      title: 'JavaScript Technical Interview Questions & Answers | RunJS',
      description: 'Master JavaScript technical interviews with curated questions and detailed solutions covering closures, event loop, promises, prototypes, and async/await.',
      type: 'interview',
    },
    {
      path: '/output-questions',
      title: 'JavaScript Output Questions — Predict the Output Quiz | RunJS',
      description: 'Test your JavaScript knowledge with 100 output-based MCQ questions covering closures, hoisting, promises, async/await, prototypes, type coercion, and more.',
      type: 'output-questions',
    },
    {
      path: '/about',
      title: 'About RunJS - Open Source Architecture & In-Browser IDE Story | RunJS',
      description: 'Learn how RunJS works, its 100% in-browser client architecture, WebAssembly compilation, AST loop protection, and open-source foundation.',
      type: 'about',
    },
    {
      path: '/kishorekumar',
      title: 'M R Kishore Kumar - Creator & Maintainer of RunJS | Portfolio',
      description: 'Meet M R Kishore Kumar, React Native Engineer with 4.5 years shipping consumer e-commerce apps at scale (1Cr+ downloads) and creator of RunJS.',
      type: 'creator',
    },
    {
      path: '/privacy',
      title: 'Privacy Policy - RunJS Developer Playground | RunJS',
      description: 'Privacy Policy for RunJS. Understand how our client-side, zero-server-tracking architecture keeps your code and data private in your browser.',
      type: 'privacy',
    },
    {
      path: '/terms',
      title: 'Terms and Conditions - RunJS Developer Playground | RunJS',
      description: 'Terms and Conditions for RunJS. Review user guidelines, code ownership guarantees, open-source licensing, and acceptable use policy.',
      type: 'terms',
    },
    {
      path: '/404',
      title: 'Page Not Found - 404 | RunJS',
      description: 'The requested page could not be found on RunJS.',
      type: '404',
      noIndex: true,
    },
  ];

  for (const prob of problems) {
    routes.push({
      path: `/problems/${prob.slug}`,
      title: `${prob.title} - JavaScript Coding Challenge | RunJS`,
      description: `Solve "${prob.title}" (${prob.difficulty}) in JavaScript with instant in-browser test verification, hints, and complexity analysis on RunJS.`,
      type: 'problem-detail',
      data: prob,
    });
  }

  for (const lesson of lessons) {
    routes.push({
      path: `/learn/${lesson.slug}`,
      title: `${lesson.title} - JavaScript Tutorial | RunJS`,
      description: escapeAttr(lesson.description || `Learn ${lesson.title} in JavaScript with interactive explanations, examples, and coding exercises on RunJS.`),
      type: 'lesson-detail',
      data: lesson,
    });
  }

  function generateBodyHtml(route) {
    const header = renderHeaderNav();
    const footer = renderFooter();

    let contentHtml = '';

    if (route.type === 'home') {
      contentHtml = `
        <main style="max-width: 1200px; margin: 0 auto; padding: 40px 16px;">
          <section style="text-align: center; margin-bottom: 48px;">
            <h1 style="font-size: 2.5rem; font-weight: 900; color: #f59e0b; margin-bottom: 16px;">RunJS.in - In-Browser Developer Playground</h1>
            <p style="font-size: 1.15rem; color: #d4d4d8; max-width: 800px; margin: 0 auto 24px;">Run, practice, and master JavaScript, TypeScript, and React directly in your browser. Zero setup, Monaco editor, esbuild WebAssembly compilation, 175+ structured lessons, and coding challenges.</p>
            <div style="display: flex; justify-content: center; gap: 12px; flex-wrap: wrap;">
              <a href="/js" style="background: #f59e0b; color: #000; padding: 12px 24px; border-radius: 8px; font-weight: 700; text-decoration: none;">Start Coding (JS)</a>
              <a href="/learn" style="background: rgba(255,255,255,0.1); color: #fff; padding: 12px 24px; border-radius: 8px; font-weight: 700; text-decoration: none;">Browse Curriculum</a>
              <a href="/problems" style="background: rgba(255,255,255,0.1); color: #fff; padding: 12px 24px; border-radius: 8px; font-weight: 700; text-decoration: none;">Solve Challenges</a>
            </div>
          </section>

          <section style="margin-bottom: 48px;">
            <h2 style="font-size: 1.5rem; font-weight: 800; margin-bottom: 20px;">Developer Playgrounds &amp; Visualizers</h2>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px;">
              <div style="padding: 20px; border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; background: #18181b;">
                <h3 style="font-size: 1.1rem; font-weight: 700; color: #f59e0b; margin-bottom: 8px;"><a href="/js" style="color: inherit; text-decoration: none;">JavaScript Sandbox</a></h3>
                <p style="font-size: 0.9rem; color: #a1a1aa;">ES2024+ code runner with AST infinite loop protection, Monaco editor, and Luna console viewer.</p>
              </div>
              <div style="padding: 20px; border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; background: #18181b;">
                <h3 style="font-size: 1.1rem; font-weight: 700; color: #3b82f6; margin-bottom: 8px;"><a href="/ts" style="color: inherit; text-decoration: none;">TypeScript Playground</a></h3>
                <p style="font-size: 0.9rem; color: #a1a1aa;">In-browser TypeScript compiler powered by esbuild WebAssembly with instant type checking.</p>
              </div>
              <div style="padding: 20px; border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; background: #18181b;">
                <h3 style="font-size: 1.1rem; font-weight: 700; color: #06b6d4; margin-bottom: 8px;"><a href="/react" style="color: inherit; text-decoration: none;">React &amp; Vite Playground</a></h3>
                <p style="font-size: 0.9rem; color: #a1a1aa;">Sandpack environment with multi-file support, live preview, and embedded xterm terminal.</p>
              </div>
              <div style="padding: 20px; border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; background: #18181b;">
                <h3 style="font-size: 1.1rem; font-weight: 700; color: #a855f7; margin-bottom: 8px;"><a href="/visualizer" style="color: inherit; text-decoration: none;">Event Loop Visualizer</a></h3>
                <p style="font-size: 0.9rem; color: #a1a1aa;">Step through Call Stack, Event Loop phases, Microtask Queue (Promises), and Task Queue in real time.</p>
              </div>
              <div style="padding: 20px; border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; background: #18181b;">
                <h3 style="font-size: 1.1rem; font-weight: 700; color: #10b981; margin-bottom: 8px;"><a href="/execution-context" style="color: inherit; text-decoration: none;">Context Visualizer</a></h3>
                <p style="font-size: 0.9rem; color: #a1a1aa;">Visualize memory creation, hoisting, TDZ, call stack frames, and variable scope line by line.</p>
              </div>
              <div style="padding: 20px; border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; background: #18181b;">
                <h3 style="font-size: 1.1rem; font-weight: 700; color: #f97316; margin-bottom: 8px;"><a href="/html" style="color: inherit; text-decoration: none;">HTML/CSS Preview Studio</a></h3>
                <p style="font-size: 0.9rem; color: #a1a1aa;">Live HTML and CSS viewport renderer with console drawer and responsive preview tools.</p>
              </div>
            </div>
          </section>

          <section style="margin-bottom: 48px;">
            <h2 style="font-size: 1.5rem; font-weight: 800; margin-bottom: 20px;">Interactive JavaScript Curriculum (${lessons.length} Lessons)</h2>
            <p style="font-size: 0.95rem; color: #a1a1aa; margin-bottom: 16px;">Structured learning path from fundamentals to advanced concepts, DOM manipulation, async JavaScript, and algorithms.</p>
            <div style="padding: 20px; border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; background: #18181b;">
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px;">
                ${curriculum.slice(0, 4).map(part => `
                  <div>
                    <h4 style="font-size: 0.9rem; font-weight: 700; color: #f59e0b;">Part ${part.partNumber}: ${escapeHtml(part.title)}</h4>
                    <p style="font-size: 0.8rem; color: #71717a; margin-top: 4px;">${escapeHtml(part.description)}</p>
                  </div>
                `).join('')}
              </div>
              <div style="margin-top: 16px; text-align: right;">
                <a href="/learn" style="color: #f59e0b; font-weight: 700; font-size: 0.9rem; text-decoration: none;">View All 175+ Lessons &rarr;</a>
              </div>
            </div>
          </section>

          <section style="margin-bottom: 48px;">
            <h2 style="font-size: 1.5rem; font-weight: 800; margin-bottom: 20px;">Coding Challenges (${problems.length} Problems)</h2>
            <div style="padding: 20px; border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; background: #18181b;">
              <ul style="list-style: none; padding: 0; margin: 0; display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 12px;">
                ${problems.slice(0, 12).map(p => `
                  <li style="font-size: 0.9rem;">
                    <a href="/problems/${p.slug}" style="color: #f59e0b; font-weight: 600; text-decoration: none;">#${p.id} ${escapeHtml(p.title)}</a>
                    <span style="font-size: 0.75rem; color: #71717a; margin-left: 6px;">(${p.difficulty})</span>
                  </li>
                `).join('')}
              </ul>
              <div style="margin-top: 16px; text-align: right;">
                <a href="/problems" style="color: #f59e0b; font-weight: 700; font-size: 0.9rem; text-decoration: none;">View All ${problems.length} Coding Challenges &rarr;</a>
              </div>
            </div>
          </section>
        </main>
      `;
    } else if (route.type === 'learn-home') {
      contentHtml = `
        <main style="max-width: 1200px; margin: 0 auto; padding: 40px 16px;">
          <h1 style="font-size: 2.25rem; font-weight: 900; color: #f59e0b; margin-bottom: 12px;">Learn JavaScript — 175+ Interactive Lessons</h1>
          <p style="font-size: 1.05rem; color: #d4d4d8; max-width: 850px; margin-bottom: 32px;">Master modern JavaScript from zero to advanced. 175+ structured lessons with runnable code examples, interactive exercises, and quizzes.</p>
          
          <div style="display: flex; flex-direction: column; gap: 32px;">
            ${curriculum.map(part => `
              <div style="padding: 24px; border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; background: #18181b;">
                <span style="font-size: 0.75rem; font-weight: 700; color: #f59e0b; text-transform: uppercase;">Part ${part.partNumber}</span>
                <h2 style="font-size: 1.35rem; font-weight: 800; margin: 4px 0 8px;">${escapeHtml(part.title)}</h2>
                <p style="font-size: 0.9rem; color: #a1a1aa; margin-bottom: 20px;">${escapeHtml(part.description)}</p>

                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px;">
                  ${part.topics.map(topic => `
                    <div style="padding: 16px; border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; background: #09090b;">
                      <h3 style="font-size: 1rem; font-weight: 700; color: #e4e4e7; margin-bottom: 6px;">${escapeHtml(topic.title)}</h3>
                      <p style="font-size: 0.8rem; color: #71717a; margin-bottom: 12px;">${escapeHtml(topic.description)}</p>
                      
                      <ul style="list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 6px;">
                        ${topic.lessonSlugs.map(slug => {
                          const l = lessonMap.get(slug);
                          const title = l ? l.title : slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
                          return `
                            <li>
                              <a href="/learn/${slug}" style="font-size: 0.85rem; color: #f59e0b; text-decoration: none;">&bull; ${escapeHtml(title)}</a>
                            </li>
                          `;
                        }).join('')}
                      </ul>
                    </div>
                  `).join('')}
                </div>
              </div>
            `).join('')}
          </div>
        </main>
      `;
    } else if (route.type === 'lesson-detail') {
      const lesson = route.data;
      const readTime = lesson.readingTime || lesson.timeToRead || 5;
      const sectionsContentHtml = renderLessonSections(lesson.sections);
      const fallbackContentHtml = lesson.content ? `<div style="font-size: 1rem; color: #e4e4e7; line-height: 1.7;">${escapeHtml(lesson.content).replace(/\n/g, '<br/>')}</div>` : '';

      contentHtml = `
        <main style="max-width: 900px; margin: 0 auto; padding: 40px 16px;">
          <nav style="font-size: 0.85rem; color: #71717a; margin-bottom: 20px;">
            <a href="/" style="color: inherit; text-decoration: none;">Home</a> &gt;
            <a href="/learn" style="color: inherit; text-decoration: none;">Learn JS</a> &gt;
            <span style="color: #d4d4d8;">${escapeHtml(lesson.title)}</span>
          </nav>

          <article>
            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
              <span style="font-size: 0.75rem; font-weight: 700; background: rgba(245, 158, 11, 0.1); color: #f59e0b; border: 1px solid rgba(245, 158, 11, 0.2); padding: 2px 8px; border-radius: 4px;">${escapeHtml(lesson.difficulty || 'beginner')}</span>
              <span style="font-size: 0.8rem; color: #71717a;">${readTime} min read</span>
            </div>

            <h1 style="font-size: 2.25rem; font-weight: 900; color: #ffffff; margin-bottom: 16px;">${escapeHtml(lesson.title)}</h1>
            <p style="font-size: 1.1rem; color: #a1a1aa; line-height: 1.6; margin-bottom: 32px;">${escapeHtml(lesson.description)}</p>

            ${sectionsContentHtml || fallbackContentHtml}

            ${lesson.keyTakeaways && lesson.keyTakeaways.length > 0 ? `
              <div style="padding: 20px; border: 1px solid rgba(245, 158, 11, 0.2); background: rgba(245, 158, 11, 0.04); border-radius: 12px; margin: 32px 0;">
                <h3 style="font-size: 1.1rem; font-weight: 700; color: #f59e0b; margin-bottom: 12px;">Key Takeaways</h3>
                <ul style="color: #d4d4d8; font-size: 0.95rem; line-height: 1.6; padding-left: 20px; margin: 0;">
                  ${lesson.keyTakeaways.map(kt => `<li>${escapeHtml(kt)}</li>`).join('')}
                </ul>
              </div>
            ` : ''}

            <div style="display: flex; justify-content: space-between; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 24px; margin-top: 48px;">
              <a href="/learn" style="color: #f59e0b; font-weight: 700; text-decoration: none;">&larr; Back to Learning Hub</a>
            </div>
          </article>
        </main>
      `;
    } else if (route.type === 'problems-home') {
      contentHtml = `
        <main style="max-width: 1200px; margin: 0 auto; padding: 40px 16px;">
          <h1 style="font-size: 2.25rem; font-weight: 900; color: #f59e0b; margin-bottom: 12px;">JavaScript Coding Challenges &amp; Algorithm Practice</h1>
          <p style="font-size: 1.05rem; color: #d4d4d8; max-width: 850px; margin-bottom: 32px;">Master algorithms, closures, data structures, promises, and polyfills with instant in-browser test execution, hints, and complexity analysis.</p>

          <div style="padding: 24px; border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; background: #18181b;">
            <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.9rem;">
              <thead>
                <tr style="border-bottom: 1px solid rgba(255,255,255,0.1); color: #a1a1aa; font-size: 0.8rem; text-transform: uppercase;">
                  <th style="padding: 12px 8px; width: 60px;">ID</th>
                  <th style="padding: 12px 8px;">Problem Title</th>
                  <th style="padding: 12px 8px; width: 120px;">Difficulty</th>
                  <th style="padding: 12px 8px; width: 200px;">Topics</th>
                  <th style="padding: 12px 8px; width: 100px; text-align: right;">Acceptance</th>
                </tr>
              </thead>
              <tbody>
                ${problems.map(p => `
                  <tr style="border-bottom: 1px solid rgba(255,255,255,0.04);">
                    <td style="padding: 12px 8px; color: #71717a;">#${p.id}</td>
                    <td style="padding: 12px 8px;">
                      <a href="/problems/${p.slug}" style="color: #f59e0b; font-weight: 700; text-decoration: none;">${escapeHtml(p.title)}</a>
                    </td>
                    <td style="padding: 12px 8px;">
                      <span style="font-size: 0.75rem; padding: 2px 6px; border-radius: 4px; background: rgba(255,255,255,0.05); color: ${p.difficulty === 'easy' ? '#10b981' : p.difficulty === 'medium' ? '#f59e0b' : '#ef4444'};">${p.difficulty}</span>
                    </td>
                    <td style="padding: 12px 8px; color: #a1a1aa; font-size: 0.8rem;">${escapeHtml(p.topics ? p.topics.join(', ') : '')}</td>
                    <td style="padding: 12px 8px; text-align: right; color: #71717a;">${p.acceptanceRate || '80%'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </main>
      `;
    } else if (route.type === 'problem-detail') {
      const prob = route.data;
      contentHtml = `
        <main style="max-width: 1000px; margin: 0 auto; padding: 40px 16px;">
          <nav style="font-size: 0.85rem; color: #71717a; margin-bottom: 20px;">
            <a href="/" style="color: inherit; text-decoration: none;">Home</a> &gt;
            <a href="/problems" style="color: inherit; text-decoration: none;">Problems</a> &gt;
            <span style="color: #d4d4d8;">${escapeHtml(prob.title)}</span>
          </nav>

          <article>
            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
              <span style="font-size: 0.8rem; font-weight: 700; color: #71717a;">#${prob.id}</span>
              <span style="font-size: 0.75rem; font-weight: 700; background: rgba(245, 158, 11, 0.1); color: #f59e0b; border: 1px solid rgba(245, 158, 11, 0.2); padding: 2px 8px; border-radius: 4px;">${escapeHtml(prob.difficulty)}</span>
              <span style="font-size: 0.8rem; color: #a1a1aa;">Acceptance: ${escapeHtml(prob.acceptanceRate || '85%')}</span>
            </div>

            <h1 style="font-size: 2.25rem; font-weight: 900; color: #ffffff; margin-bottom: 16px;">${escapeHtml(prob.title)}</h1>
            
            <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 24px;">
              ${(prob.topics || []).map(t => `<span style="font-size: 0.75rem; background: rgba(255,255,255,0.06); color: #a1a1aa; padding: 2px 8px; border-radius: 4px;">${escapeHtml(t)}</span>`).join('')}
            </div>

            <section style="font-size: 1rem; color: #e4e4e7; line-height: 1.7; margin-bottom: 32px; white-space: pre-line;">
              ${escapeHtml(prob.description)}
            </section>

            ${prob.examples && prob.examples.length > 0 ? `
              <section style="margin-bottom: 32px;">
                <h3 style="font-size: 1.1rem; font-weight: 700; color: #f59e0b; margin-bottom: 16px;">Example Test Cases</h3>
                ${prob.examples.map((ex, i) => `
                  <div style="padding: 16px; border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; background: #18181b; margin-bottom: 12px; font-family: monospace; font-size: 0.85rem;">
                    <strong>Example ${i + 1}:</strong><br/>
                    <span style="color: #a1a1aa;">Input:</span> ${escapeHtml(ex.input)}<br/>
                    <span style="color: #a1a1aa;">Output:</span> ${escapeHtml(ex.output)}<br/>
                    ${ex.explanation ? `<span style="color: #71717a;">Explanation: ${escapeHtml(ex.explanation)}</span>` : ''}
                  </div>
                `).join('')}
              </section>
            ` : ''}

            ${prob.constraints && prob.constraints.length > 0 ? `
              <section style="margin-bottom: 32px;">
                <h3 style="font-size: 1.1rem; font-weight: 700; color: #f59e0b; margin-bottom: 12px;">Constraints</h3>
                <ul style="color: #a1a1aa; font-family: monospace; font-size: 0.85rem; padding-left: 20px;">
                  ${prob.constraints.map(c => `<li>${escapeHtml(c)}</li>`).join('')}
                </ul>
              </section>
            ` : ''}

            ${prob.starterCode ? `
              <section style="margin-bottom: 32px;">
                <h3 style="font-size: 1.1rem; font-weight: 700; color: #f59e0b; margin-bottom: 12px;">JavaScript Solution Template</h3>
                <pre style="background: #18181b; padding: 20px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1); overflow-x: auto; font-family: monospace; font-size: 0.9rem; color: #f4f4f5;"><code>${escapeHtml(prob.starterCode.javascript || prob.starterCode.typescript || '')}</code></pre>
              </section>
            ` : ''}

            ${prob.hints && prob.hints.length > 0 ? `
              <section style="margin-bottom: 32px;">
                <h3 style="font-size: 1.1rem; font-weight: 700; color: #f59e0b; margin-bottom: 12px;">Hints</h3>
                ${prob.hints.map((h, i) => `
                  <details style="padding: 12px; border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; background: #18181b; margin-bottom: 8px; font-size: 0.9rem;">
                    <summary style="cursor: pointer; color: #f59e0b; font-weight: 600;">Hint ${i + 1}</summary>
                    <p style="margin-top: 8px; color: #d4d4d8;">${escapeHtml(h)}</p>
                  </details>
                `).join('')}
              </section>
            ` : ''}

            <div style="display: flex; justify-content: space-between; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 24px; margin-top: 48px;">
              <a href="/problems" style="color: #f59e0b; font-weight: 700; text-decoration: none;">&larr; Back to Problemset Table</a>
            </div>
          </article>
        </main>
      `;
    } else if (route.type === 'interview') {
      contentHtml = `
        <main style="max-width: 1100px; margin: 0 auto; padding: 40px 16px;">
          <h1 style="font-size: 2.25rem; font-weight: 900; color: #f59e0b; margin-bottom: 12px;">JavaScript Technical Interview Questions &amp; Answers</h1>
          <p style="font-size: 1.05rem; color: #d4d4d8; max-width: 850px; margin-bottom: 32px;">Master frontend engineering technical interviews with curated questions covering closures, event loop, promises, prototypes, async/await, and React performance.</p>

          <div style="display: flex; flex-direction: column; gap: 16px;">
            ${interviewQuestions.map((iq, i) => `
              <div style="padding: 20px; border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; background: #18181b;">
                <div style="font-size: 0.75rem; font-weight: 700; color: #f59e0b; text-transform: uppercase; margin-bottom: 4px;">Q${i + 1} &bull; ${escapeHtml(iq.category || 'JavaScript')}</div>
                <h3 style="font-size: 1.1rem; font-weight: 700; color: #ffffff; margin-bottom: 8px;">${escapeHtml(iq.question)}</h3>
                <div style="font-size: 0.9rem; color: #a1a1aa; line-height: 1.6;">
                  ${iq.answer ? iq.answer.map(a => `<p style="margin-bottom: 6px;">${escapeHtml(a.data ? a.data.join(' ') : '')}</p>`).join('') : ''}
                </div>
              </div>
            `).join('')}
          </div>
        </main>
      `;
    } else if (route.type === 'output-questions') {
      contentHtml = `
        <main style="max-width: 1100px; margin: 0 auto; padding: 40px 16px;">
          <h1 style="font-size: 2.25rem; font-weight: 900; color: #f59e0b; margin-bottom: 12px;">JavaScript Output Questions — Predict the Output Quiz</h1>
          <p style="font-size: 1.05rem; color: #d4d4d8; max-width: 850px; margin-bottom: 32px;">Test your JavaScript prediction skills with 100 interview-style output questions covering closures, hoisting, scope, and async execution.</p>
        </main>
      `;
    } else if (route.type === 'about') {
      contentHtml = `
        <main style="max-width: 900px; margin: 0 auto; padding: 40px 16px; line-height: 1.7;">
          <h1 style="font-size: 2.25rem; font-weight: 900; color: #f59e0b; margin-bottom: 16px;">About RunJS - In-Browser Developer IDE</h1>
          <p style="font-size: 1.1rem; color: #d4d4d8; margin-bottom: 24px;">RunJS is a 100% client-side developer playground built to write, run, visualize, and practice JavaScript, TypeScript, and React directly in the browser.</p>

          <h2 style="font-size: 1.4rem; font-weight: 800; color: #ffffff; margin: 32px 0 12px;">Key Architectural Highlights</h2>
          <ul style="color: #a1a1aa; padding-left: 20px;">
            <li>100% In-Browser Execution via WebAssembly and Sandpack sandbox.</li>
            <li>AST Analysis and infinite loop protection for real-time safety.</li>
            <li>Zero server tracking or cloud code storage. Your data stays in IndexedDB.</li>
            <li>Built-in Event Loop and Execution Context visualizers.</li>
            <li>Curated JavaScript curriculum with 175+ interactive lessons and coding challenges.</li>
          </ul>

          <h2 style="font-size: 1.4rem; font-weight: 800; color: #ffffff; margin: 32px 0 12px;">Creator &amp; Maintainer</h2>
          <p style="color: #a1a1aa;">Created by <a href="/kishorekumar" style="color: #f59e0b; font-weight: 700; text-decoration: none;">M R Kishore Kumar</a>, React Native Engineer shipping consumer e-commerce applications at scale (1Cr+ app downloads).</p>
        </main>
      `;
    } else if (route.type === 'creator') {
      contentHtml = `
        <main style="max-width: 900px; margin: 0 auto; padding: 40px 16px; line-height: 1.7;">
          <h1 style="font-size: 2.25rem; font-weight: 900; color: #f59e0b; margin-bottom: 8px;">M R Kishore Kumar</h1>
          <p style="font-size: 1.1rem; color: #a1a1aa; margin-bottom: 24px;">React Native Engineer &amp; Creator of RunJS (4.5+ Years Experience)</p>
          <p style="font-size: 1rem; color: #d4d4d8; margin-bottom: 24px;">Specializing in cross-platform mobile engineering, web performance, AST parsers, and developer tools. Creator of RunJS, used by thousands of developers to practice JavaScript and algorithms online.</p>
        </main>
      `;
    } else if (route.type === 'privacy') {
      contentHtml = `
        <main style="max-width: 900px; margin: 0 auto; padding: 40px 16px; line-height: 1.7;">
          <h1 style="font-size: 2.25rem; font-weight: 900; color: #f59e0b; margin-bottom: 16px;">Privacy Policy</h1>
          <p style="color: #d4d4d8; margin-bottom: 20px;">RunJS is engineered with a strict privacy-first architecture. All code compilation and execution occurs 100% locally within your browser using WebAssembly and client-side web workers.</p>
          <p style="color: #a1a1aa;">No code snippets, personal files, or execution results are transmitted to external backend servers.</p>
        </main>
      `;
    } else if (route.type === 'terms') {
      contentHtml = `
        <main style="max-width: 900px; margin: 0 auto; padding: 40px 16px; line-height: 1.7;">
          <h1 style="font-size: 2.25rem; font-weight: 900; color: #f59e0b; margin-bottom: 16px;">Terms and Conditions</h1>
          <p style="color: #d4d4d8; margin-bottom: 20px;">Welcome to RunJS. By using our website and tools, you agree to these Terms and Conditions.</p>
          <p style="color: #a1a1aa;">RunJS provides interactive developer tools for educational and development purposes under open-source licenses.</p>
        </main>
      `;
    } else if (route.type === '404') {
      contentHtml = `
        <main style="max-width: 800px; margin: 0 auto; padding: 60px 16px; text-align: center;">
          <h1 style="font-size: 3rem; font-weight: 900; color: #ef4444; margin-bottom: 16px;">404 - Page Not Found</h1>
          <p style="font-size: 1.1rem; color: #a1a1aa; margin-bottom: 32px;">The requested page could not be found or may have been moved.</p>
          <a href="/" style="background: #f59e0b; color: #000; padding: 12px 24px; border-radius: 8px; font-weight: 700; text-decoration: none;">Return to Home Page</a>
        </main>
      `;
    } else {
      contentHtml = `
        <main style="max-width: 1000px; margin: 0 auto; padding: 40px 16px;">
          <h1 style="font-size: 2.25rem; font-weight: 900; color: #f59e0b; margin-bottom: 16px;">${escapeHtml(route.title.split('|')[0])}</h1>
          <p style="font-size: 1.1rem; color: #d4d4d8; margin-bottom: 24px;">${escapeHtml(route.description)}</p>
        </main>
      `;
    }

    return `${header}\n${contentHtml}\n${footer}`;
  }

  function generateJsonLd(route) {
    const canonicalUrl = `${baseUrl}${route.path === '/' ? '/' : route.path}`;

    if (route.type === 'problem-detail') {
      const prob = route.data;
      return {
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'SoftwareSourceCode',
            '@id': `${canonicalUrl}#code`,
            name: prob.title,
            description: prob.description,
            programmingLanguage: 'JavaScript',
            codeRepository: canonicalUrl,
          },
          {
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Home', item: `${baseUrl}/` },
              { '@type': 'ListItem', position: 2, name: 'Problems', item: `${baseUrl}/problems` },
              { '@type': 'ListItem', position: 3, name: prob.title, item: canonicalUrl },
            ],
          },
        ],
      };
    }

    if (route.type === 'lesson-detail') {
      const lesson = route.data;
      return {
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'TechArticle',
            '@id': `${canonicalUrl}#article`,
            headline: lesson.title,
            description: lesson.description,
            url: canonicalUrl,
            inLanguage: 'en-US',
            author: {
              '@type': 'Person',
              name: 'M R Kishore Kumar',
              url: 'https://github.com/mrkishorekumar',
            },
          },
          {
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Home', item: `${baseUrl}/` },
              { '@type': 'ListItem', position: 2, name: 'Learn', item: `${baseUrl}/learn` },
              { '@type': 'ListItem', position: 3, name: lesson.title, item: canonicalUrl },
            ],
          },
        ],
      };
    }

    return {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'WebApplication',
          '@id': `${baseUrl}/#webapp`,
          name: 'RunJS',
          url: `${baseUrl}/`,
          applicationCategory: 'DeveloperApplication',
          operatingSystem: 'Any (Web Browser)',
          description: 'Run, practice, and master JavaScript, TypeScript, and React directly in your browser.',
        },
        {
          '@type': 'WebSite',
          '@id': `${baseUrl}/#website`,
          name: 'RunJS',
          url: `${baseUrl}/`,
        },
      ],
    };
  }

  function prerenderRoute(route) {
    const canonicalUrl = `${baseUrl}${route.path === '/' ? '/' : route.path}`;

    let html = templateHtml;

    // Replace <title>
    html = html.replace(
      /<title>[\s\S]*?<\/title>/,
      `<title>${escapeHtml(route.title)}</title>`
    );

    // Replace canonical link
    html = html.replace(
      /<link rel="canonical" href="[^"]*"\s*\/?>/,
      `<link rel="canonical" href="${canonicalUrl}" />`
    );

    // Replace meta description
    html = html.replace(
      /<meta name="description"[\s\S]*?content="[^"]*"\s*\/?>/,
      `<meta name="description" content="${escapeAttr(route.description)}">`
    );

    // Replace robots tag if noindex is true (e.g. for 404)
    if (route.noIndex) {
      html = html.replace(
        /<meta name="robots" content="[^"]*"\s*\/?>/,
        `<meta name="robots" content="noindex, follow">`
      );
    }

    // Replace og:title
    html = html.replace(
      /<meta property="og:title" content="[^"]*"\s*\/?>/,
      `<meta property="og:title" content="${escapeAttr(route.title)}" />`
    );

    // Replace og:description
    html = html.replace(
      /<meta property="og:description" content="[^"]*"\s*\/?>/,
      `<meta property="og:description" content="${escapeAttr(route.description)}" />`
    );

    // Replace og:url
    html = html.replace(
      /<meta property="og:url" content="[^"]*"\s*\/?>/,
      `<meta property="og:url" content="${canonicalUrl}" />`
    );

    // Replace twitter:title
    html = html.replace(
      /<meta name="twitter:title" content="[^"]*"\s*\/?>/,
      `<meta name="twitter:title" content="${escapeAttr(route.title)}" />`
    );

    // Replace twitter:description
    html = html.replace(
      /<meta name="twitter:description" content="[^"]*"\s*\/?>/,
      `<meta name="twitter:description" content="${escapeAttr(route.description)}" />`
    );

    // Inject Schema.org JSON-LD
    const jsonLd = generateJsonLd(route);
    html = html.replace(
      /<script type="application\/ld\+json">[\s\S]*?<\/script>/,
      `<script type="application/ld+json" id="seo-json-ld">${JSON.stringify(jsonLd)}</script>`
    );

    // Inject rich pre-rendered HTML into <div id="runjs"></div>
    const bodyContent = generateBodyHtml(route);
    html = html.replace(
      /<div id="runjs"><\/div>/,
      `<div id="runjs" data-prerendered="true">${bodyContent}</div>`
    );

    if (route.path === '/') {
      fs.writeFileSync(path.join(distDir, 'index.html'), html, 'utf-8');
    } else if (route.type === '404') {
      fs.writeFileSync(path.join(distDir, '404.html'), html, 'utf-8');
    } else {
      const routeDir = path.join(distDir, route.path);
      fs.mkdirSync(routeDir, { recursive: true });
      fs.writeFileSync(path.join(routeDir, 'index.html'), html, 'utf-8');
    }
  }

  for (const route of routes) {
    prerenderRoute(route);
  }

  console.log(`Successfully pre-rendered ${routes.length} static HTML route files with complete body content & schema in dist/.`);
}

main().catch(err => {
  console.error('Prerender script failed:', err);
  process.exit(1);
});
