/**
 * API Route: /api/customer/services/[id]/pppoe
 *
 * GET: Get PPPoE credentials for a customer's service (masked password)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServerClient } from '@supabase/ssr'
import { PPPoECredentialService } from '@/lib/pppoe'

export const dynamic = 'force-dynamic'

/**
 * GET /api/customer/services/[id]/pppoe
 *
 * Returns PPPoE credentials for the customer's service
 * Password is masked - use /reveal endpoint to get actual password
 */
export async function GET(
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
      return NextResponse.json({
        credential: null,
        message: 'No PPPoE credentials found for this service',
      })
    }

    // Return credential with masked password
    return NextResponse.json({
      credential: {
        id: credential.id,
        username: credential.pppoeUsername,
        password: '••••••••••••', // Always masked
        provisioningStatus: credential.provisioningStatus,
        createdAt: credential.createdAt,
      },
    })
  } catch (error) {
    console.error('Customer PPPoE get error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch credentials', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
