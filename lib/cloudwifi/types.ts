export const CLOUDWIFI_VENUE_TYPES = [
  "hospitality",
  "retail",
  "property",
  "healthcare",
  "education",
  "public_venue",
] as const;

export const CLOUDWIFI_BACKHAUL_TYPES = [
  "fibre",
  "licensed_wireless",
  "fixed_wireless",
  "5g",
  "lte",
  "unknown",
] as const;

export const CLOUDWIFI_TIER_IDS = [
  "essential",
  "professional",
  "enterprise",
  "campus",
] as const;

export const CLOUDWIFI_SURVEY_NUMERIC_LIMITS = Object.freeze({
  floorArea: 100_000,
  peakUsers: 100_000,
} as const);

// Mirrors Zod v3 email semantics without pulling Zod into the client bundle.
export const CLOUDWIFI_EMAIL_PATTERN =
  /^(?!\.)(?!.*\.\.)([A-Z0-9_'+\-.]*)[A-Z0-9_+-]@([A-Z0-9][A-Z0-9-]*\.)+[A-Z]{2,}$/i;

export type CloudWifiVenueType = (typeof CLOUDWIFI_VENUE_TYPES)[number];
export type CloudWifiBackhaul = (typeof CLOUDWIFI_BACKHAUL_TYPES)[number];
export type CloudWifiTierId = (typeof CLOUDWIFI_TIER_IDS)[number];

export interface TierRecommendationInput {
  readonly venueType: CloudWifiVenueType;
  readonly floorArea: number;
  readonly peakUsers: number;
  readonly backhaul: CloudWifiBackhaul;
}

export interface CloudWifiTier {
  readonly id: CloudWifiTierId;
  readonly name: string;
  readonly areaLabel: string;
  readonly apRange: string;
  readonly startingPrice: number;
  readonly includedAccessPoints: number;
}

export interface TierRecommendation extends TierRecommendationInput {
  readonly tier: CloudWifiTierId;
  readonly tierDetails: CloudWifiTier;
  readonly reasons: readonly string[];
  readonly backhaulGuidance: string | null;
}
