import {
  ZOHO_MOVEMENT_REF_PREFIX,
  adjustmentQuantity,
  applyInboundStockAbsolute,
  applyInboundStockDelta,
  buildInventoryAdjustmentPayload,
  isEchoReference,
  movementReference,
  parseInventoryWebhookPayload,
  shouldPushMovement,
} from '@/lib/integrations/zoho/inventory-sync';

describe('Zoho Inventory hybrid event sync', () => {
  it('builds an idempotent adjustment reference from the warehouse movement id', () => {
    expect(movementReference('7a1c2d3e-0000-4000-8000-000000000001')).toBe(
      'CT-WH-7a1c2d3e-0000-4000-8000-000000000001'
    );
    expect(ZOHO_MOVEMENT_REF_PREFIX).toBe('CT-WH-');
    expect(isEchoReference('CT-WH-7a1c2d3e-0000-4000-8000-000000000001')).toBe(true);
    expect(isEchoReference('INV-ADJ-99')).toBe(false);
    expect(isEchoReference(null)).toBe(false);
  });

  it('pushes only receive and issue movements, never reserve or release', () => {
    expect(shouldPushMovement('receive')).toBe(true);
    expect(shouldPushMovement('issue')).toBe(true);
    expect(shouldPushMovement('reserve')).toBe(false);
    expect(shouldPushMovement('release')).toBe(false);
  });

  it('maps receive to a positive adjustment and issue to a negative one', () => {
    expect(adjustmentQuantity('receive', 2)).toBe(2);
    expect(adjustmentQuantity('issue', 1)).toBe(-1);
    expect(adjustmentQuantity('issue', -1)).toBe(-1);
  });

  it('builds a quantity adjustment payload with the movement reference', () => {
    expect(
      buildInventoryAdjustmentPayload({
        movementId: 'mov-1',
        movementType: 'issue',
        qty: 1,
        itemId: '333000000001',
        date: '2026-09-03',
        locationId: 'loc-1',
        adjustmentAccountId: 'acc-9',
      })
    ).toEqual({
      date: '2026-09-03',
      reason: 'Warehouse issue',
      adjustment_type: 'quantity',
      reference_number: 'CT-WH-mov-1',
      line_items: [
        {
          item_id: '333000000001',
          quantity_adjusted: -1,
          location_id: 'loc-1',
          adjustment_account_id: 'acc-9',
        },
      ],
    });
  });

  it('skips inbound events that echo an outbound warehouse adjustment', () => {
    expect(
      applyInboundStockDelta({
        reference: 'CT-WH-mov-1',
        skuMapped: true,
        qtyOnHand: 5,
        qtyReserved: 1,
        delta: -1,
      })
    ).toEqual({ action: 'skip_echo' });

    expect(
      applyInboundStockAbsolute({
        reference: 'CT-WH-mov-1',
        skuMapped: true,
        qtyOnHand: 5,
        qtyReserved: 1,
        zohoStockOnHand: 4,
      })
    ).toEqual({ action: 'skip_echo' });
  });

  it('skips unmapped SKUs and never writes reserved', () => {
    expect(
      applyInboundStockDelta({
        reference: 'PO-88',
        skuMapped: false,
        qtyOnHand: 5,
        qtyReserved: 2,
        delta: 3,
      })
    ).toEqual({ action: 'skip_unmapped' });
  });

  it('applies a Zoho receive or count delta to on-hand only', () => {
    expect(
      applyInboundStockDelta({
        reference: 'ADJ-COUNT',
        skuMapped: true,
        qtyOnHand: 5,
        qtyReserved: 2,
        delta: 3,
      })
    ).toEqual({
      action: 'applied',
      nextOnHand: 8,
      reserved: 2,
      overReserved: false,
    });
  });

  it('sets on-hand from Zoho stock_on_hand on poll without changing reserved', () => {
    expect(
      applyInboundStockAbsolute({
        skuMapped: true,
        qtyOnHand: 5,
        qtyReserved: 1,
        zohoStockOnHand: 4,
      })
    ).toEqual({
      action: 'applied',
      nextOnHand: 4,
      reserved: 1,
      overReserved: false,
    });
  });

  it('no-ops when poll stock already matches', () => {
    expect(
      applyInboundStockAbsolute({
        skuMapped: true,
        qtyOnHand: 5,
        qtyReserved: 1,
        zohoStockOnHand: 5,
      })
    ).toEqual({ action: 'noop' });
  });

  it('flags reserved greater than on-hand and does not unreserve', () => {
    expect(
      applyInboundStockDelta({
        reference: 'DAMAGE',
        skuMapped: true,
        qtyOnHand: 5,
        qtyReserved: 4,
        delta: -2,
      })
    ).toEqual({
      action: 'applied',
      nextOnHand: 3,
      reserved: 4,
      overReserved: true,
    });
  });

  it('parses inventory adjustment and item webhook shapes', () => {
    expect(
      parseInventoryWebhookPayload({
        inventory_adjustment: {
          reference_number: 'ADJ-1',
          line_items: [
            { item_id: '111', sku: 'UNJ-KIT-ROUTER', quantity_adjusted: 2 },
          ],
        },
      })
    ).toEqual({
      reference: 'ADJ-1',
      sku: 'UNJ-KIT-ROUTER',
      itemId: '111',
      quantityAdjusted: 2,
      stockOnHand: null,
    });

    expect(
      parseInventoryWebhookPayload({
        item: { item_id: '222', sku: 'UNJ-KIT-AP', stock_on_hand: 7 },
      })
    ).toEqual({
      reference: null,
      sku: 'UNJ-KIT-AP',
      itemId: '222',
      quantityAdjusted: null,
      stockOnHand: 7,
    });
  });
});
