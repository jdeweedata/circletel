/**
 * Corporate PPPoE Credential Export API
 *
 * GET /api/admin/corporate/[id]/pppoe/export - Export credentials as CSV
 */

import { NextRequest, NextResponse } from 'next/server'
import { CorporateAccountService, CorporatePPPoEBulkService } from '@/lib/corporate'
import { apiLogger } from '@/lib/logging'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const searchParams = request.nextUrl.searchParams
    const format = searchParams.get('format') || 'csv'

    // Verify corporate exists
    const corporate = await CorporateAccountService.getById(id)
    if (!corporate) {
      return NextResponse.json({ error: 'Corporate account not found' }, { status: 404 })
    }

    // Get requestor info from headers (set by auth middleware)
    const requestedBy = request.headers.get('x-admin-user-id') || 'unknown'
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip')

    const result = await CorporatePPPoEBulkService.exportCredentials(
      id,
      requestedBy,
      ipAddress || undefined
    )

    if (!result.success || !result.data) {
      return NextResponse.json({ error: result.error || 'Export failed' }, { status: 500 })
    }

    apiLogger.info('PPPoE credentials exported', {
      corporateId: id,
      corporateCode: corporate.corporateCode,
      siteCount: result.data.length,
      requestedBy,
    })

    if (format === 'json') {
      return NextResponse.json({
        corporate: {
          id: corporate.id,
          corporateCode: corporate.corporateCode,
          companyName: corporate.companyName,
        },
        credentials: result.data,
        exportedAt: new Date().toISOString(),
      })
    }

    // Default: CSV format
    const headers = [
      'Site Name',
      'Account Number',
      'PPPoE Username',
      'Password',
      'Address',
      'Province',
      'Status',
    ]

    const csvRows = [
      headers.join(','),
      ...result.data.map((row) =>
        [
          `"${row.siteName.replace(/"/g, '""')}"`,
          row.accountNumber,
          row.pppoeUsername,
          row.password,
          `"${row.address.replace(/"/g, '""')}"`,
          row.province,
          row.status,
        ].join(',')
      ),
    ]

    const csvContent = csvRows.join('\n')
    const filename = `${corporate.corporateCode}_credentials_${new Date().toISOString().split('T')[0]}.csv`

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    apiLogger.error('Failed to export PPPoE credentials', { error })
    return NextResponse.json({ error: 'Failed to export credentials' }, { status: 500 })
  }
}
