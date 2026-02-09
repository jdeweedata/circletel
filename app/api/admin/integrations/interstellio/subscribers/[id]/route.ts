/**
 * API Route: /api/admin/integrations/interstellio/subscribers/[id]
 *
 * GET: Get detailed subscriber information
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServerClient } from '@supabase/ssr'
import { getInterstellioClient } from '@/lib/interstellio'
import { apiLogger } from '@/lib/logging'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/integrations/interstellio/subscribers/[id]
 *
 * Returns detailed subscriber info including:
 * - Basic subscriber data
 * - Profile (speed tier) details
 * - Current status
 * - Credit status (if capped)
 * - Linked CircleTel customer/service
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: subscriberId } = await context.params

    // Create auth clients
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

    // Fetch subscriber details
    const subscriber = await client.getSubscriber(subscriberId)

    // Fetch additional data in parallel
    const [status, profile, sessions, creditStatus] = await Promise.all([
      client.getSubscriberStatus(subscriberId).catch(() => null),
      subscriber.profile_id ? client.getProfile(subscriber.profile_id).catch(() => null) : null,
      client.listSessions(subscriberId, { l: 10 }).catch(() => ({ payload: [] })),
      !subscriber.uncapped_data ? client.getCreditStatus(subscriberId).catch(() => null) : null,
    ])

    // Check if linked to CircleTel customer
    const { data: linkedService } = await supabaseAdmin
      .from('customer_services')
      .select(`
        id,
        customer_id,
        package_name,
        status,
        customers (
          id,
          first_name,
          last_name,
          email,
          account_number
        )
      `)
      .eq('connection_id', subscriberId)
      .single()

    // Customers relation returns an array, take the first one
    const customersArray = linkedService?.customers as Array<{
      id: string
      first_name: string
      last_name: string
      email: string
      account_number: string
    }> | undefined
    const customer = customersArray?.[0] ?? null

    return NextResponse.json({
      subscriber: {
        id: subscriber.id,
        username: subscriber.username,
        name: subscriber.name,
        enabled: subscriber.enabled,
        createdAt: subscriber.creation_time,
        lastSeen: subscriber.last_seen,
        uncappedData: subscriber.uncapped_data,
        virtualId: subscriber.virtual_id,
        serviceId: subscriber.service_id,
        profileId: subscriber.profile_id,
        staticIp: subscriber.static_ip4,
        callingStationId: subscriber.calling_station_id,
      },
      status: status ? {
        active: status.active,
        uploadGb: parseFloat(status.upload) || 0,
        downloadGb: parseFloat(status.download) || 0,
        messages: status.messages,
      } : null,
      profile: profile ? {
        id: profile.id,
        name: profile.name,
        downloadMbps: parseFloat(profile.download) || 0,
        uploadMbps: parseFloat(profile.upload) || 0,
        uncappedData: profile.uncapped_data,
        sessionLimit: profile.session_limit,
      } : null,
      activeSessions: sessions.payload?.length || 0,
      creditStatus: creditStatus ? {
        totalGb: creditStatus.total_gb,
        usedGb: creditStatus.used_gb,
        remainingGb: creditStatus.remaining_gb,
        isCapped: creditStatus.is_capped,
      } : null,
      linkedService: linkedService ? {
        serviceId: linkedService.id,
        customerId: linkedService.customer_id,
        packageName: linkedService.package_name,
        serviceStatus: linkedService.status,
        customerName: customer ? `${customer.first_name} ${customer.last_name}` : null,
        customerEmail: customer?.email || null,
        accountNumber: customer?.account_number || null,
      } : null,
    })
  } catch (error) {
    apiLogger.error('Interstellio subscriber detail error:', error)

    if (error instanceof Error && 'status' in error) {
      const apiError = error as Error & { status: number }
      if (apiError.status === 404) {
        return NextResponse.json({ error: 'Subscriber not found' }, { status: 404 })
      }
      if (apiError.status === 401) {
        return NextResponse.json(
          { error: 'Interstellio authentication failed', code: 'INTERSTELLIO_AUTH_ERROR' },
          { status: 502 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Failed to fetch subscriber', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
