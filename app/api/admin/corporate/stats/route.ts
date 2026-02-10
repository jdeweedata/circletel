/**
 * Corporate Stats API
 *
 * GET /api/admin/corporate/stats - Get aggregate stats for corporate accounts
 */

import { NextRequest, NextResponse } from 'next/server'
import { CorporateAccountService } from '@/lib/corporate'
import { apiLogger } from '@/lib/logging'

export async function GET(request: NextRequest) {
  try {
    const stats = await CorporateAccountService.getStats()

    return NextResponse.json(stats)
  } catch (error) {
    apiLogger.error('Failed to get corporate stats', { error })
    return NextResponse.json({ error: 'Failed to get corporate stats' }, { status: 500 })
  }
}
