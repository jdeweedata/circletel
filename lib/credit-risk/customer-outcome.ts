import { checkoutCreditGates } from './checkout-gates';
import type { CreditDecision } from './types';

export const CUSTOMER_CREDIT_TITLES = {
  approved: 'Approved for this Deal',
  month_to_month_or_buy_router: 'We can do month-to-month or you buy the router',
  cannot_take_credit: 'We cannot take this on credit',
} as const;

export type CustomerCreditOutcomeCode = keyof typeof CUSTOMER_CREDIT_TITLES;

export interface CustomerCreditOutcome {
  code: CustomerCreditOutcomeCode;
  title: string;
  reason: string;
}

const SOP_NO_CREDIT_REASON =
  'We can provide connectivity month-to-month or prepaid. We cannot supply a router or outdoor unit on credit or fold it into a 24-month deal.';

export function toCustomerCreditOutcome(
  decision?: CreditDecision | null
): CustomerCreditOutcome | null {
  if (!decision || decision === 'UNCHECKED') return null;
  if (decision === 'PASS') {
    return {
      code: 'approved',
      title: CUSTOMER_CREDIT_TITLES.approved,
      reason: 'You can continue with this Deal as quoted.',
    };
  }
  if (decision === 'HARD_FAIL') {
    return {
      code: 'cannot_take_credit',
      title: CUSTOMER_CREDIT_TITLES.cannot_take_credit,
      reason: SOP_NO_CREDIT_REASON,
    };
  }
  return {
    code: 'month_to_month_or_buy_router',
    title: CUSTOMER_CREDIT_TITLES.month_to_month_or_buy_router,
    reason: SOP_NO_CREDIT_REASON,
  };
}

export function toCustomerCreditFields(review?: {
  decision?: CreditDecision | null;
  hardware_prepaid?: boolean;
} | null): {
  credit_outcome: CustomerCreditOutcome | null;
  credit_gates: ReturnType<typeof checkoutCreditGates>;
} {
  return {
    credit_outcome: toCustomerCreditOutcome(review?.decision ?? null),
    credit_gates: checkoutCreditGates(review?.decision, Boolean(review?.hardware_prepaid)),
  };
}

const LEAK_CHECKS: { name: string; test: (json: string) => boolean }[] = [
  { name: 'debt_review', test: (json) => /debt_review/i.test(json) },
  { name: 'score', test: (json) => /"score"\s*:/.test(json) },
];

export function findCustomerCreditLeaks(payload: unknown): string[] {
  const json = JSON.stringify(payload);
  return LEAK_CHECKS.filter((check) => check.test(json)).map((check) => check.name);
}
