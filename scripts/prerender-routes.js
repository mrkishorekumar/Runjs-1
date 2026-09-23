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

const rawTemplateHtml = fs.readFileSync(indexHtmlPath, 'utf-8');
const templateHtml = rawTemplateHtml.replace(
  /<div id="runjs"[\s\S]*?<\/div>\s*(?=(?:<script\b|<\/body>))/i,
  '<div id="runjs"></div>\n'
);
const baseUrl = (process.env.VITE_SITE_URL || 'https://runjs.in').replace(
  /\/$/,
  ''
);

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
  const { problems, curriculum, lessons, interviewQuestions } =
    await loadData();
  console.log(
    `Loaded ${problems.length} problems, ${lessons.length} lessons, and ${interviewQuestions.length} interview questions.`
  );

  const lessonMap = new Map();
  for (const lesson of lessons) {
    lessonMap.set(lesson.slug, lesson);
  }

  const routes = [
    {
      path: '/',
      title: 'RunJS.in - In-Browser JavaScript, TypeScript & React Playground',
      description:
        'Run, practice, and master JavaScript, TypeScript, and React directly in your browser. Zero setup, Monaco editor, esbuild WebAssembly compilation, 175+ lessons, and coding challenges.',
      type: 'home',
    },
    {
      path: '/learn',
      title: 'Learn JavaScript - 175+ Interactive Lessons & Exercises | RunJS',
      description:
        'Master modern JavaScript from fundamentals to advanced concepts with 175+ interactive lessons, coding exercises, and instant browser execution.',
      type: 'learn-home',
    },
    {
      path: '/problems',
      title: 'JavaScript Coding Challenges & Algorithm Practice | RunJS',
      description:
        'Practice JavaScript algorithms, data structures, closures, promises, and polyfills with instant in-browser test execution, hints, and complexity analysis.',
      type: 'problems-home',
    },
    {
      path: '/js',
      title: 'JavaScript Playground - Run JavaScript in Your Browser | RunJS',
      description:
        'Interactive in-browser JavaScript sandbox with Monaco editor, infinite loop protection, custom font controls, and interactive Luna console.',
      type: 'tool-js',
    },
    {
      path: '/visualizer',
      title:
        'JavaScript Event Loop Visualizer - Call Stack, Microtasks & Tasks | RunJS',
      description:
        'Interactive visualizer for JavaScript execution. Step through Call Stack frames, Event Loop phases, Microtask Queue (Promises), and Task Queue (setTimeout) in real time.',
      type: 'tool-visualizer',
    },
    {
      path: '/execution-context',
      title:
        'JavaScript Execution Context Visualizer - Hoisting & Scope | RunJS',
      description:
        'Interactive visualizer for JavaScript Execution Context. Step through Memory Allocation Phase (hoisting & TDZ), Code Execution Phase line by line, Global and Function Execution Contexts.',
      type: 'tool-execution-context',
    },
    {
      path: '/ts',
      title:
        'TypeScript Playground - Run TypeScript Online with esbuild Wasm | RunJS',
      description:
        'Fast, client-side TypeScript compiler powered by esbuild WebAssembly. Type check, compile, and execute TypeScript directly in your browser.',
      type: 'tool-ts',
    },
    {
      path: '/react',
      title: 'React Playground - Build and Test React in Your Browser | RunJS',
      description:
        'In-browser React development environment with multi-file explorer, Sandpack live bundler, interactive preview, and xterm terminal.',
      type: 'tool-react',
    },
    {
      path: '/html',
      title: 'HTML & CSS Playground - Live Web Preview Studio | RunJS',
      description:
        'Interactive in-browser HTML, CSS, and JavaScript preview studio with live reload, console drawer, and responsive viewport controls.',
      type: 'tool-html',
    },
    {
      path: '/interview',
      title: 'JavaScript Technical Interview Questions & Answers | RunJS',
      description:
        'Master JavaScript technical interviews with curated questions and detailed solutions covering closures, event loop, promises, prototypes, and async/await.',
      type: 'interview',
    },
    {
      path: '/output-questions',
      title: 'JavaScript Output Questions — Predict the Output Quiz | RunJS',
      description:
        'Test your JavaScript knowledge with 100 output-based MCQ questions covering closures, hoisting, promises, async/await, prototypes, type coercion, and more.',
      type: 'output-questions',
    },
    {
      path: '/about',
      title:
        'About RunJS - Open Source Architecture & In-Browser IDE Story | RunJS',
      description:
        'Learn how RunJS works, its 100% in-browser client architecture, WebAssembly compilation, AST loop protection, and open-source foundation.',
      type: 'about',
    },
    {
      path: '/kishorekumar',
      title: 'M R Kishore Kumar - Creator & Maintainer of RunJS | Portfolio',
      description:
        'Meet M R Kishore Kumar, React Native Engineer with 4.5 years shipping consumer e-commerce apps at scale (1Cr+ downloads) and creator of RunJS.',
      type: 'creator',
    },
    {
      path: '/privacy',
      title: 'Privacy Policy - RunJS Developer Playground | RunJS',
      description:
        'Privacy Policy for RunJS. Understand how our client-side, zero-server-tracking architecture keeps your code and data private in your browser.',
      type: 'privacy',
    },
    {
      path: '/terms',
      title: 'Terms and Conditions - RunJS Developer Playground | RunJS',
      description:
        'Terms and Conditions for RunJS. Review user guidelines, code ownership guarantees, open-source licensing, and acceptable use policy.',
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
      description: escapeAttr(
        lesson.description ||
          `Learn ${lesson.title} in JavaScript with interactive explanations, examples, and coding exercises on RunJS.`
      ),
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
                ${curriculum
                  .slice(0, 4)
                  .map(
                    (part) => `
                  <div>
                    <h4 style="font-size: 0.9rem; font-weight: 700; color: #f59e0b;">Part ${part.partNumber}: ${escapeHtml(part.title)}</h4>
                    <p style="font-size: 0.8rem; color: #71717a; margin-top: 4px;">${escapeHtml(part.description)}</p>
                  </div>
                `
                  )
                  .join('')}
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
                ${problems
                  .slice(0, 12)
                  .map(
                    (p) => `
                  <li style="font-size: 0.9rem;">
                    <a href="/problems/${p.slug}" style="color: #f59e0b; font-weight: 600; text-decoration: none;">#${p.id} ${escapeHtml(p.title)}</a>
                    <span style="font-size: 0.75rem; color: #71717a; margin-left: 6px;">(${p.difficulty})</span>
                  </li>
                `
                  )
                  .join('')}
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
            ${curriculum
              .map(
                (part) => `
              <div style="padding: 24px; border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; background: #18181b;">
                <span style="font-size: 0.75rem; font-weight: 700; color: #f59e0b; text-transform: uppercase;">Part ${part.partNumber}</span>
                <h2 style="font-size: 1.35rem; font-weight: 800; margin: 4px 0 8px;">${escapeHtml(part.title)}</h2>
                <p style="font-size: 0.9rem; color: #a1a1aa; margin-bottom: 20px;">${escapeHtml(part.description)}</p>

                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px;">
                  ${part.topics
                    .map(
                      (topic) => `
                    <div style="padding: 16px; border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; background: #09090b;">
                      <h3 style="font-size: 1rem; font-weight: 700; color: #e4e4e7; margin-bottom: 6px;">${escapeHtml(topic.title)}</h3>
                      <p style="font-size: 0.8rem; color: #71717a; margin-bottom: 12px;">${escapeHtml(topic.description)}</p>
                      
                      <ul style="list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 6px;">
                        ${topic.lessonSlugs
                          .map((slug) => {
                            const l = lessonMap.get(slug);
                            const title = l
                              ? l.title
                              : slug
                                  .split('-')
                                  .map(
                                    (w) =>
                                      w.charAt(0).toUpperCase() + w.slice(1)
                                  )
                                  .join(' ');
                            return `
                            <li>
                              <a href="/learn/${slug}" style="font-size: 0.85rem; color: #f59e0b; text-decoration: none;">&bull; ${escapeHtml(title)}</a>
                            </li>
                          `;
                          })
                          .join('')}
                      </ul>
                    </div>
                  `
                    )
                    .join('')}
                </div>
              </div>
            `
              )
              .join('')}
          </div>
        </main>
      `;
    } else if (route.type === 'lesson-detail') {
      const lesson = route.data;
      const readTime = lesson.readingTime || lesson.timeToRead || 5;
      const sectionsContentHtml = renderLessonSections(lesson.sections);
      const fallbackContentHtml = lesson.content
        ? `<div style="font-size: 1rem; color: #e4e4e7; line-height: 1.7;">${escapeHtml(lesson.content).replace(/\n/g, '<br/>')}</div>`
        : '';

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

            ${
              lesson.keyTakeaways && lesson.keyTakeaways.length > 0
                ? `
              <div style="padding: 20px; border: 1px solid rgba(245, 158, 11, 0.2); background: rgba(245, 158, 11, 0.04); border-radius: 12px; margin: 32px 0;">
                <h3 style="font-size: 1.1rem; font-weight: 700; color: #f59e0b; margin-bottom: 12px;">Key Takeaways</h3>
                <ul style="color: #d4d4d8; font-size: 0.95rem; line-height: 1.6; padding-left: 20px; margin: 0;">
                  ${lesson.keyTakeaways.map((kt) => `<li>${escapeHtml(kt)}</li>`).join('')}
                </ul>
              </div>
            `
                : ''
            }

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
                ${problems
                  .map(
                    (p) => `
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
                `
                  )
                  .join('')}
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
              ${(prob.topics || []).map((t) => `<span style="font-size: 0.75rem; background: rgba(255,255,255,0.06); color: #a1a1aa; padding: 2px 8px; border-radius: 4px;">${escapeHtml(t)}</span>`).join('')}
            </div>

            <section style="font-size: 1rem; color: #e4e4e7; line-height: 1.7; margin-bottom: 32px; white-space: pre-line;">
              ${escapeHtml(prob.description)}
            </section>

            ${
              prob.examples && prob.examples.length > 0
                ? `
              <section style="margin-bottom: 32px;">
                <h3 style="font-size: 1.1rem; font-weight: 700; color: #f59e0b; margin-bottom: 16px;">Example Test Cases</h3>
                ${prob.examples
                  .map(
                    (ex, i) => `
                  <div style="padding: 16px; border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; background: #18181b; margin-bottom: 12px; font-family: monospace; font-size: 0.85rem;">
                    <strong>Example ${i + 1}:</strong><br/>
                    <span style="color: #a1a1aa;">Input:</span> ${escapeHtml(ex.input)}<br/>
                    <span style="color: #a1a1aa;">Output:</span> ${escapeHtml(ex.output)}<br/>
                    ${ex.explanation ? `<span style="color: #71717a;">Explanation: ${escapeHtml(ex.explanation)}</span>` : ''}
                  </div>
                `
                  )
                  .join('')}
              </section>
            `
                : ''
            }

            ${
              prob.constraints && prob.constraints.length > 0
                ? `
              <section style="margin-bottom: 32px;">
                <h3 style="font-size: 1.1rem; font-weight: 700; color: #f59e0b; margin-bottom: 12px;">Constraints</h3>
                <ul style="color: #a1a1aa; font-family: monospace; font-size: 0.85rem; padding-left: 20px;">
                  ${prob.constraints.map((c) => `<li>${escapeHtml(c)}</li>`).join('')}
                </ul>
              </section>
            `
                : ''
            }

            ${
              prob.starterCode
                ? `
              <section style="margin-bottom: 32px;">
                <h3 style="font-size: 1.1rem; font-weight: 700; color: #f59e0b; margin-bottom: 12px;">JavaScript Solution Template</h3>
                <pre style="background: #18181b; padding: 20px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1); overflow-x: auto; font-family: monospace; font-size: 0.9rem; color: #f4f4f5;"><code>${escapeHtml(prob.starterCode.javascript || prob.starterCode.typescript || '')}</code></pre>
              </section>
            `
                : ''
            }

            ${
              prob.hints && prob.hints.length > 0
                ? `
              <section style="margin-bottom: 32px;">
                <h3 style="font-size: 1.1rem; font-weight: 700; color: #f59e0b; margin-bottom: 12px;">Hints</h3>
                ${prob.hints
                  .map(
                    (h, i) => `
                  <details style="padding: 12px; border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; background: #18181b; margin-bottom: 8px; font-size: 0.9rem;">
                    <summary style="cursor: pointer; color: #f59e0b; font-weight: 600;">Hint ${i + 1}</summary>
                    <p style="margin-top: 8px; color: #d4d4d8;">${escapeHtml(h)}</p>
                  </details>
                `
                  )
                  .join('')}
              </section>
            `
                : ''
            }

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
            ${interviewQuestions
              .map(
                (iq, i) => `
              <div style="padding: 20px; border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; background: #18181b;">
                <div style="font-size: 0.75rem; font-weight: 700; color: #f59e0b; text-transform: uppercase; margin-bottom: 4px;">Q${i + 1} &bull; ${escapeHtml(iq.category || 'JavaScript')}</div>
                <h3 style="font-size: 1.1rem; font-weight: 700; color: #ffffff; margin-bottom: 8px;">${escapeHtml(iq.question)}</h3>
                <div style="font-size: 0.9rem; color: #a1a1aa; line-height: 1.6;">
                  ${iq.answer ? iq.answer.map((a) => `<p style="margin-bottom: 6px;">${escapeHtml(a.data ? a.data.join(' ') : '')}</p>`).join('') : ''}
                </div>
              </div>
            `
              )
              .join('')}
          </div>
        </main>
      `;
    } else if (route.type === 'tool-js') {
      contentHtml = `
        <main style="max-width: 1100px; margin: 0 auto; padding: 40px 16px; line-height: 1.7;">
          <header style="margin-bottom: 36px;">
            <div style="display: inline-flex; align-items: center; gap: 8px; font-size: 0.75rem; font-weight: 700; color: #f59e0b; text-transform: uppercase; background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.2); padding: 4px 10px; border-radius: 9999px; margin-bottom: 12px;">
              <span>ECMAScript 2024+</span> &bull; <span>100% In-Browser</span> &bull; <span>No Sign-Up Required</span>
            </div>
            <h1 style="font-size: 2.5rem; font-weight: 900; color: #ffffff; margin-bottom: 16px; line-height: 1.2;">JavaScript Playground &amp; Online Compiler</h1>
            <p style="font-size: 1.15rem; color: #d4d4d8; max-width: 900px; margin-bottom: 24px;">RunJS is an interactive, zero-setup JavaScript sandbox powered by Monaco Editor, an interactive Luna console, and real-time AST loop protection. Execute modern ES2024+ code directly in your browser with zero latency and full privacy.</p>
            <div style="display: flex; gap: 12px; flex-wrap: wrap;">
              <a href="/js" style="background: #f59e0b; color: #000; padding: 12px 24px; border-radius: 8px; font-weight: 700; text-decoration: none;">Launch JS Playground</a>
              <a href="/visualizer" style="background: rgba(255,255,255,0.1); color: #fff; padding: 12px 24px; border-radius: 8px; font-weight: 700; text-decoration: none;">Event Loop Visualizer</a>
              <a href="/problems" style="background: rgba(255,255,255,0.1); color: #fff; padding: 12px 24px; border-radius: 8px; font-weight: 700; text-decoration: none;">Coding Challenges</a>
            </div>
          </header>

          <section style="margin-bottom: 40px;">
            <h2 style="font-size: 1.5rem; font-weight: 800; color: #f59e0b; margin-bottom: 16px;">Key Features &amp; Technical Capabilities</h2>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px;">
              <div style="padding: 20px; border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; background: #18181b;">
                <h3 style="font-size: 1.1rem; font-weight: 700; color: #ffffff; margin-bottom: 8px;">Modern ES2024+ Runtime</h3>
                <p style="font-size: 0.9rem; color: #a1a1aa;">Native client-side JavaScript execution supporting async/await, optional chaining, top-level await, Promise APIs, and modern ES standard specifications.</p>
              </div>
              <div style="padding: 20px; border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; background: #18181b;">
                <h3 style="font-size: 1.1rem; font-weight: 700; color: #ffffff; margin-bottom: 8px;">AST Infinite Loop Guard</h3>
                <p style="font-size: 0.9rem; color: #a1a1aa;">Real-time Acorn AST transformation instruments loops with iteration count guards, preventing browser lockups and crashes from accidental infinite loops.</p>
              </div>
              <div style="padding: 20px; border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; background: #18181b;">
                <h3 style="font-size: 1.1rem; font-weight: 700; color: #ffffff; margin-bottom: 8px;">Monaco Code Editor</h3>
                <p style="font-size: 0.9rem; color: #a1a1aa;">VS Code editing experience with syntax highlighting, IntelliSense autocomplete, bracket matching, Prettier document formatting, and customizable font size.</p>
              </div>
              <div style="padding: 20px; border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; background: #18181b;">
                <h3 style="font-size: 1.1rem; font-weight: 700; color: #ffffff; margin-bottom: 8px;">Interactive Luna Console</h3>
                <p style="font-size: 0.9rem; color: #a1a1aa;">Dedicated developer console displaying expandable nested objects, arrays, errors, stack traces, and execution time measurements.</p>
              </div>
              <div style="padding: 20px; border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; background: #18181b;">
                <h3 style="font-size: 1.1rem; font-weight: 700; color: #ffffff; margin-bottom: 8px;">100% Client-Side Privacy</h3>
                <p style="font-size: 0.9rem; color: #a1a1aa;">All code executes locally inside your browser via Web Workers. No code snippets or execution results are ever transmitted to external backend servers.</p>
              </div>
              <div style="padding: 20px; border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; background: #18181b;">
                <h3 style="font-size: 1.1rem; font-weight: 700; color: #ffffff; margin-bottom: 8px;">Time &amp; Space Complexity</h3>
                <p style="font-size: 0.9rem; color: #a1a1aa;">Built-in static AST algorithm analyzer evaluates time complexity (Big-O) and memory allocation characteristics with optimization tips.</p>
              </div>
            </div>
          </section>

          <section style="margin-bottom: 40px; padding: 24px; border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; background: #18181b;">
            <h2 style="font-size: 1.35rem; font-weight: 800; color: #ffffff; margin-bottom: 12px;">How to Use the JavaScript Playground</h2>
            <ol style="color: #a1a1aa; font-size: 0.95rem; line-height: 1.7; padding-left: 20px; margin: 0 0 16px;">
              <li><strong>Write Code:</strong> Type or paste your JavaScript snippet into the Monaco editor.</li>
              <li><strong>Run:</strong> Click <code>Run</code> or press <code>Cmd/Ctrl + R</code> to execute immediately.</li>
              <li><strong>Inspect Output:</strong> View console logs, return values, and errors in the interactive Luna terminal.</li>
              <li><strong>Save &amp; Export:</strong> Workspaces automatically save to your local browser IndexedDB, or download as a standalone <code>.js</code> file.</li>
            </ol>
          </section>

          <section style="margin-bottom: 40px;">
            <h2 style="font-size: 1.35rem; font-weight: 800; color: #ffffff; margin-bottom: 16px;">Frequently Asked Questions</h2>
            <div style="display: flex; flex-direction: column; gap: 12px;">
              <details style="padding: 14px; border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; background: #18181b;">
                <summary style="cursor: pointer; font-weight: 700; color: #f59e0b;">Is RunJS free to use?</summary>
                <p style="margin-top: 8px; color: #a1a1aa; font-size: 0.9rem;">Yes, RunJS is 100% free and open-source. There are no subscriptions, paywalls, or credit card requirements.</p>
              </details>
              <details style="padding: 14px; border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; background: #18181b;">
                <summary style="cursor: pointer; font-weight: 700; color: #f59e0b;">Is an account or sign-up required?</summary>
                <p style="margin-top: 8px; color: #a1a1aa; font-size: 0.9rem;">No sign-up or registration is required. You can start writing and running code immediately.</p>
              </details>
              <details style="padding: 14px; border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; background: #18181b;">
                <summary style="cursor: pointer; font-weight: 700; color: #f59e0b;">Does RunJS protect against infinite loops?</summary>
                <p style="margin-top: 8px; color: #a1a1aa; font-size: 0.9rem;">Yes. RunJS uses Acorn AST analysis to inject loop guards that automatically abort runaway loops before they can freeze the browser tab.</p>
              </details>
            </div>
          </section>

          <section style="margin-top: 32px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 24px;">
            <h3 style="font-size: 1.1rem; font-weight: 700; color: #ffffff; margin-bottom: 12px;">Explore Related Developer Tools</h3>
            <div style="display: flex; gap: 12px; flex-wrap: wrap; font-size: 0.85rem;">
              <a href="/ts" style="color: #3b82f6; text-decoration: none; font-weight: 600;">TypeScript Playground &rarr;</a>
              <a href="/react" style="color: #06b6d4; text-decoration: none; font-weight: 600;">React &amp; Vite Sandbox &rarr;</a>
              <a href="/visualizer" style="color: #a855f7; text-decoration: none; font-weight: 600;">Event Loop Visualizer &rarr;</a>
              <a href="/execution-context" style="color: #10b981; text-decoration: none; font-weight: 600;">Execution Context Visualizer &rarr;</a>
              <a href="/problems" style="color: #f59e0b; text-decoration: none; font-weight: 600;">Coding Challenges &rarr;</a>
              <a href="/learn" style="color: #e4e4e7; text-decoration: none; font-weight: 600;">Learn JavaScript &rarr;</a>
            </div>
          </section>
        </main>
      `;
    } else if (route.type === 'tool-ts') {
      contentHtml = `
        <main style="max-width: 1100px; margin: 0 auto; padding: 40px 16px; line-height: 1.7;">
          <header style="margin-bottom: 36px;">
            <div style="display: inline-flex; align-items: center; gap: 8px; font-size: 0.75rem; font-weight: 700; color: #3b82f6; text-transform: uppercase; background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.2); padding: 4px 10px; border-radius: 9999px; margin-bottom: 12px;">
              <span>TypeScript 5.8</span> &bull; <span>esbuild WebAssembly</span> &bull; <span>Zero Setup</span>
            </div>
            <h1 style="font-size: 2.5rem; font-weight: 900; color: #ffffff; margin-bottom: 16px; line-height: 1.2;">Online TypeScript Playground with esbuild Wasm</h1>
            <p style="font-size: 1.15rem; color: #d4d4d8; max-width: 900px; margin-bottom: 24px;">Compile and execute TypeScript directly in your browser. Powered by esbuild WebAssembly for instant compilation and Microsoft Monaco editor for full static type checking and IntelliSense.</p>
            <div style="display: flex; gap: 12px; flex-wrap: wrap;">
              <a href="/ts" style="background: #3b82f6; color: #fff; padding: 12px 24px; border-radius: 8px; font-weight: 700; text-decoration: none;">Launch TypeScript Playground</a>
              <a href="/js" style="background: rgba(255,255,255,0.1); color: #fff; padding: 12px 24px; border-radius: 8px; font-weight: 700; text-decoration: none;">JavaScript Sandbox</a>
              <a href="/react" style="background: rgba(255,255,255,0.1); color: #fff; padding: 12px 24px; border-radius: 8px; font-weight: 700; text-decoration: none;">React Playground</a>
            </div>
          </header>

          <section style="margin-bottom: 40px;">
            <h2 style="font-size: 1.5rem; font-weight: 800; color: #3b82f6; margin-bottom: 16px;">TypeScript Engine &amp; Capabilities</h2>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px;">
              <div style="padding: 20px; border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; background: #18181b;">
                <h3 style="font-size: 1.1rem; font-weight: 700; color: #ffffff; margin-bottom: 8px;">esbuild WebAssembly Transpilation</h3>
                <p style="font-size: 0.9rem; color: #a1a1aa;">Transforms TypeScript types, interfaces, enums, and generics into clean executable JavaScript in sub-millisecond execution times directly on your CPU.</p>
              </div>
              <div style="padding: 20px; border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; background: #18181b;">
                <h3 style="font-size: 1.1rem; font-weight: 700; color: #ffffff; margin-bottom: 8px;">Inline Type Diagnostics</h3>
                <p style="font-size: 0.9rem; color: #a1a1aa;">Monaco editor language service provides real-time red squiggly underlines, error diagnostics, type tooltips, and autocomplete suggestions.</p>
              </div>
              <div style="padding: 20px; border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; background: #18181b;">
                <h3 style="font-size: 1.1rem; font-weight: 700; color: #ffffff; margin-bottom: 8px;">Zero Server Round-Trips</h3>
                <p style="font-size: 0.9rem; color: #a1a1aa;">Unlike standard online sandboxes that invoke remote compiler microservices, RunJS compiles TypeScript entirely client-side for zero latency and private execution.</p>
              </div>
            </div>
          </section>

          <section style="margin-top: 32px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 24px;">
            <h3 style="font-size: 1.1rem; font-weight: 700; color: #ffffff; margin-bottom: 12px;">Related Tools &amp; Resources</h3>
            <div style="display: flex; gap: 12px; flex-wrap: wrap; font-size: 0.85rem;">
              <a href="/js" style="color: #f59e0b; text-decoration: none; font-weight: 600;">JavaScript Playground &rarr;</a>
              <a href="/react" style="color: #06b6d4; text-decoration: none; font-weight: 600;">React Sandbox &rarr;</a>
              <a href="/visualizer" style="color: #a855f7; text-decoration: none; font-weight: 600;">Event Loop Visualizer &rarr;</a>
              <a href="/problems" style="color: #f59e0b; text-decoration: none; font-weight: 600;">Algorithm Challenges &rarr;</a>
            </div>
          </section>
        </main>
      `;
    } else if (route.type === 'tool-react') {
      contentHtml = `
        <main style="max-width: 1100px; margin: 0 auto; padding: 40px 16px; line-height: 1.7;">
          <header style="margin-bottom: 36px;">
            <div style="display: inline-flex; align-items: center; gap: 8px; font-size: 0.75rem; font-weight: 700; color: #06b6d4; text-transform: uppercase; background: rgba(6, 182, 212, 0.1); border: 1px solid rgba(6, 182, 212, 0.2); padding: 4px 10px; border-radius: 9999px; margin-bottom: 12px;">
              <span>React 19</span> &bull; <span>Vite Bundler</span> &bull; <span>Sandpack VFS</span>
            </div>
            <h1 style="font-size: 2.5rem; font-weight: 900; color: #ffffff; margin-bottom: 16px; line-height: 1.2;">React Playground — Build &amp; Test React in Your Browser</h1>
            <p style="font-size: 1.15rem; color: #d4d4d8; max-width: 900px; margin-bottom: 24px;">Full-featured React and Vite development environment with multi-file project explorer, live preview rendering, xterm console, and Sandpack bundler. Zero setup, zero install, runs entirely in the browser.</p>
            <div style="display: flex; gap: 12px; flex-wrap: wrap;">
              <a href="/react" style="background: #06b6d4; color: #000; padding: 12px 24px; border-radius: 8px; font-weight: 700; text-decoration: none;">Launch React Playground</a>
              <a href="/js" style="background: rgba(255,255,255,0.1); color: #fff; padding: 12px 24px; border-radius: 8px; font-weight: 700; text-decoration: none;">JavaScript Sandbox</a>
              <a href="/html" style="background: rgba(255,255,255,0.1); color: #fff; padding: 12px 24px; border-radius: 8px; font-weight: 700; text-decoration: none;">HTML Studio</a>
            </div>
          </header>

          <section style="margin-bottom: 40px;">
            <h2 style="font-size: 1.5rem; font-weight: 800; color: #06b6d4; margin-bottom: 16px;">React Playground Features</h2>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px;">
              <div style="padding: 20px; border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; background: #18181b;">
                <h3 style="font-size: 1.1rem; font-weight: 700; color: #ffffff; margin-bottom: 8px;">Multi-File Virtual File System</h3>
                <p style="font-size: 0.9rem; color: #a1a1aa;">Add, rename, and organize multiple JSX, TSX, CSS, and utility files just like a local Vite project.</p>
              </div>
              <div style="padding: 20px; border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; background: #18181b;">
                <h3 style="font-size: 1.1rem; font-weight: 700; color: #ffffff; margin-bottom: 8px;">Live Iframe Preview &amp; HMR</h3>
                <p style="font-size: 0.9rem; color: #a1a1aa;">Instant hot module reloading previews component changes in real time inside an isolated sandboxed iframe.</p>
              </div>
              <div style="padding: 20px; border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; background: #18181b;">
                <h3 style="font-size: 1.1rem; font-weight: 700; color: #ffffff; margin-bottom: 8px;">Embedded xterm Terminal</h3>
                <p style="font-size: 0.9rem; color: #a1a1aa;">Integrated terminal displays bundler build status, compilation diagnostics, console logs, and runtime warnings.</p>
              </div>
            </div>
          </section>

          <section style="margin-top: 32px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 24px;">
            <h3 style="font-size: 1.1rem; font-weight: 700; color: #ffffff; margin-bottom: 12px;">Explore Related Tools</h3>
            <div style="display: flex; gap: 12px; flex-wrap: wrap; font-size: 0.85rem;">
              <a href="/js" style="color: #f59e0b; text-decoration: none; font-weight: 600;">JavaScript Playground &rarr;</a>
              <a href="/html" style="color: #f97316; text-decoration: none; font-weight: 600;">HTML/CSS Preview Studio &rarr;</a>
              <a href="/learn" style="color: #e4e4e7; text-decoration: none; font-weight: 600;">JavaScript Curriculum &rarr;</a>
            </div>
          </section>
        </main>
      `;
    } else if (route.type === 'tool-html') {
      contentHtml = `
        <main style="max-width: 1100px; margin: 0 auto; padding: 40px 16px; line-height: 1.7;">
          <header style="margin-bottom: 36px;">
            <div style="display: inline-flex; align-items: center; gap: 8px; font-size: 0.75rem; font-weight: 700; color: #f97316; text-transform: uppercase; background: rgba(249, 115, 22, 0.1); border: 1px solid rgba(249, 115, 22, 0.2); padding: 4px 10px; border-radius: 9999px; margin-bottom: 12px;">
              <span>HTML5 &bull; CSS3 &bull; JS</span> &bull; <span>Live Preview</span> &bull; <span>Console Drawer</span>
            </div>
            <h1 style="font-size: 2.5rem; font-weight: 900; color: #ffffff; margin-bottom: 16px; line-height: 1.2;">HTML &amp; CSS Playground — Live Web Preview Studio</h1>
            <p style="font-size: 1.15rem; color: #d4d4d8; max-width: 900px; margin-bottom: 24px;">Interactive 3-panel frontend playground for HTML, CSS, and JavaScript. Edit markup, styles, and scripts simultaneously with real-time responsive preview and console output.</p>
            <div style="display: flex; gap: 12px; flex-wrap: wrap;">
              <a href="/html" style="background: #f97316; color: #fff; padding: 12px 24px; border-radius: 8px; font-weight: 700; text-decoration: none;">Launch HTML Studio</a>
              <a href="/js" style="background: rgba(255,255,255,0.1); color: #fff; padding: 12px 24px; border-radius: 8px; font-weight: 700; text-decoration: none;">JavaScript Sandbox</a>
              <a href="/react" style="background: rgba(255,255,255,0.1); color: #fff; padding: 12px 24px; border-radius: 8px; font-weight: 700; text-decoration: none;">React Playground</a>
            </div>
          </header>

          <section style="margin-bottom: 40px;">
            <h2 style="font-size: 1.5rem; font-weight: 800; color: #f97316; margin-bottom: 16px;">HTML Studio Features</h2>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px;">
              <div style="padding: 20px; border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; background: #18181b;">
                <h3 style="font-size: 1.1rem; font-weight: 700; color: #ffffff; margin-bottom: 8px;">3-Panel Synchronized Editing</h3>
                <p style="font-size: 0.9rem; color: #a1a1aa;">Independent editor tabs for HTML markup, CSS stylesheets, and client JavaScript with Emmet and syntax highlighting.</p>
              </div>
              <div style="padding: 20px; border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; background: #18181b;">
                <h3 style="font-size: 1.1rem; font-weight: 700; color: #ffffff; margin-bottom: 8px;">Responsive Viewport Testing</h3>
                <p style="font-size: 0.9rem; color: #a1a1aa;">Test responsive CSS layouts across mobile, tablet, and desktop preview widths instantly.</p>
              </div>
              <div style="padding: 20px; border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; background: #18181b;">
                <h3 style="font-size: 1.1rem; font-weight: 700; color: #ffffff; margin-bottom: 8px;">Live Console Drawer</h3>
                <p style="font-size: 0.9rem; color: #a1a1aa;">Inspect DOM events, click handlers, script errors, and console.log messages in a slide-out drawer.</p>
              </div>
            </div>
          </section>
        </main>
      `;
    } else if (route.type === 'tool-visualizer') {
      contentHtml = `
        <main style="max-width: 1100px; margin: 0 auto; padding: 40px 16px; line-height: 1.7;">
          <header style="margin-bottom: 36px;">
            <div style="display: inline-flex; align-items: center; gap: 8px; font-size: 0.75rem; font-weight: 700; color: #a855f7; text-transform: uppercase; background: rgba(168, 85, 247, 0.1); border: 1px solid rgba(168, 85, 247, 0.2); padding: 4px 10px; border-radius: 9999px; margin-bottom: 12px;">
              <span>Call Stack</span> &bull; <span>Event Loop</span> &bull; <span>Microtask Queue</span>
            </div>
            <h1 style="font-size: 2.5rem; font-weight: 900; color: #ffffff; margin-bottom: 16px; line-height: 1.2;">JavaScript Event Loop Visualizer — Call Stack &amp; Queues</h1>
            <p style="font-size: 1.15rem; color: #d4d4d8; max-width: 900px; margin-bottom: 24px;">Interactive step-by-step visualizer for JavaScript asynchronous execution. Step through Call Stack frames, Event Loop phases, Microtask Queue (Promises), and Task Queue (setTimeout) in real time.</p>
            <div style="display: flex; gap: 12px; flex-wrap: wrap;">
              <a href="/visualizer" style="background: #a855f7; color: #fff; padding: 12px 24px; border-radius: 8px; font-weight: 700; text-decoration: none;">Launch Event Loop Visualizer</a>
              <a href="/execution-context" style="background: rgba(255,255,255,0.1); color: #fff; padding: 12px 24px; border-radius: 8px; font-weight: 700; text-decoration: none;">Context Visualizer</a>
              <a href="/interview" style="background: rgba(255,255,255,0.1); color: #fff; padding: 12px 24px; border-radius: 8px; font-weight: 700; text-decoration: none;">Interview Q&amp;A</a>
            </div>
          </header>

          <section style="margin-bottom: 40px;">
            <h2 style="font-size: 1.5rem; font-weight: 800; color: #a855f7; margin-bottom: 16px;">Asynchronous Architecture Demystified</h2>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px;">
              <div style="padding: 20px; border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; background: #18181b;">
                <h3 style="font-size: 1.1rem; font-weight: 700; color: #ffffff; margin-bottom: 8px;">Call Stack Inspection</h3>
                <p style="font-size: 0.9rem; color: #a1a1aa;">Watch stack frames push on invocation and pop upon return in Last-In, First-Out (LIFO) order.</p>
              </div>
              <div style="padding: 20px; border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; background: #18181b;">
                <h3 style="font-size: 1.1rem; font-weight: 700; color: #ffffff; margin-bottom: 8px;">Microtask Queue Priority</h3>
                <p style="font-size: 0.9rem; color: #a1a1aa;">See why <code>Promise.then</code> and <code>queueMicrotask</code> callbacks completely drain before any timer task is dequeued.</p>
              </div>
              <div style="padding: 20px; border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; background: #18181b;">
                <h3 style="font-size: 1.1rem; font-weight: 700; color: #ffffff; margin-bottom: 8px;">Task Queue (Macrotasks)</h3>
                <p style="font-size: 0.9rem; color: #a1a1aa;">Visualize how <code>setTimeout</code>, <code>setInterval</code>, and DOM events wait in the task queue until the stack clears.</p>
              </div>
            </div>
          </section>

          <section style="margin-top: 32px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 24px;">
            <h3 style="font-size: 1.1rem; font-weight: 700; color: #ffffff; margin-bottom: 12px;">Related Visualizers &amp; Quizzes</h3>
            <div style="display: flex; gap: 12px; flex-wrap: wrap; font-size: 0.85rem;">
              <a href="/execution-context" style="color: #10b981; text-decoration: none; font-weight: 600;">Execution Context Visualizer &rarr;</a>
              <a href="/output-questions" style="color: #f59e0b; text-decoration: none; font-weight: 600;">Output Prediction Quiz &rarr;</a>
              <a href="/interview" style="color: #3b82f6; text-decoration: none; font-weight: 600;">Interview Questions &rarr;</a>
              <a href="/js" style="color: #f59e0b; text-decoration: none; font-weight: 600;">JavaScript Playground &rarr;</a>
            </div>
          </section>
        </main>
      `;
    } else if (route.type === 'tool-execution-context') {
      contentHtml = `
        <main style="max-width: 1100px; margin: 0 auto; padding: 40px 16px; line-height: 1.7;">
          <header style="margin-bottom: 36px;">
            <div style="display: inline-flex; align-items: center; gap: 8px; font-size: 0.75rem; font-weight: 700; color: #10b981; text-transform: uppercase; background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.2); padding: 4px 10px; border-radius: 9999px; margin-bottom: 12px;">
              <span>Memory Phase</span> &bull; <span>Execution Phase</span> &bull; <span>Hoisting &amp; TDZ</span>
            </div>
            <h1 style="font-size: 2.5rem; font-weight: 900; color: #ffffff; margin-bottom: 16px; line-height: 1.2;">JavaScript Execution Context Visualizer — Memory Allocation &amp; Scope</h1>
            <p style="font-size: 1.15rem; color: #d4d4d8; max-width: 900px; margin-bottom: 24px;">Interactive visualizer for the JavaScript Execution Context lifecycle. Inspect the Memory Creation Phase (hoisting, TDZ), Code Execution Phase line by line, Global and Function Execution Contexts, and Call Stack frames.</p>
            <div style="display: flex; gap: 12px; flex-wrap: wrap;">
              <a href="/execution-context" style="background: #10b981; color: #000; padding: 12px 24px; border-radius: 8px; font-weight: 700; text-decoration: none;">Launch Context Visualizer</a>
              <a href="/visualizer" style="background: rgba(255,255,255,0.1); color: #fff; padding: 12px 24px; border-radius: 8px; font-weight: 700; text-decoration: none;">Event Loop Visualizer</a>
              <a href="/js" style="background: rgba(255,255,255,0.1); color: #fff; padding: 12px 24px; border-radius: 8px; font-weight: 700; text-decoration: none;">JavaScript Sandbox</a>
            </div>
          </header>

          <section style="margin-bottom: 40px;">
            <h2 style="font-size: 1.5rem; font-weight: 800; color: #10b981; margin-bottom: 16px;">Execution Context Phases Explained</h2>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px;">
              <div style="padding: 20px; border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; background: #18181b;">
                <h3 style="font-size: 1.1rem; font-weight: 700; color: #ffffff; margin-bottom: 8px;">Phase 1: Memory Allocation</h3>
                <p style="font-size: 0.9rem; color: #a1a1aa;">JavaScript scans the code and allocates memory for variables and functions. <code>var</code> receives <code>undefined</code>, while function declarations store their complete body.</p>
              </div>
              <div style="padding: 20px; border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; background: #18181b;">
                <h3 style="font-size: 1.1rem; font-weight: 700; color: #ffffff; margin-bottom: 8px;">Temporal Dead Zone (TDZ)</h3>
                <p style="font-size: 0.9rem; color: #a1a1aa;">Visualize how <code>let</code> and <code>const</code> variables remain in an uninitialized TDZ until execution reaches their declaration line.</p>
              </div>
              <div style="padding: 20px; border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; background: #18181b;">
                <h3 style="font-size: 1.1rem; font-weight: 700; color: #ffffff; margin-bottom: 8px;">Phase 2: Code Execution</h3>
                <p style="font-size: 0.9rem; color: #a1a1aa;">Step line-by-line as values are evaluated, assigned into memory slots, and function invocations spawn new Execution Contexts.</p>
              </div>
            </div>
          </section>

          <section style="margin-top: 32px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 24px;">
            <h3 style="font-size: 1.1rem; font-weight: 700; color: #ffffff; margin-bottom: 12px;">Explore Related Tools</h3>
            <div style="display: flex; gap: 12px; flex-wrap: wrap; font-size: 0.85rem;">
              <a href="/visualizer" style="color: #a855f7; text-decoration: none; font-weight: 600;">Event Loop Visualizer &rarr;</a>
              <a href="/output-questions" style="color: #f59e0b; text-decoration: none; font-weight: 600;">Output Questions Quiz &rarr;</a>
              <a href="/interview" style="color: #3b82f6; text-decoration: none; font-weight: 600;">Interview Q&amp;A &rarr;</a>
              <a href="/learn" style="color: #e4e4e7; text-decoration: none; font-weight: 600;">Learn JavaScript &rarr;</a>
            </div>
          </section>
        </main>
      `;
    } else if (route.type === 'output-questions') {
      contentHtml = `
        <main style="max-width: 1100px; margin: 0 auto; padding: 40px 16px; line-height: 1.7;">
          <header style="margin-bottom: 36px;">
            <div style="display: inline-flex; align-items: center; gap: 8px; font-size: 0.75rem; font-weight: 700; color: #f59e0b; text-transform: uppercase; background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.2); padding: 4px 10px; border-radius: 9999px; margin-bottom: 12px;">
              <span>100 MCQs</span> &bull; <span>3 Difficulty Tiers</span> &bull; <span>Interview Prep</span>
            </div>
            <h1 style="font-size: 2.5rem; font-weight: 900; color: #ffffff; margin-bottom: 16px;">JavaScript Output Questions — Predict the Output Quiz</h1>
            <p style="font-size: 1.15rem; color: #d4d4d8; max-width: 850px; margin-bottom: 24px;">Test your JavaScript execution prediction skills with 100 interview-style output questions covering closures, hoisting, scope, promises, prototypes, type coercion, and async/await.</p>
            <div style="display: flex; gap: 12px; flex-wrap: wrap;">
              <a href="/output-questions" style="background: #f59e0b; color: #000; padding: 12px 24px; border-radius: 8px; font-weight: 700; text-decoration: none;">Start Output Quiz</a>
              <a href="/interview" style="background: rgba(255,255,255,0.1); color: #fff; padding: 12px 24px; border-radius: 8px; font-weight: 700; text-decoration: none;">Technical Q&amp;A</a>
              <a href="/visualizer" style="background: rgba(255,255,255,0.1); color: #fff; padding: 12px 24px; border-radius: 8px; font-weight: 700; text-decoration: none;">Event Loop Visualizer</a>
            </div>
          </header>

          <section style="margin-bottom: 32px; padding: 24px; border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; background: #18181b;">
            <h2 style="font-size: 1.35rem; font-weight: 800; color: #ffffff; margin-bottom: 12px;">Core Quiz Categories Covered</h2>
            <ul style="color: #a1a1aa; font-size: 0.95rem; line-height: 1.7; padding-left: 20px; margin: 0;">
              <li><strong>Hoisting &amp; Temporal Dead Zone:</strong> Predict outcomes of <code>var</code>, <code>let</code>, <code>const</code>, and function declarations.</li>
              <li><strong>Closures &amp; Lexical Scope:</strong> Retaining variable state across nested scopes and loops.</li>
              <li><strong>Event Loop &amp; Microtasks:</strong> Ordering execution of <code>Promise.resolve()</code>, <code>setTimeout</code>, and synchronous code.</li>
              <li><strong>Prototypes &amp; Inheritance:</strong> Prototype chain lookups, <code>__proto__</code>, and constructor functions.</li>
              <li><strong>Type Coercion &amp; Equality:</strong> Implicit string conversion, truthy/falsy coercion, and strict vs loose equality.</li>
            </ul>
          </section>
        </main>
      `;
    } else if (route.type === 'about') {
      contentHtml = `
        <main style="max-width: 900px; margin: 0 auto; padding: 40px 16px; line-height: 1.7;">
          <h1 style="font-size: 2.25rem; font-weight: 900; color: #f59e0b; margin-bottom: 16px;">About RunJS - In-Browser Developer IDE</h1>
          <p style="font-size: 1.1rem; color: #d4d4d8; margin-bottom: 24px;">RunJS is an open-source, 100% client-side developer playground built to write, run, visualize, and practice JavaScript, TypeScript, and React directly in the browser.</p>

          <h2 style="font-size: 1.4rem; font-weight: 800; color: #ffffff; margin: 32px 0 12px;">Key Architectural Highlights</h2>
          <ul style="color: #a1a1aa; padding-left: 20px; margin-bottom: 24px;">
            <li><strong>100% In-Browser Execution:</strong> Zero code compilation on remote servers. Everything runs locally on your device using WebAssembly and Web Workers.</li>
            <li><strong>AST Infinite Loop Guard:</strong> Real-time Acorn AST parsing instruments loops with safety thresholds, preventing browser tab freezes.</li>
            <li><strong>Zero Server Tracking:</strong> No code snippets, project drafts, or telemetry are transmitted to external servers. Workspaces persist locally in IndexedDB.</li>
            <li><strong>Interactive Visualizers:</strong> Real-time event loop stepping, call stack frames, hoisting, TDZ, and memory allocation inspection.</li>
            <li><strong>Comprehensive Curriculum:</strong> 175+ structured interactive lessons and algorithmic coding challenges with in-browser test evaluation.</li>
          </ul>

          <h2 style="font-size: 1.4rem; font-weight: 800; color: #ffffff; margin: 32px 0 12px;">Creator &amp; Maintainer</h2>
          <p style="color: #a1a1aa; margin-bottom: 24px;">Created and maintained by <a href="/kishorekumar" style="color: #f59e0b; font-weight: 700; text-decoration: none;">M R Kishore Kumar</a>, React Native Engineer with 4.5+ years of experience shipping consumer e-commerce applications at scale (1Cr+ app downloads). Built to empower developers with immediate, zero-friction coding tools.</p>
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
          <h2 style="font-size: 1.3rem; font-weight: 800; color: #ffffff; margin: 24px 0 12px;">Zero Server Storage</h2>
          <p style="color: #a1a1aa; margin-bottom: 16px;">No code snippets, personal files, or execution results are transmitted to external backend servers. Your workspaces and saved drafts are stored exclusively in your browser's private local IndexedDB database.</p>
          <h2 style="font-size: 1.3rem; font-weight: 800; color: #ffffff; margin: 24px 0 12px;">No Tracking or Account Lock-In</h2>
          <p style="color: #a1a1aa;">RunJS does not require user accounts, email registration, or profiling. You can clear your stored projects at any time through your browser settings or the built-in storage manager.</p>
        </main>
      `;
    } else if (route.type === 'terms') {
      contentHtml = `
        <main style="max-width: 900px; margin: 0 auto; padding: 40px 16px; line-height: 1.7;">
          <h1 style="font-size: 2.25rem; font-weight: 900; color: #f59e0b; margin-bottom: 16px;">Terms of Service &amp; Conditions</h1>
          <p style="color: #d4d4d8; margin-bottom: 20px;">Welcome to RunJS. By using our website and tools, you agree to these Terms and Conditions (Terms of Service).</p>
          <h2 style="font-size: 1.3rem; font-weight: 800; color: #ffffff; margin: 24px 0 12px;">Code Ownership</h2>
          <p style="color: #a1a1aa; margin-bottom: 16px;">You retain 100% full ownership, copyright, and intellectual property rights to all code snippets and projects you create or paste into RunJS.</p>
          <h2 style="font-size: 1.3rem; font-weight: 800; color: #ffffff; margin: 24px 0 12px;">Open Source &amp; Educational Use</h2>
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

    if (route.type === 'home') {
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
            description:
              'Run, practice, and master JavaScript, TypeScript, and React directly in your browser. Zero setup, Monaco editor, esbuild WebAssembly compilation, and interactive coding challenges.',
            browserRequirements: 'Requires JavaScript. Requires HTML5.',
            softwareVersion: '2.0.0',
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'USD',
            },
            author: {
              '@type': 'Person',
              name: 'M R Kishore Kumar',
              url: 'https://github.com/mrkishorekumar',
            },
          },
          {
            '@type': 'WebSite',
            '@id': `${baseUrl}/#website`,
            name: 'RunJS',
            url: `${baseUrl}/`,
            description:
              'Run, practice, and master JavaScript, TypeScript, and React directly in your browser.',
            publisher: {
              '@type': 'Organization',
              name: 'RunJS',
              url: `${baseUrl}/`,
              logo: {
                '@type': 'ImageObject',
                url: `${baseUrl}/RunJS-512.png`,
              },
            },
            potentialAction: {
              '@type': 'SearchAction',
              target: {
                '@type': 'EntryPoint',
                urlTemplate: `${baseUrl}/problems?search={search_term_string}`,
              },
              'query-input': 'required name=search_term_string',
            },
          },
        ],
      };
    }

    if (
      route.type === 'tool-js' ||
      route.type === 'tool-ts' ||
      route.type === 'tool-react' ||
      route.type === 'tool-html' ||
      route.type === 'tool-visualizer' ||
      route.type === 'tool-execution-context'
    ) {
      const toolNames = {
        'tool-js': 'RunJS JavaScript Playground & Online Compiler',
        'tool-ts': 'RunJS TypeScript Playground (esbuild Wasm)',
        'tool-react': 'RunJS React & Vite Playground (Sandpack)',
        'tool-html': 'RunJS HTML & CSS Live Studio',
        'tool-visualizer': 'RunJS JavaScript Event Loop Visualizer',
        'tool-execution-context':
          'RunJS JavaScript Execution Context Visualizer',
      };
      const breadcrumbNames = {
        'tool-js': 'JavaScript Playground',
        'tool-ts': 'TypeScript Playground',
        'tool-react': 'React Playground',
        'tool-html': 'HTML Studio',
        'tool-visualizer': 'Event Loop Visualizer',
        'tool-execution-context': 'Context Visualizer',
      };

      return {
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'WebApplication',
            '@id': `${canonicalUrl}#webapp`,
            name: toolNames[route.type] || 'RunJS Playground',
            url: canonicalUrl,
            applicationCategory: 'DeveloperApplication',
            operatingSystem: 'Any (Web Browser)',
            description: route.description,
            browserRequirements: 'Requires JavaScript. Requires HTML5.',
            softwareVersion: '2.0.0',
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'USD',
            },
            author: {
              '@type': 'Person',
              name: 'M R Kishore Kumar',
              url: 'https://github.com/mrkishorekumar',
            },
          },
          {
            '@type': 'BreadcrumbList',
            itemListElement: [
              {
                '@type': 'ListItem',
                position: 1,
                name: 'Home',
                item: `${baseUrl}/`,
              },
              {
                '@type': 'ListItem',
                position: 2,
                name: breadcrumbNames[route.type] || 'Tool',
                item: canonicalUrl,
              },
            ],
          },
        ],
      };
    }

    if (route.type === 'interview') {
      const faqItems = (interviewQuestions || []).slice(0, 25).map((iq) => {
        const answerText = iq.answer
          ? iq.answer
              .map((a) => (a.data ? a.data.join(' ') : ''))
              .filter(Boolean)
              .join(' ')
          : '';
        return {
          '@type': 'Question',
          name: iq.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: answerText || iq.question,
          },
        };
      });

      return {
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'FAQPage',
            '@id': `${canonicalUrl}#faq`,
            name: 'JavaScript Technical Interview Questions & Answers',
            url: canonicalUrl,
            mainEntity: faqItems,
          },
          {
            '@type': 'BreadcrumbList',
            itemListElement: [
              {
                '@type': 'ListItem',
                position: 1,
                name: 'Home',
                item: `${baseUrl}/`,
              },
              {
                '@type': 'ListItem',
                position: 2,
                name: 'Interview Questions',
                item: canonicalUrl,
              },
            ],
          },
        ],
      };
    }

    if (route.type === 'output-questions') {
      return {
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'CollectionPage',
            '@id': `${canonicalUrl}#collection`,
            name: 'JavaScript Output Questions — Predict the Output Quiz',
            description: route.description,
            url: canonicalUrl,
          },
          {
            '@type': 'TechArticle',
            '@id': `${canonicalUrl}#article`,
            headline: 'JavaScript Output Questions — Predict the Output Quiz',
            description: route.description,
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
              {
                '@type': 'ListItem',
                position: 1,
                name: 'Home',
                item: `${baseUrl}/`,
              },
              {
                '@type': 'ListItem',
                position: 2,
                name: 'Output Questions',
                item: canonicalUrl,
              },
            ],
          },
        ],
      };
    }

    if (route.type === 'about') {
      return {
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'AboutPage',
            '@id': `${canonicalUrl}#about`,
            name: 'About RunJS',
            url: canonicalUrl,
            description: route.description,
            mainEntity: {
              '@type': 'Person',
              name: 'M R Kishore Kumar',
              jobTitle: 'Creator & Maintainer',
              url: 'https://github.com/mrkishorekumar',
            },
          },
          {
            '@type': 'BreadcrumbList',
            itemListElement: [
              {
                '@type': 'ListItem',
                position: 1,
                name: 'Home',
                item: `${baseUrl}/`,
              },
              {
                '@type': 'ListItem',
                position: 2,
                name: 'About',
                item: canonicalUrl,
              },
            ],
          },
        ],
      };
    }

    if (route.type === 'creator') {
      return {
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'ProfilePage',
            '@id': `${canonicalUrl}#profile`,
            name: 'M R Kishore Kumar Portfolio',
            url: canonicalUrl,
            mainEntity: {
              '@type': 'Person',
              name: 'M R Kishore Kumar',
              jobTitle: 'React Native Engineer & Creator of RunJS',
              url: 'https://github.com/mrkishorekumar',
            },
          },
          {
            '@type': 'BreadcrumbList',
            itemListElement: [
              {
                '@type': 'ListItem',
                position: 1,
                name: 'Home',
                item: `${baseUrl}/`,
              },
              {
                '@type': 'ListItem',
                position: 2,
                name: 'Creator',
                item: canonicalUrl,
              },
            ],
          },
        ],
      };
    }

    if (route.type === 'privacy' || route.type === 'terms') {
      const pageName =
        route.type === 'privacy' ? 'Privacy Policy' : 'Terms and Conditions';
      return {
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'WebPage',
            '@id': `${canonicalUrl}#webpage`,
            name: `RunJS ${pageName}`,
            url: canonicalUrl,
            description: route.description,
          },
          {
            '@type': 'BreadcrumbList',
            itemListElement: [
              {
                '@type': 'ListItem',
                position: 1,
                name: 'Home',
                item: `${baseUrl}/`,
              },
              {
                '@type': 'ListItem',
                position: 2,
                name: pageName,
                item: canonicalUrl,
              },
            ],
          },
        ],
      };
    }

    if (route.type === 'learn-home') {
      return {
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'Course',
            '@id': `${canonicalUrl}#course`,
            name: 'Learn JavaScript — 175+ Interactive Lessons',
            description: route.description,
            url: canonicalUrl,
            provider: {
              '@type': 'Organization',
              name: 'RunJS',
              url: `${baseUrl}/`,
            },
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'USD',
            },
          },
          {
            '@type': 'BreadcrumbList',
            itemListElement: [
              {
                '@type': 'ListItem',
                position: 1,
                name: 'Home',
                item: `${baseUrl}/`,
              },
              {
                '@type': 'ListItem',
                position: 2,
                name: 'Learn JavaScript',
                item: canonicalUrl,
              },
            ],
          },
        ],
      };
    }

    if (route.type === 'problems-home') {
      return {
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'CollectionPage',
            '@id': `${canonicalUrl}#collection`,
            name: 'JavaScript Coding Challenges & Algorithm Practice',
            description: route.description,
            url: canonicalUrl,
          },
          {
            '@type': 'BreadcrumbList',
            itemListElement: [
              {
                '@type': 'ListItem',
                position: 1,
                name: 'Home',
                item: `${baseUrl}/`,
              },
              {
                '@type': 'ListItem',
                position: 2,
                name: 'Coding Challenges',
                item: canonicalUrl,
              },
            ],
          },
        ],
      };
    }

    if (route.type === 'problem-detail') {
      const prob = route.data || {};
      return {
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'SoftwareSourceCode',
            '@id': `${canonicalUrl}#code`,
            name: `${prob.title || 'Coding Challenge'} - JavaScript Solution`,
            description: route.description,
            programmingLanguage: 'JavaScript',
            codeSampleType: 'code snippet',
            author: {
              '@type': 'Person',
              name: 'M R Kishore Kumar',
              url: 'https://github.com/mrkishorekumar',
            },
          },
          {
            '@type': 'BreadcrumbList',
            itemListElement: [
              {
                '@type': 'ListItem',
                position: 1,
                name: 'Home',
                item: `${baseUrl}/`,
              },
              {
                '@type': 'ListItem',
                position: 2,
                name: 'Coding Challenges',
                item: `${baseUrl}/problems`,
              },
              {
                '@type': 'ListItem',
                position: 3,
                name: prob.title || 'Problem',
                item: canonicalUrl,
              },
            ],
          },
        ],
      };
    }

    if (route.type === 'lesson-detail') {
      const lesson = route.data || {};
      return {
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'TechArticle',
            '@id': `${canonicalUrl}#article`,
            headline: `${lesson.title || 'JavaScript Lesson'} - Learn JavaScript`,
            description: route.description,
            url: canonicalUrl,
            inLanguage: 'en-US',
            author: {
              '@type': 'Person',
              name: 'M R Kishore Kumar',
              url: 'https://github.com/mrkishorekumar',
            },
            publisher: {
              '@type': 'Organization',
              name: 'RunJS',
              url: `${baseUrl}/`,
            },
          },
          {
            '@type': 'BreadcrumbList',
            itemListElement: [
              {
                '@type': 'ListItem',
                position: 1,
                name: 'Home',
                item: `${baseUrl}/`,
              },
              {
                '@type': 'ListItem',
                position: 2,
                name: 'Learn JavaScript',
                item: `${baseUrl}/learn`,
              },
              {
                '@type': 'ListItem',
                position: 3,
                name: lesson.title || 'Lesson',
                item: canonicalUrl,
              },
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
          description:
            'Run, practice, and master JavaScript, TypeScript, and React directly in your browser.',
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
      /<link\s+[^>]*rel="canonical"[^>]*\/?>/i,
      `<link rel="canonical" href="${canonicalUrl}" />`
    );

    // Replace meta description
    html = html.replace(
      /<meta\s+[^>]*name="description"[^>]*\/?>/i,
      `<meta name="description" content="${escapeAttr(route.description)}">`
    );

    // Replace robots tag if noindex is true (e.g. for 404)
    if (route.noIndex) {
      html = html.replace(
        /<meta\s+[^>]*name="robots"[^>]*\/?>/i,
        `<meta name="robots" content="noindex, follow">`
      );
    }

    // Replace og:title
    html = html.replace(
      /<meta\s+[^>]*property="og:title"[^>]*\/?>/i,
      `<meta property="og:title" content="${escapeAttr(route.title)}" />`
    );

    // Replace og:description
    html = html.replace(
      /<meta\s+[^>]*property="og:description"[^>]*\/?>/i,
      `<meta property="og:description" content="${escapeAttr(route.description)}" />`
    );

    // Replace og:url
    html = html.replace(
      /<meta\s+[^>]*property="og:url"[^>]*\/?>/i,
      `<meta property="og:url" content="${canonicalUrl}" />`
    );

    // Replace twitter:title
    html = html.replace(
      /<meta\s+[^>]*name="twitter:title"[^>]*\/?>/i,
      `<meta name="twitter:title" content="${escapeAttr(route.title)}" />`
    );

    // Replace twitter:description
    html = html.replace(
      /<meta\s+[^>]*name="twitter:description"[^>]*\/?>/i,
      `<meta name="twitter:description" content="${escapeAttr(route.description)}" />`
    );

    // Inject Schema.org JSON-LD
    const jsonLd = generateJsonLd(route);
    html = html.replace(
      /<script\s+[^>]*type="application\/ld\+json"[^>]*>[\s\S]*?<\/script>/i,
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

  console.log(
    `Successfully pre-rendered ${routes.length} static HTML route files with complete body content & schema in dist/.`
  );
}

main().catch((err) => {
  console.error('Prerender script failed:', err);
  process.exit(1);
});
