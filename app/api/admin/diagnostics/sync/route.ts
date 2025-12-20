/**
 * Admin Diagnostics Sync API
 *
 * POST /api/admin/diagnostics/sync
 *
 * Syncs all Interstellio subscribers to the diagnostics system.
 * Creates diagnostics records for any subscribers not yet tracked.
 *
 * @version 1.0
 * @created 2025-12-20
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getInterstellioClient } from '@/lib/interstellio'

/**
 * POST /api/admin/diagnostics/sync
 *
 * Sync Interstellio subscribers to CircleTel diagnostics
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createClient()
    const client = getInterstellioClient()

    console.log('[Diagnostics Sync] Starting sync...')

    // Get all subscribers from Interstellio
    let allSubscribers: Array<{
      id: string
      username: string
      enabled: boolean
      profile_id?: string
    }> = []

    let page = 1
    const perPage = 100

    while (true) {
      console.log(`[Diagnostics Sync] Fetching page ${page}...`)
      const response = await client.listSubscribers({ page, per_page: perPage })
      const subscribers = response.payload || []

      if (subscribers.length === 0) break

      allSubscribers = [...allSubscribers, ...subscribers]

      if (subscribers.length < perPage) break
      page++
    }

    console.log(`[Diagnostics Sync] Found ${allSubscribers.length} subscribers in Interstellio`)

    // Get existing customer_services with connection_ids
    const { data: existingServices } = await supabase
      .from('customer_services')
      .select('id, connection_id, customer_id, package_name, status')
      .not('connection_id', 'is', null)

    const linkedConnectionIds = new Set((existingServices || []).map((s) => s.connection_id))

    // Get existing diagnostics records
    const { data: existingDiagnostics } = await supabase
      .from('subscriber_diagnostics')
      .select('interstellio_subscriber_id')

    const existingDiagnosticsIds = new Set(
      (existingDiagnostics || []).map((d) => d.interstellio_subscriber_id)
    )

    // Find unlinked subscribers (in Interstellio but not in customer_services)
    const unlinkedSubscribers = allSubscribers.filter(
      (s) => !linkedConnectionIds.has(s.id)
    )

    // Find subscribers that need diagnostics records
    const needsDiagnostics = allSubscribers.filter(
      (s) => linkedConnectionIds.has(s.id) && !existingDiagnosticsIds.has(s.id)
    )

    // Create diagnostics records for linked services that don't have them
    let created = 0
    for (const sub of needsDiagnostics) {
      const service = existingServices?.find((s) => s.connection_id === sub.id)
      if (service) {
        const { error } = await supabase.from('subscriber_diagnostics').upsert(
          {
            customer_service_id: service.id,
            interstellio_subscriber_id: sub.id,
            health_status: 'unknown',
            health_score: 100,
            is_session_active: false,
          },
          { onConflict: 'customer_service_id' }
        )

        if (!error) created++
      }
    }

    const result = {
      total_in_interstellio: allSubscribers.length,
      linked_in_circletel: linkedConnectionIds.size,
      unlinked_subscribers: unlinkedSubscribers.map((s) => ({
        id: s.id,
        username: s.username,
        enabled: s.enabled,
      })),
      diagnostics_created: created,
      message:
        unlinkedSubscribers.length > 0
          ? `Found ${unlinkedSubscribers.length} Interstellio subscribers not linked to CircleTel customer services. These need to be manually linked by setting connection_id on the customer_service record.`
          : 'All Interstellio subscribers are linked to CircleTel customer services.',
    }

    console.log('[Diagnostics Sync] Complete:', result)

    return NextResponse.json(result)
  } catch (error) {
    console.error('[Diagnostics Sync] Error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
        details: 'Failed to sync Interstellio subscribers',
      },
      { status: 500 }
    )
  }
}

// Configure runtime
export const runtime = 'nodejs'
export const maxDuration = 60
