/**
 * JWT admin claims — zero-DB admin verification (audit H3)
 *
 * The admin role + a minimal admin profile are stamped into Supabase
 * `app_metadata.admin_claim` at login and re-stamped whenever the DB
 * fallback in authenticateAdmin() runs. Verifiers accept a claim only
 * while it is fresh, then fall back to the admin_users table — so role
 * changes or deactivations done directly in the database (there is no
 * in-app admin_users mutation path) take effect within a bounded window.
 *
 * The window applies to ANY admin_users change, not just deactivation: a
 * role downgrade (e.g. super_admin → viewer while still is_active) also
 * rides it, because the validator only re-checks is_active/TTL/version and
 * never compares the embedded role against a current value. A stale role
 * persists until the claim expires and the DB fallback re-stamps it.
 *
 * - API routes (authenticateAdmin uses auth.getUser(), which returns
 *   CURRENT app_metadata): claim TTL 15 min → any change takes effect on
 *   every API route within 15 minutes.
 * - Middleware page guard (getSession() decodes the JWT locally, so its
 *   metadata can lag one token-refresh cycle ~1h): claim TTL 1h. The page
 *   shell renders no data without API calls, which are governed by the
 *   15-min window above, so this window only affects visible chrome/menus.
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
/** Claim freshness for the middleware page guard (shell/menu only; data is
 *  gated by the 15-min API window). Kept short so a direct-DB role change or
 *  deactivation revokes page-shell access within the hour. */
export const ADMIN_CLAIM_PAGE_TTL_MS = 60 * 60 * 1000;

export interface AdminClaim {
  v: number;
  stamped_at: string;
  role: string;
  profile: AdminUser;
}

/**
 * Exactly the fields allowed into the client-readable JWT claim profile.
 * This is the security boundary for what an admin_users row may expose: a
 * new column added to admin_users is NOT embedded unless it is deliberately
 * added here AND to the AdminUser interface. Keep it free of secrets.
 */
export const ADMIN_CLAIM_PROFILE_FIELDS: ReadonlyArray<keyof AdminUser> = [
  'id',
  'email',
  'full_name',
  'role',
  'permissions',
  'custom_permissions',
  'department',
  'is_active',
  'role_template_id',
  'job_title',
  'created_at',
  'updated_at',
];

/**
 * Project an admin_users row down to the allowlisted claim profile.
 * Explicit construction (not a spread) so extra DB columns can never leak
 * into the JWT, and TypeScript fails the build if AdminUser gains a required
 * field that isn't projected here.
 */
export function buildAdminClaimProfile(row: AdminUser): AdminUser {
  return {
    id: row.id,
    email: row.email,
    full_name: row.full_name,
    role: row.role,
    permissions: row.permissions,
    custom_permissions: row.custom_permissions,
    department: row.department,
    is_active: row.is_active,
    role_template_id: row.role_template_id,
    job_title: row.job_title,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
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
      // Allowlist projection — never embed the raw row (audit H3 review).
      profile: buildAdminClaimProfile(adminRow),
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
