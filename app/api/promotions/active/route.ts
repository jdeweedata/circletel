/**
 * Public Active Promotions API
 * GET /api/promotions/active
 *
 * Returns promotions marked for homepage display
 * for the deal cards grid component.
 */

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Use anon key for public access with RLS
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export interface ActivePromotion {
  id: string
  name: string
  description: string | null
  discount_type: 'percentage' | 'fixed' | 'free_installation' | 'free_month'
  discount_value: number
  promo_code: string | null
  valid_until: string | null
  image_url: string | null
  banner_image_url: string | null
  category: 'FIBRE' | 'LTE' | '5G' | 'VOIP' | 'BUSINESS' | null
  product_category: string | null
}

export async function GET() {
  try {
    // Get active promotions marked for homepage display
    // RLS policy filters: status = 'active' AND within valid dates
    const { data, error } = await supabase
      .from('promotions')
      .select(`
        id,
        name,
        description,
        discount_type,
        discount_value,
        promo_code,
        valid_until,
        image_url,
        banner_image_url,
        category,
        product_category
      `)
      .eq('display_on_homepage', true)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(4)

    if (error) {
      console.error('[Promotions] Failed to fetch active promotions:', error)
      return NextResponse.json({ promotions: [] }, { status: 200 })
    }

    return NextResponse.json({
      promotions: data as ActivePromotion[]
    })
  } catch (error) {
    console.error('[Promotions] Active promotions API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch promotions' },
      { status: 500 }
    )
  }
}
