/**
 * API Route: /api/admin/integrations/interstellio/sessions/[sessionId]
 *
 * DELETE: Disconnect a specific session
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServerClient } from '@supabase/ssr'
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
    const { sessionId } = await context.params

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
    apiLogger.info(`[Interstellio] Admin ${adminUser.email} disconnected session ${sessionId}${sessionInfo ? ` (user: ${sessionInfo.username}, IP: ${sessionInfo.framed_ip_address})` : ''}`)

    return NextResponse.json({
      success: true,
      message: 'Session disconnected',
      sessionId,
      sessionInfo: sessionInfo ? {
        username: sessionInfo.username,
        framedIpAddress: sessionInfo.framed_ip_address,
        callingStationId: sessionInfo.calling_station_id,
      } : null,
      disconnectedBy: adminUser.email,
      disconnectedAt: new Date().toISOString(),
    })
  } catch (error) {
    apiLogger.error('Interstellio disconnect session error:', error)

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
