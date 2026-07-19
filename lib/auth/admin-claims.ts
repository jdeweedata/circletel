/**
 * JWT admin claims — zero-DB admin verification (audit H3)
 *
 * The admin role + a minimal admin profile are stamped into Supabase
 * `app_metadata.admin_claim` at login and re-stamped whenever the DB
 * fallback in authenticateAdmin() runs. Verifiers accept a claim only
 * while it is fresh, then fall back to the admin_users table — so role
 * changes or deactivations done directly in the database (there is no
 * in-app admin_users mutation path) take effect within a bounded window:
 *
 * - API routes (authenticateAdmin uses auth.getUser(), which returns
 *   CURRENT app_metadata): claim TTL 15 min → deactivation locks out of
 *   every API route within 15 minutes.
 * - Middleware page guard (getSession() decodes the JWT locally, so its
 *   metadata can lag one token-refresh cycle ~1h): claim TTL 24h. The
 *   page shell renders no data without API calls, which are governed by
 *   the 15-min window above.
 *
 * This file must stay edge-safe (imported by middleware): pure functions
 * and types only — the stamping helper takes the caller's service-role
 * client instead of importing one.
 */

import type { SupabaseClient, User } from '@supabase/supabase-js';
import type { AdminUser } from '@/lib/auth/admin-api-auth';

export const ADMIN_CLAIM_VERSION = 1;
/** Claim freshness for API-route auth (authenticateAdmin). */
export const ADMIN_CLAIM_API_TTL_MS = 15 * 60 * 1000;
/** Claim freshness for the middleware page guard. */
export const ADMIN_CLAIM_PAGE_TTL_MS = 24 * 60 * 60 * 1000;

export interface AdminClaim {
  v: number;
  stamped_at: string;
  role: string;
  profile: AdminUser;
}

/**
 * Extract a valid, fresh admin claim from a Supabase user, or null.
 */
export function getAdminClaim(user: User, maxAgeMs: number): AdminClaim | null {
  const raw = (user.app_metadata as Record<string, unknown> | undefined)?.admin_claim;
  if (!raw || typeof raw !== 'object') return null;

  const claim = raw as Partial<AdminClaim>;
  if (claim.v !== ADMIN_CLAIM_VERSION) return null;
  if (typeof claim.role !== 'string' || !claim.role) return null;
  if (!claim.profile || typeof claim.profile !== 'object') return null;
  if (claim.profile.is_active !== true) return null;
  if (typeof claim.stamped_at !== 'string') return null;

  const stampedAt = Date.parse(claim.stamped_at);
  if (Number.isNaN(stampedAt)) return null;
  const age = Date.now() - stampedAt;
  if (age < 0 || age > maxAgeMs) return null;

  return claim as AdminClaim;
}

/**
 * Stamp (or refresh) the admin claim on a Supabase auth user.
 * Non-fatal: callers treat failure as "no claim" and keep using the DB path.
 *
 * @param supabaseAdmin service-role client (auth.admin API access)
 * @param authUserId    Supabase AUTH user id (not the admin_users row id)
 * @param adminRow      current admin_users row to embed in the claim
 */
export async function stampAdminClaim(
  supabaseAdmin: SupabaseClient,
  authUserId: string,
  adminRow: AdminUser
): Promise<void> {
  try {
    const claim: AdminClaim = {
      v: ADMIN_CLAIM_VERSION,
      stamped_at: new Date().toISOString(),
      role: adminRow.role,
      profile: adminRow,
    };
    const { error } = await supabaseAdmin.auth.admin.updateUserById(authUserId, {
      app_metadata: { admin_claim: claim },
    });
    if (error) {
      console.warn('[Admin Claims] Failed to stamp claim:', error.message);
    }
  } catch (error) {
    console.warn('[Admin Claims] Failed to stamp claim:', error);
  }
}
