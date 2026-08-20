import { describe, it, expect } from '@jest/globals';
import {
  VAT_RATE,
  addVat,
  removeVat,
  packagePriceIncludesVat,
  customerInclVat,
  customerExclVat,
} from '@/lib/billing/vat';

describe('vat helper', () => {
  it('VAT_RATE is 0.15', () => {
    expect(VAT_RATE).toBe(0.15);
  });
  it('addVat grosses up ex-VAT to incl-VAT, rounded to 2dp', () => {
    expect(addVat(1899)).toBe(2183.85);   // 1899 * 1.15 = 2183.85
    expect(addVat(499)).toBe(573.85);     // 499 * 1.15 = 573.85
    expect(addVat(0)).toBe(0);
  });
  it('rounds half-cent correctly', () => {
    expect(addVat(100.005)).toBe(115.01); // 100.005*1.15=115.00575 -> 115.01
  });
  it('removeVat backs VAT out of inclusive amounts', () => {
    expect(removeVat(450)).toBe(391.3);
    expect(removeVat(899)).toBe(781.74);
  });
});

describe('packagePriceIncludesVat', () => {
  it('is true only when metadata.price_includes_vat is true', () => {
    expect(packagePriceIncludesVat({ price_includes_vat: true })).toBe(true);
    expect(packagePriceIncludesVat({ price_includes_vat: false })).toBe(false);
    expect(packagePriceIncludesVat({})).toBe(false);
    expect(packagePriceIncludesVat(null)).toBe(false);
    expect(packagePriceIncludesVat(undefined)).toBe(false);
  });
});

describe('customerInclVat / customerExclVat', () => {
  it('does not add 15% on Helios CircleConnect prices that already include VAT', () => {
    expect(customerInclVat(489, true)).toBe(489);
    expect(customerInclVat(649, true)).toBe(649);
    expect(customerInclVat(549, true)).toBe(549);
    expect(customerExclVat(489, true)).toBe(425.22);
  });

  it('adds 15% and rounds to the nearest rand for ex-VAT catalogue prices', () => {
    expect(customerInclVat(781.74, false)).toBe(899);
    expect(customerInclVat(781.74)).toBe(899);
    expect(customerExclVat(781.74, false)).toBe(781.74);
  });
});
