import { describe, expect, it } from '@jest/globals';
import { buildFunnel } from '@/lib/billing/cycle-match/build-funnel';
import { scoreCycleMatch } from '@/lib/billing/cycle-match/score-match';
import type { CycleMatchInput } from '@/lib/billing/cycle-match/types';

function scored(overrides: Partial<CycleMatchInput>) {
  return scoreCycleMatch({
    serviceId: 'svc-1',
    customerId: 'cust-1',
    serviceStatus: 'active',
    serviceActive: true,
    packageName: 'Fibre 100',
    monthlyPrice: 899,
    platformExVat: 781.74,
    platformInclVat: 899,
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
}

describe('buildFunnel', () => {
  it('prices drop-off at each network-to-cash stage', () => {
    const rows = [
      scored({
        serviceId: 'a',
        zohoExVat: 781.74,
        zohoInclVat: 899,
        zohoInvoiceId: 'i1',
        netcashAmount: 899,
        netcashRef: 'n1',
      }),
      scored({ serviceId: 'b' }),
      scored({
        serviceId: 'c',
        serviceStatus: 'cancelled',
        serviceActive: false,
        monthlyPrice: 0,
        platformExVat: 0,
        platformInclVat: 0,
        zohoExVat: 781.74,
        zohoInclVat: 899,
        zohoInvoiceId: 'i3',
      }),
    ];

    const funnel = buildFunnel(rows);
    expect(funnel.stages.activeOnNetwork.count).toBe(2);
    expect(funnel.stages.contracted.count).toBe(2);
    expect(funnel.stages.invoiced.count).toBe(2);
    expect(funnel.stages.collected.count).toBe(1);
    expect(funnel.leaks.never_invoiced.count).toBe(1);
    expect(funnel.leaks.cancelled_still_billing.count).toBe(1);
    expect(funnel.billedAndCollectedPct).toBe(50);
  });

  it('rounds billed-and-collected to one decimal without float residue', () => {
    const rows = Array.from({ length: 27 }, (_, i) =>
      scored({
        serviceId: `svc-${i}`,
        zohoExVat: i < 21 ? 781.74 : null,
        zohoInclVat: i < 21 ? 899 : null,
        zohoInvoiceId: i < 21 ? `i${i}` : null,
        netcashAmount: i < 21 ? 899 : null,
        netcashRef: i < 21 ? `n${i}` : null,
      })
    );

    expect(buildFunnel(rows).billedAndCollectedPct).toBe(77.8);
  });
});
