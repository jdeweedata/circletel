/**
 * API Route: /api/admin/pppoe/credentials/[id]
 *
 * GET: Get PPPoE credential details
 * DELETE: Delete PPPoE credentials
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { authenticateAdmin } from '@/lib/auth/admin-api-auth'
import { PPPoECredentialService } from '@/lib/pppoe'
import { apiLogger } from '@/lib/logging/logger'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/pppoe/credentials/[id]
 *
 * Returns detailed credential info including customer and service data
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await authenticateAdmin(request)
    if (!authResult.success) {
      return authResult.response
    }

    const { id } = await context.params
    const supabaseAdmin = await createClient()

    // Get credential details
    const credential = await PPPoECredentialService.getByIdWithDetails(id)

    if (!credential) {
      return NextResponse.json({ error: 'Credential not found' }, { status: 404 })
    }

    return NextResponse.json({ credential })
  } catch (error) {
    apiLogger.error('PPPoE credential get error', { error })
    return NextResponse.json(
      { error: 'Failed to fetch credential', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/admin/pppoe/credentials/[id]
 *
 * Deletes PPPoE credentials (and deprovisions from Interstellio if needed)
 */
export async function DELETE(
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

    // Get credential to check if provisioned
    const credential = await PPPoECredentialService.getById(id)

    if (!credential) {
      return NextResponse.json({ error: 'Credential not found' }, { status: 404 })
    }

    // Deprovision from Interstellio if needed
    if (credential.interstellioSubscriberId) {
      const deprovisionResult = await PPPoECredentialService.deprovision(id, user.id)
      if (!deprovisionResult.success) {
        apiLogger.warn('Failed to deprovision from Interstellio', { error: deprovisionResult.error })
        // Continue with deletion anyway
      }
    }

    // Delete credential
    const { error: deleteError } = await supabaseAdmin
      .from('pppoe_credentials')
      .delete()
      .eq('id', id)

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    return NextResponse.json({ message: 'Credential deleted successfully' })
  } catch (error) {
    apiLogger.error('PPPoE credential delete error', { error })
    return NextResponse.json(
      { error: 'Failed to delete credential', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
