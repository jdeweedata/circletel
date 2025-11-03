/**
 * API Tests: Contract Endpoints
 * Task Group 8: API Layer - Contract Endpoints
 *
 * Tests for:
 * - POST /api/contracts/create-from-quote
 * - GET /api/contracts/[id]
 * - GET /api/contracts/[id]/download-pdf
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client for testing
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const TEST_API_BASE = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

// Test data IDs (will be created in setup)
let testQuoteId: string;
let testKycSessionId: string;
let testContractId: string;
let testCustomerId: string;

describe('Contract API Endpoints', () => {
  // ============================================================================
  // Setup & Teardown
  // ============================================================================

  beforeAll(async () => {
    // Create test customer
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .insert({
        first_name: 'Test',
        last_name: 'Customer',
        email: `test-contract-${Date.now()}@example.com`,
        phone: '+27821234567',
      })
      .select()
      .single();

    if (customerError || !customer) {
      throw new Error('Failed to create test customer');
    }
    testCustomerId = customer.id;

    // Create test business quote
    const { data: quote, error: quoteError } = await supabase
      .from('business_quotes')
      .insert({
        customer_id: testCustomerId,
        company_name: 'Test Company',
        contact_person: 'Test Customer',
        email: customer.email,
        phone: customer.phone,
        service_address: '123 Test St, Test City',
        billing_address: '123 Test St, Test City',
        contract_term: 24,
        monthly_recurring: 1500.0,
        installation_fee: 0,
        once_off_fee: 0,
        total_amount: 36000.0,
        contract_type: 'fibre',
        status: 'approved',
      })
      .select()
      .single();

    if (quoteError || !quote) {
      throw new Error('Failed to create test quote');
    }
    testQuoteId = quote.id;

    // Create test KYC session (approved)
    const { data: kycSession, error: kycError } = await supabase
      .from('kyc_sessions')
      .insert({
        quote_id: testQuoteId,
        didit_session_id: `test-session-${Date.now()}`,
        flow_type: 'sme_light',
        user_type: 'business',
        status: 'completed',
        verification_result: 'approved',
        risk_tier: 'low',
        completed_at: new Date().toISOString(),
        extracted_data: {
          id_number: '8001015009087',
          company_reg: 'CK2022/123456/23',
          liveness_score: 0.95,
        },
      })
      .select()
      .single();

    if (kycError || !kycSession) {
      throw new Error('Failed to create test KYC session');
    }
    testKycSessionId = kycSession.id;
  });

  afterAll(async () => {
    // Cleanup test data
    if (testContractId) {
      await supabase.from('contracts').delete().eq('id', testContractId);
    }
    if (testKycSessionId) {
      await supabase.from('kyc_sessions').delete().eq('id', testKycSessionId);
    }
    if (testQuoteId) {
      await supabase.from('business_quotes').delete().eq('id', testQuoteId);
    }
    if (testCustomerId) {
      await supabase.from('customers').delete().eq('id', testCustomerId);
    }
  });

  // ============================================================================
  // Test 1: Contract Creation Validation - Missing Fields
  // ============================================================================

  it('should reject contract creation with missing quoteId', async () => {
    const response = await fetch(`${TEST_API_BASE}/api/contracts/create-from-quote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        kycSessionId: testKycSessionId,
      }),
    });

    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toContain('required');
  });

  // ============================================================================
  // Test 2: Contract Creation Validation - KYC Not Approved
  // ============================================================================

  it('should reject contract creation when KYC is not approved', async () => {
    // Create a KYC session with 'pending_review' status
    const { data: pendingKyc } = await supabase
      .from('kyc_sessions')
      .insert({
        quote_id: testQuoteId,
        didit_session_id: `pending-session-${Date.now()}`,
        flow_type: 'sme_light',
        user_type: 'business',
        status: 'completed',
        verification_result: 'pending_review',
        risk_tier: 'medium',
      })
      .select()
      .single();

    const response = await fetch(`${TEST_API_BASE}/api/contracts/create-from-quote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        quoteId: testQuoteId,
        kycSessionId: pendingKyc!.id,
      }),
    });

    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toContain('not approved');

    // Cleanup
    await supabase.from('kyc_sessions').delete().eq('id', pendingKyc!.id);
  });

  // ============================================================================
  // Test 3: Successful Contract Creation
  // ============================================================================

  it('should successfully create contract from approved KYC', async () => {
    const response = await fetch(`${TEST_API_BASE}/api/contracts/create-from-quote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        quoteId: testQuoteId,
        kycSessionId: testKycSessionId,
      }),
    });

    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toHaveProperty('contractId');
    expect(data.data).toHaveProperty('contractNumber');
    expect(data.data.contractNumber).toMatch(/^CT-\d{4}-\d{3}$/);
    expect(data.data).toHaveProperty('pdfUrl');
    expect(data.data.status).toBe('draft');

    // Store for subsequent tests
    testContractId = data.data.contractId;
  });

  // ============================================================================
  // Test 4: PDF Download - Success
  // ============================================================================

  it('should successfully download contract PDF', async () => {
    // Wait for contract creation from previous test
    expect(testContractId).toBeDefined();

    const response = await fetch(
      `${TEST_API_BASE}/api/contracts/${testContractId}/download-pdf`
    );

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('application/pdf');
    expect(response.headers.get('Content-Disposition')).toContain('attachment');
    expect(response.headers.get('Content-Disposition')).toContain('.pdf');

    const buffer = await response.arrayBuffer();
    expect(buffer.byteLength).toBeGreaterThan(0);
  });

  // ============================================================================
  // Test 5: RLS Policy - Unauthorized Access
  // ============================================================================

  it('should enforce RLS policies for contract access', async () => {
    // Create another customer (not the owner)
    const { data: otherCustomer } = await supabase
      .from('customers')
      .insert({
        first_name: 'Other',
        last_name: 'Customer',
        email: `other-${Date.now()}@example.com`,
        phone: '+27829999999',
      })
      .select()
      .single();

    // Try to access contract as different customer (simulate with anon client)
    const anonSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data: contract, error } = await anonSupabase
      .from('contracts')
      .select('*')
      .eq('id', testContractId)
      .single();

    // Should not have access via RLS
    expect(error).toBeTruthy();
    expect(contract).toBeNull();

    // Cleanup
    if (otherCustomer) {
      await supabase.from('customers').delete().eq('id', otherCustomer.id);
    }
  });
});
