import { describe, expect, it } from '@jest/globals';
import { scoreCycleMatch } from '@/lib/billing/cycle-match/score-match';
import type { CycleMatchInput } from '@/lib/billing/cycle-match/types';

const base = (overrides: Partial<CycleMatchInput> = {}): CycleMatchInput => ({
  serviceId: 'svc-1',
  customerId: 'cust-1',
  serviceStatus: 'active',
  serviceActive: true,
  packageName: 'Vumatel Business 200/200',
  monthlyPrice: 1899,
  platformExVat: 1651.3,
  platformInclVat: 1899,
  zohoExVat: null,
  zohoInclVat: null,
  zohoInvoiceId: null,
  zohoInvoiceNumber: null,
  zohoBooksInvoiceId: null,
  netcashAmount: null,
  netcashRef: null,
  promoExpiredStillDiscounted: false,
  ...overrides,
});

describe('scoreCycleMatch', () => {
  it('scores 3 of 3 when all legs agree within tolerance', () => {
    const row = scoreCycleMatch(
      base({
        zohoExVat: 1651.3,
        zohoInclVat: 1899,
        zohoInvoiceId: 'inv-1',
        zohoInvoiceNumber: 'INV-2026-00001',
        zohoBooksInvoiceId: 'zb-1',
        netcashAmount: 1899,
        netcashRef: 'NC-1',
      })
    );
    expect(row.matchState).toBe('matched_3');
    expect(row.legsPresent).toBe(3);
    expect(row.pairwise.platformToZoho.ok).toBe(true);
    expect(row.pairwise.zohoToNetcash.ok).toBe(true);
    expect(row.pairwise.platformToNetcash.ok).toBe(true);
    expect(row.leakType).toBeNull();
  });

  it('scores 2 of 3 when Zoho trails the contract price', () => {
    const row = scoreCycleMatch(
      base({
        zohoExVat: 1649,
        zohoInclVat: 1896.35,
        zohoInvoiceId: 'inv-2',
        zohoInvoiceNumber: 'INV-004821',
        zohoBooksInvoiceId: 'zb-2',
        netcashAmount: 1896.35,
        netcashRef: 'NC-0806-14',
      })
    );
    expect(row.matchState).toBe('matched_2');
    expect(row.pairwise.platformToZoho.ok).toBe(false);
    expect(row.pairwise.zohoToNetcash.ok).toBe(true);
    expect(row.leakType).toBe('under_contract');
    expect(row.signedVariance).toBeCloseTo(-2.65, 1);
  });

  it('flags live but never invoiced as unmatched leakage', () => {
    const row = scoreCycleMatch(base());
    expect(row.matchState).toBe('unmatched');
    expect(row.legsPresent).toBe(1);
    expect(row.leakType).toBe('never_invoiced');
    expect(row.recommendedAction).toBe('create_invoice');
  });

  it('flags cancelled services that still have a Zoho invoice', () => {
    const row = scoreCycleMatch(
      base({
        serviceStatus: 'cancelled',
        serviceActive: false,
        monthlyPrice: 0,
        platformExVat: 0,
        platformInclVat: 0,
        zohoExVat: 2173.04,
        zohoInclVat: 2499,
        zohoInvoiceId: 'inv-3',
        zohoInvoiceNumber: 'INV-2026-00009',
      })
    );
    expect(row.leakType).toBe('cancelled_still_billing');
    expect(row.recommendedAction).toBe('credit_note');
  });

  it('uses promo_expired when under-contract and promo flag is set', () => {
    const row = scoreCycleMatch(
      base({
        zohoExVat: 1400,
        zohoInclVat: 1610,
        zohoInvoiceId: 'inv-4',
        promoExpiredStillDiscounted: true,
      })
    );
    expect(row.leakType).toBe('promo_expired');
    expect(row.recommendedAction).toBe('debit_note');
  });
});
