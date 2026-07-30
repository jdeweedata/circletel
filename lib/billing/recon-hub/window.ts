import type { ReconWindow, ReconWindowBounds } from './types';

function utcMidnight(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

/**
 * Resolve inclusive-start / exclusive-end ISO bounds for a recon window.
 *
 * - today: UTC calendar day of `now` [00:00, next midnight)
 * - yesterday: UTC calendar day before today
 * - 48h: [now - 48h, now] (inclusive end as exact `now` ISO)
 */
export function resolveReconWindow(window: ReconWindow, now: Date): ReconWindowBounds {
  if (window === '48h') {
    const from = new Date(now.getTime() - 48 * 3600 * 1000);
    return {
      from: from.toISOString(),
      to: now.toISOString(),
    };
  }

  const todayStart = utcMidnight(now);

  if (window === 'today') {
    const tomorrowStart = new Date(todayStart.getTime() + 24 * 3600 * 1000);
    return {
      from: todayStart.toISOString(),
      to: tomorrowStart.toISOString(),
    };
  }

  // yesterday
  const yesterdayStart = new Date(todayStart.getTime() - 24 * 3600 * 1000);
  return {
    from: yesterdayStart.toISOString(),
    to: todayStart.toISOString(),
  };
}
