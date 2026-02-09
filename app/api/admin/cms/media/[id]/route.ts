/**
 * CMS Media Item API
 *
 * GET /api/admin/cms/media/[id] - Get single media item
 * PATCH /api/admin/cms/media/[id] - Update media metadata
 * DELETE /api/admin/cms/media/[id] - Delete media
 */

import { NextRequest, NextResponse } from 'next/server';
import { apiLogger } from '@/lib/logging';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const STORAGE_BUCKET = 'cms-media';

// GET - Get single media item
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();

    // Verify admin authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: media, error } = await supabase
      .from('pb_media')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !media) {
      return NextResponse.json({ error: 'Media not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, media });
  } catch (error) {
    apiLogger.error('Media GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH - Update media metadata
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();

    // Verify admin authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Only allow updating certain fields
    const allowedFields = ['alt_text', 'caption', 'folder', 'metadata'];
    const updateData: Record<string, unknown> = {};

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      );
    }

    const { data: media, error } = await supabase
      .from('pb_media')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      apiLogger.error('Media update error:', error);
      return NextResponse.json({ error: 'Failed to update media' }, { status: 500 });
    }

    return NextResponse.json({ success: true, media });
  } catch (error) {
    apiLogger.error('Media PATCH error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete media
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();

    // Verify admin authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // First get the media to find the storage path
    const { data: media, error: fetchError } = await supabase
      .from('pb_media')
      .select('storage_path')
      .eq('id', id)
      .single();

    if (fetchError || !media) {
      return NextResponse.json({ error: 'Media not found' }, { status: 404 });
    }

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .remove([media.storage_path]);

    if (storageError) {
      apiLogger.error('Storage delete error:', storageError);
      // Continue to delete the database record even if storage delete fails
    }

    // Delete from database
    const { error: deleteError } = await supabase
      .from('pb_media')
      .delete()
      .eq('id', id);

    if (deleteError) {
      apiLogger.error('Media delete error:', deleteError);
      return NextResponse.json({ error: 'Failed to delete media' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    apiLogger.error('Media DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
