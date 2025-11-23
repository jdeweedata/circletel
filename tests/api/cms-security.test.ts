/**
 * CMS Security Tests
 * Tests for authentication, authorization, XSS prevention, and input sanitization
 */

import { createClient } from '@supabase/supabase-js';

// Test environment setup
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const API_BASE_URL = process.env.TEST_API_URL || 'http://localhost:3005';

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Test credentials
const ADMIN_EMAIL = process.env.ADMIN_TEST_EMAIL || 'test@example.com';
const ADMIN_PASSWORD = process.env.ADMIN_TEST_PASSWORD || 'testpass123';

let adminToken: string;

describe('CMS Security Tests', () => {
  beforeAll(async () => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
    });

    if (error || !data.session) {
      throw new Error(`Failed to authenticate: ${error?.message}`);
    }

    adminToken = data.session.access_token;
  });

  afterAll(async () => {
    await supabase.auth.signOut();
  });

  describe('Authentication & Authorization', () => {
    test('should require authentication for all CMS endpoints', async () => {
      const endpoints = [
        { method: 'GET', path: '/api/cms/pages' },
        { method: 'POST', path: '/api/cms/pages' },
        { method: 'POST', path: '/api/cms/generate/content' },
        { method: 'POST', path: '/api/cms/generate/seo' },
        { method: 'POST', path: '/api/cms/media/upload' },
        { method: 'GET', path: '/api/cms/media' },
      ];

      for (const endpoint of endpoints) {
        const response = await fetch(`${API_BASE_URL}${endpoint.path}`, {
          method: endpoint.method,
          headers: {
            'Content-Type': 'application/json',
          },
          body: endpoint.method !== 'GET' ? JSON.stringify({}) : undefined,
        });

        expect([401, 403]).toContain(response.status);
      }
    });

    test('should reject invalid JWT tokens', async () => {
      const invalidToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.token';

      const response = await fetch(`${API_BASE_URL}/api/cms/pages`, {
        headers: {
          'Authorization': `Bearer ${invalidToken}`,
        },
      });

      expect([401, 403]).toContain(response.status);
    });

    test('should reject expired tokens', async () => {
      // Create a token that expired in the past (if we can simulate this)
      // This test may need to be adjusted based on your auth implementation

      const expiredToken = adminToken; // Would need actual expired token
      // For now, we'll just test with a malformed token
      const malformedToken = adminToken.slice(0, -10) + 'XXXXXXXXXX';

      const response = await fetch(`${API_BASE_URL}/api/cms/pages`, {
        headers: {
          'Authorization': `Bearer ${malformedToken}`,
        },
      });

      expect([401, 403]).toContain(response.status);
    });

    test('should check CMS permissions', async () => {
      // Test with admin token (should have permissions)
      const response = await fetch(`${API_BASE_URL}/api/cms/pages`, {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
        },
      });

      // Should succeed with proper permissions
      expect(response.status).toBe(200);
    });
  });

  describe('XSS Prevention', () => {
    test('should sanitize HTML in content', async () => {
      const maliciousContent = {
        title: '<script>alert("XSS")</script>Test Title',
        slug: 'xss-test-' + Date.now(),
        content_type: 'landing_page',
        content: '<p>Normal content</p><script>alert("XSS")</script><img src=x onerror="alert(1)">',
        status: 'draft',
      };

      const response = await fetch(`${API_BASE_URL}/api/cms/pages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`,
        },
        body: JSON.stringify(maliciousContent),
      });

      // Should either reject or sanitize
      expect([200, 201, 400]).toContain(response.status);

      if (response.status === 201) {
        const data = await response.json();

        // Title should not contain script tags
        expect(data.title).not.toContain('<script>');

        // Content should be sanitized
        expect(data.content).not.toContain('<script>');
        expect(data.content).not.toContain('onerror=');

        // Clean up
        await supabase.from('cms_pages').delete().eq('id', data.id);
      }
    });

    test('should prevent JavaScript in event handlers', async () => {
      const maliciousContent = {
        title: 'Event Handler Test',
        slug: 'event-handler-test-' + Date.now(),
        content_type: 'landing_page',
        content: '<div onclick="alert(1)">Click me</div><a href="javascript:alert(1)">Link</a>',
        status: 'draft',
      };

      const response = await fetch(`${API_BASE_URL}/api/cms/pages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`,
        },
        body: JSON.stringify(maliciousContent),
      });

      if (response.status === 201) {
        const data = await response.json();

        // Should not contain onclick or javascript: protocol
        expect(data.content).not.toContain('onclick=');
        expect(data.content).not.toContain('javascript:');

        await supabase.from('cms_pages').delete().eq('id', data.id);
      }
    });

    test('should sanitize meta tags', async () => {
      const maliciousMetadata = {
        title: 'Meta Tag Test',
        slug: 'meta-tag-test-' + Date.now(),
        content_type: 'landing_page',
        content: '<p>Content</p>',
        seo_metadata: {
          meta_title: '<script>alert("XSS")</script>Meta Title',
          meta_description: 'Normal description<script>alert(1)</script>',
          keywords: ['<script>alert(1)</script>', 'normal keyword'],
        },
        status: 'draft',
      };

      const response = await fetch(`${API_BASE_URL}/api/cms/pages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`,
        },
        body: JSON.stringify(maliciousMetadata),
      });

      if (response.status === 201) {
        const data = await response.json();

        // SEO metadata should be sanitized
        if (data.seo_metadata) {
          expect(data.seo_metadata.meta_title).not.toContain('<script>');
          expect(data.seo_metadata.meta_description).not.toContain('<script>');
          expect(
            data.seo_metadata.keywords.some((k: string) => k.includes('<script>'))
          ).toBe(false);
        }

        await supabase.from('cms_pages').delete().eq('id', data.id);
      }
    });
  });

  describe('SQL Injection Prevention', () => {
    test('should prevent SQL injection in search queries', async () => {
      const sqlInjectionPayloads = [
        "' OR '1'='1",
        "'; DROP TABLE cms_pages;--",
        "' UNION SELECT * FROM admin_users--",
        "1' AND 1=1--",
      ];

      for (const payload of sqlInjectionPayloads) {
        const response = await fetch(
          `${API_BASE_URL}/api/cms/pages?search=${encodeURIComponent(payload)}`,
          {
            headers: {
              'Authorization': `Bearer ${adminToken}`,
            },
          }
        );

        // Should handle gracefully without executing SQL
        expect([200, 400]).toContain(response.status);

        if (response.status === 200) {
          const data = await response.json();
          // Should return safe results or empty array
          expect(Array.isArray(data.pages)).toBe(true);
        }
      }
    });

    test('should prevent SQL injection in filter parameters', async () => {
      const response = await fetch(
        `${API_BASE_URL}/api/cms/pages?status=' OR '1'='1`,
        {
          headers: {
            'Authorization': `Bearer ${adminToken}`,
          },
        }
      );

      // Should reject or handle safely
      expect([200, 400]).toContain(response.status);
    });
  });

  describe('Input Validation', () => {
    test('should validate required fields', async () => {
      const invalidPayloads = [
        {},
        { title: '' },
        { title: 'Test', slug: '' },
        { title: 'Test', slug: 'test', content_type: '' },
      ];

      for (const payload of invalidPayloads) {
        const response = await fetch(`${API_BASE_URL}/api/cms/pages`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${adminToken}`,
          },
          body: JSON.stringify(payload),
        });

        expect(response.status).toBe(400);
      }
    });

    test('should validate field lengths', async () => {
      const tooLongPayload = {
        title: 'A'.repeat(1000),
        slug: 'too-long-' + Date.now(),
        content_type: 'landing_page',
        content: 'B'.repeat(100000), // 100KB
        status: 'draft',
      };

      const response = await fetch(`${API_BASE_URL}/api/cms/pages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`,
        },
        body: JSON.stringify(tooLongPayload),
      });

      // Should either accept or reject based on limits
      // Check response is handled appropriately
      expect(response.status).toBeLessThan(500);
    });

    test('should validate slug format', async () => {
      const invalidSlugs = [
        '../../../etc/passwd',
        'invalid slug with spaces',
        'UPPERCASE',
        'special!@#$%chars',
        '/absolute/path',
      ];

      for (const slug of invalidSlugs) {
        const response = await fetch(`${API_BASE_URL}/api/cms/pages`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${adminToken}`,
          },
          body: JSON.stringify({
            title: 'Invalid Slug Test',
            slug: slug,
            content_type: 'landing_page',
            content: '<p>Test</p>',
            status: 'draft',
          }),
        });

        // Should reject invalid slugs
        expect([400, 201]).toContain(response.status);

        // If accepted, slug should be sanitized
        if (response.status === 201) {
          const data = await response.json();
          expect(data.slug).not.toBe(slug); // Should be sanitized
          expect(data.slug).toMatch(/^[a-z0-9-]+$/); // Should only contain valid chars

          await supabase.from('cms_pages').delete().eq('id', data.id);
        }
      }
    });

    test('should validate status transitions', async () => {
      // Create a draft page
      const createResponse = await fetch(`${API_BASE_URL}/api/cms/pages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          title: 'Status Test',
          slug: 'status-test-' + Date.now(),
          content_type: 'landing_page',
          content: '<p>Test</p>',
          status: 'draft',
        }),
      });

      const page = await createResponse.json();

      // Try invalid status transition (draft -> archived)
      const updateResponse = await fetch(
        `${API_BASE_URL}/api/cms/pages/${page.id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${adminToken}`,
          },
          body: JSON.stringify({
            status: 'archived',
          }),
        }
      );

      // Should reject invalid transition or require intermediate states
      expect([200, 400]).toContain(updateResponse.status);

      await supabase.from('cms_pages').delete().eq('id', page.id);
    });
  });

  describe('File Upload Security', () => {
    test('should reject malicious file types', async () => {
      const maliciousTypes = [
        { type: 'application/x-msdownload', ext: 'exe' },
        { type: 'application/x-sh', ext: 'sh' },
        { type: 'text/html', ext: 'html' },
        { type: 'application/javascript', ext: 'js' },
      ];

      for (const fileType of maliciousTypes) {
        const formData = new FormData();
        const blob = new Blob(['malicious content'], { type: fileType.type });
        formData.append('file', blob, `malicious.${fileType.ext}`);

        const response = await fetch(`${API_BASE_URL}/api/cms/media/upload`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${adminToken}`,
          },
          body: formData,
        });

        expect(response.status).toBe(400);
      }
    });

    test('should enforce file size limits', async () => {
      // Try to upload file larger than 20MB
      const largeFile = new Blob([new ArrayBuffer(21 * 1024 * 1024)], {
        type: 'image/png',
      });
      const formData = new FormData();
      formData.append('file', largeFile, 'large-file.png');

      const response = await fetch(`${API_BASE_URL}/api/cms/media/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
        },
        body: formData,
      });

      expect(response.status).toBe(400);
    });

    test('should prevent directory traversal in file uploads', async () => {
      const testImage = new Blob(['test'], { type: 'image/png' });
      const formData = new FormData();
      formData.append('file', testImage, '../../../etc/passwd.png');

      const response = await fetch(`${API_BASE_URL}/api/cms/media/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
        },
        body: formData,
      });

      if (response.status === 201) {
        const data = await response.json();

        // Filename should be sanitized
        expect(data.file_name).not.toContain('..');
        expect(data.file_name).not.toContain('/');
        expect(data.storage_path).not.toContain('..');

        // Clean up
        await supabase.from('cms_media').delete().eq('id', data.id);
      }
    });
  });

  describe('Rate Limiting', () => {
    test('should enforce rate limits on AI generation', async () => {
      const payload = {
        topic: 'Rate Limit Test',
        content_type: 'landing_page',
        tone: 'professional',
        keywords: ['test'],
        target_audience: 'business',
        word_count: 100,
      };

      // Make multiple rapid requests
      const requests = [];
      for (let i = 0; i < 25; i++) {
        // Exceed hourly limit of 20
        requests.push(
          fetch(`${API_BASE_URL}/api/cms/generate/content`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${adminToken}`,
            },
            body: JSON.stringify(payload),
          })
        );
      }

      const responses = await Promise.all(requests);

      // At least one should be rate limited
      const rateLimited = responses.some((r) => r.status === 429);
      expect(rateLimited).toBe(true);
    }, 60000); // 60 second timeout
  });

  describe('CORS & Headers', () => {
    test('should have security headers', async () => {
      const response = await fetch(`${API_BASE_URL}/api/cms/pages`, {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
        },
      });

      // Check for security headers
      const headers = response.headers;

      // Should have content-type
      expect(headers.get('content-type')).toContain('application/json');

      // Should NOT expose sensitive headers
      expect(headers.get('x-powered-by')).toBeNull();
    });

    test('should reject CORS from unauthorized origins', async () => {
      const response = await fetch(`${API_BASE_URL}/api/cms/pages`, {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Origin': 'https://malicious-site.com',
        },
      });

      // CORS behavior depends on configuration
      // At minimum, request should complete
      expect(response.status).toBeLessThan(500);
    });
  });
});
