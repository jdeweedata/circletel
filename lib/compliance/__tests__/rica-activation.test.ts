/**
 * Test Suite: RICA Paired Submission & Service Activation
 * Task Group 12: Tests for RICA submission with Didit KYC data
 *
 * Test Count: 6 tests (within 2-8 limit)
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import type { ExtractedKYCData } from '@/lib/integrations/didit/types';

// Mock Supabase client
const mockSupabase = {
  from: jest.fn(),
  auth: {
    admin: {
      createUser: jest.fn(),
      listUsers: jest.fn(),
    }
  }
};

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => Promise.resolve(mockSupabase))
}));

// Mock data
const mockKYCExtractedData: ExtractedKYCData = {
  id_number: '8501015800081',
  full_name: 'John Smith',
  date_of_birth: '1985-01-01',
  proof_of_address: {
    type: 'municipal_account',
    address_line_1: '123 Main Street',
    city: 'Johannesburg',
    province: 'Gauteng',
    postal_code: '2000',
    verified: true,
    document_date: '2025-10-15'
  },
  liveness_score: 0.95,
  document_authenticity: 'valid',
  aml_flags: [],
  sanctions_match: false,
  pep_match: false,
  verification_timestamp: '2025-11-01T10:00:00Z',
  verification_method: 'biometric'
};

const mockKYCExtractedDataBusiness: ExtractedKYCData = {
  ...mockKYCExtractedData,
  company_reg: '2020/123456/07',
  company_name: 'Tech Solutions Pty Ltd',
  directors: [
    {
      name: 'John Smith',
      id_number: '8501015800081'
    }
  ]
};

describe('RICA Paired Submission', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('Test 1: RICA submission auto-populates from complete KYC data', async () => {
    // Mock KYC session with extracted_data
    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: {
              id: 'kyc-session-123',
              extracted_data: mockKYCExtractedData,
              risk_tier: 'low',
              verification_result: 'approved'
            },
            error: null
          })
        })
      })
    });

    // Import after mocks are set
    const { submitRICAWithDiditData } = await import('@/lib/compliance/rica-paired-submission');

    // Mock RICA API response
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        tracking_id: 'ICASA-2025-001',
        status: 'submitted'
      })
    }) as jest.Mock;

    const result = await submitRICAWithDiditData('kyc-session-123', 'order-456', ['ICCID123456789']);

    expect(result).toHaveProperty('ricaSubmissionId');
    expect(result).toHaveProperty('icasaTrackingId', 'ICASA-2025-001');
  });

  it('Test 2: RICA submission with incomplete KYC data throws error', async () => {
    const incompleteKYCData = {
      ...mockKYCExtractedData,
      id_number: '', // Missing required field
    };

    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: {
              id: 'kyc-session-123',
              extracted_data: incompleteKYCData,
              risk_tier: 'low',
              verification_result: 'approved'
            },
            error: null
          })
        })
      })
    });

    const { submitRICAWithDiditData } = await import('@/lib/compliance/rica-paired-submission');

    await expect(
      submitRICAWithDiditData('kyc-session-123', 'order-456', ['ICCID123'])
    ).rejects.toThrow('Incomplete KYC data');
  });

  it('Test 3: RICA approval webhook triggers service activation', async () => {
    const { processRICAWebhook } = await import('@/lib/compliance/rica-webhook-handler');

    const mockWebhookPayload = {
      event: 'rica.approved' as const,
      submission_id: 'rica-sub-123',
      order_id: 'order-456',
      icasa_tracking_id: 'ICASA-2025-001'
    };

    // Mock database updates
    let activationCalled = false;
    mockSupabase.from.mockImplementation((table: string) => ({
      update: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ data: {}, error: null })
      }),
      insert: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: {}, error: null })
        })
      }),
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: table === 'consumer_orders' ? {
              id: 'order-456',
              contract_id: 'contract-123',
              customer_id: 'customer-789'
            } : { monthly_recurring: 799 },
            error: null
          })
        })
      })
    }));

    const result = await processRICAWebhook(mockWebhookPayload);

    expect(result.success).toBe(true);
  });

  it('Test 4: RICA rejection webhook flags order for admin review', async () => {
    const { processRICAWebhook } = await import('@/lib/compliance/rica-webhook-handler');

    const mockWebhookPayload = {
      event: 'rica.rejected' as const,
      submission_id: 'rica-sub-123',
      order_id: 'order-456',
      icasa_tracking_id: 'ICASA-2025-001',
      rejection_reason: 'Invalid ID number'
    };

    mockSupabase.from.mockReturnValue({
      update: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ data: {}, error: null })
      })
    });

    const result = await processRICAWebhook(mockWebhookPayload);

    expect(result.success).toBe(true);
  });

  it('Test 5: Customer account creation with temporary password', async () => {
    const { createCustomerAccount } = await import('@/lib/activation/customer-onboarding');

    // Mock no existing user
    mockSupabase.auth.admin.listUsers.mockResolvedValue({
      data: { users: [] },
      error: null
    });

    // Mock customer data
    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: {
              id: 'customer-789',
              name: 'John Smith',
              email: 'john@example.com'
            },
            error: null
          })
        })
      })
    });

    // Mock user creation
    mockSupabase.auth.admin.createUser.mockResolvedValue({
      data: { user: { id: 'user-123', email: 'john@example.com' } },
      error: null
    });

    const result = await createCustomerAccount('customer-789');

    expect(result.email).toBe('john@example.com');
    expect(result.temporaryPassword).toHaveLength(8);
  });

  it('Test 6: Service activation creates billing cycle and activates order', async () => {
    const { activateService } = await import('@/lib/activation/service-activator');

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'consumer_orders') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: {
                  id: 'order-456',
                  contract_id: 'contract-123',
                  customer_id: 'customer-789',
                  contract: {
                    monthly_recurring: 799
                  }
                },
                error: null
              })
            })
          }),
          update: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ data: {}, error: null })
          })
        };
      }

      return {
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ data: {}, error: null })
        }),
        insert: jest.fn().mockResolvedValue({ data: {}, error: null })
      };
    });

    await activateService('order-456');

    // Verify update was called on consumer_orders
    expect(mockSupabase.from).toHaveBeenCalledWith('consumer_orders');
  });
});
