import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { predictCoverageAtPoint, predictCoverage } from '@/lib/coverage/prediction';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: admin } = await supabase
    .from('admin_users')
    .select('id')
    .eq('id', user.id)
    .eq('is_active', true)
    .maybeSingle();
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

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

    // Fetch BN coordinates for map display
    const { data: bn } = await supabase
      .from('tarana_base_stations')
      .select('lat, lng')
      .eq('serial_number', prediction.nearestBnSerial)
      .single();

    return NextResponse.json({
      prediction,
      baseStation: bn ? { lat: Number(bn.lat), lng: Number(bn.lng) } : null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: `Prediction failed: ${message}` }, { status: 500 });
  }
}
