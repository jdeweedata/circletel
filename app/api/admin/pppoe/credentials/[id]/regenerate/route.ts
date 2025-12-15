/**
 * API Route: /api/admin/pppoe/credentials/[id]/regenerate
 *
 * POST: Regenerate PPPoE password
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServerClient } from '@supabase/ssr'
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
          setAll() {},
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
