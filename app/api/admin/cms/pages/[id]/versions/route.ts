/**
 * CMS Page Versions API
 *
 * GET /api/admin/cms/pages/[id]/versions - Get version history
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

// GET - Get version history for a page
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

    // Check if page exists
    const { data: page, error: pageError } = await supabase
      .from('pb_pages')
      .select('id, title, version')
      .eq('id', id)
      .single();

    if (pageError || !page) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }

    // Get version history
    const { data: versions, error } = await supabase
      .from('pb_page_versions')
      .select('*, admin_users!pb_page_versions_created_by_fkey(email, full_name)')
      .eq('page_id', id)
      .order('version', { ascending: false });

    if (error) {
      console.error('Versions fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch versions' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      currentVersion: page.version,
      versions: versions || [],
    });
  } catch (error) {
    console.error('Versions GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
