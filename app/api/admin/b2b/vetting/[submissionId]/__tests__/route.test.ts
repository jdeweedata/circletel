import { NextRequest } from 'next/server';

import { GET } from '../route';
import { authenticateAdmin, requirePermission } from '@/lib/auth/admin-api-auth';
import { createClient } from '@/lib/supabase/server';
import { getOcrResultsByDocumentIds } from '@/lib/kyc/document-ocr';

jest.mock('@/lib/auth/admin-api-auth', () => ({
  authenticateAdmin: jest.fn(),
  requirePermission: jest.fn(),
}));

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}));

jest.mock('@/lib/kyc/document-ocr', () => ({
  getOcrResultsByDocumentIds: jest.fn(),
}));

jest.mock('@/lib/logging/logger', () => ({
  apiLogger: {
    error: jest.fn(),
    info: jest.fn(),
  },
}));

const mockAuthenticateAdmin = authenticateAdmin as jest.MockedFunction<typeof authenticateAdmin>;
const mockRequirePermission = requirePermission as jest.MockedFunction<typeof requirePermission>;
const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>;
const mockGetOcrResultsByDocumentIds =
  getOcrResultsByDocumentIds as jest.MockedFunction<typeof getOcrResultsByDocumentIds>;

function request() {
  return new Request('http://localhost/api/admin/b2b/vetting/submission-1') as NextRequest;
}

describe('GET /api/admin/b2b/vetting/[submissionId]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthenticateAdmin.mockResolvedValue({
      success: true,
      adminUser: { id: 'admin-1', email: 'admin@circletel.co.za' } as any,
      user: { id: 'admin-1' } as any,
    });
    mockRequirePermission.mockReturnValue(null);
  });

  it('attaches OCR summaries to returned documents', async () => {
    const submissionBuilder = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: {
          id: 'submission-1',
          customer_id: 'customer-1',
          segment: 'unjani',
          status: 'submitted',
          document_vetting_status: 'documents_pending',
          submission_data: { step3: { accHolder: 'Clinic Pty Ltd' } },
          admin_reviewed_at: null,
          admin_reviewed_by: null,
          admin_notes: null,
          rejection_reason: null,
          submitted_at: '2026-07-05T08:00:00.000Z',
          customers: {
            id: 'customer-1',
            account_number: 'CT-1',
            business_name: 'Clinic Pty Ltd',
            email: 'clinic@example.com',
            phone: '0730000000',
            clinic_details: {},
          },
        },
        error: null,
      }),
    };
    const documentsBuilder = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({
        data: [
          {
            id: 'doc-1',
            document_type: 'company_registration',
            file_path: 'onboarding/customer-1/company_registration/a.pdf',
            verification_status: 'pending',
            rejection_reason: null,
            verified_at: null,
            uploaded_at: '2026-07-05T08:00:00.000Z',
          },
        ],
        error: null,
      }),
    };
    const paymentMethodsBuilder = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
    };
    paymentMethodsBuilder.eq
      .mockReturnValueOnce(paymentMethodsBuilder)
      .mockResolvedValueOnce({ data: [], error: null });

    const supabase = {
      from: jest
        .fn()
        .mockReturnValueOnce(submissionBuilder)
        .mockReturnValueOnce(documentsBuilder)
        .mockReturnValueOnce(paymentMethodsBuilder),
    };

    mockCreateClient.mockResolvedValue(supabase as any);
    mockGetOcrResultsByDocumentIds.mockResolvedValue(
      new Map([
        [
          'doc-1',
          {
            status: 'succeeded',
            model: 'mistral-ocr-4-0',
            markdown: 'Registration text',
            markdownExcerpt: 'Registration text',
            pages: [],
            blocks: [],
            confidence: null,
            usageInfo: { pagesProcessed: 1 },
            errorMessage: null,
            processedAt: '2026-07-05T08:01:00.000Z',
          },
        ],
      ])
    );

    const response = await GET(request(), {
      params: Promise.resolve({ submissionId: 'submission-1' }),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(documentsBuilder.order).toHaveBeenCalledWith('uploaded_at', {
      ascending: false,
    });
    expect(mockGetOcrResultsByDocumentIds).toHaveBeenCalledWith(supabase, ['doc-1']);
    expect(body.submission.documents[0].ocr).toMatchObject({
      status: 'succeeded',
      markdownExcerpt: 'Registration text',
      usageInfo: { pagesProcessed: 1 },
    });
  });
});
