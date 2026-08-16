import {
  aggregateStaffUsageBySite,
  resolveStaffWifi,
} from '@/lib/usage-reports/staff-wifi';

describe('resolveStaffWifi', () => {
  it('ap_unlinked when no device linked to site', () => {
    expect(resolveStaffWifi({ apLinkedToSite: false, hourRows: [] }).kind).toBe('ap_unlinked');
  });

  it('no_samples when linked but empty rows', () => {
    expect(resolveStaffWifi({ apLinkedToSite: true, hourRows: [] }).kind).toBe('no_samples');
  });

  it('sums rx+tx for available', () => {
    const s = resolveStaffWifi({
      apLinkedToSite: true,
      hourRows: [
        { rx_bytes: 100, tx_bytes: 40 },
        { rx_bytes: 50, tx_bytes: 10 },
      ],
    });
    expect(s).toEqual({
      kind: 'available',
      rxBytes: 150,
      txBytes: 50,
      totalBytes: 200,
    });
  });
});

describe('aggregateStaffUsageBySite', () => {
  it('sums two sites independently', () => {
    expect(
      aggregateStaffUsageBySite([
        { corporate_site_id: 'delmas', rx_bytes: 100, tx_bytes: 20 },
        { corporate_site_id: 'lens', rx_bytes: 50, tx_bytes: 10 },
        { corporate_site_id: 'delmas', rx_bytes: 5, tx_bytes: 5 },
      ])
    ).toEqual({
      delmas: { rxBytes: 105, txBytes: 25, totalBytes: 130 },
      lens: { rxBytes: 50, txBytes: 10, totalBytes: 60 },
    });
  });

  it('returns an empty map when there are no rows', () => {
    expect(aggregateStaffUsageBySite([])).toEqual({});
  });

  it('skips rows without a site id', () => {
    expect(
      aggregateStaffUsageBySite([{ corporate_site_id: null, rx_bytes: 10, tx_bytes: 10 }])
    ).toEqual({});
  });
});
