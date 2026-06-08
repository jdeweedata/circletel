import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { authenticateAdmin } from '@/lib/auth/admin-api-auth';
import { predictCoverageAtPoint, predictCoverage } from '@/lib/coverage/prediction';

export async function POST(request: NextRequest) {
  const authResult = await authenticateAdmin(request);
  if (!authResult.success) {
    return authResult.response;
  }

  const supabase = await createClient();
  const body = await request.json();
  const { lat, lng, bnSerial } = body as { lat: number; lng: number; bnSerial?: string };

  if (!lat || !lng) {
    return NextResponse.json({ error: 'lat and lng are required' }, { status: 400 });
  }

  try {
    const prediction = bnSerial
      ? await predictCoverage(bnSerial, lat, lng)
      : await predictCoverageAtPoint(lat, lng);

    if (!prediction) {
      return NextResponse.json({ prediction: null, message: 'No base stations within range' });
    }

    // Fetch BN coordinates + network topology + live status for map display and UI
    const { data: bn } = await supabase
      .from('tarana_base_stations')
      .select('lat, lng, cell_name, sector_name, market_id, site_id, device_status, active_connections')
      .eq('serial_number', prediction.nearestBnSerial)
      .single();

    // Fetch latest device counts for network-wide context
    const { data: deviceCounts } = await supabase
      .from('tarana_device_counts')
      .select('*')
      .order('fetched_at', { ascending: false })
      .limit(1)
      .single();

    const liveStatus = {
      bnOnline: (bn?.device_status ?? 0) === 1,
      bnActiveConnections: bn?.active_connections ?? 0,
      networkSummary: deviceCounts ? {
        totalBNs: deviceCounts.bn_total,
        onlineBNs: deviceCounts.bn_connected,
        totalRNs: deviceCounts.rn_total,
        onlineRNs: deviceCounts.rn_connected,
        fetchedAt: deviceCounts.fetched_at,
      } : null,
    };

    return NextResponse.json({
      prediction,
      baseStation: bn ? { lat: Number(bn.lat), lng: Number(bn.lng) } : null,
      networkInfo: bn ? {
        regionName: 'South Africa',
        marketId: bn.market_id ?? null,
        siteName: prediction.nearestBnSiteName,
        cellName: bn.cell_name ?? null,
        sectorName: bn.sector_name ?? null,
      } : null,
      liveStatus,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: `Prediction failed: ${message}` }, { status: 500 });
  }
}
