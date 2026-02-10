/**
 * Individual Corporate Site API
 *
 * GET    /api/admin/corporate/[id]/sites/[siteId] - Get site details
 * PATCH  /api/admin/corporate/[id]/sites/[siteId] - Update site
 * DELETE /api/admin/corporate/[id]/sites/[siteId] - Delete site
 */

import { NextRequest, NextResponse } from 'next/server'
import { CorporateAccountService, CorporateSiteService } from '@/lib/corporate'
import { apiLogger } from '@/lib/logging'
import type { CorporateSiteStatus } from '@/lib/corporate'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string; siteId: string }> }
) {
  try {
    const { id, siteId } = await context.params

    // Verify corporate exists
    const corporate = await CorporateAccountService.getById(id)
    if (!corporate) {
      return NextResponse.json({ error: 'Corporate account not found' }, { status: 404 })
    }

    const site = await CorporateSiteService.getById(siteId)
    if (!site) {
      return NextResponse.json({ error: 'Site not found' }, { status: 404 })
    }

    // Verify site belongs to this corporate
    if (site.corporateId !== id) {
      return NextResponse.json({ error: 'Site does not belong to this corporate' }, { status: 403 })
    }

    return NextResponse.json(site)
  } catch (error) {
    apiLogger.error('Failed to get corporate site', { error })
    return NextResponse.json({ error: 'Failed to get corporate site' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string; siteId: string }> }
) {
  try {
    const { id, siteId } = await context.params
    const body = await request.json()

    // Verify corporate exists
    const corporate = await CorporateAccountService.getById(id)
    if (!corporate) {
      return NextResponse.json({ error: 'Corporate account not found' }, { status: 404 })
    }

    // Verify site exists and belongs to this corporate
    const existingSite = await CorporateSiteService.getById(siteId)
    if (!existingSite) {
      return NextResponse.json({ error: 'Site not found' }, { status: 404 })
    }
    if (existingSite.corporateId !== id) {
      return NextResponse.json({ error: 'Site does not belong to this corporate' }, { status: 403 })
    }

    // Build update payload (only include fields that were provided)
    const updateData: Record<string, unknown> = {}

    if (body.siteName !== undefined) updateData.siteName = body.siteName
    if (body.siteCode !== undefined) updateData.siteCode = body.siteCode
    if (body.siteContactName !== undefined) updateData.siteContactName = body.siteContactName
    if (body.siteContactEmail !== undefined) updateData.siteContactEmail = body.siteContactEmail
    if (body.siteContactPhone !== undefined) updateData.siteContactPhone = body.siteContactPhone
    if (body.installationAddress !== undefined) updateData.installationAddress = body.installationAddress
    if (body.province !== undefined) updateData.province = body.province
    if (body.coordinates !== undefined) updateData.coordinates = body.coordinates
    if (body.status !== undefined) updateData.status = body.status as CorporateSiteStatus
    if (body.packageId !== undefined) updateData.packageId = body.packageId
    if (body.monthlyFee !== undefined) updateData.monthlyFee = body.monthlyFee
    if (body.hasRackFacility !== undefined) updateData.hasRackFacility = body.hasRackFacility
    if (body.hasAccessControl !== undefined) updateData.hasAccessControl = body.hasAccessControl
    if (body.hasAirConditioning !== undefined) updateData.hasAirConditioning = body.hasAirConditioning
    if (body.hasAcPower !== undefined) updateData.hasAcPower = body.hasAcPower
    if (body.rfiStatus !== undefined) updateData.rfiStatus = body.rfiStatus
    if (body.rfiNotes !== undefined) updateData.rfiNotes = body.rfiNotes
    if (body.accessType !== undefined) updateData.accessType = body.accessType
    if (body.accessInstructions !== undefined) updateData.accessInstructions = body.accessInstructions
    if (body.landlordConsentUrl !== undefined) updateData.landlordConsentUrl = body.landlordConsentUrl
    if (body.installedAt !== undefined) updateData.installedAt = body.installedAt
    if (body.installedBy !== undefined) updateData.installedBy = body.installedBy
    if (body.routerSerial !== undefined) updateData.routerSerial = body.routerSerial
    if (body.routerModel !== undefined) updateData.routerModel = body.routerModel

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    const result = await CorporateSiteService.update(siteId, updateData)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    apiLogger.info('Corporate site updated', {
      corporateId: id,
      siteId,
      accountNumber: result.site?.accountNumber,
      updatedFields: Object.keys(updateData),
    })

    return NextResponse.json(result.site)
  } catch (error) {
    apiLogger.error('Failed to update corporate site', { error })
    return NextResponse.json({ error: 'Failed to update corporate site' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string; siteId: string }> }
) {
  try {
    const { id, siteId } = await context.params

    // Verify corporate exists
    const corporate = await CorporateAccountService.getById(id)
    if (!corporate) {
      return NextResponse.json({ error: 'Corporate account not found' }, { status: 404 })
    }

    // Verify site exists and belongs to this corporate
    const existingSite = await CorporateSiteService.getById(siteId)
    if (!existingSite) {
      return NextResponse.json({ error: 'Site not found' }, { status: 404 })
    }
    if (existingSite.corporateId !== id) {
      return NextResponse.json({ error: 'Site does not belong to this corporate' }, { status: 403 })
    }

    // Don't allow deletion of active sites
    if (existingSite.status === 'active') {
      return NextResponse.json(
        { error: 'Cannot delete an active site. Please decommission it first.' },
        { status: 400 }
      )
    }

    const result = await CorporateSiteService.delete(siteId)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    apiLogger.info('Corporate site deleted', {
      corporateId: id,
      siteId,
      accountNumber: existingSite.accountNumber,
    })

    return NextResponse.json({ success: true, message: 'Site deleted successfully' })
  } catch (error) {
    apiLogger.error('Failed to delete corporate site', { error })
    return NextResponse.json({ error: 'Failed to delete corporate site' }, { status: 500 })
  }
}
