import {
  CLOUDWIFI_TIERS,
  recommendCloudWifiTier,
} from '@/lib/cloudwifi/tier-recommendation';
import type {
  CloudWifiBackhaul,
  CloudWifiTier,
  CloudWifiTierId,
  CloudWifiVenueType,
  TierRecommendation,
} from '@/lib/cloudwifi/types';

type Equal<X, Y> =
  (<T>() => T extends X ? 1 : 2) extends
  (<T>() => T extends Y ? 1 : 2) ? true : false;
type Assert<T extends true> = T;
type CloudWifiTierIsReadonly = Assert<Equal<CloudWifiTier, Readonly<CloudWifiTier>>>;
type TierRecommendationIsReadonly = Assert<
  Equal<TierRecommendation, Readonly<TierRecommendation>>
>;

describe('CloudWiFi tier recommendation', () => {
  describe('catalogue', () => {
    it('exposes the approved tiers in recommendation order', () => {
      expect(CLOUDWIFI_TIERS).toEqual([
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
      ]);
    });
  });

  describe('minimum tier boundaries', () => {
    it.each([
      [300, 'essential'],
      [301, 'professional'],
      [800, 'professional'],
      [801, 'enterprise'],
      [2000, 'enterprise'],
      [2001, 'campus'],
    ] as const)('maps %i sqm to %s', (floorArea, expectedTier) => {
      expect(recommendCloudWifiTier({
        venueType: 'property',
        floorArea,
        peakUsers: 1,
        backhaul: 'fibre',
      }).tier).toBe(expectedTier);
    });

    it.each([
      [50, 'essential'],
      [51, 'professional'],
      [150, 'professional'],
      [151, 'enterprise'],
      [400, 'enterprise'],
      [401, 'campus'],
    ] as const)('maps %i peak users to %s', (peakUsers, expectedTier) => {
      expect(recommendCloudWifiTier({
        venueType: 'property',
        floorArea: 1,
        peakUsers,
        backhaul: 'fibre',
      }).tier).toBe(expectedTier);
    });
  });

  describe('input validation', () => {
    it.each([0, -1, Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY])(
      'rejects invalid floor area %p',
      (floorArea) => {
        const recommend = () => recommendCloudWifiTier({
          venueType: 'property',
          floorArea,
          peakUsers: 20,
          backhaul: 'fibre',
        });

        expect(recommend).toThrow(RangeError);
        expect(recommend).toThrow('floorArea must be a finite number greater than 0.');
      }
    );

    it.each([0, -1, Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY, 1.5])(
      'rejects invalid peak user count %p',
      (peakUsers) => {
        const recommend = () => recommendCloudWifiTier({
          venueType: 'property',
          floorArea: 250,
          peakUsers,
          backhaul: 'fibre',
        });

        expect(recommend).toThrow(RangeError);
        expect(recommend).toThrow('peakUsers must be a finite positive integer.');
      }
    );
  });

  describe('base-tier selection', () => {
    it.each([
      [900, 20, 'enterprise', /floor area/i],
      [250, 151, 'enterprise', /peak users/i],
    ] as const)(
      'uses the higher requirement for %i sqm and %i users',
      (floorArea, peakUsers, expectedTier, decisiveReason) => {
        const result = recommendCloudWifiTier({
          venueType: 'property',
          floorArea,
          peakUsers,
          backhaul: 'fibre',
        });

        expect(result.tier).toBe(expectedTier);
        expect(result.reasons.join(' ')).toMatch(decisiveReason);
      }
    );
  });

  describe('venue-density promotion', () => {
    it.each([
      ['hospitality', 250, 37, 'essential', false],
      ['hospitality', 250, 38, 'professional', true],
      ['retail', 500, 125, 'professional', false],
      ['retail', 500, 126, 'enterprise', true],
      ['education', 1000, 337, 'enterprise', false],
      ['education', 1000, 338, 'campus', true],
    ] as const)(
      'maps %s at %i sqm and %i users to %s at the density boundary',
      (venueType, floorArea, peakUsers, expectedTier, isPromoted) => {
        const result = recommendCloudWifiTier({
          venueType,
          floorArea,
          peakUsers,
          backhaul: 'fibre',
        });

        expect(result.tier).toBe(expectedTier);
        if (isPromoted) {
          expect(result.reasons.join(' ')).toMatch(/density/i);
        } else {
          expect(result.reasons.join(' ')).not.toMatch(/density/i);
        }
      }
    );

    it.each([
      ['healthcare', 40],
      ['property', 40],
    ] as const)('does not apply density promotion to %s venues', (venueType, peakUsers) => {
      expect(recommendCloudWifiTier({
        venueType,
        floorArea: 250,
        peakUsers,
        backhaul: 'fibre',
      }).tier).toBe('essential');
    });

    it.each([
      [100, 'professional'],
      [101, 'enterprise'],
    ] as const)(
      'applies the public-venue promotion only above 100 users (%i)',
      (peakUsers, expectedTier) => {
        const result = recommendCloudWifiTier({
          venueType: 'public_venue',
          floorArea: 250,
          peakUsers,
          backhaul: 'fibre',
        });

        expect(result.tier).toBe(expectedTier);
        if (peakUsers > 100) {
          expect(result.reasons.join(' ')).toMatch(/public-venue density/i);
        }
      }
    );

    it.each([
      ['education', 450],
      ['public_venue', 450],
    ] as const)('never promotes %s beyond Campus', (venueType, peakUsers) => {
      expect(recommendCloudWifiTier({
        venueType,
        floorArea: 2500,
        peakUsers,
        backhaul: 'fibre',
      }).tier).toBe('campus');
    });
  });

  describe('backhaul guidance', () => {
    it.each([
      ['fibre', null],
      ['licensed_wireless', null],
      ['fixed_wireless', /resilience|throughput/i],
      ['5g', /resilience|throughput/i],
      ['lte', /survey/i],
      ['unknown', /survey/i],
    ] as const)('adds the expected guidance for %s', (backhaul, expectedGuidance) => {
      const result = recommendCloudWifiTier({
        venueType: 'property',
        floorArea: 900,
        peakUsers: 80,
        backhaul,
      });

      expect(result.tier).toBe('enterprise');
      if (expectedGuidance === null) {
        expect(result.backhaulGuidance).toBeNull();
      } else {
        expect(result.backhaulGuidance).toMatch(expectedGuidance);
      }
    });
  });

  it('returns the original input and details for the recommended tier', () => {
    const input = {
      venueType: 'healthcare' as CloudWifiVenueType,
      floorArea: 500,
      peakUsers: 75,
      backhaul: 'fixed_wireless' as CloudWifiBackhaul,
    };

    const result = recommendCloudWifiTier(input);

    expect(result).toMatchObject({
      ...input,
      tier: 'professional' as CloudWifiTierId,
      tierDetails: CLOUDWIFI_TIERS[1],
    });
  });

  it('does not expose shared catalogue state through tier details', () => {
    const firstResult = recommendCloudWifiTier({
      venueType: 'property',
      floorArea: 250,
      peakUsers: 20,
      backhaul: 'fibre',
    });
    const canonicalTier = {
      id: 'essential',
      name: 'Essential',
      startingPrice: 1499,
    } as const;

    try {
      Object.assign(firstResult.tierDetails as any, {
        id: 'campus',
        name: 'Tampered',
        startingPrice: 1,
      });

      const nextResult = recommendCloudWifiTier({
        venueType: 'property',
        floorArea: 250,
        peakUsers: 20,
        backhaul: 'fibre',
      });

      expect(nextResult.tierDetails).toMatchObject(canonicalTier);
    } finally {
      Object.assign(firstResult.tierDetails as any, canonicalTier);
    }
  });
});
