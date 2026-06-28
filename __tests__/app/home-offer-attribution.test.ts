import { describe, it, expect } from '@jest/globals';
import { offerSlugFromParams } from '@/app/(marketing)/page';

describe('home offer attribution helper', () => {
  it('extracts offer slug from URLSearchParams', () => {
    const params = new URLSearchParams('offer=skyfibre-home-50');
    expect(offerSlugFromParams(params)).toBe('skyfibre-home-50');
  });

  it('returns null when offer param is missing', () => {
    const params = new URLSearchParams('');
    expect(offerSlugFromParams(params)).toBeNull();
  });

  it('returns null when other params are present but not offer', () => {
    const params = new URLSearchParams('segment=business&other=value');
    expect(offerSlugFromParams(params)).toBeNull();
  });
});
