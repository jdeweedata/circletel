import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { apiLogger } from '@/lib/logging';

// GET: Fetch all consumer orders for admin
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // TODO: Add admin authentication check
    // const { data: { user } } = await supabase.auth.getUser();
    // if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    // Fetch all orders with sorting
    const { data: orders, error } = await supabase
      .from('consumer_orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      apiLogger.error('Database error fetching orders:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch orders', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      orders,
      count: orders.length,
    });
  } catch (error) {
    apiLogger.error('Error fetching admin orders:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch orders',
      },
      { status: 500 }
    );
  }
}

// PATCH: Update order status (for admin)
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, status, notes, installation_scheduled_date } = body;

    if (!orderId || !status) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: orderId, status' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // TODO: Add admin authentication check
    // const { data: { user } } = await supabase.auth.getUser();
    // if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    // Update order status
    const updateData: any = {
      status,
      updated_at: new Date().toISOString(),
    };

    // Add timestamp fields based on status
    switch (status) {
      case 'payment':
        updateData.payment_date = new Date().toISOString();
        updateData.payment_status = 'paid';
        break;
      case 'kyc_submitted':
        updateData.kyc_submitted_date = new Date().toISOString();
        break;
      case 'kyc_approved':
        updateData.kyc_approved_date = new Date().toISOString();
        break;
      case 'installation_scheduled':
        if (installation_scheduled_date) {
          updateData.installation_scheduled_date = installation_scheduled_date;
        }
        break;
      case 'installation_completed':
        updateData.installation_completed_date = new Date().toISOString();
        break;
      case 'active':
        updateData.activation_date = new Date().toISOString();
        break;
      case 'cancelled':
        updateData.cancelled_date = new Date().toISOString();
        updateData.cancel_reason = notes || 'Cancelled by admin';
        break;
    }

    // Add internal notes if provided
    if (notes) {
      const { data: currentOrder } = await supabase
        .from('consumer_orders')
        .select('internal_notes')
        .eq('id', orderId)
        .single();

      const timestamp = new Date().toISOString();
      const newNote = `[${timestamp}] ${notes}`;
      const existingNotes = currentOrder?.internal_notes || '';
      updateData.internal_notes = existingNotes
        ? `${existingNotes}\n${newNote}`
        : newNote;
    }

    const { data: order, error } = await supabase
      .from('consumer_orders')
      .update(updateData)
      .eq('id', orderId)
      .select()
      .single();

    if (error) {
      apiLogger.error('Database error updating order:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to update order', details: error.message },
        { status: 500 }
      );
    }

    // TODO: Send notification email to customer about status change

    return NextResponse.json({
      success: true,
      order,
      message: 'Order status updated successfully',
    });
  } catch (error) {
    apiLogger.error('Error updating order:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update order',
      },
      { status: 500 }
    );
  }
}
