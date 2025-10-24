/**
 * CircleTel Notification System - Unit Tests
 *
 * Tests notification API endpoints and business logic
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createMocks } from 'node-mocks-http';
import { GET as getNotifications, POST as createNotification } from '@/app/api/notifications/route';
import { PATCH as updateNotification, DELETE as deleteNotification } from '@/app/api/notifications/[id]/route';
import { POST as markRead } from '@/app/api/notifications/mark-read/route';
import { GET as getPreferences, PUT as updatePreferences } from '@/app/api/notifications/preferences/route';
import { createClient } from '@/lib/supabase/server';

// Mock Supabase client
vi.mock('@/lib/supabase/server');

describe('Notification API - GET /api/notifications', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns user notifications with pagination', async () => {
    const mockNotifications = [
      {
        id: '123',
        user_id: 'user-123',
        type: 'product_approval',
        priority: 'high',
        title: 'Product Approval Request',
        message: 'Product XYZ needs your approval',
        is_read: false,
        is_dismissed: false,
        created_at: new Date().toISOString(),
      },
    ];

    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'user-123' } },
          error: null,
        }),
      },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            is: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                range: vi.fn().mockResolvedValue({
                  data: mockNotifications,
                  error: null,
                  count: 1,
                }),
              }),
            }),
          }),
        }),
      }),
    };

    (createClient as any).mockResolvedValue(mockSupabase);

    const { req } = createMocks({
      method: 'GET',
      url: '/api/notifications?limit=10&offset=0',
    });

    const response = await getNotifications(req as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toHaveLength(1);
    expect(data.pagination.total).toBe(1);
  });

  it('returns 401 for unauthenticated requests', async () => {
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
          error: { message: 'Not authenticated' },
        }),
      },
    };

    (createClient as any).mockResolvedValue(mockSupabase);

    const { req } = createMocks({ method: 'GET' });

    const response = await getNotifications(req as any);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Unauthorized');
  });

  it('filters notifications by type', async () => {
    const mockNotifications = [
      { id: '1', type: 'product_approval', is_read: false },
    ];

    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'user-123' } },
          error: null,
        }),
      },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnThis(),
          is: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          range: vi.fn().mockResolvedValue({
            data: mockNotifications,
            error: null,
            count: 1,
          }),
        }),
      }),
    };

    (createClient as any).mockResolvedValue(mockSupabase);

    const { req } = createMocks({
      method: 'GET',
      url: '/api/notifications?type=product_approval',
    });

    const response = await getNotifications(req as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data).toHaveLength(1);
    expect(data.data[0].type).toBe('product_approval');
  });
});

describe('Notification API - POST /api/notifications', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates notification with valid data', async () => {
    const mockNotification = {
      id: '123',
      user_id: 'user-456',
      type: 'product_approval',
      priority: 'high',
      title: 'Test Notification',
      message: 'Test message',
      created_at: new Date().toISOString(),
    };

    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'user-123' } },
          error: null,
        }),
      },
      from: vi.fn().mockImplementation((table) => {
        if (table === 'admin_users') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: 'user-123' },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === 'notifications') {
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: mockNotification,
                  error: null,
                }),
              }),
            }),
          };
        }
      }),
    };

    (createClient as any).mockResolvedValue(mockSupabase);

    const { req } = createMocks({
      method: 'POST',
      body: {
        user_id: 'user-456',
        type: 'product_approval',
        priority: 'high',
        title: 'Test Notification',
        message: 'Test message',
      },
    });

    const response = await createNotification(req as any);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.data.title).toBe('Test Notification');
  });

  it('returns 400 for invalid request body', async () => {
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'user-123' } },
          error: null,
        }),
      },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: 'user-123' },
              error: null,
            }),
          }),
        }),
      }),
    };

    (createClient as any).mockResolvedValue(mockSupabase);

    const { req } = createMocks({
      method: 'POST',
      body: {
        // Missing required fields
        type: 'product_approval',
      },
    });

    const response = await createNotification(req as any);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toContain('Invalid');
  });
});

describe('Notification API - PATCH /api/notifications/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('marks notification as read', async () => {
    const mockNotification = {
      id: '123',
      user_id: 'user-123',
      is_read: true,
      updated_at: new Date().toISOString(),
    };

    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'user-123' } },
          error: null,
        }),
      },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            is: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { id: '123', user_id: 'user-123' },
                error: null,
              }),
            }),
          }),
        }),
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockNotification,
                error: null,
              }),
            }),
          }),
        }),
      }),
    };

    (createClient as any).mockResolvedValue(mockSupabase);

    const { req } = createMocks({
      method: 'PATCH',
      body: { is_read: true },
    });

    const context = { params: Promise.resolve({ id: '123' }) };
    const response = await updateNotification(req as any, context);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.is_read).toBe(true);
  });

  it('returns 403 for unauthorized access', async () => {
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'user-123' } },
          error: null,
        }),
      },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            is: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { id: '123', user_id: 'user-456' }, // Different user
                error: null,
              }),
            }),
          }),
        }),
      }),
    };

    (createClient as any).mockResolvedValue(mockSupabase);

    const { req } = createMocks({
      method: 'PATCH',
      body: { is_read: true },
    });

    const context = { params: Promise.resolve({ id: '123' }) };
    const response = await updateNotification(req as any, context);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.success).toBe(false);
  });
});

describe('Notification API - POST /api/notifications/mark-read', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('marks multiple notifications as read', async () => {
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'user-123' } },
          error: null,
        }),
      },
      from: vi.fn().mockReturnValue({
        update: vi.fn().mockReturnValue({
          in: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              is: vi.fn().mockReturnValue({
                select: vi.fn().mockResolvedValue({
                  data: [{ id: '1' }, { id: '2' }],
                  error: null,
                }),
              }),
            }),
          }),
        }),
      }),
    };

    (createClient as any).mockResolvedValue(mockSupabase);

    const { req } = createMocks({
      method: 'POST',
      body: {
        notification_ids: ['1', '2'],
      },
    });

    const response = await markRead(req as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.updated_count).toBe(2);
  });
});

describe('Notification Preferences API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates default preferences for new users', async () => {
    const mockPreferences = [
      { user_id: 'user-123', notification_type: 'product_approval', in_app_enabled: true, email_enabled: true },
      { user_id: 'user-123', notification_type: 'price_change', in_app_enabled: true, email_enabled: false },
    ];

    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'user-123' } },
          error: null,
        }),
      },
      from: vi.fn().mockImplementation(() => ({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          }),
        }),
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockResolvedValue({
            data: mockPreferences,
            error: null,
          }),
        }),
      })),
    };

    (createClient as any).mockResolvedValue(mockSupabase);

    const { req } = createMocks({ method: 'GET' });

    const response = await getPreferences(req as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toHaveLength(2);
  });

  it('updates user preferences', async () => {
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'user-123' } },
          error: null,
        }),
      },
      from: vi.fn().mockReturnValue({
        upsert: vi.fn().mockReturnValue({
          select: vi.fn().mockResolvedValue({
            data: [
              { notification_type: 'product_approval', in_app_enabled: false, email_enabled: true },
            ],
            error: null,
          }),
        }),
      }),
    };

    (createClient as any).mockResolvedValue(mockSupabase);

    const { req } = createMocks({
      method: 'PUT',
      body: {
        preferences: [
          { notification_type: 'product_approval', in_app_enabled: false, email_enabled: true },
        ],
      },
    });

    const response = await updatePreferences(req as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });
});
