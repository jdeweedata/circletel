import {
  buildUnjaniVatCatchupPlan,
  isWrongUnjaniFullMonthInvoice,
  shortfallInclVsMsa,
  UNJANI_FULL_MONTH_TARGET_INCL,
} from '@/lib/billing/unjani-vat-catchup';

describe('unjani VAT catch-up (deferred to next invoice run)', () => {
  const wrongPaid = {
    id: 'a',
    invoice_number: 'INV-2026-00023',
    status: 'paid',
    subtotal: 391.3,
    tax_amount: 58.7,
    total_amount: 450,
    amount_paid: 450,
    period_start: '2026-07-01',
    period_end: '2026-07-31',
  };

  const wrongOpen = {
    id: 'b',
    invoice_number: 'INV-2026-00025',
    status: 'sent',
    subtotal: 391.3,
    tax_amount: 58.7,
    total_amount: 450,
    amount_paid: 0,
    period_start: '2026-07-01',
    period_end: '2026-07-31',
  };

  const wrongPartial = {
    id: 'c',
    invoice_number: 'INV-2026-00027',
    status: 'partial',
    subtotal: 391.3,
    tax_amount: 58.7,
    total_amount: 450,
    amount_paid: 276,
    period_start: '2026-07-01',
    period_end: '2026-07-31',
  };

  const correct = {
    id: 'd',
    invoice_number: 'INV-2026-00038',
    status: 'sent',
    subtotal: 450,
    tax_amount: 67.5,
    total_amount: 517.5,
    amount_paid: 0,
  };

  const prorata = {
    id: 'e',
    invoice_number: 'INV-2026-00014',
    status: 'paid',
    subtotal: 240,
    tax_amount: 36,
    total_amount: 276,
    amount_paid: 276,
  };

  it('detects wrong full-month incl model', () => {
    expect(isWrongUnjaniFullMonthInvoice(wrongPaid)).toBe(true);
    expect(isWrongUnjaniFullMonthInvoice(correct)).toBe(false);
    expect(isWrongUnjaniFullMonthInvoice(prorata)).toBe(false);
  });

  it('computes shortfall vs MSA 517.50', () => {
    expect(shortfallInclVsMsa(wrongPaid)).toBe(67.5);
    expect(shortfallInclVsMsa(wrongOpen)).toBe(517.5);
    expect(shortfallInclVsMsa(wrongPartial)).toBe(241.5);
    expect(shortfallInclVsMsa(correct)).toBe(0);
  });

  it('builds catch-up lines; voids unpaid; closes due on paid/partial', () => {
    const plan = buildUnjaniVatCatchupPlan([
      wrongPaid,
      wrongOpen,
      wrongPartial,
      correct,
      prorata,
    ]);

    expect(plan.lineItems).toHaveLength(3);
    expect(plan.totalIncl).toBe(67.5 + 517.5 + 241.5);
    expect(plan.priorInvoiceIdsToVoid).toEqual(['b']); // open unpaid only
    expect(plan.priorInvoiceIdsToCloseDue.sort()).toEqual(['a', 'c']); // paid + partial
    expect(plan.subtotalExcl + plan.vatAmount).toBeCloseTo(plan.totalIncl, 2);
    expect(UNJANI_FULL_MONTH_TARGET_INCL).toBe(517.5);
  });

  it('returns empty plan when nothing to catch up', () => {
    const plan = buildUnjaniVatCatchupPlan([correct, prorata]);
    expect(plan.lineItems).toHaveLength(0);
    expect(plan.totalIncl).toBe(0);
    expect(plan.priorInvoiceIdsToVoid).toHaveLength(0);
    expect(plan.priorInvoiceIdsToCloseDue).toHaveLength(0);
  });
});
