import { Link } from 'react-router';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import SEO from '../seo/SEO';
import { getBreadcrumbSchema, getCanonicalUrl } from '../seo/seoConfig';
import {
  MessageCircle,
  Bug,
  Lightbulb,
  HelpCircle,
  ExternalLink,
  Mail,
  ArrowRight,
} from 'lucide-react';

function LinkedinIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect x="2" y="9" width="4" height="12" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  );
}

function GithubIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
      <path d="M9 18c-4.51 2-5-2-7-2" />
    </svg>
  );
}

const contactChannels = [
  {
    id: 'email-support',
    icon: Mail,
    iconColor: 'text-emerald-500',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/20',
    title: 'Direct Email Support',
    description:
      'Have questions, feedback, or business inquiries? Send a direct email to the creator and maintainer.',
    cta: 'mrkishorekumar18@gmail.com',
    href: 'mailto:mrkishorekumar18@gmail.com',
    external: false,
    recommended: true,
  },
  {
    id: 'github-issues',
    icon: Bug,
    iconColor: 'text-red-500',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/20',
    title: 'Bug Reports & Issues',
    description:
      'Found a bug or something broken? Open a GitHub issue with steps to reproduce and we will get it fixed.',
    cta: 'Open a GitHub Issue',
    href: 'https://github.com/mrkishorekumar/Runjs-1/issues/new?template=bug_report.md',
    external: true,
    recommended: false,
  },
  {
    id: 'github-features',
    icon: Lightbulb,
    iconColor: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/20',
    title: 'Feature Requests & Ideas',
    description:
      'Have an idea that could improve RunJS? Share it as a GitHub discussion or feature request — all suggestions are welcome.',
    cta: 'Request a Feature',
    href: 'https://github.com/mrkishorekumar/Runjs-1/issues/new?template=feature_request.md',
    external: true,
    recommended: false,
  },
  {
    id: 'linkedin',
    icon: LinkedinIcon,
    iconColor: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/20',
    title: 'LinkedIn — RunJS Company Page',
    description:
      'Follow the RunJS LinkedIn company page for announcements, updates, and to send a professional message to the team.',
    cta: 'Visit LinkedIn Page',
    href: 'https://www.linkedin.com/company/runjs/',
    external: true,
    recommended: false,
  },
  {
    id: 'github-discussions',
    icon: MessageCircle,
    iconColor: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/20',
    title: 'GitHub Discussions',
    description:
      'Ask questions, share what you built, or start a conversation with the community in GitHub Discussions.',
    cta: 'Join the Discussion',
    href: 'https://github.com/mrkishorekumar/Runjs-1/discussions',
    external: true,
    recommended: false,
  },
];

const faqs = [
  {
    question: 'How do I report a bug?',
    answer:
      'Open a GitHub Issue with a clear description, steps to reproduce, and your browser/OS info. That is the fastest path to a fix.',
  },
  {
    question: 'My saved code disappeared. What do I do?',
    answer:
      "RunJS stores everything in your browser's IndexedDB. Clearing browser data or using Private/Incognito mode will remove saved work. Use the in-app export feature regularly to back up important snippets.",
  },
  {
    question: 'Can I contribute to RunJS?',
    answer:
      'Yes! RunJS is open-source under the MIT license. Fork the repo on GitHub, make your changes, and open a pull request.',
  },
  {
    question: 'I have a business or partnership inquiry.',
    answer:
      'Please reach out via the RunJS LinkedIn company page for any commercial or partnership-related conversations.',
  },
];

