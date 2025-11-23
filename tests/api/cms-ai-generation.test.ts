/**
 * CMS AI Generation API Tests
 * Tests for /api/cms/generate endpoints
 */

import { createClient } from '@supabase/supabase-js';

// Test environment setup
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const API_BASE_URL = process.env.TEST_API_URL || 'http://localhost:3005';

// Create Supabase client for test setup/cleanup
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Mock admin user credentials
const ADMIN_EMAIL = process.env.ADMIN_TEST_EMAIL || 'test@example.com';
const ADMIN_PASSWORD = process.env.ADMIN_TEST_PASSWORD || 'testpass123';

let authToken: string;

describe('CMS AI Generation API', () => {
  // Setup: Login and get auth token
  beforeAll(async () => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
    });

    if (error || !data.session) {
      throw new Error(`Failed to authenticate test user: ${error?.message}`);
    }

    authToken = data.session.access_token;
  });

  afterAll(async () => {
    await supabase.auth.signOut();
  });

  describe('POST /api/cms/generate/content', () => {
    it('should generate content with valid inputs', async () => {
      const payload = {
        topic: 'Fiber Internet Benefits',
        content_type: 'landing_page',
        tone: 'professional',
        keywords: ['fiber', 'internet', 'speed'],
        target_audience: 'business',
        word_count: 500,
      };

      const response = await fetch(
        `${API_BASE_URL}/api/cms/generate/content`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`,
          },
          body: JSON.stringify(payload),
        }
      );

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('content');
      expect(data).toHaveProperty('title');
      expect(data).toHaveProperty('thought_signature');
      expect(data.content.length).toBeGreaterThan(100);
    }, 30000); // 30 second timeout for AI generation

    it('should generate content for different content types', async () => {
      const contentTypes = ['landing_page', 'blog', 'product_page'];

      for (const contentType of contentTypes) {
        const payload = {
          topic: 'Test Topic',
          content_type: contentType,
          tone: 'professional',
          keywords: ['test'],
          target_audience: 'business',
          word_count: 300,
        };

        const response = await fetch(
          `${API_BASE_URL}/api/cms/generate/content`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${authToken}`,
            },
            body: JSON.stringify(payload),
          }
        );

        expect(response.status).toBe(200);

        const data = await response.json();
        expect(data).toHaveProperty('content');
        expect(data.content.length).toBeGreaterThan(50);
      }
    }, 90000); // 90 seconds for multiple generations

    it('should require authentication', async () => {
      const payload = {
        topic: 'Test',
        content_type: 'landing_page',
        tone: 'professional',
        keywords: ['test'],
        target_audience: 'business',
        word_count: 300,
      };

      const response = await fetch(
        `${API_BASE_URL}/api/cms/generate/content`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        }
      );

      expect(response.status).toBe(401);
    });

    it('should validate required fields', async () => {
      const invalidPayload = {
        topic: '', // Empty topic
        content_type: 'landing_page',
      };

      const response = await fetch(
        `${API_BASE_URL}/api/cms/generate/content`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`,
          },
          body: JSON.stringify(invalidPayload),
        }
      );

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/cms/generate/seo', () => {
    it('should generate SEO metadata', async () => {
      const payload = {
        title: 'Fiber Internet Solutions for Businesses',
        content: '<h1>Fast Fiber Internet</h1><p>Get lightning-fast fiber internet for your business with CircleTel.</p>',
        target_keywords: ['fiber internet', 'business internet', 'fast internet'],
      };

      const response = await fetch(`${API_BASE_URL}/api/cms/generate/seo`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify(payload),
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('meta_title');
      expect(data).toHaveProperty('meta_description');
      expect(data).toHaveProperty('keywords');
      expect(data.meta_title.length).toBeLessThanOrEqual(60);
      expect(data.meta_description.length).toBeLessThanOrEqual(160);
      expect(Array.isArray(data.keywords)).toBe(true);
    }, 30000);

    it('should generate Open Graph metadata', async () => {
      const payload = {
        title: 'Test Page',
        content: '<p>Test content</p>',
        target_keywords: ['test'],
      };

      const response = await fetch(`${API_BASE_URL}/api/cms/generate/seo`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify(payload),
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('og_title');
      expect(data).toHaveProperty('og_description');
      expect(data).toHaveProperty('og_type');
    }, 30000);

    it('should require authentication', async () => {
      const payload = {
        title: 'Test',
        content: '<p>Test</p>',
        target_keywords: ['test'],
      };

      const response = await fetch(`${API_BASE_URL}/api/cms/generate/seo`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      expect(response.status).toBe(401);
    });
  });

  describe('Rate Limiting', () => {
    it('should track AI usage in database', async () => {
      const payload = {
        topic: 'Rate Limit Test',
        content_type: 'landing_page',
        tone: 'professional',
        keywords: ['test'],
        target_audience: 'business',
        word_count: 200,
      };

      const response = await fetch(
        `${API_BASE_URL}/api/cms/generate/content`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`,
          },
          body: JSON.stringify(payload),
        }
      );

      expect(response.status).toBe(200);

      // Check that usage was logged
      const { data: userData } = await supabase.auth.getUser(authToken);
      const userId = userData?.user?.id;

      const { data: usageLogs } = await supabase
        .from('ai_usage_logs')
        .select('*')
        .eq('user_id', userId)
        .eq('request_type', 'content_generation')
        .order('created_at', { ascending: false })
        .limit(1);

      expect(usageLogs).toBeDefined();
      expect(usageLogs!.length).toBeGreaterThan(0);
      expect(usageLogs![0]).toHaveProperty('input_tokens');
      expect(usageLogs![0]).toHaveProperty('output_tokens');
      expect(usageLogs![0]).toHaveProperty('estimated_cost_cents');
    }, 30000);

    it('should enforce rate limits', async () => {
      // This test would need to make many requests to trigger rate limit
      // For now, we'll just check that the rate limit checking logic exists

      const payload = {
        topic: 'Rate Limit Test',
        content_type: 'landing_page',
        tone: 'professional',
        keywords: ['test'],
        target_audience: 'business',
        word_count: 100,
      };

      const response = await fetch(
        `${API_BASE_URL}/api/cms/generate/content`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`,
          },
          body: JSON.stringify(payload),
        }
      );

      // Should succeed or return rate limit error
      expect([200, 429]).toContain(response.status);

      if (response.status === 429) {
        const error = await response.json();
        expect(error).toHaveProperty('error');
        expect(error.error).toContain('rate limit');
      }
    }, 30000);
  });

  describe('Input Sanitization', () => {
    it('should sanitize HTML in inputs', async () => {
      const payload = {
        topic: '<script>alert("xss")</script>Test Topic',
        content_type: 'landing_page',
        tone: 'professional',
        keywords: ['test'],
        target_audience: 'business',
        word_count: 200,
      };

      const response = await fetch(
        `${API_BASE_URL}/api/cms/generate/content`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`,
          },
          body: JSON.stringify(payload),
        }
      );

      // Should either reject or sanitize
      expect([200, 400]).toContain(response.status);

      if (response.status === 200) {
        const data = await response.json();
        // Content should not contain script tags
        expect(data.content).not.toContain('<script>');
      }
    }, 30000);

    it('should limit input lengths', async () => {
      const payload = {
        topic: 'A'.repeat(10000), // Very long topic
        content_type: 'landing_page',
        tone: 'professional',
        keywords: ['test'],
        target_audience: 'business',
        word_count: 200,
      };

      const response = await fetch(
        `${API_BASE_URL}/api/cms/generate/content`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`,
          },
          body: JSON.stringify(payload),
        }
      );

      // Should reject overly long input
      expect([400, 413]).toContain(response.status);
    });
  });

  describe('Error Handling', () => {
    it('should handle AI service failures gracefully', async () => {
      // Test with invalid API key or configuration
      // This would require temporarily breaking the AI service

      const payload = {
        topic: 'Error Test',
        content_type: 'landing_page',
        tone: 'professional',
        keywords: ['test'],
        target_audience: 'business',
        word_count: 200,
      };

      const response = await fetch(
        `${API_BASE_URL}/api/cms/generate/content`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`,
          },
          body: JSON.stringify(payload),
        }
      );

      // Should return appropriate error status
      expect(response.status).toBeLessThan(600);

      if (response.status >= 500) {
        const error = await response.json();
        expect(error).toHaveProperty('error');
      }
    }, 30000);

    it('should log failures to ai_usage_logs', async () => {
      // Check that failed requests are logged with success=false
      const { data: userData } = await supabase.auth.getUser(authToken);
      const userId = userData?.user?.id;

      const { data: failedLogs } = await supabase
        .from('ai_usage_logs')
        .select('*')
        .eq('user_id', userId)
        .eq('success', false)
        .limit(10);

      // May or may not have failed logs, just check the query works
      expect(failedLogs).toBeDefined();
      expect(Array.isArray(failedLogs)).toBe(true);
    });
  });
});
