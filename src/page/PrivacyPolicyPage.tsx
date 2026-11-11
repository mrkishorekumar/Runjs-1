import { Link } from 'react-router';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import SEO from '../seo/SEO';
import { getBreadcrumbSchema, getCanonicalUrl } from '../seo/seoConfig';
import {
  ShieldCheck,
  Cpu,
  Database,
  EyeOff,
  Globe2,
  Trash2,
  HelpCircle,
  ExternalLink,
  Lock,
  Megaphone,
} from 'lucide-react';

function PrivacyPolicyPage() {
  const lastUpdated = 'November 11, 2026';

  const sections = [
    {
      id: 'overview',
      title: '1. Overview & Core Philosophy',
      icon: ShieldCheck,
      content: (
        <>
          <p>
            Welcome to RunJS (
            <a
              href="https://runjs.in"
              className="text-amber-600 dark:text-amber-400 hover:underline"
            >
              runjs.in
            </a>
            ). RunJS is an open-source, in-browser developer playground,
            interactive JavaScript learning environment, and algorithm
            problem-solving platform created by M R Kishore Kumar.
          </p>
          <p>
            Your privacy is fundamental to how RunJS is designed. Unlike
            traditional online code editors that send your source code to remote
            cloud servers for compilation and execution, RunJS operates on a{' '}
            <strong className="text-[var(--text-primary)] font-semibold">
              client-side-first architecture
            </strong>
            . We believe your code, projects, and personal data belong to you
            and should remain on your machine.
          </p>
        </>
      ),
    },
    {
      id: 'code-execution',
      title: '2. Client-Side Code Execution Guarantee',
      icon: Cpu,
      content: (
        <>
          <p>
            All JavaScript, TypeScript, React, and HTML/CSS execution happens
            directly within your local web browser:
          </p>
          <ul className="list-disc list-inside space-y-2 pl-2">
            <li>
              <strong className="text-[var(--text-primary)]">
                JavaScript & HTML/CSS:
              </strong>{' '}
              Executed in client-side sandboxed iframe environments and browser
              web workers.
            </li>
            <li>
              <strong className="text-[var(--text-primary)]">
                TypeScript:
              </strong>{' '}
              Transpiled purely on your device using an in-browser WebAssembly
              port of esbuild (<code>esbuild-wasm</code>).
            </li>
            <li>
              <strong className="text-[var(--text-primary)]">
                React + Vite:
              </strong>{' '}
              Bundled live in the client using Sandpack client-side containers.
            </li>
            <li>
              <strong className="text-[var(--text-primary)]">
                Problem Solving Engine:
              </strong>{' '}
              Test cases, assertions, and performance metrics are evaluated
              entirely inside your local runtime.
            </li>
          </ul>
          <p className="mt-2">
            <strong>
              At no point is your code uploaded to, processed by, or stored on
              our servers.
            </strong>{' '}
            Core editor runtimes and previously cached assets continue to
            execute locally even if your device is disconnected from the
            internet. However, features that depend on uncached external
            resources (such as on-demand Monaco language workers or Sandpack
            container packages fetched from public CDNs) require active internet
            connectivity until they are retrieved and cached by your browser.
          </p>
        </>
      ),
    },
    {
      id: 'data-storage',
      title: '3. Data Storage & Local Persistence',
      icon: Database,
      content: (
        <>
          <p>
            RunJS provides features allowing you to save snippets, projects,
            problem submission history, and customize your workspace (such as
            font size, editor theme, and layout preferences).
          </p>
          <p>
            All such data is stored strictly on your device using standard
            browser storage mechanisms:
          </p>
          <ul className="list-disc list-inside space-y-2 pl-2">
            <li>
              <strong className="text-[var(--text-primary)]">IndexedDB:</strong>{' '}
              Stores saved code snippets, project files, and problem submissions
              locally on your device via the browser’s IndexedDB API.
            </li>
            <li>
              <strong className="text-[var(--text-primary)]">
                LocalStorage:
              </strong>{' '}
              Stores non-sensitive user preferences such as theme (dark/light),
              editor font size, and UI panel dimensions.
            </li>
          </ul>
          <p className="mt-2">
            Because this data is stored locally in your browser, clearing your
            browser cache or site data will remove your saved items unless you
            have backed them up or exported them using the in-app export tools.
          </p>
        </>
      ),
    },
    {
      id: 'data-collection',
      title: '4. Information We Do Not Collect',
      icon: EyeOff,
      content: (
        <>
          <p>We believe in data minimization. Specifically, RunJS does not:</p>
          <ul className="list-disc list-inside space-y-2 pl-2">
            <li>
              Require user registration, logins, or accounts to use any editor,
              playground, or problem challenges.
            </li>
            <li>
              Collect personal identifying information such as your name, email
              address, phone number, or physical address.
            </li>
            <li>Track keystrokes or record snippets written in the editor.</li>
            <li>
              Sell, rent, or share your personal data with third-party data
              brokers.
            </li>
          </ul>
          <p className="mt-2">
            <strong>Note on Advertising:</strong> RunJS displays advertisements
            served by{' '}
            <strong className="text-[var(--text-primary)]">
              Google AdSense
            </strong>
            . Google may use cookies and similar technologies to serve ads based
            on your prior visits to this site or other websites. These
            advertising cookies are managed by Google, not by RunJS. We do not
            share your code or locally-stored data with Google AdSense.
          </p>
        </>
      ),
    },
    {
      id: 'third-party',
      title: '5. Third-Party Services & Hosting Infrastructure',
      icon: Globe2,
      content: (
        <>
          <p>
            To serve web assets reliably and securely worldwide, RunJS utilizes
            trusted third-party infrastructure:
          </p>
          <ul className="list-disc list-inside space-y-2 pl-2">
            <li>
              <strong className="text-[var(--text-primary)]">
                Cloudflare Pages:
              </strong>{' '}
              RunJS is hosted as a static web application on Cloudflare Pages.
              Cloudflare may collect standard edge network metadata (such as IP
              addresses, browser user-agent, and request timestamps) strictly
              for security protection, DDoS mitigation, and content delivery.
            </li>
            <li>
              <strong className="text-[var(--text-primary)]">
                Content Delivery Networks (CDNs):
              </strong>{' '}
              In certain playgrounds, external libraries requested by the user
              (such as Monaco editor language worker files or Sandpack client
              packages) may be fetched from public CDNs like Cloudflare, unpkg,
              or cdnjs.
            </li>
            <li>
              <strong className="text-[var(--text-primary)]">
                External Links:
              </strong>{' '}
              RunJS contains links to external sites such as GitHub, LinkedIn,
              YouTube, and npm. We are not responsible for the privacy practices
              of external websites.
            </li>
            <li>
              <strong className="text-[var(--text-primary)]">
                Google AdSense:
              </strong>{' '}
              RunJS uses Google AdSense to display advertisements. Google
              AdSense uses cookies (including the DoubleClick cookie) to serve
              ads that are relevant to you based on your browsing activity. You
              may opt out of personalised advertising by visiting{' '}
              <a
                href="https://www.google.com/settings/ads"
                target="_blank"
                rel="noopener noreferrer"
                className="text-amber-600 dark:text-amber-400 hover:underline inline-flex items-center gap-1"
              >
                <span>Google Ads Settings</span>
                <ExternalLink className="w-3 h-3 opacity-60" />
              </a>{' '}
              or{' '}
              <a
                href="https://www.aboutads.info/choices/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-amber-600 dark:text-amber-400 hover:underline inline-flex items-center gap-1"
              >
                <span>aboutads.info</span>
                <ExternalLink className="w-3 h-3 opacity-60" />
              </a>
              . For more details on how Google uses data from sites that use
              Google services, please see{' '}
              <a
                href="https://policies.google.com/technologies/partner-sites"
                target="_blank"
                rel="noopener noreferrer"
                className="text-amber-600 dark:text-amber-400 hover:underline inline-flex items-center gap-1"
              >
                <span>Google&apos;s Privacy & Terms</span>
                <ExternalLink className="w-3 h-3 opacity-60" />
              </a>
              .
            </li>
          </ul>
        </>
      ),
    },
    {
      id: 'cookies',
      title: '6. Cookies & Tracking Technologies',
      icon: Lock,
      content: (
        <>
          <p>
            RunJS itself does not use tracking cookies for advertising purposes.
            Any client-side persistence used directly by RunJS is strictly
            functional — keeping your theme choice consistent and preserving
            your code scratchpad.
          </p>
          <p>
            However, as part of displaying advertisements via{' '}
            <strong className="text-[var(--text-primary)]">
              Google AdSense
            </strong>
            , third-party cookies (including the DoubleClick cookie) may be
            placed on your device by Google and its partners. These cookies
            allow Google to serve personalised ads based on your browsing
            history across websites. RunJS does not have access to these cookies
            and does not control Google&apos;s cookie practices.
          </p>
          <p>You can manage or disable advertising cookies at any time via:</p>
          <ul className="list-disc list-inside space-y-2 pl-2">
            <li>
              <a
                href="https://www.google.com/settings/ads"
                target="_blank"
                rel="noopener noreferrer"
                className="text-amber-600 dark:text-amber-400 hover:underline inline-flex items-center gap-1"
              >
                <span>Google Ads Settings</span>
                <ExternalLink className="w-3 h-3 opacity-60" />
              </a>
            </li>
            <li>
              Your browser&apos;s cookie settings or a privacy-focused browser
              extension.
            </li>
            <li>
              The{' '}
              <a
                href="https://www.aboutads.info/choices/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-amber-600 dark:text-amber-400 hover:underline inline-flex items-center gap-1"
              >
                <span>Digital Advertising Alliance opt-out</span>
                <ExternalLink className="w-3 h-3 opacity-60" />
              </a>
              .
            </li>
          </ul>
        </>
      ),
    },
    {
      id: 'advertising',
      title: '7. Advertising (Google AdSense)',
      icon: Megaphone,
      content: (
        <>
          <p>
            RunJS is supported by advertising revenue. We use{' '}
            <strong className="text-[var(--text-primary)]">
              Google AdSense
            </strong>
            , a third-party advertising service provided by Google LLC, to
            display advertisements on this site.
          </p>
          <p>
            Google AdSense may use cookies, web beacons, and similar tracking
            technologies to:
          </p>
          <ul className="list-disc list-inside space-y-2 pl-2">
            <li>
              Serve ads relevant to your interests based on your prior visits to
              this and other websites (interest-based / personalised
              advertising).
            </li>
            <li>
              Measure ad performance, impressions, and click-through rates.
            </li>
            <li>
              Prevent the same ad from being shown to you too many times
              (frequency capping).
            </li>
          </ul>
          <p className="mt-2">
            <strong className="text-[var(--text-primary)]">
              What RunJS does not do:
            </strong>{' '}
            We never pass your code, local storage data, or any personally
            identifiable information to Google AdSense.
          </p>
          <p>
            Google&apos;s use of advertising cookies is governed by its own
            Privacy Policy. You can review Google&apos;s advertising policies
            and opt-out options here:
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <a
              href="https://policies.google.com/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              <span>Google Privacy Policy</span>
              <ExternalLink className="w-3 h-3 opacity-60" />
            </a>
            <a
              href="https://www.google.com/settings/ads"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              <span>Opt Out of Personalised Ads</span>
              <ExternalLink className="w-3 h-3 opacity-60" />
            </a>
          </div>
        </>
      ),
    },
    {
      id: 'data-control',
      title: '8. Managing & Deleting Your Data',
      icon: Trash2,
      content: (
        <>
          <p>You retain complete control over your data at all times:</p>
          <ul className="list-disc list-inside space-y-2 pl-2">
            <li>
              <strong className="text-[var(--text-primary)]">
                In-App Management:
              </strong>{' '}
              You can delete any saved playground or snippet directly from the
              dashboard, or permanently purge items via the{' '}
              <Link
                to="/bin"
                className="text-amber-600 dark:text-amber-400 hover:underline"
              >
                Recycle Bin
              </Link>
              .
            </li>
            <li>
              <strong className="text-[var(--text-primary)]">
                Browser Controls:
              </strong>{' '}
              You can instantly wipe all stored RunJS data by clearing your
              browser storage (Cookies and Site Data) for <code>runjs.in</code>.
            </li>
            <li>
              <strong className="text-[var(--text-primary)]">
                Code Export:
              </strong>{' '}
              You can export and download your code snippets and React projects
              as local ZIP archives or source files at any time.
            </li>
          </ul>
        </>
      ),
    },
    {
      id: 'children',
      title: '9. Children’s Privacy',
      icon: HelpCircle,
      content: (
        <>
          <p>
            RunJS is an educational and developer utility accessible to anyone
            wishing to learn and practice programming. Because we do not collect
            any personal identifiable information from anyone, we do not
            knowingly solicit or collect personal data from children under the
            age of 13.
          </p>
        </>
      ),
    },
    {
      id: 'contact',
      title: '10. Changes & Contact Information',
      icon: HelpCircle,
      content: (
        <>
          <p>
            We may occasionally update this Privacy Policy to reflect
            improvements to RunJS or updates to legal requirements. Any updates
            will be posted directly to this page with an updated revision date.
          </p>
          <p>
            If you have questions, concerns, or feedback regarding this Privacy
            Policy or RunJS’s data practices, feel free to reach out through our
            open-source repository or creator channels:
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
              to="/about"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] text-xs font-medium text-amber-600 dark:text-amber-400 transition-colors"
            >
              <span>About RunJS</span>
            </Link>
          </div>
        </>
      ),
    },
  ];

  return (
    <div className="min-h-screen w-full flex flex-col justify-between bg-[var(--bg-app)] text-[var(--text-primary)] transition-colors duration-150">
      <SEO
        title="Privacy Policy - RunJS Developer Playground"
        description="Privacy Policy for RunJS. Understand how our client-side, zero-server-tracking architecture keeps your code and data private in your browser."
        canonical="/privacy"
        keywords={[
          'RunJS privacy policy',
          'client-side code privacy',
          'in-browser JavaScript safety',
          'RunJS data handling',
          'local storage privacy',
        ]}
        structuredData={[
          getBreadcrumbSchema([
            { name: 'Home', item: '/' },
            { name: 'Privacy Policy', item: '/privacy' },
          ]),
          {
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: 'Privacy Policy | RunJS',
            url: getCanonicalUrl('/privacy'),
            description:
              'Privacy Policy for RunJS explaining client-side code execution and zero remote data collection.',
          },
        ]}
      />
      <Navbar />

      <main className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Title & Header */}
        <div className="pb-6 border-b border-[var(--border-default)]">
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-500 uppercase tracking-wider mb-2">
            <ShieldCheck className="w-4 h-4" />
            <span>Legal & Privacy</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-[var(--text-primary)]">
            Privacy Policy
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
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h2 className="text-sm sm:text-base font-bold text-[var(--text-primary)]">
                The RunJS Privacy Promise
              </h2>
              <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
                RunJS runs your code directly in your browser. We do not require
                user accounts, we do not send your code to backend execution
                servers, and we do not track or sell your personal data. Your
                work remains under your complete control.
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
            to="/terms"
            className="text-amber-600 dark:text-amber-400 hover:underline font-medium"
          >
            Read Terms & Conditions →
          </Link>
          <Link
            to="/"
            className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors hover:underline"
          >
            ← Back to RunJS Home
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default PrivacyPolicyPage;
