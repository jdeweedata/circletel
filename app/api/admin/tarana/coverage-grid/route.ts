import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdmin } from '@/lib/auth/admin-api-auth';
import { generateCoverageGrid } from '@/lib/coverage/prediction';

export async function GET(request: NextRequest) {
  const authResult = await authenticateAdmin(request);
  if (!authResult.success) {
    return authResult.response;
  }

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
