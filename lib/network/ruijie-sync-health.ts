/**
 * Health evaluation for the Ruijie per-device traffic sync.
 *
 * Why this exists: `ruijie_traffic_rollups` is the system of record, not a
 * cache. Measured 2026-08-02 against live Ruijie Cloud, the source serves only
 * ~3 days of per-device flow — four APs all cut off at the same instant, and a
 * 90-day request returns a zero-padded grid rather than an error. So a sync
 * outage lasting longer than that window is **permanent, unrecoverable data
 * loss**: there is nothing upstream to backfill from.
 *
 * Thresholds are therefore set to alert with days of runway, not hours of it.
 */

/** Measured, not assumed — see the module docblock. Deliberately conservative. */
export const RUIJIE_SOURCE_RETENTION_HOURS = 72;

/** Sync runs every 30 min, so 4h is 8 missed cycles — signal, not noise. */
const FRESHNESS_WARN_HOURS = 4;
/** Still ~62h of runway at this point. */
const FRESHNESS_FAIL_HOURS = 10;
/** Staff SSID sampling is thinner; visible but never the headline. */
const STAFF_WARN_HOURS = 12;
/** Some APs are legitimately offline; a real collapse is far below this. */
const DEVICE_COVERAGE_FAIL_PERCENT = 60;

export type CheckStatus = 'pass' | 'warn' | 'fail';
export type HealthStatus = 'healthy' | 'warning' | 'critical';

export interface RuijieSyncHealthInput {
  now: Date;
  /** Newest `captured_at` in ruijie_traffic_rollups, or null if none exists. */
  newestRollupAt: string | null;
  /** Distinct device_sn seen in the recent window. */
  devicesReportingRecently: number;
  /** Devices enrolled in the cache with a group — what we expect to hear from. */
  devicesExpected: number;
  /** Newest `hour_bucket` in ruijie_ssid_traffic_rollups, or null. */
  newestStaffRollupAt: string | null;
}

export interface HealthCheck {
  name: 'rollup_freshness' | 'device_coverage' | 'staff_freshness';
  status: CheckStatus;
  value: string;
  threshold: string;
  message: string;
}

export interface RuijieSyncHealthResult {
  status: HealthStatus;
  checks: HealthCheck[];
  /** Hours before the un-collected window passes out of Ruijie for good. */
  hoursUntilUnrecoverable: number;
  deviceCoveragePercent: number;
}

function ageHours(now: Date, iso: string | null): number | null {
  if (!iso) return null;
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return null;
  return (now.getTime() - then) / 3_600_000;
}

function worst(statuses: CheckStatus[]): HealthStatus {
  if (statuses.includes('fail')) return 'critical';
  if (statuses.includes('warn')) return 'warning';
  return 'healthy';
}

export function evaluateRuijieSyncHealth(
  input: RuijieSyncHealthInput
): RuijieSyncHealthResult {
  const checks: HealthCheck[] = [];

  // 1. Freshness — the check that guards against silent, permanent loss.
  const rollupAge = ageHours(input.now, input.newestRollupAt);
  if (rollupAge === null) {
    checks.push({
      name: 'rollup_freshness',
      status: 'fail',
      value: 'no rollups',
      threshold: `${FRESHNESS_WARN_HOURS}h`,
      message:
        'No traffic rollups exist at all. Nothing is being collected, and Ruijie only holds ~3 days.',
    });
  } else {
    const status: CheckStatus =
      rollupAge >= FRESHNESS_FAIL_HOURS
        ? 'fail'
        : rollupAge >= FRESHNESS_WARN_HOURS
          ? 'warn'
          : 'pass';
    checks.push({
      name: 'rollup_freshness',
      status,
      value: `${rollupAge.toFixed(1)}h old`,
      threshold: `warn ${FRESHNESS_WARN_HOURS}h / fail ${FRESHNESS_FAIL_HOURS}h`,
      message:
        status === 'pass'
          ? 'Traffic rollups are current.'
          : `Newest rollup is ${rollupAge.toFixed(1)}h old. Ruijie retains roughly ${RUIJIE_SOURCE_RETENTION_HOURS}h, after which the gap cannot be backfilled.`,
    });
  }

  // 2. Device coverage — catches a silent regression to one AP per group, which
  //    freshness alone would miss because rows keep arriving.
  const coveragePercent =
    input.devicesExpected > 0
      ? (input.devicesReportingRecently / input.devicesExpected) * 100
      : 0;

  if (input.devicesExpected === 0) {
    checks.push({
      name: 'device_coverage',
      status: 'warn',
      value: 'no devices enrolled',
      threshold: `${DEVICE_COVERAGE_FAIL_PERCENT}%`,
      message: 'No Ruijie devices are enrolled with a group, so nothing can be collected.',
    });
  } else {
    const status: CheckStatus =
      coveragePercent < DEVICE_COVERAGE_FAIL_PERCENT ? 'fail' : 'pass';
    checks.push({
      name: 'device_coverage',
      status,
      value: `${input.devicesReportingRecently}/${input.devicesExpected} (${coveragePercent.toFixed(0)}%)`,
      threshold: `${DEVICE_COVERAGE_FAIL_PERCENT}%`,
      message:
        status === 'pass'
          ? 'Per-device collection is reporting across the fleet.'
          : `Only ${input.devicesReportingRecently} of ${input.devicesExpected} devices reported. A drop to one device per group means per-site attribution has silently regressed.`,
    });
  }

  // 3. Staff SSID — informational; must not mask a core-traffic problem.
  const staffAge = ageHours(input.now, input.newestStaffRollupAt);
  const staffStatus: CheckStatus =
    staffAge === null || staffAge >= STAFF_WARN_HOURS ? 'warn' : 'pass';
  checks.push({
    name: 'staff_freshness',
    status: staffStatus,
    value: staffAge === null ? 'no samples' : `${staffAge.toFixed(1)}h old`,
    threshold: `${STAFF_WARN_HOURS}h`,
    message:
      staffStatus === 'pass'
        ? 'Staff Wi-Fi SSID samples are current.'
        : 'Staff Wi-Fi SSID sampling is stale — Unjani Staff sections will show no data for this period.',
  });

  return {
    status: worst(checks.map((check) => check.status)),
    checks,
    hoursUntilUnrecoverable:
      rollupAge === null
        ? 0
        : Math.max(0, RUIJIE_SOURCE_RETENTION_HOURS - rollupAge),
    deviceCoveragePercent: coveragePercent,
  };
}
