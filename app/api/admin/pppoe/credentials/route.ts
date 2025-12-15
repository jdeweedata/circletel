/**
 * API Route: /api/admin/pppoe/credentials
 *
 * GET: List all PPPoE credentials with pagination and filters
 * POST: Create new PPPoE credentials for a service
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServerClient } from '@supabase/ssr'
import { PPPoECredentialService } from '@/lib/pppoe'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/pppoe/credentials
 *
 * Query params:
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 20, max: 50)
 * - status: Filter by provisioning status
 * - search: Search by username
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50)
    const status = searchParams.get('status') || undefined
    const search = searchParams.get('search') || undefined

    // Create auth client
    const supabaseSSR = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll() {},
        },
      }
    )

    const supabaseAdmin = await createClient()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabaseSSR.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify admin user
    const { data: adminUser, error: adminError } = await supabaseAdmin
      .from('admin_users')
      .select('id, is_active')
      .eq('id', user.id)
      .eq('is_active', true)
      .single()

    if (adminError || !adminUser) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 })
    }

    // List credentials
    const result = await PPPoECredentialService.list({
      page,
      limit,
      status,
      search,
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('PPPoE credentials list error:', error)
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
    const body = await request.json()
    const { customerId, serviceId, accountNumber, profileId, sendNotifications } = body

    // Validate required fields
    if (!customerId || !serviceId || !accountNumber) {
      return NextResponse.json(
        { error: 'Missing required fields: customerId, serviceId, accountNumber' },
        { status: 400 }
      )
    }

    // Create auth client
    const supabaseSSR = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll() {},
        },
      }
    )

    const supabaseAdmin = await createClient()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabaseSSR.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify admin user
    const { data: adminUser, error: adminError } = await supabaseAdmin
      .from('admin_users')
      .select('id, is_active')
      .eq('id', user.id)
      .eq('is_active', true)
      .single()

    if (adminError || !adminUser) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 })
    }

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
    console.error('PPPoE credentials create error:', error)
    return NextResponse.json(
      { error: 'Failed to create credentials', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
