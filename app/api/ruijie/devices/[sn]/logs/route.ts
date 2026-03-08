/**
 * Ruijie Device Logs API
 * GET /api/ruijie/devices/[sn]/logs - Get AP management logs for a device
 *
 * Returns device management logs including reboots, online/offline events,
 * and configuration changes from Ruijie Cloud.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClientWithSession, createClient } from '@/lib/supabase/server';
import { getDeviceLogs } from '@/lib/ruijie/client';
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

    // Use service role client for admin check (bypasses RLS)
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

    // Verify device exists
    const { data: device, error } = await supabaseAdmin
      .from('ruijie_device_cache')
      .select('sn')
      .eq('sn', sn)
      .single();

    if (error || !device) {
      return NextResponse.json({ error: 'Device not found' }, { status: 404 });
    }

    // Fetch device logs from Ruijie API
    const logs = await getDeviceLogs(sn);

    return NextResponse.json({
      logs,
      count: logs.length,
      sn,
    });

  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    apiLogger.error('[Ruijie] Logs API error', { error: message, sn });
    return NextResponse.json({ error: 'Failed to fetch device logs' }, { status: 500 });
  }
}
