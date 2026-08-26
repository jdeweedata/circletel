import { parseCreditReportFlags, riskServiceKeyConfigured } from '@/lib/credit-risk/netcash-risk-client';
import { deriveCreditDecision } from '@/lib/credit-risk/decision';

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

describe('riskServiceKeyConfigured', () => {
  it('is false when the Risk Reports key is missing', () => {
    const previous = process.env.NETCASH_RISK_SERVICE_KEY;
    delete process.env.NETCASH_RISK_SERVICE_KEY;
    expect(riskServiceKeyConfigured()).toBe(false);
    if (previous) process.env.NETCASH_RISK_SERVICE_KEY = previous;
  });
});
