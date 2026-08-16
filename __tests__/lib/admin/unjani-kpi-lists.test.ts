import { buildUnjaniKpiLists } from '@/lib/admin/unjani-kpi-lists';
import { unjaniDashboardKpis } from '@/lib/portal/dashboard-kpis';
import { emptyStageCounts } from '@/lib/portal/count-onboarding-stages';

describe('buildUnjaniKpiLists', () => {
  const sites = [
    { id: 'live-billed', site_name: 'Unjani Clinic - Delmas', installed_at: '2026-06-01', monthly_fee: 450 },
    { id: 'live-free', site_name: 'Unjani Clinic - Lens', installed_at: '2026-08-10', monthly_fee: 450 },
    { id: 'pending', site_name: 'Unjani Clinic - Berea', monthly_fee: 450 },
  ];
  const coverageChecks = [
    { id: 'c1', clinic_name: 'Unjani Clinic - Delmas', address: 'Delmas', latitude: -26, longitude: 28, results: { tarana: { feasible: true } } },
    { id: 'c2', clinic_name: 'Unjani Clinic - New', address: 'New', latitude: -26, longitude: 28, results: { lte: { available: true } } },
    { id: 'c3', clinic_name: 'Unjani Clinic - Ready', address: 'Ready', latitude: -26, longitude: 28, results: { five_g: { available: true } } },
    { id: 'c4', clinic_name: 'Suurman', address: 'Suurman', latitude: -25, longitude: 28, results: { nominated: true, tarana: { feasible: true } } },
  ];
  const stageClinics = [
    { stage: 'live' as const, siteId: 'live-billed', customerId: 'cust-1', name: 'Unjani Clinic - Delmas' },
    { stage: 'live' as const, siteId: 'live-free', customerId: 'cust-2', name: 'Unjani Clinic - Lens' },
    { stage: 'installing' as const, siteId: 'pending', customerId: 'cust-3', name: 'Unjani Clinic - Berea' },
    { stage: 'introduced' as const, customerId: 'cust-4', name: 'Unjani Clinic - Invite' },
  ];

  it('splits live, onboarding, pre-qualified and billed spend to match the KPI counts', () => {
    const lists = buildUnjaniKpiLists({
      stageClinics,
      sites,
      coverageChecks,
      billedSiteIds: ['live-billed'],
    });
    const kpis = unjaniDashboardKpis({
      stageCounts: { ...emptyStageCounts(), live: 2, installing: 1, introduced: 1 },
      sites,
      coverageChecks,
      stageBySiteId: { 'live-billed': 'live', 'live-free': 'live', pending: 'installing' },
      billedSiteIds: ['live-billed'],
    });

    expect(lists.sitesLive).toHaveLength(kpis.sitesLive);
    expect(lists.inOnboarding).toHaveLength(kpis.inOnboarding);
    expect(lists.preQualified).toHaveLength(kpis.preQualified);
    expect(lists.monthlySpend).toHaveLength(kpis.billedSites);
    expect(lists.monthlySpend[0]?.name).toContain('Delmas');
    expect(lists.preQualified.map((row) => row.name)).toEqual([
      'Unjani Clinic - New',
      'Unjani Clinic - Ready',
    ]);
  });
});
