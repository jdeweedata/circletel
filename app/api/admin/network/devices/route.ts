import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { NetworkDevice, NetworkDeviceStats, DeviceType } from '@/lib/network/types';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/network/devices
 *
 * Returns all network devices with optional filters.
 * Joins to ruijie_device_cache for live AP status and consumer_orders for customer info.
 *
 * Query params:
 * - type: filter by device_type
 * - channel: filter by channel
 * - status: filter by status
 * - site: filter by site_name (ilike)
 * - search: search serial_number, device_name, site_name, pppoe_username
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    const type = searchParams.get('type');
    const channel = searchParams.get('channel');
    const status = searchParams.get('status');
    const site = searchParams.get('site');
    const search = searchParams.get('search');

    // Build query
    let query = supabase
      .from('network_devices')
      .select('*')
      .order('site_name', { ascending: true, nullsFirst: false })
      .order('device_type', { ascending: true });

    if (type) query = query.eq('device_type', type);
    if (channel) query = query.eq('channel', channel);
    if (status) query = query.eq('status', status);
    if (site) query = query.ilike('site_name', `%${site}%`);
    if (search) {
      query = query.or(
        `serial_number.ilike.%${search}%,device_name.ilike.%${search}%,site_name.ilike.%${search}%,pppoe_username.ilike.%${search}%,sim_number.ilike.%${search}%`
      );
    }

    const { data: devices, error: devicesError } = await query;

    if (devicesError) {
      return NextResponse.json({ error: devicesError.message }, { status: 500 });
    }

    const allDevices = (devices ?? []) as NetworkDevice[];

    // Enrich with Ruijie live status for AP devices
    const ruijieSnList = allDevices
      .filter(d => d.ruijie_device_sn)
      .map(d => d.ruijie_device_sn!);

    let ruijieMap: Record<string, { status: string; online_clients: number }> = {};

    if (ruijieSnList.length > 0) {
      const { data: ruijieData } = await supabase
        .from('ruijie_device_cache')
        .select('sn, status, online_clients')
        .in('sn', ruijieSnList);

      if (ruijieData) {
        for (const r of ruijieData) {
          ruijieMap[r.sn] = { status: r.status, online_clients: r.online_clients ?? 0 };
        }
      }
    }

    // Enrich with consumer order info
    const orderIds = allDevices
      .filter(d => d.consumer_order_id)
      .map(d => d.consumer_order_id!);

    let orderMap: Record<string, { order_number: string; customer_name: string }> = {};

    if (orderIds.length > 0) {
      const { data: orders } = await supabase
        .from('consumer_orders')
        .select('id, order_number, first_name, last_name')
        .in('id', orderIds);

      if (orders) {
        for (const o of orders) {
          orderMap[o.id] = {
            order_number: o.order_number,
            customer_name: `${o.first_name} ${o.last_name}`,
          };
        }
      }
    }

    // Merge enrichments
    const enrichedDevices: NetworkDevice[] = allDevices.map(d => ({
      ...d,
      ruijie_status: d.ruijie_device_sn ? ruijieMap[d.ruijie_device_sn]?.status : undefined,
      ruijie_online_clients: d.ruijie_device_sn ? ruijieMap[d.ruijie_device_sn]?.online_clients : undefined,
      order_number: d.consumer_order_id ? orderMap[d.consumer_order_id]?.order_number : undefined,
      customer_name: d.consumer_order_id ? orderMap[d.consumer_order_id]?.customer_name : undefined,
    }));

    // Compute stats (unfiltered for dashboard)
    const { data: allForStats } = await supabase
      .from('network_devices')
      .select('device_type, status, channel, monthly_cost');

    const statsDevices = allForStats ?? [];

    const byType: Record<string, number> = {};
    const byStatus: Record<string, number> = {};
    const byChannel: Record<string, number> = {};
    let totalMonthlyCost = 0;

    for (const d of statsDevices) {
      byType[d.device_type] = (byType[d.device_type] || 0) + 1;
      byStatus[d.status] = (byStatus[d.status] || 0) + 1;
      if (d.channel) byChannel[d.channel] = (byChannel[d.channel] || 0) + 1;
      totalMonthlyCost += Number(d.monthly_cost) || 0;
    }

    const stats: NetworkDeviceStats = {
      total: statsDevices.length,
      by_type: byType as Record<DeviceType, number>,
      by_status: byStatus,
      by_channel: byChannel,
      total_monthly_cost: totalMonthlyCost,
    };

    return NextResponse.json({
      success: true,
      devices: enrichedDevices,
      stats,
    });
  } catch (error) {
    console.error('[network-devices] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch network devices' },
      { status: 500 }
    );
  }
}
