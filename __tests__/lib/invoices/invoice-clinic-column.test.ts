import { invoiceLineDisplayDescription } from '@/lib/invoices/invoice-pdf-generator';
import { buildClinicLineItem } from '@/lib/billing/corporate-clinic-line-items';

// Unjani NPC asked for the clinic in its own column between SITE ID and
// DESCRIPTION (August 2026). The stored description already carries the clinic
// name, so it has to come out of the description or it prints twice.

describe('invoice CLINIC column — display description', () => {
  it('drops the clinic suffix when the clinic has its own column', () => {
    expect(
      invoiceLineDisplayDescription({
        description: 'Unjani Connect — Alexandra',
        siteName: 'Alexandra',
      })
    ).toBe('Unjani Connect');
  });

  // Real site name with brackets — endsWith, not a regex, so no escaping needed.
  it('handles a clinic name containing brackets', () => {
    expect(
      invoiceLineDisplayDescription({
        description: 'Unjani Connect — Soshanguve (Block P)',
        siteName: 'Soshanguve (Block P)',
      })
    ).toBe('Unjani Connect');
  });

  it('leaves the description alone when there is no clinic name', () => {
    expect(
      invoiceLineDisplayDescription({ description: 'Unjani Connect — Alexandra' })
    ).toBe('Unjani Connect — Alexandra');
  });

  it('leaves the description alone when it does not end with the clinic name', () => {
    expect(
      invoiceLineDisplayDescription({
        description: 'Installation charge',
        siteName: 'Alexandra',
      })
    ).toBe('Installation charge');
  });

  // Guards the contract between the two files: if formatClinicLineDescription
  // ever stops using " — ", this test fails rather than the invoice quietly
  // printing the clinic twice.
  it('matches what buildClinicLineItem actually produces', () => {
    const line = buildClinicLineItem({
      id: 'site-1',
      site_name: 'Alexandra',
      account_number: 'CT-UNJ-002',
      site_code: null,
      site_number: null,
      monthly_fee: 450,
      package_id: null,
      service_packages: { name: 'Unjani Connect', sku: 'UNJ-MC-001', price: 450 },
    });

    expect(line.description).toBe('Unjani Connect — Alexandra');
    expect(
      invoiceLineDisplayDescription({
        description: line.description,
        siteName: line.site_name,
      })
    ).toBe('Unjani Connect');
  });
});
