import { amountIsSane, decideWebhookAction } from '@/lib/payments/netcash-webhook-auth';

describe('amountIsSane', () => {
  it('accepts a positive amount not exceeding what is owed', () => {
    expect(amountIsSane(899, 899)).toBe(true);   // exact
    expect(amountIsSane(1, 899)).toBe(true);      // valid partial / R1 auth
  });
  it('rejects zero, negative, NaN', () => {
    expect(amountIsSane(0, 899)).toBe(false);
    expect(amountIsSane(-5, 899)).toBe(false);
    expect(amountIsSane(Number.NaN, 899)).toBe(false);
  });
  it('rejects overpayment beyond a 1-cent tolerance', () => {
    expect(amountIsSane(900, 899)).toBe(false);
    expect(amountIsSane(899.005, 899)).toBe(true); // within 1c tolerance
  });
  it('rejects when owed amount is unknown', () => {
    expect(amountIsSane(899, null)).toBe(false);
  });
});

describe('decideWebhookAction', () => {
  it('authorizes when entity matched and amount sane', () => {
    expect(decideWebhookAction({ entityMatched: true, owedAmount: 899, receivedAmount: 899 }))
      .toEqual({ action: 'authorize', reason: expect.any(String) });
  });
  it('routes to manual_review when no entity matched', () => {
    expect(decideWebhookAction({ entityMatched: false, owedAmount: 899, receivedAmount: 899 }).action)
      .toBe('manual_review');
  });
  it('routes to manual_review on amount mismatch', () => {
    expect(decideWebhookAction({ entityMatched: true, owedAmount: 899, receivedAmount: 5000 }).action)
      .toBe('manual_review');
  });
});
