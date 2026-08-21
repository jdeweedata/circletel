import { NextRequest } from 'next/server';
import { POST } from '../route';
import { authenticateAdmin } from '@/lib/auth/admin-api-auth';

jest.mock('@/lib/auth/admin-api-auth', () => ({
  authenticateAdmin: jest.fn(),
}));

jest.mock('@/lib/billing/cycle-match/actions', () => ({
  applyCycleMatchAction: jest.fn(),
}));

const mockAuthenticateAdmin = authenticateAdmin as jest.MockedFunction<
  typeof authenticateAdmin
>;

describe('POST /api/admin/finance/cycle-match/exceptions/:id/actions', () => {
  it('returns 401 when the caller is not an admin', async () => {
    mockAuthenticateAdmin.mockResolvedValue({
      success: false,
      error: 'Unauthorized',
      response: new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
      }) as never,
    });

    const req = new Request(
      'http://localhost/api/admin/finance/cycle-match/exceptions/exc-1/actions',
      { method: 'POST', body: JSON.stringify({ action: 'debit_note' }) }
    ) as NextRequest;
    const res = await POST(req, { params: Promise.resolve({ id: 'exc-1' }) });
    expect(res.status).toBe(401);
  });
});
