import { NextRequest } from 'next/server';
import { GET } from '../route';
import { authenticateAdmin } from '@/lib/auth/admin-api-auth';

jest.mock('@/lib/auth/admin-api-auth', () => ({
  authenticateAdmin: jest.fn(),
}));

jest.mock('@/lib/billing/cycle-match/load-workbench', () => ({
  loadCycleMatchWorkbench: jest.fn(),
}));

const mockAuthenticateAdmin = authenticateAdmin as jest.MockedFunction<
  typeof authenticateAdmin
>;

describe('GET /api/admin/finance/cycle-match', () => {
  it('returns 401 when the caller is not an admin', async () => {
    mockAuthenticateAdmin.mockResolvedValue({
      success: false,
      error: 'Unauthorized',
      response: new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
      }) as never,
    });

    const req = new Request(
      'http://localhost/api/admin/finance/cycle-match'
    ) as NextRequest;
    const res = await GET(req);
    expect(res.status).toBe(401);
  });
});
