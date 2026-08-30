import { generateCorporateConsolidatedInvoice } from '@/lib/billing/generate-corporate-consolidated-invoice';
import { buildActiveClinicLineItems } from '@/lib/billing/corporate-clinic-line-items';

// jest.config sets resetMocks: true, which strips any implementation attached
// inside the factory below before each test — the mock would then resolve to
// undefined. Bind the return value in beforeEach, which runs after the reset.
jest.mock('@/lib/billing/corporate-clinic-line-items', () => ({
  buildActiveClinicLineItems: jest.fn(),
}));

const CLINIC_LINE_ITEMS = [
  {
    description: 'Unjani Connect — Clinic A',
    site_name: 'Clinic A',
    site_id: 'site-1',
    site_code: 'CT-UNJ-001',
    service: 'Unjani Connect',
    sku: 'UNJ-MC-001',
    quantity: 1,
    unit_price: 450,
    amount: 450,
    type: 'recurring',
  },
];

beforeEach(() => {
  (buildActiveClinicLineItems as jest.Mock).mockResolvedValue(CLINIC_LINE_ITEMS);
});

type InsertedInvoice = Record<string, unknown> | null;

function createMockSupabase(opts: {
  existingNumbers: string[];
  duplicate?: { id: string; invoice_number: string } | null;
}) {
  let inserted: InsertedInvoice = null;

  const from = jest.fn((table: string) => {
    const state = { op: 'select' as 'select' | 'like' | 'insert' };
    const builder: Record<string, unknown> = {};

    const self = () => builder;
    builder.select = jest.fn(self);
    builder.eq = jest.fn(self);
    builder.is = jest.fn(self);
    builder.limit = jest.fn(self);
    builder.like = jest.fn(() => {
      state.op = 'like';
      return builder;
    });
    builder.insert = jest.fn((payload: Record<string, unknown>) => {
      state.op = 'insert';
      inserted = payload;
      return builder;
    });
    builder.single = jest.fn(async () => {
      if (table === 'corporate_accounts') {
        return {
          data: {
            id: 'org-1',
            company_name: 'Unjani NPC',
            primary_contact_name: 'Jane Doe',
            primary_contact_email: 'billing@unjani.co.za',
            primary_contact_phone: '0000000000',
          },
          error: null,
        };
      }
      return {
        data: {
          id: 'inv-new',
          invoice_number: inserted?.invoice_number,
          total_amount: inserted?.total_amount,
          line_items: inserted?.line_items,
        },
        error: null,
      };
    });

    // Awaitable chain (.limit / .like resolve here)
    (builder as { then: typeof Promise.prototype.then }).then = (
      resolve: (value: { data: unknown; error: null }) => unknown,
      reject?: (reason: unknown) => unknown
    ) => {
      let data: unknown = [];
      if (table === 'customers') {
        data = [{ id: 'cust-1' }];
      } else if (table === 'customer_invoices' && state.op === 'like') {
        data = opts.existingNumbers.map((invoice_number) => ({ invoice_number }));
      } else if (table === 'customer_invoices' && state.op === 'select') {
        data = opts.duplicate ? [opts.duplicate] : [];
      }
      return Promise.resolve({ data, error: null }).then(resolve, reject);
    };

    return builder;
  });

  return { from, getInserted: () => inserted };
}

describe('generateCorporateConsolidatedInvoice numbering', () => {
  const options = {
    organisationId: 'org-1',
    periodStart: '2026-08-01',
    periodEnd: '2026-08-31',
    invoiceDate: '2026-08-31',
    dueDate: '2026-09-07',
  };

  it('uses nextInvoiceSequence (max+1), not a random INV-YYYY-NNNNN', async () => {
    const supabase = createMockSupabase({
      existingNumbers: ['INV-2026-00061', 'INV-2026-00078', 'INV-2025-00099'],
    });

    const result = await generateCorporateConsolidatedInvoice(
      supabase as never,
      options
    );

    expect(result).toMatchObject({
      skipped: false,
      invoice_number: 'INV-2026-00079',
    });
    expect(supabase.getInserted()?.invoice_number).toBe('INV-2026-00079');
    expect(buildActiveClinicLineItems).toHaveBeenCalledWith(
      expect.anything(),
      'org-1',
      { periodEnd: '2026-08-31' }
    );
  });
});
