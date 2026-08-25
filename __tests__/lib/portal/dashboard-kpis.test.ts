import { billedSiteIdSet, spendNote, unjaniDashboardKpis } from '@/lib/portal/dashboard-kpis';
import { emptyStageCounts } from '@/lib/portal/count-onboarding-stages';

describe('unjaniDashboardKpis', () => {
  it('counts live sites, pipeline clinics, pre-qualified checks, and billed spend', () => {
    const stageCounts = {
      ...emptyStageCounts(),
      live: 2,
      installing: 1,
      introduced: 3,
    };
    const result = unjaniDashboardKpis({
      stageCounts,
      sites: [
        { id: 'live-billed', site_name: 'Unjani Clinic - Delmas', monthly_fee: 450 },
        { id: 'live-free', site_name: 'Unjani Clinic - Lens', monthly_fee: 450 },
        { id: 'pending', site_name: 'Unjani Clinic - Berea', monthly_fee: 450 },
      ],
      coverageChecks: [
        { clinic_name: 'Unjani Clinic - Delmas' },
        { clinic_name: 'Unjani Clinic - New' },
        { clinic_name: 'Unjani Clinic - Ready' },
        { clinic_name: 'Suurman', results: { nominated: true } },
      ],
      stageBySiteId: {
        'live-billed': 'live',
        'live-free': 'live',
        pending: 'installing',
      },
      billedSiteIds: ['live-billed'],
    });

    expect(result).toEqual({
      sitesLive: 2,
      inOnboarding: 4,
      preQualified: 2,
      billedSites: 1,
      monthlySpend: 450,
    });
  });

  it('describes billed spend the same way as the /unjani dashboard', () => {
    expect(spendNote(2, 900)).toBe('2 × R450,00 excl VAT');
    expect(spendNote(0, 0)).toBe('Excl VAT');
  });

  it('marks a site billed only when an active service has reached its start date', () => {
    const now = new Date('2026-08-16T12:00:00.000Z');
    const billed = billedSiteIdSet(
      [
        { id: 'cust-live', corporate_site_id: 'site-live' },
        { id: 'cust-deferred', corporate_site_id: 'site-deferred' },
      ],
      [
        {
          customer_id: 'cust-live',
          billing_start_date: '2026-08-01',
          status: 'active',
          active: true,
        },
        {
          customer_id: 'cust-deferred',
          billing_start_date: '2026-09-01',
          status: 'active',
          active: true,
        },
      ],
      now
    );

    expect([...billed]).toEqual(['site-live']);
  });
});
