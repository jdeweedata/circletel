import { sanitizeInvoicePatch } from '@/lib/billing/engine/writer';

describe('sanitizeInvoicePatch', () => {
  it('strips status, id, invoice_number, customer_id', () => {
    expect(
      sanitizeInvoicePatch({
        status: 'paid',
        id: 'x',
        invoice_number: 'INV-1',
        customer_id: 'c1',
        amount_paid: 100,
        paid_at: '2026-07-01',
      })
    ).toEqual({ amount_paid: 100, paid_at: '2026-07-01' });
  });

  it('returns empty object for undefined patch', () => {
    expect(sanitizeInvoicePatch(undefined)).toEqual({});
  });
});
