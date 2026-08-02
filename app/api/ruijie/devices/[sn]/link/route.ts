/**
 * Link / unlink a Ruijie device (`ruijie_device_cache`) to a customer.
 *
 * ## POST `/api/ruijie/devices/[sn]/link`
 * Auth: admin session (cookie) + active `admin_users` row.
 *
 * Request body:
 * | Field               | Type                    | Required when        |
 * |---------------------|-------------------------|----------------------|
 * | `type`              | `"consumer"\|"corporate"` | always             |
 * | `customer_order_id` | UUID                    | `type === "consumer"`  |
 * | `corporate_site_id` | UUID                    | `type === "corporate"` |
 *
 * Effects on `ruijie_device_cache` (by `sn`):
 * - Sets one of `customer_order_id` / `corporate_site_id` (clears the other)
 * - Denormalizes `customer_name`, `customer_email`, `customer_phone` from
 *   `consumer_orders` or `corporate_sites`
 * - Upserts `service_network_identifiers` (`ruijie_sn` → service) when a
 *   `service_id` can be resolved (corporate site or order connection_id)
 *
 * Success (200):
 * ```json
 * { "success": true, "customer_name": "...", "customer_email": "...", "customer_phone": "...", "service_id": "..." }
 * ```
 *
 * Errors: 400 validation, 401/403 auth, 404 device or order/site missing, 500 update failure.
 *
 * ## DELETE `/api/ruijie/devices/[sn]/link`
 * Clears `customer_order_id`, `corporate_site_id`, denormalized customer fields,
 * and deletes matching `service_network_identifiers` row for this SN.
 * Success (200): `{ "success": true }`
 *
 * Ops UI: `/admin/network/devices` (list + filter Unlinked) and device detail
 * Customer Assignment panel. Customer picker uses `GET /api/admin/search/customers?q=`.
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

    let resolvedServiceId: string | null = null;

    if (body.type === 'consumer' && body.customer_order_id) {
      const { data: order, error: orderError } = await supabaseAdmin
        .from('consumer_orders')
        .select('first_name, last_name, email, phone, connection_id')
        .eq('id', body.customer_order_id)
        .single();

      if (orderError || !order) {
        return NextResponse.json({ error: 'Consumer order not found' }, { status: 404 });
      }

      customerName = `${order.first_name} ${order.last_name}`;
      customerEmail = order.email;
      customerPhone = order.phone;

      // Best-effort: match customer_services via Interstellio connection_id on the order
      if (order.connection_id) {
        const { data: svc } = await supabaseAdmin
          .from('customer_services')
          .select('id')
          .eq('connection_id', order.connection_id)
          .maybeSingle();
        resolvedServiceId = svc?.id ?? null;
      }
    } else if (body.type === 'corporate' && body.corporate_site_id) {
      const { data: site, error: siteError } = await supabaseAdmin
        .from('corporate_sites')
        .select('site_name, site_contact_email, site_contact_phone, service_id')
        .eq('id', body.corporate_site_id)
        .single();

      if (siteError || !site) {
        return NextResponse.json({ error: 'Corporate site not found' }, { status: 404 });
      }

      customerName = site.site_name;
      customerEmail = site.site_contact_email;
      customerPhone = site.site_contact_phone;
      resolvedServiceId = site.service_id ?? null;
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

    // Dual-write service_network_identifiers for RA / hardware inventory view
    if (resolvedServiceId) {
      const { error: sniError } = await supabaseAdmin
        .from('service_network_identifiers')
        .upsert(
          {
            service_id: resolvedServiceId,
            identifier_type: 'ruijie_sn',
            identifier_value: sn,
            source: 'manual',
          },
          { onConflict: 'identifier_type,identifier_value' }
        );
      if (sniError) {
        apiLogger.warn('[Ruijie] SNI upsert failed after link', {
          sn,
          serviceId: resolvedServiceId,
          error: sniError.message,
        });
      }
    }

    apiLogger.info('[Ruijie] Device linked to customer', {
      sn,
      type: body.type,
      customerName,
      serviceId: resolvedServiceId,
      linkedBy: user.id
    });

    return NextResponse.json({
      success: true,
      customer_name: customerName,
      customer_email: customerEmail,
      customer_phone: customerPhone,
      service_id: resolvedServiceId,
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

    // Remove SNI mapping for this Ruijie SN (safe: unique on type+value)
    const { error: sniDeleteError } = await supabaseAdmin
      .from('service_network_identifiers')
      .delete()
      .eq('identifier_type', 'ruijie_sn')
      .eq('identifier_value', sn);

    if (sniDeleteError) {
      apiLogger.warn('[Ruijie] SNI delete failed after unlink', {
        sn,
        error: sniDeleteError.message,
      });
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
