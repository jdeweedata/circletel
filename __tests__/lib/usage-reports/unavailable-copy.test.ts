import { describeCoreUnavailable } from '@/lib/usage-reports/unavailable-copy';
import type { CoreUnavailableDiagnosis } from '@/lib/usage-reports/types';

const ok: CoreUnavailableDiagnosis = {
  interstellioMapped: true,
  ruijieLinked: true,
  ruijieCoversWindow: true,
  ruijiePerDeviceSeries: true,
};

describe('describeCoreUnavailable', () => {
  it('names the missing AP link and points at a screen that can fix it', () => {
    const causes = describeCoreUnavailable({
      ...ok,
      interstellioMapped: false,
      ruijieLinked: false,
    });

    const apLink = causes.find((cause) => cause.key === 'no_ap_link');
    expect(apLink).toBeDefined();
    expect(apLink?.href).toBe('/admin/network/devices');
  });

  it('does not offer a link for the Interstellio mapping — no admin screen exists', () => {
    const [cause] = describeCoreUnavailable({ ...ok, interstellioMapped: false });

    expect(cause.key).toBe('no_interstellio');
    expect(cause.href).toBeUndefined();
    // Naming the column is the honest way to hand an ops person the real fix.
    expect(cause.unlock).toMatch(/interstellio_subscriber_id/);
  });

  it('lists every applicable cause, not just the first', () => {
    const causes = describeCoreUnavailable({
      interstellioMapped: false,
      ruijieLinked: false,
      ruijieCoversWindow: false,
      ruijiePerDeviceSeries: false,
    });

    expect(causes.map((cause) => cause.key)).toEqual(
      expect.arrayContaining(['no_interstellio', 'no_ap_link'])
    );
  });

  it('explains retention rather than instructing, since no admin can fix it', () => {
    const causes = describeCoreUnavailable({
      ...ok,
      interstellioMapped: false,
      ruijieCoversWindow: false,
    });

    const retention = causes.find((cause) => cause.key === 'window_uncovered');
    expect(retention).toBeDefined();
    expect(retention?.href).toBeUndefined();
    expect(retention?.actionable).toBe(false);
  });

  it('distinguishes a shared group series from an unlinked device', () => {
    const causes = describeCoreUnavailable({
      ...ok,
      interstellioMapped: false,
      ruijiePerDeviceSeries: false,
    });

    const shared = causes.find((cause) => cause.key === 'group_only');
    expect(shared).toBeDefined();
    // The device IS linked — telling someone to link one would be wrong.
    expect(causes.some((cause) => cause.key === 'no_ap_link')).toBe(false);
    expect(shared?.actionable).toBe(false);
  });

  it('returns nothing when every source is healthy', () => {
    expect(describeCoreUnavailable(ok)).toEqual([]);
  });

  it('says nothing about Ruijie when Interstellio is mapped and would be used', () => {
    // Interstellio mapped means the report has a source; Ruijie gaps are moot.
    const causes = describeCoreUnavailable({
      ...ok,
      ruijieLinked: false,
      ruijieCoversWindow: false,
      ruijiePerDeviceSeries: false,
    });

    expect(causes).toEqual([]);
  });
});
