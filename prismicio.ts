/**
 * Prismic TypeScript Types and Configuration
 *
 * This file is used by Prismic to generate TypeScript types for your content
 */

import * as prismic from '@prismicio/client';
import * as prismicNext from '@prismicio/next';

export const repositoryName =
  process.env.NEXT_PUBLIC_PRISMIC_ENVIRONMENT || prismic.getRepositoryName('circletel');

/**
 * A list of Route Resolver objects that define how a document's `url` field
 * is resolved.
 *
 * {@link https://prismic.io/docs/route-resolver#route-resolver}
 */
const routes: prismic.ClientConfig['routes'] = [
  {
    type: 'page',
    path: '/:uid',
  },
  {
    type: 'homepage',
    path: '/',
  },
];

/**
 * Creates a Prismic client for the project's repository. The client is used to
 * query content from the Prismic API.
 *
 * @param config - Configuration for the Prismic client.
 */
export const createClient = (config: prismicNext.CreateClientConfig = {}) => {
  const client = prismic.createClient(repositoryName, {
    routes,
    fetchOptions:
      process.env.NODE_ENV === 'production'
        ? { next: { revalidate: 60 } }
        : { next: { revalidate: 0 } },
    ...config,
  });

  prismicNext.enableAutoPreviews({
    client,
    previewData: config.previewData,
    req: config.req,
  });

  return client;
};
