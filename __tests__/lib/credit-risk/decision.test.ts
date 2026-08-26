import {
  buildCreditReview,
  canReleaseFinancedHardware,
  creditBadgeVariant,
  deriveCreditDecision,
  financedHardwareBlockedReason,
  packageExposure,
  recommendedAlternatives,
} from '@/lib/credit-risk/decision';
import { checkoutCreditGates } from '@/lib/credit-risk/checkout-gates';

const ISHMAEL_FLAGS = {
  debt_review: true,
  debt_review_date: '2017-12-19',
  judgements: false,
  defaults: false,
  sequestration: false,
  admin_order: false,
  score: null,
  no_score: true,
};

describe('deriveCreditDecision', () => {
  it('treats Ishmael debt review as HARD_FAIL even when Netcash printed Clear', () => {
    expect(deriveCreditDecision(ISHMAEL_FLAGS)).toBe('HARD_FAIL');
  });

  it('fails AVS mismatches as HARD_FAIL', () => {
    expect(deriveCreditDecision({ avs_acc_exists: false })).toBe('HARD_FAIL');
    expect(deriveCreditDecision({ avs_id_match: false })).toBe('HARD_FAIL');
  });

  it('uses numeric score bands when no hard flags', () => {
    expect(deriveCreditDecision({ score: 620 })).toBe('PASS');
    expect(deriveCreditDecision({ score: 540 })).toBe('MARGINAL');
    expect(deriveCreditDecision({ score: 410 })).toBe('FAIL');
  });

  it('treats thin file / no score as MARGINAL', () => {
    expect(deriveCreditDecision({ no_score: true, score: null })).toBe('MARGINAL');
  });
});

describe('package exposure and alternatives', () => {
  it('rates Home LTE as low and SkyFibre with router as high', () => {
    expect(packageExposure(149, false)).toBe('low');
    expect(packageExposure(999, true)).toBe('high');
    expect(packageExposure(899, false)).toBe('medium');
  });

  it('recommends prepaid and BYO on HARD_FAIL', () => {
    expect(recommendedAlternatives('HARD_FAIL', 'medium')).toEqual([
      'prepaid_or_month_to_month',
      'byo_or_customer_paid_router',
      'no_24_month_credit',
    ]);
  });
});

describe('financed hardware gate', () => {
  it('blocks router release on HARD_FAIL and FAIL unless prepaid', () => {
    expect(
      canReleaseFinancedHardware({ decision: 'HARD_FAIL', router_included: true })
    ).toBe(false);
    expect(
      canReleaseFinancedHardware({ decision: 'FAIL', assigning_router: true })
    ).toBe(false);
    expect(
      canReleaseFinancedHardware({
        decision: 'HARD_FAIL',
        router_included: true,
        hardware_prepaid: true,
      })
    ).toBe(true);
  });

  it('allows SIM-only activation while hardware is blocked', () => {
    expect(
      canReleaseFinancedHardware({
        decision: 'HARD_FAIL',
        router_included: false,
        assigning_router: false,
      })
    ).toBe(true);
    expect(
      financedHardwareBlockedReason({ decision: 'HARD_FAIL', router_included: true })
    ).toMatch(/financed router/);
  });
});

describe('buildCreditReview', () => {
  it('builds Ishmael HARD_FAIL with router and 24-month blocked', () => {
    const review = buildCreditReview({
      consumer_order_id: '5a486aed-818a-45e0-aadd-e7a3445b32f7',
      flags: ISHMAEL_FLAGS,
      report_id: '564041',
      transaction_id: '1051034',
      bureau: 'TransUnion',
      purpose: 'Credit Risk Assessment',
      package_price: 149,
      router_included: true,
    });
    expect(review.decision).toBe('HARD_FAIL');
    expect(review.financed_router_allowed).toBe(false);
    expect(review.term_24_month_allowed).toBe(false);
    expect(review.alternatives).toContain('byo_or_customer_paid_router');
    expect(creditBadgeVariant(review.decision)).toBe('error');
  });
});

describe('checkoutCreditGates', () => {
  it('hides free router and 24-month on HARD_FAIL', () => {
    expect(checkoutCreditGates('HARD_FAIL')).toEqual({
      showFreeRouter: false,
      show24Month: false,
      showPrepaidByo: true,
    });
  });

  it('leaves checkout unchanged until a decision exists', () => {
    expect(checkoutCreditGates('UNCHECKED').showFreeRouter).toBe(true);
    expect(checkoutCreditGates(undefined).show24Month).toBe(true);
  });
});
