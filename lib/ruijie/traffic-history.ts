/**
 * Shared constants + helpers for Ruijie → Supabase traffic history.
 * Keep admin Analytics charts populated from cache, not live-only pulls.
 */

/** Max hourly window we request from Ruijie flow/show/hour (matches analytics UI). */
export const RUIJIE_TRAFFIC_HISTORY_HOURS = 168;

/** How long to retain hourly rollup rows in Supabase. */
export const RUIJIE_TRAFFIC_RETENTION_DAYS = 14;

/** Pace Ruijie group requests during rollup/backfill. */
export const RUIJIE_TRAFFIC_GROUP_DELAY_MS = 400;

export function clampTrafficHistoryHours(hours: number | undefined): number {
  if (hours == null || !Number.isFinite(hours)) return RUIJIE_TRAFFIC_HISTORY_HOURS;
  return Math.min(RUIJIE_TRAFFIC_HISTORY_HOURS, Math.max(1, Math.floor(hours)));
}
