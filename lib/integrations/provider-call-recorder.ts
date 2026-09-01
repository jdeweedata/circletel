/**
 * Provider API call recorder — the observability seam.
 *
 * One row per outbound provider HTTP call, written fire-and-forget. Rolled up
 * hourly into `integration_api_metrics` by /api/cron/provider-metrics-rollup.
 *
 * Spec: docs/superpowers/specs/2026-08-01-coverage-integrations-observability-split-design.md
 *
 * PRIVACY CONTRACT — do not weaken:
 *   No URL, no query string, no request body, no BBOX, no address, no
 *   coordinates, no API keys, no free-text error messages, and no linkage to a
 *   session, lead or customer. `normalizeOperation` discards the query string
 *   structurally so a caller cannot leak one by accident — MTN WMS URLs carry
 *   BBOX coordinates and Google geocoding URLs carry both the customer address
 *   and the API key.
 *
 * Transport-agnostic by design: callers using fetch and callers using axios
 * both just call `recordProviderCall`. Do not turn this into a fetch wrapper.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export interface ProviderCallRecord {
  /** FK to integration_registry(slug) — the row must exist or the insert is rejected. */
  integrationSlug: string;
  /** Normalised `METHOD host/path[#Operation]`. Build with normalizeOperation(). */
  operation: string;
  /** Derived from the coordinate before the call. Null for calls with no single location. */
  province?: string | null;
  durationMs: number;
  success: boolean;
  errorCode?: string | null;
  cacheHit?: boolean;
}

/** Shared codes. Providers may add their own; keep them constrained, never free text. */
export const PROVIDER_ERROR_CODES = {
  TRANSPORT_ERROR: 'TRANSPORT_ERROR',
  TIMEOUT: 'TIMEOUT',
  RATE_LIMITED: 'RATE_LIMITED',
  AUTH_FAILED: 'AUTH_FAILED',
  PROVIDER_ERROR: 'PROVIDER_ERROR',
} as const;

let cachedClient: SupabaseClient | null = null;

/**
 * Lazy service-role client.
 *
 * Deliberately uses @supabase/supabase-js directly rather than lib/supabase/server:
 * this runs inside Inngest jobs (dfa-sync) where there is no request context.
 * Lazy so a missing env var cannot throw at module load and break the build.
 */
function getClient(): SupabaseClient | null {
  if (cachedClient) return cachedClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;

  cachedClient = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cachedClient;
}

/**
 * Build a safe `operation` string.
 *
 * Keeps method, host and path. Discards the query string and any fragment the
 * caller passed in the URL. An optional `operation` label may be appended after
 * a `#` — use it for non-sensitive discriminators such as a WMS layer name or a
 * request type. Never pass user input here.
 */
export function normalizeOperation(
  method: string,
  url: string,
  operation?: string | null
): string {
  let base: string;
  try {
    const parsed = new URL(url);
    base = `${method.toUpperCase()} ${parsed.host}${parsed.pathname}`;
  } catch {
    // Unparseable URL — record the method only rather than risk echoing a raw string.
    base = `${method.toUpperCase()} <unparseable-url>`;
  }
  return operation ? `${base}#${operation}` : base;
}

/**
 * Record one provider API call.
 *
 * Call as `void recordProviderCall({...})` from a `finally`. Never await it on a
 * user-facing path, and never let it throw: a logging failure must not fail a
 * coverage check. Production runs as a long-running container, so the write
 * lands reliably; the only loss window is container shutdown during a deploy.
 */
export async function recordProviderCall(record: ProviderCallRecord): Promise<void> {
  try {
    const supabase = getClient();
    if (!supabase) return;

    await supabase.from('provider_api_calls').insert({
      integration_slug: record.integrationSlug,
      operation: record.operation,
      province: record.province ?? null,
      duration_ms: Math.max(0, Math.round(record.durationMs)),
      success: record.success,
      error_code: record.errorCode ?? null,
      cache_hit: record.cacheHit ?? false,
    });
  } catch {
    // Swallowed by design. See the doc comment above.
  }
}
