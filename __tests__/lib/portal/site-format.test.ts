import {
  formatClinicShortName,
  formatSiteCode,
} from '@/lib/portal/site-format';

describe('formatClinicShortName', () => {
  it('strips the Unjani Clinic prefix', () => {
    expect(formatClinicShortName('Unjani Clinic - Alexandra')).toBe('Alexandra');
  });

  it('leaves names without the prefix unchanged', () => {
    expect(formatClinicShortName('Heidelberg')).toBe('Heidelberg');
  });
});

describe('formatSiteCode', () => {
  it('prefers the stored site code', () => {
    expect(formatSiteCode({ site_code: 'UNJ-032', site_number: 1 })).toBe(
      'UNJ-032'
    );
  });

  it('falls back to a padded UNJ number', () => {
    expect(formatSiteCode({ site_code: null, site_number: 8 })).toBe('UNJ-008');
  });
});
