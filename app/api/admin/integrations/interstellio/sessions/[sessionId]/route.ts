/**
 * API Route: /api/admin/integrations/interstellio/sessions/[sessionId]
 *
 * DELETE: Disconnect a specific session
 */

import { NextRequest, NextResponse } from 'next/server'
import { authenticateAdmin } from '@/lib/auth/admin-api-auth'
import { createClient } from '@/lib/supabase/server'
import { getInterstellioClient } from '@/lib/interstellio'
import { apiLogger } from '@/lib/logging'

export const dynamic = 'force-dynamic'

/**
 * DELETE /api/admin/integrations/interstellio/sessions/[sessionId]
 *
 * Disconnect a specific session by ID
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ sessionId: string }> }
) {
  try {
    // Authenticate admin
    const authResult = await authenticateAdmin(request);
    if (!authResult.success) {
      return authResult.response;
    }

    const { sessionId } = await context.params

    const supabaseAdmin = await createClient()

    // Get session details first (optional, for logging)
    const client = getInterstellioClient()

    let sessionInfo = null
    try {
      sessionInfo = await client.getSession(sessionId)
    } catch {
      // Session might not be found, continue with disconnect anyway
    }

    // Disconnect the session
    await client.disconnectSession(sessionId)

    // Log the action
    apiLogger.info(`[Interstellio] Admin ${authResult.adminUser.email} disconnected session ${sessionId}${sessionInfo ? ` (user: ${sessionInfo.username}, IP: ${sessionInfo.framed_ip_address})` : ''}`)

    return NextResponse.json({
      success: true,
      message: 'Session disconnected',
      sessionId,
      sessionInfo: sessionInfo ? {
        username: sessionInfo.username,
        framedIpAddress: sessionInfo.framed_ip_address,
        callingStationId: sessionInfo.calling_station_id,
      } : null,
      disconnectedBy: authResult.adminUser.email,
      disconnectedAt: new Date().toISOString(),
    })
  } catch (error) {
    apiLogger.error('Interstellio disconnect session error', { error: error instanceof Error ? error.message : String(error) })

    if (error instanceof Error && 'status' in error) {
      const apiError = error as Error & { status: number }
      if (apiError.status === 404) {
        return NextResponse.json({ error: 'Session not found' }, { status: 404 })
      }
      if (apiError.status === 401) {
        return NextResponse.json(
          { error: 'Interstellio authentication failed', code: 'INTERSTELLIO_AUTH_ERROR' },
          { status: 502 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Failed to disconnect session', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
