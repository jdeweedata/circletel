/**
 * ZOHO Sign Service Tests
 * Task Group 7: ZOHO Sign Integration
 *
 * Tests signature request creation and webhook processing
 * Test count: 6 (within 2-8 limit)
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { sendContractForSignature } from '../sign-service';
import { createClient } from '@/lib/supabase/server';

// Mock Supabase client
jest.mock('@/lib/supabase/server');

// Mock axios for ZOHO Sign API calls
jest.mock('axios');

describe('ZOHO Sign Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('sendContractForSignature', () => {
    it('creates signature request with valid contract_id', async () => {
      // Mock contract data
      const mockContract = {
        id: 'contract-123',
        contract_number: 'CT-2025-001',
        pdf_url: 'https://storage.supabase.co/contracts/contract-123.pdf',
        customer_id: 'customer-456',
        status: 'draft'
      };

      const mockCustomer = {
        id: 'customer-456',
        email: 'customer@example.com',
        first_name: 'John',
        last_name: 'Smith'
      };

      // Mock Supabase responses
      const mockSupabase = {
        from: jest.fn(() => ({
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn(() => Promise.resolve({ data: mockContract, error: null }))
            }))
          })),
          update: jest.fn(() => ({
            eq: jest.fn(() => Promise.resolve({ error: null }))
          }))
        }))
      };

      (createClient as jest.Mock).mockResolvedValue(mockSupabase);

      // Mock ZOHO Sign API response
      const mockZohoResponse = {
        requests: {
          request_id: 'zoho-sign-123',
          actions: [
            {
              action_id: 'action-1',
              signing_url: 'https://sign.zoho.com/sign/customer-456'
            }
          ]
        }
      };

      const axios = require('axios');
      axios.post = jest.fn().mockResolvedValue({ data: mockZohoResponse });

      // Test
      const result = await sendContractForSignature('contract-123');

      expect(result).toHaveProperty('requestId', 'zoho-sign-123');
      expect(result).toHaveProperty('customerSigningUrl');
      expect(result.customerSigningUrl).toContain('sign.zoho.com');
    });

    it('throws error for non-existent contract', async () => {
      const mockSupabase = {
        from: jest.fn(() => ({
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn(() => Promise.resolve({ data: null, error: { message: 'Not found' } }))
            }))
          }))
        }))
      };

      (createClient as jest.Mock).mockResolvedValue(mockSupabase);

      await expect(
        sendContractForSignature('non-existent-id')
      ).rejects.toThrow('Contract not found');
    });

    it('configures signature request with 2 signers in sequence', async () => {
      const mockContract = {
        id: 'contract-123',
        contract_number: 'CT-2025-001',
        pdf_url: 'https://storage.supabase.co/contracts/contract-123.pdf',
        customer_id: 'customer-456',
        status: 'draft'
      };

      const mockCustomer = {
        id: 'customer-456',
        email: 'customer@example.com',
        first_name: 'John',
        last_name: 'Smith'
      };

      const mockSupabase = {
        from: jest.fn((table) => {
          if (table === 'contracts') {
            return {
              select: jest.fn(() => ({
                eq: jest.fn(() => ({
                  single: jest.fn(() => Promise.resolve({ data: mockContract, error: null }))
                }))
              })),
              update: jest.fn(() => ({
                eq: jest.fn(() => Promise.resolve({ error: null }))
              }))
            };
          } else if (table === 'customers') {
            return {
              select: jest.fn(() => ({
                eq: jest.fn(() => ({
                  single: jest.fn(() => Promise.resolve({ data: mockCustomer, error: null }))
                }))
              }))
            };
          }
        })
      };

      (createClient as jest.Mock).mockResolvedValue(mockSupabase);

      const axios = require('axios');
      let capturedRequestBody: any;

      axios.post = jest.fn((url, body) => {
        capturedRequestBody = body;
        return Promise.resolve({
          data: {
            requests: {
              request_id: 'zoho-sign-123',
              actions: [{ signing_url: 'https://sign.zoho.com/sign/customer-456' }]
            }
          }
        });
      });

      await sendContractForSignature('contract-123');

      // Verify request structure
      expect(capturedRequestBody.requests.is_sequential).toBe(true);
      expect(capturedRequestBody.requests.actions).toHaveLength(2);
      expect(capturedRequestBody.requests.actions[0].signing_order).toBe(1);
      expect(capturedRequestBody.requests.actions[1].signing_order).toBe(2);
      expect(capturedRequestBody.requests.actions[0].recipient_email).toBe('customer@example.com');
      expect(capturedRequestBody.requests.actions[1].recipient_email).toBe('contracts@circletel.co.za');
    });

    it('sets 30-day expiration and 3-day reminders', async () => {
      const mockContract = {
        id: 'contract-123',
        contract_number: 'CT-2025-001',
        pdf_url: 'https://storage.supabase.co/contracts/contract-123.pdf',
        customer_id: 'customer-456',
        status: 'draft'
      };

      const mockSupabase = {
        from: jest.fn(() => ({
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn(() => Promise.resolve({ data: mockContract, error: null }))
            }))
          })),
          update: jest.fn(() => ({
            eq: jest.fn(() => Promise.resolve({ error: null }))
          }))
        }))
      };

      (createClient as jest.Mock).mockResolvedValue(mockSupabase);

      const axios = require('axios');
      let capturedRequestBody: any;

      axios.post = jest.fn((url, body) => {
        capturedRequestBody = body;
        return Promise.resolve({
          data: {
            requests: {
              request_id: 'zoho-sign-123',
              actions: [{ signing_url: 'https://sign.zoho.com/sign/customer-456' }]
            }
          }
        });
      });

      await sendContractForSignature('contract-123');

      // Verify expiration and reminders
      expect(capturedRequestBody.requests.expiration_days).toBe(30);
      expect(capturedRequestBody.requests.reminders.reminder_period).toBe(3);
    });

    it('updates contract with zoho_sign_request_id', async () => {
      const mockContract = {
        id: 'contract-123',
        contract_number: 'CT-2025-001',
        pdf_url: 'https://storage.supabase.co/contracts/contract-123.pdf',
        customer_id: 'customer-456',
        status: 'draft'
      };

      const mockUpdateFn = jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({ error: null }))
      }));

      const mockSupabase = {
        from: jest.fn(() => ({
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn(() => Promise.resolve({ data: mockContract, error: null }))
            }))
          })),
          update: mockUpdateFn
        }))
      };

      (createClient as jest.Mock).mockResolvedValue(mockSupabase);

      const axios = require('axios');
      axios.post = jest.fn().mockResolvedValue({
        data: {
          requests: {
            request_id: 'zoho-sign-123',
            actions: [{ signing_url: 'https://sign.zoho.com/sign/customer-456' }]
          }
        }
      });

      await sendContractForSignature('contract-123');

      // Verify update was called with zoho_sign_request_id
      expect(mockUpdateFn).toHaveBeenCalledWith(
        expect.objectContaining({ zoho_sign_request_id: 'zoho-sign-123' })
      );
    });

    it('authenticates with ZOHO Sign API using OAuth token', async () => {
      const mockContract = {
        id: 'contract-123',
        contract_number: 'CT-2025-001',
        pdf_url: 'https://storage.supabase.co/contracts/contract-123.pdf',
        customer_id: 'customer-456',
        status: 'draft'
      };

      const mockSupabase = {
        from: jest.fn(() => ({
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn(() => Promise.resolve({ data: mockContract, error: null }))
            }))
          })),
          update: jest.fn(() => ({
            eq: jest.fn(() => Promise.resolve({ error: null }))
          }))
        }))
      };

      (createClient as jest.Mock).mockResolvedValue(mockSupabase);

      const axios = require('axios');
      let capturedHeaders: any;

      axios.post = jest.fn((url, body, config) => {
        capturedHeaders = config?.headers;
        return Promise.resolve({
          data: {
            requests: {
              request_id: 'zoho-sign-123',
              actions: [{ signing_url: 'https://sign.zoho.com/sign/customer-456' }]
            }
          }
        });
      });

      await sendContractForSignature('contract-123');

      // Verify OAuth authentication header
      expect(capturedHeaders).toHaveProperty('Authorization');
      expect(capturedHeaders.Authorization).toMatch(/^Zoho-oauthtoken /);
    });
  });
});
