import { billingEngine } from '@/lib/billing/engine';

describe('billingEngine public API', () => {
  it('exposes the Phase 1 method surface', () => {
    expect(typeof billingEngine.generateRecurring).toBe('function');
    expect(typeof billingEngine.generateForCustomer).toBe('function');
    expect(typeof billingEngine.generateInvoice).toBe('function');
    expect(typeof billingEngine.issueInvoice).toBe('function');
    expect(typeof billingEngine.voidInvoice).toBe('function');
    expect(typeof billingEngine.applyPayment).toBe('function');
    expect(typeof billingEngine.recordCollectionFailure).toBe('function');
    expect(typeof billingEngine.submitDebitCollection).toBe('function');
    expect(typeof billingEngine.createCreditNote).toBe('function');
    expect(typeof billingEngine.transitionStatus).toBe('function');
  });

  it('collection stubs still throw until Phase 1c', async () => {
    await expect(billingEngine.submitDebitCollection({})).rejects.toThrow(/Task 5/);
    await expect(billingEngine.applyPayment({})).rejects.toThrow(/Task 6/);
    await expect(billingEngine.recordCollectionFailure({})).rejects.toThrow(/Task 6/);
  });
});
