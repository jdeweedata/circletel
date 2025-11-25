/**
 * CMS Pages API Routes
 *
 * Handles CRUD operations for pages
 * Features:
 * - GET: List pages with pagination, search, filter
 * - POST: Create new page
 * - Authentication and permission checks
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { authenticateAdmin, requirePermission } from '@/lib/auth/admin-api-auth';

/**
 * GET /api/cms/pages
 *
 * List pages with optional filters
 * Query params:
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 10)
 * - search: Search in title/slug
 * - status: Filter by status (draft, published, etc.)
 * - contentType: Filter by content type
 */
export async function GET(request: NextRequest) {
  try {
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

    // 3. Parse query params
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const contentType = searchParams.get('contentType') || '';

    const offset = (page - 1) * limit;

    // 4. Build query
    let query = supabase
      .from('cms_pages')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    // Apply filters
    if (search) {
      query = query.or(`title.ilike.%${search}%,slug.ilike.%${search}%`);
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (contentType) {
      query = query.eq('content_type', contentType);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    // 5. Execute query
    const { data: pages, error, count } = await query;

    if (error) {
      console.error('Pages fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch pages' }, { status: 500 });
    }

    // 6. Return response
    return NextResponse.json({
      pages,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error('Pages API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/cms/pages
 *
 * Create a new page
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate
    const authResult = await authenticateAdmin(request);
    if (!authResult.success) {
      return authResult.response;
    }

    const { adminUser, user } = authResult;

    // 2. Check permission
    const permissionError = requirePermission(adminUser, 'cms:create');
    if (permissionError) {
      return permissionError;
    }

    const supabase = await createClient();

    // 3. Parse request body
    const body = await request.json();
    const {
      slug,
      title,
      content_type,
      status = 'draft',
      content,
      seo_metadata,
      featured_image,
      scheduled_at,
      thought_signature,
    } = body;

    // 4. Validate required fields
    if (!slug || !title || !content_type || !content) {
      return NextResponse.json(
        { error: 'Missing required fields: slug, title, content_type, content' },
        { status: 400 }
      );
    }

    // 5. Generate slug if not provided or sanitize
    const sanitizedSlug = slug
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    // 6. Insert page
    const { data: page, error } = await supabase
      .from('cms_pages')
      .insert({
        slug: sanitizedSlug,
        title,
        content_type,
        status,
        content,
        seo_metadata,
        featured_image,
        author_id: user.id,
        scheduled_at,
        thought_signature,
        published_at: status === 'published' ? new Date().toISOString() : null,
      })
      .select()
      .single();

    if (error) {
      console.error('Page creation error:', error);

      // Check for unique constraint violation
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'A page with this slug already exists' },
          { status: 409 }
        );
      }

      return NextResponse.json(
        { error: 'Failed to create page' },
        { status: 500 }
      );
    }

    // 7. Return created page
    return NextResponse.json({ page }, { status: 201 });
  } catch (error) {
    console.error('Page creation API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
