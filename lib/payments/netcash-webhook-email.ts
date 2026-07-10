/**
 * Helpers for extracting customer data from NetCash Pay Now webhook payloads.
 *
 * Kept as a small pure module so it can be unit-tested in isolation without
 * pulling in the webhook route's server-only dependencies.
 */

/**
 * Extract a customer email from a NetCash webhook payload.
 *
 * NetCash sends the email in `Email` / `CustomerEmail` (frequently omitted on Pay Now notifies).
 * `Extra2` carries the notify/return URL, NOT the email — it must never be used here.
 *
 * @returns the email if it is a plausible address (contains "@", not a URL), otherwise null.
 */
export function extractCustomerEmail(payload: Record<string, unknown>): string | null {
  const candidate = String(payload.Email ?? payload.CustomerEmail ?? '').trim();
  if (candidate && candidate.includes('@') && !/^https?:\/\//i.test(candidate)) {
    return candidate;
  }
  return null;
}
