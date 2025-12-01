/**
 * Scrape Status API
 *
 * GET /api/admin/competitor-analysis/scrape/[id]
 * Returns the status of a specific scrape job.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, context: RouteParams) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();

    // Get the scrape log with provider details
    const { data, error } = await supabase
      .from('competitor_scrape_logs')
      .select(`
        *,
        competitor_providers (
          id,
          name,
          slug,
          logo_url
        )
      `)
      .eq('id', id)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: 'Scrape job not found' },
        { status: 404 }
      );
    }

    // Calculate duration if completed
    let durationMs: number | null = null;
    if (data.started_at && data.completed_at) {
      durationMs = new Date(data.completed_at).getTime() - new Date(data.started_at).getTime();
    }

    return NextResponse.json({
      ...data,
      duration_ms: durationMs,
    });
  } catch (error) {
    console.error('[Scrape Status API] GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch scrape status' },
      { status: 500 }
    );
  }
}
