import { resolveStaffWifi } from '@/lib/usage-reports/staff-wifi';

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
