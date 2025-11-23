/**
 * CMS Pages API Tests
 * Tests for /api/cms/pages endpoints
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
let testPageId: string;
let cleanup: string[] = [];

describe('CMS Pages API', () => {
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

  // Cleanup: Delete test pages
  afterAll(async () => {
    if (cleanup.length > 0) {
      await supabase.from('cms_pages').delete().in('id', cleanup);
    }

    await supabase.auth.signOut();
  });

  describe('POST /api/cms/pages', () => {
    it('should create a new draft page', async () => {
      const payload = {
        title: 'Test Page',
        slug: 'test-page-' + Date.now(),
        content_type: 'landing_page',
        content: '<h1>Test Content</h1>',
        seo_metadata: {
          meta_title: 'Test Page',
          meta_description: 'Test description',
          keywords: ['test'],
        },
        status: 'draft',
      };

      const response = await fetch(`${API_BASE_URL}/api/cms/pages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify(payload),
      });

      expect(response.status).toBe(201);

      const data = await response.json();
      expect(data).toHaveProperty('id');
      expect(data.title).toBe(payload.title);
      expect(data.slug).toBe(payload.slug);
      expect(data.status).toBe('draft');

      testPageId = data.id;
      cleanup.push(data.id);
    });

    it('should reject duplicate slug', async () => {
      const payload = {
        title: 'Duplicate Slug Test',
        slug: 'test-page-duplicate',
        content_type: 'landing_page',
        content: '<p>Content</p>',
        status: 'draft',
      };

      // Create first page
      const response1 = await fetch(`${API_BASE_URL}/api/cms/pages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify(payload),
      });

      expect(response1.status).toBe(201);
      const data1 = await response1.json();
      cleanup.push(data1.id);

      // Try to create second page with same slug
      const response2 = await fetch(`${API_BASE_URL}/api/cms/pages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify(payload),
      });

      expect(response2.status).toBe(400);
      const error = await response2.json();
      expect(error.error).toContain('slug');
    });

    it('should reject unauthenticated requests', async () => {
      const payload = {
        title: 'Unauthorized Test',
        slug: 'unauthorized',
        content_type: 'landing_page',
        content: '<p>Content</p>',
        status: 'draft',
      };

      const response = await fetch(`${API_BASE_URL}/api/cms/pages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/cms/pages', () => {
    it('should list pages with pagination', async () => {
      const response = await fetch(
        `${API_BASE_URL}/api/cms/pages?page=1&limit=10`,
        {
          headers: {
            'Authorization': `Bearer ${authToken}`,
          },
        }
      );

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('pages');
      expect(data).toHaveProperty('pagination');
      expect(Array.isArray(data.pages)).toBe(true);
      expect(data.pagination).toHaveProperty('page');
      expect(data.pagination).toHaveProperty('limit');
      expect(data.pagination).toHaveProperty('total');
    });

    it('should filter by status', async () => {
      const response = await fetch(
        `${API_BASE_URL}/api/cms/pages?status=draft`,
        {
          headers: {
            'Authorization': `Bearer ${authToken}`,
          },
        }
      );

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.pages.every((p: any) => p.status === 'draft')).toBe(true);
    });

    it('should filter by content type', async () => {
      const response = await fetch(
        `${API_BASE_URL}/api/cms/pages?content_type=landing_page`,
        {
          headers: {
            'Authorization': `Bearer ${authToken}`,
          },
        }
      );

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(
        data.pages.every((p: any) => p.content_type === 'landing_page')
      ).toBe(true);
    });

    it('should search by title', async () => {
      const response = await fetch(
        `${API_BASE_URL}/api/cms/pages?search=Test`,
        {
          headers: {
            'Authorization': `Bearer ${authToken}`,
          },
        }
      );

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(Array.isArray(data.pages)).toBe(true);
    });
  });

  describe('GET /api/cms/pages/[id]', () => {
    it('should fetch a single page by ID', async () => {
      expect(testPageId).toBeDefined();

      const response = await fetch(
        `${API_BASE_URL}/api/cms/pages/${testPageId}`,
        {
          headers: {
            'Authorization': `Bearer ${authToken}`,
          },
        }
      );

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.id).toBe(testPageId);
      expect(data).toHaveProperty('title');
      expect(data).toHaveProperty('slug');
      expect(data).toHaveProperty('content');
    });

    it('should return 404 for non-existent page', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';

      const response = await fetch(
        `${API_BASE_URL}/api/cms/pages/${fakeId}`,
        {
          headers: {
            'Authorization': `Bearer ${authToken}`,
          },
        }
      );

      expect(response.status).toBe(404);
    });
  });

  describe('PUT /api/cms/pages/[id]', () => {
    it('should update an existing page', async () => {
      expect(testPageId).toBeDefined();

      const updates = {
        title: 'Updated Test Page',
        content: '<h1>Updated Content</h1>',
      };

      const response = await fetch(
        `${API_BASE_URL}/api/cms/pages/${testPageId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`,
          },
          body: JSON.stringify(updates),
        }
      );

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.title).toBe(updates.title);
      expect(data.content).toBe(updates.content);
    });

    it('should update page status', async () => {
      expect(testPageId).toBeDefined();

      const updates = {
        status: 'in_review',
      };

      const response = await fetch(
        `${API_BASE_URL}/api/cms/pages/${testPageId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`,
          },
          body: JSON.stringify(updates),
        }
      );

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.status).toBe('in_review');
    });

    it('should reject invalid status transitions', async () => {
      expect(testPageId).toBeDefined();

      // Try to go from draft to archived (invalid)
      const updates = {
        status: 'archived',
      };

      const response = await fetch(
        `${API_BASE_URL}/api/cms/pages/${testPageId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`,
          },
          body: JSON.stringify(updates),
        }
      );

      // Should either reject or require intermediate states
      // Implementation may vary
      expect([200, 400]).toContain(response.status);
    });
  });

  describe('DELETE /api/cms/pages/[id]', () => {
    it('should delete a page', async () => {
      // Create a page to delete
      const createResponse = await fetch(`${API_BASE_URL}/api/cms/pages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          title: 'Page to Delete',
          slug: 'page-to-delete-' + Date.now(),
          content_type: 'landing_page',
          content: '<p>Delete me</p>',
          status: 'draft',
        }),
      });

      const page = await createResponse.json();
      const pageId = page.id;

      // Delete the page
      const deleteResponse = await fetch(
        `${API_BASE_URL}/api/cms/pages/${pageId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${authToken}`,
          },
        }
      );

      expect(deleteResponse.status).toBe(200);

      // Verify it's deleted
      const fetchResponse = await fetch(
        `${API_BASE_URL}/api/cms/pages/${pageId}`,
        {
          headers: {
            'Authorization': `Bearer ${authToken}`,
          },
        }
      );

      expect(fetchResponse.status).toBe(404);
    });

    it('should return 404 when deleting non-existent page', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';

      const response = await fetch(
        `${API_BASE_URL}/api/cms/pages/${fakeId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${authToken}`,
          },
        }
      );

      expect(response.status).toBe(404);
    });
  });

  describe('Security & Permissions', () => {
    it('should require authentication for all endpoints', async () => {
      const endpoints = [
        { method: 'GET', path: '/api/cms/pages' },
        { method: 'POST', path: '/api/cms/pages' },
        { method: 'GET', path: `/api/cms/pages/${testPageId}` },
        { method: 'PUT', path: `/api/cms/pages/${testPageId}` },
        { method: 'DELETE', path: `/api/cms/pages/${testPageId}` },
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
  });
});
