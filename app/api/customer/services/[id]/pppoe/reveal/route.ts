/**
 * API Route: /api/customer/services/[id]/pppoe/reveal
 *
 * POST: Reveal PPPoE password for a customer's service (rate limited)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServerClient } from '@supabase/ssr'
import { PPPoECredentialService } from '@/lib/pppoe'

export const dynamic = 'force-dynamic'

// Rate limiting: 5 reveals per hour per customer
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000 // 1 hour
const RATE_LIMIT_MAX_REVEALS = 5

/**
 * POST /api/customer/services/[id]/pppoe/reveal
 *
 * Reveals the actual PPPoE password (rate limited to 5/hour)
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: serviceId } = await context.params

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

    // Verify customer owns this service
    const { data: service, error: serviceError } = await supabaseAdmin
      .from('customer_services')
      .select('id, customer_id')
      .eq('id', serviceId)
      .single()

    if (serviceError || !service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 })
    }

    // Check if user is the customer for this service
    const { data: customer } = await supabaseAdmin
      .from('customers')
      .select('id')
      .eq('auth_user_id', user.id)
      .single()

    if (!customer || customer.id !== service.customer_id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get credential for this service
    const credential = await PPPoECredentialService.getByServiceId(serviceId)

    if (!credential) {
      return NextResponse.json({ error: 'No PPPoE credentials found' }, { status: 404 })
    }

    // Check rate limit - count reveals in the last hour
    const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString()
    const { count: revealCount } = await supabaseAdmin
      .from('pppoe_audit_log')
      .select('id', { count: 'exact', head: true })
      .eq('credential_id', credential.id)
      .eq('action', 'password_revealed')
      .eq('performed_by_type', 'customer')
      .gte('created_at', windowStart)

    if ((revealCount || 0) >= RATE_LIMIT_MAX_REVEALS) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          message: `You can only reveal your password ${RATE_LIMIT_MAX_REVEALS} times per hour. Please try again later.`,
          retryAfter: RATE_LIMIT_WINDOW_MS / 1000,
        },
        { status: 429 }
      )
    }

    // Get request context for audit
    const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0] ||
      request.headers.get('x-real-ip') ||
      undefined
    const userAgent = request.headers.get('user-agent') || undefined

    // Reveal password
    const result = await PPPoECredentialService.revealPassword(
      credential.id,
      customer.id,
      'customer',
      ipAddress,
      userAgent
    )

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({
      password: result.password,
      expiresIn: 30, // Hint to frontend: auto-hide after 30 seconds
      remainingReveals: RATE_LIMIT_MAX_REVEALS - (revealCount || 0) - 1,
    })
  } catch (error) {
    console.error('Customer PPPoE reveal error:', error)
    return NextResponse.json(
      { error: 'Failed to reveal password', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
