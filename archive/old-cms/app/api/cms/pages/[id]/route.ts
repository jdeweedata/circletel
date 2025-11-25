/**
 * CMS Individual Page API Routes
 *
 * Handles operations on a specific page
 * Features:
 * - GET: Fetch page by ID
 * - PUT: Update page
 * - DELETE: Delete page
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { authenticateAdmin, requirePermission } from '@/lib/auth/admin-api-auth';

/**
 * GET /api/cms/pages/[id]
 *
 * Fetch a single page by ID
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    // 1. Authenticate
    const authResult = await authenticateAdmin(request);
    if (!authResult.success) {
      return authResult.response;
    }

    const { adminUser } = authResult;

    // 2. Check permission
    const permissionError = requirePermission(adminUser, 'cms:view');
    if (permissionError) {
      return permissionError;
    }

    const supabase = await createClient();

    // 3. Fetch page
    const { data: page, error } = await supabase
      .from('cms_pages')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Page not found' }, { status: 404 });
      }
      console.error('Page fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch page' }, { status: 500 });
    }

    // 4. Return page
    return NextResponse.json({ page });
  } catch (error) {
    console.error('Page fetch API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/cms/pages/[id]
 *
 * Update a page
 */
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    // 1. Authenticate
    const authResult = await authenticateAdmin(request);
    if (!authResult.success) {
      return authResult.response;
    }

    const { adminUser } = authResult;

    // 2. Check permission
    const permissionError = requirePermission(adminUser, 'cms:edit');
    if (permissionError) {
      return permissionError;
    }

    const supabase = await createClient();

    // 3. Parse request body
    const body = await request.json();
    const {
      title,
      slug,
      content,
      status,
      seo_metadata,
      featured_image,
      scheduled_at,
      thought_signature,
    } = body;

    // 4. Build update object
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (title !== undefined) updateData.title = title;
    if (slug !== undefined) {
      updateData.slug = slug
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
    }
    if (content !== undefined) updateData.content = content;
    if (status !== undefined) {
      updateData.status = status;
      // Set published_at when publishing
      if (status === 'published') {
        updateData.published_at = new Date().toISOString();
      }
    }
    if (seo_metadata !== undefined) updateData.seo_metadata = seo_metadata;
    if (featured_image !== undefined) updateData.featured_image = featured_image;
    if (scheduled_at !== undefined) updateData.scheduled_at = scheduled_at;
    if (thought_signature !== undefined) updateData.thought_signature = thought_signature;

    // 5. Update page
    const { data: page, error } = await supabase
      .from('cms_pages')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Page update error:', error);

      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Page not found' }, { status: 404 });
      }

      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'A page with this slug already exists' },
          { status: 409 }
        );
      }

      return NextResponse.json({ error: 'Failed to update page' }, { status: 500 });
    }

    // 6. Return updated page
    return NextResponse.json({ page });
  } catch (error) {
    console.error('Page update API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/cms/pages/[id]
 *
 * Delete a page
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    // 1. Authenticate
    const authResult = await authenticateAdmin(request);
    if (!authResult.success) {
      return authResult.response;
    }

    const { adminUser } = authResult;

    // 2. Check permission
    const permissionError = requirePermission(adminUser, 'cms:delete');
    if (permissionError) {
      return permissionError;
    }

    const supabase = await createClient();

    // 3. Delete page
    const { error } = await supabase.from('cms_pages').delete().eq('id', id);

    if (error) {
      console.error('Page delete error:', error);
      return NextResponse.json({ error: 'Failed to delete page' }, { status: 500 });
    }

    // 4. Return success
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Page delete API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
