import { deriveStage } from '@/lib/portal/onboarding-stage';

describe('deriveStage', () => {
  it('keeps an approved pending site on details_confirmed until a visit is confirmed', () => {
    expect(
      deriveStage({
        siteStatus: 'pending',
        installedAt: null,
        submissionStatus: 'approved',
        onboardingLinkSent: true,
      })
    ).toBe('details_confirmed');
  });

  it('treats an approved submission without a site as details_confirmed', () => {
    expect(
      deriveStage({
        submissionStatus: 'approved',
        onboardingLinkSent: true,
      })
    ).toBe('details_confirmed');
  });

  it('moves to visit_booked only after the scheduler confirms a visit date', () => {
    expect(
      deriveStage({
        siteStatus: 'pending',
        submissionStatus: 'approved',
        visitDate: '2026-09-10',
      })
    ).toBe('visit_booked');
  });

  it('moves to installing after the confirmed visit once the kit is issued', () => {
    expect(
      deriveStage({
        siteStatus: 'pending',
        submissionStatus: 'approved',
        visitDate: '2026-09-10',
        kitIssuedAt: '2026-09-10T08:00:00.000Z',
      })
    ).toBe('installing');
  });

  it('stays live when the site is active with a go-live date', () => {
    expect(
      deriveStage({
        siteStatus: 'active',
        installedAt: '2026-08-01T00:00:00.000Z',
        submissionStatus: 'approved',
        visitDate: '2026-07-15',
        kitIssuedAt: '2026-07-15T08:00:00.000Z',
      })
    ).toBe('live');
  });
});
