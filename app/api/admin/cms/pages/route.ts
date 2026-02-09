/**
 * CMS Pages API - List and Create
 *
 * GET /api/admin/cms/pages - List all pages with filtering
 * POST /api/admin/cms/pages - Create a new page
 *
 * Note: Uses service role to bypass RLS. Admin access is controlled
 * at the routing/layout level (admin pages require admin session).
 */

import { NextRequest, NextResponse } from 'next/server';
import { apiLogger } from '@/lib/logging';
import { createClient } from '@supabase/supabase-js';
import type { PageStatus, ContentType } from '@/lib/cms/types';

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

// GET - List pages
export async function GET(request: NextRequest) {
  try {
    const supabase = getServiceClient();

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as PageStatus | null;
    const contentType = searchParams.get('content_type') as ContentType | null;
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build query
    let query = supabase
      .from('pb_pages')
      .select('*', { count: 'exact' })
      .order('updated_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq('status', status);
    }

    if (contentType) {
      query = query.eq('content_type', contentType);
    }

    const { data: pages, error, count } = await query;

    if (error) {
      apiLogger.error('Failed to fetch pages:', error);
      return NextResponse.json({ error: 'Failed to fetch pages' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      pages: pages || [],
      total: count || 0,
      limit,
      offset,
    });
  } catch (error) {
    apiLogger.error('Pages API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create page
export async function POST(request: NextRequest) {
  try {
    const supabase = getServiceClient();
    const body = await request.json();

    // Validate required fields
    if (!body.title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    // Generate slug if not provided
    const slug =
      body.slug ||
      body.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

    // Check if slug exists
    const { data: existing } = await supabase
      .from('pb_pages')
      .select('id')
      .eq('slug', slug)
      .single();

    if (existing) {
      return NextResponse.json({ error: 'A page with this slug already exists' }, { status: 400 });
    }

    // Create page (created_by/updated_by are optional for service role)
    const pageData = {
      title: body.title,
      slug,
      content_type: body.content_type || 'landing',
      status: 'draft' as PageStatus,
      content: body.content || { blocks: [] },
      seo_metadata: body.seo_metadata || {},
      theme: body.theme || 'light',
    };

    const { data: page, error } = await supabase
      .from('pb_pages')
      .insert(pageData)
      .select()
      .single();

    if (error) {
      apiLogger.error('Failed to create page:', error);
      return NextResponse.json({ error: 'Failed to create page' }, { status: 500 });
    }

    return NextResponse.json({ success: true, page }, { status: 201 });
  } catch (error) {
    apiLogger.error('Create page error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update page (batch update)
export async function PUT(request: NextRequest) {
  try {
    const supabase = getServiceClient();
    const body = await request.json();

    if (!body.id) {
      return NextResponse.json({ error: 'Page ID is required' }, { status: 400 });
    }

    // Build update data
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    // Only include provided fields
    if (body.title !== undefined) updateData.title = body.title;
    if (body.slug !== undefined) updateData.slug = body.slug;
    if (body.content !== undefined) updateData.content = body.content;
    if (body.content_type !== undefined) updateData.content_type = body.content_type;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.seo_metadata !== undefined) updateData.seo_metadata = body.seo_metadata;
    if (body.theme !== undefined) updateData.theme = body.theme;

    // Handle publish
    if (body.status === 'published') {
      updateData.published_at = new Date().toISOString();
    }

    const { data: page, error } = await supabase
      .from('pb_pages')
      .update(updateData)
      .eq('id', body.id)
      .select()
      .single();

    if (error) {
      apiLogger.error('Failed to update page:', error);
      return NextResponse.json({ error: 'Failed to update page' }, { status: 500 });
    }

    return NextResponse.json({ success: true, page });
  } catch (error) {
    apiLogger.error('Update page error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
