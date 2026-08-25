import { describe, expect, it } from '@jest/globals';
import { normalizePlatformAmounts } from '@/lib/billing/cycle-match/normalize-amounts';

describe('normalizePlatformAmounts', () => {
  it('backs VAT out of a consumer inclusive list price', () => {
    const amounts = normalizePlatformAmounts(1899, {
      package_name: 'Vumatel Business 200/200',
    });
    expect(amounts.inclVat).toBe(1899);
    expect(amounts.exVat).toBe(1651.3);
  });

  it('adds VAT to Unjani exclusive MSA price', () => {
    const amounts = normalizePlatformAmounts(450, {
      package_name: 'Unjani Managed Connectivity',
    });
    expect(amounts.exVat).toBe(450);
    expect(amounts.inclVat).toBe(517.5);
  });
});
