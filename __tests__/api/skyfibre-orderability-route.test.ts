import { NextRequest } from 'next/server';
import { POST } from '@/app/api/coverage/skyfibre/orderability/route';
import { createClient } from '@/lib/supabase/server';
import { checkSkyFibreOrderability } from '@/lib/coverage/skyfibre/orderability';

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}));

jest.mock('@/lib/coverage/skyfibre/orderability', () => ({
  checkSkyFibreOrderability: jest.fn(),
  isValidSkyFibreCapacity: (value: unknown) => value === 50 || value === 100 || value === 200,
  redactSkyFibreOrderability: (value: unknown) => value,
}));

const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>;
const mockCheckSkyFibreOrderability = checkSkyFibreOrderability as jest.MockedFunction<typeof checkSkyFibreOrderability>;

function request(body: Record<string, unknown>) {
  return new Request('http://localhost/api/coverage/skyfibre/orderability', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }) as NextRequest;
}

describe('POST /api/coverage/skyfibre/orderability', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateClient.mockResolvedValue({
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { coverage_results: [] },
          error: null,
        }),
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error: null }),
        }),
      }),
    } as any);
  });

  it('rejects unsupported SkyFibre capacities', async () => {
    const response = await POST(request({ leadId: 'lead-1', capacityMbps: 150 }));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toMatch(/capacity/i);
    expect(mockCheckSkyFibreOrderability).not.toHaveBeenCalled();
  });

  it('requires either a leadId or coordinates', async () => {
    const response = await POST(request({ capacityMbps: 100 }));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toMatch(/leadId or coordinates/i);
  });

  it('returns and persists a redacted orderability result for lead checks', async () => {
    mockCheckSkyFibreOrderability.mockResolvedValue({
      decision: 'orderable',
      segment: 'business',
      capacityMbps: 100,
      tcsCoverage: {
        covered: true,
        confidence: 'high',
        nearestBnOnline: true,
        nearestBnActiveRnCount: 12,
        reason: 'BN active with RN evidence.',
      },
      cspOrderability: {
        provider: 'mtn-csp',
        productName: 'Fixed Wireless Broadband',
        method: 'feasibilityOld',
        capacityMbps: 100,
        orderable: true,
        status: 'orderable',
        checkedAt: '2026-06-16T10:00:00.000Z',
      },
    });

    const response = await POST(request({ leadId: 'lead-1', capacityMbps: 100, segment: 'business' }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.decision).toBe('orderable');
    expect(mockCheckSkyFibreOrderability).toHaveBeenCalledWith(
      expect.objectContaining({ leadId: 'lead-1', capacityMbps: 100, segment: 'business' }),
      expect.objectContaining({ supabase: expect.any(Object) })
    );
  });
});
