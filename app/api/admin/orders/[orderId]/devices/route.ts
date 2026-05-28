/**
 * PATCH /api/admin/orders/[orderId]/devices
 *
 * Updates SIM card and router serial numbers for a consumer order.
 * Syncs both consumer_orders (quick-access) and network_devices (inventory).
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { authenticateAdmin } from '@/lib/auth/admin-api-auth';

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ orderId: string }> }
) {
  const authResult = await authenticateAdmin(request);
  if (!authResult.success) return authResult.response;

  const { orderId } = await context.params;

  if (!orderId) {
    return NextResponse.json({ success: false, error: 'Order ID is required' }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  try {
    const body = await request.json();
    const { simSerial, routerSerial, routerModel } = body;

    // 1. Verify order exists
    const { data: order, error: orderError } = await supabase
      .from('consumer_orders')
      .select('id, order_number, sim_serial, router_serial')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    // 2. Update consumer_orders quick-access fields
    const orderUpdates: Record<string, string | null> = {};
    if (simSerial !== undefined) orderUpdates.sim_serial = simSerial || null;
    if (routerSerial !== undefined) orderUpdates.router_serial = routerSerial || null;
    if (routerModel !== undefined) orderUpdates.router_model = routerModel || null;

    if (Object.keys(orderUpdates).length > 0) {
      orderUpdates.updated_at = new Date().toISOString();
      await supabase.from('consumer_orders').update(orderUpdates).eq('id', orderId);
    }

    // 3. Update or Create network_devices records
    const results: string[] = [];

    if (simSerial !== undefined && simSerial) {
      // Find existing SIM device for this order
      const { data: existingSim } = await supabase
        .from('network_devices')
        .select('id')
        .eq('consumer_order_id', orderId)
        .eq('device_type', 'sim_card')
        .maybeSingle();

      if (existingSim) {
        await supabase.from('network_devices')
          .update({ serial_number: simSerial, sim_number: simSerial })
          .eq('id', existingSim.id);
        results.push(`SIM updated: ${simSerial}`);
      } else {
        await supabase.from('network_devices').insert({
          consumer_order_id: orderId,
          device_type: 'sim_card',
          serial_number: simSerial,
          sim_number: simSerial,
          device_name: `5G SIM for ${order.order_number}`,
          model: 'MTN 5G SIM',
          status: 'reserved',
        });
        results.push(`SIM created: ${simSerial}`);
      }
    }

    if (routerSerial !== undefined && routerSerial) {
      const { data: existingRouter } = await supabase
        .from('network_devices')
        .select('id')
        .eq('consumer_order_id', orderId)
        .in('device_type', ['tozed_cpe', 'router'])
        .maybeSingle();

      if (existingRouter) {
        await supabase.from('network_devices')
          .update({
            serial_number: routerSerial,
            model: routerModel || null,
          })
          .eq('id', existingRouter.id);
        results.push(`Router updated: ${routerSerial}`);
      } else {
        await supabase.from('network_devices').insert({
          consumer_order_id: orderId,
          device_type: 'tozed_cpe',
          serial_number: routerSerial,
          device_name: `5G Router for ${order.order_number}`,
          model: routerModel || 'Huawei 5G CPE Pro',
          status: 'reserved',
        });
        results.push(`Router created: ${routerSerial}`);
      }
    }

    // 4. Add tracking event if devices were assigned
    if (simSerial || routerSerial) {
      // Check if orders table has this record
      const { data: ordersRecord } = await supabase
        .from('orders')
        .select('id')
        .eq('id', orderId)
        .maybeSingle();

      if (ordersRecord) {
        await supabase.from('order_tracking_events').insert({
          order_id: orderId,
          event_type: 'device_registered',
          event_status: 'completed',
          event_title: 'Devices Assigned',
          event_description: `SIM: ${simSerial || order.sim_serial || 'N/A'} | Router: ${routerSerial || order.router_serial || 'N/A'}${routerModel ? ` (${routerModel})` : ''}`,
          event_data: { sim: simSerial, router: routerSerial, router_model: routerModel },
          completed_date: new Date().toISOString(),
          visible_to_customer: false,
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Device assignments updated',
      results,
      orderNumber: order.order_number,
    });
  } catch (error) {
    console.error('[Admin Devices] Error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to update devices' },
      { status: 500 }
    );
  }
}
