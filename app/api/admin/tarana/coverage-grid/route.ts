import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateCoverageGrid } from '@/lib/coverage/prediction';

export async function GET(request: NextRequest) {
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

  const { searchParams } = new URL(request.url);
  const bnSerial = searchParams.get('bnSerial');
  const radiusKm = parseFloat(searchParams.get('radiusKm') || '4');
  const gridSizeM = parseInt(searchParams.get('gridSizeM') || '250');

  if (!bnSerial) {
    return NextResponse.json({ error: 'bnSerial is required' }, { status: 400 });
  }

  // Safety limits
  const clampedRadius = Math.min(Math.max(radiusKm, 0.5), 6);
  const clampedGridSize = Math.min(Math.max(gridSizeM, 100), 500);

  try {
    const grid = await generateCoverageGrid(bnSerial, clampedRadius, clampedGridSize);
    return NextResponse.json({ bnSerial, grid, count: grid.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: `Grid generation failed: ${message}` }, { status: 500 });
  }
}
