import { describe, expect, it } from '@jest/globals';
import { buildPatternKey } from '@/lib/billing/cycle-match/pattern-key';

describe('buildPatternKey', () => {
  it('clusters under-contract misses by leak type', () => {
    expect(buildPatternKey({ leakType: 'under_contract', packageName: 'Fibre' })).toBe(
      'under_contract'
    );
  });

  it('returns null when there is no leak', () => {
    expect(buildPatternKey({ leakType: null, packageName: 'Fibre' })).toBeNull();
  });
});
