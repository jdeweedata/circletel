/**
 * Ruijie Device Metrics API
 * GET /api/ruijie/devices/[sn]/metrics - Fetch live performance metrics
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClientWithSession, createClient } from '@/lib/supabase/server';
import { getDeviceMetrics, DeviceMetrics } from '@/lib/ruijie/client';
import { apiLogger } from '@/lib/logging/logger';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ sn: string }> }
) {
  const { sn } = await context.params;

  try {
    // Authenticate
    const supabase = await createClientWithSession();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify admin access
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

    // Verify device exists in cache and get group_id for STA query
    const { data: device } = await supabaseAdmin
      .from('ruijie_device_cache')
      .select('sn, status, group_id')
      .eq('sn', sn)
      .single();

    if (!device) {
      return NextResponse.json({ error: 'Device not found' }, { status: 404 });
    }

    // Fetch live metrics from Ruijie Cloud API
    let metrics: DeviceMetrics;

    if (device.status === 'offline') {
      // Don't fetch metrics for offline devices
      metrics = {
        cpu_usage: null,
        memory_usage: null,
        uptime_seconds: null,
        online_clients: 0,
        radio_2g_channel: null,
        radio_5g_channel: null,
        radio_2g_utilization: null,
        radio_5g_utilization: null,
      };
    } else {
      // Pass group_id for STA query to count online clients
      metrics = await getDeviceMetrics(sn, device.group_id || undefined);
    }

    // Update cache with new metrics (fire and forget)
    void (async () => {
      const { error: updateError } = await supabaseAdmin
        .from('ruijie_device_cache')
        .update({
          cpu_usage: metrics.cpu_usage,
          memory_usage: metrics.memory_usage,
          uptime_seconds: metrics.uptime_seconds,
          online_clients: metrics.online_clients,
          radio_2g_channel: metrics.radio_2g_channel,
          radio_5g_channel: metrics.radio_5g_channel,
          radio_2g_utilization: metrics.radio_2g_utilization,
          radio_5g_utilization: metrics.radio_5g_utilization,
          synced_at: new Date().toISOString(),
        })
        .eq('sn', sn);
      if (updateError) {
        apiLogger.error('[Ruijie] Failed to update metrics cache', { error: updateError });
      }
    })();

    return NextResponse.json({ metrics });

  } catch (error) {
    apiLogger.error('[Ruijie] Device metrics API error', { error, sn });
    return NextResponse.json({ error: 'Failed to fetch metrics' }, { status: 500 });
  }
}
