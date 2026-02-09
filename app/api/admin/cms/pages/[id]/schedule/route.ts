/**
 * CMS Page Schedule API
 *
 * POST /api/admin/cms/pages/[id]/schedule - Schedule a page for future publishing
 */

import { NextRequest, NextResponse } from 'next/server';
import { apiLogger } from '@/lib/logging';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

// POST - Schedule a page for future publishing
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
    const { scheduled_at, cancel } = body;

    // Check if page exists
    const { data: page, error: pageError } = await supabase
      .from('pb_pages')
      .select('id, status, title, slug, content')
      .eq('id', id)
      .single();

    if (pageError || !page) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }

    // Cancel scheduling
    if (cancel) {
      const { data: updatedPage, error: updateError } = await supabase
        .from('pb_pages')
        .update({
          status: 'draft',
          scheduled_at: null,
        })
        .eq('id', id)
        .select()
        .single();

      if (updateError) {
        apiLogger.error('Cancel schedule error:', updateError);
        return NextResponse.json({ error: 'Failed to cancel scheduling' }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        page: updatedPage,
        message: 'Scheduling cancelled',
      });
    }

    // Validate schedule date
    if (!scheduled_at) {
      return NextResponse.json(
        { error: 'Schedule date is required' },
        { status: 400 }
      );
    }

    const scheduleDate = new Date(scheduled_at);
    const now = new Date();

    if (isNaN(scheduleDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid schedule date' },
        { status: 400 }
      );
    }

    if (scheduleDate <= now) {
      return NextResponse.json(
        { error: 'Schedule date must be in the future' },
        { status: 400 }
      );
    }

    // Validate content before scheduling
    const content = page.content as { blocks?: unknown[] };
    if (!content?.blocks || content.blocks.length === 0) {
      return NextResponse.json(
        { error: 'Cannot schedule a page without content' },
        { status: 400 }
      );
    }

    if (!page.title || !page.slug) {
      return NextResponse.json(
        { error: 'Page must have a title and slug to be scheduled' },
        { status: 400 }
      );
    }

    // Update page with schedule
    const { data: updatedPage, error: updateError } = await supabase
      .from('pb_pages')
      .update({
        status: 'scheduled',
        scheduled_at: scheduleDate.toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      apiLogger.error('Schedule error:', updateError);
      return NextResponse.json({ error: 'Failed to schedule page' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      page: updatedPage,
      message: `Page scheduled for ${scheduleDate.toLocaleString()}`,
    });
  } catch (error) {
    apiLogger.error('Schedule POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
