import {
  deriveContractStatus,
  normClinicName,
  incumbentForClinic,
} from '@/lib/onboarding/clinic-incumbent';

describe('deriveContractStatus', () => {
  it('maps migration_ready true -> out_of_contract', () => {
    expect(deriveContractStatus(true)).toBe('out_of_contract');
  });
  it('maps migration_ready false -> in_contract', () => {
    expect(deriveContractStatus(false)).toBe('in_contract');
  });
  it('maps missing -> unknown', () => {
    expect(deriveContractStatus(undefined)).toBe('unknown');
    expect(deriveContractStatus(null)).toBe('unknown');
  });
});

describe('normClinicName', () => {
  it('strips the "Unjani Clinic - " prefix and lowercases', () => {
    expect(normClinicName('Unjani Clinic - Barcelona')).toBe('barcelona');
    expect(normClinicName('Barcelona')).toBe('barcelona');
  });
});

describe('incumbentForClinic', () => {
  it('returns register isp/cost/contract for a known clinic', () => {
    const r = incumbentForClinic('Lens Ext 10');
    expect(r.incumbent_isp).toBe('MTN');
    expect(r.incumbent_cost).toBe(2500);
    expect(r.contract_status).toBe('out_of_contract');
  });
  it('returns unknown nulls for an unmatched clinic', () => {
    const r = incumbentForClinic('Definitely Not A Real Clinic');
    expect(r.incumbent_isp).toBeNull();
    expect(r.incumbent_cost).toBeNull();
    expect(r.contract_status).toBe('unknown');
  });
});
