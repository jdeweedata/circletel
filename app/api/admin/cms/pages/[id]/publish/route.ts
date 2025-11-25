/**
 * CMS Page Publish API
 *
 * POST /api/admin/cms/pages/[id]/publish - Publish or unpublish a page
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

// POST - Publish or unpublish a page
export async function POST(
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
    const { action } = body; // 'publish' | 'unpublish' | 'archive'

    if (!action || !['publish', 'unpublish', 'archive'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be publish, unpublish, or archive.' },
        { status: 400 }
      );
    }

    // Check if page exists
    const { data: page, error: pageError } = await supabase
      .from('pb_pages')
      .select('id, status, title, slug, content')
      .eq('id', id)
      .single();

    if (pageError || !page) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }

    // Validate content before publishing
    if (action === 'publish') {
      const content = page.content as { blocks?: unknown[] };
      if (!content?.blocks || content.blocks.length === 0) {
        return NextResponse.json(
          { error: 'Cannot publish a page without content' },
          { status: 400 }
        );
      }

      if (!page.title || !page.slug) {
        return NextResponse.json(
          { error: 'Page must have a title and slug to be published' },
          { status: 400 }
        );
      }
    }

    // Determine new status and timestamps
    let updateData: Record<string, unknown> = {};

    switch (action) {
      case 'publish':
        updateData = {
          status: 'published',
          published_at: new Date().toISOString(),
          scheduled_at: null,
        };
        break;
      case 'unpublish':
        updateData = {
          status: 'draft',
          published_at: null,
          scheduled_at: null,
        };
        break;
      case 'archive':
        updateData = {
          status: 'archived',
          scheduled_at: null,
        };
        break;
    }

    // Update page status
    const { data: updatedPage, error: updateError } = await supabase
      .from('pb_pages')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Publish error:', updateError);
      return NextResponse.json({ error: 'Failed to update page status' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      page: updatedPage,
      message: `Page ${action === 'publish' ? 'published' : action === 'unpublish' ? 'unpublished' : 'archived'} successfully`,
    });
  } catch (error) {
    console.error('Publish POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
