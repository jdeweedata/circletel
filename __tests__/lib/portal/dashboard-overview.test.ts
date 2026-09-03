import {
  parseSiteListFilter,
  pipelineClinicsForFilter,
  pipelineOverviewRows,
  pipelineSiteListRows,
  sitesForListFilter,
} from '@/lib/portal/dashboard-overview';
import type { StageClinicRef } from '@/lib/portal/count-onboarding-stages';

const clinics: StageClinicRef[] = [
  {
    stage: 'introduced',
    customerId: 'cust-suurman',
    name: 'Unjani Clinic - Suurman',
    address: '915A Joseph Molefe Makinta Street, Suurman Village',
  },
  {
    stage: 'introduced',
    customerId: 'cust-daggakraal',
    name: 'Unjani Clinic - Daggakraal',
  },
  {
    stage: 'details_confirmed',
    customerId: 'cust-stinkwater',
    name: 'Unjani Clinic - Stinkwater',
    address: '3176 Thintha Street, Mokone Block, Stinkwater',
  },
  {
    stage: 'installing',
    siteId: 'site-delmas',
    customerId: 'cust-delmas',
    name: 'Unjani Clinic - Delmas',
  },
  {
    stage: 'live',
    siteId: 'site-lens',
    customerId: 'cust-lens',
    name: 'Unjani Clinic - Lens ext 10',
  },
];

describe('pipelineOverviewRows', () => {
  it('lists leftover introduced clinics that have no corporate site', () => {
    const rows = pipelineOverviewRows({
      stage: 'introduced',
      clinics,
    });

    expect(rows.map((row) => row.name)).toEqual(['Daggakraal', 'Suurman']);
    expect(rows.every((row) => !row.siteId)).toBe(true);
    expect(rows.find((row) => row.name === 'Suurman')?.location).toContain(
      'Suurman Village'
    );
  });

  it('uses the corporate site location and technology when a site exists', () => {
    const rows = pipelineOverviewRows({
      stage: 'installing',
      clinics,
      sites: [
        {
          id: 'site-delmas',
          province: 'Mpumalanga',
          technology: 'tarana_fwb',
          installation_address: { city: 'Delmas', province: 'Mpumalanga' },
        },
      ],
    });

    expect(rows).toEqual([
      {
        key: 'site-delmas',
        name: 'Delmas',
        stage: 'installing',
        siteId: 'site-delmas',
        location: 'Delmas, Mpumalanga',
        technology: 'tarana_fwb',
      },
    ]);
  });

  it('returns an empty list when the stage has no clinics', () => {
    expect(
      pipelineOverviewRows({
        stage: 'changes_requested',
        clinics,
      })
    ).toEqual([]);
  });
});

describe('parseSiteListFilter', () => {
  it('reads the dashboard card query and ignores unknown values', () => {
    expect(parseSiteListFilter('onboarding')).toBe('onboarding');
    expect(parseSiteListFilter('live')).toBe('live');
    expect(parseSiteListFilter('all')).toBe('all');
    expect(parseSiteListFilter(null)).toBe('all');
    expect(parseSiteListFilter('sites')).toBe('all');
  });
});

describe('pipelineClinicsForFilter', () => {
  it('lists the same in-onboarding clinics as Pipeline by stage, not live sites', () => {
    const rows = pipelineClinicsForFilter(clinics, 'onboarding');
    expect(rows.map((row) => row.name)).toEqual([
      'Unjani Clinic - Suurman',
      'Unjani Clinic - Daggakraal',
      'Unjani Clinic - Stinkwater',
      'Unjani Clinic - Delmas',
    ]);
  });
});

describe('pipelineSiteListRows', () => {
  it('keeps nominated coverage-check clinics that have no corporate_sites row', () => {
    const rows = pipelineSiteListRows({
      filter: 'onboarding',
      clinics: [
        { stage: 'live', siteId: 'site-live', customerId: 'c-live', name: 'Unjani Clinic - Lens' },
        { stage: 'installing', siteId: 'site-delmas', customerId: 'c-delmas', name: 'Unjani Clinic - Delmas' },
        { stage: 'nominated', customerId: null, coverageCheckId: 'chk-suurman', name: 'Suurman' },
      ],
      sites: [
        {
          id: 'site-delmas',
          province: 'Mpumalanga',
          technology: 'LTE',
        },
      ],
    });

    expect(rows.map((row) => ({ name: row.name, siteId: row.siteId, stage: row.stage }))).toEqual([
      { name: 'Delmas', siteId: 'site-delmas', stage: 'installing' },
      { name: 'Suurman', siteId: undefined, stage: 'nominated' },
    ]);
  });
});

describe('sitesForListFilter', () => {
  const sites = [
    { id: 'live', stage: 'live' as const },
    { id: 'installing', stage: 'installing' as const },
    { id: 'nominated', stage: 'nominated' as const },
  ];

  it('still applies onboarding and live filters when pipeline clinics are missing', () => {
    expect(sitesForListFilter(sites, 'onboarding').map((site) => site.id)).toEqual([
      'installing',
      'nominated',
    ]);
    expect(sitesForListFilter(sites, 'live').map((site) => site.id)).toEqual(['live']);
    expect(sitesForListFilter(sites, 'all').map((site) => site.id)).toEqual([
      'live',
      'installing',
      'nominated',
    ]);
  });
});
