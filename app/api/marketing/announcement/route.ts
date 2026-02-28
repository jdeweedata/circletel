/**
 * Public Marketing Announcement API
 * GET /api/marketing/announcement
 *
 * Returns the highest priority active announcement for display
 * on the homepage and site-wide announcement bar.
 */

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Use anon key for public access with RLS
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET() {
  try {
    const now = new Date().toISOString()

    // Get the highest priority active announcement
    // RLS policy already filters: is_active = true AND within valid dates
    const { data, error } = await supabase
      .from('marketing_announcements')
      .select('id, message, link_text, link_url, bg_color, text_color, valid_until')
      .eq('is_active', true)
      .or(`valid_from.is.null,valid_from.lte.${now}`)
      .or(`valid_until.is.null,valid_until.gt.${now}`)
      .order('priority', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) {
      console.error('[Marketing] Failed to fetch announcement:', error)
      return NextResponse.json({ announcement: null }, { status: 200 })
    }

    return NextResponse.json({
      announcement: data
    })
  } catch (error) {
    console.error('[Marketing] Announcement API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch announcement' },
      { status: 500 }
    )
  }
}
