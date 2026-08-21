import { nearlyEqual, roundMoney } from '@/lib/billing/invoice-vat-contract';
import { buildPatternKey } from './pattern-key';
import type {
  CycleMatchInput,
  CycleMatchPairwise,
  FieldDiffRow,
  LeakType,
  PairwiseVerdict,
  RecommendedAction,
  ScoredCycleMatch,
} from './types';

const MONEY_EPS = 0.05;

function money(n: number | null | undefined): number {
  return roundMoney(Number(n) || 0);
}

function hasZoho(input: CycleMatchInput): boolean {
  return Boolean(input.zohoInvoiceId || input.zohoExVat != null);
}

function hasNetcash(input: CycleMatchInput): boolean {
  return Boolean(input.netcashRef || input.netcashAmount != null);
}

function verdict(
  ok: boolean,
  delta: number | null,
  label: string,
  extra: Partial<PairwiseVerdict> = {}
): PairwiseVerdict {
  return { ok, delta, label, ...extra };
}

function buildPairwise(input: CycleMatchInput): CycleMatchPairwise {
  const zoho = hasZoho(input);
  const netcash = hasNetcash(input);

  const pEx = money(input.platformExVat);
  const pIncl = money(input.platformInclVat);
  const zEx = input.zohoExVat == null ? null : money(input.zohoExVat);
  const zIncl = input.zohoInclVat == null ? null : money(input.zohoInclVat);
  const nc = input.netcashAmount == null ? null : money(input.netcashAmount);

  const pToZDelta = zoho && zEx != null ? roundMoney(zEx - pEx) : null;
  const zToNDelta =
    zoho && netcash && zIncl != null && nc != null ? roundMoney(nc - zIncl) : null;
  const pToNDelta = netcash && nc != null ? roundMoney(nc - pIncl) : null;

  const pToZOk = zEx != null && nearlyEqual(zEx, pEx, MONEY_EPS);
  const zToNOk = zIncl != null && nc != null && nearlyEqual(nc, zIncl, MONEY_EPS);
  const pToNOk = nc != null && nearlyEqual(nc, pIncl, MONEY_EPS);

  let pToZLabel = 'Platform to Zoho: no Zoho invoice';
  if (pToZOk) pToZLabel = 'Platform to Zoho: invoiced to contract';
  else if (pToZDelta != null && pToZDelta < 0) {
    pToZLabel = `Platform to Zoho: invoiced ${formatAbs(pToZDelta)} under contract`;
  } else if (pToZDelta != null) {
    pToZLabel = `Platform to Zoho: invoiced ${formatAbs(pToZDelta)} over contract`;
  }

  let zToNLabel = 'Zoho to Netcash: no collection';
  if (!zoho) zToNLabel = 'Zoho to Netcash: no invoice';
  else if (zToNOk) zToNLabel = 'Zoho to Netcash: exact to the cent';
  else if (zToNDelta != null) {
    zToNLabel = `Zoho to Netcash: ${formatAbs(zToNDelta)} ${zToNDelta < 0 ? 'short' : 'over'}`;
  }

  let pToNLabel = 'Platform to Netcash: no collection';
  if (pToNOk) pToNLabel = 'Platform to Netcash: collected to contract';
  else if (pToNDelta != null) {
    pToNLabel = `Platform to Netcash: ${formatAbs(pToNDelta)} ${pToNDelta < 0 ? 'short incl. VAT' : 'over incl. VAT'}`;
  }

  return {
    platformToZoho: verdict(pToZOk, pToZDelta, pToZLabel, {
      platform: pEx,
      zoho: zEx,
    }),
    zohoToNetcash: verdict(Boolean(zToNOk), zToNDelta, zToNLabel, {
      zoho: zIncl,
      netcash: nc,
    }),
    platformToNetcash: verdict(pToNOk, pToNDelta, pToNLabel, {
      platform: pIncl,
      netcash: nc,
    }),
  };
}

function formatAbs(n: number): string {
  return `R${Math.abs(n).toFixed(2)}`;
}

function classifyLeak(input: CycleMatchInput): LeakType | null {
  const zoho = hasZoho(input);
  const cancelled =
    input.serviceStatus === 'cancelled' || input.serviceActive === false;

  if (cancelled && zoho) return 'cancelled_still_billing';

  const live =
    input.serviceStatus === 'active' && input.serviceActive !== false;
  if (live && !zoho) return 'never_invoiced';

  if (zoho && input.zohoExVat != null) {
    const under = money(input.zohoExVat) < money(input.platformExVat) - MONEY_EPS;
    if (under && input.promoExpiredStillDiscounted) return 'promo_expired';
    if (under) return 'under_contract';
  }

  return null;
}

function actionFor(leak: LeakType | null, input: CycleMatchInput): RecommendedAction {
  if (leak === 'never_invoiced') return 'create_invoice';
  if (leak === 'cancelled_still_billing') return 'credit_note';
  if (leak === 'promo_expired' || leak === 'under_contract') return 'debit_note';
  if (hasZoho(input) && !hasNetcash(input)) return 'request_mandate';
  if (leak) return 'open_exception';
  return 'none';
}

