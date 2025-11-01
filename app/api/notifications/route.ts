/**
 * CircleTel Notification System - API Routes
 *
 * Endpoints:
 * - GET /api/notifications - List user notifications
 * - POST /api/notifications - Create notification (system use only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSSRClient } from '@/integrations/supabase/server';
import { createClient as createAdminClient } from '@/lib/supabase/server';
import { z } from 'zod';

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const NotificationTypeSchema = z.enum([
  'product_approval',
  'price_change',
  'system_update',
  'user_activity',
  'error_alert',
  'performance_warning',
]);

const NotificationPrioritySchema = z.enum([
  'low',
  'medium',
  'high',
  'critical',
]);

const CreateNotificationSchema = z.object({
  user_id: z.string().uuid(),
  type: NotificationTypeSchema,
  priority: NotificationPrioritySchema.optional().default('medium'),
  title: z.string().min(1).max(255),
  message: z.string().min(1),
  icon: z.string().max(50).optional(),
  metadata: z.record(z.any()).optional().default({}),
  link_url: z.string().url().max(500).optional(),
});

const ListNotificationsQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(100).optional().default(50),
  offset: z.coerce.number().int().nonnegative().optional().default(0),
  type: NotificationTypeSchema.optional(),
  is_read: z.enum(['true', 'false']).optional(),
  is_dismissed: z.enum(['true', 'false']).optional(),
});

// ============================================================================
// GET /api/notifications
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    // Use SSR client for auth
    const supabaseSSR = await createSSRClient();

    // Auth check
    const {
      data: { user },
      error: authError,
    } = await supabaseSSR.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Use service role client for querying notifications
    const supabase = await createAdminClient();

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const queryParams = {
      limit: searchParams.get('limit'),
      offset: searchParams.get('offset'),
      type: searchParams.get('type'),
      is_read: searchParams.get('is_read'),
      is_dismissed: searchParams.get('is_dismissed'),
    };

    const validatedQuery = ListNotificationsQuerySchema.parse(queryParams);

    // Build query
    let query = supabase
      .from('notifications')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .range(validatedQuery.offset, validatedQuery.offset + validatedQuery.limit - 1);

    // Apply filters
    if (validatedQuery.type) {
      query = query.eq('type', validatedQuery.type);
    }

    if (validatedQuery.is_read) {
      query = query.eq('is_read', validatedQuery.is_read === 'true');
    }

    if (validatedQuery.is_dismissed) {
      query = query.eq('is_dismissed', validatedQuery.is_dismissed === 'true');
    }

    const { data: notifications, error: fetchError, count } = await query;

    if (fetchError) {
      console.error('Error fetching notifications:', fetchError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch notifications' },
        { status: 500 }
      );
    }

    // Get unread count
    const { count: unreadCount, error: countError } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_read', false)
      .eq('is_dismissed', false)
      .is('deleted_at', null);

    if (countError) {
      console.error('Error counting unread notifications:', countError);
    }

    return NextResponse.json({
      success: true,
      data: notifications,
      pagination: {
        total: count || 0,
        limit: validatedQuery.limit,
        offset: validatedQuery.offset,
        unread_count: unreadCount || 0,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error in GET /api/notifications:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST /api/notifications
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    // Use SSR client for auth
    const supabaseSSR = await createSSRClient();

    // Auth check (service role for system notifications)
    const {
      data: { user },
      error: authError,
    } = await supabaseSSR.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Use service role client for data operations
    const supabase = await createAdminClient();

    // Parse and validate request body
    const body = await request.json();
    const validatedData = CreateNotificationSchema.parse(body);

    // Check if creator has permission to create notifications
    // In production, this should check for a specific permission like 'notifications:create'
    // For now, we'll allow authenticated admin users
    const { data: adminUser, error: adminError } = await supabase
      .from('admin_users')
      .select('id')
      .eq('id', user.id)
      .single();

    if (adminError || !adminUser) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Create notification
    const { data: notification, error: createError } = await supabase
      .from('notifications')
      .insert({
        user_id: validatedData.user_id,
        type: validatedData.type,
        priority: validatedData.priority,
        title: validatedData.title,
        message: validatedData.message,
        icon: validatedData.icon,
        metadata: validatedData.metadata,
        link_url: validatedData.link_url,
        created_by: user.id,
        updated_by: user.id,
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating notification:', createError);
      return NextResponse.json(
        { success: false, error: 'Failed to create notification' },
        { status: 500 }
      );
    }

    // TODO: Send email notification if user preferences allow
    // TODO: Trigger real-time notification via WebSocket/Supabase Realtime

    return NextResponse.json(
      {
        success: true,
        data: notification,
        message: 'Notification created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid request body', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error in POST /api/notifications:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
