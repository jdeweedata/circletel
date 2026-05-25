/**
 * Admin API: Tarana Device Counts (Dashboard Summary)
 *
 * GET /api/admin/tarana/device-counts
 *
 * Returns the latest network-wide device counts from TMQ v5 /radios/count,
 * mirroring the MTN TCS Portal dashboard: connected/disconnected/spectrum-unassigned/new-installs
 * for both Base Nodes (BN) and Remote Nodes (RN).
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdmin } from '@/lib/auth/admin-api-auth';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest): Promise<NextResponse> {
  const authResult = await authenticateAdmin(request);
  if (!authResult.success) return authResult.response;

  const supabase = await createClient();

  const { data, error } = await supabase
    .from('tarana_device_counts')
    .select('*')
    .order('fetched_at', { ascending: false })
    .limit(1)
    .single();

  if (error || !data) {
    return NextResponse.json(
      {
        success: false,
        error: 'No device count data available yet. Run a Tarana sync first.',
      },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    data: {
      bn: {
        connected: data.bn_connected,
        disconnected: data.bn_disconnected,
        spectrumUnassigned: data.bn_spectrum_unassigned,
        newInstalls30d: data.bn_new_installs_30d,
        total: data.bn_total,
      },
      rn: {
        connected: data.rn_connected,
        disconnected: data.rn_disconnected,
        spectrumUnassigned: data.rn_spectrum_unassigned,
        newInstalls30d: data.rn_new_installs_30d,
        total: data.rn_total,
      },
      fetchedAt: data.fetched_at,
    },
  });
}
