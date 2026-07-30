import { billingEngine } from '@/lib/billing/engine';

describe('billingEngine public API', () => {
  it('exposes the Phase 1 method surface', () => {
    expect(typeof billingEngine.generateRecurring).toBe('function');
    expect(typeof billingEngine.generateInvoice).toBe('function');
    expect(typeof billingEngine.issueInvoice).toBe('function');
    expect(typeof billingEngine.applyPayment).toBe('function');
    expect(typeof billingEngine.recordCollectionFailure).toBe('function');
    expect(typeof billingEngine.submitDebitCollection).toBe('function');
    expect(typeof billingEngine.createCreditNote).toBe('function');
    expect(typeof billingEngine.transitionStatus).toBe('function');
  });

  it('stubs throw until Tasks 3–6 wire real implementations', async () => {
    await expect(billingEngine.generateRecurring({})).rejects.toThrow(/Task 3/);
    await expect(billingEngine.issueInvoice('x')).rejects.toThrow(/Task 4/);
    await expect(billingEngine.submitDebitCollection({})).rejects.toThrow(/Task 5/);
    await expect(billingEngine.applyPayment({})).rejects.toThrow(/Task 6/);
  });
});
