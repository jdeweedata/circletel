// app/api/sanity/revalidate/route.ts
import { revalidatePath, revalidateTag } from 'next/cache'
import { parseBody } from 'next-sanity/webhook'
import { NextRequest, NextResponse } from 'next/server'
import { getTagsForDocument, getPathForDocument } from '@/lib/sanity/revalidation'

const secret = process.env.SANITY_WEBHOOK_SECRET

interface WebhookPayload {
  _type: string
  _id: string
  slug?: string
  oldSlug?: string
  operation?: 'create' | 'update' | 'delete'
}

export async function POST(request: NextRequest) {
  try {
    // Validate webhook signature
    const { isValidSignature, body } = await parseBody<WebhookPayload>(
      request,
      secret
    )

    if (!isValidSignature) {
      console.warn('[Sanity Revalidate] Invalid webhook signature')
      return NextResponse.json(
        { message: 'Invalid signature' },
        { status: 401 }
      )
    }

    // Validate payload
    if (!body?._type) {
      return NextResponse.json(
        { message: 'Invalid payload: missing _type' },
        { status: 400 }
      )
    }

    const { _type, slug, oldSlug, operation = 'update' } = body

    console.log(`[Sanity Revalidate] ${operation} ${_type}: ${slug || 'no slug'}`)

    // Tag-based revalidation (primary strategy)
    const tags = getTagsForDocument(_type, slug)
    for (const tag of tags) {
      revalidateTag(tag)
    }

    // Path-based revalidation for slug changes
    if (operation === 'update' && oldSlug && oldSlug !== slug) {
      const oldPath = getPathForDocument(_type, oldSlug)
      const newPath = getPathForDocument(_type, slug)

      if (oldPath) revalidatePath(oldPath)
      if (newPath) revalidatePath(newPath)

      console.log(`[Sanity Revalidate] Slug changed: ${oldSlug} → ${slug}`)
    }

    // Path-based revalidation for deletions
    if (operation === 'delete' && slug) {
      const path = getPathForDocument(_type, slug)
      if (path) revalidatePath(path)
    }

    return NextResponse.json({
      revalidated: true,
      tags,
      message: `Marked stale: ${tags.join(', ')}`,
      timestamp: new Date().toISOString(),
    })

  } catch (error) {
    console.error('[Sanity Revalidate] Error:', error)

    return NextResponse.json(
      { message: 'Error revalidating', error: String(error) },
      { status: 500 }
    )
  }
}
