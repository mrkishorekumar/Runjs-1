import type { Lesson } from '../types';
import { findLessonLocation } from '../data/curriculum';

export function generateLessonJsonLd(lesson: Lesson): Record<string, unknown> {
  const location = findLessonLocation(lesson.slug);
  const canonicalUrl = `https://runjs.in/learn/${lesson.slug}`;

  const breadcrumbs = [
    {
      '@type': 'ListItem',
      position: 1,
      name: 'Home',
      item: 'https://runjs.in/',
    },
    {
      '@type': 'ListItem',
      position: 2,
      name: 'Learn JavaScript',
      item: 'https://runjs.in/learn',
    },
  ];

  if (location) {
    breadcrumbs.push({
      '@type': 'ListItem',
      position: 3,
      name: `Part ${location.part.partNumber}: ${location.part.title}`,
      item: `https://runjs.in/learn#${location.part.slug}`,
    });
    breadcrumbs.push({
      '@type': 'ListItem',
      position: 4,
      name: location.topic.title,
      item: `https://runjs.in/learn#${location.topic.slug}`,
    });
  }

  breadcrumbs.push({
    '@type': 'ListItem',
    position: breadcrumbs.length + 1,
    name: lesson.title,
    item: canonicalUrl,
  });

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'TechArticle',
        '@id': `${canonicalUrl}#article`,
        isPartOf: {
          '@type': 'WebPage',
          '@id': canonicalUrl,
          url: canonicalUrl,
          name: `${lesson.title} - JavaScript Tutorial`,
        },
        headline: lesson.title,
        description: lesson.description,
        proficiencyLevel: lesson.difficulty,
        timeRequired: `PT${lesson.readingTime}M`,
        inLanguage: 'en-US',
        keywords: lesson.tags.join(', '),
        articleSection: location?.topic.title || 'JavaScript Fundamentals',
        author: {
          '@type': 'Organization',
          name: 'RunJS',
          url: 'https://runjs.in',
        },
        publisher: {
          '@type': 'Organization',
          name: 'RunJS',
          url: 'https://runjs.in',
          logo: {
            '@type': 'ImageObject',
            url: 'https://runjs.in/runjs.in.webp',
          },
        },
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${canonicalUrl}#breadcrumb`,
        itemListElement: breadcrumbs,
      },
      {
        '@type': 'Course',
        '@id': `${canonicalUrl}#course`,
        name: lesson.title,
        description: lesson.description,
        educationalLevel: lesson.difficulty,
        provider: {
          '@type': 'Organization',
          name: 'RunJS',
          sameAs: 'https://runjs.in',
        },
        hasCourseInstance: {
          '@type': 'CourseInstance',
          courseMode: 'online',
          courseWorkload: `PT${lesson.readingTime}M`,
        },
      },
    ],
  };
}

export function generateCurriculumJsonLd(
  totalLessons: number,
  totalTopics: number
): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: 'Complete Modern JavaScript Curriculum',
    description:
      'Master modern JavaScript from fundamentals to advanced concepts, DOM manipulation, asynchronous programming, and web components with 175+ interactive lessons and coding exercises.',
    provider: {
      '@type': 'Organization',
      name: 'RunJS',
      url: 'https://runjs.in',
      logo: 'https://runjs.in/runjs.in.webp',
    },
    teaches:
      'Modern JavaScript, ES2024+, Asynchronous Programming, DOM Manipulation, Web Components',
    hasCourseInstance: {
      '@type': 'CourseInstance',
      courseMode: 'online',
      description: `Comprehensive self-paced curriculum spanning ${totalTopics} topics and ${totalLessons} interactive lessons with real-time browser execution.`,
    },
    inLanguage: 'en-US',
    isAccessibleForFree: true,
  };
}
