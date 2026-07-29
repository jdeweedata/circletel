import {
  computeVatInclusiveAmounts,
  nextInvoiceSequence,
  formatInvoiceNumber,
} from '@/lib/billing/invoice-amounts';

describe('computeVatInclusiveAmounts (price is VAT-inclusive / gross)', () => {
  // These mirror real paid invoices: INV-2026-00008 (R899), INV-2026-00005 (R999).
  it('decomposes R899 gross into net 781.74 + VAT 117.26', () => {
    expect(computeVatInclusiveAmounts(899)).toEqual({
      subtotal: 781.74,
      vatAmount: 117.26,
      totalAmount: 899,
    });
  });

  it('decomposes R999 gross into net 868.70 + VAT 130.30', () => {
    expect(computeVatInclusiveAmounts(999)).toEqual({
      subtotal: 868.7,
      vatAmount: 130.3,
      totalAmount: 999,
    });
  });

  it('decomposes R450 as inclusive gross into net 391.30 + VAT 58.70', () => {
    // Pure inclusive math (not Unjani product basis — Unjani is exclusive; see invoice-vat-contract)
    expect(computeVatInclusiveAmounts(450)).toEqual({
      subtotal: 391.3,
      vatAmount: 58.7,
      totalAmount: 450,
    });
  });

  it('net + VAT always equals the gross total (no rounding drift)', () => {
    for (const gross of [899, 999, 450, 1, 1234.56, 0]) {
      const { subtotal, vatAmount, totalAmount } = computeVatInclusiveAmounts(gross);
      expect(Number((subtotal + vatAmount).toFixed(2))).toBe(totalAmount);
      expect(totalAmount).toBe(gross);
    }
  });
});

describe('nextInvoiceSequence', () => {
  it('returns max+1 of the current year, ignoring other years/formats', () => {
    expect(
      nextInvoiceSequence(['INV-2026-00008', 'INV-2026-00003', 'INV-000040', 'INV-2025-00099'], 2026)
    ).toBe(9);
  });

  it('starts at 1 when no invoices exist for the year', () => {
    expect(nextInvoiceSequence([], 2026)).toBe(1);
    expect(nextInvoiceSequence(['INV-2025-00050'], 2026)).toBe(1);
  });
});

describe('formatInvoiceNumber', () => {
  it('formats as INV-YYYY-NNNNN (5-digit, zero-padded)', () => {
    expect(formatInvoiceNumber(2026, 9)).toBe('INV-2026-00009');
    expect(formatInvoiceNumber(2026, 12345)).toBe('INV-2026-12345');
  });
});
