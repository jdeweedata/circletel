import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Vercel configuration
export const runtime = 'nodejs';
export const maxDuration = 15;

// Helper function to get allowed next statuses
// Updated to support flexible workflow: installation can be scheduled before payment method registration
function getAllowedNextStatuses(currentStatus: string): string[] {
  const transitions: Record<string, string[]> = {
    pending: ['payment_method_pending', 'installation_scheduled', 'cancelled'],
    payment_method_pending: ['payment_method_registered', 'installation_scheduled', 'cancelled'],
    payment_method_registered: ['installation_scheduled', 'cancelled'],
    installation_scheduled: ['payment_method_pending', 'payment_method_registered', 'installation_in_progress', 'cancelled'],
    installation_in_progress: ['installation_completed', 'failed', 'cancelled'],
    installation_completed: ['payment_method_pending', 'payment_method_registered', 'active', 'failed', 'cancelled'],
    active: ['suspended', 'cancelled'],
    suspended: ['active', 'cancelled'],
    failed: ['installation_scheduled', 'cancelled'],
    cancelled: [],
  };

  return transitions[currentStatus] || ['cancelled'];
}

/**
 * GET /api/admin/orders/[orderId]/status
 * Returns current status and allowed next statuses
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ orderId: string }> }
) {
  const { orderId } = await context.params;

  if (!orderId) {
    return NextResponse.json(
      { success: false, error: 'Order ID is required' },
      { status: 400 }
    );
  }

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Get current order status
    const { data: order, error } = await supabase
      .from('consumer_orders')
      .select('status')
      .eq('id', orderId)
      .single();

    if (error || !order) {
      console.error('Error fetching order status:', error);
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    const allowedStatuses = getAllowedNextStatuses(order.status);

    return NextResponse.json({
      success: true,
      data: {
        currentStatus: order.status,
        allowedNextStatuses: allowedStatuses,
      },
    });
  } catch (error: any) {
    console.error('Error fetching allowed statuses:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/orders/[orderId]/status
 * Updates order status with validation and audit logging
 */
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ orderId: string }> }
) {
  const { orderId } = await context.params;

  if (!orderId) {
    return NextResponse.json(
      { success: false, error: 'Order ID is required' },
      { status: 400 }
    );
  }

  try {
    const body = await request.json();
    const { status: newStatus, notes, scheduledDate, scheduledTimeSlot } = body;

    if (!newStatus) {
      return NextResponse.json(
        { success: false, error: 'New status is required' },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Get current order
    const { data: order, error: fetchError } = await supabase
      .from('consumer_orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (fetchError || !order) {
      console.error('Error fetching order:', fetchError);
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    // Validate status transition
    const allowedStatuses = getAllowedNextStatuses(order.status);
    if (!allowedStatuses.includes(newStatus)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid status transition from ${order.status} to ${newStatus}`,
          allowedStatuses,
        },
        { status: 400 }
      );
    }

    // Require notes for cancellation
    if (newStatus === 'cancelled' && !notes) {
      return NextResponse.json(
        {
          success: false,
          error: 'Cancellation reason (notes) is required',
        },
        { status: 400 }
      );
    }

    // Require scheduled date for installation_scheduled
    if (newStatus === 'installation_scheduled' && !scheduledDate) {
      return NextResponse.json(
        {
          success: false,
          error: 'Scheduled date is required for installation_scheduled status',
        },
        { status: 400 }
      );
    }

    // Update order status
    const updateData: any = {
      status: newStatus,
      updated_at: new Date().toISOString(),
    };

    // Add installation scheduling fields if provided
    if (newStatus === 'installation_scheduled') {
      updateData.installation_scheduled_date = scheduledDate;
      if (scheduledTimeSlot) {
        updateData.installation_time_slot = scheduledTimeSlot;
      }
    }

    // Add completion timestamp for installation_completed
    if (newStatus === 'installation_completed') {
      updateData.installation_completed_at = new Date().toISOString();
    }

    // Add activation timestamp for active
    if (newStatus === 'active') {
      updateData.activation_date = new Date().toISOString();
    }

    const { data: updatedOrder, error: updateError } = await supabase
      .from('consumer_orders')
      .update(updateData)
      .eq('id', orderId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating order status:', updateError);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to update order status',
          details: updateError.message,
        },
        { status: 500 }
      );
    }

    // Log status change to history (using existing table structure)
    const { error: historyError } = await supabase
      .from('order_status_history')
      .insert({
        entity_type: 'consumer_order',
        entity_id: orderId,
        old_status: order.status,
        new_status: newStatus,
        change_reason: notes || null,
        changed_by: null, // TODO: Get from auth session
        automated: false,
        customer_notified: false, // TODO: Set to true after notification sent
        status_changed_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      });

    if (historyError) {
      console.error('Error logging status history:', historyError);
      // Don't fail the request if history logging fails
    }

    // TODO: Trigger notifications based on status change
    // await sendStatusChangeNotification(order, newStatus);

    return NextResponse.json({
      success: true,
      data: updatedOrder,
      message: `Order status updated to ${newStatus}`,
    });
  } catch (error: any) {
    console.error('Error updating order status:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
