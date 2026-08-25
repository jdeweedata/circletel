import { NextRequest, NextResponse } from 'next/server';
import {
  buildUnjaniCoverageResults,
  parseCoverageCheckBody,
} from '@/lib/coverage/run-unjani-coverage-check';
import { requireUnjaniAdmin } from '@/lib/admin/require-unjani-admin';
import { listUnjaniCoverageFeed } from '@/lib/portal/unjani-coverage-feed';
import { apiLogger } from '@/lib/logging/logger';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireUnjaniAdmin(request);
    if (!auth.ok) return auth.response;

    const payload = await listUnjaniCoverageFeed(auth.supabase, auth.org.id);
    return NextResponse.json(payload);
  } catch (error: unknown) {
    apiLogger.error('[Unjani coverage] GET failed', { error });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireUnjaniAdmin(request);
    if (!auth.ok) return auth.response;

    const parsed = parseCoverageCheckBody(await request.json());
    if ('error' in parsed) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const results = await buildUnjaniCoverageResults(parsed.latitude, parsed.longitude);

    const { data: check, error: insertError } = await auth.supabase
      .from('b2b_coverage_checks')
      .insert({
        organisation_id: auth.org.id,
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
  } catch (error: unknown) {
    apiLogger.error('[Unjani coverage] POST failed', { error });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
