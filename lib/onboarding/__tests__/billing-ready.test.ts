/**
 * Tests for maybeMarkBillingReady
 * Verifies the new gate: vetting approved + active service + bank details (drop signature)
 */

import { maybeMarkBillingReady } from '../billing-ready';
import type { SupabaseClient } from '@supabase/supabase-js';

// Helper to build a chainable query mock
const chainable = (result: any) => ({
  eq: jest.fn().mockReturnValue(chainable(result)),
  order: jest.fn().mockReturnValue(chainable(result)),
  limit: jest.fn().mockReturnValue(chainable(result)),
  select: jest.fn().mockReturnValue(chainable(result)),
  maybeSingle: jest.fn().mockResolvedValue(result),
});

const selectChain = (result: any) => ({
  eq: jest.fn().mockReturnValue({
    eq: jest.fn().mockReturnValue({
      eq: jest.fn().mockResolvedValue(result),
      maybeSingle: jest.fn().mockResolvedValue(result),
    }),
    order: jest.fn().mockReturnValue({
      limit: jest.fn().mockReturnValue({
        maybeSingle: jest.fn().mockResolvedValue(result),
      }),
    }),
    maybeSingle: jest.fn().mockResolvedValue(result),
  }),
});

describe('maybeMarkBillingReady', () => {

  it('returns false when no onboarding submission found', async () => {
    const supabase = {
      from: jest.fn((table) => {
        if (table === 'onboarding_submissions') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                order: jest.fn().mockReturnValue({
                  limit: jest.fn().mockReturnValue({
                    maybeSingle: jest.fn().mockResolvedValue({
                      data: null,
                      error: null,
                    }),
                  }),
                }),
              }),
            }),
          };
        }
        return { select: jest.fn() };
      }),
    } as any as SupabaseClient;

    const result = await maybeMarkBillingReady(supabase, 'customer-123');
    expect(result).toBe(false);
  });

  it('returns false when vetting not approved', async () => {
    const supabase = {
      from: jest.fn((table) => {
        if (table === 'onboarding_submissions') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                order: jest.fn().mockReturnValue({
                  limit: jest.fn().mockReturnValue({
                    maybeSingle: jest.fn().mockResolvedValue({
                      data: { id: 'sub-1', document_vetting_status: 'pending' },
                      error: null,
                    }),
                  }),
                }),
              }),
            }),
          };
        }
        return { select: jest.fn() };
      }),
    } as any as SupabaseClient;

    const result = await maybeMarkBillingReady(supabase, 'customer-123');
    expect(result).toBe(false);
  });

  it('returns false when no active service', async () => {
    const supabase = {
      from: jest.fn((table) => {
        if (table === 'onboarding_submissions') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                order: jest.fn().mockReturnValue({
                  limit: jest.fn().mockReturnValue({
                    maybeSingle: jest.fn().mockResolvedValue({
                      data: { id: 'sub-1', document_vetting_status: 'approved' },
                      error: null,
                    }),
                  }),
                }),
              }),
            }),
          };
        }
        if (table === 'customer_services') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  maybeSingle: jest.fn().mockResolvedValue({
                    data: null,
                    error: null,
                  }),
                }),
              }),
            }),
          };
        }
        return { select: jest.fn() };
      }),
    } as any as SupabaseClient;

    const result = await maybeMarkBillingReady(supabase, 'customer-123');
    expect(result).toBe(false);
  });

  it('returns false when missing bank details (no account_number)', async () => {
    const supabase = {
      from: jest.fn((table) => {
        if (table === 'onboarding_submissions') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                order: jest.fn().mockReturnValue({
                  limit: jest.fn().mockReturnValue({
                    maybeSingle: jest.fn().mockResolvedValue({
                      data: { id: 'sub-1', document_vetting_status: 'approved' },
                      error: null,
                    }),
                  }),
                }),
              }),
            }),
          };
        }
        if (table === 'customer_services') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  maybeSingle: jest.fn().mockResolvedValue({
                    data: { id: 'svc-1', status: 'active' },
                    error: null,
                  }),
                }),
              }),
            }),
          };
        }
        if (table === 'customer_payment_methods') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest
                .fn()
                .mockReturnValue({
                  eq: jest
                    .fn()
                    .mockReturnValue({
                      eq: jest.fn().mockResolvedValue({
                        data: [
                          {
                            id: 'pm-1',
                            is_active: true,
                            method_type: 'debit_order',
                            encrypted_details: {
                              account_holder_name: 'Test Clinic',
                              account_type: 'Cheque',
                              branch_code: '250655',
                              // Missing account_number
                            },
                          },
                        ],
                        error: null,
                      }),
                    }),
                }),
            }),
          };
        }
        return { select: jest.fn() };
      }),
    } as any as SupabaseClient;

    const result = await maybeMarkBillingReady(supabase, 'customer-123');
    expect(result).toBe(false);
  });

  it('returns true when vetting approved + active service + bank details present', async () => {
    const supabase = {
      from: jest.fn((table) => {
        if (table === 'onboarding_submissions') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                order: jest.fn().mockReturnValue({
                  limit: jest.fn().mockReturnValue({
                    maybeSingle: jest.fn().mockResolvedValue({
                      data: { id: 'sub-1', document_vetting_status: 'approved' },
                      error: null,
                    }),
                  }),
                }),
              }),
            }),
          };
        }
        if (table === 'customer_services') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  maybeSingle: jest.fn().mockResolvedValue({
                    data: { id: 'svc-1', status: 'active' },
                    error: null,
                  }),
                }),
              }),
            }),
          };
        }
        if (table === 'customer_payment_methods') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest
                .fn()
                .mockReturnValue({
                  eq: jest
                    .fn()
                    .mockReturnValue({
                      eq: jest.fn().mockResolvedValue({
                        data: [
                          {
                            id: 'pm-1',
                            is_active: true,
                            method_type: 'debit_order',
                            encrypted_details: {
                              account_holder_name: 'Test Clinic',
                              account_type: 'Cheque',
                              account_number: '62836392449',
                              branch_code: '250655',
                            },
                          },
                        ],
                        error: null,
                      }),
                    }),
                }),
            }),
          };
        }
        if (table === 'customers') {
          return {
            update: jest
              .fn()
              .mockReturnValue({
                eq: jest.fn().mockResolvedValue({ error: null }),
              }),
          };
        }
        return { select: jest.fn() };
      }),
    } as any as SupabaseClient;

    const result = await maybeMarkBillingReady(supabase, 'customer-123');
    expect(result).toBe(true);
  });

  it('returns true even when mandate_status is pending (drops signature requirement)', async () => {
    const supabase = {
      from: jest.fn((table) => {
        if (table === 'onboarding_submissions') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                order: jest.fn().mockReturnValue({
                  limit: jest.fn().mockReturnValue({
                    maybeSingle: jest.fn().mockResolvedValue({
                      data: { id: 'sub-1', document_vetting_status: 'approved' },
                      error: null,
                    }),
                  }),
                }),
              }),
            }),
          };
        }
        if (table === 'customer_services') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  maybeSingle: jest.fn().mockResolvedValue({
                    data: { id: 'svc-1', status: 'active' },
                    error: null,
                  }),
                }),
              }),
            }),
          };
        }
        if (table === 'customer_payment_methods') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest
                .fn()
                .mockReturnValue({
                  eq: jest
                    .fn()
                    .mockReturnValue({
                      eq: jest.fn().mockResolvedValue({
                        data: [
                          {
                            id: 'pm-1',
                            is_active: true,
                            method_type: 'debit_order',
                            mandate_status: 'pending',
                            encrypted_details: {
                              account_holder_name: 'Test Clinic',
                              account_type: 'Cheque',
                              account_number: '62836392449',
                              branch_code: '250655',
                              verified: false,
                            },
                          },
                        ],
                        error: null,
                      }),
                    }),
                }),
            }),
          };
        }
        if (table === 'customers') {
          return {
            update: jest
              .fn()
              .mockReturnValue({
                eq: jest.fn().mockResolvedValue({ error: null }),
              }),
          };
        }
        return { select: jest.fn() };
      }),
    } as any as SupabaseClient;

    const result = await maybeMarkBillingReady(supabase, 'customer-123');
    expect(result).toBe(true);
  });

  it('returns false when missing branch_code in encrypted_details', async () => {
    const supabase = {
      from: jest.fn((table) => {
        if (table === 'onboarding_submissions') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                order: jest.fn().mockReturnValue({
                  limit: jest.fn().mockReturnValue({
                    maybeSingle: jest.fn().mockResolvedValue({
                      data: { id: 'sub-1', document_vetting_status: 'approved' },
                      error: null,
                    }),
                  }),
                }),
              }),
            }),
          };
        }
        if (table === 'customer_services') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  maybeSingle: jest.fn().mockResolvedValue({
                    data: { id: 'svc-1', status: 'active' },
                    error: null,
                  }),
                }),
              }),
            }),
          };
        }
        if (table === 'customer_payment_methods') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest
                .fn()
                .mockReturnValue({
                  eq: jest
                    .fn()
                    .mockReturnValue({
                      eq: jest.fn().mockResolvedValue({
                        data: [
                          {
                            id: 'pm-1',
                            is_active: true,
                            method_type: 'debit_order',
                            encrypted_details: {
                              account_holder_name: 'Test Clinic',
                              account_type: 'Cheque',
                              account_number: '62836392449',
                              // Missing branch_code
                            },
                          },
                        ],
                        error: null,
                      }),
                    }),
                }),
            }),
          };
        }
        return { select: jest.fn() };
      }),
    } as any as SupabaseClient;

    const result = await maybeMarkBillingReady(supabase, 'customer-123');
    expect(result).toBe(false);
  });
});
