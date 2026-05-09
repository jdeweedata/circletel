/**
 * API Route: /api/admin/pppoe/credentials/[id]/regenerate
 *
 * POST: Regenerate PPPoE password
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { authenticateAdmin } from '@/lib/auth/admin-api-auth'
import { PPPoECredentialService } from '@/lib/pppoe'

export const dynamic = 'force-dynamic'

/**
 * POST /api/admin/pppoe/credentials/[id]/regenerate
 *
 * Generates a new password for the credential
 * NOTE: If provisioned to Interstellio, subscriber will need re-provisioning
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
    const supabaseAdmin = await createClient()

    // Get request context for audit
    const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0] ||
      request.headers.get('x-real-ip') ||
      undefined

    // Regenerate password
    const result = await PPPoECredentialService.regeneratePassword(id, user.id, ipAddress)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    // Get updated credential
    const credential = await PPPoECredentialService.getById(id)

    return NextResponse.json({
      credential,
      password: result.password, // Return new password for display
      message: 'Password regenerated successfully',
      warning: credential?.interstellioSubscriberId
        ? 'Subscriber needs re-provisioning in Interstellio'
        : undefined,
    })
  } catch (error) {
    console.error('PPPoE password regenerate error:', error)
    return NextResponse.json(
      { error: 'Failed to regenerate password', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
