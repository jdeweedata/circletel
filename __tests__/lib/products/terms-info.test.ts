import {
  TERMS_AND_CONDITIONS_LABEL,
  TERMS_AND_CONDITIONS_URL,
  appendTermsAndConditions,
} from '@/lib/products/terms-info';

describe('appendTermsAndConditions', () => {
  it('appends a T&Cs apply item that links to the public terms page', () => {
    const result = appendTermsAndConditions(['Month-to-month contract']);

    expect(result).toEqual([
      { text: 'Month-to-month contract' },
      { text: TERMS_AND_CONDITIONS_LABEL, href: TERMS_AND_CONDITIONS_URL },
    ]);
    expect(TERMS_AND_CONDITIONS_URL).toBe('/terms-of-service');
    expect(TERMS_AND_CONDITIONS_LABEL).toBe('T&Cs apply');
  });

  it('still adds the T&C link when there are no other additional-info items', () => {
    expect(appendTermsAndConditions([])).toEqual([
      { text: TERMS_AND_CONDITIONS_LABEL, href: TERMS_AND_CONDITIONS_URL },
    ]);
  });

  it('does not duplicate an existing T&C item', () => {
    const result = appendTermsAndConditions([
      { text: 'T&Cs apply', href: '/terms-of-service' },
    ]);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      text: 'T&Cs apply',
      href: '/terms-of-service',
    });
  });
});
