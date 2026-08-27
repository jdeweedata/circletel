import { readFileSync } from 'fs';
import { join } from 'path';
import {
  CUSTOMER_CREDIT_TITLES,
  findCustomerCreditLeaks,
  toCustomerCreditFields,
  toCustomerCreditOutcome,
} from '@/lib/credit-risk/customer-outcome';
import type { OrderCreditReview } from '@/lib/credit-risk/types';

const ISHMAEL_REVIEW: OrderCreditReview = {
  consumer_order_id: '5a486aed-818a-45e0-aadd-e7a3445b32f7',
  decision: 'HARD_FAIL',
  bureau: 'TransUnion',
  report_id: '564041',
  transaction_id: '1051034',
  requested_at: '2026-08-26',
  flags: {
    debt_review: true,
    debt_review_date: '2017-12-19',
    judgements: false,
    defaults: false,
    score: null,
    no_score: true,
  },
  financed_router_allowed: false,
  term_24_month_allowed: false,
  hardware_prepaid: false,
  alternatives: ['sim_only', 'cash_cpe'],
  private_note: 'Debt review since 2017-12-19. Clear is not approve.',
};

describe('toCustomerCreditOutcome', () => {
  it('maps PASS to the approved Deal string', () => {
    expect(toCustomerCreditOutcome('PASS')).toEqual({
      code: 'approved',
      title: CUSTOMER_CREDIT_TITLES.approved,
      reason: 'You can continue with this Deal as quoted.',
    });
  });

  it('maps FAIL and MARGINAL to month-to-month or buy the router', () => {
    expect(toCustomerCreditOutcome('FAIL')?.title).toBe(
      CUSTOMER_CREDIT_TITLES.month_to_month_or_buy_router
    );
    expect(toCustomerCreditOutcome('MARGINAL')?.title).toBe(
      CUSTOMER_CREDIT_TITLES.month_to_month_or_buy_router
    );
  });

  it('maps HARD_FAIL to cannot take this on credit', () => {
    expect(toCustomerCreditOutcome('HARD_FAIL')?.title).toBe(
      CUSTOMER_CREDIT_TITLES.cannot_take_credit
    );
  });

  it('hides UNCHECKED until a review exists', () => {
    expect(toCustomerCreditOutcome('UNCHECKED')).toBeNull();
    expect(toCustomerCreditOutcome(null)).toBeNull();
  });
});

describe('customer credit JSON', () => {
  it('fails if a customer payload includes the raw Ishmael review', () => {
    const leaked = {
      success: true,
      data: {
        order_number: 'ORD-20260821-9026',
        credit_review: ISHMAEL_REVIEW,
        credit_decision: ISHMAEL_REVIEW.decision,
      },
    };
    expect(findCustomerCreditLeaks(leaked)).toEqual(
      expect.arrayContaining(['debt_review', 'score'])
    );
  });

  it('keeps outcome + SOP reason only on a HARD_FAIL review', () => {
    const payload = {
      success: true,
      data: {
        order_number: 'ORD-20260821-9026',
        package_name: 'CircleConnect 5G 60 Mbps',
        ...toCustomerCreditFields(ISHMAEL_REVIEW),
      },
    };

    expect(findCustomerCreditLeaks(payload)).toEqual([]);
    expect(payload.data.credit_outcome).toEqual({
      code: 'cannot_take_credit',
      title: CUSTOMER_CREDIT_TITLES.cannot_take_credit,
      reason:
        'We can provide connectivity month-to-month or prepaid. We cannot supply a router or outdoor unit on credit or fold it into a 24-month deal.',
    });
    expect(payload.data).not.toHaveProperty('credit_review');
    expect(payload.data).not.toHaveProperty('credit_decision');
  });

  it('does not copy flags, score, or report dates onto customer fields', () => {
    const fields = toCustomerCreditFields(ISHMAEL_REVIEW);
    expect(fields).not.toHaveProperty('flags');
    expect(JSON.stringify(fields)).not.toMatch(/2017-12-19/);
    expect(JSON.stringify(fields)).not.toMatch(/564041/);
  });
});

describe('admin Credit risk tab', () => {
  it('still shows flags and score for ops', () => {
    const src = readFileSync(
      join(process.cwd(), 'components/admin/orders/detail/OrderCreditRiskTab.tsx'),
      'utf8'
    );
    expect(src).toMatch(/debt_review/);
    expect(src).toMatch(/Score/);
    expect(src).toMatch(/Flags from the Netcash report/);
  });
});
