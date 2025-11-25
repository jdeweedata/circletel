import { draftMode } from 'next/headers'
import { redirect } from 'next/navigation'
import { NextRequest } from 'next/server'

/**
 * Prismic Preview Route Handler
 * 
 * This endpoint handles preview requests from the Prismic dashboard.
 * When a content editor clicks "Preview" in Prismic, they're redirected here.
 * 
 * Flow:
 * 1. Prismic sends preview token + document ID
 * 2. We enable Next.js draft mode
 * 3. Redirect to the document URL
 * 4. Page renders with draft content (unpublished changes)
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  
  // Get preview token and document ID from Prismic
  const token = searchParams.get('token')
  const documentId = searchParams.get('documentId')
  
  if (!token) {
    return new Response('Missing token', { status: 401 })
  }
  
  // Enable Next.js draft mode (sets cookie)
  const draft = await draftMode()
  draft.enable()
  
  // Determine redirect URL
  // If documentId is provided, redirect to that specific page
  // Otherwise, redirect to homepage
  let redirectUrl = '/'
  
  if (documentId) {
    // For now, redirect to homepage
    // In Phase 4, we'll query Prismic to get the page UID and redirect to /[uid]
    redirectUrl = '/'
  }
  
  // Redirect to the preview URL
  redirect(redirectUrl)
}

/**
 * Disable Preview Mode
 * 
 * Users can visit /api/preview?disable=true to exit preview mode
 */
export async function POST(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const disable = searchParams.get('disable')
  
  if (disable === 'true') {
    const draft = await draftMode()
    draft.disable()
    
    return new Response('Preview mode disabled', { status: 200 })
  }
  
  return new Response('Invalid request', { status: 400 })
}
