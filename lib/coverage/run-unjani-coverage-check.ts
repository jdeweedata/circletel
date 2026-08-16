import { mtnCspClient } from '@/lib/coverage/skyfibre/csp-client';
import { MTNConsumerClient } from '@/lib/coverage/mtn/consumer-client';

export interface CoverageCheckInsert {
  organisation_id: string;
  created_by?: string | null;
  clinic_name: string | null;
  address: string;
  latitude: number;
  longitude: number;
  results: Record<string, unknown>;
}

export async function buildUnjaniCoverageResults(
  latitude: number,
  longitude: number
): Promise<Record<string, unknown>> {
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
    MTNConsumerClient.checkMobileCoverage({ lat: latitude, lng: longitude }, ['lte', '5g'])
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

  return {
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
      '5g_lte': lteAvailable || fiveGAvailable ? 'Available' : 'Not available',
    },
  };
}

export function parseCoverageCheckBody(body: {
  latitude?: unknown;
  longitude?: unknown;
  address?: unknown;
  clinic_name?: unknown;
}): { latitude: number; longitude: number; address: string; clinicName: string | null } | { error: string } {
  const latitude = Number(body.latitude);
  const longitude = Number(body.longitude);
  const address = String(body.address ?? '').trim();
  const clinicName = typeof body.clinic_name === 'string' ? body.clinic_name.trim() : null;

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || !address) {
    return { error: 'address, latitude, and longitude are required' };
  }

  return { latitude, longitude, address, clinicName };
}
