/**
 * Admin Claims Tests (audit H3)
 *
 * Covers the pure claim-validation logic in getAdminClaim() — TTL math,
 * version check, is_active enforcement, malformed-claim handling — and the
 * non-fatal stamping behavior of stampAdminClaim().
 */

import type { User } from '@supabase/supabase-js';
import type { AdminUser } from '@/lib/auth/admin-api-auth';
import {
  getAdminClaim,
  stampAdminClaim,
  ADMIN_CLAIM_VERSION,
  ADMIN_CLAIM_API_TTL_MS,
} from '@/lib/auth/admin-claims';

const TTL = ADMIN_CLAIM_API_TTL_MS;

const adminProfile = (overrides: Partial<AdminUser> = {}): AdminUser => ({
  id: 'admin-1',
  email: 'admin@circletel.co.za',
  full_name: 'Admin User',
  role: 'super_admin',
  permissions: {},
  is_active: true,
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
  ...overrides,
});

const userWithClaim = (claim: unknown): User =>
  ({ id: 'auth-1', app_metadata: claim === undefined ? {} : { admin_claim: claim } } as unknown as User);

const validClaim = (overrides: Record<string, unknown> = {}) => ({
  v: ADMIN_CLAIM_VERSION,
  stamped_at: new Date().toISOString(),
  role: 'super_admin',
  profile: adminProfile(),
  ...overrides,
});

describe('getAdminClaim', () => {
  it('returns a fresh, valid claim', () => {
    const claim = validClaim();
    const result = getAdminClaim(userWithClaim(claim), TTL);
    expect(result).not.toBeNull();
    expect(result?.role).toBe('super_admin');
    expect(result?.profile.email).toBe('admin@circletel.co.za');
  });

  it('accepts a claim exactly at the TTL boundary', () => {
    const claim = validClaim({ stamped_at: new Date(Date.now() - TTL).toISOString() });
    expect(getAdminClaim(userWithClaim(claim), TTL)).not.toBeNull();
  });

  it('rejects a claim older than the TTL', () => {
    const claim = validClaim({ stamped_at: new Date(Date.now() - TTL - 1000).toISOString() });
    expect(getAdminClaim(userWithClaim(claim), TTL)).toBeNull();
  });

  it('rejects a claim stamped in the future', () => {
    const claim = validClaim({ stamped_at: new Date(Date.now() + 60_000).toISOString() });
    expect(getAdminClaim(userWithClaim(claim), TTL)).toBeNull();
  });

  it('rejects a version mismatch', () => {
    const claim = validClaim({ v: ADMIN_CLAIM_VERSION + 1 });
    expect(getAdminClaim(userWithClaim(claim), TTL)).toBeNull();
  });

  it('rejects an inactive profile', () => {
    const claim = validClaim({ profile: adminProfile({ is_active: false }) });
    expect(getAdminClaim(userWithClaim(claim), TTL)).toBeNull();
  });

  it('rejects a missing or empty role', () => {
    expect(getAdminClaim(userWithClaim(validClaim({ role: '' })), TTL)).toBeNull();
    expect(getAdminClaim(userWithClaim(validClaim({ role: undefined })), TTL)).toBeNull();
  });

  it('rejects a missing profile', () => {
    expect(getAdminClaim(userWithClaim(validClaim({ profile: undefined })), TTL)).toBeNull();
  });

  it('rejects an unparseable stamped_at', () => {
    expect(getAdminClaim(userWithClaim(validClaim({ stamped_at: 'not-a-date' })), TTL)).toBeNull();
    expect(getAdminClaim(userWithClaim(validClaim({ stamped_at: 123 })), TTL)).toBeNull();
  });

  it('returns null when no admin_claim is present', () => {
    expect(getAdminClaim(userWithClaim(undefined), TTL)).toBeNull();
  });

  it('returns null for a non-object claim', () => {
    expect(getAdminClaim(userWithClaim('nope'), TTL)).toBeNull();
    expect(getAdminClaim(userWithClaim(null), TTL)).toBeNull();
  });
});

describe('stampAdminClaim', () => {
  it('writes a versioned claim to app_metadata via the admin API', async () => {
    const updateUserById = jest.fn().mockResolvedValue({ error: null });
    const supabaseAdmin = { auth: { admin: { updateUserById } } } as never;

    await stampAdminClaim(supabaseAdmin, 'auth-1', adminProfile());

    expect(updateUserById).toHaveBeenCalledTimes(1);
    const [authId, payload] = updateUserById.mock.calls[0];
    expect(authId).toBe('auth-1');
    expect(payload.app_metadata.admin_claim.v).toBe(ADMIN_CLAIM_VERSION);
    expect(payload.app_metadata.admin_claim.role).toBe('super_admin');
    expect(typeof payload.app_metadata.admin_claim.stamped_at).toBe('string');
  });

  it('does not throw when the admin API returns an error', async () => {
    const updateUserById = jest.fn().mockResolvedValue({ error: { message: 'boom' } });
    const supabaseAdmin = { auth: { admin: { updateUserById } } } as never;
    await expect(stampAdminClaim(supabaseAdmin, 'auth-1', adminProfile())).resolves.toBeUndefined();
  });

  it('does not throw when the admin API call rejects', async () => {
    const updateUserById = jest.fn().mockRejectedValue(new Error('network'));
    const supabaseAdmin = { auth: { admin: { updateUserById } } } as never;
    await expect(stampAdminClaim(supabaseAdmin, 'auth-1', adminProfile())).resolves.toBeUndefined();
  });

  it('produces a claim that getAdminClaim immediately accepts', async () => {
    let captured: Record<string, unknown> | undefined;
    const updateUserById = jest.fn().mockImplementation(async (_id, payload) => {
      captured = payload.app_metadata.admin_claim;
      return { error: null };
    });
    const supabaseAdmin = { auth: { admin: { updateUserById } } } as never;

    await stampAdminClaim(supabaseAdmin, 'auth-1', adminProfile());
    expect(getAdminClaim(userWithClaim(captured), TTL)).not.toBeNull();
  });
});
