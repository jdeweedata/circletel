import { createClient } from '@supabase/supabase-js';
import { hashToken } from '../token-service';
import { issueToken, resolveTokenForPurpose } from '../onboarding-service';

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(),
}));

const mockedCreateClient = createClient as jest.Mock;

describe('onboarding token purpose handling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-key';
  });

  it('stores service-order signoff token purpose and metadata when issuing a token', async () => {
    const insert = jest.fn().mockResolvedValue({ error: null });
    mockedCreateClient.mockReturnValue({
      from: jest.fn().mockReturnValue({ insert }),
    });

    const token = await issueToken('customer-1', 'email', {
      purpose: 'service_order_signoff',
      onboardingSubmissionId: 'submission-1',
      metadata: { issued_by: 'admin-1' },
    });

    expect(token).toEqual(expect.any(String));
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        customer_id: 'customer-1',
        token_hash: hashToken(token),
        sent_via: 'email',
        purpose: 'service_order_signoff',
        onboarding_submission_id: 'submission-1',
        metadata: { issued_by: 'admin-1' },
      })
    );
  });

  it('resolves only matching-purpose active tokens', async () => {
    const maybeSingle = jest.fn().mockResolvedValue({
      data: {
        id: 'token-1',
        customer_id: 'customer-1',
        onboarding_submission_id: 'submission-1',
        purpose: 'service_order_signoff',
        metadata: { service_order_pdf_path: 'service-orders/order.pdf' },
        expires_at: new Date(Date.now() + 60_000).toISOString(),
        used_at: null,
      },
      error: null,
    });
    const eq = jest.fn().mockReturnValue({ maybeSingle });
    mockedCreateClient.mockReturnValue({
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({ eq }),
      }),
    });

    const result = await resolveTokenForPurpose('plain-token', 'service_order_signoff');

    expect(eq).toHaveBeenCalledWith('token_hash', hashToken('plain-token'));
    expect(result).toEqual({
      customerId: 'customer-1',
      tokenId: 'token-1',
      purpose: 'service_order_signoff',
      onboardingSubmissionId: 'submission-1',
      metadata: { service_order_pdf_path: 'service-orders/order.pdf' },
    });
  });

  it('returns null when the token purpose does not match the requested purpose', async () => {
    const maybeSingle = jest.fn().mockResolvedValue({
      data: {
        id: 'token-1',
        customer_id: 'customer-1',
        onboarding_submission_id: null,
        purpose: 'onboarding',
        metadata: {},
        expires_at: new Date(Date.now() + 60_000).toISOString(),
        used_at: null,
      },
      error: null,
    });
    mockedCreateClient.mockReturnValue({
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({ maybeSingle }),
        }),
      }),
    });

    const result = await resolveTokenForPurpose('plain-token', 'service_order_signoff');

    expect(result).toBeNull();
  });
});
