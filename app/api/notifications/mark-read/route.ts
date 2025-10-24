/**
 * CircleTel Notification System - Bulk Mark as Read API
 *
 * Endpoint:
 * - POST /api/notifications/mark-read - Mark multiple notifications as read
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const MarkReadSchema = z.object({
  notification_ids: z.array(z.string().uuid()).min(1).max(100),
});

// ============================================================================
// POST /api/notifications/mark-read
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Auth check
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = MarkReadSchema.parse(body);

    // Update notifications (RLS ensures only user's notifications are updated)
    const { data: updatedNotifications, error: updateError } = await supabase
      .from('notifications')
      .update({
        is_read: true,
        updated_by: user.id,
      })
      .in('id', validatedData.notification_ids)
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .select('id');

    if (updateError) {
      console.error('Error marking notifications as read:', updateError);
      return NextResponse.json(
        { success: false, error: 'Failed to mark notifications as read' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        updated_count: updatedNotifications?.length || 0,
        notification_ids: updatedNotifications?.map((n) => n.id) || [],
      },
      message: `${updatedNotifications?.length || 0} notification(s) marked as read`,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid request body', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error in POST /api/notifications/mark-read:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
