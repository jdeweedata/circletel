import {
  clinicKey,
  contactForClinic,
  coverageKpis,
  isInPipeline,
  mergeClinicContact,
  recommendedAccess,
  recommendedLabel,
  type CoverageCheckRow,
} from '@/lib/portal/coverage-summary';

function row(
  name: string,
  results: CoverageCheckRow['results']
): CoverageCheckRow {
  return {
    id: name,
    clinic_name: name,
    address: '1 Test St',
    latitude: -26,
    longitude: 28,
    results,
    created_at: '2026-08-10T00:00:00Z',
  };
}

describe('clinicKey', () => {
  it('collapses Unjani prefixes', () => {
    expect(clinicKey('Unjani Clinic - Lens ext 10')).toBe('lensext10');
    expect(clinicKey('Lens ext 10')).toBe('lensext10');
  });
});

describe('recommendedAccess', () => {
  it('prefers Tarana over 5G and 4G', () => {
    expect(
      recommendedAccess({
        tarana: { feasible: true },
        five_g: { available: true },
        lte: { available: true },
      })
    ).toBe('fixed_wireless');
  });

  it('uses 5G when Tarana is not feasible', () => {
    expect(
      recommendedAccess({
        tarana: { feasible: false },
        five_g: { available: true },
        lte: { available: true },
      })
    ).toBe('5g');
  });

  it('uses 4G as last resort', () => {
    expect(
      recommendedAccess({
        tarana: { feasible: false },
        five_g: { available: false },
        lte: { available: true },
      })
    ).toBe('4g');
  });

  it('ignores fibre / DFA fields', () => {
    expect(
      recommendedAccess({
        recommended_access_technology: 'Fibre first; Tarana FWB 50 Mbps',
        tarana: { feasible: false },
        five_g: { available: true },
        lte: { available: true },
      })
    ).toBe('5g');
  });

  it('returns none when nothing is available', () => {
    expect(recommendedAccess({})).toBe('none');
    expect(recommendedAccess(null)).toBe('none');
  });
});

describe('recommendedLabel', () => {
  it('uses plain-language labels', () => {
    expect(recommendedLabel('fixed_wireless')).toBe(
      'Fixed wireless — Tarana 50 Mbps'
    );
    expect(recommendedLabel('5g')).toBe('5G');
    expect(recommendedLabel('4g')).toBe('4G');
  });
});

describe('coverageKpis', () => {
  it('counts by recommended access, not raw availability', () => {
    const kpis = coverageKpis([
      row('A', { tarana: { feasible: true }, five_g: { available: true } }),
      row('B', { tarana: { feasible: false }, five_g: { available: true } }),
      row('C', {
        tarana: { feasible: false },
        five_g: { available: false },
        lte: { available: true },
      }),
      row('D', { tarana: { feasible: false } }),
    ]);
    expect(kpis).toEqual({ fixedWireless: 1, fiveG: 1, fourG: 1 });
  });
});

describe('isInPipeline', () => {
  it('matches collapsed clinic names', () => {
    expect(
      isInPipeline('Unjani Clinic - Alexandra', ['alexandra'])
    ).toBe(true);
    expect(isInPipeline('Carnival Green', ['alexandra'])).toBe(false);
  });
});

const soshanguve = {
  name: 'Salome Moletsane',
  phone: '076 113 0227',
  email: 'soshanguve@unjani.org',
};

describe('contactForClinic', () => {
  const contacts = {
    soshanguve,
    lensext10: {
      name: 'Tsabeng Ramalope',
      phone: '071 898 8722',
      email: 'lensext10@unjani.org',
    },
  };

  it('matches Unjani-prefixed names via clinicKey', () => {
    expect(contactForClinic('Unjani Clinic - Lens ext 10', contacts)?.name).toBe(
      'Tsabeng Ramalope'
    );
  });

  it('matches parenthetical site labels to the register name', () => {
    expect(contactForClinic('Soshanguve (Block P)', contacts)).toEqual(
      soshanguve
    );
  });

  it('returns undefined when the clinic is not in the map', () => {
    expect(contactForClinic('Unknown Clinic', contacts)).toBeUndefined();
  });
});

describe('mergeClinicContact', () => {
  it('lets live site fields override the register, keeping blanks from the register', () => {
    expect(
      mergeClinicContact(soshanguve, {
        name: 'Site Manager',
        phone: '',
        email: 'site@unjani.org',
      })
    ).toEqual({
      name: 'Site Manager',
      phone: '076 113 0227',
      email: 'site@unjani.org',
    });
  });
});
