// __tests__/lib/billing/modernist/format-za.test.ts
import { describe, it, expect } from '@jest/globals';
import { formatRandZa, formatRandZaCents } from '@/lib/billing/modernist/format-za';

describe('formatRandZa', () => {
  it('formats whole rands with spaces', () => {
    expect(formatRandZa(16984)).toBe('R 16 984');
  });
  it('formats zero', () => {
    expect(formatRandZa(0)).toBe('R 0');
  });
});

describe('formatRandZaCents', () => {
  it('uses decimal comma', () => {
    expect(formatRandZaCents(517.5)).toBe('R 517,50');
  });
});
