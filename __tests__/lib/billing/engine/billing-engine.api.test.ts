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
    expect(typeof billingEngine.submitCCDebitCollection).toBe('function');
    expect(typeof billingEngine.sendPayLink).toBe('function');
    expect(typeof billingEngine.createCreditNote).toBe('function');
    expect(typeof billingEngine.transitionStatus).toBe('function');
  });
});
