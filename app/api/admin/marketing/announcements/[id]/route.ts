import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/marketing/announcements/[id]
 * Get a specific announcement
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const supabase = await createClient()

    const { data: announcement, error } = await supabase
      .from('marketing_announcements')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !announcement) {
      return NextResponse.json(
        { error: 'Announcement not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ announcement })
  } catch (error) {
    console.error('[Admin] Error fetching announcement:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/admin/marketing/announcements/[id]
 * Update an announcement
 */
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const supabase = await createClient()
    const body = await request.json()

    // Build update object with only provided fields
    const updateData: Record<string, unknown> = {}

    if (body.message !== undefined) updateData.message = body.message
    if (body.link_text !== undefined) updateData.link_text = body.link_text
    if (body.link_url !== undefined) updateData.link_url = body.link_url
    if (body.bg_color !== undefined) updateData.bg_color = body.bg_color
    if (body.text_color !== undefined) updateData.text_color = body.text_color
    if (body.is_active !== undefined) updateData.is_active = body.is_active
    if (body.priority !== undefined) updateData.priority = body.priority
    if (body.valid_from !== undefined) updateData.valid_from = body.valid_from
    if (body.valid_until !== undefined) updateData.valid_until = body.valid_until

    // Check if there's anything to update
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      )
    }

    const { data: announcement, error } = await supabase
      .from('marketing_announcements')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('[Admin] Error updating announcement:', error)
      return NextResponse.json(
        { error: 'Failed to update announcement' },
        { status: 500 }
      )
    }

    if (!announcement) {
      return NextResponse.json(
        { error: 'Announcement not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      announcement,
      message: 'Announcement updated successfully'
    })
  } catch (error) {
    console.error('[Admin] Error in PUT /api/admin/marketing/announcements/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/admin/marketing/announcements/[id]
 * Delete an announcement
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const supabase = await createClient()

    const { error } = await supabase
      .from('marketing_announcements')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('[Admin] Error deleting announcement:', error)
      return NextResponse.json(
        { error: 'Failed to delete announcement' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Announcement deleted successfully'
    })
  } catch (error) {
    console.error('[Admin] Error in DELETE /api/admin/marketing/announcements/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
