import { describe, it, expect } from '@jest/globals';
import { VAT_RATE, addVat, removeVat } from '@/lib/billing/vat';

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
