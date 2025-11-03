/**
 * Task Group 3: KYC API Routes Tests
 *
 * Focused tests for 4 KYC API endpoints:
 * - POST /api/compliance/create-kyc-session
 * - POST /api/compliance/webhook/didit
 * - GET /api/compliance/[quoteId]/status
 * - POST /api/compliance/retry-kyc
 *
 * Test Count: 8 tests (2 per endpoint)
 */

import { describe, it, expect, beforeAll } from '@jest/globals';
import { createClient } from '@/lib/supabase/server';
import crypto from 'crypto';

// Test data
const TEST_QUOTE_ID = 'test-quote-kyc-api-001';
const INVALID_QUOTE_ID = 'invalid-quote-xyz';
const TEST_SESSION_ID = 'didit_test_session_001';

/**
 * Test 1: POST /api/compliance/create-kyc-session - Valid Quote ID
 *
 * Verifies that a KYC session can be created for a valid quote
 * Expected: 200 status, returns sessionId and verificationUrl
 */
describe('POST /api/compliance/create-kyc-session', () => {
  it('creates KYC session for valid quote', async () => {
    const response = await fetch('http://localhost:3006/api/compliance/create-kyc-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quoteId: TEST_QUOTE_ID }),
    });

    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toHaveProperty('sessionId');
    expect(data.data).toHaveProperty('verificationUrl');
    expect(data.data).toHaveProperty('flowType');
    expect(['sme_light', 'consumer_light', 'full_kyc']).toContain(data.data.flowType);
  });

  /**
   * Test 2: POST /api/compliance/create-kyc-session - Invalid Quote ID
   *
   * Verifies that invalid quote IDs are rejected with 404
   */
  it('returns 404 for invalid quote ID', async () => {
    const response = await fetch('http://localhost:3006/api/compliance/create-kyc-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quoteId: INVALID_QUOTE_ID }),
    });

    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.success).toBe(false);
    expect(data.error).toContain('Quote not found');
  });
});

/**
 * Test 3: POST /api/compliance/webhook/didit - Valid Signature
 *
 * Verifies webhook signature verification and processing
 */
describe('POST /api/compliance/webhook/didit', () => {
  it('processes webhook with valid signature', async () => {
    const webhookPayload = {
      event: 'verification.completed',
      sessionId: TEST_SESSION_ID,
      timestamp: new Date().toISOString(),
      result: {
        status: 'approved',
        risk_score: 85,
      },
      data: {
        id_number: '8001015009087',
        full_name: 'Test User',
        date_of_birth: '1980-01-01',
        proof_of_address: {
          type: 'utility_bill',
          address_line_1: '123 Test St',
          city: 'Johannesburg',
          province: 'Gauteng',
          postal_code: '2001',
          verified: true,
        },
        liveness_score: 0.9,
        document_authenticity: 'valid',
        aml_flags: [],
        sanctions_match: false,
        pep_match: false,
        verification_timestamp: new Date().toISOString(),
        verification_method: 'biometric',
      },
    };

    const payloadString = JSON.stringify(webhookPayload);
    const signature = crypto
      .createHmac('sha256', process.env.DIDIT_WEBHOOK_SECRET || 'test-secret')
      .update(payloadString)
      .digest('hex');

    const response = await fetch('http://localhost:3006/api/compliance/webhook/didit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Didit-Signature': signature,
      },
      body: payloadString,
    });

    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });

  /**
   * Test 4: POST /api/compliance/webhook/didit - Invalid Signature
   *
   * Verifies that invalid signatures are rejected with 401
   */
  it('rejects webhook with invalid signature', async () => {
    const webhookPayload = {
      event: 'verification.completed',
      sessionId: TEST_SESSION_ID,
      timestamp: new Date().toISOString(),
    };

    const response = await fetch('http://localhost:3006/api/compliance/webhook/didit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Didit-Signature': 'invalid-signature-123',
      },
      body: JSON.stringify(webhookPayload),
    });

    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
    expect(data.error).toContain('Invalid webhook signature');
  });
});

/**
 * Test 5: GET /api/compliance/[quoteId]/status - Valid Quote
 *
 * Verifies that KYC status can be retrieved for a quote
 */
describe('GET /api/compliance/[quoteId]/status', () => {
  it('returns KYC status for valid quote', async () => {
    const response = await fetch(`http://localhost:3006/api/compliance/${TEST_QUOTE_ID}/status`);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toHaveProperty('status');
    expect(data.data).toHaveProperty('verification_result');
    expect(data.data).toHaveProperty('risk_tier');
    expect(data.data).toHaveProperty('completed_at');
  });

  /**
   * Test 6: GET /api/compliance/[quoteId]/status - No KYC Session
   *
   * Verifies that quotes without KYC sessions return not_started status
   */
  it('returns not_started for quote without KYC session', async () => {
    const response = await fetch(`http://localhost:3006/api/compliance/${INVALID_QUOTE_ID}/status`);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.status).toBe('not_started');
  });
});

/**
 * Test 7: POST /api/compliance/retry-kyc - Valid Quote
 *
 * Verifies that KYC verification can be retried for declined sessions
 */
describe('POST /api/compliance/retry-kyc', () => {
  it('creates new KYC session for retry', async () => {
    const response = await fetch('http://localhost:3006/api/compliance/retry-kyc', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quoteId: TEST_QUOTE_ID }),
    });

    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toHaveProperty('sessionId');
    expect(data.data).toHaveProperty('verificationUrl');
  });

  /**
   * Test 8: POST /api/compliance/retry-kyc - Invalid Quote
   *
   * Verifies that invalid quote IDs are rejected
   */
  it('returns 404 for invalid quote ID', async () => {
    const response = await fetch('http://localhost:3006/api/compliance/retry-kyc', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quoteId: INVALID_QUOTE_ID }),
    });

    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.success).toBe(false);
    expect(data.error).toContain('Quote not found');
  });
});
