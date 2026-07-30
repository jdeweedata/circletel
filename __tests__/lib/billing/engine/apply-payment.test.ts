import { nextStatusAfterPayment } from '@/lib/billing/engine/apply-payment';

describe('nextStatusAfterPayment', () => {
  it('marks full payment as paid from sent', () => {
    expect(
      nextStatusAfterPayment({
        current: 'sent',
        totalAmount: 100,
        amountPaidAfter: 100,
      })
    ).toBe('paid');
  });

  it('marks underpayment as partial', () => {
    expect(
      nextStatusAfterPayment({
        current: 'sent',
        totalAmount: 100,
        amountPaidAfter: 40,
      })
    ).toBe('partial');
  });

  it('allows partial → paid when remaining paid', () => {
    expect(
      nextStatusAfterPayment({
        current: 'partial',
        totalAmount: 100,
        amountPaidAfter: 100,
      })
    ).toBe('paid');
  });

  it('rejects payment on voided', () => {
    expect(() =>
      nextStatusAfterPayment({
        current: 'voided',
        totalAmount: 100,
        amountPaidAfter: 100,
      })
    ).toThrow(/voided/i);
  });

  it('rejects non-finite amountPaidAfter', () => {
    expect(() =>
      nextStatusAfterPayment({
        current: 'sent',
        totalAmount: 100,
        amountPaidAfter: Number.NaN,
      })
    ).toThrow(/finite/);
  });

  it('rejects partial payment on draft', () => {
    expect(() =>
      nextStatusAfterPayment({
        current: 'draft',
        totalAmount: 100,
        amountPaidAfter: 50,
      })
    ).toThrow(/draft/i);
  });

  it('allows full payment amount on draft as paid (caller should issue first in practice)', () => {
    // Full payment from draft maps to paid only if we allow; design prefers issue first.
    // Engine requires issue for partial; full payment still transitions draft→paid only if assert allows.
    // TRANSITION_TABLE: draft cannot go to paid — so applyPayment will fail assertTransition.
    // nextStatusAfterPayment alone may return paid; applyPayment layers assert.
    expect(
      nextStatusAfterPayment({
        current: 'draft',
        totalAmount: 100,
        amountPaidAfter: 100,
      })
    ).toBe('paid');
  });
});
