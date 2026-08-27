import {
  parseAvsFlagsFromReport,
  parseCreditReportFlags,
  riskServiceKeyConfigured,
} from '@/lib/credit-risk/netcash-risk-client';
import { deriveCreditDecision, passBlockedReason } from '@/lib/credit-risk/decision';
import { adminFieldsToKeepOnPull } from '@/lib/credit-risk/review-store';

describe('parseCreditReportFlags', () => {
  it('maps the Ishmael Netcash wording to debt review', () => {
    const flags = parseCreditReportFlags({
      comments: 'Principal is under debt review',
      score: null,
      judgements: 0,
      defaults: 0,
    });
    expect(flags.debt_review).toBe(true);
    expect(flags.no_score).toBe(true);
    expect(deriveCreditDecision(flags)).toBe('HARD_FAIL');
  });

  it('maps AVS yes/no onto flags', () => {
    const flags = parseCreditReportFlags({
      avsAccExists: true,
      avsIdMatch: false,
    });
    expect(flags.avs_acc_exists).toBe(true);
    expect(flags.avs_id_match).toBe(false);
    expect(deriveCreditDecision(flags)).toBe('HARD_FAIL');
  });
});

describe('parseAvsFlagsFromReport', () => {
  it('parses Acc Exists / Id Match = No as false, not unknown', () => {
    const flags = parseAvsFlagsFromReport(
      'Account exists: No\nID Match: No\nBankAccountNumberValid: Invalid'
    );
    expect(flags.avs_acc_exists).toBe(false);
    expect(flags.avs_id_match).toBe(false);
    expect(deriveCreditDecision(flags)).toBe('HARD_FAIL');
  });

  it('parses Acc Exists / Id Match = Yes as true', () => {
    const flags = parseAvsFlagsFromReport('Account exists: Yes\nID Match: True');
    expect(flags.avs_acc_exists).toBe(true);
    expect(flags.avs_id_match).toBe(true);
  });
});

describe('passBlockedReason', () => {
  it('blocks PASS on sequestration and AVS no, not only debt review', () => {
    expect(passBlockedReason({ sequestration: true }, false)).toMatch(/hard-fail/);
    expect(passBlockedReason({ avs_id_match: false }, false)).toMatch(/hard-fail/);
    expect(passBlockedReason({ sequestration: true }, true)).toBeNull();
    expect(passBlockedReason({ debt_review: false }, false)).toBeNull();
  });
});

describe('adminFieldsToKeepOnPull', () => {
  it('keeps prepaid, note, and override when a pull upserts', () => {
    const kept = adminFieldsToKeepOnPull({
      consumer_order_id: 'order-1',
      decision: 'HARD_FAIL',
      flags: {},
      financed_router_allowed: false,
      term_24_month_allowed: false,
      hardware_prepaid: true,
      alternatives: [],
      private_note: 'Customer paid the G5C.',
      override_reason: 'MD/CFO dual control',
      override_by: 'admin-1',
    });
    expect(kept).toEqual({
      hardware_prepaid: true,
      private_note: 'Customer paid the G5C.',
      override_reason: 'MD/CFO dual control',
      override_by: 'admin-1',
    });
  });
});

describe('riskServiceKeyConfigured', () => {
  it('is false when the Risk Reports key is missing', () => {
    const previous = process.env.NETCASH_RISK_SERVICE_KEY;
    delete process.env.NETCASH_RISK_SERVICE_KEY;
    expect(riskServiceKeyConfigured()).toBe(false);
    if (previous) process.env.NETCASH_RISK_SERVICE_KEY = previous;
  });
});
