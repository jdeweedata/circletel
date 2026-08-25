// __tests__/lib/billing/modernist/aging-read.test.ts
import { describe, it, expect } from '@jest/globals';
import { agingReadCopy } from '@/lib/billing/modernist/aging-read';

describe('agingReadCopy', () => {
  it('returns timing copy when only 1-7d has balance', () => {
    expect(
      agingReadCopy({
        current: 100,
        '1-7d': 50,
        '8-30d': 0,
        '31-60d': 0,
        '61d+': 0,
      })
    ).toMatch(/under eight days/);
  });
});
