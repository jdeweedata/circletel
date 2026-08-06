import { NextRequest, NextResponse } from 'next/server';
import { requirePortalSuperUser } from '@/lib/portal/require-portal-user';
import { mtnCspClient } from '@/lib/coverage/skyfibre/csp-client';
import { MTNConsumerClient } from '@/lib/coverage/mtn/consumer-client';

export async function GET() {
  const auth = await requirePortalSuperUser();
  if (!auth.ok) return auth.response;

  const { portalUser, adminDb } = auth;

  const { data, error } = await adminDb
    .from('b2b_coverage_checks')
    .select('id, clinic_name, address, latitude, longitude, results, created_at')
    .eq('organisation_id', portalUser.organisation_id)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ checks: data ?? [] });
}

export async function POST(request: NextRequest) {
  const auth = await requirePortalSuperUser();
  if (!auth.ok) return auth.response;

  const { portalUser, adminDb } = auth;

  try {
    const body = await request.json();
    const latitude = Number(body.latitude);
    const longitude = Number(body.longitude);
    const address = String(body.address ?? '').trim();
    const clinicName =
      typeof body.clinic_name === 'string' ? body.clinic_name.trim() : null;

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || !address) {
      return NextResponse.json(
        { error: 'address, latitude, and longitude are required' },
        { status: 400 }
      );
    }

    let taranaFeasible = false;
    let taranaDetail: Record<string, unknown> = {};
    try {
      const fwb = await mtnCspClient.checkFwbFeasibility({
        latitude,
        longitude,
        capacityMbps: 100,
      });
      taranaFeasible = Boolean(fwb.feasible);
      taranaDetail = {
        feasible: fwb.feasible,
        medium: fwb.medium,
        region: fwb.region,
        capacityMbps: fwb.capacityMbps,
        reference: fwb.reference,
      };
    } catch (e) {
      taranaDetail = {
        error: e instanceof Error ? e.message : String(e),
      };
    }

    let lteAvailable = false;
    let fiveGAvailable = false;
    let mobileDetail: Record<string, unknown> = {};
    try {
      const mobile = await MTNConsumerClient.checkMobileCoverage(
        { lat: latitude, lng: longitude },
        ['lte', '5g']
      );
      lteAvailable = Boolean(
        mobile.services.find((s) => s.type === 'lte')?.available
      );
      fiveGAvailable = Boolean(
        mobile.services.find((s) => s.type === '5g')?.available
      );
      mobileDetail = {
        services: mobile.services.map((s) => ({
          type: s.type,
          available: s.available,
          technology: s.technology,
        })),
      };
    } catch (e) {
      mobileDetail = {
        error: e instanceof Error ? e.message : String(e),
      };
    }

    const results = {
      tarana: {
        feasible: taranaFeasible,
        label: taranaFeasible ? 'available' : 'not feasible',
        ...taranaDetail,
      },
      lte: {
        available: lteAvailable,
        label: lteAvailable ? 'available' : 'not available',
      },
      five_g: {
        available: fiveGAvailable,
        label: fiveGAvailable ? 'available' : 'not available',
      },
      mobile: mobileDetail,
      summary: {
        tarana: taranaFeasible ? 'Available' : 'Not feasible',
        '5g_lte':
          lteAvailable || fiveGAvailable ? 'Available' : 'Not available',
      },
    };

    const { data: check, error: insertError } = await adminDb
      .from('b2b_coverage_checks')
      .insert({
        organisation_id: portalUser.organisation_id,
        created_by: portalUser.id,
        clinic_name: clinicName,
        address,
        latitude,
        longitude,
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
