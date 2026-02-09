/**
 * API Route: /api/admin/integrations/interstellio
 *
 * GET: Get Interstellio dashboard overview data
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServerClient } from '@supabase/ssr'
import { getInterstellioClient } from '@/lib/interstellio'
import { apiLogger } from '@/lib/logging'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/integrations/interstellio
 *
 * Returns dashboard summary including:
 * - Total/active/inactive subscribers
 * - Active sessions count
 * - Total usage (upload/download)
 * - Health status
 */
export async function GET(request: NextRequest) {
  try {
    // Create TWO clients:
    // 1. SSR client for authentication (reads cookies)
    const supabaseSSR = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll() {
            // No-op for GET requests
          },
        },
      }
    )

    // 2. Service role client for database queries (bypasses RLS)
    const supabaseAdmin = await createClient()

    // Check authentication using SSR client
    const {
      data: { user },
      error: authError,
    } = await supabaseSSR.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify admin user using service role client (bypasses RLS)
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

    // Fetch data from Interstellio API
    const [subscriberCount, subscribersResponse] = await Promise.all([
      client.getSubscriberCount().catch(() => ({ active: 0, inactive: 0, total: 0 })),
      client.listSubscribers({ l: 50 }).catch(() => ({ payload: [], metadata: { records: 0 } })),
    ])

    // Count active sessions across all subscribers
    let activeSessions = 0
    let totalUploadKb = 0
    let totalDownloadKb = 0

    // Get sessions for each subscriber (limited to first 10 for performance)
    const subscribersWithSessions = subscribersResponse.payload?.slice(0, 10) || []

    for (const subscriber of subscribersWithSessions) {
      try {
        const sessions = await client.listSessions(subscriber.id, { l: 50 })
        activeSessions += sessions.payload?.length || 0
      } catch {
        // Subscriber may not have sessions
      }

      // Get recent usage (last 24 hours)
      try {
        const now = new Date()
        const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)
        const usage = await client.getSubscriberUsage(subscriber.id, 'hourly', {
          start: yesterday.toISOString(),
          end: now.toISOString(),
        })
        for (const entry of usage) {
          totalUploadKb += entry.upload_kb || 0
          totalDownloadKb += entry.download_kb || 0
        }
      } catch {
        // Usage may not be available
      }
    }

    // Get linked customer services count from our database
    const { count: linkedServicesCount } = await supabaseAdmin
      .from('customer_services')
      .select('id', { count: 'exact', head: true })
      .not('connection_id', 'is', null)

    // Determine health status
    let healthStatus: 'healthy' | 'degraded' | 'down' = 'healthy'
    if (subscriberCount.total === 0 && subscribersResponse.metadata?.records === 0) {
      healthStatus = 'degraded'
    }

    return NextResponse.json({
      summary: {
        totalSubscribers: subscriberCount.total || subscribersResponse.metadata?.records || 0,
        activeSubscribers: subscriberCount.active || 0,
        inactiveSubscribers: subscriberCount.inactive || 0,
        activeSessions,
        totalUsage: {
          uploadGb: Math.round((totalUploadKb / 1024 / 1024) * 100) / 100,
          downloadGb: Math.round((totalDownloadKb / 1024 / 1024) * 100) / 100,
        },
      },
      linkedServices: linkedServicesCount || 0,
      healthStatus,
      lastCheckedAt: new Date().toISOString(),
    })
  } catch (error) {
    apiLogger.error('Interstellio dashboard error:', error)

    // Check if it's an Interstellio API error
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
      { error: 'Failed to fetch Interstellio data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
