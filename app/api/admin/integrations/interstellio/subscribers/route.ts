/**
 * API Route: /api/admin/integrations/interstellio/subscribers
 *
 * GET: List all Interstellio subscribers with status
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServerClient } from '@supabase/ssr'
import { getInterstellioClient } from '@/lib/interstellio'
import { apiLogger } from '@/lib/logging'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/integrations/interstellio/subscribers
 *
 * Query params:
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 20, max: 50)
 * - search: Search by username
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50)
    const search = searchParams.get('search') || ''

    // Create TWO clients for auth
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

    // Get Interstellio client
    const client = getInterstellioClient()

    // Build query params
    const queryParams: Record<string, string | number> = {
      l: limit,
      p: page,
    }

    if (search) {
      queryParams.username = `*${search}*`
    }

    // Fetch subscribers from Interstellio
    const subscribersResponse = await client.listSubscribers(queryParams)

    // Get linked customer services from our database
    const subscriberIds = subscribersResponse.payload?.map((s) => s.id) || []

    let linkedServices: Record<string, { customerId: string; serviceId: string; customerName: string }> = {}

    if (subscriberIds.length > 0) {
      const { data: services } = await supabaseAdmin
        .from('customer_services')
        .select(`
          id,
          connection_id,
          customer_id,
          customers (
            id,
            first_name,
            last_name,
            email
          )
        `)
        .in('connection_id', subscriberIds)

      if (services) {
        for (const service of services) {
          if (service.connection_id) {
            // Customers relation returns an array, take the first one
            const customersArray = service.customers as Array<{ id: string; first_name: string; last_name: string; email: string }> | undefined
            const customer = customersArray?.[0]
            linkedServices[service.connection_id] = {
              customerId: service.customer_id,
              serviceId: service.id,
              customerName: customer ? `${customer.first_name} ${customer.last_name}` : 'Unknown',
            }
          }
        }
      }
    }

    // Get status for each subscriber
    const subscribersWithStatus = await Promise.all(
      (subscribersResponse.payload || []).map(async (subscriber) => {
        let status: 'online' | 'offline' | 'disabled' = 'offline'
        let activeSessions = 0

        if (!subscriber.enabled) {
          status = 'disabled'
        } else {
          try {
            const sessions = await client.listSessions(subscriber.id, { l: 5 })
            activeSessions = sessions.payload?.length || 0
            status = activeSessions > 0 ? 'online' : 'offline'
          } catch {
            // Session fetch failed, assume offline
          }
        }

        const linked = linkedServices[subscriber.id]

        return {
          id: subscriber.id,
          username: subscriber.username,
          name: subscriber.name,
          enabled: subscriber.enabled,
          status,
          activeSessions,
          profileId: subscriber.profile_id,
          profileName: subscriber.profile || 'Unknown',
          lastSeen: subscriber.last_seen,
          createdAt: subscriber.creation_time,
          uncappedData: subscriber.uncapped_data,
          // Linked CircleTel data
          linkedCustomerId: linked?.customerId || null,
          linkedServiceId: linked?.serviceId || null,
          linkedCustomerName: linked?.customerName || null,
        }
      })
    )

    return NextResponse.json({
      subscribers: subscribersWithStatus,
      pagination: {
        page,
        limit,
        total: subscribersResponse.metadata?.records || 0,
        totalPages: subscribersResponse.metadata?.pages || 1,
      },
    })
  } catch (error) {
    apiLogger.error('Interstellio subscribers error:', error)

    if (error instanceof Error && 'status' in error) {
      const apiError = error as Error & { status: number }
      if (apiError.status === 401) {
        return NextResponse.json(
          { error: 'Interstellio authentication failed', code: 'INTERSTELLIO_AUTH_ERROR' },
          { status: 502 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Failed to fetch subscribers', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
