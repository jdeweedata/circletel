/**
 * Customer Devices API
 * GET /api/admin/customers/[id]/devices?type=consumer|corporate
 *
 * Returns all Ruijie devices linked to a customer (consumer order or corporate site)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { authenticateAdmin } from '@/lib/auth/admin-api-auth';
import { apiLogger } from '@/lib/logging/logger';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const authResult = await authenticateAdmin(request);
  if (!authResult.success) return authResult.response;

  try {
    const { id } = await context.params;
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'consumer';

    // Validate type parameter
    if (type !== 'consumer' && type !== 'corporate') {
      return NextResponse.json(
        { error: 'Invalid type parameter. Must be "consumer" or "corporate"' },
        { status: 400 }
      );
    }

    // Use service role client for admin DB queries (bypasses RLS)
    const supabaseAdmin = await createClient();

    // Determine which column to filter by based on customer type
    const column = type === 'consumer' ? 'customer_order_id' : 'corporate_site_id';

    const { data: devices, error } = await supabaseAdmin
      .from('ruijie_device_cache')
      .select('sn, device_name, model, status, group_name, online_clients, synced_at')
      .eq(column, id)
      .order('status')
      .order('device_name');

    if (error) {
      apiLogger.error('[CustomerDevices] Failed to fetch devices', {
        error: error.message,
        customerId: id,
        type
      });
      return NextResponse.json({ error: 'Failed to fetch devices' }, { status: 500 });
    }

    return NextResponse.json({ devices: devices || [] });

  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    apiLogger.error('[CustomerDevices] API error', { error: message });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
