import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * GET /api/admin/field-ops/schedulable-orders
 * Returns orders that are ready to be scheduled for installation
 */
export async function GET(request: NextRequest) {
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

    // Get orders that need scheduling:
    // - Not yet active or cancelled
    // - Don't have an installation task yet (or task is not completed)
    const { data: orders, error } = await supabase
      .from('consumer_orders')
      .select(`
        id,
        order_number,
        status,
        first_name,
        last_name,
        email,
        phone,
        installation_address,
        suburb,
        city,
        province,
        postal_code,
        coordinates,
        package_name,
        package_speed,
        package_price,
        preferred_installation_date,
        installation_scheduled_date,
        special_instructions,
        created_at
      `)
      .not('status', 'in', '("active","cancelled")')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching schedulable orders:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch orders' },
        { status: 500 }
      );
    }

    // Filter out orders that already have installation tasks
    const orderIds = orders?.map(o => o.id) || [];

    const { data: existingTasks } = await supabase
      .from('installation_tasks')
      .select('order_id')
      .in('order_id', orderIds);

    const ordersWithTasks = new Set(existingTasks?.map(t => t.order_id) || []);

    // Categorize orders
    const schedulableOrders = (orders || []).map(order => ({
      ...order,
      has_installation_task: ordersWithTasks.has(order.id),
      full_address: [
        order.installation_address,
        order.suburb,
        order.city,
        order.province,
        order.postal_code
      ].filter(Boolean).join(', '),
      customer_name: `${order.first_name} ${order.last_name}`,
    }));

    // Split into categories for the UI
    const readyToSchedule = schedulableOrders.filter(
      o => !o.has_installation_task && o.status !== 'payment_method_pending'
    );
    const pendingPayment = schedulableOrders.filter(
      o => o.status === 'payment_method_pending'
    );
    const alreadyScheduled = schedulableOrders.filter(
      o => o.has_installation_task
    );

    return NextResponse.json({
      success: true,
      data: {
        ready_to_schedule: readyToSchedule,
        pending_payment: pendingPayment,
        already_scheduled: alreadyScheduled,
        total_schedulable: readyToSchedule.length,
      },
    });
  } catch (error) {
    console.error('Error in schedulable-orders API:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
