import {
  assertTransition,
  canTransition,
  InvoiceDbStatus,
} from '@/lib/billing/engine/state-machine';

describe('invoice state machine', () => {
  it('allows draft → sent', () => {
    expect(canTransition('draft', 'sent')).toBe(true);
    expect(() => assertTransition('draft', 'sent')).not.toThrow();
  });

  it('allows sent → paid | partial | overdue | cancelled', () => {
    for (const to of ['paid', 'partial', 'overdue', 'cancelled'] as InvoiceDbStatus[]) {
      expect(canTransition('sent', to)).toBe(true);
    }
  });

  it('rejects sent/paid → voided (use credit notes for issued invoices)', () => {
    expect(canTransition('sent', 'voided')).toBe(false);
    expect(canTransition('partial', 'voided')).toBe(false);
    expect(canTransition('overdue', 'voided')).toBe(false);
    expect(canTransition('paid', 'voided')).toBe(false);
    expect(canTransition('draft', 'voided')).toBe(true);
  });

  it('rejects paid → sent (re-open)', () => {
    expect(canTransition('paid', 'sent')).toBe(false);
    expect(() => assertTransition('paid', 'sent')).toThrow(
      'Illegal invoice transition: paid -> sent'
    );
  });

  it('rejects draft → paid (skip issue)', () => {
    expect(canTransition('draft', 'paid')).toBe(false);
  });

  it('rejects voided → anything', () => {
    expect(canTransition('voided', 'paid')).toBe(false);
  });

  it('allows partial → paid | overdue', () => {
    expect(canTransition('partial', 'paid')).toBe(true);
    expect(canTransition('partial', 'overdue')).toBe(true);
  });

  it('allows overdue → paid | partial | cancelled', () => {
    expect(canTransition('overdue', 'paid')).toBe(true);
    expect(canTransition('overdue', 'partial')).toBe(true);
    expect(canTransition('overdue', 'cancelled')).toBe(true);
  });

  it('allows same-status no-op (idempotent)', () => {
    expect(canTransition('sent', 'sent')).toBe(true);
    expect(() => assertTransition('paid', 'paid')).not.toThrow();
  });
});
