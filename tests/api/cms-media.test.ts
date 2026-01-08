/**
 * CMS Media API Tests
 * Tests for /api/cms/media endpoints
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

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
let testMediaIds: string[] = [];

// Create a test image buffer
function createTestImage(): Uint8Array {
  // Create a simple 1x1 PNG (return as Uint8Array for Blob compatibility)
  const buffer = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    'base64'
  );
  return new Uint8Array(buffer);
}

describe('CMS Media API', () => {
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

  // Cleanup: Delete test media
  afterAll(async () => {
    if (testMediaIds.length > 0) {
      // Delete from database
      await supabase.from('cms_media').delete().in('id', testMediaIds);

      // Delete from storage
      const { data: files } = await supabase
        .from('cms_media')
        .select('storage_path')
        .in('id', testMediaIds);

      if (files && files.length > 0) {
        const paths = files.map((f: any) => f.storage_path);
        await supabase.storage.from('cms-media').remove(paths);
      }
    }

    await supabase.auth.signOut();
  });

  describe('POST /api/cms/media/upload', () => {
    it('should upload an image file', async () => {
      const imageBuffer = createTestImage();
      const formData = new FormData();
      const blob = new Blob([imageBuffer], { type: 'image/png' });
      formData.append('file', blob, 'test-image.png');
      formData.append('alt_text', 'Test image');

      const response = await fetch(`${API_BASE_URL}/api/cms/media/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
        body: formData,
      });

      expect(response.status).toBe(201);

      const data = await response.json();
      expect(data).toHaveProperty('id');
      expect(data).toHaveProperty('url');
      expect(data).toHaveProperty('file_name');
      expect(data.file_type).toBe('image/png');
      expect(data.alt_text).toBe('Test image');

      testMediaIds.push(data.id);
    });

    it('should reject unsupported file types', async () => {
      const formData = new FormData();
      const blob = new Blob(['test content'], { type: 'application/exe' });
      formData.append('file', blob, 'malicious.exe');

      const response = await fetch(`${API_BASE_URL}/api/cms/media/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
        body: formData,
      });

      expect(response.status).toBe(400);
      const error = await response.json();
      expect(error.error).toContain('type');
    });

    it('should reject files exceeding size limit', async () => {
      // Create a buffer larger than 20MB (convert to Uint8Array for Blob compatibility)
      const largeBuffer = new Uint8Array(21 * 1024 * 1024); // 21MB

      const formData = new FormData();
      const blob = new Blob([largeBuffer], { type: 'image/png' });
      formData.append('file', blob, 'large-file.png');

      const response = await fetch(`${API_BASE_URL}/api/cms/media/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
        body: formData,
      });

      expect(response.status).toBe(400);
      const error = await response.json();
      expect(error.error).toContain('size');
    });

    it('should require authentication', async () => {
      const imageBuffer = createTestImage();
      const formData = new FormData();
      const blob = new Blob([imageBuffer], { type: 'image/png' });
      formData.append('file', blob, 'test.png');

      const response = await fetch(`${API_BASE_URL}/api/cms/media/upload`, {
        method: 'POST',
        body: formData,
      });

      expect(response.status).toBe(401);
    });

    it('should generate unique file names', async () => {
      const imageBuffer = createTestImage();

      // Upload same file twice
      const uploads = [];
      for (let i = 0; i < 2; i++) {
        const formData = new FormData();
        const blob = new Blob([imageBuffer], { type: 'image/png' });
        formData.append('file', blob, 'duplicate.png');

        const response = await fetch(`${API_BASE_URL}/api/cms/media/upload`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${authToken}`,
          },
          body: formData,
        });

        expect(response.status).toBe(201);
        const data = await response.json();
        uploads.push(data);
        testMediaIds.push(data.id);
      }

      // File names should be different
      expect(uploads[0].file_name).not.toBe(uploads[1].file_name);
    });
  });

  describe('GET /api/cms/media', () => {
    it('should list uploaded media', async () => {
      const response = await fetch(`${API_BASE_URL}/api/cms/media`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('media');
      expect(data).toHaveProperty('pagination');
      expect(Array.isArray(data.media)).toBe(true);
    });

    it('should support pagination', async () => {
      const response = await fetch(
        `${API_BASE_URL}/api/cms/media?page=1&limit=5`,
        {
          headers: {
            'Authorization': `Bearer ${authToken}`,
          },
        }
      );

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.pagination).toHaveProperty('page');
      expect(data.pagination).toHaveProperty('limit');
      expect(data.pagination.page).toBe(1);
      expect(data.pagination.limit).toBe(5);
    });

    it('should filter by file type', async () => {
      const response = await fetch(
        `${API_BASE_URL}/api/cms/media?file_type=image`,
        {
          headers: {
            'Authorization': `Bearer ${authToken}`,
          },
        }
      );

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(
        data.media.every((m: any) => m.file_type.startsWith('image/'))
      ).toBe(true);
    });

    it('should search by file name', async () => {
      const response = await fetch(
        `${API_BASE_URL}/api/cms/media?search=test`,
        {
          headers: {
            'Authorization': `Bearer ${authToken}`,
          },
        }
      );

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(Array.isArray(data.media)).toBe(true);
    });
  });

  describe('GET /api/cms/media/[id]', () => {
    it('should fetch media details by ID', async () => {
      // Use first test media ID
      if (testMediaIds.length === 0) {
        // Upload a file first
        const imageBuffer = createTestImage();
        const formData = new FormData();
        const blob = new Blob([imageBuffer], { type: 'image/png' });
        formData.append('file', blob, 'detail-test.png');

        const uploadResponse = await fetch(
          `${API_BASE_URL}/api/cms/media/upload`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${authToken}`,
            },
            body: formData,
          }
        );

        const uploadData = await uploadResponse.json();
        testMediaIds.push(uploadData.id);
      }

      const mediaId = testMediaIds[0];

      const response = await fetch(
        `${API_BASE_URL}/api/cms/media/${mediaId}`,
        {
          headers: {
            'Authorization': `Bearer ${authToken}`,
          },
        }
      );

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.id).toBe(mediaId);
      expect(data).toHaveProperty('url');
      expect(data).toHaveProperty('file_name');
    });

    it('should return 404 for non-existent media', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';

      const response = await fetch(
        `${API_BASE_URL}/api/cms/media/${fakeId}`,
        {
          headers: {
            'Authorization': `Bearer ${authToken}`,
          },
        }
      );

      expect(response.status).toBe(404);
    });
  });

  describe('PUT /api/cms/media/[id]', () => {
    it('should update media metadata', async () => {
      if (testMediaIds.length === 0) {
        // Upload a file first
        const imageBuffer = createTestImage();
        const formData = new FormData();
        const blob = new Blob([imageBuffer], { type: 'image/png' });
        formData.append('file', blob, 'update-test.png');

        const uploadResponse = await fetch(
          `${API_BASE_URL}/api/cms/media/upload`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${authToken}`,
            },
            body: formData,
          }
        );

        const uploadData = await uploadResponse.json();
        testMediaIds.push(uploadData.id);
      }

      const mediaId = testMediaIds[0];

      const updates = {
        alt_text: 'Updated alt text',
        caption: 'Updated caption',
      };

      const response = await fetch(
        `${API_BASE_URL}/api/cms/media/${mediaId}`,
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
      expect(data.alt_text).toBe(updates.alt_text);
      expect(data.caption).toBe(updates.caption);
    });
  });

  describe('DELETE /api/cms/media/[id]', () => {
    it('should delete media file', async () => {
      // Upload a file to delete
      const imageBuffer = createTestImage();
      const formData = new FormData();
      const blob = new Blob([imageBuffer], { type: 'image/png' });
      formData.append('file', blob, 'delete-test.png');

      const uploadResponse = await fetch(
        `${API_BASE_URL}/api/cms/media/upload`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${authToken}`,
          },
          body: formData,
        }
      );

      const uploadData = await uploadResponse.json();
      const mediaId = uploadData.id;

      // Delete the file
      const deleteResponse = await fetch(
        `${API_BASE_URL}/api/cms/media/${mediaId}`,
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
        `${API_BASE_URL}/api/cms/media/${mediaId}`,
        {
          headers: {
            'Authorization': `Bearer ${authToken}`,
          },
        }
      );

      expect(fetchResponse.status).toBe(404);
    });

    it('should delete from storage', async () => {
      // Upload a file
      const imageBuffer = createTestImage();
      const formData = new FormData();
      const blob = new Blob([imageBuffer], { type: 'image/png' });
      formData.append('file', blob, 'storage-delete-test.png');

      const uploadResponse = await fetch(
        `${API_BASE_URL}/api/cms/media/upload`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${authToken}`,
          },
          body: formData,
        }
      );

      const uploadData = await uploadResponse.json();
      const mediaId = uploadData.id;
      const storagePath = uploadData.storage_path;

      // Delete the file
      await fetch(`${API_BASE_URL}/api/cms/media/${mediaId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      // Check that file is deleted from storage
      const { error } = await supabase.storage
        .from('cms-media')
        .download(storagePath);

      expect(error).toBeDefined();
      expect(error?.message).toContain('not found');
    });
  });

  describe('Security', () => {
    it('should prevent path traversal attacks', async () => {
      const imageBuffer = createTestImage();
      const formData = new FormData();
      const blob = new Blob([imageBuffer], { type: 'image/png' });
      // Try to use path traversal in filename
      formData.append('file', blob, '../../../etc/passwd');

      const response = await fetch(`${API_BASE_URL}/api/cms/media/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
        body: formData,
      });

      // Should succeed but sanitize filename
      if (response.status === 201) {
        const data = await response.json();
        expect(data.file_name).not.toContain('..');
        expect(data.file_name).not.toContain('/');
        testMediaIds.push(data.id);
      } else {
        // Or reject the request
        expect(response.status).toBe(400);
      }
    });

    it('should validate file content matches extension', async () => {
      // Try to upload an executable disguised as an image (use Uint8Array for Blob compatibility)
      const maliciousContent = new Uint8Array(Buffer.from('MZ\x90\x00')); // DOS header
      const formData = new FormData();
      const blob = new Blob([maliciousContent], { type: 'image/png' });
      formData.append('file', blob, 'fake-image.png');

      const response = await fetch(`${API_BASE_URL}/api/cms/media/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
        body: formData,
      });

      // Should reject based on content validation
      expect([400, 415]).toContain(response.status);
    });
  });
});
