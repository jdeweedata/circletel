/**
 * Ruijie Network Traffic API
 * GET /api/ruijie/traffic - Get network-wide traffic analytics
 *
 * Query params:
 * - groupId: Network group ID (required)
 * - hours: Number of hours to fetch (default: 24, max: 168 = 7 days)
 * - includeApps: Include app flow breakdown (default: true)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClientWithSession, createClient } from '@/lib/supabase/server';
import { getNetworkTraffic, getAppFlow } from '@/lib/ruijie/client';
import { apiLogger } from '@/lib/logging/logger';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const groupId = searchParams.get('groupId');
    const hours = Math.min(parseInt(searchParams.get('hours') || '24', 10), 168);
    const includeApps = searchParams.get('includeApps') !== 'false';

    if (!groupId) {
      return NextResponse.json(
        { error: 'groupId parameter is required' },
        { status: 400 }
      );
    }

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

    // Fetch traffic data
    const [trafficSummary, appFlow] = await Promise.all([
      getNetworkTraffic(groupId, hours),
      includeApps ? getAppFlow(groupId) : Promise.resolve([]),
    ]);

    return NextResponse.json({
      groupId,
      hours,
      traffic: trafficSummary,
      appFlow: includeApps ? appFlow : undefined,
      fetchedAt: new Date().toISOString(),
    });

  } catch (error) {
    apiLogger.error('Ruijie traffic API error', { error });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
