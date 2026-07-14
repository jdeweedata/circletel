import { CLOUDWIFI_TIER_IDS } from './types';
import type {
  CloudWifiBackhaul,
  CloudWifiTier,
  CloudWifiTierId,
  CloudWifiVenueType,
  TierRecommendation,
  TierRecommendationInput,
} from './types';

export const CLOUDWIFI_TIERS = [
  {
    id: 'essential',
    name: 'Essential',
    areaLabel: 'Up to 300 sqm',
    apRange: '1–2 APs',
    startingPrice: 1499,
    includedAccessPoints: 2,
  },
  {
    id: 'professional',
    name: 'Professional',
    areaLabel: '300–800 sqm',
    apRange: '3–5 APs',
    startingPrice: 3499,
    includedAccessPoints: 5,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    areaLabel: '800–2,000 sqm',
    apRange: '6–12 APs',
    startingPrice: 7999,
    includedAccessPoints: 12,
  },
  {
    id: 'campus',
    name: 'Campus',
    areaLabel: 'Large sites and multiple buildings',
    apRange: '12–30+ APs',
    startingPrice: 14999,
    includedAccessPoints: 20,
  },
] as const satisfies readonly CloudWifiTier[];

const AREA_UPPER_BOUNDS = [300, 800, 2000] as const;
const USER_UPPER_BOUNDS = [50, 150, 400] as const;
const DENSITY_VENUE_TYPES: readonly CloudWifiVenueType[] = [
  'hospitality',
  'retail',
  'education',
];
const DENSITY_THRESHOLDS: Partial<Record<CloudWifiTierId, number>> = {
  essential: 38,
  professional: 126,
  enterprise: 338,
};

function tierForValue(value: number, upperBounds: readonly number[]): CloudWifiTierId {
  const matchingIndex = upperBounds.findIndex((upperBound) => value <= upperBound);
  const tierIndex = matchingIndex === -1 ? CLOUDWIFI_TIER_IDS.length - 1 : matchingIndex;
  return CLOUDWIFI_TIER_IDS[tierIndex];
}

function tierIndex(tier: CloudWifiTierId): number {
  return CLOUDWIFI_TIER_IDS.indexOf(tier);
}

export function tierForArea(floorArea: number): CloudWifiTierId {
  return tierForValue(floorArea, AREA_UPPER_BOUNDS);
}

export function tierForUsers(peakUsers: number): CloudWifiTierId {
  return tierForValue(peakUsers, USER_UPPER_BOUNDS);
}

export function promoteTier(tier: CloudWifiTierId): CloudWifiTierId {
  const promotedIndex = Math.min(tierIndex(tier) + 1, CLOUDWIFI_TIER_IDS.length - 1);
  return CLOUDWIFI_TIER_IDS[promotedIndex];
}

function backhaulGuidance(backhaul: CloudWifiBackhaul): string | null {
  if (backhaul === 'fixed_wireless' || backhaul === '5g') {
    return 'Plan for resilience and confirm available backhaul throughput during the site survey.';
  }

  if (backhaul === 'lte' || backhaul === 'unknown') {
    return 'A site survey must confirm that the available backhaul can support the expected users.';
  }

  return null;
}

export function recommendCloudWifiTier(input: TierRecommendationInput): TierRecommendation {
  const areaTier = tierForArea(input.floorArea);
  const userTier = tierForUsers(input.peakUsers);
  const areaTierIndex = tierIndex(areaTier);
  const userTierIndex = tierIndex(userTier);
  const baseTierIndex = Math.max(areaTierIndex, userTierIndex);
  const baseTier = CLOUDWIFI_TIER_IDS[baseTierIndex];
  const reasons: string[] = [];

  if (areaTierIndex > userTierIndex) {
    reasons.push(`Floor area requires the ${CLOUDWIFI_TIERS[baseTierIndex].name} tier.`);
  } else if (userTierIndex > areaTierIndex) {
    reasons.push(`Peak users require the ${CLOUDWIFI_TIERS[baseTierIndex].name} tier.`);
  } else {
    reasons.push(`Floor area and peak users both support the ${CLOUDWIFI_TIERS[baseTierIndex].name} tier.`);
  }

  let recommendedTier = baseTier;
  const densityThreshold = DENSITY_THRESHOLDS[baseTier];
  const hasUpperQuartileDensity =
    DENSITY_VENUE_TYPES.includes(input.venueType) &&
    densityThreshold !== undefined &&
    input.peakUsers >= densityThreshold;
  const hasPublicVenueDensity = input.venueType === 'public_venue' && input.peakUsers > 100;

  if (hasUpperQuartileDensity || hasPublicVenueDensity) {
    const promotedTier = promoteTier(baseTier);
    if (promotedTier !== baseTier) {
      recommendedTier = promotedTier;
      const densityReason = hasPublicVenueDensity ? 'Public-venue density' : 'User density';
      reasons.push(
        `${densityReason} promotes the recommendation to ${CLOUDWIFI_TIERS[tierIndex(promotedTier)].name}.`
      );
    }
  }

  return {
    ...input,
    tier: recommendedTier,
    tierDetails: CLOUDWIFI_TIERS[tierIndex(recommendedTier)],
    reasons,
    backhaulGuidance: backhaulGuidance(input.backhaul),
  };
}
