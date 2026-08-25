import {
  formatClinicLineDescription,
  formatSiteDisplayId,
  buildClinicLineItem,
} from '@/lib/billing/corporate-clinic-line-items';

describe('corporate-clinic-line-items', () => {
  it('formats Unjani Connect clinic line descriptions', () => {
    expect(formatClinicLineDescription('Stinkwater')).toBe(
      'Unjani Connect — Stinkwater'
    );
    expect(
      formatClinicLineDescription('Suurman', 'Unjani Connect', 'pro-rata 10/31 days')
    ).toBe('Unjani Connect — Suurman (pro-rata 10/31 days)');
  });

  it('builds one line item per clinic with UNJ-MC-001 defaults', () => {
    const line = buildClinicLineItem({
      id: 'site-1',
      site_name: 'Bridge City KwaMashu',
      monthly_fee: 450,
      package_id: 'pkg-1',
      service_packages: {
        name: 'Unjani Managed Connectivity',
        sku: 'UNJ-MC-001',
        price: 450,
      },
    });

    expect(line.description).toBe('Unjani Connect — Bridge City KwaMashu');
    expect(line.site_name).toBe('Bridge City KwaMashu');
    expect(line.sku).toBe('UNJ-MC-001');
    expect(line.quantity).toBe(1);
    expect(line.amount).toBe(450);
    expect(line.unit_price).toBe(450);
  });

  it('uses amount override for pro-rata lines', () => {
    const line = buildClinicLineItem(
      {
        id: 'site-2',
        site_name: 'Daggakraal',
        monthly_fee: 450,
        package_id: null,
        service_packages: null,
      },
      { type: 'pro_rata', amountOverride: 145.16, suffix: 'pro-rata 10/31 days' }
    );

    expect(line.type).toBe('pro_rata');
    expect(line.amount).toBe(145.16);
    expect(line.description).toContain('Daggakraal');
    expect(line.description).toContain('pro-rata');
  });

  it('uses the clinic account number as the invoice SITE ID', () => {
    expect(
      formatSiteDisplayId({
        account_number: 'CT-UNJ-013',
        site_code: null,
        site_number: 13,
      })
    ).toBe('CT-UNJ-013');
    expect(
      formatSiteDisplayId({
        account_number: null,
        site_code: 'UNJ-BAR',
        site_number: 13,
      })
    ).toBe('UNJ-BAR');
    expect(
      formatSiteDisplayId({
        account_number: null,
        site_code: null,
        site_number: 2,
      })
    ).toBe('UNJ-002');
  });

  it('puts the display SITE ID on each clinic line item', () => {
    const line = buildClinicLineItem({
      id: 'uuid-barcelona',
      site_name: 'Unjani Clinic - Barcelona',
      account_number: 'CT-UNJ-013',
      site_code: null,
      site_number: 13,
      monthly_fee: 450,
      package_id: 'pkg-1',
      service_packages: {
        name: 'Unjani Managed Connectivity',
        sku: 'UNJ-MC-001',
        price: 450,
      },
    });

    expect(line.site_code).toBe('CT-UNJ-013');
    expect(line.site_id).toBe('uuid-barcelona');
  });
});
