import { describe, it, expect } from '@jest/globals';
import { offerEnquiryPrefix } from '@/app/contact/page';

describe('contact page offer prefill helper', () => {
  it('builds offer enquiry prefix with subject and offer', () => {
    const result = offerEnquiryPrefix('SkyFibre Home 50', 'skyfibre-home-50');
    expect(result).toContain('Enquiry about: SkyFibre Home 50');
    expect(result).toContain('Offer reference: skyfibre-home-50');
  });

  it('returns empty string when subject is null', () => {
    const result = offerEnquiryPrefix(null, 'skyfibre-home-50');
    expect(result).toBe('');
  });

  it('includes offer reference only when both subject and offer are present', () => {
    const result = offerEnquiryPrefix('Product Name', 'ref-123');
    expect(result).toContain('Enquiry about: Product Name');
    expect(result).toContain('Offer reference: ref-123');
  });

  it('omits offer reference when offer is null but subject exists', () => {
    const result = offerEnquiryPrefix('Product Name', null);
    expect(result).toContain('Enquiry about: Product Name');
    expect(result).not.toContain('Offer reference');
    expect(result).toBe('Enquiry about: Product Name\n\n');
  });

  it('returns empty string when both are null', () => {
    const result = offerEnquiryPrefix(null, null);
    expect(result).toBe('');
  });
});
