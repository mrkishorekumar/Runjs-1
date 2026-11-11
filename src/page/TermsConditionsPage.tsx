import { Link } from 'react-router';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import SEO from '../seo/SEO';
import { getBreadcrumbSchema, getCanonicalUrl } from '../seo/seoConfig';
import {
  Scale,
  FileCheck,
  Code2,
  AlertTriangle,
  FileText,
  HelpCircle,
  ExternalLink,
  Cpu,
  Layers,
  Megaphone,
} from 'lucide-react';

function TermsConditionsPage() {
  const lastUpdated = 'November 11, 2026';

  const sections = [
    {
      id: 'acceptance',
      title: '1. Acceptance of Terms',
      icon: FileCheck,
      content: (
        <>
          <p>
            By accessing or using RunJS (
            <a
              href="https://runjs.in"
              className="text-amber-600 dark:text-amber-400 hover:underline"
            >
              runjs.in
            </a>
            ), including all associated playgrounds, learning modules, coding
            challenge engines, and tools, you agree to comply with and be bound
            by these Terms and Conditions (&quot;Terms&quot;) and our{' '}
            <Link
              to="/privacy"
              className="text-amber-600 dark:text-amber-400 hover:underline"
            >
              Privacy Policy
            </Link>
            .
          </p>
          <p>
            If you do not agree to these Terms, please do not use the RunJS
            platform.
          </p>
        </>
      ),
    },
    {
      id: 'service-description',
      title: '2. Description of the Service',
      icon: Layers,
      content: (
        <>
          <p>
            RunJS is an open-source, client-side web development utility and
            learning platform designed to provide:
          </p>
          <ul className="list-disc list-inside space-y-2 pl-2">
            <li>
              Instant browser-based code execution for JavaScript (ES2024+),
              TypeScript (via WebAssembly esbuild), React + Vite (via Sandpack),
              and interactive HTML/CSS environments.
            </li>
            <li>
              Curated JavaScript technical interview practice problems with
              real-time test case verification.
            </li>
            <li>
              Interactive curriculum lessons with embedded runnable examples and
              quizzes.
            </li>
            <li>
              Offline-capable project saving and scratchpad management powered
              by browser IndexedDB storage.
            </li>
          </ul>
        </>
      ),
    },
    {
      id: 'ownership-and-ip',
      title: '3. Intellectual Property & Your Code Ownership',
      icon: Code2,
      content: (
        <>
          <p>
            <strong className="text-[var(--text-primary)] font-semibold">
              You own 100% of your code:
            </strong>{' '}
            Any code, algorithms, snippets, projects, or text you create, write,
            transpile, or execute in RunJS belongs exclusively to you. RunJS
            claims zero ownership, license, or intellectual property rights over
            user-created code.
          </p>
          <p>
            <strong className="text-[var(--text-primary)] font-semibold">
              Open Source Platform:
            </strong>{' '}
            The RunJS codebase, user interface, problem runners, and curriculum
            content are open-source and released under the permissive{' '}
            <a
              href="https://github.com/rigial/Runjs/blob/main/LICENSE"
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber-600 dark:text-amber-400 hover:underline inline-flex items-center gap-1"
            >
              <span>MIT License</span>
              <ExternalLink className="w-3 h-3 opacity-60" />
            </a>
            . You are welcome to inspect, fork, contribute to, and learn from
            our source code on GitHub.
          </p>
          <p>
            All third-party trademarks, package names (e.g. React, Monaco,
            TypeScript, Vite), and logos referenced on the platform are the
            property of their respective owners.
          </p>
        </>
      ),
    },
    {
      id: 'acceptable-use',
      title: '4. Acceptable Use Policy',
      icon: Scale,
      content: (
        <>
          <p>
            You agree to use RunJS solely for lawful educational, testing,
            prototyping, and development purposes. You agree NOT to:
          </p>
          <ul className="list-disc list-inside space-y-2 pl-2">
            <li>
              Use the platform to develop, distribute, or execute malware,
              viruses, keyloggers, cryptominers, or harmful scripts.
            </li>
            <li>
              Attempt to bypass, disable, or exploit browser security sandboxes
              or cross-origin restrictions.
            </li>
            <li>
              Conduct denial-of-service (DoS) attacks, brute-force requests, or
              automated scraping against RunJS infrastructure.
            </li>
            <li>
              Use RunJS in any manner that violates applicable local, national,
              or international laws or regulations.
            </li>
          </ul>
        </>
      ),
    },
    {
      id: 'execution-environment',
      title: '5. Client-Side Runtime & Local Data Caveats',
      icon: Cpu,
      content: (
        <>
          <p>Because RunJS runs completely within your web browser:</p>
          <ul className="list-disc list-inside space-y-2 pl-2">
            <li>
              <strong className="text-[var(--text-primary)]">
                Performance:
              </strong>{' '}
              Code compilation and execution speed are constrained by your
              individual device specifications and browser capabilities.
            </li>
            <li>
              <strong className="text-[var(--text-primary)]">
                Infinite Loop Protection:
              </strong>{' '}
              RunJS includes AST-based guardrails to detect and halt runaway
              loops, but certain recursive patterns or asynchronous loops may
              still freeze your browser tab.
            </li>
            <li>
              <strong className="text-[var(--text-primary)]">
                Data Persistence:
              </strong>{' '}
              Because snippets and projects are saved in your local browser’s
              IndexedDB storage, clearing browser cache or running in
              Incognito/Private mode will result in data loss. We strongly
              encourage regularly exporting important projects using the
              Download feature.
            </li>
          </ul>
        </>
      ),
    },
    {
      id: 'disclaimer-warranties',
      title: '6. Disclaimer of Warranties',
      icon: AlertTriangle,
      content: (
        <>
          <p className="uppercase tracking-wider font-semibold text-xs text-[var(--text-primary)]">
            Provided &quot;As Is&quot; Without Warranty
          </p>
          <p>
            RunJS is provided on an &quot;AS IS&quot; and &quot;AS
            AVAILABLE&quot; basis, without warranties of any kind, whether
            express, implied, or statutory. To the maximum extent permitted by
            applicable law, the creator and maintainers expressly disclaim all
            warranties, including but not limited to the implied warranties of
            merchantability, fitness for a particular purpose, non-infringement,
            accuracy, and uninterrupted availability.
          </p>
          <p>
            We do not warrant that code execution inside browser sandboxes will
            perfectly mirror production backend runtimes or different
            Node.js/browser environments.
          </p>
        </>
      ),
    },
    {
      id: 'limitation-liability',
      title: '7. Limitation of Liability',
      icon: AlertTriangle,
      content: (
        <>
          <p>
            In no event shall RunJS, its creator M R Kishore Kumar,
            contributors, or service providers be liable for any indirect,
            special, incidental, consequential, or punitive damages arising
            from:
          </p>
          <ul className="list-disc list-inside space-y-2 pl-2">
            <li>Your access to, use of, or inability to use RunJS.</li>
            <li>
              Loss of code, data corruption, or unintentional deletion from
              browser local storage.
            </li>
            <li>
              Unintended outcomes, bugs, or errors resulting from code tested on
              the platform.
            </li>
            <li>
              Third-party package security vulnerabilities or CDN outages.
            </li>
          </ul>
        </>
      ),
    },
    {
      id: 'third-party-links',
      title: '8. External Services & Third-Party Packages',
      icon: ExternalLink,
      content: (
        <>
          <p>
            RunJS integrates and links with third-party libraries (e.g. Monaco
            Editor, Sandpack, esbuild) and external websites. We do not control,
            endorse, or assume responsibility for the content, privacy policies,
            or availability of third-party sites or services.
          </p>
          <p>
            RunJS uses{' '}
            <strong className="text-[var(--text-primary)]">
              Google AdSense
            </strong>
            , a third-party advertising service operated by Google LLC, to
            display advertisements. By using RunJS, you acknowledge that Google
            AdSense may place and read cookies on your browser and may use web
            beacons to collect information in the course of serving ads. This
            activity is governed by{' '}
            <a
              href="https://policies.google.com/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber-600 dark:text-amber-400 hover:underline inline-flex items-center gap-1"
            >
              <span>Google&apos;s Privacy Policy</span>
              <ExternalLink className="w-3 h-3 opacity-60" />
            </a>{' '}
            and{' '}
            <a
              href="https://policies.google.com/technologies/ads"
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber-600 dark:text-amber-400 hover:underline inline-flex items-center gap-1"
            >
              <span>Google&apos;s Advertising Policies</span>
              <ExternalLink className="w-3 h-3 opacity-60" />
            </a>
            , not by RunJS.
          </p>
        </>
      ),
    },
    {
      id: 'advertising-policy',
      title: '9. Advertising Policy (Google AdSense)',
      icon: Megaphone,
      content: (
        <>
          <p>
            RunJS is a free platform supported by advertising. By using RunJS,
            you agree to the display of advertisements served by{' '}
            <strong className="text-[var(--text-primary)]">
              Google AdSense
            </strong>
            .
          </p>
          <ul className="list-disc list-inside space-y-2 pl-2">
            <li>
              <strong className="text-[var(--text-primary)]">
                Ad Personalisation:
              </strong>{' '}
              Google AdSense may serve personalised advertisements based on your
              interests and browsing history. You may opt out of personalised
              advertising at any time via{' '}
              <a
                href="https://www.google.com/settings/ads"
                target="_blank"
                rel="noopener noreferrer"
                className="text-amber-600 dark:text-amber-400 hover:underline inline-flex items-center gap-1"
              >
                <span>Google Ads Settings</span>
                <ExternalLink className="w-3 h-3 opacity-60" />
              </a>
              .
            </li>
            <li>
              <strong className="text-[var(--text-primary)]">
                Ad Interaction:
              </strong>{' '}
              Clicking on advertisements may direct you to third-party websites.
              RunJS is not responsible for the content, accuracy, or privacy
              practices of any advertiser&apos;s website.
            </li>
            <li>
              <strong className="text-[var(--text-primary)]">
                Ad Blocking:
              </strong>{' '}
              You are free to use ad-blocking tools; however, ad revenue helps
              keep RunJS free, open-source, and actively maintained for
              everyone.
            </li>
            <li>
              <strong className="text-[var(--text-primary)]">
                No Code Data to Advertisers:
              </strong>{' '}
              RunJS never transmits your code, local project data, or any
              personally identifiable information to Google AdSense or any
              advertising partner.
            </li>
          </ul>
        </>
      ),
    },
    {
      id: 'modifications',
      title: '10. Modifications to Terms & Platform',
      icon: FileText,
      content: (
        <>
          <p>
            We reserve the right to modify, suspend, or discontinue any feature
            of RunJS, or revise these Terms at any time without prior notice.
            All changes become effective immediately upon posting to this page.
          </p>
          <p>
            Your continued use of RunJS following any modifications signifies
            your acceptance of the updated Terms.
          </p>
        </>
      ),
    },
    {
      id: 'contact',
      title: '11. Contact & Community Support',
      icon: HelpCircle,
      content: (
        <>
          <p>
            For questions, legal inquiries, or suggestions regarding these Terms
            and Conditions, please open an issue in our GitHub repository or
            contact the project creator:
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <a
              href="https://github.com/rigial/Runjs/issues"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              <span>GitHub Issues</span>
              <ExternalLink className="w-3 h-3 opacity-60" />
            </a>
            <a
              href="https://github.com/mrkishorekumar"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              <span>Creator Profile</span>
              <ExternalLink className="w-3 h-3 opacity-60" />
            </a>
            <Link
              to="/privacy"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] text-xs font-medium text-amber-600 dark:text-amber-400 transition-colors"
            >
              <span>Privacy Policy</span>
            </Link>
          </div>
        </>
      ),
    },
  ];

  return (
    <div className="min-h-screen w-full flex flex-col justify-between bg-[var(--bg-app)] text-[var(--text-primary)] transition-colors duration-150">
      <SEO
        title="Terms and Conditions - RunJS Developer Playground"
        description="Terms and Conditions for RunJS. Review user guidelines, code ownership guarantees, open-source licensing, and acceptable use policy."
        canonical="/terms"
        keywords={[
          'RunJS terms and conditions',
          'RunJS terms of service',
          'code ownership guarantee',
          'open source developer IDE terms',
          'MIT license RunJS',
        ]}
        structuredData={[
          getBreadcrumbSchema([
            { name: 'Home', item: '/' },
            { name: 'Terms and Conditions', item: '/terms' },
          ]),
          {
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: 'Terms and Conditions | RunJS',
            url: getCanonicalUrl('/terms'),
            description:
              'Terms and Conditions for RunJS outlining user code ownership, open-source licensing, and acceptable use.',
          },
        ]}
      />
      <Navbar />

      <main className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Title & Header */}
        <div className="pb-6 border-b border-[var(--border-default)]">
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-500 uppercase tracking-wider mb-2">
            <Scale className="w-4 h-4" />
            <span>Legal & Terms</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-[var(--text-primary)]">
            Terms and Conditions
          </h1>
          <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-[var(--text-secondary)] mt-2">
            <span>Last Updated: {lastUpdated}</span>
            <span>•</span>
            <span>Effective Date: January 1, 2024</span>
          </div>
        </div>

        {/* Quick Highlights Summary Card */}
        <div className="my-6 p-5 sm:p-6 rounded-xl border border-amber-500/20 bg-amber-500/5 dark:bg-amber-500/10">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5">
              <Scale className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h2 className="text-sm sm:text-base font-bold text-[var(--text-primary)]">
                Plain English Summary
              </h2>
              <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
                RunJS is free and open-source under the MIT license. You retain
                100% ownership of any code you write or execute here. We don’t
                monitor your code or charge fees. In return, please use the
                platform responsibly and do not use it to build malicious
                software.
              </p>
            </div>
          </div>
        </div>

        {/* Quick Jump Navigation */}
        <nav
          aria-label="Table of contents"
          className="mb-8 p-4 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)]"
        >
          <p className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-3">
            Table of Contents
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {sections.map((sec) => (
              <a
                key={sec.id}
                href={`#${sec.id}`}
                className="text-[var(--text-secondary)] hover:text-amber-600 dark:hover:text-amber-400 hover:underline flex items-center gap-1.5 transition-colors"
              >
                <span className="text-amber-500 font-mono">•</span>
                <span>{sec.title}</span>
              </a>
            ))}
          </div>
        </nav>

        {/* Policy Sections */}
        <div className="space-y-6">
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <section
                key={section.id}
                id={section.id}
                className="scroll-mt-20 p-6 sm:p-8 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] shadow-xs transition-colors"
              >
                <div className="flex items-center gap-3 mb-4 pb-3 border-b border-[var(--border-subtle)]">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4" />
                  </div>
                  <h2 className="text-base sm:text-lg font-bold text-[var(--text-primary)]">
                    {section.title}
                  </h2>
                </div>
                <div className="space-y-3 text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
                  {section.content}
                </div>
              </section>
            );
          })}
        </div>

        {/* Bottom Back Navigation */}
        <div className="mt-8 pt-6 border-t border-[var(--border-default)] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <Link
            to="/privacy"
            className="text-amber-600 dark:text-amber-400 hover:underline font-medium"
          >
            ← Read Privacy Policy
          </Link>
          <Link
            to="/"
            className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors hover:underline"
          >
            Back to RunJS Home
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default TermsConditionsPage;
