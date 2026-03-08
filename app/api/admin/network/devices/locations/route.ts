/**
 * Network Device Locations API
 *
 * GET /api/admin/network/devices/locations
 * Returns all devices with their geographic coordinates from linked corporate sites
 */

import { NextResponse } from 'next/server';
import { createClientWithSession, createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

interface DeviceLocation {
  sn: string;
  device_name: string;
  model: string | null;
  group_name: string | null;
  customer_name: string | null;
  status: string;
  online_clients: number;
  health_score: number;
  latitude: number;
  longitude: number;
  site_name: string;
  site_address: string;
  province: string | null;
}

export async function GET() {
  try {
    // Authenticate user
    const supabase = await createClientWithSession();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseAdmin = await createClient();

    // Verify admin access
    const { data: adminUser } = await supabaseAdmin
      .from('admin_users')
      .select('id')
      .eq('id', user.id)
      .eq('is_active', true)
      .single();

    if (!adminUser) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get all devices with corporate site links
    const { data: devices, error: devicesError } = await supabaseAdmin
      .from('ruijie_device_cache')
      .select(`
        sn,
        device_name,
        model,
        group_name,
        customer_name,
        status,
        online_clients,
        corporate_site_id
      `)
      .not('corporate_site_id', 'is', null);

    if (devicesError) {
      console.error('[LocationsAPI] Failed to fetch devices:', devicesError);
      return NextResponse.json({ error: 'Failed to fetch devices' }, { status: 500 });
    }

    if (!devices || devices.length === 0) {
      return NextResponse.json({
        devices: [],
        stats: {
          total: 0,
          online: 0,
          offline: 0,
          withLocation: 0,
        },
      });
    }

    // Get corporate sites with coordinates
    const siteIds = devices.map((d) => d.corporate_site_id).filter(Boolean);
    const { data: sites, error: sitesError } = await supabaseAdmin
      .from('corporate_sites')
      .select('id, site_name, coordinates, installation_address, province')
      .in('id', siteIds);

    if (sitesError) {
      console.error('[LocationsAPI] Failed to fetch sites:', sitesError);
      return NextResponse.json({ error: 'Failed to fetch sites' }, { status: 500 });
    }

    // Create site lookup map
    const siteMap = new Map(sites?.map((s) => [s.id, s]) || []);

    // Get latest health scores
    const { data: healthSnapshots } = await supabaseAdmin
      .from('device_health_snapshots')
      .select('device_sn, health_score')
      .order('captured_at', { ascending: false });

    // Create health score lookup (latest per device)
    const healthMap = new Map<string, number>();
    for (const snapshot of healthSnapshots || []) {
      if (!healthMap.has(snapshot.device_sn)) {
        healthMap.set(snapshot.device_sn, snapshot.health_score);
      }
    }

    // Build device locations with coordinates
    const deviceLocations: DeviceLocation[] = [];

    for (const device of devices) {
      const site = siteMap.get(device.corporate_site_id);
      if (!site) continue;

      // Parse coordinates from JSONB
      const coords = site.coordinates as { lat?: number; lng?: number } | null;
      if (!coords || typeof coords.lat !== 'number' || typeof coords.lng !== 'number') {
        continue; // Skip devices without valid coordinates
      }

      // Parse address
      const address = site.installation_address as {
        street?: string;
        city?: string;
        province?: string;
      } | null;

      const addressStr = address
        ? [address.street, address.city, address.province].filter(Boolean).join(', ')
        : site.site_name;

      deviceLocations.push({
        sn: device.sn,
        device_name: device.device_name,
        model: device.model,
        group_name: device.group_name,
        customer_name: device.customer_name,
        status: device.status,
        online_clients: device.online_clients || 0,
        health_score: healthMap.get(device.sn) ?? (device.status === 'online' ? 100 : 80),
        latitude: coords.lat,
        longitude: coords.lng,
        site_name: site.site_name,
        site_address: addressStr,
        province: site.province || address?.province || null,
      });
    }

    // Calculate stats
    const stats = {
      total: devices.length,
      online: devices.filter((d) => d.status === 'online').length,
      offline: devices.filter((d) => d.status === 'offline').length,
      withLocation: deviceLocations.length,
    };

    return NextResponse.json({
      devices: deviceLocations,
      stats,
    });
  } catch (error) {
    console.error('[LocationsAPI] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
