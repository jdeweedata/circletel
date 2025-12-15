/**
 * API Route: /api/admin/pppoe/provision/[serviceId]
 *
 * POST: Provision PPPoE credentials to Interstellio RADIUS
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServerClient } from '@supabase/ssr'
import { PPPoECredentialService } from '@/lib/pppoe'

export const dynamic = 'force-dynamic'

/**
 * POST /api/admin/pppoe/provision/[serviceId]
 *
 * Provisions the PPPoE credentials to Interstellio RADIUS
 * Creates subscriber in Interstellio with the username and password
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ serviceId: string }> }
) {
  try {
    const { serviceId } = await context.params

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

    // Get credential by service ID
    const credential = await PPPoECredentialService.getByServiceId(serviceId)

    if (!credential) {
      return NextResponse.json(
        { error: 'PPPoE credentials not found for this service' },
        { status: 404 }
      )
    }

    // Check if already provisioned
    if (credential.provisioningStatus === 'provisioned' && credential.interstellioSubscriberId) {
      return NextResponse.json({
        message: 'Already provisioned to Interstellio',
        subscriberId: credential.interstellioSubscriberId,
        status: 'provisioned',
      })
    }

    // Provision to Interstellio
    const result = await PPPoECredentialService.provision(credential.id, user.id)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error, status: 'failed' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Successfully provisioned to Interstellio',
      subscriberId: result.subscriberId,
      status: 'provisioned',
    })
  } catch (error) {
    console.error('PPPoE provision error:', error)
    return NextResponse.json(
      { error: 'Failed to provision', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/admin/pppoe/provision/[serviceId]
 *
 * Deprovisions the PPPoE subscriber from Interstellio RADIUS
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ serviceId: string }> }
) {
  try {
    const { serviceId } = await context.params

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

    // Get credential by service ID
    const credential = await PPPoECredentialService.getByServiceId(serviceId)

    if (!credential) {
      return NextResponse.json(
        { error: 'PPPoE credentials not found for this service' },
        { status: 404 }
      )
    }

    // Check if provisioned
    if (!credential.interstellioSubscriberId) {
      return NextResponse.json({
        message: 'Not provisioned to Interstellio',
        status: 'not_provisioned',
      })
    }

    // Deprovision from Interstellio
    const result = await PPPoECredentialService.deprovision(credential.id, user.id)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error, status: 'failed' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Successfully deprovisioned from Interstellio',
      status: 'deprovisioned',
    })
  } catch (error) {
    console.error('PPPoE deprovision error:', error)
    return NextResponse.json(
      { error: 'Failed to deprovision', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
