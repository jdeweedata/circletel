import {
  evaluateRuijieSyncHealth,
  RUIJIE_SOURCE_RETENTION_HOURS,
  type RuijieSyncHealthInput,
} from '@/lib/network/ruijie-sync-health';

const NOW = new Date('2026-08-02T12:00:00Z');

function hoursAgo(hours: number): string {
  return new Date(NOW.getTime() - hours * 3_600_000).toISOString();
}

const healthy: RuijieSyncHealthInput = {
  now: NOW,
  newestRollupAt: hoursAgo(0.5),
  devicesReportingRecently: 22,
  devicesExpected: 22,
  newestStaffRollupAt: hoursAgo(1),
};

describe('evaluateRuijieSyncHealth', () => {
  it('is healthy when the sync is current and every device is reporting', () => {
    const result = evaluateRuijieSyncHealth(healthy);

    expect(result.status).toBe('healthy');
    expect(result.checks.every((check) => check.status === 'pass')).toBe(true);
  });

  it('warns before the loss window, not after it', () => {
    // The whole point: Ruijie holds ~3 days, so a warning at 4h leaves ~68h to
    // act. Warning only once data was already lost would be useless.
    const result = evaluateRuijieSyncHealth({ ...healthy, newestRollupAt: hoursAgo(4) });
    const freshness = result.checks.find((c) => c.name === 'rollup_freshness');

    expect(freshness?.status).toBe('warn');
    expect(result.status).toBe('warning');
    expect(RUIJIE_SOURCE_RETENTION_HOURS).toBeGreaterThan(48);
  });

  it('escalates to critical well inside the unrecoverable window', () => {
    const result = evaluateRuijieSyncHealth({ ...healthy, newestRollupAt: hoursAgo(10) });
    const freshness = result.checks.find((c) => c.name === 'rollup_freshness');

    expect(freshness?.status).toBe('fail');
    expect(result.status).toBe('critical');
    // Must still leave meaningful runway before the ~72h cliff.
    expect(result.hoursUntilUnrecoverable).toBeGreaterThan(24);
  });

  it('reports how much runway is left before data is unrecoverable', () => {
    const result = evaluateRuijieSyncHealth({ ...healthy, newestRollupAt: hoursAgo(24) });

    expect(result.hoursUntilUnrecoverable).toBeCloseTo(
      RUIJIE_SOURCE_RETENTION_HOURS - 24,
      1
    );
  });

  it('flags a collapse back to one device per group', () => {
    // The #702 regression shape: collection silently reverts to a single
    // representative AP, so rows keep arriving and freshness looks fine.
    const result = evaluateRuijieSyncHealth({
      ...healthy,
      devicesReportingRecently: 3,
      devicesExpected: 22,
    });
    const coverage = result.checks.find((c) => c.name === 'device_coverage');

    expect(coverage?.status).toBe('fail');
    expect(result.status).toBe('critical');
  });

  it('tolerates a few devices being offline', () => {
    const result = evaluateRuijieSyncHealth({
      ...healthy,
      devicesReportingRecently: 20,
      devicesExpected: 22,
    });

    expect(result.checks.find((c) => c.name === 'device_coverage')?.status).toBe('pass');
  });

  it('treats never having collected as critical, not healthy', () => {
    const result = evaluateRuijieSyncHealth({ ...healthy, newestRollupAt: null });

    expect(result.checks.find((c) => c.name === 'rollup_freshness')?.status).toBe('fail');
    expect(result.status).toBe('critical');
    expect(result.hoursUntilUnrecoverable).toBe(0);
  });

  it('warns on stale Staff Wi-Fi without escalating the whole check', () => {
    // Staff sampling is thinner and less critical than core flow — it should be
    // visible but must not mask or inflate a core-traffic problem.
    const result = evaluateRuijieSyncHealth({
      ...healthy,
      newestStaffRollupAt: hoursAgo(20),
    });

    expect(result.checks.find((c) => c.name === 'staff_freshness')?.status).toBe('warn');
    expect(result.status).toBe('warning');
  });

  it('does not divide by zero when no devices are enrolled', () => {
    const result = evaluateRuijieSyncHealth({
      ...healthy,
      devicesReportingRecently: 0,
      devicesExpected: 0,
    });

    expect(result.checks.find((c) => c.name === 'device_coverage')?.status).toBe('warn');
    expect(Number.isFinite(result.deviceCoveragePercent)).toBe(true);
  });
});
