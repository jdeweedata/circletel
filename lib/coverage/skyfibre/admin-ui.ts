import type {
  SkyFibreCapacityMbps,
  SkyFibreOrderabilityDecision,
  SkyFibreSegment,
} from './types';

export interface AdminSkyFibreOrderabilityRequestInput {
  leadId?: string | null;
  lat: number;
  lng: number;
  capacityMbps: SkyFibreCapacityMbps;
}

export interface AdminSkyFibreOrderabilityRequest {
  leadId?: string;
  latitude: number;
  longitude: number;
  capacityMbps: SkyFibreCapacityMbps;
  segment: SkyFibreSegment;
}

export function buildAdminSkyFibreOrderabilityRequest(
  input: AdminSkyFibreOrderabilityRequestInput
): AdminSkyFibreOrderabilityRequest {
  return {
    ...(input.leadId ? { leadId: input.leadId } : {}),
    latitude: input.lat,
    longitude: input.lng,
    capacityMbps: input.capacityMbps,
    segment: 'business',
  };
}

export function getSkyFibreDecisionLabel(decision: SkyFibreOrderabilityDecision): string {
  switch (decision) {
    case 'orderable':
      return 'Orderable';
    case 'covered_not_orderable':
      return 'Covered, not orderable';
    case 'manual_review':
      return 'Manual review';
    case 'not_covered':
      return 'Not covered';
    case 'error':
      return 'Error';
    default:
      return 'Unknown';
  }
}

export function isAdminSkyFibrePackage(input: {
  name?: unknown;
  serviceType?: unknown;
  productCategory?: unknown;
  technology?: unknown;
}): boolean {
  return (
    hasSkyFibreSignal(input.name) ||
    hasSkyFibreSignal(input.serviceType) ||
    hasSkyFibreSignal(input.productCategory) ||
    hasSkyFibreSignal(input.technology)
  );
}

export function getAdminSkyFibreCapacity(value: unknown): SkyFibreCapacityMbps | null {
  if (value === 50 || value === 100 || value === 200) return value;

  const match = String(value || '').match(/\b(50|100|200)\b/);
  if (!match) return null;

  const parsed = Number(match[1]);
  return parsed === 50 || parsed === 100 || parsed === 200 ? parsed : null;
}

function hasSkyFibreSignal(value: unknown): boolean {
  const normalized = String(value || '').toLowerCase();
  const compact = normalized.replace(/[^a-z0-9]/g, '');
  return compact.includes('skyfibre') || normalized.includes('tarana');
}
