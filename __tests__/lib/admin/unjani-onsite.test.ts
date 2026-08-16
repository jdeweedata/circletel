import { canIssueRfsCertificate } from '@/lib/billing/unjani-connect-rules';
import { canGoLiveFromFulfilment } from '@/lib/admin/unjani-onsite';

describe('Unjani on-site RFS gate', () => {
  const approvedJob = {
    jobCardPath: 'unjani-connect/site/job-card.pdf',
    jobCardApprovedAt: '2026-09-12T10:00:00Z',
    surveySpeedtestPath: 'unjani-connect/site/ookla-before.png',
    commissionSpeedtestPath: 'unjani-connect/site/ookla-after.png',
  };

  it('refuses RFS until both Ookla screenshots and an approved job card exist', () => {
    expect(
      canIssueRfsCertificate({
        jobCardPath: 'unjani-connect/site/job-card.pdf',
        jobCardApprovedAt: '2026-09-12T10:00:00Z',
      })
    ).toBe(false);
    expect(
      canIssueRfsCertificate({
        ...approvedJob,
        commissionSpeedtestPath: null,
      })
    ).toBe(false);
    expect(canIssueRfsCertificate(approvedJob)).toBe(true);
  });

  it('blocks go-live until the kit is issued, both screenshots exist, and the job card is approved', () => {
    expect(
      canGoLiveFromFulfilment({
        stockStatus: 'reserved',
        kitIssuedAt: null,
        ...approvedJob,
      })
    ).toBe(false);
    expect(
      canGoLiveFromFulfilment({
        stockStatus: 'reserved',
        kitIssuedAt: '2026-09-10T08:00:00Z',
        ...approvedJob,
      })
    ).toBe(true);
  });
});
