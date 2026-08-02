/**
 * GET /api/admin/network/hardware-installations
 *
 * Hardware-first inventory from v_hardware_installations
 * (Ruijie + Interstellio + Tarana RN + Omada CPE) with optional customer/location links.
 *
 * Query params:
 * - source: ruijie|interstellio|tarana|omada (optional)
 * - linked: all|linked|unlinked (default all)
 * - q: search hardware id/label, customer, location
 * - service_status: filter by customer_services.status
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { authenticateAdmin } from '@/lib/auth/admin-api-auth';

export const dynamic = 'force-dynamic';

export type HardwareInstallationRow = {
  hardware_source: 'ruijie' | 'interstellio' | 'tarana' | 'omada';
  hardware_id: string;
  hardware_label: string | null;
  hardware_model: string | null;
  hardware_status: string | null;
  last_seen_at: string | null;
  customer_id: string | null;
  customer_name: string | null;
  customer_email: string | null;
  service_id: string | null;
  service_status: string | null;
  service_active: boolean | null;
  package_name: string | null;
  location_type: string | null;
  location_id: string | null;
  location_name: string | null;
  location_address: string | null;
  province: string | null;
  lat: number | null;
  lng: number | null;
  link_method: string | null;
};

export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateAdmin(request);
    if (!authResult.success) {
      return authResult.response;
    }

    const { searchParams } = new URL(request.url);
    const source = searchParams.get('source')?.trim() || '';
    const linked = searchParams.get('linked')?.trim() || 'all';
    const q = searchParams.get('q')?.trim() || '';
    const serviceStatus = searchParams.get('service_status')?.trim() || '';

    const supabase = await createClient();

    let query = supabase.from('v_hardware_installations').select('*');

    if (source && ['ruijie', 'interstellio', 'tarana', 'omada'].includes(source)) {
      query = query.eq('hardware_source', source);
    }

    if (linked === 'linked') {
      query = query.not('service_id', 'is', null);
    } else if (linked === 'unlinked') {
      query = query.is('service_id', null);
    }

    if (serviceStatus) {
      query = query.eq('service_status', serviceStatus);
    }

    if (q) {
      // PostgREST or() — escape commas in q
      const safe = q.replace(/[,()]/g, ' ');
      query = query.or(
        [
          `hardware_id.ilike.%${safe}%`,
          `hardware_label.ilike.%${safe}%`,
          `customer_name.ilike.%${safe}%`,
          `location_name.ilike.%${safe}%`,
          `package_name.ilike.%${safe}%`,
        ].join(',')
      );
    }

    query = query
      .order('hardware_source', { ascending: true })
      .order('hardware_label', { ascending: true });

    const { data, error } = await query;

    if (error) {
      console.error('[HardwareInstallations] query failed', error);
      return NextResponse.json(
        { error: 'Failed to load hardware installations', details: error.message },
        { status: 500 }
      );
    }

    const rows = (data || []) as HardwareInstallationRow[];

    const bySource = {
      ruijie: 0,
      interstellio: 0,
      tarana: 0,
      omada: 0,
    };
    let linkedCount = 0;
    for (const row of rows) {
      if (row.hardware_source in bySource) {
        bySource[row.hardware_source as keyof typeof bySource] += 1;
      }
      if (row.service_id) linkedCount += 1;
    }

    return NextResponse.json({
      rows,
      totals: {
        total: rows.length,
        linked: linkedCount,
        unlinked: rows.length - linkedCount,
        by_source: bySource,
      },
    });
  } catch (err) {
    console.error('[HardwareInstallations] unexpected error', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
