/**
 * API Route: /api/admin/integrations/interstellio/subscribers/[id]/sessions
 *
 * GET: PiListBold active sessions for subscriber
 * DELETE: Disconnect all sessions for subscriber
 */

import { NextRequest, NextResponse } from 'next/server'
import { authenticateAdmin } from '@/lib/auth/admin-api-auth'
import { createClient } from '@/lib/supabase/server'
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
    // Authenticate admin
    const authResult = await authenticateAdmin(request);
    if (!authResult.success) {
      return authResult.response;
    }

    const { id: subscriberId } = await context.params

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
    apiLogger.error('Interstellio sessions error', { error: error instanceof Error ? error.message : String(error) })

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
    // Authenticate admin
    const authResult = await authenticateAdmin(request);
    if (!authResult.success) {
      return authResult.response;
    }

    const { id: subscriberId } = await context.params

    // Disconnect all sessions
    const client = getInterstellioClient()
    await client.disconnectAllSessions(subscriberId)

    // Log the action
    apiLogger.info(`[Interstellio] Admin ${authResult.user.email} disconnected all sessions for subscriber ${subscriberId}`)

    return NextResponse.json({
      success: true,
      message: 'All sessions disconnected',
      subscriberId,
      disconnectedBy: authResult.user.email,
      disconnectedAt: new Date().toISOString(),
    })
  } catch (error) {
    apiLogger.error('Interstellio disconnect all error', { error: error instanceof Error ? error.message : String(error) })

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
