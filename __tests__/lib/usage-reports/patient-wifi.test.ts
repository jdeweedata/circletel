import {
  parseTdxPatientCsv,
  resolvePatientWifi,
} from '@/lib/usage-reports/patient-wifi';

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
  it('uses Free Clinic SSID rollups when present', () => {
    expect(
      resolvePatientWifi({
        apLinkedToSite: true,
        hourRows: [
          { rx_bytes: 800_000_000, tx_bytes: 200_000_000 },
          { rx_bytes: 200_000_000, tx_bytes: 0 },
        ],
        tdxRow: null,
      })
    ).toEqual({
      kind: 'available',
      source: 'ruijie_ssid',
      uniqueUsers: null,
      loginSessions: null,
      downloadGb: 1.2,
      rxBytes: 1_000_000_000,
      txBytes: 200_000_000,
      totalBytes: 1_200_000_000,
    });
  });

  it('merges TDX users/sessions with Ruijie GB when both exist', () => {
    const state = resolvePatientWifi({
      apLinkedToSite: true,
      hourRows: [{ rx_bytes: 500_000_000, tx_bytes: 0 }],
      tdxRow: {
        siteCode: 'UNJ-001',
        uniqueUsers: 12,
        loginSessions: 40,
        downloadGb: 99,
      },
    });
    expect(state).toMatchObject({
      kind: 'available',
      source: 'combined',
      uniqueUsers: 12,
      loginSessions: 40,
      downloadGb: 0.5,
      totalBytes: 500_000_000,
    });
  });

  it('falls back to TDX CSV when no Free SSID samples', () => {
    expect(
      resolvePatientWifi({
        apLinkedToSite: true,
        hourRows: [],
        tdxRow: {
          siteCode: 'UNJ-001',
          uniqueUsers: 3,
          loginSessions: 5,
          downloadGb: 2.5,
        },
      })
    ).toEqual({
      kind: 'available',
      source: 'tdx_csv',
      uniqueUsers: 3,
      loginSessions: 5,
      downloadGb: 2.5,
      rxBytes: null,
      txBytes: null,
      totalBytes: null,
    });
  });

  it('no_samples when AP linked but no Free SSID and no TDX', () => {
    expect(
      resolvePatientWifi({
        apLinkedToSite: true,
        hourRows: [],
        tdxRow: null,
      }).kind
    ).toBe('no_samples');
  });

  it('ap_unlinked when site has no AP and no TDX', () => {
    expect(
      resolvePatientWifi({
        apLinkedToSite: false,
        hourRows: [],
        tdxRow: null,
      }).kind
    ).toBe('ap_unlinked');
  });
});
