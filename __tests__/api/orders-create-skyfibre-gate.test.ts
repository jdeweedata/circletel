import { NextRequest } from 'next/server';
import { POST } from '@/app/api/orders/create/route';
import { createClient } from '@/lib/supabase/server';
import {
  checkSkyFibreOrderability,
  extractSkyFibreCapacity,
  isSkyFibrePackage,
} from '@/lib/coverage/skyfibre/orderability';
import { EmailNotificationService } from '@/lib/notifications/notification-service';
import { ORDER_PROCESSING_FEE_AMOUNT } from '@/lib/payments/payment-amounts';

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}));

jest.mock('@/lib/coverage/skyfibre/orderability', () => ({
  checkSkyFibreOrderability: jest.fn(),
  extractSkyFibreCapacity: jest.fn(() => 100),
  isSkyFibrePackage: jest.fn(() => true),
  redactSkyFibreOrderability: (value: unknown) => value,
}));

jest.mock('@/lib/notifications/notification-service', () => ({
  EmailNotificationService: {
    sendOrderConfirmation: jest.fn(),
  },
}));

const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>;
const mockCheckSkyFibreOrderability = checkSkyFibreOrderability as jest.MockedFunction<typeof checkSkyFibreOrderability>;
const mockExtractSkyFibreCapacity = extractSkyFibreCapacity as jest.MockedFunction<typeof extractSkyFibreCapacity>;
const mockIsSkyFibrePackage = isSkyFibrePackage as jest.MockedFunction<typeof isSkyFibrePackage>;
const mockSendOrderConfirmation = EmailNotificationService.sendOrderConfirmation as jest.MockedFunction<typeof EmailNotificationService.sendOrderConfirmation>;
let insertOrderMock: jest.Mock;

function request(body: Record<string, unknown>) {
  return new Request('http://localhost/api/orders/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }) as NextRequest;
}

describe('POST /api/orders/create SkyFibre gate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsSkyFibrePackage.mockReturnValue(true);
    mockExtractSkyFibreCapacity.mockReturnValue(100);
    mockSendOrderConfirmation.mockResolvedValue({ success: true } as any);

    const duplicateQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue({ data: [], error: null }),
    };
    const orderNumberQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: null }),
    };
    insertOrderMock = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        single: jest.fn().mockResolvedValue({
          data: {
            id: 'order-1',
            order_number: 'ORD-20260616-0001',
            payment_reference: 'PAY-ORD-20260616-0001',
            first_name: 'Test',
            last_name: 'Customer',
            email: 'test@example.com',
            status: 'pending',
            package_name: 'SkyFibre Home Max',
            package_price: 999,
            created_at: '2026-06-16T10:00:00.000Z',
          },
          error: null,
        }),
      }),
    });
    const insertQuery = {
      insert: insertOrderMock,
    };

    mockCreateClient.mockResolvedValue({
      from: jest
        .fn()
        .mockReturnValueOnce(duplicateQuery)
        .mockReturnValueOnce(orderNumberQuery)
        .mockReturnValueOnce(insertQuery),
    } as any);
  });

  it('blocks SkyFibre orders when combined orderability is not orderable', async () => {
    mockCheckSkyFibreOrderability.mockResolvedValue({
      decision: 'covered_not_orderable',
      segment: 'residential',
      capacityMbps: 100,
      tcsCoverage: {
        covered: true,
        confidence: 'high',
        nearestBnOnline: true,
        nearestBnActiveRnCount: 10,
        reason: 'BN active with RN evidence.',
      },
      cspOrderability: {
        provider: 'mtn-csp',
        productName: 'Fixed Wireless Broadband',
        method: 'feasibilityOld',
        capacityMbps: 100,
        orderable: false,
        status: 'not_orderable',
        checkedAt: '2026-06-16T10:00:00.000Z',
      },
    });

    const response = await POST(
      request({
        first_name: 'Test',
        last_name: 'Customer',
        email: 'test@example.com',
        phone: '0821234567',
        installation_address: '1 Test Street, Sandton',
        coordinates: { lat: -26.1, lng: 28.0 },
        installation_location_type: 'freestanding_home',
        package_name: 'SkyFibre Home Max',
        package_speed: '100/25 Mbps',
        package_price: 999,
        coverage_lead_id: 'lead-1',
      })
    );
    const body = await response.json();

    expect(mockIsSkyFibrePackage).toHaveBeenCalledWith(expect.objectContaining({ package_name: 'SkyFibre Home Max' }));
    expect(response.status).toBe(409);
    expect(body.error).toMatch(/not orderable/i);
    expect(mockCheckSkyFibreOrderability).toHaveBeenCalledWith(
      expect.objectContaining({ leadId: 'lead-1', capacityMbps: 100, segment: 'residential' }),
      expect.objectContaining({ supabase: expect.any(Object) })
    );
    expect(mockSendOrderConfirmation).not.toHaveBeenCalled();
  });

  it('stamps new orders with the once-off order processing fee', async () => {
    mockIsSkyFibrePackage.mockReturnValue(false);

    const response = await POST(
      request({
        first_name: 'Test',
        last_name: 'Customer',
        email: 'test@example.com',
        phone: '0821234567',
        installation_address: '1 Test Street, Sandton',
        installation_location_type: 'freestanding_home',
        package_name: 'Home Fibre',
        package_speed: '50/25 Mbps',
        package_price: 899,
      })
    );

    expect(response.status).toBe(200);
    expect(insertOrderMock).toHaveBeenCalledWith(
      expect.objectContaining({
        payment_amount: ORDER_PROCESSING_FEE_AMOUNT,
      })
    );
  });
});
