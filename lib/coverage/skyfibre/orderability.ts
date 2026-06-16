import { checkBaseStationProximity } from '@/lib/coverage/mtn/base-station-service';
import type {
  BaseStationCoverageConfidence,
  BaseStationProximityResult,
  Coordinates,
} from '@/lib/coverage/types';
import { validateCoordinates } from '@/lib/coverage/utils/validation';
import { mtnCspClient } from './csp-client';
import type {
  CspOrderabilityResult,
  SkyFibreCapacityMbps,
  SkyFibreOrderabilityInput,
  SkyFibreOrderabilityResult,
  SkyFibreSegment,
  TcsCoverageResult,
} from './types';

interface LeadRecord {
  id: string;
  address?: string | null;
  customer_type?: string | null;
  coordinates?: {
    type?: string;
    coordinates?: [number, number];
    lat?: number;
    lng?: number;
  } | null;
  coverage_results?: unknown;
}

interface SupabaseLike {
  from: (table: string) => any;
}

export function buildTcsCoverageFromProximity(
  proximity: BaseStationProximityResult
): TcsCoverageResult {
  const nearest = proximity.nearestStation;
  const nearestBnOnline = nearest?.deviceStatus === 1;
  const nearestBnActiveRnCount = nearest?.activeConnections ?? 0;
  let confidence: BaseStationCoverageConfidence = proximity.confidence;
  let covered = proximity.hasCoverage && nearestBnOnline && confidence !== 'none';
  let reason = proximity.installationNote || 'Tarana coverage validated.';

  if (!nearest) {
    covered = false;
    confidence = 'none';
    reason = 'No active Tarana base station could be matched to this location.';
  } else if (!nearestBnOnline) {
    covered = false;
    confidence = 'none';
    reason = `Nearest base station ${nearest.siteName} is offline.`;
  } else if (nearestBnActiveRnCount === 0 && confidence !== 'none') {
    confidence = confidence === 'high' ? 'medium' : confidence;
    reason = `${nearest.siteName} is active but has no active RN evidence, so coverage needs manual review.`;
  } else {
    reason = `${nearest.siteName} is active with ${nearestBnActiveRnCount} active RN connection(s).`;
  }

  return {
    covered,
    confidence,
    nearestBnOnline,
    nearestBnActiveRnCount,
    reason,
    nearestStation: nearest
      ? {
          siteName: nearest.siteName,
          hostname: nearest.hostname,
          distanceKm: nearest.distanceKm,
          deviceStatus: nearest.deviceStatus,
          activeConnections: nearest.activeConnections,
        }
      : null,
  };
}

export function buildSkyFibreDecision(params: {
  segment: SkyFibreSegment;
  capacityMbps: SkyFibreCapacityMbps;
  tcsCoverage: TcsCoverageResult;
  cspOrderability?: CspOrderabilityResult;
}): SkyFibreOrderabilityResult {
  const { segment, capacityMbps, tcsCoverage, cspOrderability } = params;

  let decision: SkyFibreOrderabilityResult['decision'];

  if (!tcsCoverage.covered || tcsCoverage.confidence === 'none') {
    decision = 'not_covered';
  } else if (
    tcsCoverage.nearestBnActiveRnCount === 0 ||
    tcsCoverage.confidence === 'low' ||
    !cspOrderability ||
    cspOrderability.status === 'unknown' ||
    cspOrderability.status === 'error'
  ) {
    decision = 'manual_review';
  } else if (cspOrderability.orderable === true) {
    decision = 'orderable';
  } else if (cspOrderability.orderable === false) {
    decision = 'covered_not_orderable';
  } else {
    decision = 'manual_review';
  }

  return {
    decision,
    segment,
    capacityMbps,
    tcsCoverage,
    ...(cspOrderability ? { cspOrderability } : {}),
  };
}

