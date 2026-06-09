import { NextRequest, NextResponse } from 'next/server';
import { resolveToken, getClinicPrefill } from '@/lib/onboarding/onboarding-service';

export async function GET(request: NextRequest) {
  const token = new URL(request.url).searchParams.get('token');
  if (!token) return NextResponse.json({ error: 'token required' }, { status: 400 });
  const resolved = await resolveToken(token);
  if (!resolved) return NextResponse.json({ error: 'invalid_or_expired' }, { status: 401 });
  const prefill = await getClinicPrefill(resolved.customerId);
  if (!prefill) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  if (prefill.customer.onboarding_status === 'billing_ready') {
    return NextResponse.json({ alreadyComplete: true });
  }
  return NextResponse.json({ ...prefill });
}
