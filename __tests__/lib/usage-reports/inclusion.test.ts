import { filterEligibleSites, type InclusionSiteRow } from '@/lib/usage-reports/inclusion';

const base: InclusionSiteRow = {
  id: 's1',
  name: 'Alexandra',
  account_number: 'CT-UNJ-002',
  status: 'active',
  service_id: null,
  service_status: null,
  corporate_code: 'UNJ',
  account_name: 'Unjani Clinics NPC',
};

describe('filterEligibleSites', () => {
  it('includes active with null service_id', () => {
    expect(filterEligibleSites([base], { includeProvisioned: false }).map((s) => s.id)).toEqual([
      's1',
    ]);
  });

  it('excludes active when linked service is not active', () => {
    const row = { ...base, service_id: 'svc', service_status: 'suspended' };
    expect(filterEligibleSites([row], { includeProvisioned: false })).toHaveLength(0);
  });

  it('includeProvisioned adds provisioned sites', () => {
    const row = { ...base, id: 's2', status: 'provisioned' as const };
    expect(filterEligibleSites([base, row], { includeProvisioned: false })).toHaveLength(1);
    expect(filterEligibleSites([base, row], { includeProvisioned: true })).toHaveLength(2);
  });

  it('unjaniOnly filters corporate_code UNJ', () => {
    const other = { ...base, id: 's3', corporate_code: 'ACME' };
    expect(
      filterEligibleSites([base, other], { includeProvisioned: false, unjaniOnly: true })
    ).toHaveLength(1);
  });
});
