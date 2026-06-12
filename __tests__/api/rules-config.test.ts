/**
 * Rules Config Sanitizer Tests
 *
 * Tests the sanitizeRuleConfig function that validates and cleans
 * Rules Studio configuration before storage.
 */

import { sanitizeRuleConfig } from '@/lib/products/rules/config-sanitizer';

describe('sanitizeRuleConfig', () => {
  it('keeps valid numeric thresholds', () => {
    expect(sanitizeRuleConfig({ marginFloorPct: 30 })).toEqual({ marginFloorPct: 30 });
  });

  it('drops unknown keys, out-of-range and non-numeric values', () => {
    expect(
      sanitizeRuleConfig({ marginFloorPct: 200, bundleMarginFloorPct: 'x', evil: true })
    ).toEqual({});
  });

  it('handles null/garbage input', () => {
    expect(sanitizeRuleConfig(null)).toEqual({});
    expect(sanitizeRuleConfig('nope')).toEqual({});
  });
});
