import {
  buildUnjaniVatCatchupPlan,
  collectAbsorbedPriorInvoiceIds,
  formatUnjaniCatchupAbsorbedNote,
  isUnjaniCatchupAbsorbed,
  isWrongUnjaniFullMonthInvoice,
  shortfallInclVsMsa,
  UNJANI_FULL_MONTH_TARGET_INCL,
  UNJANI_MSA_CATCHUP_ABSORBED_MARKER,
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

  it('skips paid/partial priors already marked absorbed in notes (idempotent)', () => {
    const absorbedPaid = {
      ...wrongPaid,
      notes: formatUnjaniCatchupAbsorbedNote('INV-2026-00099', 'close_due'),
    };
    const absorbedPartial = {
      ...wrongPartial,
      notes: `${UNJANI_MSA_CATCHUP_ABSORBED_MARKER} via INV-2026-00099`,
    };

    expect(isUnjaniCatchupAbsorbed(absorbedPaid.notes)).toBe(true);
    expect(shortfallInclVsMsa(absorbedPaid)).toBe(0);
    expect(shortfallInclVsMsa(absorbedPartial)).toBe(0);

    // Still "wrong" pattern (status not voided) but must not re-catch-up
    expect(isWrongUnjaniFullMonthInvoice(absorbedPaid)).toBe(true);

    const plan = buildUnjaniVatCatchupPlan([
      absorbedPaid,
      absorbedPartial,
      wrongOpen, // not yet absorbed
    ]);
    expect(plan.lineItems).toHaveLength(1);
    expect(plan.lineItems[0].prior_invoice_id).toBe('b');
    expect(plan.totalIncl).toBe(517.5);
    expect(plan.priorInvoiceIdsToVoid).toEqual(['b']);
    expect(plan.priorInvoiceIdsToCloseDue).toHaveLength(0);
  });

  it('skips priors already referenced by sibling adjustment line_items', () => {
    const laterInvoiceWithCatchup = {
      id: 'later',
      invoice_number: 'INV-2026-00100',
      status: 'sent',
      subtotal: 508.7,
      tax_amount: 76.3,
      total_amount: 585,
      amount_paid: 0,
      line_items: [
        {
          description: 'Managed Connectivity - August 2026',
          type: 'recurring',
          unit_price: 450,
          amount: 450,
        },
        {
          description: 'Prior period billing correction INV-2026-00023',
          type: 'adjustment',
          unit_price: 58.7,
          amount: 58.7,
          prior_invoice_id: 'a',
          prior_invoice_number: 'INV-2026-00023',
        },
        {
          description: 'Prior period billing correction INV-2026-00027',
          type: 'adjustment',
          unit_price: 210,
          amount: 210,
          prior_invoice_id: 'c',
          prior_invoice_number: 'INV-2026-00027',
        },
      ],
    };

    const absorbed = collectAbsorbedPriorInvoiceIds([
      wrongPaid,
      wrongPartial,
      laterInvoiceWithCatchup,
    ]);
    expect(absorbed.has('a')).toBe(true);
    expect(absorbed.has('c')).toBe(true);

    // Second monthly run sees original paid/partial (no notes yet) + later invoice
    const plan = buildUnjaniVatCatchupPlan([
      wrongPaid,
      wrongPartial,
      wrongOpen,
      laterInvoiceWithCatchup,
    ]);
    // a and c already on later invoice lines — only open b remains
    expect(plan.lineItems.map((l) => l.prior_invoice_id)).toEqual(['b']);
    expect(plan.totalIncl).toBe(517.5);
  });

  it('formatUnjaniCatchupAbsorbedNote preserves prior notes and is detectable', () => {
    const note = formatUnjaniCatchupAbsorbedNote(
      'INV-2026-00050',
      'close_due',
      'Customer paid via PayNow'
    );
    expect(note).toContain('Customer paid via PayNow');
    expect(note).toContain(UNJANI_MSA_CATCHUP_ABSORBED_MARKER);
    expect(note).toContain('INV-2026-00050');
    expect(isUnjaniCatchupAbsorbed(note)).toBe(true);

    // Re-format does not stack duplicate markers
    const again = formatUnjaniCatchupAbsorbedNote('INV-2026-00051', 'close_due', note);
    const markerCount = again.split(UNJANI_MSA_CATCHUP_ABSORBED_MARKER).length - 1;
    expect(markerCount).toBe(1);
  });
});
