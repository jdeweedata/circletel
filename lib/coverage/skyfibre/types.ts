import type { BaseStationCoverageConfidence } from '@/lib/coverage/types';

export type SkyFibreSegment = 'residential' | 'business';
export type SkyFibreCapacityMbps = 50 | 100 | 200;
export type CspFeasibilityMethod = 'feasibilityOld' | 'feasibilityCheck';
export type CspOrderabilityStatus = 'orderable' | 'not_orderable' | 'unknown' | 'error';
export type SkyFibreOrderabilityDecision =
  | 'orderable'
  | 'covered_not_orderable'
  | 'manual_review'
  | 'not_covered'
  | 'error';

export interface CspOrderabilityResult {
  provider: 'mtn-csp';
  productName: 'Fixed Wireless Broadband';
  method: CspFeasibilityMethod;
  capacityMbps: SkyFibreCapacityMbps;
  orderable: boolean | null;
  status: CspOrderabilityStatus;
  taranaFeasible?: boolean;
  taranaZone?: number | null;
  checkedAt: string;
  responseTimeMs?: number;
  error?: string;
}

export interface TcsCoverageResult {
  covered: boolean;
  confidence: BaseStationCoverageConfidence;
  nearestBnOnline: boolean;
  nearestBnActiveRnCount: number;
  reason: string;
  nearestStation?: {
    siteName: string;
    hostname: string;
    distanceKm: number;
    deviceStatus: number;
    activeConnections: number;
  } | null;
}

export interface SkyFibreOrderabilityResult {
  decision: SkyFibreOrderabilityDecision;
  segment: SkyFibreSegment;
  capacityMbps: SkyFibreCapacityMbps;
  tcsCoverage: TcsCoverageResult;
  cspOrderability?: CspOrderabilityResult;
}

export interface SkyFibreOrderabilityInput {
  leadId?: string;
  latitude?: number;
  longitude?: number;
  capacityMbps: SkyFibreCapacityMbps;
  segment?: SkyFibreSegment;
}
