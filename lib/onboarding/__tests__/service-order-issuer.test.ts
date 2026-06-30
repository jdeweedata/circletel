import { Resend } from 'resend';
import { issueToken } from '../onboarding-service';
import { issueServiceOrderForCustomer } from '../service-order-issuer';
import { uploadFile } from '@/lib/storage/supabase-upload';
import { generateServiceOrderBlob } from '@/lib/contracts/service-order-pdf';

jest.mock('resend', () => ({
  Resend: jest.fn(),
}));

jest.mock('../onboarding-service', () => ({
  issueToken: jest.fn(),
}));

jest.mock('@/lib/storage/supabase-upload', () => ({
  uploadFile: jest.fn(),
}));

jest.mock('@/lib/contracts/service-order-pdf', () => ({
  generateServiceOrderBlob: jest.fn(),
}));

const mockIssueToken = issueToken as jest.MockedFunction<typeof issueToken>;
const mockUploadFile = uploadFile as jest.MockedFunction<typeof uploadFile>;
const mockGenerateServiceOrderBlob = generateServiceOrderBlob as jest.MockedFunction<typeof generateServiceOrderBlob>;
const mockResend = Resend as jest.Mock;

function createSupabaseMock() {
  const updates: unknown[] = [];
  const from = jest.fn((table: string) => {
    const builder: any = {
      select: jest.fn(() => builder),
      eq: jest.fn(() => builder),
      order: jest.fn(() => builder),
      limit: jest.fn(() => builder),
      update: jest.fn((payload) => {
        updates.push(payload);
        return builder;
      }),
      single: jest.fn(() => {
        if (table === 'customers') {
          return Promise.resolve({
            data: {
              id: 'customer-1',
              account_number: 'CT-2026-00042',
              business_name: 'Future Business Client',
              email: 'client@example.co.za',
              phone: '0821234567',
              clinic_details: {
                province: 'Gauteng',
                site_address: '10 Business Road',
              },
            },
            error: null,
          });
        }
        if (table === 'onboarding_submissions') {
          return Promise.resolve({
            data: {
              id: 'submission-1',
              segment: 'enterprise',
              submitted_at: '2026-06-30T09:00:00.000Z',
              submission_data: {
                step5: { paymentDate: '25' },
              },
            },
            error: null,
          });
        }
        if (table === 'customer_services') {
          return Promise.resolve({
            data: {
              monthly_price: 450,
              activation_date: '2026-07-01',
            },
            error: null,
          });
        }
        return Promise.resolve({ data: null, error: null });
      }),
    };
    return builder;
  });
  return { supabase: { from } as any, updates };
}

describe('issueServiceOrderForCustomer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGenerateServiceOrderBlob.mockReturnValue(
      new Blob(['pdf-bytes'], { type: 'application/pdf' })
    );
    mockIssueToken.mockResolvedValue('sign-token');
    mockUploadFile.mockResolvedValue({
      success: true,
      path: 'service-orders/customer-1/SO-CT-2026-00042.pdf',
    } as any);
  });

  it('emails a signoff link and attaches the generated service order PDF', async () => {
    const send = jest.fn().mockResolvedValue({ error: null });
    mockResend.mockImplementation(() => ({ emails: { send } }));
    const { supabase } = createSupabaseMock();

    const result = await issueServiceOrderForCustomer(supabase, {
      customerId: 'customer-1',
      baseUrl: 'https://circletel.co.za',
      issuedBy: 'admin@example.co.za',
      sendEmail: true,
    });

    expect(result.signoffUrl).toBe('https://circletel.co.za/service-order/sign-token');
    expect(mockIssueToken).toHaveBeenCalledWith('customer-1', 'email', {
      purpose: 'service_order_signoff',
      onboardingSubmissionId: 'submission-1',
      metadata: expect.objectContaining({
        service_order_pdf_path: 'service-orders/customer-1/SO-CT-2026-00042.pdf',
        issued_by: 'admin@example.co.za',
      }),
    });
    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'client@example.co.za',
        html: expect.stringContaining('https://circletel.co.za/service-order/sign-token'),
        attachments: [
          expect.objectContaining({
            filename: 'SO-CT-2026-00042.pdf',
            content: expect.any(Buffer),
            contentType: 'application/pdf',
          }),
        ],
      })
    );
  });
});
