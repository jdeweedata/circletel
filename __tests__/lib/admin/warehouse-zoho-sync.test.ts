jest.mock('@/lib/inngest/client', () => ({
  inngest: { send: jest.fn() },
}));
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}));
jest.mock('@/lib/logging', () => ({
  zohoLogger: { error: jest.fn(), warn: jest.fn(), debug: jest.fn(), info: jest.fn() },
  webhookLogger: { error: jest.fn(), warn: jest.fn(), info: jest.fn() },
}));

import { applyZohoInventoryWebhook } from '@/lib/admin/warehouse-zoho-sync';

function createMockDb(stock: { sku: string; qty_on_hand: number; qty_reserved: number }) {
  const updates: Array<Record<string, unknown>> = [];
  const events: Array<Record<string, unknown>> = [];

  const db = {
    from(table: string) {
      return {
        select() {
          return {
            eq(_column: string, value: string) {
              return {
                single: async () => {
                  if (table === 'warehouse_stock' && value === stock.sku) {
                    return { data: stock, error: null };
                  }
                  if (table === 'warehouse_skus' && value === stock.sku) {
                    return { data: { sku: stock.sku, zoho_item_id: 'item-1' }, error: null };
                  }
                  return { data: null, error: { message: 'not found' } };
                },
                maybeSingle: async () => {
                  if (table === 'warehouse_skus' && value === stock.sku) {
                    return { data: { sku: stock.sku, zoho_item_id: 'item-1' }, error: null };
                  }
                  return { data: null, error: null };
                },
              };
            },
          };
        },
        update(payload: Record<string, unknown>) {
          updates.push(payload);
          return {
            eq: async () => ({ error: null }),
          };
        },
        insert(payload: Record<string, unknown>) {
          events.push(payload);
          return { error: null };
        },
      };
    },
  };

  return { db, updates, events };
}

describe('applyZohoInventoryWebhook', () => {
  it('updates on-hand from a Zoho count and leaves reserved off the write', async () => {
    const { db, updates, events } = createMockDb({
      sku: 'UNJ-KIT-ROUTER',
      qty_on_hand: 5,
      qty_reserved: 2,
    });

    const result = await applyZohoInventoryWebhook(db, {
      inventory_adjustment: {
        reference_number: 'COUNT-1',
        line_items: [{ sku: 'UNJ-KIT-ROUTER', item_id: 'item-1', quantity_adjusted: -1 }],
      },
    });

    expect(result).toEqual({
      action: 'applied',
      nextOnHand: 4,
      reserved: 2,
      overReserved: false,
    });
    expect(updates[0]).toMatchObject({ qty_on_hand: 4, zoho_over_reserved_at: null });
    expect(updates[0]).not.toHaveProperty('qty_reserved');
    expect(events[0]).toMatchObject({ direction: 'inbound', status: 'success' });
  });

  it('skips echo adjustments so outbound issue is not applied twice', async () => {
    const { db, updates } = createMockDb({
      sku: 'UNJ-KIT-ROUTER',
      qty_on_hand: 5,
      qty_reserved: 1,
    });

    const result = await applyZohoInventoryWebhook(db, {
      inventory_adjustment: {
        reference_number: 'CT-WH-mov-9',
        line_items: [{ sku: 'UNJ-KIT-ROUTER', quantity_adjusted: -1 }],
      },
    });

    expect(result).toEqual({ action: 'skip_echo' });
    expect(updates).toHaveLength(0);
  });
});
