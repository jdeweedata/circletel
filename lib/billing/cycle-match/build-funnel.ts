import { roundMoney } from '@/lib/billing/invoice-vat-contract';
import type {
  CycleFunnel,
  FunnelLeakCard,
  FunnelStage,
  LeakType,
  ScoredCycleMatch,
} from './types';

const EMPTY_LEAK: FunnelLeakCard = { count: 0, amount: 0 };

function stage(
  count: number,
  amount: number,
  nextCount: number,
  nextAmount: number
): FunnelStage {
  return {
    count,
    amount: roundMoney(amount),
    dropCount: Math.max(0, count - nextCount),
    dropAmount: roundMoney(Math.max(0, amount - nextAmount)),
  };
}

export function buildFunnel(rows: ScoredCycleMatch[]): CycleFunnel {
  const active = rows.filter(
    (r) => r.serviceStatus === 'active' && r.serviceActive
  );
  const contracted = active.filter((r) => r.platformInclVat > 0);
  const invoiced = rows.filter((r) => r.zohoInvoiceId || r.zohoExVat != null);
  const collected = rows.filter((r) => r.netcashAmount != null || r.netcashRef);

  const activeAmt = sum(active, (r) => r.platformInclVat);
  const contractedAmt = sum(contracted, (r) => r.platformInclVat);
  const invoicedAmt = sum(invoiced, (r) => r.zohoInclVat ?? 0);
  const collectedAmt = sum(collected, (r) => r.netcashAmount ?? 0);

  const leaks: Record<LeakType, FunnelLeakCard> = {
    never_invoiced: { ...EMPTY_LEAK },
    under_contract: { ...EMPTY_LEAK },
    promo_expired: { ...EMPTY_LEAK },
    cancelled_still_billing: { ...EMPTY_LEAK },
  };

  for (const row of rows) {
    if (!row.leakType) continue;
    leaks[row.leakType].count += 1;
    leaks[row.leakType].amount = roundMoney(
      leaks[row.leakType].amount + row.exposure
    );
  }

  const leakageTotal = roundMoney(
    Object.values(leaks).reduce((sumAmt, card) => sumAmt + card.amount, 0)
  );

  const billedAndCollectedPct =
    active.length === 0
      ? 0
      : Math.round((collected.length / active.length) * 1000) / 10;

  return {
    stages: {
      activeOnNetwork: stage(
        active.length,
        activeAmt,
        contracted.length,
        contractedAmt
      ),
      contracted: stage(
        contracted.length,
        contractedAmt,
        invoiced.filter((r) => r.serviceStatus === 'active' && r.serviceActive)
          .length,
        sum(
          invoiced.filter((r) => r.serviceStatus === 'active' && r.serviceActive),
          (r) => r.zohoInclVat ?? 0
        )
      ),
      invoiced: stage(invoiced.length, invoicedAmt, collected.length, collectedAmt),
      collected: stage(collected.length, collectedAmt, collected.length, collectedAmt),
    },
    leaks,
    leakageTotal,
    billedAndCollectedPct,
  };
}

function sum(rows: ScoredCycleMatch[], pick: (r: ScoredCycleMatch) => number): number {
  return roundMoney(rows.reduce((acc, row) => acc + pick(row), 0));
}
