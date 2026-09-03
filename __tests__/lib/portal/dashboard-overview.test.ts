import { pipelineOverviewRows } from '@/lib/portal/dashboard-overview';
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
