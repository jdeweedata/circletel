/**
 * Terms History API
 *
 * GET /api/hardware/products/[id]/terms/history
 */

import { NextResponse } from 'next/server'
import { getTermsHistory } from '@/lib/hardware-catalogue/terms'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const history = await getTermsHistory(id)
    return NextResponse.json({ history })
  } catch (error) {
    console.error('[Terms History API] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch terms history' },
      { status: 500 }
    )
  }
}
