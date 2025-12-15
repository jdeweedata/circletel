/**
 * API Route: /api/admin/pppoe/credentials/[id]/reveal
 *
 * POST: Reveal PPPoE password (audit logged)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServerClient } from '@supabase/ssr'
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
