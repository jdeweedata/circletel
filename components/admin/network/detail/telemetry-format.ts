/**
 * Shared formatting + colour thresholds for Ruijie per-client telemetry.
 *
 * Lives in one place so the Client Experience block (device page) and the client
 * table can't drift apart on what counts as a bad score or a slow round-trip.
 */

/** Ruijie scores clients 0–100; below 60 is a client that will notice problems. */
export const SCORE_POOR = 60;
export const SCORE_FAIR = 80;

/** Round-trip thresholds in ms — above 150 is bad enough to feel on a video call. */
export const LATENCY_POOR_MS = 150;
export const LATENCY_FAIR_MS = 60;

export function scoreTone(score: number | null | undefined): string {
  if (score == null || !Number.isFinite(score)) return 'text-slate-400';
  if (score < SCORE_POOR) return 'text-red-600';
  if (score < SCORE_FAIR) return 'text-amber-600';
  return 'text-emerald-600';
}

export function latencyTone(ms: number | null | undefined): string {
  if (ms == null || !Number.isFinite(ms)) return 'text-slate-400';
  if (ms > LATENCY_POOR_MS) return 'text-red-600';
  if (ms > LATENCY_FAIR_MS) return 'text-amber-600';
  return 'text-slate-700';
}

export function formatLatency(ms: number | null | undefined): string {
  if (ms == null || !Number.isFinite(ms)) return '—';
  return ms >= 1000 ? `${(ms / 1000).toFixed(1)} s` : `${Math.round(ms)} ms`;
}
