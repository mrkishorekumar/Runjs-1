/**
 * Centralized SEO configuration and metadata defaults for RunJS.
 */

export interface SchemaOrgData {
  '@context': 'https://schema.org';
  '@type': string;
  [key: string]: unknown;
}

export interface SEOProps {
  title?: string;
  description?: string;
  canonical?: string;
  image?: string;
  /** Alias for `image` — accepted for backward compatibility. */
  ogImage?: string;
  type?: 'website' | 'article';
  /** Alias for `type` — accepted for backward compatibility. */
  ogType?: 'website' | 'article';
  noIndex?: boolean;
  /** Alias for `noIndex` — accepted for backward compatibility (lowercase). */
  noindex?: boolean;
  noFollow?: boolean;
  keywords?: string | string[];
  structuredData?:
    | SchemaOrgData
    | SchemaOrgData[]
    | Record<string, unknown>
    | Array<Record<string, unknown>>;
  /** Alias for `structuredData` — accepted for backward compatibility. */
  jsonLd?: Record<string, unknown> | Array<Record<string, unknown>>;
}

export const SEO_CONFIG = {
  siteName: 'RunJS',
  defaultTitle: 'RunJS - In-Browser JavaScript, TypeScript & React Playground',
  titleTemplate: '%s | RunJS',
  defaultDescription:
    'Run, practice, and master JavaScript, TypeScript, and React directly in your browser. Zero setup, Monaco editor, esbuild WebAssembly compilation, and interactive coding challenges.',
  siteUrl:
    typeof import.meta !== 'undefined' && import.meta.env?.VITE_SITE_URL
      ? (import.meta.env.VITE_SITE_URL as string).replace(/\/$/, '')
      : 'https://runjs.in',
  defaultImage: '/og-image.png',
  fallbackImage: '/runjs.in.webp',
  author: 'M R Kishore Kumar',
  twitterHandle: '@mrkishorekumar',
  locale: 'en_US',
  themeColorLight: '#f59e0b',
  themeColorDark: '#09090b',
} as const;

/**
 * Normalizes a path or URL to an absolute canonical URL.
 * - Strips query parameters and hash fragments.
 * - Strips trailing slashes (except root).
 */
export function getCanonicalUrl(pathOrUrl?: string): string {
  const baseUrl = SEO_CONFIG.siteUrl;
  if (!pathOrUrl || pathOrUrl === '/' || pathOrUrl === '') {
    return `${baseUrl}/`;
  }

  // If already absolute URL
  if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')) {
    try {
      const urlObj = new URL(pathOrUrl);
      const cleanPath = urlObj.pathname.replace(/\/$/, '') || '/';
      return `${baseUrl}${cleanPath === '/' ? '/' : cleanPath}`;
    } catch {
      return baseUrl;
    }
  }

  // Relative path handling
  const cleanPath = pathOrUrl.split('?')[0].split('#')[0].replace(/\/$/, '');
  const formattedPath = cleanPath.startsWith('/') ? cleanPath : `/${cleanPath}`;
  return `${baseUrl}${formattedPath}`;
}

/**
 * Resolves an image path to an absolute URL for Open Graph / Twitter cards.
 */
export function getAbsoluteImageUrl(imagePath?: string): string {
  const targetImage = imagePath || SEO_CONFIG.defaultImage;
  if (targetImage.startsWith('http://') || targetImage.startsWith('https://')) {
    return targetImage;
  }
  const cleanPath = targetImage.startsWith('/')
    ? targetImage
    : `/${targetImage}`;
  return `${SEO_CONFIG.siteUrl}${cleanPath}`;
}

/**
 * Formats full document title using the title template.
 */
export function formatDocumentTitle(pageTitle?: string): string {
  if (!pageTitle || pageTitle === SEO_CONFIG.defaultTitle) {
    return SEO_CONFIG.defaultTitle;
  }
  if (pageTitle.includes('| RunJS') || pageTitle.includes('RunJS |')) {
    return pageTitle;
  }
  return `${pageTitle} | ${SEO_CONFIG.siteName}`;
}

/**
 * Schema.org WebApplication structured data definition.
 */
export function getWebApplicationSchema(): SchemaOrgData {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'RunJS',
    url: `${SEO_CONFIG.siteUrl}/`,
    applicationCategory: 'DeveloperApplication',
    operatingSystem: 'Any (Web Browser)',
    description: SEO_CONFIG.defaultDescription,
    browserRequirements: 'Requires JavaScript. Requires HTML5.',
    softwareVersion: '2.0.0',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    author: {
      '@type': 'Person',
      name: SEO_CONFIG.author,
      url: 'https://github.com/mrkishorekumar',
    },
  };
}

/**
 * Schema.org WebSite structured data definition with SearchAction.
 */
export function getWebSiteSchema(): SchemaOrgData {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'RunJS',
    url: `${SEO_CONFIG.siteUrl}/`,
    description: SEO_CONFIG.defaultDescription,
    publisher: {
      '@type': 'Organization',
      name: 'RunJS',
      url: 'https://runjs.in/',
      logo: {
        '@type': 'ImageObject',
        url: getAbsoluteImageUrl('/RunJS-512.png'),
      },
    },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SEO_CONFIG.siteUrl}/problems?search={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

/**
 * Schema.org BreadcrumbList structured data generator.
 */
export function getBreadcrumbSchema(
  items: { name: string; item: string }[]
): SchemaOrgData {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: getCanonicalUrl(crumb.item),
    })),
  };
}
