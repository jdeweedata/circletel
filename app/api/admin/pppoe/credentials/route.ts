/**
 * API Route: /api/admin/pppoe/credentials
 *
 * GET: PiListBold all PPPoE credentials with pagination and filters
 * POST: Create new PPPoE credentials for a service
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { authenticateAdmin } from '@/lib/auth/admin-api-auth'
import { PPPoECredentialService } from '@/lib/pppoe'
import { apiLogger } from '@/lib/logging/logger'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/pppoe/credentials
 *
 * Query params:
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 20, max: 50)
 * - status: PiFunnelBold by provisioning status
 * - search: PiMagnifyingGlassBold by username
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateAdmin(request)
    if (!authResult.success) {
      return authResult.response
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50)
    const status = searchParams.get('status') || undefined
    const search = searchParams.get('search') || undefined

    const supabaseAdmin = await createClient()

    // List credentials
    const result = await PPPoECredentialService.list({
      page,
      limit,
      status,
      search,
    })

    return NextResponse.json(result)
  } catch (error) {
    apiLogger.error('PPPoE credentials list error', { error })
    return NextResponse.json(
      { error: 'Failed to fetch credentials', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/pppoe/credentials
 *
 * Body:
 * - customerId: UUID (required)
 * - serviceId: UUID (required)
 * - accountNumber: string (required) - e.g., "CT-2025-00001"
 * - profileId: string (optional) - Interstellio profile ID
 * - sendNotifications: { sms?: boolean, email?: boolean } (optional)
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticateAdmin(request)
    if (!authResult.success) {
      return authResult.response
    }

    const body = await request.json()
    const { customerId, serviceId, accountNumber, profileId, sendNotifications } = body

    // Validate required fields
    if (!customerId || !serviceId || !accountNumber) {
      return NextResponse.json(
        { error: 'Missing required fields: customerId, serviceId, accountNumber' },
        { status: 400 }
      )
    }

    const { user } = authResult
    const supabaseAdmin = await createClient()

    // Create credentials
    const result = await PPPoECredentialService.create({
      customerId,
      serviceId,
      accountNumber,
      profileId: profileId || process.env.INTERSTELLIO_DEFAULT_PROFILE_ID || '',
      createdBy: user.id,
      sendNotifications,
    })

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({
      credential: result.credential,
      password: result.password, // Only returned on creation
      message: 'PPPoE credentials created successfully',
    })
  } catch (error) {
    apiLogger.error('PPPoE credentials create error', { error })
    return NextResponse.json(
      { error: 'Failed to create credentials', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
