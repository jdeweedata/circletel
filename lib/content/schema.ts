// lib/content/schema.ts
import { ContentPageMeta } from './types';

const SITE_URL = 'https://www.circletel.co.za';

/**
 * WebPage schema for legal/content pages
 */
export function generateWebPageSchema(meta: ContentPageMeta) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: meta.title,
    description: meta.description,
    url: `${SITE_URL}${meta.canonicalPath}`,
    dateModified: meta.lastUpdated,
    inLanguage: 'en-ZA',
    publisher: {
      '@type': 'Organization',
      name: 'CircleTel',
      url: SITE_URL,
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_URL}/logo.png`,
      },
    },
  };
}

/**
 * BreadcrumbList schema for navigation
 */
export function generateBreadcrumbSchema(meta: ContentPageMeta) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: SITE_URL,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: meta.title,
        item: `${SITE_URL}${meta.canonicalPath}`,
      },
    ],
  };
}
