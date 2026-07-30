import { describe, it, expect } from '@jest/globals';
import { resolveReconWindow } from '@/lib/billing/recon-hub/window';

describe('resolveReconWindow', () => {
  const now = new Date('2026-07-30T12:00:00.000Z');

  it('today is the UTC calendar day of now [start, next midnight)', () => {
    const w = resolveReconWindow('today', now);
    expect(w.from).toBe('2026-07-30T00:00:00.000Z');
    expect(w.to).toBe('2026-07-31T00:00:00.000Z');
  });

  it('yesterday is the UTC calendar day before now', () => {
    const w = resolveReconWindow('yesterday', now);
    expect(w.from.startsWith('2026-07-29')).toBe(true);
    expect(w.to.startsWith('2026-07-30')).toBe(true);
    expect(w.from).toBe('2026-07-29T00:00:00.000Z');
    expect(w.to).toBe('2026-07-30T00:00:00.000Z');
  });

  it('48h is now minus 48 hours through now', () => {
    const w = resolveReconWindow('48h', now);
    expect(new Date(w.to).getTime()).toBe(now.getTime());
    expect(new Date(w.from).getTime()).toBe(now.getTime() - 48 * 3600 * 1000);
  });
});
