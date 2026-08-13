import {
  isLegacyPortalPath,
  isUnjaniAppPath,
  isUnjaniCorporateCode,
  parsePortalAccountLane,
  safeUnjaniRedirect,
} from '@/lib/portal/paths';

describe('Unjani Connect paths', () => {
  it('recognises the Unjani app prefix', () => {
    expect(isUnjaniAppPath('/unjani')).toBe(true);
    expect(isUnjaniAppPath('/unjani/sites')).toBe(true);
    expect(isUnjaniAppPath('/portal')).toBe(false);
    expect(isUnjaniAppPath('/unjani-connect')).toBe(false);
  });

  it('maps legacy /portal bookmarks onto /unjani', () => {
    expect(safeUnjaniRedirect(null)).toBe('/unjani');
    expect(safeUnjaniRedirect('/portal')).toBe('/unjani');
    expect(safeUnjaniRedirect('/portal/sites/abc')).toBe('/unjani/sites/abc');
    expect(safeUnjaniRedirect('/unjani/coverage')).toBe('/unjani/coverage');
    expect(safeUnjaniRedirect('https://evil.example')).toBe('/unjani');
  });

  it('treats the old business login tab as Unjani', () => {
    expect(parsePortalAccountLane('business')).toBe('unjani');
    expect(parsePortalAccountLane('unjani')).toBe('unjani');
    expect(parsePortalAccountLane(null)).toBe('personal');
  });

  it('only allows the Unjani corporate code', () => {
    expect(isUnjaniCorporateCode('UNJ')).toBe(true);
    expect(isUnjaniCorporateCode('unj')).toBe(true);
    expect(isUnjaniCorporateCode('ACME')).toBe(false);
    expect(isLegacyPortalPath('/portal/login')).toBe(true);
  });
});
