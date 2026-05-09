import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdmin } from '@/lib/auth/admin-api-auth';
import { getCalibrationData, getAllCalibrationData } from '@/lib/coverage/prediction';

export async function GET(request: NextRequest) {
  const authResult = await authenticateAdmin(request);
  if (!authResult.success) {
    return authResult.response;
  }

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
