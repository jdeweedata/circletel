import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCalibrationData, getAllCalibrationData } from '@/lib/coverage/prediction';

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

  try {
    if (bnSerial) {
      const calibration = await getCalibrationData(bnSerial);
      return NextResponse.json({ calibration });
    }

    const allCalibrations = await getAllCalibrationData();
    return NextResponse.json({
      calibrations: allCalibrations,
      summary: {
        totalBns: allCalibrations.length,
        highConfidence: allCalibrations.filter(c => c.confidenceLevel === 'high').length,
        mediumConfidence: allCalibrations.filter(c => c.confidenceLevel === 'medium').length,
        lowConfidence: allCalibrations.filter(c => c.confidenceLevel === 'low').length,
        noData: allCalibrations.filter(c => c.confidenceLevel === 'none').length,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: `Calibration query failed: ${message}` }, { status: 500 });
  }
}
