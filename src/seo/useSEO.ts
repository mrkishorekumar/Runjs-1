import { useEffect } from 'react';
import {
  SEOProps,
  SEO_CONFIG,
  formatDocumentTitle,
  getCanonicalUrl,
  getAbsoluteImageUrl,
} from './seoConfig';

function setMetaTag(
  attributeName: 'name' | 'property',
  attributeValue: string,
  content: string | undefined
) {
  let element = document.querySelector(
    `meta[${attributeName}="${attributeValue}"]`
  );

  if (content === undefined || content === null) {
    if (element) {
      element.remove();
    }
    return;
  }

  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attributeName, attributeValue);
    document.head.appendChild(element);
  }

  element.setAttribute('content', content);
}

function setCanonicalLink(canonicalUrl: string | undefined) {
  let link = document.querySelector('link[rel="canonical"]');

  if (!canonicalUrl) {
    if (link) {
      link.remove();
    }
    return;
  }

  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', 'canonical');
    document.head.appendChild(link);
  }

  link.setAttribute('href', canonicalUrl);
}

function setJsonLd(structuredData: SEOProps['structuredData']) {
  const rootScript = document.getElementById(
    'seo-json-ld'
  ) as HTMLScriptElement | null;

  if (!structuredData) {
    if (rootScript) {
      rootScript.remove();
    }
    return;
  }

  const dataArray = Array.isArray(structuredData)
    ? structuredData
    : [structuredData];

  const payload =
    dataArray.length === 1
      ? dataArray[0]
      : {
          '@context': 'https://schema.org',
          '@graph': dataArray,
        };

  if (rootScript) {
    rootScript.textContent = JSON.stringify(payload);
  } else {
    const script = document.createElement('script');
    script.id = 'seo-json-ld';
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(payload);
    document.head.appendChild(script);
  }
}

/**
 * Custom hook to dynamically apply route-level SEO metadata to document head.
 */
export function useSEO({
  title,
  description = SEO_CONFIG.defaultDescription,
  canonical,
  image,
  ogImage,
  type,
  ogType,
  noIndex = false,
  noindex = false,
  noFollow = false,
  keywords,
  structuredData,
  jsonLd,
}: SEOProps) {
  // Resolve aliases so pages migrated from src/components/SEO.tsx work without prop renames.
  const resolvedImage = image ?? ogImage;
  const resolvedType: 'website' | 'article' = type ?? ogType ?? 'website';
  const resolvedNoIndex = noIndex || noindex;
  const resolvedData = structuredData ?? jsonLd;
  const resolvedKeywords: string[] | undefined =
    keywords === undefined
      ? undefined
      : Array.isArray(keywords)
        ? keywords
        : [keywords];

  useEffect(() => {
    // 1. Update Document Title
    const formattedTitle = formatDocumentTitle(title);
    document.title = formattedTitle;

    // 2. Canonical URL & Image URL
    const canonicalUrl =
      canonical === undefined ? undefined : getCanonicalUrl(canonical);
    const absoluteImageUrl = getAbsoluteImageUrl(resolvedImage);

    // 3. Standard Meta Directives
    const robotsContent =
      resolvedNoIndex || noFollow
        ? `${resolvedNoIndex ? 'noindex' : 'index'}, ${noFollow ? 'nofollow' : 'follow'}`
        : 'index, follow';

    setMetaTag('name', 'description', description);
    setMetaTag('name', 'robots', robotsContent);
    setMetaTag('name', 'author', SEO_CONFIG.author);
    if (resolvedKeywords && resolvedKeywords.length > 0) {
      setMetaTag('name', 'keywords', resolvedKeywords.join(', '));
    }

    // 4. Canonical Link
    setCanonicalLink(canonicalUrl);

    // 5. Open Graph Meta Tags
    setMetaTag('property', 'og:title', formattedTitle);
    setMetaTag('property', 'og:description', description);
    if (canonicalUrl) {
      setMetaTag('property', 'og:url', canonicalUrl);
    } else {
      setMetaTag('property', 'og:url', undefined);
    }
    setMetaTag('property', 'og:image', absoluteImageUrl);
    setMetaTag('property', 'og:type', resolvedType);
    setMetaTag('property', 'og:site_name', SEO_CONFIG.siteName);
    setMetaTag('property', 'og:locale', SEO_CONFIG.locale);

    // 6. Twitter Card Meta Tags
    setMetaTag('name', 'twitter:card', 'summary_large_image');
    setMetaTag('name', 'twitter:title', formattedTitle);
    setMetaTag('name', 'twitter:description', description);
    setMetaTag('name', 'twitter:image', absoluteImageUrl);
    setMetaTag('name', 'twitter:creator', SEO_CONFIG.twitterHandle);
    setMetaTag('name', 'twitter:site', SEO_CONFIG.twitterHandle);

    // 7. Structured Data (JSON-LD)
    setJsonLd(resolvedData as SEOProps['structuredData']);

    return () => {
      // Clean up dynamic structured data when route unmounts
      const rootScript = document.getElementById('seo-json-ld');
      if (rootScript) {
        rootScript.remove();
      }
    };
  }, [
    title,
    description,
    canonical,
    resolvedImage,
    resolvedType,
    resolvedNoIndex,
    noFollow,
    resolvedKeywords,
    resolvedData,
  ]);
}
