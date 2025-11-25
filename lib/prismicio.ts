import * as prismic from '@prismicio/client'
import * as prismicNext from '@prismicio/next'
import { draftMode } from 'next/headers'

/**
 * Prismic Client Configuration
 * 
 * This file creates and configures the Prismic client for CircleTel.
 * It handles draft mode (previews) and provides type-safe queries.
 */

/**
 * Get Prismic repository name from environment
 * This should match the repository name in slicemachine.config.json
 */
export const repositoryName = process.env.PRISMIC_REPOSITORY_NAME || 'circletel'

/**
 * Create Prismic Client
 * 
 * This function creates a configured Prismic client with:
 * - Draft mode support (for previewing unpublished content)
 * - Automatic API endpoint generation
 * - Type-safe queries (when used with generated types)
 * 
 * @param config - Optional Prismic client configuration
 * @returns Configured Prismic client
 */
export function createClient(config: prismicNext.CreateClientConfig = {}) {
  const client = prismic.createClient(repositoryName, {
    // Routes configuration (maps Prismic types to Next.js routes)
    routes: [
      {
        type: 'page',
        path: '/:uid',
      },
    ],
    
    // Fetch options
    fetchOptions: config.fetchOptions || {},
    
    // Additional client configuration
    ...config,
  })

  // Enable preview mode if in draft mode
  prismicNext.enableAutoPreviews({
    client,
    previewData: config.previewData,
    req: config.req,
  })

  return client
}

/**
 * Create Prismic Client with Draft Mode Support (Server-Side)
 * 
 * Use this in Server Components and Route Handlers to automatically
 * handle draft mode (previews from Prismic dashboard).
 * 
 * @returns Configured Prismic client with draft mode support
 */
export async function createClientWithDraftMode() {
  const draft = await draftMode()
  
  const client = createClient({
    // If in draft mode, Prismic will fetch unpublished content
    previewData: draft.isEnabled ? { previewData: 'enabled' } : undefined,
  })

  return client
}

/**
 * Create Prismic Client (Client-Side)
 * 
 * Use this in Client Components. Note: Draft mode only works server-side.
 * 
 * @returns Configured Prismic client (no draft mode)
 */
export function createClientBrowser() {
  return createClient()
}

/**
 * Type-safe helper for querying pages by UID
 * 
 * @param uid - Page UID (URL slug)
 * @returns Page document or null if not found
 */
export async function getPageByUID(uid: string) {
  const client = await createClientWithDraftMode()
  
  try {
    const page = await client.getByUID('page', uid)
    return page
  } catch (error) {
    // Page not found
    console.error(`Page not found: ${uid}`, error)
    return null
  }
}

/**
 * Get all published pages
 * 
 * Useful for generating sitemaps or listing pages
 * 
 * @returns Array of page documents
 */
export async function getAllPages() {
  const client = await createClientWithDraftMode()
  
  try {
    const pages = await client.getAllByType('page')
    return pages
  } catch (error) {
    console.error('Failed to fetch pages', error)
    return []
  }
}
