import { describe, expect, it } from '@jest/globals';
import { formatExceptionCode, formatServiceDisplayId } from '@/lib/billing/cycle-match/format';

describe('formatServiceDisplayId', () => {
  it('prefixes SVC- and last 5 hex chars of the UUID', () => {
    expect(formatServiceDisplayId('a1b2c3d4-e5f6-7890-abcd-ef1234567890')).toBe(
      'SVC-67890'
    );
  });
});

describe('formatExceptionCode', () => {
  it('pads EXC- to four digits', () => {
    expect(formatExceptionCode(2418)).toBe('EXC-2418');
    expect(formatExceptionCode(7)).toBe('EXC-0007');
  });
});
