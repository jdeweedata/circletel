import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/marketing/announcements
 * List all announcements for admin management
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)

    const search = searchParams.get('search')
    const isActive = searchParams.get('is_active')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    let query = supabase
      .from('marketing_announcements')
      .select('*', { count: 'exact' })
      .order('priority', { ascending: false })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Apply filters
    if (isActive === 'true') {
      query = query.eq('is_active', true)
    } else if (isActive === 'false') {
      query = query.eq('is_active', false)
    }

    if (search) {
      query = query.ilike('message', `%${search}%`)
    }

    const { data: announcements, error, count } = await query

    if (error) {
      console.error('[Admin] Error fetching announcements:', error)
      return NextResponse.json(
        { error: 'Failed to fetch announcements' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      announcements: announcements || [],
      total: count || 0,
      limit,
      offset
    })
  } catch (error) {
    console.error('[Admin] Error in GET /api/admin/marketing/announcements:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/marketing/announcements
 * Create a new announcement
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    // Validate required fields
    if (!body.message) {
      return NextResponse.json(
        { error: 'Announcement message is required' },
        { status: 400 }
      )
    }

    // Prepare data
    const announcementData = {
      message: body.message,
      link_text: body.link_text || null,
      link_url: body.link_url || null,
      bg_color: body.bg_color || '#F5841E',
      text_color: body.text_color || '#FFFFFF',
      is_active: body.is_active ?? false,
      priority: body.priority ?? 0,
      valid_from: body.valid_from || null,
      valid_until: body.valid_until || null
    }

    const { data: announcement, error } = await supabase
      .from('marketing_announcements')
      .insert(announcementData)
      .select()
      .single()

    if (error) {
      console.error('[Admin] Error creating announcement:', error)
      return NextResponse.json(
        { error: 'Failed to create announcement' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      announcement,
      message: 'Announcement created successfully'
    })
  } catch (error) {
    console.error('[Admin] Error in POST /api/admin/marketing/announcements:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
