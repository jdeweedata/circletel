import { tierFor, provinceFor, mergeContracts } from '../route';

describe('tierFor', () => {
  it('returns under-300 for fee below 300', () => {
    expect(tierFor('250')).toBe('under-300');
    expect(tierFor('R 299.00')).toBe('under-300');
  });

  it('returns 300-500 for fee between 300 and 499', () => {
    expect(tierFor('350')).toBe('300-500');
    expect(tierFor('R499.00')).toBe('300-500');
  });

  it('returns 500-800 for fee between 500 and 799', () => {
    expect(tierFor('500')).toBe('500-800');
    expect(tierFor('750')).toBe('500-800');
  });

  it('returns 800-plus for fee 800 and above', () => {
    expect(tierFor('800')).toBe('800-plus');
    expect(tierFor('1200')).toBe('800-plus');
  });

  it('returns unknown for empty or unparseable fee', () => {
    expect(tierFor('')).toBe('unknown');
    expect(tierFor('N/A')).toBe('unknown');
    expect(tierFor(undefined as unknown as string)).toBe('unknown');
  });
});

describe('provinceFor', () => {
  it('detects Western Cape from address', () => {
    expect(provinceFor('12 Main Rd, Cape Town, 8001')).toBe('Western Cape');
  });
  it('detects Gauteng from address', () => {
    expect(provinceFor('55 Voortrekker, Pretoria, 0001')).toBe('Gauteng');
  });
  it('returns null for unknown', () => {
    expect(provinceFor('Unknown place')).toBeNull();
  });
});

describe('mergeContracts', () => {
  const contracts = [
    { account_number: 'ABC001', package_name: 'Fibre 10', monthly_fee: '349', physical_address: '12 Main Rd, Cape Town', source_filename: 'f.pdf', drive_file_id: 'xxx' },
    { account_number: 'ABC002', package_name: 'Fibre 20', monthly_fee: '', physical_address: 'No number here', source_filename: 'g.pdf', drive_file_id: 'yyy' },
  ];
  const geocache: Record<string, [number, number] | null> = {
    '12 Main Rd, Cape Town': [-33.9249, 18.4241],
  };

  it('returns only records that have a digit in address AND exist in geocache', () => {
    const result = mergeContracts(contracts, geocache);
    expect(result).toHaveLength(1);
    expect(result[0].account_number).toBe('ABC001');
  });

  it('attaches lat, lng, tier, province to each record', () => {
    const result = mergeContracts(contracts, geocache);
    expect(result[0].lat).toBe(-33.9249);
    expect(result[0].lng).toBe(18.4241);
    expect(result[0].tier).toBe('300-500');
    expect(result[0].province).toBe('Western Cape');
  });
});
