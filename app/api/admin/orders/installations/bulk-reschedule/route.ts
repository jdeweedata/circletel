import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { apiLogger } from '@/lib/logging';

// Vercel configuration
export const runtime = 'nodejs';
export const maxDuration = 30;

/**
 * POST /api/admin/orders/installations/bulk-reschedule
 * Reschedule multiple installations to a new date and time slot
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const { installationIds, scheduledDate, scheduledTimeSlot } = body;

    // Validation
    if (!installationIds || !Array.isArray(installationIds) || installationIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Installation IDs are required' },
        { status: 400 }
      );
    }

    if (!scheduledDate) {
      return NextResponse.json(
        { success: false, error: 'Scheduled date is required' },
        { status: 400 }
      );
    }

    // Validate date is not in the past
    const selectedDate = new Date(scheduledDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      return NextResponse.json(
        { success: false, error: 'Cannot schedule in the past' },
        { status: 400 }
      );
    }

    // Update all installation tasks
    const { data: updatedTasks, error: updateError } = await supabase
      .from('installation_tasks')
      .update({
        scheduled_date: scheduledDate,
        scheduled_time_slot: scheduledTimeSlot || 'morning',
        status: 'installation_scheduled',
        updated_at: new Date().toISOString(),
      })
      .in('id', installationIds)
      .select('id, order_id');

    if (updateError) {
      apiLogger.error('Error updating installation tasks:', updateError);
      return NextResponse.json(
        { success: false, error: 'Failed to reschedule installations', details: updateError.message },
        { status: 500 }
      );
    }

    // Update corresponding orders
    if (updatedTasks && updatedTasks.length > 0) {
      const orderIds = updatedTasks.map((task) => task.order_id);

      const { error: orderUpdateError } = await supabase
        .from('consumer_orders')
        .update({
          status: 'installation_scheduled',
          installation_scheduled_date: scheduledDate,
          installation_time_slot: scheduledTimeSlot || 'morning',
        })
        .in('id', orderIds);

      if (orderUpdateError) {
        apiLogger.warn('⚠️ Failed to update some orders:', orderUpdateError);
        // Don't fail the request if order updates fail
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        updated: updatedTasks?.length || 0,
        scheduledDate,
        scheduledTimeSlot,
      },
      message: `Successfully rescheduled ${updatedTasks?.length || 0} installation(s)`,
    });
  } catch (error: any) {
    apiLogger.error('Error in POST /api/admin/orders/installations/bulk-reschedule:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
