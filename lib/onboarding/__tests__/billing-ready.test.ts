/**
 * Tests for maybeMarkBillingReady
 * Verifies the full onboarding gate:
 * docs approved + service order issued + active service + collectible debit order.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { maybeMarkBillingReady } from '../billing-ready';

function queryResult(result: { data: unknown; error: unknown }) {
  const chain: Record<string, jest.Mock> & PromiseLike<typeof result> = {
    select: jest.fn(() => chain),
    eq: jest.fn(() => chain),
    order: jest.fn(() => chain),
    limit: jest.fn(() => chain),
    maybeSingle: jest.fn().mockResolvedValue(result),
    then: jest.fn((resolve, reject) => Promise.resolve(result).then(resolve, reject)),
  };
  return chain;
}

function updateResult(result: { error: unknown }) {
  return {
    eq: jest.fn().mockResolvedValue(result),
  };
}

function supabaseMock(input: {
  submission?: Record<string, unknown> | null;
  service?: Record<string, unknown> | null;
  paymentMethods?: Array<Record<string, unknown>>;
  updateError?: unknown;
}) {
  return {
    from: jest.fn((table: string) => {
      if (table === 'onboarding_submissions') {
        return queryResult({ data: input.submission ?? null, error: null });
      }
      if (table === 'customer_services') {
        return queryResult({ data: input.service ?? null, error: null });
      }
      if (table === 'customer_payment_methods') {
        return queryResult({ data: input.paymentMethods ?? [], error: null });
      }
      if (table === 'customers') {
        return {
          update: jest.fn(() => updateResult({ error: input.updateError ?? null })),
        };
      }
      return queryResult({ data: null, error: null });
    }),
  } as unknown as SupabaseClient;
}

const approvedSubmission = {
  id: 'sub-1',
  document_vetting_status: 'approved',
  service_order_issued_at: '2026-06-24T08:00:00+02:00',
};

const activeService = {
  id: 'svc-1',
  status: 'active',
};

const collectibleDebitOrder = {
  id: 'pm-1',
  method_type: 'debit_order',
  is_active: true,
  mandate_status: 'active',
  encrypted_details: {
    account_holder_name: 'Test Clinic',
    account_type: 'Cheque',
    account_number: '62836392449',
    branch_code: '250655',
    verified: true,
  },
};

describe('maybeMarkBillingReady', () => {
  it('returns false when no onboarding submission exists', async () => {
    const result = await maybeMarkBillingReady(
      supabaseMock({
        submission: null,
      }),
      'customer-123'
    );

    expect(result).toBe(false);
  });

  it('returns false when vetting is not approved', async () => {
    const result = await maybeMarkBillingReady(
      supabaseMock({
        submission: {
          ...approvedSubmission,
          document_vetting_status: 'under_review',
        },
      }),
      'customer-123'
    );

    expect(result).toBe(false);
  });

  it('returns false when service order has not been issued', async () => {
    const result = await maybeMarkBillingReady(
      supabaseMock({
        submission: {
          ...approvedSubmission,
          service_order_issued_at: null,
        },
        service: activeService,
        paymentMethods: [collectibleDebitOrder],
      }),
      'customer-123'
    );

    expect(result).toBe(false);
  });

  it('returns false when there is no active service', async () => {
    const result = await maybeMarkBillingReady(
      supabaseMock({
        submission: approvedSubmission,
        service: null,
        paymentMethods: [collectibleDebitOrder],
      }),
      'customer-123'
    );

    expect(result).toBe(false);
  });

  it.each([
    ['pending mandate', { mandate_status: 'pending', encrypted_details: { ...collectibleDebitOrder.encrypted_details, verified: true } }],
    ['unverified mandate', { mandate_status: 'active', encrypted_details: { ...collectibleDebitOrder.encrypted_details, verified: false } }],
    ['missing bank account', { mandate_status: 'active', encrypted_details: { ...collectibleDebitOrder.encrypted_details, account_number: undefined } }],
    ['missing branch code', { mandate_status: 'active', encrypted_details: { ...collectibleDebitOrder.encrypted_details, branch_code: undefined } }],
  ])('returns false for %s', async (_label, override) => {
    const result = await maybeMarkBillingReady(
      supabaseMock({
        submission: approvedSubmission,
        service: activeService,
        paymentMethods: [
          {
            ...collectibleDebitOrder,
            ...override,
          },
        ],
      }),
      'customer-123'
    );

    expect(result).toBe(false);
  });

  it('marks billing_ready when the full onboarding gate is satisfied', async () => {
    const supabase = supabaseMock({
      submission: approvedSubmission,
      service: activeService,
      paymentMethods: [collectibleDebitOrder],
    });

    const result = await maybeMarkBillingReady(supabase, 'customer-123');

    expect(result).toBe(true);
    const customersQuery = (supabase.from as jest.Mock).mock.results.find(
      (call) => call.value?.update
    )?.value;
    expect(customersQuery.update).toHaveBeenCalledWith(
      expect.objectContaining({
        onboarding_status: 'billing_ready',
        onboarding_completed_at: expect.any(String),
      })
    );
  });
});
