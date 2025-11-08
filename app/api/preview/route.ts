import { draftMode } from 'next/headers'
import { redirect } from 'next/navigation'
import { createPrismicClient, linkResolver } from '@/lib/prismic'

/**
 * Prismic Preview Route Handler
 *
 * This route handler enables preview mode for Prismic content.
 * When a content editor clicks "Preview" in Prismic, they are
 * redirected to this route, which enables draft mode and redirects
 * to the appropriate page.
 *
 * @see https://prismic.io/docs/preview-drafts-next-js
 */
export async function GET(request: Request) {
  const client = createPrismicClient()
  const url = new URL(request.url)
  const token = url.searchParams.get('token')
  const documentId = url.searchParams.get('documentId')

  if (!token) {
    return new Response('Missing token', { status: 401 })
  }

  // Enable Next.js Draft Mode
  const draft = await draftMode()
  draft.enable()

  try {
    // Fetch the document to get its URL
    const document = await client.getByID(documentId || '', {
      ref: token,
    })

    // Resolve the document's URL using the link resolver
    const redirectUrl = linkResolver(document as any)

    // Redirect to the document's URL
    redirect(redirectUrl)
  } catch (error) {
    console.error('Preview error:', error)
    // Fallback: redirect to homepage
    redirect('/')
  }
}
