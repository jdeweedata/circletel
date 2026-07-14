/**
 * Lightweight abuse guards for the public CloudWiFi lead endpoint.
 * In-memory limits are best-effort on multi-instance deploys; email-window
 * checks should prefer the database when available.
 */

const IP_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const IP_MAX_REQUESTS = 8;
const IDEMPOTENCY_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const IDEMPOTENCY_KEY_PATTERN = /^[A-Za-z0-9._:-]{8,128}$/;
const MAX_IP_TRACKED_KEYS = 5_000;
const MAX_IDEMPOTENCY_KEYS = 5_000;

const ipHits = new Map<string, number[]>();
const idempotencyCache = new Map<
  string,
  { leadId: string; expiresAt: number }
>();

function pruneTimestamps(timestamps: number[], now: number, windowMs: number) {
  return timestamps.filter((stamp) => now - stamp < windowMs);
}

function dropOldestKeys<T>(map: Map<string, T>, maxSize: number): void {
  if (map.size <= maxSize) return;
  const excess = map.size - maxSize;
  let removed = 0;
  for (const key of map.keys()) {
    map.delete(key);
    removed += 1;
    if (removed >= excess) break;
  }
}

function recentIpHits(ip: string, now: number): number[] {
  const key = ip.trim() || "unknown";
  const recent = pruneTimestamps(ipHits.get(key) ?? [], now, IP_WINDOW_MS);
  if (recent.length === 0) {
    ipHits.delete(key);
  } else {
    ipHits.set(key, recent);
  }
  return recent;
}

/** True when the IP still has budget (does not consume a slot). */
export function isIpLeadRequestAllowed(ip: string, now = Date.now()): boolean {
  return recentIpHits(ip, now).length < IP_MAX_REQUESTS;
}

/** Consume one IP slot after a request has passed validation. */
export function recordIpLeadRequest(ip: string, now = Date.now()): void {
  const key = ip.trim() || "unknown";
  const recent = recentIpHits(key, now);
  recent.push(now);
  ipHits.set(key, recent);
  dropOldestKeys(ipHits, MAX_IP_TRACKED_KEYS);
}

/**
 * @deprecated Prefer isIpLeadRequestAllowed + recordIpLeadRequest so invalid
 * traffic does not burn quota. Kept for callers that need a single check+record.
 */
export function allowIpLeadRequest(ip: string, now = Date.now()): boolean {
  if (!isIpLeadRequestAllowed(ip, now)) {
    return false;
  }
  recordIpLeadRequest(ip, now);
  return true;
}

export function normalizeIdempotencyKey(
  value: string | null | undefined,
): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (!IDEMPOTENCY_KEY_PATTERN.test(trimmed)) return undefined;
  return trimmed;
}

export function getCachedIdempotentLead(
  key: string,
  now = Date.now(),
): string | undefined {
  const entry = idempotencyCache.get(key);
  if (!entry) return undefined;
  if (entry.expiresAt <= now) {
    idempotencyCache.delete(key);
    return undefined;
  }
  return entry.leadId;
}

export function cacheIdempotentLead(
  key: string,
  leadId: string,
  now = Date.now(),
): void {
  // Drop expired entries opportunistically when writing.
  for (const [cachedKey, entry] of idempotencyCache) {
    if (entry.expiresAt <= now) {
      idempotencyCache.delete(cachedKey);
    }
  }
  idempotencyCache.set(key, {
    leadId,
    expiresAt: now + IDEMPOTENCY_TTL_MS,
  });
  dropOldestKeys(idempotencyCache, MAX_IDEMPOTENCY_KEYS);
}

/**
 * Honeypot field names bots often auto-fill. A non-empty value indicates
 * automated abuse.
 */
export function isHoneypotFilled(body: unknown): boolean {
  if (!body || typeof body !== "object") return false;
  const record = body as Record<string, unknown>;
  for (const field of ["website", "companyUrl", "fax", "_hp"] as const) {
    const value = record[field];
    if (typeof value === "string" && value.trim().length > 0) {
      return true;
    }
  }
  return false;
}

export function clientIpFromRequest(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

/** Test-only helpers — not used in production routes. */
export function __resetLeadAbuseGuardsForTests(): void {
  ipHits.clear();
  idempotencyCache.clear();
}
