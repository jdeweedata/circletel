/**
 * API Route: /api/admin/pppoe/credentials/[id]/reveal
 *
 * POST: Reveal PPPoE password (audit logged)
 */

import { NextRequest, NextResponse } from 'next/server'
import { authenticateAdmin } from '@/lib/auth/admin-api-auth'
import { PPPoECredentialService } from '@/lib/pppoe'

export const dynamic = 'force-dynamic'

/**
 * POST /api/admin/pppoe/credentials/[id]/reveal
 *
 * Reveals the decrypted password (logged to audit table)
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await authenticateAdmin(request)
    if (!authResult.success) {
      return authResult.response
    }

    const { id } = await context.params
    const { user } = authResult

    // Get request context for audit
    const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0] ||
      request.headers.get('x-real-ip') ||
      undefined
    const userAgent = request.headers.get('user-agent') || undefined

    // Reveal password
    const result = await PPPoECredentialService.revealPassword(
      id,
      user.id,
      'admin',
      ipAddress,
      userAgent
    )

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 404 })
    }

    return NextResponse.json({
      password: result.password,
      expiresIn: 30, // Hint to frontend: auto-hide after 30 seconds
    })
  } catch (error) {
    console.error('PPPoE password reveal error:', error)
    return NextResponse.json(
      { error: 'Failed to reveal password', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
