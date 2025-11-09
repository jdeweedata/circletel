/**
 * Prismic Client Configuration
 *
 * Handles connection to Prismic CMS for content management
 */

import * as prismic from '@prismicio/client';

export const repositoryName = 'circletel';

export const client = prismic.createClient(repositoryName, {
  // Fetch the latest content from the Prismic API
  fetchOptions:
    process.env.NODE_ENV === 'production'
      ? { next: { revalidate: 60 } } // Cache for 60 seconds in production
      : { next: { revalidate: 0 } }, // No cache in development
});

/**
 * Get a page by UID
 */
export async function getPageByUID(uid: string) {
  try {
    const page = await client.getByUID('page', uid);
    return page;
  } catch (error) {
    console.error(`Failed to fetch Prismic page with UID "${uid}":`, error);
    return null;
  }
}

/**
 * Get all pages
 */
export async function getAllPages() {
  try {
    const pages = await client.getAllByType('page');
    return pages;
  } catch (error) {
    console.error('Failed to fetch Prismic pages:', error);
    return [];
  }
}

/**
 * Get homepage content
 */
export async function getHomepage() {
  try {
    const homepage = await client.getSingle('homepage');
    return homepage;
  } catch (error) {
    console.error('Failed to fetch Prismic homepage:', error);
    return null;
  }
}
