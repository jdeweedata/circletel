import { NextRequest, NextResponse } from 'next/server';
import { requireUnjaniSuperUser } from '@/lib/portal/require-portal-user';
import { mtnCspClient } from '@/lib/coverage/skyfibre/csp-client';
import { MTNConsumerClient } from '@/lib/coverage/mtn/consumer-client';
import {
  clinicKey,
  contactForClinic,
  mergeClinicContact,
} from '@/lib/portal/coverage-summary';
import { allRegisterContactsByClinicKey } from '@/lib/portal/unjani-register-contact';

export async function GET() {
  const auth = await requireUnjaniSuperUser();
  if (!auth.ok) return auth.response;

  const { portalUser, adminDb } = auth;

  const [{ data, error }, { data: sites }] = await Promise.all([
    adminDb
      .from('b2b_coverage_checks')
      .select('id, clinic_name, address, latitude, longitude, results, created_at')
      .eq('organisation_id', portalUser.organisation_id)
      .order('clinic_name', { ascending: true }),
    adminDb
      .from('corporate_sites')
      .select('site_name, site_contact_name, site_contact_phone, site_contact_email')
      .eq('corporate_id', portalUser.organisation_id),
  ]);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const pipelineClinicKeys: string[] = [];
  const pipelineContacts = { ...allRegisterContactsByClinicKey() };

  for (const site of sites ?? []) {
    const key = clinicKey(site.site_name);
    if (!key) continue;
    pipelineClinicKeys.push(key);
    pipelineContacts[key] = mergeClinicContact(pipelineContacts[key], {
      name: site.site_contact_name ?? '',
      phone: site.site_contact_phone ?? '',
      email: site.site_contact_email ?? '',
    });
  }

  for (const check of data ?? []) {
    const key = clinicKey(check.clinic_name);
    if (!key || pipelineContacts[key]) continue;
    const found = contactForClinic(check.clinic_name, pipelineContacts);
    if (found) pipelineContacts[key] = found;
  }

  return NextResponse.json({
    checks: data ?? [],
    pipelineClinicKeys: [...new Set(pipelineClinicKeys)],
    pipelineContacts,
  });
}

export async function POST(request: NextRequest) {
  const auth = await requireUnjaniSuperUser();
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
    let lteAvailable = false;
    let fiveGAvailable = false;
    let mobileDetail: Record<string, unknown> = {};

    const [fwbResult, mobileResult] = await Promise.all([
      mtnCspClient
        .checkFwbFeasibility({
          latitude,
          longitude,
          capacityMbps: 100,
        })
        .then((fwb) => ({ ok: true as const, fwb }))
        .catch((e) => ({
          ok: false as const,
          error: e instanceof Error ? e.message : String(e),
        })),
      MTNConsumerClient.checkMobileCoverage(
        { lat: latitude, lng: longitude },
        ['lte', '5g']
      )
        .then((mobile) => ({ ok: true as const, mobile }))
        .catch((e) => ({
          ok: false as const,
          error: e instanceof Error ? e.message : String(e),
        })),
    ]);

    if (fwbResult.ok) {
      taranaFeasible = Boolean(fwbResult.fwb.feasible);
      taranaDetail = {
        feasible: fwbResult.fwb.feasible,
        medium: fwbResult.fwb.medium,
        region: fwbResult.fwb.region,
        capacityMbps: fwbResult.fwb.capacityMbps,
        reference: fwbResult.fwb.reference,
      };
    } else {
      taranaDetail = { error: fwbResult.error };
    }

    if (mobileResult.ok) {
      lteAvailable = Boolean(
        mobileResult.mobile.services.find((s) => s.type === 'lte')?.available
      );
      fiveGAvailable = Boolean(
        mobileResult.mobile.services.find((s) => s.type === '5g')?.available
      );
      mobileDetail = {
        services: mobileResult.mobile.services.map((s) => ({
          type: s.type,
          available: s.available,
          technology: s.technology,
        })),
      };
    } else {
      mobileDetail = { error: mobileResult.error };
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
