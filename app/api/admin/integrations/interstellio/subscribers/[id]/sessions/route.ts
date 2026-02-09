/**
 * API Route: /api/admin/integrations/interstellio/subscribers/[id]/sessions
 *
 * GET: List active sessions for subscriber
 * DELETE: Disconnect all sessions for subscriber
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServerClient } from '@supabase/ssr'
import { getInterstellioClient } from '@/lib/interstellio'
import { apiLogger } from '@/lib/logging'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/integrations/interstellio/subscribers/[id]/sessions
 *
 * Returns list of active sessions for the subscriber
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: subscriberId } = await context.params

    // Auth
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

    const {
      data: { user },
      error: authError,
    } = await supabaseSSR.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: adminUser, error: adminError } = await supabaseAdmin
      .from('admin_users')
      .select('id, is_active')
      .eq('id', user.id)
      .eq('is_active', true)
      .single()

    if (adminError || !adminUser) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 })
    }

    // Get sessions from Interstellio
    const client = getInterstellioClient()
    const sessionsResponse = await client.listSessions(subscriberId, { l: 50 })

    // Calculate duration for each session
    const sessions = (sessionsResponse.payload || []).map((session) => {
      const startTime = new Date(session.start_time)
      const now = new Date()
      const durationMs = now.getTime() - startTime.getTime()
      const durationMinutes = Math.floor(durationMs / 1000 / 60)
      const hours = Math.floor(durationMinutes / 60)
      const minutes = durationMinutes % 60

      return {
        id: session.id,
        subscriberId: session.subscriber_id,
        username: session.username,
        realm: session.realm,
        framedIpAddress: session.framed_ip_address,
        callingStationId: session.calling_station_id, // MAC address
        startTime: session.start_time,
        updatedTime: session.updated_time,
        nasIpAddress: session.nas_ip_address,
        nasPort: session.nas_port,
        duration: {
          hours,
          minutes,
          formatted: hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`,
        },
      }
    })

    return NextResponse.json({
      sessions,
      count: sessions.length,
    })
  } catch (error) {
    apiLogger.error('Interstellio sessions error:', error)

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
      { error: 'Failed to fetch sessions', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/admin/integrations/interstellio/subscribers/[id]/sessions
 *
 * Disconnect all active sessions for the subscriber
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: subscriberId } = await context.params

    // Auth
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

    const {
      data: { user },
      error: authError,
    } = await supabaseSSR.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: adminUser, error: adminError } = await supabaseAdmin
      .from('admin_users')
      .select('id, is_active, email')
      .eq('id', user.id)
      .eq('is_active', true)
      .single()

    if (adminError || !adminUser) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 })
    }

    // Disconnect all sessions
    const client = getInterstellioClient()
    await client.disconnectAllSessions(subscriberId)

    // Log the action
    apiLogger.info(`[Interstellio] Admin ${adminUser.email} disconnected all sessions for subscriber ${subscriberId}`)

    return NextResponse.json({
      success: true,
      message: 'All sessions disconnected',
      subscriberId,
      disconnectedBy: adminUser.email,
      disconnectedAt: new Date().toISOString(),
    })
  } catch (error) {
    apiLogger.error('Interstellio disconnect all error:', error)

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
      { error: 'Failed to disconnect sessions', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
