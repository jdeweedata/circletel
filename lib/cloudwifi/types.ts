export const CLOUDWIFI_VENUE_TYPES = [
  'hospitality',
  'retail',
  'property',
  'healthcare',
  'education',
  'public_venue',
] as const;

export const CLOUDWIFI_BACKHAUL_TYPES = [
  'fibre',
  'licensed_wireless',
  'fixed_wireless',
  '5g',
  'lte',
  'unknown',
] as const;

export const CLOUDWIFI_TIER_IDS = [
  'essential',
  'professional',
  'enterprise',
  'campus',
] as const;

export type CloudWifiVenueType = typeof CLOUDWIFI_VENUE_TYPES[number];
export type CloudWifiBackhaul = typeof CLOUDWIFI_BACKHAUL_TYPES[number];
export type CloudWifiTierId = typeof CLOUDWIFI_TIER_IDS[number];

export interface TierRecommendationInput {
  venueType: CloudWifiVenueType;
  floorArea: number;
  peakUsers: number;
  backhaul: CloudWifiBackhaul;
}

export interface CloudWifiTier {
  id: CloudWifiTierId;
  name: string;
  areaLabel: string;
  apRange: string;
  startingPrice: number;
  includedAccessPoints: number;
}

export interface TierRecommendation extends TierRecommendationInput {
  tier: CloudWifiTierId;
  tierDetails: CloudWifiTier;
  reasons: string[];
  backhaulGuidance: string | null;
}
