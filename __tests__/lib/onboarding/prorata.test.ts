import { computeProRata } from '@/lib/onboarding/prorata';

describe('computeProRata', () => {
  it('charges full month when activation is on the billing day', () => {
    const r = computeProRata({ monthlyExVat: 450, vatPct: 15, activationDate: '2026-07-01', billingDay: 1 });
    expect(r.days).toBe(31);
    expect(r.daysInMonth).toBe(31);
    expect(r.amountInclVat).toBeCloseTo(517.5, 2);
  });
  it('pro-rates a mid-month activation', () => {
    // Activation 2026-07-16, next billing day 1 Aug -> 16 days remaining in July (16..31)
    const r = computeProRata({ monthlyExVat: 450, vatPct: 15, activationDate: '2026-07-16', billingDay: 1 });
    expect(r.days).toBe(16);
    expect(r.daysInMonth).toBe(31);
    expect(r.amountInclVat).toBeCloseTo(517.5 * 16 / 31, 2);
  });
  it('charges 1 day when activated on the last day of the month', () => {
    const r = computeProRata({ monthlyExVat: 450, vatPct: 15, activationDate: '2026-07-31', billingDay: 1 });
    expect(r.days).toBe(1);
    expect(r.daysInMonth).toBe(31);
  });
  it('handles February in a non-leap year (28 days)', () => {
    const r = computeProRata({ monthlyExVat: 450, vatPct: 15, activationDate: '2026-02-01', billingDay: 1 });
    expect(r.daysInMonth).toBe(28);
    expect(r.days).toBe(28);
  });
  it('handles February in a leap year (29 days)', () => {
    const r = computeProRata({ monthlyExVat: 450, vatPct: 15, activationDate: '2028-02-01', billingDay: 1 });
    expect(r.daysInMonth).toBe(29);
    expect(r.days).toBe(29);
  });
});