function ContactPage() {
  return (
    <div className="min-h-screen w-full flex flex-col justify-between bg-[var(--bg-app)] text-[var(--text-primary)] transition-colors duration-150">
      <SEO
        title="Contact RunJS — Report Issues, Request Features & Get Help"
        description="Get in touch with the RunJS team. Report bugs, request features, ask questions, or reach out via GitHub Issues, GitHub Discussions, or the RunJS LinkedIn company page."
        canonical="/contact"
        keywords={[
          'RunJS contact',
          'RunJS support',
          'RunJS bug report',
          'RunJS feature request',
          'RunJS GitHub issues',
          'RunJS LinkedIn',
          'JavaScript playground help',
        ]}
        structuredData={[
          getBreadcrumbSchema([
            { name: 'Home', item: '/' },
            { name: 'Contact', item: '/contact' },
          ]),
          {
            '@context': 'https://schema.org',
            '@type': 'ContactPage',
            name: 'Contact RunJS',
            url: getCanonicalUrl('/contact'),
            description:
              'Contact RunJS to report bugs, request features, or reach out via GitHub or LinkedIn.',
          },
        ]}
      />
      <Navbar />

      <main className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Page Header */}
        <div className="pb-6 border-b border-[var(--border-default)] mb-8">
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-500 uppercase tracking-wider mb-2">
            <Mail className="w-4 h-4" />
            <span>Get in Touch</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-[var(--text-primary)]">
            Contact & Support
          </h1>
          <p className="mt-2 text-sm sm:text-base text-[var(--text-secondary)] leading-relaxed max-w-2xl">
            RunJS is an open-source project maintained by one developer. You can
            reach out directly via email at{' '}
            <a
              href="mailto:mrkishorekumar18@gmail.com"
              className="text-amber-600 dark:text-amber-400 font-semibold underline underline-offset-2 hover:opacity-80"
            >
              mrkishorekumar18@gmail.com
            </a>
            , or through GitHub and LinkedIn below.
          </p>
        </div>

        {/* Contact Channels Grid */}
        <section aria-labelledby="channels-heading" className="mb-10">
          <h2
            id="channels-heading"
            className="text-sm font-bold uppercase tracking-wider text-[var(--text-muted)] mb-4"
          >
            Contact Channels
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {contactChannels.map((channel) => {
              const Icon = channel.icon;
              return (
                <a
                  key={channel.id}
                  href={channel.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`group relative flex flex-col gap-3 p-5 sm:p-6 rounded-xl border ${channel.borderColor} bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] transition-colors shadow-xs`}
                >
                  {channel.recommended && (
                    <span className="absolute top-3 right-3 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-500 border border-amber-500/25">
                      Recommended
                    </span>
                  )}
                  <div
                    className={`w-9 h-9 rounded-lg ${channel.bgColor} flex items-center justify-center shrink-0`}
                  >
                    <Icon className={`w-4.5 h-4.5 ${channel.iconColor}`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-bold text-[var(--text-primary)] mb-1">
                      {channel.title}
                    </h3>
                    <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                      {channel.description}
                    </p>
                  </div>
                  <div
                    className={`inline-flex items-center gap-1.5 text-xs font-semibold ${channel.iconColor} group-hover:gap-2 transition-all`}
                  >
                    <span>{channel.cta}</span>
                    <ExternalLink className="w-3 h-3 opacity-70" />
                  </div>
                </a>
              );
            })}
          </div>
        </section>

        {/* Creator profile callout */}
        <section className="mb-10 p-5 sm:p-6 rounded-xl border border-[var(--border-default)] bg-gradient-to-br from-amber-500/5 via-[var(--bg-surface)] to-[var(--bg-surface)] flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
            <GithubIcon className="w-5 h-5 text-amber-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-[var(--text-primary)]">
              M R Kishore Kumar — Creator &amp; Maintainer
            </p>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              RunJS is built and maintained by a single developer. Response
              times may vary, but every issue is read.
            </p>
          </div>
          <a
            href="https://github.com/mrkishorekumar"
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            <span>GitHub Profile</span>
            <ExternalLink className="w-3 h-3 opacity-60" />
          </a>
        </section>

        {/* FAQ */}
        <section aria-labelledby="faq-heading" className="mb-10">
          <h2
            id="faq-heading"
            className="text-sm font-bold uppercase tracking-wider text-[var(--text-muted)] mb-4 flex items-center gap-2"
          >
            <HelpCircle className="w-4 h-4" />
            Frequently Asked Questions
          </h2>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <details
                key={i}
                className="group rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] overflow-hidden"
              >
                <summary className="flex items-center justify-between gap-3 px-5 py-4 cursor-pointer select-none text-sm font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors list-none [&::-webkit-details-marker]:hidden">
                  <span>{faq.question}</span>
                  <ArrowRight className="w-4 h-4 text-amber-500 shrink-0 group-open:rotate-90 transition-transform duration-200" />
                </summary>
                <p className="px-5 pb-4 pt-0 text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed border-t border-[var(--border-subtle)]">
                  {faq.answer}
                </p>
              </details>
            ))}
          </div>
        </section>

        {/* Bottom navigation */}
        <div className="pt-6 border-t border-[var(--border-default)] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <Link
            to="/about"
            className="text-amber-600 dark:text-amber-400 hover:underline font-medium"
          >
            ← About RunJS
          </Link>
          <Link
            to="/"
            className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors hover:underline"
          >
            Back to RunJS Home →
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default ContactPage;
