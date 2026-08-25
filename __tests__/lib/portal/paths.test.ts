import {
  homeForOrganisation,
  isPortalAppPath,
  isUnjaniAppPath,
  isUnjaniCorporateCode,
  parsePortalAccountLane,
  safeBusinessRedirect,
} from '@/lib/portal/paths';

describe('business and Unjani app paths', () => {
  it('recognises the Unjani app prefix', () => {
    expect(isUnjaniAppPath('/unjani')).toBe(true);
    expect(isUnjaniAppPath('/unjani/sites')).toBe(true);
    expect(isUnjaniAppPath('/portal')).toBe(false);
    expect(isUnjaniAppPath('/unjani-connect')).toBe(false);
  });

  it('recognises the generic portal prefix', () => {
    expect(isPortalAppPath('/portal')).toBe(true);
    expect(isPortalAppPath('/portal/sites')).toBe(true);
    expect(isPortalAppPath('/unjani')).toBe(false);
  });

  it('sends UNJ to /unjani and other orgs to /portal', () => {
    expect(homeForOrganisation('UNJ')).toBe('/unjani');
    expect(homeForOrganisation('unj')).toBe('/unjani');
    expect(homeForOrganisation('ACME')).toBe('/portal');
    expect(homeForOrganisation(null)).toBe('/portal');
  });

  it('keeps a UNJ redirect inside /unjani', () => {
    expect(safeBusinessRedirect(null, 'UNJ')).toBe('/unjani');
    expect(safeBusinessRedirect('/unjani/coverage', 'UNJ')).toBe(
      '/unjani/coverage'
    );
    expect(safeBusinessRedirect('/portal/sites/abc', 'UNJ')).toBe(
      '/unjani/sites/abc'
    );
  });

  it('does not send a non-UNJ user to /unjani', () => {
    expect(safeBusinessRedirect('/unjani/coverage', 'ACME')).toBe('/portal');
    expect(safeBusinessRedirect('/unjani/sites/abc', 'ACME')).toBe(
      '/portal/sites/abc'
    );
    expect(safeBusinessRedirect('/portal/billing', 'ACME')).toBe(
      '/portal/billing'
    );
    expect(safeBusinessRedirect('https://evil.example', 'ACME')).toBe(
      '/portal'
    );
  });

  it('treats the Unjani login query as the Business tab', () => {
    expect(parsePortalAccountLane('business')).toBe('business');
    expect(parsePortalAccountLane('unjani')).toBe('business');
    expect(parsePortalAccountLane(null)).toBe('personal');
  });

  it('identifies the Unjani corporate code', () => {
    expect(isUnjaniCorporateCode('UNJ')).toBe(true);
    expect(isUnjaniCorporateCode('unj')).toBe(true);
    expect(isUnjaniCorporateCode('ACME')).toBe(false);
  });
});
