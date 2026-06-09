import { buildEMandateRequest } from '@/lib/onboarding/emandate-request';

describe('buildEMandateRequest', () => {
  const base = {
    accountNumber: 'CT-2026-00020',
    paymentMethodId: 'pm-uuid',
    submissionId: 'sub-uuid',
    accountHolder: 'Lens Ext 10 Clinic',
    isConsumer: false,
    entityName: 'Lens Ext 10 (Pty) Ltd',
    registrationNumber: '2019/123456/07',
    mobile: '0718988722',
    bank: 'Capitec', accountType: 'Savings', accountNumber2: '1234567890', branchCode: '470010',
    monthlyExVat: 450, vatPct: 15, paymentDay: '1', agreementDate: '2026-07-01',
  };
  it('maps amount incl VAT and carries linkage in custom fields', () => {
    const r = buildEMandateRequest(base as any);
    expect(r.accountReference).toBe('CT-2026-00020');
    expect(r.mandateAmount).toBeCloseTo(517.5, 2);
    expect(r.isConsumer).toBe(false);
    expect(r.field1).toBe('pm-uuid');
    expect(r.field2).toBe('sub-uuid');
    expect(r.commencementDay).toBe('1');
    expect(r.bankDetailType).toBe(1);
    expect(r.bankAccountType).toBe(2); // Savings -> 2
  });
  it('wraps commencement month from December to January', () => {
    const r = buildEMandateRequest({ ...base, agreementDate: '2026-12-15' } as any);
    expect(r.commencementMonth).toBe(1);
  });
  it('falls back to entity name as surname for a single-word account holder', () => {
    const r = buildEMandateRequest({ ...base, accountHolder: 'Clinic' } as any);
    expect(r.firstName).toBe('Clinic');
    expect(r.surname).toBe(base.entityName);
  });
});
