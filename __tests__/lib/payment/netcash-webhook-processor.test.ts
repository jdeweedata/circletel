import { processPaymentSuccess } from '@/lib/payment/netcash-webhook-processor';
import type { NetcashWebhookPayload } from '@/lib/payment/netcash-webhook-validator';
import {
  ORDER_PROCESSING_FEE_AMOUNT,
  ORDER_PROCESSING_FEE_LABEL,
  checkoutPaymentAmount,
} from '@/lib/payments/payment-amounts';
import { FIVE_G_CASH_CPE_PRICE_INCL_VAT } from '@/lib/products/five-g-cash-cpe';
import { createHardwareIndentForPaidOrder } from '@/lib/hardware-catalogue/indents';

jest.mock('@/lib/hardware-catalogue/indents', () => ({
  createHardwareIndentForPaidOrder: jest.fn().mockResolvedValue({ created: true }),
}));

const createClientMock = jest.fn();

jest.mock('@/lib/supabase/server', () => ({
  createClient: () => createClientMock(),
}));

describe('Netcash webhook processor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('confirms the order processing fee payment without activating service', async () => {
    const order = {
      id: 'order-123',
      email: 'customer@example.com',
      customer_id: null,
      payment_reference: 'CT-ORDER-123',
      payment_status: 'pending',
      metadata: { source: 'checkout' },
    };

    const consumerOrdersUpdate = jest.fn(() => ({
      eq: jest.fn().mockResolvedValue({ error: null }),
    }));
    const customerMaybeSingle = jest.fn().mockResolvedValue({ data: null, error: null });
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
            update: consumerOrdersUpdate,
          };
        }

        if (table === 'customers') {
          return {
            select: jest.fn(() => ({
              eq: jest.fn(() => ({
                maybeSingle: customerMaybeSingle,
              })),
            })),
          };
        }

        if (table === 'payment_webhook_audit') {
          return {
            insert: auditInsert,
          };
        }

        throw new Error(`Unexpected table: ${table}`);
      }),
    };

    createClientMock.mockResolvedValue(supabase);

    const payload: NetcashWebhookPayload = {
      Reference: 'CT-ORDER-123',
      Amount: String(ORDER_PROCESSING_FEE_AMOUNT * 100),
      Status: 'Success',
      TransactionID: 'TX-149',
      CardNumber: '************4242',
      CardType: 'Visa',
    };

    const result = await processPaymentSuccess(payload, 'webhook-123');

    expect(result).toMatchObject({
      success: true,
      orderId: order.id,
    });
    expect(result.message).toContain('Order processing fee processed');

    expect(consumerOrdersUpdate).toHaveBeenCalledTimes(1);
    expect(consumerOrdersUpdate).not.toHaveBeenCalledWith(
      expect.objectContaining({ status: 'active' })
    );
    expect(consumerOrdersUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        payment_status: 'paid',
        status: 'confirmed',
        total_paid: ORDER_PROCESSING_FEE_AMOUNT,
        metadata: expect.objectContaining({
          source: 'checkout',
          checkout_charge_type: 'order_processing_fee',
          checkout_charge_label: ORDER_PROCESSING_FEE_LABEL,
          netcash_transaction_id: 'TX-149',
          card_last_four: '4242',
          card_type: 'Visa',
        }),
      })
    );

    expect(auditInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        webhook_id: 'webhook-123',
        event_type: 'order_processing_fee_paid',
        event_data: expect.objectContaining({
          order_id: order.id,
          transaction_id: 'TX-149',
          amount: ORDER_PROCESSING_FEE_AMOUNT,
        }),
      })
    );
    expect(createHardwareIndentForPaidOrder).not.toHaveBeenCalled();
  });

  it('confirms R3148.99 cash-CPE checkout without activating service', async () => {
    const charged = checkoutPaymentAmount({ cashCpe: true });
    const order = {
      id: 'order-cpe',
      email: 'customer@example.com',
      customer_id: null,
      payment_reference: 'CT-ORDER-CPE',
      payment_status: 'pending',
      router_fee: FIVE_G_CASH_CPE_PRICE_INCL_VAT,
      router_model: 'ZTE G5C 5G CPE WiFi Router',
      metadata: { cash_cpe: { sku: 'G5C' } },
    };

    const consumerOrdersUpdate = jest.fn(() => ({
      eq: jest.fn().mockResolvedValue({ error: null }),
    }));
    const customerMaybeSingle = jest.fn().mockResolvedValue({ data: null, error: null });
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
            update: consumerOrdersUpdate,
          };
        }

        if (table === 'customers') {
          return {
            select: jest.fn(() => ({
              eq: jest.fn(() => ({
                maybeSingle: customerMaybeSingle,
              })),
            })),
          };
        }

        if (table === 'payment_webhook_audit') {
          return { insert: auditInsert };
        }

        throw new Error(`Unexpected table: ${table}`);
      }),
    };

    createClientMock.mockResolvedValue(supabase);

    const result = await processPaymentSuccess(
      {
        Reference: 'CT-ORDER-CPE',
        Amount: String(Math.round(charged * 100)),
        Status: 'Success',
        TransactionID: 'TX-CPE',
        CardNumber: '************4242',
        CardType: 'Visa',
      },
      'webhook-cpe'
    );

    expect(result).toMatchObject({
      success: true,
      orderId: order.id,
    });
    expect(consumerOrdersUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        payment_status: 'paid',
        status: 'confirmed',
        total_paid: charged,
      })
    );
    expect(consumerOrdersUpdate).not.toHaveBeenCalledWith(
      expect.objectContaining({ status: 'active' })
    );
    expect(createHardwareIndentForPaidOrder).toHaveBeenCalledWith(
      supabase,
      expect.objectContaining({
        id: order.id,
        router_fee: FIVE_G_CASH_CPE_PRICE_INCL_VAT,
      })
    );
  });
});
