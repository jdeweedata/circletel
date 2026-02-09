import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { apiLogger } from '@/lib/logging';

// Vercel configuration
export const runtime = 'nodejs';
export const maxDuration = 15;

/**
 * POST /api/admin/orders/[orderId]/installation/assign
 * Assigns a technician to an installation task
 */
export async function POST(
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
    const supabase = await createClient();
    const body = await request.json();
    const { technicianId, scheduledDate, scheduledTimeSlot, notes } = body;

    // Validation
    if (!technicianId) {
      return NextResponse.json(
        { success: false, error: 'Technician ID is required' },
        { status: 400 }
      );
    }

    // Check if installation task exists for this order
    const { data: existingTask, error: fetchError } = await supabase
      .from('installation_tasks')
      .select('id, technician_id')
      .eq('order_id', orderId)
      .maybeSingle();

    if (fetchError) {
      apiLogger.error('Error fetching installation task:', fetchError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch installation task', details: fetchError.message },
        { status: 500 }
      );
    }

    let result;

    if (existingTask) {
      // Update existing task with new technician
      const updateData: any = {
        technician_id: technicianId,
        updated_at: new Date().toISOString(),
      };

      if (scheduledDate) {
        updateData.scheduled_date = scheduledDate;
      }

      if (scheduledTimeSlot) {
        updateData.scheduled_time_slot = scheduledTimeSlot;
      }

      if (notes) {
        updateData.technician_notes = notes;
      }

      const { data, error } = await supabase
        .from('installation_tasks')
        .update(updateData)
        .eq('id', existingTask.id)
        .select(`
          *,
          technician:technicians(id, name, email, phone)
        `)
        .single();

      if (error) {
        apiLogger.error('Error updating installation task:', error);
        return NextResponse.json(
          { success: false, error: 'Failed to assign technician', details: error.message },
          { status: 500 }
        );
      }

      result = data;
    } else {
      // Create new installation task
      if (!scheduledDate) {
        return NextResponse.json(
          { success: false, error: 'Scheduled date is required for new installation task' },
          { status: 400 }
        );
      }

      // Get order details for task creation
      const { data: order, error: orderError } = await supabase
        .from('consumer_orders')
        .select(`
          id,
          first_name,
          last_name,
          email,
          phone,
          installation_address,
          suburb,
          city,
          province,
          postal_code
        `)
        .eq('id', orderId)
        .single();

      if (orderError || !order) {
        return NextResponse.json(
          { success: false, error: 'Order not found', details: orderError?.message },
          { status: 404 }
        );
      }

      const { data, error } = await supabase
        .from('installation_tasks')
        .insert({
          order_id: orderId,
          technician_id: technicianId,
          scheduled_date: scheduledDate,
          scheduled_time_slot: scheduledTimeSlot || 'morning',
          status: 'scheduled',
          installation_address: {
            street: order.installation_address,
            suburb: order.suburb,
            city: order.city,
            province: order.province,
            postal_code: order.postal_code,
          },
          customer_contact_name: `${order.first_name} ${order.last_name}`,
          customer_contact_phone: order.phone,
          customer_contact_email: order.email,
          technician_notes: notes,
        })
        .select(`
          *,
          technician:technicians(id, name, email, phone)
        `)
        .single();

      if (error) {
        apiLogger.error('Error creating installation task:', error);
        return NextResponse.json(
          { success: false, error: 'Failed to create installation task', details: error.message },
          { status: 500 }
        );
      }

      result = data;

      // Update order status to installation_scheduled
      await supabase
        .from('consumer_orders')
        .update({
          status: 'installation_scheduled',
          installation_scheduled_date: scheduledDate,
          installation_time_slot: scheduledTimeSlot || 'morning',
        })
        .eq('id', orderId);
    }

    return NextResponse.json({
      success: true,
      data: result,
      message: existingTask ? 'Technician reassigned successfully' : 'Installation scheduled and technician assigned',
    });
  } catch (error: any) {
    apiLogger.error('Error in POST /api/admin/orders/[orderId]/installation/assign:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/orders/[orderId]/installation/assign
 * Unassigns technician from installation
 */
export async function DELETE(
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
    const supabase = await createClient();

    // Find installation task
    const { data: task, error: fetchError } = await supabase
      .from('installation_tasks')
      .select('id')
      .eq('order_id', orderId)
      .maybeSingle();

    if (fetchError) {
      return NextResponse.json(
        { success: false, error: 'Failed to fetch installation task', details: fetchError.message },
        { status: 500 }
      );
    }

    if (!task) {
      return NextResponse.json(
        { success: false, error: 'No installation task found for this order' },
        { status: 404 }
      );
    }

    // Unassign technician
    const { error: updateError } = await supabase
      .from('installation_tasks')
      .update({
        technician_id: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', task.id);

    if (updateError) {
      return NextResponse.json(
        { success: false, error: 'Failed to unassign technician', details: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Technician unassigned successfully',
    });
  } catch (error: any) {
    apiLogger.error('Error in DELETE /api/admin/orders/[orderId]/installation/assign:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
