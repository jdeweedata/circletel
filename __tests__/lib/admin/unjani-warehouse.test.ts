import { isVisitWindowBlocked } from '@/lib/admin/unjani-operator-actions';
import {
  UNJANI_CONNECT_KIT,
  availableQty,
  canReserveKit,
  fulfilWindow,
  replenishmentDue,
  assertScheduleAllowed,
} from '@/lib/admin/unjani-warehouse';

describe('Unjani Connect warehouse kit ledger', () => {
  const kitStock = [
    { sku: 'UNJ-KIT-ROUTER', qtyOnHand: 2, qtyReserved: 1 },
    { sku: 'UNJ-KIT-AP', qtyOnHand: 3, qtyReserved: 1 },
  ];

  it('reserves a kit only when every line has free stock', () => {
    expect(availableQty(2, 1)).toBe(1);
    expect(canReserveKit(kitStock, UNJANI_CONNECT_KIT)).toBe(true);
    expect(
      canReserveKit(
        [
          { sku: 'UNJ-KIT-ROUTER', qtyOnHand: 1, qtyReserved: 1 },
          { sku: 'UNJ-KIT-AP', qtyOnHand: 5, qtyReserved: 0 },
        ],
        UNJANI_CONNECT_KIT
      )
    ).toBe(false);
  });

  it('sets replenishment due in 5 business days and fulfil window 14–21 business days', () => {
    const orderedAt = new Date(2026, 7, 17, 12, 0, 0);
    expect(replenishmentDue(orderedAt)).toBe('2026-08-24');
    const window = fulfilWindow(orderedAt);
    expect(window.fulfilByMin).toBe('2026-09-04');
    expect(window.fulfilByMax).toBe('2026-09-15');
  });

  it('blocks booking until stock is reserved and keeps the 25th–7th visit window', () => {
    expect(() =>
      assertScheduleAllowed({
        stockStatus: 'on_order',
        visitDate: '2026-09-10',
        fulfilByMax: '2026-09-15',
      })
    ).toThrow(/reserved/i);

    expect(isVisitWindowBlocked('2026-09-01')).toBe(true);
    expect(() =>
      assertScheduleAllowed({
        stockStatus: 'reserved',
        visitDate: '2026-09-01',
        fulfilByMax: '2026-09-15',
      })
    ).toThrow(/25th/i);

    expect(() =>
      assertScheduleAllowed({
        stockStatus: 'reserved',
        visitDate: '2026-09-16',
        fulfilByMax: '2026-09-15',
      })
    ).toThrow(/21 business days/i);

    expect(
      assertScheduleAllowed({
        stockStatus: 'reserved',
        visitDate: '2026-09-10',
        fulfilByMax: '2026-09-15',
      })
    ).toBe(true);
  });
});
