import type {
  CreditDecision,
  CreditFlags,
  CreditReviewInput,
  OrderCreditReview,
  PackageExposure,
} from './types';

export function hasHardLegalFlag(flags: CreditFlags): boolean {
  return Boolean(
    flags.debt_review ||
      flags.sequestration ||
      flags.admin_order ||
      flags.judgements ||
      flags.avs_acc_exists === false ||
      flags.avs_id_match === false
  );
}

export function deriveCreditDecision(flags: CreditFlags): CreditDecision {
  if (hasHardLegalFlag(flags)) return 'HARD_FAIL';
  if (typeof flags.score === 'number' && flags.score < 500) return 'FAIL';
  if (flags.defaults) return 'FAIL';
  if (typeof flags.score === 'number' && flags.score >= 600) return 'PASS';
  if (typeof flags.score === 'number' && flags.score >= 500) return 'MARGINAL';
  if (flags.no_score || flags.score == null) return 'MARGINAL';
  return 'UNCHECKED';
}

export function packageExposure(
  packagePrice = 0,
  routerIncluded = false
): PackageExposure {
  if (packagePrice >= 1299 || (routerIncluded && packagePrice >= 999)) return 'high';
  if (packagePrice >= 799 || routerIncluded) return 'medium';
  return 'low';
}

export function recommendedAlternatives(
  decision: CreditDecision,
  exposure: PackageExposure
): string[] {
  if (decision === 'PASS') return [];
  if (decision === 'HARD_FAIL') {
    return [
      'prepaid_or_month_to_month',
      'byo_or_customer_paid_router',
      'no_24_month_credit',
    ];
  }
  if (decision === 'FAIL') {
    return exposure === 'high'
      ? ['deposit_2_months', 'arlan_redirect', 'byo_or_customer_paid_router']
      : ['prepaid_or_month_to_month', 'byo_or_customer_paid_router', 'shorter_term'];
  }
  return ['prepay_1_to_3_months', 'byo_or_customer_paid_router', 'deposit_equals_cpe'];
}

export function allowsFinancedRouter(decision: CreditDecision, hardwarePrepaid: boolean): boolean {
  if (hardwarePrepaid) return true;
  return decision === 'PASS';
}

export function allows24MonthTerm(decision: CreditDecision, hardwarePrepaid: boolean): boolean {
  if (decision === 'HARD_FAIL') return false;
  if (decision === 'FAIL' && !hardwarePrepaid) return false;
  return decision === 'PASS' || decision === 'MARGINAL' || hardwarePrepaid;
}

export function canReleaseFinancedHardware(input: {
  decision?: CreditDecision | null;
  hardware_prepaid?: boolean;
  router_included?: boolean;
  assigning_router?: boolean;
}): boolean {
  const assigning = input.assigning_router ?? Boolean(input.router_included);
  if (!assigning) return true;
  if (input.hardware_prepaid) return true;
  if (input.decision === 'HARD_FAIL' || input.decision === 'FAIL') return false;
  return true;
}

export function creditBadgeVariant(
  decision?: CreditDecision | null
): 'success' | 'warning' | 'error' | 'neutral' {
  if (decision === 'PASS') return 'success';
  if (decision === 'MARGINAL') return 'warning';
  if (decision === 'HARD_FAIL' || decision === 'FAIL') return 'error';
  return 'neutral';
}

export function creditDecisionLabel(decision?: CreditDecision | null): string {
  switch (decision) {
    case 'HARD_FAIL':
      return 'Hard fail';
    case 'FAIL':
      return 'Fail';
    case 'MARGINAL':
      return 'Marginal';
    case 'PASS':
      return 'Pass';
    default:
      return 'Unchecked';
  }
}

export function buildCreditReview(input: CreditReviewInput): OrderCreditReview {
  const flags = input.flags ?? {};
  const decision = input.decision ?? deriveCreditDecision(flags);
  const hardwarePrepaid = Boolean(input.hardware_prepaid);
  const exposure = packageExposure(input.package_price, input.router_included);

  return {
    consumer_order_id: input.consumer_order_id,
    decision,
    bureau: input.bureau ?? null,
    report_id: input.report_id ?? null,
    transaction_id: input.transaction_id ?? null,
    purpose: input.purpose ?? null,
    requested_at: input.requested_at ?? null,
    flags,
    financed_router_allowed: allowsFinancedRouter(decision, hardwarePrepaid),
    term_24_month_allowed: allows24MonthTerm(decision, hardwarePrepaid),
    hardware_prepaid: hardwarePrepaid,
    alternatives: recommendedAlternatives(decision, exposure),
    private_note: input.private_note ?? null,
    pdf_storage_path: input.pdf_storage_path ?? null,
    override_reason: input.override_reason ?? null,
    override_by: input.override_by ?? null,
    reviewed_by: input.reviewed_by ?? null,
    updated_by: input.updated_by ?? null,
  };
}

export function financedHardwareBlockedReason(input: {
  decision?: CreditDecision | null;
  hardware_prepaid?: boolean;
  router_included?: boolean;
}): string | null {
  if (canReleaseFinancedHardware(input)) return null;
  return `Cannot release a financed router while credit decision is ${input.decision}. Mark hardware prepaid or switch to BYO.`;
}
