/**
 * Ruijie Devices API
 * GET /api/ruijie/devices - List devices from cache
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { apiLogger } from '@/lib/logging/logger';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify admin access
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: adminUser } = await supabase
      .from('admin_users')
      .select('id, role')
      .eq('email', user.email)
      .single();

    if (!adminUser) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Parse query params
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const group = searchParams.get('group') || '';
    const model = searchParams.get('model') || '';

    // Build query
    let query = supabase
      .from('ruijie_device_cache')
      .select('*')
      .order('status', { ascending: true })
      .order('device_name', { ascending: true });

    // Apply filters
    if (search) {
      query = query.or(
        `sn.ilike.%${search}%,device_name.ilike.%${search}%,management_ip.ilike.%${search}%`
      );
    }
    if (status) {
      query = query.eq('status', status);
    }
    if (group) {
      query = query.eq('group_name', group);
    }
    if (model) {
      query = query.eq('model', model);
    }

    const { data: devices, error } = await query;

    if (error) {
      apiLogger.error('Failed to fetch devices', { error });
      return NextResponse.json({ error: 'Failed to fetch devices' }, { status: 500 });
    }

    // Get last sync time
    const { data: lastSync } = await supabase
      .from('ruijie_sync_logs')
      .select('completed_at')
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })
      .limit(1)
      .single();

    // Get unique groups and models for filter dropdowns
    const groups = [...new Set(devices?.map(d => d.group_name).filter(Boolean))] as string[];
    const models = [...new Set(devices?.map(d => d.model).filter(Boolean))] as string[];

    return NextResponse.json({
      devices: devices || [],
      total: devices?.length || 0,
      lastSynced: lastSync?.completed_at || null,
      filters: { groups, models },
    });

  } catch (error) {
    apiLogger.error('Ruijie devices API error', { error });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
