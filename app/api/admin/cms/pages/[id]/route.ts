/**
 * CMS Pages API - Single Page Operations
 *
 * GET /api/admin/cms/pages/[id] - Get single page
 * PUT /api/admin/cms/pages/[id] - Update page
 * PATCH /api/admin/cms/pages/[id] - Partial update
 * DELETE /api/admin/cms/pages/[id] - Delete page
 *
 * Note: Uses service role to bypass RLS. Admin access is controlled
 * at the routing/layout level (admin pages require admin session).
 */

import { NextRequest, NextResponse } from 'next/server';
import { apiLogger } from '@/lib/logging';
import { createClient } from '@supabase/supabase-js';
import type { PageStatus } from '@/lib/cms/types';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

// Create service role client (bypasses RLS - admin only endpoint)
function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
}

// GET - Get single page
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const supabase = getServiceClient();

    const { data: page, error } = await supabase
      .from('pb_pages')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !page) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, page });
  } catch (error) {
    apiLogger.error('Get page error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Full update
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const supabase = getServiceClient();
    const body = await request.json();

    // Build update data
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    // Only include provided fields
    if (body.title !== undefined) updateData.title = body.title;
    if (body.slug !== undefined) updateData.slug = body.slug;
    if (body.content !== undefined) updateData.content = body.content;
    if (body.content_type !== undefined) updateData.content_type = body.content_type;
    if (body.status !== undefined) {
      updateData.status = body.status;
      if (body.status === 'published') {
        updateData.published_at = new Date().toISOString();
      }
    }
    if (body.seo_metadata !== undefined) updateData.seo_metadata = body.seo_metadata;
    if (body.theme !== undefined) updateData.theme = body.theme;

    // Check if slug is being changed and if new slug exists
    if (body.slug) {
      const { data: existing } = await supabase
        .from('pb_pages')
        .select('id')
        .eq('slug', body.slug)
        .neq('id', id)
        .single();

      if (existing) {
        return NextResponse.json(
          { error: 'A page with this slug already exists' },
          { status: 400 }
        );
      }
    }

    const { data: page, error } = await supabase
      .from('pb_pages')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      apiLogger.error('Failed to update page:', error);
      return NextResponse.json({ error: 'Failed to update page' }, { status: 500 });
    }

    // Note: Version is auto-incremented by database trigger when content changes

    return NextResponse.json({ success: true, page });
  } catch (error) {
    apiLogger.error('Update page error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH - Partial update
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const supabase = getServiceClient();
    const body = await request.json();

    // Build update data with only provided fields
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (body.status !== undefined) {
      updateData.status = body.status;
      if (body.status === 'published') {
        updateData.published_at = new Date().toISOString();
      }
    }
    if (body.title !== undefined) updateData.title = body.title;
    if (body.slug !== undefined) updateData.slug = body.slug;

    const { data: page, error } = await supabase
      .from('pb_pages')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      apiLogger.error('Failed to patch page:', error);
      return NextResponse.json({ error: 'Failed to update page' }, { status: 500 });
    }

    return NextResponse.json({ success: true, page });
  } catch (error) {
    apiLogger.error('Patch page error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete page
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const supabase = getServiceClient();

    // Soft delete by setting status to archived, or hard delete
    const { searchParams } = new URL(request.url);
    const hardDelete = searchParams.get('hard') === 'true';

    if (hardDelete) {
      // Hard delete - remove from database
      const { error } = await supabase.from('pb_pages').delete().eq('id', id);

      if (error) {
        apiLogger.error('Failed to delete page:', error);
        return NextResponse.json({ error: 'Failed to delete page' }, { status: 500 });
      }
    } else {
      // Soft delete - archive the page
      const { error } = await supabase
        .from('pb_pages')
        .update({
          status: 'archived' as PageStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) {
        apiLogger.error('Failed to archive page:', error);
        return NextResponse.json({ error: 'Failed to archive page' }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    apiLogger.error('Delete page error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
