/**
 * Synthetic month-cycle simulation (pure domain — no Supabase).
 * Phase 1d acceptance: generate → pay → fail → credit invariants hold.
 */

import { assertTransition, canTransition } from '@/lib/billing/engine/state-machine';
import {
  applyCredit,
  applyPaymentIncrement,
  assertArInvariant,
  computeAr,
  createInvoice,
  createScenario,
  issueInvoice,
  outstandingFor,
  recordCollectionFailure,
  resetSimIds,
} from '@/lib/billing/engine/simulation/run-month';

describe('billing engine month-cycle simulation', () => {
  beforeEach(() => {
    resetSimIds();
  });

  it('runs full synthetic month: pro-rata A, recurring B, pay, partial, fail, credit', () => {
    const scenario = createScenario('July 2026 synthetic', '2026-07');

    // 1. Service A activates mid-month → pro-rata invoice
    const invA = createInvoice(scenario, {
      serviceId: 'svc-A',
      type: 'pro_rata',
      totalAmount: 649.5, // half of ~R1299
    });
    issueInvoice(invA);
    expect(invA.status).toBe('sent');

    // 2. Service B full month recurring
    const invB = createInvoice(scenario, {
      serviceId: 'svc-B',
      type: 'recurring',
      totalAmount: 1499,
    });
    issueInvoice(invB);
    expect(invB.status).toBe('sent');

    // Third invoice for collection failure path
    const invC = createInvoice(scenario, {
      serviceId: 'svc-C',
      type: 'recurring',
      totalAmount: 899,
    });
    issueInvoice(invC);

    // 3. Payment full on A → paid
    applyPaymentIncrement(invA, 649.5, 'netcash_paynow');
    expect(invA.status).toBe('paid');
    expect(outstandingFor(invA)).toBe(0);

    // 4. Partial payment on B → partial
    applyPaymentIncrement(invB, 500, 'eft');
    expect(invB.status).toBe('partial');
    expect(outstandingFor(invB)).toBe(999);

    // 5. Collection failure on C → failure recorded, pay-link invoked
    recordCollectionFailure(invC, 'debit_rejected_insufficient_funds', {
      invokePayLink: true,
    });
    expect(invC.status).toBe('sent'); // operational failure, not status flip
    const failEvt = invC.events.find((e) => e.kind === 'collection_failed');
    expect(failEvt).toMatchObject({
      kind: 'collection_failed',
      payLinkInvoked: true,
    });

    // 6. Credit note on B → balances remaining AR
    applyCredit(invB, 999);
    expect(outstandingFor(invB)).toBe(0);
    expect(invB.status).toBe('paid'); // credits + payments cover total

    // 7. AR invariant: sum(totals − credits) − payments = outstanding
    assertArInvariant(scenario);
    const ar = computeAr(scenario);
    // A paid full, B paid 500 + credit 999, C unpaid 899
    expect(ar.invoiceTotals).toBe(649.5 + 1499 + 899);
    expect(ar.payments).toBe(649.5 + 500);
    expect(ar.credits).toBe(999);
    expect(ar.outstanding).toBe(899); // only C left

    // 8. No illegal transitions — every status event was legal
    for (const inv of scenario.invoices) {
      for (const ev of inv.events) {
        if (ev.kind === 'status') {
          expect(canTransition(ev.from, ev.to)).toBe(true);
          expect(() => assertTransition(ev.from, ev.to)).not.toThrow();
        }
      }
    }
  });

  it('rejects illegal payment on voided invoice', () => {
    const scenario = createScenario('void-guard', '2026-07');
    const inv = createInvoice(scenario, {
      serviceId: 'svc-X',
      type: 'recurring',
      totalAmount: 100,
      status: 'voided',
    });
    expect(() => applyPaymentIncrement(inv, 50)).toThrow(/Cannot apply payment/);
  });

  it('rejects partial payment on draft (must issue first)', () => {
    const scenario = createScenario('draft-guard', '2026-07');
    const inv = createInvoice(scenario, {
      serviceId: 'svc-Y',
      type: 'recurring',
      totalAmount: 200,
    });
    expect(inv.status).toBe('draft');
    expect(() => applyPaymentIncrement(inv, 50)).toThrow(/draft/);
  });

  it('rejects credit exceeding outstanding', () => {
    const scenario = createScenario('credit-cap', '2026-07');
    const inv = createInvoice(scenario, {
      serviceId: 'svc-Z',
      type: 'recurring',
      totalAmount: 100,
    });
    issueInvoice(inv);
    applyPaymentIncrement(inv, 40);
    expect(() => applyCredit(inv, 70)).toThrow(/exceeds outstanding/);
  });
});