function diagnose(leak: LeakType | null, pairwise: CycleMatchPairwise): string {
  switch (leak) {
    case 'never_invoiced':
      return 'Service is live on the platform but has no Zoho invoice this cycle. Revenue is not billed.';
    case 'under_contract':
      return pairwise.platformToZoho.label + '. Netcash collected what Zoho invoiced, so the gap is unbilled contract value.';
    case 'promo_expired':
      return 'Promo end date has passed but Zoho still bills the discounted rate.';
    case 'cancelled_still_billing':
      return 'Service is off-network / cancelled but Zoho still invoiced this cycle.';
    default:
      return 'Three-way match is consistent for this cycle.';
  }
}

function buildFieldDiff(input: CycleMatchInput): FieldDiffRow[] {
  const svc = formatId(input.serviceId);
  return [
    {
      field: 'Record',
      platform: svc,
      zoho: input.zohoInvoiceNumber ?? 'none',
      netcash: input.netcashRef ?? 'none',
      mismatch: false,
    },
    {
      field: 'Amount excl VAT',
      platform: moneyLabel(input.platformExVat),
      zoho: input.zohoExVat == null ? 'none' : moneyLabel(input.zohoExVat),
      netcash: 'not itemised',
      mismatch:
        input.zohoExVat != null &&
        !nearlyEqual(money(input.zohoExVat), money(input.platformExVat), MONEY_EPS),
    },
    {
      field: 'Amount incl VAT',
      platform: moneyLabel(input.platformInclVat),
      zoho: input.zohoInclVat == null ? 'none' : moneyLabel(input.zohoInclVat),
      netcash: input.netcashAmount == null ? 'none' : moneyLabel(input.netcashAmount),
      mismatch:
        (input.zohoInclVat != null &&
          !nearlyEqual(money(input.zohoInclVat), money(input.platformInclVat), MONEY_EPS)) ||
        (input.netcashAmount != null &&
          input.zohoInclVat != null &&
          !nearlyEqual(money(input.netcashAmount), money(input.zohoInclVat), MONEY_EPS)),
    },
  ];
}

function formatId(id: string): string {
  const hex = id.replace(/-/g, '');
  return `SVC-${hex.slice(-5).toUpperCase()}`;
}

function moneyLabel(n: number): string {
  return `R${money(n).toFixed(2)}`;
}

export function scoreCycleMatch(input: CycleMatchInput): ScoredCycleMatch {
  const zoho = hasZoho(input);
  const netcash = hasNetcash(input);
  const legsPresent = (1 + (zoho ? 1 : 0) + (netcash ? 1 : 0)) as 1 | 2 | 3;
  const pairwise = buildPairwise(input);

  let matchState: ScoredCycleMatch['matchState'] = 'unmatched';
  if (legsPresent === 3) {
    const allOk =
      pairwise.platformToZoho.ok &&
      pairwise.zohoToNetcash.ok &&
      pairwise.platformToNetcash.ok;
    matchState = allOk ? 'matched_3' : 'matched_2';
  } else if (legsPresent === 2) {
    matchState = 'matched_2';
  }

  const leakType = classifyLeak(input);
  const signedVariance = roundMoney(
    money(input.zohoInclVat) - money(input.platformInclVat)
  );
  const exposure =
    leakType === 'never_invoiced'
      ? money(input.platformInclVat)
      : leakType === 'cancelled_still_billing'
        ? money(input.zohoInclVat)
        : leakType === 'under_contract' || leakType === 'promo_expired'
          ? roundMoney(money(input.platformInclVat) - money(input.zohoInclVat))
          : 0;

  return {
    serviceId: input.serviceId,
    customerId: input.customerId,
    matchState,
    legsPresent,
    pairwise,
    leakType,
    signedVariance,
    exposure,
    recommendedAction: actionFor(leakType, input),
    diagnosis: diagnose(leakType, pairwise),
    patternKey: buildPatternKey({
      leakType,
      packageName: input.packageName,
    }),
    fieldDiff: buildFieldDiff(input),
    platformExVat: money(input.platformExVat),
    platformInclVat: money(input.platformInclVat),
    zohoExVat: input.zohoExVat == null ? null : money(input.zohoExVat),
    zohoInclVat: input.zohoInclVat == null ? null : money(input.zohoInclVat),
    zohoInvoiceId: input.zohoInvoiceId,
    zohoInvoiceNumber: input.zohoInvoiceNumber,
    zohoBooksInvoiceId: input.zohoBooksInvoiceId,
    netcashAmount: input.netcashAmount == null ? null : money(input.netcashAmount),
    netcashRef: input.netcashRef,
    packageName: input.packageName,
    serviceStatus: input.serviceStatus,
    serviceActive: input.serviceActive,
  };
}
