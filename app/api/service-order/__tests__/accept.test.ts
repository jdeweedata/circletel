import { NextRequest } from 'next/server';

import { POST } from '../accept/route';
import { resolveTokenForPurpose, svc } from '@/lib/onboarding/onboarding-service';
import { issueServiceOrderForCustomer } from '@/lib/onboarding/service-order-issuer';
import { maybeMarkBillingReady } from '@/lib/onboarding/billing-ready';

jest.mock('@/lib/onboarding/onboarding-service', () => ({
  resolveTokenForPurpose: jest.fn(),
  svc: jest.fn(),
}));

jest.mock('@/lib/onboarding/service-order-issuer', () => {
  const actual = jest.requireActual('@/lib/onboarding/service-order-issuer');
  return {
    ...actual,
    issueServiceOrderForCustomer: jest.fn(),
  };
});

jest.mock('@/lib/onboarding/billing-ready', () => ({
  maybeMarkBillingReady: jest.fn(),
}));

const mockResolveTokenForPurpose = resolveTokenForPurpose as jest.MockedFunction<typeof resolveTokenForPurpose>;
const mockSvc = svc as jest.MockedFunction<typeof svc>;
const mockIssueServiceOrderForCustomer = issueServiceOrderForCustomer as jest.MockedFunction<typeof issueServiceOrderForCustomer>;
const mockMaybeMarkBillingReady = maybeMarkBillingReady as jest.MockedFunction<typeof maybeMarkBillingReady>;

function request(body: Record<string, unknown>) {
  return new Request('http://localhost/api/service-order/accept', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-forwarded-for': '196.1.2.3',
      'user-agent': 'Jest Browser',
    },
    body: JSON.stringify(body),
  }) as NextRequest;
}

function createSupabaseMock() {
  const updates: Array<{ table: string; payload: unknown }> = [];
  const from = jest.fn((table: string) => {
    const builder: any = {
      select: jest.fn(() => builder),
      eq: jest.fn(() => builder),
      update: jest.fn((payload) => {
        updates.push({ table, payload });
        return builder;
      }),
      single: jest.fn(() => {
        if (table === 'onboarding_submissions') {
          return Promise.resolve({
            data: {
              id: 'submission-1',
              customer_id: 'customer-1',
              segment: 'enterprise',
              submission_data: { step5: { paymentDate: '25' } },
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

describe('POST /api/service-order/accept', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockResolveTokenForPurpose.mockResolvedValue({
      customerId: 'customer-1',
      tokenId: 'token-1',
      purpose: 'service_order_signoff',
      onboardingSubmissionId: 'submission-1',
      metadata: {},
    });
    mockIssueServiceOrderForCustomer.mockResolvedValue({
      pdfPath: 'service-orders/customer-1/SO.pdf',
      pdfSha256: 'hash',
      submissionId: 'submission-1',
      emailed: false,
    });
    mockMaybeMarkBillingReady.mockResolvedValue(false);
  });

  it('records service-order acceptance, consumes the token, and regenerates the accepted PDF', async () => {
    const { supabase, updates } = createSupabaseMock();
    mockSvc.mockReturnValue(supabase);

    const response = await POST(request({ token: 'plain-token' }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      success: true,
      pdfPath: 'service-orders/customer-1/SO.pdf',
      billingReady: false,
    });
    expect(mockResolveTokenForPurpose).toHaveBeenCalledWith('plain-token', 'service_order_signoff');

    const submissionUpdate = updates.find((update) => update.table === 'onboarding_submissions');
    expect(submissionUpdate?.payload).toEqual(
      expect.objectContaining({
        submission_data: expect.objectContaining({
          service_order_status: 'accepted',
          service_order_acceptance: expect.objectContaining({
            ip: '196.1.2.3',
            user_agent: 'Jest Browser',
            token_id: 'token-1',
            terms_version: expect.any(String),
            terms_hash: expect.any(String),
            terms_snapshot: expect.any(Array),
          }),
        }),
      })
    );
    expect(updates).toContainEqual({
      table: 'onboarding_tokens',
      payload: expect.objectContaining({ used_at: expect.any(String) }),
    });
    expect(mockIssueServiceOrderForCustomer).toHaveBeenCalledWith(supabase, {
      customerId: 'customer-1',
      issuedBy: 'customer_signoff',
      sendEmail: false,
    });
    expect(mockMaybeMarkBillingReady).toHaveBeenCalledWith(supabase, 'customer-1');
  });
});
