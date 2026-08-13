import { buildClinicLineItem } from '@/lib/billing/corporate-clinic-line-items';
import { buildInvoiceData } from '@/lib/invoices/invoice-pdf-generator';

describe('NPC invoice SITE ID mapping', () => {
  it('copies clinic site_code onto the PDF line item', () => {
    const clinicLine = buildClinicLineItem({
      id: 'uuid-barcelona',
      site_name: 'Barcelona',
      account_number: 'CT-UNJ-013',
      monthly_fee: 450,
      package_id: null,
      service_packages: { name: null, sku: 'UNJ-MC-001', price: 450 },
    });

    const invoice = buildInvoiceData({
      invoice: {
        id: 'inv-1',
        invoice_number: 'INV-2026-NPC-SEP',
        invoice_date: '2026-09-28',
        due_date: '2026-10-02',
        subtotal: 450,
        tax_amount: 67.5,
        total_amount: 517.5,
        line_items: [clinicLine],
      },
      customer: {
        first_name: 'Unjani',
        last_name: 'Clinics NPC',
        email: 'finance@unjani.org',
      },
    });

    expect(invoice.lineItems[0].siteId).toBe('CT-UNJ-013');
  });
});
