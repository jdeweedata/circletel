/**
 * API Route: /api/admin/pppoe/credentials/[id]
 *
 * GET: Get PPPoE credential details
 * DELETE: Delete PPPoE credentials
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServerClient } from '@supabase/ssr'
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
    const { id } = await context.params

    // Create auth client
    const supabaseSSR = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll() { },
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
    const { id } = await context.params

    // Create auth client
    const supabaseSSR = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll() { },
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
