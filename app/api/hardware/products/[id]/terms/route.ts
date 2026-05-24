/**
 * Hardware Product Terms API
 *
 * GET    /api/hardware/products/[id]/terms          — get current terms
 * PATCH  /api/hardware/products/[id]/terms          — update terms (auto-versions)
 * GET    /api/hardware/products/[id]/terms/history  — get version history
 */

import { NextResponse } from 'next/server'
import {
  getCurrentTerms,
  updateTerms,
  getTermsHistory,
} from '@/lib/hardware-catalogue/terms'
import type { HardwareProductTerms } from '@/lib/hardware-catalogue/types'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const terms = await getCurrentTerms(id)
    if (!terms) {
      return NextResponse.json(null)
    }
    return NextResponse.json(terms)
  } catch (error) {
    console.error('[Terms API] GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch terms' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const updates: Partial<HardwareProductTerms> = {}
    if (body.warranty_period !== undefined)
      updates.warranty_period = body.warranty_period
    if (body.return_policy !== undefined)
      updates.return_policy = body.return_policy
    if (body.refund_policy !== undefined)
      updates.refund_policy = body.refund_policy
    if (body.delivery_estimate !== undefined)
      updates.delivery_estimate = body.delivery_estimate
    if (body.warranty_notes !== undefined)
      updates.warranty_notes = body.warranty_notes
    if (body.is_back_to_back !== undefined)
      updates.is_back_to_back = body.is_back_to_back

    const terms = await updateTerms(id, updates)
    return NextResponse.json(terms)
  } catch (error) {
    console.error('[Terms API] PATCH error:', error)
    return NextResponse.json(
      { error: 'Failed to update terms' },
      { status: 500 }
    )
  }
}
