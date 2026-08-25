import { isOpenQuoteStatusFilter } from '@/lib/quotes/expire-stale-quotes';

describe('isOpenQuoteStatusFilter', () => {
  it('treats missing and open as the default clean book', () => {
    expect(isOpenQuoteStatusFilter(null)).toBe(true);
    expect(isOpenQuoteStatusFilter('open')).toBe(true);
  });

  it('lets all and concrete statuses through to the caller', () => {
    expect(isOpenQuoteStatusFilter('all')).toBe(false);
    expect(isOpenQuoteStatusFilter('expired')).toBe(false);
    expect(isOpenQuoteStatusFilter('draft')).toBe(false);
  });
});
