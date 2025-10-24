/**
 * CircleTel Notification System - Preferences API
 *
 * Endpoints:
 * - GET /api/notifications/preferences - Get user notification preferences
 * - PUT /api/notifications/preferences - Update user notification preferences
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
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

const PreferenceSchema = z.object({
  notification_type: NotificationTypeSchema,
  in_app_enabled: z.boolean(),
  email_enabled: z.boolean(),
});

const UpdatePreferencesSchema = z.object({
  preferences: z.array(PreferenceSchema).min(1).max(10),
});

// ============================================================================
// GET /api/notifications/preferences
// ============================================================================

export async function GET(request: NextRequest) {
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

    // Fetch user preferences
    const { data: preferences, error: fetchError } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', user.id)
      .order('notification_type');

    if (fetchError) {
      console.error('Error fetching notification preferences:', fetchError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch preferences' },
        { status: 500 }
      );
    }

    // If no preferences exist, create defaults
    if (!preferences || preferences.length === 0) {
      const defaultPreferences = [
        { notification_type: 'product_approval', in_app_enabled: true, email_enabled: true },
        { notification_type: 'price_change', in_app_enabled: true, email_enabled: false },
        { notification_type: 'system_update', in_app_enabled: true, email_enabled: false },
        { notification_type: 'user_activity', in_app_enabled: true, email_enabled: false },
        { notification_type: 'error_alert', in_app_enabled: true, email_enabled: true },
        { notification_type: 'performance_warning', in_app_enabled: true, email_enabled: true },
      ];

      const { data: createdPreferences, error: createError } = await supabase
        .from('notification_preferences')
        .insert(
          defaultPreferences.map((pref) => ({
            user_id: user.id,
            ...pref,
          }))
        )
        .select();

      if (createError) {
        console.error('Error creating default preferences:', createError);
        return NextResponse.json(
          { success: false, error: 'Failed to create default preferences' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        data: createdPreferences,
      });
    }

    return NextResponse.json({
      success: true,
      data: preferences,
    });
  } catch (error) {
    console.error('Error in GET /api/notifications/preferences:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================================================
// PUT /api/notifications/preferences
// ============================================================================

export async function PUT(request: NextRequest) {
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
    const validatedData = UpdatePreferencesSchema.parse(body);

    // Upsert preferences (insert or update)
    const preferencesToUpsert = validatedData.preferences.map((pref) => ({
      user_id: user.id,
      notification_type: pref.notification_type,
      in_app_enabled: pref.in_app_enabled,
      email_enabled: pref.email_enabled,
      updated_by: user.id,
    }));

    const { data: updatedPreferences, error: upsertError } = await supabase
      .from('notification_preferences')
      .upsert(preferencesToUpsert, {
        onConflict: 'user_id,notification_type',
      })
      .select();

    if (upsertError) {
      console.error('Error updating notification preferences:', upsertError);
      return NextResponse.json(
        { success: false, error: 'Failed to update preferences' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedPreferences,
      message: 'Preferences updated successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid request body', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error in PUT /api/notifications/preferences:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
