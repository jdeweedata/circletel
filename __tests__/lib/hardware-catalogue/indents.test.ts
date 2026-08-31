import { createHardwareIndentForPaidOrder } from '@/lib/hardware-catalogue/indents';
import { FIVE_G_CASH_CPE_PRICE_INCL_VAT } from '@/lib/products/five-g-cash-cpe';
import { HARDWARE_PRODUCTS_TABLE } from '@/lib/tenant';

describe('createHardwareIndentForPaidOrder', () => {
  it('does not create an indent before NetCash payment succeeds', async () => {
    const insert = jest.fn();
    const supabase = {
      from: jest.fn(() => {
        throw new Error('unpaid checkout must not touch hardware_indents');
      }),
    };

    const result = await createHardwareIndentForPaidOrder(supabase, {
      id: 'order-unpaid',
      payment_status: 'pending',
      router_fee: FIVE_G_CASH_CPE_PRICE_INCL_VAT,
      metadata: { cash_cpe: { sku: 'G5C' } },
    });

    expect(result).toEqual({ created: false, reason: 'unpaid' });
    expect(insert).not.toHaveBeenCalled();
  });

  it('creates one pending indent after a paid cash-CPE order', async () => {
    const existing = jest.fn().mockResolvedValue({ data: null, error: null });
    const insert = jest.fn().mockResolvedValue({
      data: {
        id: 'indent-1',
        consumer_order_id: 'order-paid',
        hardware_product_id: 'hw-g5c',
        supplier_sku: 'G5C',
        status: 'pending',
      },
      error: null,
    });
    const productLookup = jest.fn().mockResolvedValue({
      data: { id: 'hw-g5c', metadata: { supplier_sku: 'G5C', cash_cpe: true } },
      error: null,
    });

    const supabase = {
      from: jest.fn((table: string) => {
        if (table === 'hardware_indents') {
          return {
            select: jest.fn(() => ({
              eq: jest.fn(() => ({
                maybeSingle: existing,
              })),
            })),
            insert: jest.fn(() => ({
              select: jest.fn(() => ({
                single: insert,
              })),
            })),
          };
        }
        if (table === HARDWARE_PRODUCTS_TABLE) {
          return {
            select: jest.fn(() => ({
              eq: jest.fn(() => ({
                contains: jest.fn(() => ({
                  maybeSingle: productLookup,
                })),
              })),
            })),
          };
        }
        throw new Error(`Unexpected table: ${table}`);
      }),
    };

    const result = await createHardwareIndentForPaidOrder(supabase, {
      id: 'order-paid',
      payment_status: 'paid',
      router_fee: FIVE_G_CASH_CPE_PRICE_INCL_VAT,
      router_model: 'ZTE G5C 5G CPE WiFi Router',
      metadata: { cash_cpe: { sku: 'G5C' } },
    });

    expect(result.created).toBe(true);
    expect(result.indent).toMatchObject({
      consumer_order_id: 'order-paid',
      supplier_sku: 'G5C',
      status: 'pending',
    });
  });
});