export async function checkSkyFibreOrderability(
  input: SkyFibreOrderabilityInput,
  deps: {
    supabase?: SupabaseLike;
    cspClient?: typeof mtnCspClient;
  } = {}
): Promise<SkyFibreOrderabilityResult> {
  const lead = input.leadId && deps.supabase
    ? await loadLead(deps.supabase, input.leadId)
    : null;

  const coordinates = getCoordinates(input, lead);
  const segment = input.segment || segmentFromLead(lead);
  const coordinateValidation = validateCoordinates(coordinates);

  if (!coordinateValidation.valid) {
    return buildSkyFibreDecision({
      segment,
      capacityMbps: input.capacityMbps,
      tcsCoverage: {
        covered: false,
        confidence: 'none',
        nearestBnOnline: false,
        nearestBnActiveRnCount: 0,
        reason: coordinateValidation.error || 'Invalid coordinates.',
        nearestStation: null,
      },
    });
  }

  const proximity = await checkBaseStationProximity(coordinates, {
    limit: 3,
    includeTerrainPrediction: true,
  });
  const tcsCoverage = buildTcsCoverageFromProximity(proximity);

  if (!tcsCoverage.covered || tcsCoverage.confidence === 'none') {
    return buildSkyFibreDecision({
      segment,
      capacityMbps: input.capacityMbps,
      tcsCoverage,
    });
  }

  const cspOrderability = await (deps.cspClient || mtnCspClient).checkOrderability({
    latitude: coordinates.lat,
    longitude: coordinates.lng,
    capacityMbps: input.capacityMbps,
  });

  return buildSkyFibreDecision({
    segment,
    capacityMbps: input.capacityMbps,
    tcsCoverage,
    cspOrderability,
  });
}

export function isValidSkyFibreCapacity(value: unknown): value is SkyFibreCapacityMbps {
  return value === 50 || value === 100 || value === 200;
}

export function isSkyFibrePackage(input: {
  package_name?: unknown;
  service_type?: unknown;
  product_category?: unknown;
}): boolean {
  return (
    hasSkyFibreSignal(input.package_name) ||
    hasSkyFibreSignal(input.service_type) ||
    hasSkyFibreSignal(input.product_category)
  );
}

export function extractSkyFibreCapacity(input: {
  capacityMbps?: unknown;
  package_speed?: unknown;
  speed_down?: unknown;
  package_name?: unknown;
}): SkyFibreCapacityMbps | null {
  if (isValidSkyFibreCapacity(input.capacityMbps)) return input.capacityMbps;
  if (isValidSkyFibreCapacity(input.speed_down)) return input.speed_down;

  const text = `${input.package_speed || ''} ${input.package_name || ''}`;
  const match = text.match(/\b(50|100|200)\b/);
  if (!match) return null;

  const parsed = Number(match[1]);
  return isValidSkyFibreCapacity(parsed) ? parsed : null;
}

export function redactSkyFibreOrderability(
  result: SkyFibreOrderabilityResult
): SkyFibreOrderabilityResult {
  return {
    ...result,
    cspOrderability: result.cspOrderability
      ? {
          ...result.cspOrderability,
          error: result.cspOrderability.error ? 'CSP orderability check failed' : undefined,
        }
      : undefined,
  };
}

async function loadLead(supabase: SupabaseLike, leadId: string): Promise<LeadRecord> {
  const { data, error } = await supabase
    .from('coverage_leads')
    .select('id, address, customer_type, coordinates, coverage_results')
    .eq('id', leadId)
    .single();

  if (error || !data) {
    throw new Error('Coverage lead not found');
  }

  return data as LeadRecord;
}

function getCoordinates(input: SkyFibreOrderabilityInput, lead: LeadRecord | null): Coordinates {
  if (typeof input.latitude === 'number' && typeof input.longitude === 'number') {
    return { lat: input.latitude, lng: input.longitude };
  }

  const leadCoordinates = lead?.coordinates;
  if (leadCoordinates?.type === 'Point' && Array.isArray(leadCoordinates.coordinates)) {
    return {
      lat: leadCoordinates.coordinates[1],
      lng: leadCoordinates.coordinates[0],
    };
  }

  if (
    typeof leadCoordinates?.lat === 'number' &&
    typeof leadCoordinates?.lng === 'number'
  ) {
    return {
      lat: leadCoordinates.lat,
      lng: leadCoordinates.lng,
    };
  }

  return { lat: Number.NaN, lng: Number.NaN };
}

function segmentFromLead(lead: LeadRecord | null): SkyFibreSegment {
  const customerType = lead?.customer_type;
  return customerType === 'smme' || customerType === 'enterprise' ? 'business' : 'residential';
}

function hasSkyFibreSignal(value: unknown): boolean {
  const normalized = String(value || '').toLowerCase();
  const compact = normalized.replace(/[^a-z0-9]/g, '');
  return compact.includes('skyfibre') || normalized.includes('tarana');
}
