import { describe, expect, it } from '@jest/globals';
import {
  displayName,
  extractAccountNumber,
  namesEqual,
  normalizeName,
} from '@/lib/billing/recon-hub/party-identity';

describe('normalizeName', () => {
  it('trims, collapses spaces, and uppercases', () => {
    expect(normalizeName('  Prins   Mhlanga ')).toBe('PRINS MHLANGA');
  });

  it('returns empty string for blank input', () => {
    expect(normalizeName('')).toBe('');
    expect(normalizeName(null)).toBe('');
    expect(normalizeName(undefined)).toBe('');
  });
});

describe('namesEqual', () => {
  it('matches after normalize', () => {
    expect(namesEqual('Prins Mhlanga', 'PRINS  MHLANGA')).toBe(true);
  });

  it('rejects a different person', () => {
    expect(namesEqual('Prins Mhlanga', 'Shaun Robertson')).toBe(false);
  });

  it('rejects when either side is blank', () => {
    expect(namesEqual('Prins Mhlanga', '')).toBe(false);
    expect(namesEqual(null, 'Prins Mhlanga')).toBe(false);
  });
});

describe('displayName', () => {
  it('uses business_name when present', () => {
    expect(
      displayName({
        business_name: 'Unjani Clinics NPC',
        first_name: 'Ruth',
        last_name: 'Butcher',
      })
    ).toBe('Unjani Clinics NPC');
  });

  it('uses first + last for individuals', () => {
    expect(
      displayName({
        business_name: null,
        first_name: 'Prins',
        last_name: 'Mhlanga',
      })
    ).toBe('Prins Mhlanga');
  });
});

describe('extractAccountNumber', () => {
  it('extracts a bare account number', () => {
    expect(extractAccountNumber('CT-2025-00030')).toBe('CT-2025-00030');
  });

  it('extracts an account number embedded in a longer reference', () => {
    expect(extractAccountNumber('EFT Prins Mhlanga CT-2025-00030 Sept')).toBe(
      'CT-2025-00030'
    );
  });

  it('does not treat invoice or order refs as account numbers', () => {
    expect(extractAccountNumber('CT-INV2026-00081-1788235202771')).toBeNull();
    expect(extractAccountNumber('INV-2026-00081')).toBeNull();
    expect(extractAccountNumber('CT-20260227-52bd7f62')).toBeNull();
  });
});
