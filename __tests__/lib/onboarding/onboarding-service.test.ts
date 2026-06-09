import { describe, it, expect } from '@jest/globals';
import { buildMagicLinkUrl } from '@/lib/onboarding/onboarding-service';

describe('buildMagicLinkUrl', () => {
  it('builds an absolute onboarding URL from base + token', () => {
    expect(buildMagicLinkUrl('https://www.circletel.co.za', 'TOK')).toBe(
      'https://www.circletel.co.za/onboarding/TOK'
    );
  });
  it('strips a trailing slash on base', () => {
    expect(buildMagicLinkUrl('https://www.circletel.co.za/', 'TOK')).toBe(
      'https://www.circletel.co.za/onboarding/TOK'
    );
  });
});
