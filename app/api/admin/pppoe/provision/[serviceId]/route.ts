/**
 * API Route: /api/admin/pppoe/provision/[serviceId]
 *
 * POST: Provision PPPoE credentials to Interstellio RADIUS
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { authenticateAdmin } from '@/lib/auth/admin-api-auth'
import { PPPoECredentialService } from '@/lib/pppoe'
import { apiLogger } from '@/lib/logging/logger'

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
    const authResult = await authenticateAdmin(request)
    if (!authResult.success) {
      return authResult.response
    }

    const { serviceId } = await context.params
    const { user } = authResult
    const supabaseAdmin = await createClient()

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
    apiLogger.error('PPPoE provision error', { error })
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
    const authResult = await authenticateAdmin(request)
    if (!authResult.success) {
      return authResult.response
    }

    const { serviceId } = await context.params
    const { user } = authResult
    const supabaseAdmin = await createClient()

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
    apiLogger.error('PPPoE deprovision error', { error })
    return NextResponse.json(
      { error: 'Failed to deprovision', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
