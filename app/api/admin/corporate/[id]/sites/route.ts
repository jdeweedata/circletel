/**
 * Corporate Sites API
 *
 * GET  /api/admin/corporate/[id]/sites - List sites for a corporate
 * POST /api/admin/corporate/[id]/sites - Create new site
 */

import { NextRequest, NextResponse } from 'next/server'
import { CorporateAccountService, CorporateSiteService } from '@/lib/corporate'
import { apiLogger } from '@/lib/logging'
import type { CorporateSiteStatus } from '@/lib/corporate'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '20', 10)
    const status = searchParams.get('status') as CorporateSiteStatus | null
    const province = searchParams.get('province')
    const search = searchParams.get('search')

    // Verify corporate exists
    const corporate = await CorporateAccountService.getById(id)
    if (!corporate) {
      return NextResponse.json({ error: 'Corporate account not found' }, { status: 404 })
    }

    const result = await CorporateSiteService.list({
      corporateId: id,
      page,
      limit,
      status: status || undefined,
      province: province || undefined,
      search: search || undefined,
    })

    return NextResponse.json({
      ...result,
      corporate: {
        id: corporate.id,
        corporateCode: corporate.corporateCode,
        companyName: corporate.companyName,
      },
    })
  } catch (error) {
    apiLogger.error('Failed to list corporate sites', { error })
    return NextResponse.json({ error: 'Failed to list corporate sites' }, { status: 500 })
  }
}

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

    // Validate required fields
    if (!body.siteName) {
      return NextResponse.json({ error: 'Site name is required' }, { status: 400 })
    }

    if (!body.installationAddress) {
      return NextResponse.json({ error: 'Installation address is required' }, { status: 400 })
    }

    if (!body.installationAddress.city) {
      return NextResponse.json({ error: 'City is required in installation address' }, { status: 400 })
    }

    const result = await CorporateSiteService.create({
      corporateId: id,
      siteName: body.siteName,
      siteCode: body.siteCode,
      siteContactName: body.siteContactName,
      siteContactEmail: body.siteContactEmail,
      siteContactPhone: body.siteContactPhone,
      installationAddress: body.installationAddress,
      province: body.province || body.installationAddress.province,
      coordinates: body.coordinates,
      packageId: body.packageId,
      monthlyFee: body.monthlyFee,
      hasRackFacility: body.hasRackFacility,
      hasAccessControl: body.hasAccessControl,
      hasAirConditioning: body.hasAirConditioning,
      hasAcPower: body.hasAcPower,
      rfiStatus: body.rfiStatus,
      rfiNotes: body.rfiNotes,
      accessType: body.accessType,
      accessInstructions: body.accessInstructions,
      landlordConsentUrl: body.landlordConsentUrl,
    })

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    apiLogger.info('Corporate site created', {
      corporateId: id,
      siteId: result.site?.id,
      accountNumber: result.site?.accountNumber,
    })

    return NextResponse.json(result.site, { status: 201 })
  } catch (error) {
    apiLogger.error('Failed to create corporate site', { error })
    return NextResponse.json({ error: 'Failed to create corporate site' }, { status: 500 })
  }
}
