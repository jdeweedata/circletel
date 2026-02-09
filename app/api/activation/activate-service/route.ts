/**
 * API Route: Activate Service
 *
 * POST /api/activation/activate-service
 *
 * Purpose: Manually trigger service activation (admin tool)
 * Task Group: 12.8 - Service Activation API
 */

import { NextRequest, NextResponse } from 'next/server';
import { activateService, deactivateService } from '@/lib/activation/service-activator';
import { createClient } from '@/lib/supabase/server';
import { activationLogger } from '@/lib/logging/logger';

/**
 * POST /api/activation/activate-service
 *
 * Request Body:
 * {
 *   orderId: string;
 *   action: 'activate' | 'deactivate';
 *   reason?: 'cancelled' | 'suspended' | 'expired'; // For deactivation only
 * }
 *
 * Response:
 * {
 *   success: boolean;
 *   message: string;
 *   error?: string;
 * }
 */
export async function POST(request: NextRequest) {
  try {
    activationLogger.info('[Activate Service API] Received activation request');

    // Parse request body
    const body = await request.json();
    const { orderId, action, reason } = body;

    // Validate required fields
    if (!orderId || !action) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: orderId, action'
        },
        { status: 400 }
      );
    }

    if (!['activate', 'deactivate'].includes(action)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid action. Must be "activate" or "deactivate"'
        },
        { status: 400 }
      );
    }

    // Verify order exists
    const supabase = await createClient();
    const { data: order, error: orderError } = await supabase
      .from('consumer_orders')
      .select('id, order_number, status')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        {
          success: false,
          error: 'Order not found'
        },
        { status: 404 }
      );
    }

    activationLogger.info('[Activate Service API] Processing action', { action, orderNumber: order.order_number });

    if (action === 'activate') {
      // Activate service
      await activateService(orderId);

      activationLogger.info('[Activate Service API] ✅ Service activated');

      return NextResponse.json({
        success: true,
        message: `Service activated for order ${order.order_number}`
      });

    } else if (action === 'deactivate') {
      // Validate deactivation reason
      if (!reason || !['cancelled', 'suspended', 'expired'].includes(reason)) {
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid or missing deactivation reason. Must be: cancelled, suspended, or expired'
          },
          { status: 400 }
        );
      }

      // Deactivate service
      await deactivateService(orderId, reason as 'cancelled' | 'suspended' | 'expired');

      activationLogger.info('[Activate Service API] ✅ Service deactivated', { reason });

      return NextResponse.json({
        success: true,
        message: `Service deactivated (${reason}) for order ${order.order_number}`
      });
    }

    return NextResponse.json(
      { success: false, error: 'Unknown action' },
      { status: 400 }
    );

  } catch (error) {
    activationLogger.error('[Activate Service API] Processing failed', { error });

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Activation failed'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/activation/activate-service?orderId=xxx
 *
 * Check service activation status
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: 'Missing orderId parameter' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Fetch order with activation details
    const { data: order, error } = await supabase
      .from('consumer_orders')
      .select('id, order_number, status, activation_date, installation_completed_date')
      .eq('id', orderId)
      .single();

    if (error || !order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    // Check if service is active
    const isActive = order.status === 'active';
    const canActivate = ['pending_activation', 'installation_completed'].includes(order.status);

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        orderNumber: order.order_number,
        status: order.status,
        isActive,
        canActivate,
        activationDate: order.activation_date,
        installationCompletedDate: order.installation_completed_date
      }
    });

  } catch (error) {
    activationLogger.error('[Activate Service API] Status check failed', { error });

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Status check failed'
      },
      { status: 500 }
    );
  }
}
