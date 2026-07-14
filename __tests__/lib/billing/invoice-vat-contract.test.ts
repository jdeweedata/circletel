import {
  assertInvoiceVatHeaders,
  buildZohoTaxInclusiveInvoicePayload,
  nearlyEqual,
  readLineMoney,
  roundMoney,
} from '@/lib/billing/invoice-vat-contract';

describe('invoice VAT contract → Zoho tax-inclusive payload', () => {
  it('maps Unjani-style net lines to gross rates with is_inclusive_tax', () => {
    const payload = buildZohoTaxInclusiveInvoicePayload({
      subtotal: 391.3,
      tax_amount: 58.7,
      total_amount: 450,
      line_items: [
        {
          description: 'Unjani Managed Connectivity - July 2026',
          quantity: 1,
          unit_price: 391.3,
          amount: 391.3,
        },
      ],
    });

    expect(payload.is_inclusive_tax).toBe(true);
    expect(payload.expectedTotal).toBe(450);
    expect(payload.line_items).toHaveLength(1);
    expect(payload.line_items[0].rate).toBe(450);
    expect(
      roundMoney(payload.line_items[0].rate * payload.line_items[0].quantity)
    ).toBe(450);
  });

  it('maps consumer R999 net lines to gross total 999', () => {
    const payload = buildZohoTaxInclusiveInvoicePayload({
      subtotal: 868.7,
      tax_amount: 130.3,
      total_amount: 999,
      line_items: [
        {
          description: 'SkyFibre Home Plus - July 2026',
          quantity: 1,
          unit_price: 868.7,
          amount: 868.7,
        },
      ],
    });

    expect(payload.is_inclusive_tax).toBe(true);
    expect(payload.line_items[0].rate).toBe(999);
  });

  it('keeps legacy gross unit_price lines as inclusive rates', () => {
    const payload = buildZohoTaxInclusiveInvoicePayload({
      subtotal: 781.74,
      tax_amount: 117.26,
      total_amount: 899,
      line_items: [
        {
          description: 'SkyFibre Home Plus - December 2025',
          quantity: 1,
          unit_price: 899,
          amount: 899,
        },
      ],
    });

    expect(payload.is_inclusive_tax).toBe(true);
    expect(payload.line_items[0].rate).toBe(899);
  });

  it('maps B2B-style ex-VAT subtotal headers to inclusive gross total', () => {
    // e.g. pro-rata net 1000 + 15% VAT = 1150
    const payload = buildZohoTaxInclusiveInvoicePayload({
      subtotal: 1000,
      tax_amount: 150,
      total_amount: 1150,
      line_items: [
        {
          description: 'Pro-rata activation',
          quantity: 1,
          unit_price: 1000,
          amount: 1000,
        },
      ],
    });

    expect(payload.is_inclusive_tax).toBe(true);
    expect(payload.line_items[0].rate).toBe(1150);
  });

  it('falls back to total_amount when line keys are wrong/missing', () => {
    const payload = buildZohoTaxInclusiveInvoicePayload(
      {
        subtotal: 868.7,
        tax_amount: 130.3,
        total_amount: 999,
        line_items: [{ description: 'Broken', quantity: 1 }], // no money keys
      },
      'Monthly Service Fee'
    );

    expect(payload.line_items[0].rate).toBe(999);
    expect(payload.line_items[0].name).toBe('Monthly Service Fee');
  });

  it('reads unit_price / amount in preference to legacy price/rate', () => {
    expect(readLineMoney({ unit_price: 100, quantity: 2 })).toEqual({
      quantity: 2,
      unitOrAmount: 200,
    });
    expect(readLineMoney({ amount: 50, unit_price: 999, quantity: 1 })).toEqual({
      quantity: 1,
      unitOrAmount: 50,
    });
  });

  it('assertInvoiceVatHeaders accepts consistent triples', () => {
    expect(
      assertInvoiceVatHeaders({
        subtotal: 391.3,
        tax_amount: 58.7,
        total_amount: 450,
      }).ok
    ).toBe(true);
  });

  it('assertInvoiceVatHeaders rejects broken triples', () => {
    const r = assertInvoiceVatHeaders({
      subtotal: 450,
      tax_amount: 0,
      total_amount: 450, // would be ok if tax 0
    });
    expect(r.ok).toBe(true);

    const bad = assertInvoiceVatHeaders({
      subtotal: 450,
      tax_amount: 67.5,
      total_amount: 450,
    });
    expect(bad.ok).toBe(false);
  });

  it('pro-rata consumer line matches inclusive total (Raymund-style)', () => {
    const payload = buildZohoTaxInclusiveInvoicePayload({
      subtotal: 526.64,
      tax_amount: 79,
      total_amount: 605.64,
      line_items: [
        {
          description: 'CircleConnect 5G pro-rata',
          quantity: 1,
          unit_price: 526.64,
          amount: 526.64,
        },
      ],
    });
    expect(nearlyEqual(payload.line_items[0].rate, 605.64)).toBe(true);
  });
});
