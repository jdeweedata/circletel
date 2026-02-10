/**
 * Corporate PPPoE Credential Generation API
 *
 * POST /api/admin/corporate/[id]/pppoe/generate - Generate PPPoE credentials for sites
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  CorporateAccountService,
  CorporateSiteService,
  CorporatePPPoEBulkService,
} from '@/lib/corporate'
import { apiLogger } from '@/lib/logging'

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const body = await request.json()

    // Verify corporate exists
    const corporate = await CorporateAccountService.getById(id)
    if (!corporate) {
      return NextResponse.json({ error: 'Corporate account not found' }, { status: 404 })
    }

    let siteIds: string[]

    if (body.siteIds && Array.isArray(body.siteIds) && body.siteIds.length > 0) {
      // Generate for specific sites
      siteIds = body.siteIds
    } else if (body.generateAll) {
      // Generate for all sites without credentials
      const sites = await CorporateSiteService.getAllForCorporate(id)
      siteIds = sites.filter((s) => !s.pppoeCredentialId).map((s) => s.id)

      if (siteIds.length === 0) {
        return NextResponse.json({
          success: true,
          message: 'All sites already have credentials',
          totalSites: 0,
          generatedCount: 0,
          failedCount: 0,
          errors: [],
          credentials: [],
        })
      }
    } else {
      return NextResponse.json(
        { error: 'Provide either siteIds array or set generateAll: true' },
        { status: 400 }
      )
    }

    const result = await CorporatePPPoEBulkService.bulkGenerate(siteIds, body.generatedBy)

    apiLogger.info('PPPoE credentials generated for corporate', {
      corporateId: id,
      totalSites: result.totalSites,
      generatedCount: result.generatedCount,
      failedCount: result.failedCount,
    })

    return NextResponse.json({
      success: result.success,
      totalSites: result.totalSites,
      generatedCount: result.generatedCount,
      failedCount: result.failedCount,
      errors: result.errors,
      // Only include credentials if explicitly requested (for immediate display)
      credentials: body.includeCredentials ? result.credentials : undefined,
    })
  } catch (error) {
    apiLogger.error('Failed to generate PPPoE credentials', { error })
    return NextResponse.json({ error: 'Failed to generate credentials' }, { status: 500 })
  }
}

/**
 * GET /api/admin/corporate/[id]/pppoe/generate - Get credential stats
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params

    // Verify corporate exists
    const corporate = await CorporateAccountService.getById(id)
    if (!corporate) {
      return NextResponse.json({ error: 'Corporate account not found' }, { status: 404 })
    }

    const stats = await CorporatePPPoEBulkService.getCredentialStats(id)

    return NextResponse.json({
      corporate: {
        id: corporate.id,
        corporateCode: corporate.corporateCode,
        companyName: corporate.companyName,
      },
      stats,
    })
  } catch (error) {
    apiLogger.error('Failed to get credential stats', { error })
    return NextResponse.json({ error: 'Failed to get credential stats' }, { status: 500 })
  }
}
