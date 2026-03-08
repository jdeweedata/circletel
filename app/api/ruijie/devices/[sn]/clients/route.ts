/**
 * Ruijie Device Clients API
 * GET /api/ruijie/devices/[sn]/clients - Get connected clients for a device
 *
 * Returns connected clients with MAC, IP, SSID, RSSI, channel, and signal quality.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClientWithSession, createClient } from '@/lib/supabase/server';
import { getDeviceClients } from '@/lib/ruijie/client';
import { apiLogger } from '@/lib/logging/logger';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ sn: string }> }
) {
  const { sn } = await context.params;

  try {
    // Use session client for authentication (reads cookies)
    const supabase = await createClientWithSession();

    // Verify admin access
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Use service role client for admin check and DB queries (bypasses RLS)
    const supabaseAdmin = await createClient();
    const { data: adminUser } = await supabaseAdmin
      .from('admin_users')
      .select('id, role')
      .eq('id', user.id)
      .eq('is_active', true)
      .single();

    if (!adminUser) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get device to find group_id
    const { data: device, error } = await supabaseAdmin
      .from('ruijie_device_cache')
      .select('group_id')
      .eq('sn', sn)
      .single();

    if (error || !device?.group_id) {
      return NextResponse.json({ error: 'Device not found' }, { status: 404 });
    }

    // Fetch connected clients from Ruijie STA API
    const clients = await getDeviceClients(sn, device.group_id);

    return NextResponse.json({
      clients,
      count: clients.length,
      sn,
    });

  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    apiLogger.error('[Ruijie] Clients API error', { error: message, sn });
    return NextResponse.json({ error: 'Failed to fetch clients' }, { status: 500 });
  }
}
