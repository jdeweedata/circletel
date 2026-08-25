import {
  getCoveragePackageInclusions,
  getCoveragePromoBadge,
  groupCoveragePackagesByTerm,
} from '@/lib/products/coverage-package-inclusions';
import { TERMS_AND_CONDITIONS_LABEL } from '@/lib/products/terms-info';

const contract35 = {
  sku: 'CC-5G-CON-035',
  name: 'CircleConnect 5G 35 Mbps',
  speed_down: 35,
  speed_up: 10,
  features: [
    'Uncapped data',
    'Guaranteed 35 Mbps download speed',
    '10 Mbps upload speed',
    'Free Huawei 5G CPE router included',
    'Family WiFi Ready - Up to 64 devices',
    'Home Office Compatible - Video calls & cloud apps',
    'Streaming Optimized - HD video streaming',
    '24-month contract',
    'Easy self-install setup',
  ],
  metadata: {
    router_included: true,
    router_model: 'Huawei 5G CPE',
    contract_type: '24-month-contract',
    contract_duration: '24 Months',
    data_cap: 'Uncapped (500GB FUP)',
    fup_limit_gb: 500,
  },
};

const simOnly35 = {
  sku: 'CC-5G-M2M-035',
  name: 'CircleConnect 5G 35 Mbps SIM Only',
  speed_down: 35,
  speed_up: 10,
  features: [
    '500 GB monthly data (Fair Usage Policy)',
    'Guaranteed 35 Mbps download speed',
    '10 Mbps upload speed',
    'Month-to-month, no lock-in',
    'SIM Only - BYO compatible 5G router',
    'Cancel anytime',
  ],
  metadata: {
    router_included: false,
    contract_type: 'month-to-month',
    contract_duration: 'Month-to-Month',
    data_cap: '500GB FUP',
    fup_limit_gb: 500,
  },
};

const fwa500 = {
  sku: 'CC-5G-M2M-FWA',
  name: 'CircleConnect 5G FWA 500 GB',
  speed_down: 0,
  speed_up: 0,
  features: [
    '500 GB monthly data (hard cap)',
    'No speed limit - full 5G network speeds',
    'Month-to-month, no lock-in',
    'SIM Only - BYO compatible 5G router',
    'Cancel anytime',
  ],
  metadata: {
    router_included: false,
    contract_type: 'month-to-month',
    capped: true,
    data_cap: '500GB hard cap',
    data_cap_gb: 500,
  },
};

describe('getCoveragePackageInclusions', () => {
  it('lists router, 500 GB FUP, and 35/10 speeds for the 35 Mbps contract', () => {
    const texts = getCoveragePackageInclusions(contract35).map((item) => item.text);
    expect(texts).toEqual(
      expect.arrayContaining([
        '24-month + router',
        'Free Huawei 5G CPE router included',
        'Uncapped data with 500GB Fair Usage Policy',
        '35 Mbps download / 10 Mbps upload',
        'Family WiFi Ready - Up to 64 devices',
        TERMS_AND_CONDITIONS_LABEL,
      ])
    );
    expect(texts.some((text) => /\b0\s*Mbps\b/i.test(text))).toBe(false);
  });

  it('lists BYO router and no lock-in for SIM-only', () => {
    const texts = getCoveragePackageInclusions(simOnly35).map((item) => item.text);
    expect(texts).toEqual(
      expect.arrayContaining([
        'Month-to-month SIM only',
        'SIM only — bring your own compatible 5G router',
        'Uncapped data with 500GB Fair Usage Policy',
        '35 Mbps download / 10 Mbps upload',
      ])
    );
  });

  it('shows 500 GB hard cap for FWA and never 0 Mbps', () => {
    const texts = getCoveragePackageInclusions(fwa500).map((item) => item.text);
    expect(texts).toEqual(
      expect.arrayContaining([
        'Month-to-month SIM only',
        '500 GB monthly hard cap',
        'SIM only — bring your own compatible 5G router',
      ])
    );
    expect(texts.some((text) => /\b0\s*Mbps\b/i.test(text))).toBe(false);
  });
});

describe('getCoveragePromoBadge', () => {
  it('uses Promo to 30 Sep for OP19627 SKUs instead of 3-MONTH PROMO', () => {
    expect(getCoveragePromoBadge('CC-5G-CON-060', 649, 3)).toBe('Promo to 30 Sep');
    expect(getCoveragePromoBadge('CC-OP-UNC-20', 549, 3)).toBe('Promo to 30 Sep');
  });

  it('falls back to a generic promo label for other discounted SKUs', () => {
    expect(getCoveragePromoBadge('CC-5G-CON-035', undefined, 3)).toBeUndefined();
    expect(getCoveragePromoBadge('OTHER', 100, 2)).toBe('PROMO');
  });
});

describe('groupCoveragePackagesByTerm', () => {
  it('splits contract+router from SIM-only', () => {
    const grouped = groupCoveragePackagesByTerm([contract35, simOnly35, fwa500]);
    expect(grouped.contractRouter.map((pkg) => pkg.sku)).toEqual(['CC-5G-CON-035']);
    expect(grouped.simOnly.map((pkg) => pkg.sku)).toEqual(['CC-5G-M2M-035', 'CC-5G-M2M-FWA']);
    expect(grouped.other).toEqual([]);
  });
});
