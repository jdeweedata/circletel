/**
 * Corporate Accounts API
 *
 * GET  /api/admin/corporate - List corporate accounts
 * POST /api/admin/corporate - Create new corporate account
 */

import { NextRequest, NextResponse } from 'next/server'
import { CorporateAccountService } from '@/lib/corporate'
import { apiLogger } from '@/lib/logging'
import type { CorporateAccountStatus } from '@/lib/corporate'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '20', 10)
    const status = searchParams.get('status') as CorporateAccountStatus | null
    const search = searchParams.get('search')
    const industry = searchParams.get('industry')

    const result = await CorporateAccountService.list({
      page,
      limit,
      status: status || undefined,
      search: search || undefined,
      industry: industry || undefined,
    })

    return NextResponse.json(result)
  } catch (error) {
    apiLogger.error('Failed to list corporate accounts', { error })
    return NextResponse.json({ error: 'Failed to list corporate accounts' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate required fields
    const required = ['corporateCode', 'companyName', 'primaryContactName', 'primaryContactEmail']
    for (const field of required) {
      if (!body[field]) {
        return NextResponse.json({ error: `${field} is required` }, { status: 400 })
      }
    }

    // Validate corporate code format
    if (!/^[A-Za-z0-9]+$/.test(body.corporateCode)) {
      return NextResponse.json(
        { error: 'Corporate code must be alphanumeric characters only' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(body.primaryContactEmail)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
    }

    const result = await CorporateAccountService.create({
      corporateCode: body.corporateCode,
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
      creditLimit: body.creditLimit,
      paymentTerms: body.paymentTerms,
      billingCycle: body.billingCycle,
      contractStartDate: body.contractStartDate,
      contractEndDate: body.contractEndDate,
      contractValue: body.contractValue,
      expectedSites: body.expectedSites,
      industry: body.industry,
      notes: body.notes,
      createdBy: body.createdBy,
    })

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    apiLogger.info('Corporate account created', {
      corporateId: result.account?.id,
      corporateCode: result.account?.corporateCode,
    })

    return NextResponse.json(result.account, { status: 201 })
  } catch (error) {
    apiLogger.error('Failed to create corporate account', { error })
    return NextResponse.json({ error: 'Failed to create corporate account' }, { status: 500 })
  }
}
