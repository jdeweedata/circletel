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
});
