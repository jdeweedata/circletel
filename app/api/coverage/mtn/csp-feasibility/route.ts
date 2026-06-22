// MTN CSP (newcsp / mtnsi.mtn.co.za) Fixed Wireless Broadband feasibility.
// Backs the admin coverage checker's MTN tab FWB card. Authenticates with
// MTN_CSP_USERNAME/MTN_CSP_PASSWORD (no reCAPTCHA / no MTN_SESSION).
import { NextRequest, NextResponse } from 'next/server';
import { mtnCspClient } from '@/lib/coverage/skyfibre/csp-client';
import { apiLogger } from '@/lib/logging';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json().catch(() => ({}));
    const latitude = typeof body.latitude === 'number' ? body.latitude : Number(body.latitude);
    const longitude = typeof body.longitude === 'number' ? body.longitude : Number(body.longitude);
    const capacityMbps = body.capacityMbps != null ? Number(body.capacityMbps) : 100;

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return NextResponse.json(
        { success: false, error: 'latitude and longitude are required' },
        { status: 400 }
      );
    }

    const data = await mtnCspClient.checkFwbFeasibility({ latitude, longitude, capacityMbps });
    return NextResponse.json({ success: true, data });
  } catch (error) {
    apiLogger.error('[MTN CSP Feasibility] check failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'MTN CSP feasibility check failed',
      },
      { status: 502 }
    );
  }
}
