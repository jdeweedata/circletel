import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServerClient } from '@supabase/ssr';
import { ADMIN_CLAIM_VERSION } from '@/lib/auth/admin-claims';
import {
  DATA_API_UNAVAILABLE_CODE,
  DATA_API_UNAVAILABLE_MESSAGE,
} from '@/lib/auth/data-api-errors';

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}));

jest.mock('@supabase/ssr', () => ({
  createServerClient: jest.fn(),
}));

jest.mock('@/lib/logging', () => ({
  apiLogger: {
    info: jest.fn(),
    error: jest.fn(),
  },
}));

const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>;
const mockCreateServerClient = createServerClient as jest.MockedFunction<typeof createServerClient>;

const UPSTREAM_ERROR = {
  message:
    'upstream connect error or disconnect/reset before headers. retried and the latest reset reason: remote connection failure, transport failure reason: delayed connect error: 111',
};

const adminProfile = {
  id: 'admin-row-1',
  email: 'devadmin@circletel.co.za',
  full_name: 'Dev Admin',
  role: 'super_admin',
  role_template_id: 'super_admin',
  permissions: {},
  is_active: true,
  created_at: '2025-10-01T00:00:00.000Z',
  updated_at: '2025-10-01T00:00:00.000Z',
};

function staleAdminClaim() {
  return {
    v: ADMIN_CLAIM_VERSION,
    stamped_at: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
    role: 'super_admin',
    profile: adminProfile,
  };
}

function authUser(withClaim: boolean) {
  return {
    id: '172c9f7c-7c32-43bd-8782-278df0d4a322',
    email: 'devadmin@circletel.co.za',
    app_metadata: withClaim ? { admin_claim: staleAdminClaim() } : {},
  };
}

function loginRequest(body: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function mockDirectoryLookup(result: { data: unknown; error: unknown }) {
  const insert = jest.fn().mockResolvedValue({ error: null });
  const getUserById = jest.fn().mockResolvedValue({ data: { user: null }, error: null });
  const updateUserById = jest.fn().mockResolvedValue({ error: null });

  mockCreateClient.mockResolvedValue({
    from: jest.fn((table: string) => {
      if (table === 'admin_users') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              maybeSingle: jest.fn().mockResolvedValue(result),
            }),
          }),
        };
      }
      return { insert };
    }),
    auth: {
      admin: { getUserById, updateUserById },
    },
  } as never);

  return { insert, getUserById, updateUserById };
}

function mockPasswordAuth(result: {
  data: { user: unknown; session: unknown };
  error: unknown;
}) {
  const refreshSession = jest.fn().mockResolvedValue({ data: {}, error: null });
  mockCreateServerClient.mockReturnValue({
    auth: {
      signInWithPassword: jest.fn().mockResolvedValue(result),
      refreshSession,
    },
  } as never);
  return { refreshSession };
}

describe('POST /api/admin/login Data API outage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-key';
  });

  it('returns 401 Invalid credentials when the user is not an admin (not an outage)', async () => {
    mockDirectoryLookup({
      data: null,
      error: { code: 'PGRST116', message: 'JSON object requested, multiple (or no) rows returned' },
    });
    mockPasswordAuth({ data: { user: null, session: null }, error: null });

    const { POST } = await import('@/app/api/admin/login/route');
    const response = await POST(
      loginRequest({ email: 'nobody@circletel.co.za', password: 'secret1' })
    );
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error).toBe('Invalid credentials');
  });

  it('returns 401 Invalid credentials when the Data API is down but the password is wrong', async () => {
    mockDirectoryLookup({ data: null, error: UPSTREAM_ERROR });
    mockPasswordAuth({
      data: { user: null, session: null },
      error: { message: 'Invalid login credentials' },
    });

    const { POST } = await import('@/app/api/admin/login/route');
    const response = await POST(
      loginRequest({ email: 'devadmin@circletel.co.za', password: 'wrong-password' })
    );
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error).toBe('Invalid credentials');
    expect(body.technical_error).toBeUndefined();
  });

  it('returns 503 (not 401) when the Data API is down, password is valid, and there is no admin claim', async () => {
    const { getUserById } = mockDirectoryLookup({ data: null, error: UPSTREAM_ERROR });
    getUserById.mockResolvedValue({ data: { user: authUser(false) }, error: null });
    mockPasswordAuth({
      data: {
        user: authUser(false),
        session: { access_token: 'tok', expires_at: 1 },
      },
      error: null,
    });

    const { POST } = await import('@/app/api/admin/login/route');
    const response = await POST(
      loginRequest({ email: 'devadmin@circletel.co.za', password: 'correct-password' })
    );
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.technical_error).toBe(DATA_API_UNAVAILABLE_CODE);
    expect(body.error).toBe(DATA_API_UNAVAILABLE_MESSAGE);
  });

  it('signs in via a stale admin claim when the Data API is down and the password is valid', async () => {
    mockDirectoryLookup({ data: null, error: UPSTREAM_ERROR });
    const { refreshSession } = mockPasswordAuth({
      data: {
        user: authUser(true),
        session: { access_token: 'tok', expires_at: 1 },
      },
      error: null,
    });

    const { POST } = await import('@/app/api/admin/login/route');
    const response = await POST(
      loginRequest({ email: 'devadmin@circletel.co.za', password: 'correct-password' })
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.user.email).toBe('devadmin@circletel.co.za');
    expect(body.user.role).toBe('super_admin');
    expect(refreshSession).toHaveBeenCalled();
  });
});
