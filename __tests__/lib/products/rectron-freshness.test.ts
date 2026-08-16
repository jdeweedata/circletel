import { isRectronCatalogueFresh } from '@/lib/products/rectron-freshness';

describe('isRectronCatalogueFresh', () => {
  it('requires an 11 Aug 2026 or later sync', () => {
    expect(isRectronCatalogueFresh(null)).toBe(false);
    expect(isRectronCatalogueFresh('2026-07-29T12:00:00Z')).toBe(false);
    expect(isRectronCatalogueFresh('2026-08-11T08:11:00Z')).toBe(true);
    expect(isRectronCatalogueFresh('2026-08-16T18:00:00Z')).toBe(true);
  });
});
