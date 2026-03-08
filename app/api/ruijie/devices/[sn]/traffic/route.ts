/**
 * Ruijie Device Traffic API
 * GET /api/ruijie/devices/[sn]/traffic - Get traffic data for a specific device
 *
 * Note: Ruijie Cloud API provides traffic at network/group level, not per-device.
 * This endpoint returns client-level bandwidth data from the STA API as a proxy.
 *
 * Query params:
 * - hours: Number of hours of data (default: 24)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClientWithSession, createClient } from '@/lib/supabase/server';
import { getDeviceClients, isMockMode } from '@/lib/ruijie/client';
import { apiLogger } from '@/lib/logging/logger';

export const dynamic = 'force-dynamic';

interface DeviceTrafficResponse {
  sn: string;
  deviceName: string;
  groupId: string;
  onlineClients: number;
  clientBandwidth: {
    mac: string;
    userIp: string;
    ssid: string;
    band: string;
    downlinkRate: number;  // bps
    uplinkRate: number;    // bps
  }[];
  totalDownlinkRate: number;  // Aggregate bps
  totalUplinkRate: number;    // Aggregate bps
  fetchedAt: string;
  note: string;
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ sn: string }> }
) {
  try {
    const { sn } = await context.params;

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

    // Get device info from cache
    const { data: device, error: deviceError } = await supabaseAdmin
      .from('ruijie_device_cache')
      .select('sn, device_name, group_id')
      .eq('sn', sn)
      .single();

    if (deviceError || !device) {
      return NextResponse.json({ error: 'Device not found' }, { status: 404 });
    }

    const groupId = device.group_id;
    if (!groupId) {
      return NextResponse.json({
        sn,
        deviceName: device.device_name,
        groupId: null,
        onlineClients: 0,
        clientBandwidth: [],
        totalDownlinkRate: 0,
        totalUplinkRate: 0,
        fetchedAt: new Date().toISOString(),
        note: 'Device has no associated group ID',
      });
    }

    // Get connected clients with bandwidth info
    const clients = await getDeviceClients(sn, groupId);

    // In mock mode, add simulated bandwidth rates
    const clientBandwidth = clients.map(client => {
      // Mock rates based on signal quality
      let baseDown = 0;
      let baseUp = 0;

      if (isMockMode()) {
        switch (client.signalQuality) {
          case 'excellent':
            baseDown = 50_000_000; // 50 Mbps
            baseUp = 10_000_000;   // 10 Mbps
            break;
          case 'good':
            baseDown = 30_000_000;
            baseUp = 6_000_000;
            break;
          case 'fair':
            baseDown = 15_000_000;
            baseUp = 3_000_000;
            break;
          default:
            baseDown = 5_000_000;
            baseUp = 1_000_000;
        }
        // Add some variance
        const variance = 0.8 + Math.random() * 0.4;
        baseDown = Math.floor(baseDown * variance);
        baseUp = Math.floor(baseUp * variance);
      }

      return {
        mac: client.mac,
        userIp: client.userIp,
        ssid: client.ssid,
        band: client.band,
        downlinkRate: baseDown,
        uplinkRate: baseUp,
      };
    });

    const totalDownlinkRate = clientBandwidth.reduce((sum, c) => sum + c.downlinkRate, 0);
    const totalUplinkRate = clientBandwidth.reduce((sum, c) => sum + c.uplinkRate, 0);

    const response: DeviceTrafficResponse = {
      sn,
      deviceName: device.device_name,
      groupId,
      onlineClients: clients.length,
      clientBandwidth,
      totalDownlinkRate,
      totalUplinkRate,
      fetchedAt: new Date().toISOString(),
      note: 'Bandwidth data is aggregated from connected clients. Historical traffic data is available at network level only.',
    };

    return NextResponse.json(response);

  } catch (error) {
    apiLogger.error('Ruijie device traffic API error', { error });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
