/**
 * Link/Unlink Device to Customer
 * POST /api/ruijie/devices/[sn]/link - Link device to customer
 * DELETE /api/ruijie/devices/[sn]/link - Unlink device
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClientWithSession, createClient } from '@/lib/supabase/server';
import { apiLogger } from '@/lib/logging/logger';

export const dynamic = 'force-dynamic';

interface LinkRequest {
  type: 'consumer' | 'corporate';
  customer_order_id?: string;
  corporate_site_id?: string;
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ sn: string }> }
) {
  const { sn } = await context.params;

  try {
    // Use session client for authentication (reads cookies)
    const supabase = await createClientWithSession();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Use service role client for admin check and DB queries (bypasses RLS)
    const supabaseAdmin = await createClient();
    const { data: adminUser } = await supabaseAdmin
      .from('admin_users')
      .select('id')
      .eq('id', user.id)
      .eq('is_active', true)
      .single();

    if (!adminUser) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body: LinkRequest = await request.json();

    // Validate request
    if (!body.type || !['consumer', 'corporate'].includes(body.type)) {
      return NextResponse.json({ error: 'Invalid type. Must be "consumer" or "corporate"' }, { status: 400 });
    }

    if (body.type === 'consumer' && !body.customer_order_id) {
      return NextResponse.json({ error: 'customer_order_id required for consumer type' }, { status: 400 });
    }

    if (body.type === 'corporate' && !body.corporate_site_id) {
      return NextResponse.json({ error: 'corporate_site_id required for corporate type' }, { status: 400 });
    }

    // Verify device exists
    const { data: device, error: deviceError } = await supabaseAdmin
      .from('ruijie_device_cache')
      .select('sn')
      .eq('sn', sn)
      .single();

    if (deviceError || !device) {
      return NextResponse.json({ error: 'Device not found' }, { status: 404 });
    }

    // Fetch customer details based on type
    let customerName: string | null = null;
    let customerEmail: string | null = null;
    let customerPhone: string | null = null;

    if (body.type === 'consumer' && body.customer_order_id) {
      const { data: order, error: orderError } = await supabaseAdmin
        .from('consumer_orders')
        .select('first_name, last_name, email, phone')
        .eq('id', body.customer_order_id)
        .single();

      if (orderError || !order) {
        return NextResponse.json({ error: 'Consumer order not found' }, { status: 404 });
      }

      customerName = `${order.first_name} ${order.last_name}`;
      customerEmail = order.email;
      customerPhone = order.phone;
    } else if (body.type === 'corporate' && body.corporate_site_id) {
      const { data: site, error: siteError } = await supabaseAdmin
        .from('corporate_sites')
        .select('site_name, site_contact_email, site_contact_phone')
        .eq('id', body.corporate_site_id)
        .single();

      if (siteError || !site) {
        return NextResponse.json({ error: 'Corporate site not found' }, { status: 404 });
      }

      customerName = site.site_name;
      customerEmail = site.site_contact_email;
      customerPhone = site.site_contact_phone;
    }

    // Update device with customer link
    const { error: updateError } = await supabaseAdmin
      .from('ruijie_device_cache')
      .update({
        customer_order_id: body.type === 'consumer' ? body.customer_order_id : null,
        corporate_site_id: body.type === 'corporate' ? body.corporate_site_id : null,
        customer_name: customerName,
        customer_email: customerEmail,
        customer_phone: customerPhone,
      })
      .eq('sn', sn);

    if (updateError) {
      apiLogger.error('[Ruijie] Failed to link device', { error: updateError.message, sn });
      return NextResponse.json({ error: 'Failed to link device' }, { status: 500 });
    }

    apiLogger.info('[Ruijie] Device linked to customer', {
      sn,
      type: body.type,
      customerName,
      linkedBy: user.id
    });

    return NextResponse.json({
      success: true,
      customer_name: customerName,
      customer_email: customerEmail,
      customer_phone: customerPhone,
    });

  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    apiLogger.error('[Ruijie] Device link API error', { error: message, sn });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ sn: string }> }
) {
  const { sn } = await context.params;

  try {
    // Use session client for authentication (reads cookies)
    const supabase = await createClientWithSession();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Use service role client for admin check and DB queries (bypasses RLS)
    const supabaseAdmin = await createClient();
    const { data: adminUser } = await supabaseAdmin
      .from('admin_users')
      .select('id')
      .eq('id', user.id)
      .eq('is_active', true)
      .single();

    if (!adminUser) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Verify device exists
    const { data: device, error: deviceError } = await supabaseAdmin
      .from('ruijie_device_cache')
      .select('sn, customer_name')
      .eq('sn', sn)
      .single();

    if (deviceError || !device) {
      return NextResponse.json({ error: 'Device not found' }, { status: 404 });
    }

    const previousCustomer = device.customer_name;

    // Clear customer link
    const { error: updateError } = await supabaseAdmin
      .from('ruijie_device_cache')
      .update({
        customer_order_id: null,
        corporate_site_id: null,
        customer_name: null,
        customer_email: null,
        customer_phone: null,
      })
      .eq('sn', sn);

    if (updateError) {
      apiLogger.error('[Ruijie] Failed to unlink device', { error: updateError.message, sn });
      return NextResponse.json({ error: 'Failed to unlink device' }, { status: 500 });
    }

    apiLogger.info('[Ruijie] Device unlinked from customer', {
      sn,
      previousCustomer,
      unlinkedBy: user.id
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    apiLogger.error('[Ruijie] Device unlink API error', { error: message, sn });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
