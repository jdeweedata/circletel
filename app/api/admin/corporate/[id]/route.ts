/**
 * Corporate Account Detail API
 *
 * GET   /api/admin/corporate/[id] - Get corporate account details
 * PATCH /api/admin/corporate/[id] - Update corporate account
 */

import { NextRequest, NextResponse } from 'next/server'
import { CorporateAccountService } from '@/lib/corporate'
import { apiLogger } from '@/lib/logging'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const account = await CorporateAccountService.getById(id)

    if (!account) {
      return NextResponse.json({ error: 'Corporate account not found' }, { status: 404 })
    }

    return NextResponse.json(account)
  } catch (error) {
    apiLogger.error('Failed to get corporate account', { error })
    return NextResponse.json({ error: 'Failed to get corporate account' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const body = await request.json()

    // Verify account exists
    const existing = await CorporateAccountService.getById(id)
    if (!existing) {
      return NextResponse.json({ error: 'Corporate account not found' }, { status: 404 })
    }

    // Validate email format if provided
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (body.primaryContactEmail && !emailRegex.test(body.primaryContactEmail)) {
      return NextResponse.json({ error: 'Invalid primary contact email format' }, { status: 400 })
    }
    if (body.billingContactEmail && !emailRegex.test(body.billingContactEmail)) {
      return NextResponse.json({ error: 'Invalid billing contact email format' }, { status: 400 })
    }
    if (body.technicalContactEmail && !emailRegex.test(body.technicalContactEmail)) {
      return NextResponse.json({ error: 'Invalid technical contact email format' }, { status: 400 })
    }

    const result = await CorporateAccountService.update(id, {
      companyName: body.companyName,
      tradingName: body.tradingName,
      registrationNumber: body.registrationNumber,
      vatNumber: body.vatNumber,
      primaryContactName: body.primaryContactName,
      primaryContactEmail: body.primaryContactEmail,
      primaryContactPhone: body.primaryContactPhone,
      primaryContactPosition: body.primaryContactPosition,
      billingContactName: body.billingContactName,
      billingContactEmail: body.billingContactEmail,
      billingContactPhone: body.billingContactPhone,
      technicalContactName: body.technicalContactName,
      technicalContactEmail: body.technicalContactEmail,
      technicalContactPhone: body.technicalContactPhone,
      physicalAddress: body.physicalAddress,
      postalAddress: body.postalAddress,
      accountStatus: body.accountStatus,
      creditLimit: body.creditLimit,
      paymentTerms: body.paymentTerms,
      billingCycle: body.billingCycle,
      contractStartDate: body.contractStartDate,
      contractEndDate: body.contractEndDate,
      contractValue: body.contractValue,
      expectedSites: body.expectedSites,
      industry: body.industry,
      notes: body.notes,
    })

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    apiLogger.info('Corporate account updated', {
      corporateId: id,
      corporateCode: result.account?.corporateCode,
    })

    return NextResponse.json(result.account)
  } catch (error) {
    apiLogger.error('Failed to update corporate account', { error })
    return NextResponse.json({ error: 'Failed to update corporate account' }, { status: 500 })
  }
}
