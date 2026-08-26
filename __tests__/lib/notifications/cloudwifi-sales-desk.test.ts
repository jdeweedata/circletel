jest.mock('@/lib/integrations/zoho/desk-service', () => ({
  createMintedZohoDeskService: jest.fn(),
}));

import { createMintedZohoDeskService } from '@/lib/integrations/zoho/desk-service';
import { renderSalesCoverageLeadAlert } from '@/lib/notifications/templates/email/sales_coverage_lead_alert';
import { createCloudWifiSalesDeskTicket } from '@/lib/notifications/sales-alerts';

const mintDesk = createMintedZohoDeskService as jest.MockedFunction<
  typeof createMintedZohoDeskService
>;

const cloudWifiLead = {
  id: 'lead-1',
  customer_type: 'smme' as const,
  first_name: 'Naledi',
  last_name: 'Mokoena',
  email: 'naledi@example.co.za',
  phone: '+27821234567',
  company_name: 'Mokoena Hospitality',
  address: 'To confirm during site survey',
  city: 'Johannesburg',
  requested_service_type: 'cloudwifi',
  follow_up_notes: 'Recommended tier: Professional. Venue: hospitality, 450 sqm.',
};

describe('CloudWiFi Sales Desk ticket', () => {
  const previousDepartment = process.env.ZOHO_DESK_SALES_DEPARTMENT_ID;
  const createTicket = jest.fn();

  beforeEach(() => {
    createTicket.mockReset();
    mintDesk.mockReset();
    mintDesk.mockResolvedValue({ createTicket } as never);
    process.env.ZOHO_DESK_SALES_DEPARTMENT_ID = '1100825000005235029';
  });

  afterAll(() => {
    process.env.ZOHO_DESK_SALES_DEPARTMENT_ID = previousDepartment;
  });

  it('creates a CircleTel Sales ticket for CloudWiFi surveys', async () => {
    createTicket.mockResolvedValue({
      success: true,
      ticket: { id: 'desk-99' },
    });

    const result = await createCloudWifiSalesDeskTicket(cloudWifiLead, 'crm-22');

    expect(result).toEqual({ success: true, ticketId: 'desk-99' });
    expect(createTicket).toHaveBeenCalledWith(
      expect.objectContaining({
        departmentId: '1100825000005235029',
        channel: 'Web',
        priority: 'High',
        category: 'CloudWiFi',
        subject:
          'CloudWiFi site survey — Mokoena Hospitality — Johannesburg',
        customerEmail: 'naledi@example.co.za',
      }),
    );
    expect(createTicket.mock.calls[0][0].description).toContain(
      'Recommended tier: Professional',
    );
    expect(createTicket.mock.calls[0][0].description).toContain('CRM lead: crm-22');
  });

  it('does not create a Desk ticket for non-CloudWiFi leads', async () => {
    const result = await createCloudWifiSalesDeskTicket({
      ...cloudWifiLead,
      requested_service_type: 'fibre',
    });

    expect(result).toEqual({ success: true });
    expect(createTicket).not.toHaveBeenCalled();
  });

  it('fails closed when the Sales Desk department is missing', async () => {
    delete process.env.ZOHO_DESK_SALES_DEPARTMENT_ID;

    const result = await createCloudWifiSalesDeskTicket(cloudWifiLead);

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/department/i);
    expect(createTicket).not.toHaveBeenCalled();
  });
});

describe('sales coverage lead email', () => {
  it('renders survey follow-up notes', () => {
    const html = renderSalesCoverageLeadAlert({
      customer_type: 'SMME',
      customer_name: 'Naledi Mokoena',
      email: 'naledi@example.co.za',
      phone: '+27821234567',
      requested_service: 'cloudwifi',
      requested_speed: 'Not specified',
      budget_range: 'Not specified',
      coverage_available: 'Not assessed',
      address: 'To confirm during site survey',
      follow_up_notes: 'Recommended tier: Professional',
      lead_id: 'lead-1',
    });

    expect(html).toContain('Survey notes');
    expect(html).toContain('Recommended tier: Professional');
  });
});
