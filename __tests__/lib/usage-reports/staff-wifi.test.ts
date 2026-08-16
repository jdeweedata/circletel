import {
  aggregateStaffUsageByDay,
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

describe('aggregateStaffUsageByDay', () => {
  it('sums hours on the same Johannesburg day', () => {
    expect(
      aggregateStaffUsageByDay([
        { hour_bucket: '2026-08-15T22:00:00.000Z', rx_bytes: 100, tx_bytes: 20 },
        { hour_bucket: '2026-08-16T06:00:00.000Z', rx_bytes: 50, tx_bytes: 10 },
        { hour_bucket: '2026-08-16T10:00:00.000Z', rx_bytes: 5, tx_bytes: 5 },
      ])
    ).toEqual([
      { date: '2026-08-16', rxBytes: 155, txBytes: 35, totalBytes: 190 },
    ]);
  });

  it('keeps separate days and returns empty for no rows', () => {
    expect(aggregateStaffUsageByDay([])).toEqual([]);
    expect(
      aggregateStaffUsageByDay([
        { hour_bucket: '2026-08-14T10:00:00.000Z', rx_bytes: 10, tx_bytes: 0 },
        { hour_bucket: '2026-08-15T10:00:00.000Z', rx_bytes: 20, tx_bytes: 0 },
      ])
    ).toEqual([
      { date: '2026-08-14', rxBytes: 10, txBytes: 0, totalBytes: 10 },
      { date: '2026-08-15', rxBytes: 20, txBytes: 0, totalBytes: 20 },
    ]);
  });
});
