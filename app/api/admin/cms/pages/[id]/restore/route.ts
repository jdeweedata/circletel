/**
 * CMS Page Version Restore API
 *
 * POST /api/admin/cms/pages/[id]/restore - Restore a previous version
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

// POST - Restore a previous version
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
    const { version } = body;

    if (!version || typeof version !== 'number') {
      return NextResponse.json(
        { error: 'Version number is required' },
        { status: 400 }
      );
    }

    // Check if page exists
    const { data: page, error: pageError } = await supabase
      .from('pb_pages')
      .select('id, version')
      .eq('id', id)
      .single();

    if (pageError || !page) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }

    // Get the version to restore
    const { data: versionData, error: versionError } = await supabase
      .from('pb_page_versions')
      .select('content, seo_metadata')
      .eq('page_id', id)
      .eq('version', version)
      .single();

    if (versionError || !versionData) {
      return NextResponse.json({ error: 'Version not found' }, { status: 404 });
    }

    // Update page with restored content
    // This will trigger the version increment automatically
    const { data: updatedPage, error: updateError } = await supabase
      .from('pb_pages')
      .update({
        content: versionData.content,
        seo_metadata: versionData.seo_metadata || {},
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Version restore error:', updateError);
      return NextResponse.json({ error: 'Failed to restore version' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      page: updatedPage,
      message: `Restored to version ${version}`,
    });
  } catch (error) {
    console.error('Restore POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
