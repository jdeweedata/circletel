/**
 * Ruijie Device Detail API
 * GET /api/ruijie/devices/[sn] - Get device detail from cache
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClientWithSession, createClient } from '@/lib/supabase/server';
import { apiLogger } from '@/lib/logging/logger';

export const dynamic = 'force-dynamic';

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

    // Get device
    const { data: device, error } = await supabaseAdmin
      .from('ruijie_device_cache')
      .select('*')
      .eq('sn', sn)
      .single();

    if (error || !device) {
      return NextResponse.json({ error: 'Device not found' }, { status: 404 });
    }

    // Get active tunnels for this device
    const { data: tunnels } = await supabaseAdmin
      .from('ruijie_tunnels')
      .select('*')
      .eq('device_sn', sn)
      .eq('status', 'active')
      .gt('expires_at', new Date().toISOString());

    return NextResponse.json({
      device,
      tunnels: tunnels || [],
    });

  } catch (error) {
    apiLogger.error('Ruijie device detail API error', { error });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
