import { NextRequest } from 'next/server';

import { POST } from '../upload-document/route';
import { authenticateAdmin, requirePermission } from '@/lib/auth/admin-api-auth';
import { svc } from '@/lib/onboarding/onboarding-service';
import { uploadFile } from '@/lib/storage/supabase-upload';

jest.mock('@/lib/auth/admin-api-auth', () => ({
  authenticateAdmin: jest.fn(),
  requirePermission: jest.fn(),
}));

jest.mock('@/lib/onboarding/onboarding-service', () => ({
  svc: jest.fn(),
}));

jest.mock('@/lib/storage/supabase-upload', () => ({
  uploadFile: jest.fn(),
}));

jest.mock('@/lib/logging/logger', () => ({
  apiLogger: {
    error: jest.fn(),
    info: jest.fn(),
  },
}));

const mockAuthenticateAdmin = authenticateAdmin as jest.MockedFunction<typeof authenticateAdmin>;
const mockRequirePermission = requirePermission as jest.MockedFunction<typeof requirePermission>;
const mockSvc = svc as jest.MockedFunction<typeof svc>;
const mockUploadFile = uploadFile as jest.MockedFunction<typeof uploadFile>;

function formRequest(form: FormData) {
  return new Request('http://localhost/api/admin/b2b/upload-document', {
    method: 'POST',
    body: form,
  }) as NextRequest;
}

function createSupabaseMock() {
  const operations: Array<{ table: string; action: string; payload?: unknown }> = [];

  const from = jest.fn((table: string) => {
    let action = 'select';
    let payload: unknown;

    const builder: any = {
      select: jest.fn(() => builder),
      eq: jest.fn(() => builder),
      order: jest.fn(() => builder),
      limit: jest.fn(() => builder),
      neq: jest.fn(() => Promise.resolve({ error: null })),
      insert: jest.fn((nextPayload) => {
        action = 'insert';
        payload = nextPayload;
        operations.push({ table, action, payload });
        return builder;
      }),
      update: jest.fn((nextPayload) => {
        action = 'update';
        payload = nextPayload;
        operations.push({ table, action, payload });
        return builder;
      }),
      maybeSingle: jest.fn(() => Promise.resolve({ data: null, error: null })),
      single: jest.fn(() => {
        if (table === 'customers' && action === 'select') {
          return Promise.resolve({
            data: {
              business_name: 'Future Business Client',
              email: 'ops@example.co.za',
              phone: '0821234567',
              onboarding_status: 'pending',
            },
            error: null,
          });
        }
        if (table === 'onboarding_submissions') {
          return Promise.resolve({ data: { id: 'submission-1' }, error: null });
        }
        if (table === 'kyc_documents') {
          return Promise.resolve({ data: { id: 'document-1' }, error: null });
        }
        return Promise.resolve({ data: null, error: null });
      }),
    };
    return builder;
  });

  return { supabase: { from } as any, operations };
}

describe('POST /api/admin/b2b/upload-document', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthenticateAdmin.mockResolvedValue({
      success: true,
      user: { id: 'user-1', email: 'admin@circletel.co.za' } as any,
      adminUser: {
        id: 'admin-1',
        email: 'admin@circletel.co.za',
        role: 'admin',
      } as any,
    });
    mockRequirePermission.mockReturnValue(null);
    mockUploadFile.mockResolvedValue({
      success: true,
      path: 'onboarding/customer-1/company_registration/doc.pdf',
      url: 'signed-url',
    } as any);
  });

  it('stores email provenance and selected segment on admin-uploaded documents', async () => {
    const { supabase, operations } = createSupabaseMock();
    mockSvc.mockReturnValue(supabase);

    const form = new FormData();
    form.append('customerId', 'customer-1');
    form.append('documentType', 'company_registration');
    form.append('segment', 'enterprise');
    form.append('emailFrom', 'client@example.co.za');
    form.append('emailSubject', 'Onboarding documents');
    form.append('emailReceivedAt', '2026-06-30T09:00');
    form.append(
      'file',
      new File(['test'], 'doc.pdf', { type: 'application/pdf' })
    );

    const response = await POST(formRequest(form));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);

    const shellInsert = operations.find(
      (op) => op.table === 'onboarding_submissions' && op.action === 'insert'
    );
    expect(shellInsert?.payload).toEqual(
      expect.objectContaining({
        segment: 'enterprise',
        submission_data: expect.objectContaining({
          source: 'admin_email',
          email_provenance: {
            from: 'client@example.co.za',
            subject: 'Onboarding documents',
            received_at: '2026-06-30T09:00',
          },
        }),
      })
    );

    const documentInsert = operations.find(
      (op) => op.table === 'kyc_documents' && op.action === 'insert'
    );
    expect(documentInsert?.payload).toEqual(
      expect.objectContaining({
        metadata: expect.objectContaining({
          source: 'admin_email',
          segment: 'enterprise',
          email_provenance: {
            from: 'client@example.co.za',
            subject: 'Onboarding documents',
            received_at: '2026-06-30T09:00',
          },
        }),
      })
    );
  });
});
