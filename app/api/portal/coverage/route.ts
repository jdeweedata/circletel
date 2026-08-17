import { NextRequest, NextResponse } from 'next/server';
import { requireUnjaniCapability } from '@/lib/portal/require-portal-user';
import {
  buildUnjaniCoverageResults,
  parseCoverageCheckBody,
} from '@/lib/coverage/run-unjani-coverage-check';
import { listUnjaniCoverageFeed } from '@/lib/portal/unjani-coverage-feed';

export async function GET() {
  const auth = await requireUnjaniCapability('coverage.read');
  if (!auth.ok) return auth.response;

  const { portalUser, adminDb } = auth;

  try {
    const payload = await listUnjaniCoverageFeed(adminDb, portalUser.organisation_id);
    return NextResponse.json(payload);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireUnjaniCapability('coverage.read');
  if (!auth.ok) return auth.response;

  const { portalUser, adminDb } = auth;

  try {
    const parsed = parseCoverageCheckBody(await request.json());
    if ('error' in parsed) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const results = await buildUnjaniCoverageResults(parsed.latitude, parsed.longitude);

    const { data: check, error: insertError } = await adminDb
      .from('b2b_coverage_checks')
      .insert({
        organisation_id: portalUser.organisation_id,
        created_by: portalUser.id,
        clinic_name: parsed.clinicName,
        address: parsed.address,
        latitude: parsed.latitude,
        longitude: parsed.longitude,
        results,
      })
      .select('id, clinic_name, address, latitude, longitude, results, created_at')
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ check }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
