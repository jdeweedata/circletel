/**
 * Corporate Sites Bulk Import API
 *
 * POST /api/admin/corporate/[id]/sites/bulk - Bulk import sites from CSV data
 */

import { NextRequest, NextResponse } from 'next/server'
import { CorporateAccountService, CorporateSiteService } from '@/lib/corporate'
import { apiLogger } from '@/lib/logging'
import type { BulkImportSiteRow } from '@/lib/corporate'

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

    // Validate request body
    if (!body.rows || !Array.isArray(body.rows)) {
      return NextResponse.json(
        { error: 'Request body must contain a "rows" array' },
        { status: 400 }
      )
    }

    if (body.rows.length === 0) {
      return NextResponse.json({ error: 'No rows provided for import' }, { status: 400 })
    }

    if (body.rows.length > 500) {
      return NextResponse.json(
        { error: 'Maximum 500 rows allowed per import' },
        { status: 400 }
      )
    }

    // Map incoming data to BulkImportSiteRow format
    const rows: BulkImportSiteRow[] = body.rows.map((row: Record<string, unknown>) => ({
      siteName: String(row.siteName || row.site_name || ''),
      siteCode: row.siteCode || row.site_code ? String(row.siteCode || row.site_code) : undefined,
      siteContactName: row.siteContactName || row.contact_name
        ? String(row.siteContactName || row.contact_name)
        : undefined,
      siteContactPhone: row.siteContactPhone || row.contact_phone
        ? String(row.siteContactPhone || row.contact_phone)
        : undefined,
      street: row.street ? String(row.street) : undefined,
      city: String(row.city || ''),
      province: String(row.province || ''),
      postalCode: row.postalCode || row.postal_code
        ? String(row.postalCode || row.postal_code)
        : undefined,
      monthlyFee: row.monthlyFee || row.monthly_fee
        ? Number(row.monthlyFee || row.monthly_fee)
        : undefined,
    }))

    const result = await CorporateSiteService.bulkImport(id, rows)

    apiLogger.info('Corporate sites bulk import completed', {
      corporateId: id,
      totalRows: result.totalRows,
      successCount: result.successCount,
      failedCount: result.failedCount,
    })

    return NextResponse.json({
      success: result.success,
      summary: {
        totalRows: result.totalRows,
        successCount: result.successCount,
        failedCount: result.failedCount,
      },
      errors: result.errors,
      sites: result.sites,
    })
  } catch (error) {
    apiLogger.error('Failed to bulk import corporate sites', { error })
    return NextResponse.json({ error: 'Failed to bulk import sites' }, { status: 500 })
  }
}
