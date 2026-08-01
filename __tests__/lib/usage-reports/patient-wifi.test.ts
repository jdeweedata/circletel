import { parseTdxPatientCsv, resolvePatientWifi } from '@/lib/usage-reports/patient-wifi';

describe('parseTdxPatientCsv', () => {
  it('maps Looker columns case-insensitively', () => {
    const csv = `Site Code,Unique Users,Sessions,Download GB\nCT-UNJ-002,120,400,12.5\n`;
    const rows = parseTdxPatientCsv(csv);
    expect(rows[0]).toMatchObject({
      siteCode: 'CT-UNJ-002',
      uniqueUsers: 120,
      loginSessions: 400,
      downloadGb: 12.5,
    });
  });
});

describe('resolvePatientWifi', () => {
  it('awaiting_export when no row for site', () => {
    expect(resolvePatientWifi(null).kind).toBe('awaiting_export');
  });
});
