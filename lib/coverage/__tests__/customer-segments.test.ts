import {
  normalizeSegment,
  customerTypesForSegment,
  sortPackagesForSegment,
  isQuoteOnlyPackage,
  heroSegmentToUrlType,
} from '../customer-segments';

describe('normalizeSegment', () => {
  it('passes through valid segments', () => {
    expect(normalizeSegment('residential')).toBe('residential');
    expect(normalizeSegment('wfh')).toBe('wfh');
    expect(normalizeSegment('business')).toBe('business');
  });

  it('falls back to residential for null, undefined, and unknown values', () => {
    expect(normalizeSegment(null)).toBe('residential');
    expect(normalizeSegment(undefined)).toBe('residential');
    expect(normalizeSegment('')).toBe('residential');
    expect(normalizeSegment('soho')).toBe('residential');
    expect(normalizeSegment('BUSINESS')).toBe('residential');
  });
});

describe('customerTypesForSegment', () => {
  it('residential sees consumer and both', () => {
    expect(customerTypesForSegment('residential')).toEqual(['consumer', 'both']);
  });

  it('wfh sees soho, consumer, and both', () => {
    expect(customerTypesForSegment('wfh')).toEqual(['soho', 'consumer', 'both']);
  });

  it('business sees business and both', () => {
    expect(customerTypesForSegment('business')).toEqual(['business', 'both']);
  });
});

describe('sortPackagesForSegment', () => {
  const pkgs = [
    { id: 'a', customer_type: 'consumer', price: 100 },
    { id: 'b', customer_type: 'soho', price: 900 },
    { id: 'c', customer_type: 'consumer', price: 50 },
    { id: 'd', customer_type: 'soho', price: 700 },
  ];

  it('puts soho packages first (each group price-ascending) for wfh', () => {
    const sorted = sortPackagesForSegment('wfh', pkgs);
    expect(sorted.map((p) => p.id)).toEqual(['d', 'b', 'c', 'a']);
  });

  it('does not mutate the input array', () => {
    const copy = [...pkgs];
    sortPackagesForSegment('wfh', pkgs);
    expect(pkgs).toEqual(copy);
  });

  it('returns packages unchanged for residential and business', () => {
    expect(sortPackagesForSegment('residential', pkgs)).toEqual(pkgs);
    expect(sortPackagesForSegment('business', pkgs)).toEqual(pkgs);
  });
});

describe('isQuoteOnlyPackage', () => {
  it('is true only for business packages', () => {
    expect(isQuoteOnlyPackage({ customer_type: 'business' })).toBe(true);
    expect(isQuoteOnlyPackage({ customer_type: 'soho' })).toBe(false);
    expect(isQuoteOnlyPackage({ customer_type: 'consumer' })).toBe(false);
    expect(isQuoteOnlyPackage({ customer_type: 'both' })).toBe(false);
    expect(isQuoteOnlyPackage({})).toBe(false);
  });
});

describe('heroSegmentToUrlType', () => {
  it('maps hero segments to URL types', () => {
    expect(heroSegmentToUrlType('home')).toBe('residential');
    expect(heroSegmentToUrlType('wfh')).toBe('wfh');
    expect(heroSegmentToUrlType('business')).toBe('business');
  });
});
