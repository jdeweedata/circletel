import { NextRequest } from 'next/server';
import type { User } from '@supabase/supabase-js';
import { authenticateAdmin } from '@/lib/auth/admin-api-auth';
import { createClient, createClientWithSession } from '@/lib/supabase/server';
import { ADMIN_CLAIM_VERSION } from '@/lib/auth/admin-claims';
import { DATA_API_UNAVAILABLE_CODE } from '@/lib/auth/data-api-errors';

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
  createClientWithSession: jest.fn(),
}));

const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>;
const mockCreateClientWithSession = createClientWithSession as jest.MockedFunction<
  typeof createClientWithSession
>;

const UPSTREAM_ERROR = {
  message:
    'upstream connect error or disconnect/reset before headers. retried and the latest reset reason: remote connection failure, transport failure reason: delayed connect error: 111',
};

const profile = {
  id: 'admin-1',
  email: 'devadmin@circletel.co.za',
  full_name: 'Dev Admin',
  role: 'super_admin',
  permissions: {},
  is_active: true,
  created_at: '2025-10-01T00:00:00.000Z',
  updated_at: '2025-10-01T00:00:00.000Z',
};

function userWithStaleClaim(): User {
  return {
    id: 'auth-1',
    email: 'devadmin@circletel.co.za',
    app_metadata: {
      admin_claim: {
        v: ADMIN_CLAIM_VERSION,
        stamped_at: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
        role: 'super_admin',
        profile,
      },
    },
  } as unknown as User;
}

function userWithoutClaim(): User {
  return {
    id: 'auth-1',
    email: 'devadmin@circletel.co.za',
    app_metadata: {},
  } as unknown as User;
}

function request() {
  return new NextRequest('http://localhost/api/admin/me');
}

describe('authenticateAdmin Data API outage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 503 (not 403) when the directory is down and there is no admin claim', async () => {
    mockCreateClientWithSession.mockResolvedValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({ data: { user: userWithoutClaim() }, error: null }),
      },
    } as never);
    mockCreateClient.mockResolvedValue({
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: UPSTREAM_ERROR }),
      }),
      auth: { admin: { updateUserById: jest.fn() } },
    } as never);

    const result = await authenticateAdmin(request());
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.response.status).toBe(503);
    const body = await result.response.json();
    expect(body.technical_error).toBe(DATA_API_UNAVAILABLE_CODE);
  });

  it('authorizes a stale active claim when the directory is down', async () => {
    const updateUserById = jest.fn().mockResolvedValue({ error: null });
    mockCreateClientWithSession.mockResolvedValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({ data: { user: userWithStaleClaim() }, error: null }),
      },
    } as never);
    mockCreateClient.mockResolvedValue({
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: UPSTREAM_ERROR }),
      }),
      auth: { admin: { updateUserById } },
    } as never);

    const result = await authenticateAdmin(request());
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.adminUser.email).toBe('devadmin@circletel.co.za');
    expect(updateUserById).toHaveBeenCalled();
  });
});
