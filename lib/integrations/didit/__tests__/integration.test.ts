/**
 * Didit KYC Integration Tests
 *
 * Focused test suite for Task Group 2: Didit KYC Integration
 * Tests: 6 total (within 2-8 requirement)
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import crypto from 'crypto';
import { verifyDiditWebhook } from '../webhook-handler';
import { calculateRiskTier } from '@/lib/compliance/risk-scoring';
import type { ExtractedKYCData } from '../types';

// Mock environment variable for testing
const TEST_WEBHOOK_SECRET = 'test_webhook_secret_key_12345';
process.env.DIDIT_WEBHOOK_SECRET = TEST_WEBHOOK_SECRET;

describe('Didit Integration Tests', () => {
  describe('Test 1: Webhook Signature Verification (Valid)', () => {
    it('should return true for valid HMAC-SHA256 signature', () => {
      const payload = JSON.stringify({
        event: 'verification.completed',
        sessionId: 'session_abc123',
        timestamp: '2025-11-01T10:00:00Z',
      });

      // Generate valid signature
      const signature = crypto
        .createHmac('sha256', TEST_WEBHOOK_SECRET)
        .update(payload)
        .digest('hex');

      const result = verifyDiditWebhook(payload, signature);

      expect(result).toBe(true);
    });
  });

  describe('Test 2: Webhook Signature Verification (Invalid)', () => {
    it('should return false for invalid signature', () => {
      const payload = JSON.stringify({
        event: 'verification.completed',
        sessionId: 'session_abc123',
      });

      const invalidSignature = 'invalid_signature_string';

      const result = verifyDiditWebhook(payload, invalidSignature);

      expect(result).toBe(false);
    });

    it('should return false for tampered payload', () => {
      const originalPayload = JSON.stringify({
        event: 'verification.completed',
        sessionId: 'session_abc123',
      });

      // Generate signature for original payload
      const signature = crypto
        .createHmac('sha256', TEST_WEBHOOK_SECRET)
        .update(originalPayload)
        .digest('hex');

      // Tamper with payload after signature generation
      const tamperedPayload = JSON.stringify({
        event: 'verification.completed',
        sessionId: 'session_TAMPERED',
      });

      const result = verifyDiditWebhook(tamperedPayload, signature);

      expect(result).toBe(false);
    });
  });

  describe('Test 3: Risk Scoring - Low Risk (Auto-Approve)', () => {
    it('should calculate low risk for high liveness + valid docs + no AML flags', () => {
      const extractedData: ExtractedKYCData = {
        id_number: '8901015800080',
        full_name: 'John Doe',
        date_of_birth: '1989-01-01',
        company_reg: 'CK2023/123456/07',
        company_name: 'Test Business PTY LTD',
        directors: [{ name: 'John Doe', id_number: '8901015800080' }],
        proof_of_address: {
          type: 'utility_bill',
          address_line_1: '123 Main Street',
          city: 'Johannesburg',
          province: 'Gauteng',
          postal_code: '2001',
          verified: true,
        },
        liveness_score: 0.95, // High confidence (40 points)
        document_authenticity: 'valid', // Valid docs (30 points)
        aml_flags: [], // No flags (30 points)
        sanctions_match: false,
        pep_match: false,
        verification_timestamp: '2025-11-01T10:00:00Z',
        verification_method: 'didit_kyc_v1',
      };

      const result = calculateRiskTier(extractedData);

      expect(result.total_score).toBeGreaterThanOrEqual(80); // Low risk threshold
      expect(result.risk_tier).toBe('low');
      expect(result.auto_approved).toBe(true);
      expect(result.liveness_score_points).toBeGreaterThan(30);
      expect(result.document_validity_points).toBe(30);
      expect(result.aml_screening_points).toBe(30);
    });
  });

  describe('Test 4: Risk Scoring - Medium Risk (Manual Review)', () => {
    it('should calculate medium risk for moderate liveness + valid docs + clean AML', () => {
      const extractedData: ExtractedKYCData = {
        id_number: '8901015800080',
        full_name: 'Jane Smith',
        date_of_birth: '1989-01-01',
        proof_of_address: {
          type: 'bank_statement',
          address_line_1: '456 Oak Avenue',
          city: 'Cape Town',
          province: 'Western Cape',
          postal_code: '8001',
          verified: true,
        },
        liveness_score: 0.72, // Medium confidence (25 points)
        document_authenticity: 'valid', // Valid docs (30 points)
        aml_flags: [], // No flags (30 points)
        sanctions_match: false,
        pep_match: false,
        verification_timestamp: '2025-11-01T10:00:00Z',
        verification_method: 'didit_kyc_v1',
      };

      const result = calculateRiskTier(extractedData);

      expect(result.total_score).toBeGreaterThanOrEqual(50); // Medium risk min
      expect(result.total_score).toBeLessThan(80); // Below low risk threshold
      expect(result.risk_tier).toBe('medium');
      expect(result.auto_approved).toBe(false);
    });
  });

  describe('Test 5: Risk Scoring - High Risk (Decline)', () => {
    it('should calculate high risk for low liveness + suspicious docs + AML flags', () => {
      const extractedData: ExtractedKYCData = {
        id_number: '8901015800080',
        full_name: 'Suspicious Person',
        date_of_birth: '1989-01-01',
        proof_of_address: {
          type: 'utility_bill',
          address_line_1: '789 Shady Lane',
          city: 'Pretoria',
          province: 'Gauteng',
          postal_code: '0001',
          verified: false,
        },
        liveness_score: 0.45, // Low confidence (0 points)
        document_authenticity: 'suspicious', // Suspicious docs (15 points)
        aml_flags: ['high_risk_jurisdiction', 'unusual_transaction_pattern', 'multiple_identities'],
        sanctions_match: false,
        pep_match: false,
        verification_timestamp: '2025-11-01T10:00:00Z',
        verification_method: 'didit_kyc_v1',
      };

      const result = calculateRiskTier(extractedData);

      expect(result.total_score).toBeLessThan(50); // High risk threshold
      expect(result.risk_tier).toBe('high');
      expect(result.auto_approved).toBe(false);
    });

    it('should calculate high risk for PEP match regardless of other factors', () => {
      const extractedData: ExtractedKYCData = {
        id_number: '8901015800080',
        full_name: 'Political Person',
        date_of_birth: '1989-01-01',
        proof_of_address: {
          type: 'utility_bill',
          address_line_1: '100 Government Street',
          city: 'Pretoria',
          province: 'Gauteng',
          postal_code: '0001',
          verified: true,
        },
        liveness_score: 0.95, // High liveness (40 points)
        document_authenticity: 'valid', // Valid docs (30 points)
        aml_flags: [],
        sanctions_match: false,
        pep_match: true, // Politically Exposed Person (0 AML points)
        verification_timestamp: '2025-11-01T10:00:00Z',
        verification_method: 'didit_kyc_v1',
      };

      const result = calculateRiskTier(extractedData);

      expect(result.aml_screening_points).toBe(0); // PEP = 0 points
      expect(result.total_score).toBeLessThan(80); // Not auto-approved
      expect(result.reasoning).toContain(expect.stringContaining('PEP'));
    });
  });

  describe('Test 6: Risk Scoring - Sanctions Match (Critical)', () => {
    it('should calculate high risk for sanctions list match', () => {
      const extractedData: ExtractedKYCData = {
        id_number: '8901015800080',
        full_name: 'Sanctioned Individual',
        date_of_birth: '1989-01-01',
        proof_of_address: {
          type: 'utility_bill',
          address_line_1: '200 Restricted Avenue',
          city: 'Johannesburg',
          province: 'Gauteng',
          postal_code: '2001',
          verified: true,
        },
        liveness_score: 0.95, // High liveness
        document_authenticity: 'valid', // Valid docs
        aml_flags: [],
        sanctions_match: true, // Critical match (0 AML points)
        pep_match: false,
        verification_timestamp: '2025-11-01T10:00:00Z',
        verification_method: 'didit_kyc_v1',
      };

      const result = calculateRiskTier(extractedData);

      expect(result.aml_screening_points).toBe(0); // Sanctions = 0 points
      expect(result.risk_tier).toBe('high'); // Must be high risk
      expect(result.auto_approved).toBe(false);
      expect(result.reasoning).toContain(expect.stringContaining('Sanctions'));
    });
  });
});
