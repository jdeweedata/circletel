import { NextRequest } from 'next/server';
import { POST } from '@/app/api/payment/netcash/initiate/route';
import { getPaymentProvider } from '@/lib/payments/payment-provider-factory';
import {
  ORDER_PROCESSING_FEE_AMOUNT,
  ORDER_PROCESSING_FEE_LABEL,
} from '@/lib/payments/payment-amounts';

const createClientMock = jest.fn();

jest.mock('@/lib/supabase/server', () => ({
  createClient: () => createClientMock(),
}));

jest.mock('@/lib/payments/payment-provider-factory', () => ({
  getPaymentProvider: jest.fn(),
}));

jest.mock('@/lib/logging', () => ({
  paymentLogger: {
    info: jest.fn(),
    error: jest.fn(),
  },
}));

const mockGetPaymentProvider = getPaymentProvider as jest.MockedFunction<typeof getPaymentProvider>;

describe('POST /api/payment/netcash/initiate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('describes the order processing fee payment at the gateway', async () => {
    const initiateMock = jest.fn().mockResolvedValue({
      success: true,
      paymentUrl: 'https://pay.test/checkout',
      formData: { p4: ORDER_PROCESSING_FEE_AMOUNT.toFixed(2) },
    });
    mockGetPaymentProvider.mockReturnValue({
      isConfigured: () => true,
      initiate: initiateMock,
    } as ReturnType<typeof getPaymentProvider>);

    const order = {
      id: 'order-123',
      payment_status: 'pending',
      status: 'pending',
      payment_amount: ORDER_PROCESSING_FEE_AMOUNT,
      email: 'customer@example.com',
      first_name: 'Jane',
      last_name: 'Customer',
      payment_reference: 'PAY-ORDER-123',
      order_number: 'ORD-2026-00042',
      package_name: 'Vox LTE Unlimited 50Mbps',
      city: 'Cape Town',
      suburb: 'Sea Point',
      account_number: null,
      customer_id: null,
    };

    const updateEq = jest.fn().mockResolvedValue({ error: null });
    const auditInsert = jest.fn().mockResolvedValue({ error: null });
    const supabase = {
      from: jest.fn((table: string) => {
        if (table === 'consumer_orders') {
          return {
            select: jest.fn(() => ({
              eq: jest.fn(() => ({
                single: jest.fn().mockResolvedValue({ data: order, error: null }),
              })),
            })),
            update: jest.fn(() => ({ eq: updateEq })),
          };
        }

        if (table === 'payment_audit_logs') {
          return { insert: auditInsert };
        }

        throw new Error(`Unexpected table: ${table}`);
      }),
    };
    createClientMock.mockResolvedValue(supabase);

    const request = new NextRequest('http://localhost/api/payment/netcash/initiate', {
      method: 'POST',
      body: JSON.stringify({ orderId: order.id, amount: 1 }),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await POST(request);

    expect(response.status).toBe(200);
    expect(initiateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: ORDER_PROCESSING_FEE_AMOUNT,
        description: `CircleTel - ${ORDER_PROCESSING_FEE_LABEL}`,
        reference: order.payment_reference,
        customerEmail: order.email,
      })
    );
  });
});
