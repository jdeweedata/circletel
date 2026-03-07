import { client, previewClient } from './client'
import { draftMode } from 'next/headers'
import { unstable_cache } from 'next/cache'

type FetchOptions = {
  query: string
  params?: Record<string, unknown>
  tags?: string[]
  revalidate?: number | false
}

/**
 * Draft-aware fetch helper.
 * Uses preview client in draft mode, production client otherwise.
 * Automatically applies cache tags for ISR.
 */
export async function sanityFetch<T>({
  query,
  params = {},
  tags = [],
  revalidate = false,
}: FetchOptions): Promise<T> {
  const isDraft = (await draftMode()).isEnabled

  // In draft mode, use preview client (no caching)
  if (isDraft) {
    return previewClient.fetch<T>(query, params)
  }

  // Production: use Next.js cache with tags
  const cachedFetch = unstable_cache(
    async () => client.fetch<T>(query, params),
    [query, JSON.stringify(params)],
    {
      tags,
      revalidate: revalidate === false ? undefined : revalidate,
    }
  )

  return cachedFetch()
}
