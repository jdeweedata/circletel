import * as prismic from '@prismicio/client'
import * as prismicNext from '@prismicio/next'
import { CreateClientConfig } from '@prismicio/next'

/**
 * Prismic repository name for CircleTel
 */
export const repositoryName =
  process.env.NEXT_PUBLIC_PRISMIC_REPOSITORY || 'circletel-cms'

/**
 * Route configuration for Prismic Link Resolver
 * Maps Prismic document types to Next.js routes
 */
const routes: prismic.ClientConfig['routes'] = [
  {
    type: 'page',
    path: '/:uid',
  },
  {
    type: 'blog_post',
    path: '/blog/:uid',
  },
  {
    type: 'product',
    path: '/products/:uid',
  },
  {
    type: 'marketing_page',
    path: '/marketing/:uid',
  },
  {
    type: 'promotion',
    path: '/promotions/:uid',
  },
  {
    type: 'campaign',
    path: '/campaigns/:uid',
  },
]

/**
 * Creates a Prismic client for querying content
 *
 * @param config - Optional configuration for the client
 * @returns Configured Prismic client instance
 *
 * @example
 * ```typescript
 * const client = createPrismicClient()
 * const page = await client.getByUID('page', 'home')
 * ```
 */
export const createPrismicClient = (config: CreateClientConfig = {}) => {
  const client = prismic.createClient(repositoryName, {
    routes,
    accessToken: process.env.PRISMIC_ACCESS_TOKEN,
    fetchOptions:
      process.env.NODE_ENV === 'production'
        ? {
            next: {
              tags: ['prismic'],
              revalidate: 60 // Revalidate every 60 seconds in production
            }
          }
        : {
            next: {
              revalidate: 5 // Revalidate every 5 seconds in development
            }
          },
    ...config,
  })

  prismicNext.enableAutoPreviews({
    client,
    previewData: config.previewData,
    req: config.req,
  })

  return client
}

/**
 * Link resolver function for generating URLs from Prismic documents
 * Used by PrismicLink and PrismicText components
 *
 * @param doc - Prismic document
 * @returns URL path for the document
 */
export const linkResolver = (doc: prismic.FilledLinkToDocumentField) => {
  switch (doc.type) {
    case 'page':
      return doc.uid === 'home' ? '/' : `/${doc.uid}`
    case 'blog_post':
      return `/blog/${doc.uid}`
    case 'product':
      return `/products/${doc.uid}`
    case 'marketing_page':
      return `/marketing/${doc.uid}`
    case 'promotion':
      return `/promotions/${doc.uid}`
    case 'campaign':
      return `/campaigns/${doc.uid}`
    default:
      return '/'
  }
}

/**
 * Helper to check if running in Prismic preview mode
 */
export const isPreviewMode = () => {
  return typeof window !== 'undefined' && window.location.search.includes('preview=true')
}
