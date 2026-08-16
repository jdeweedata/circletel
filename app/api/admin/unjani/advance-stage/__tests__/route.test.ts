import { NextRequest } from 'next/server';

import { POST } from '../route';
import { authenticateAdmin, requirePermission } from '@/lib/auth/admin-api-auth';
import { createClient } from '@/lib/supabase/server';

jest.mock('@/lib/auth/admin-api-auth', () => ({
  authenticateAdmin: jest.fn(),
  requirePermission: jest.fn(),
}));

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}));

jest.mock('@/lib/corporate/site-service', () => ({
  CorporateSiteService: { create: jest.fn() },
}));

jest.mock('@/lib/admin/unjani-ticket-sync', () => ({
  markNominationTicketInProgress: jest.fn(),
  resolveActivationTicketsForSite: jest.fn(),
}));

jest.mock('@/lib/inngest/client', () => ({
  inngest: { send: jest.fn() },
}));

jest.mock('@/lib/logging/logger', () => ({
  apiLogger: { error: jest.fn(), warn: jest.fn(), info: jest.fn() },
}));

const mockAuthenticateAdmin = authenticateAdmin as jest.MockedFunction<typeof authenticateAdmin>;
const mockRequirePermission = requirePermission as jest.MockedFunction<typeof requirePermission>;
const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>;

function request(body: Record<string, unknown>) {
  return new Request('http://localhost/api/admin/unjani/advance-stage', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }) as NextRequest;
}

describe('POST /api/admin/unjani/advance-stage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthenticateAdmin.mockResolvedValue({
      success: true,
      user: { id: 'user-1', email: 'admin@circletel.co.za' } as never,
      adminUser: { id: 'admin-1', email: 'admin@circletel.co.za', role: 'admin' } as never,
    });
    mockRequirePermission.mockReturnValue(null);
  });

  it('rejects unknown actions before touching the database', async () => {
    const response = await POST(request({ action: 'vet_documents', customerId: 'c1' }));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toMatch(/unknown action/i);
    expect(mockCreateClient).not.toHaveBeenCalled();
  });

  it('requires a reason when requesting changes', async () => {
    mockCreateClient.mockResolvedValue({
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        then: undefined,
      }),
    } as never);

    const chain = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({
        data: [{ id: 'sub-1', status: 'submitted', rejection_reason: null }],
        error: null,
      }),
    };
    mockCreateClient.mockResolvedValue({
      from: jest.fn().mockReturnValue(chain),
    } as never);

    const response = await POST(
      request({ action: 'request_changes', customerId: 'c1', reason: '   ' })
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toMatch(/reason/i);
  });

  it('rejects visit dates in the 25th-to-7th window', async () => {
    const response = await POST(
      request({ action: 'book_visit', customerId: 'c1', visitDate: '2026-08-25' })
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toMatch(/25th to the 7th/i);
  });
});
