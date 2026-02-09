/**
 * CMS Preview API
 *
 * POST /api/admin/cms/preview - Generate preview token
 * GET /api/admin/cms/preview - Get preview page data
 */

import { NextRequest, NextResponse } from 'next/server';
import { apiLogger } from '@/lib/logging';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

// Generate a simple preview token
function generatePreviewToken(): string {
  return `preview_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

// POST - Generate preview token and set cookie
export async function POST(request: NextRequest) {
  try {
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
    const { pageId } = body;

    if (!pageId) {
      return NextResponse.json({ error: 'Page ID required' }, { status: 400 });
    }

    // Verify page exists
    const { data: page, error: pageError } = await supabase
      .from('pb_pages')
      .select('id, slug, title')
      .eq('id', pageId)
      .single();

    if (pageError || !page) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }

    // Generate preview token
    const token = generatePreviewToken();

    // Store token in database (expires in 1 hour)
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();

    // Use a simple in-memory approach for now
    // In production, you'd store this in a database table

    // Set preview cookie
    const cookieStore = await cookies();
    cookieStore.set('cms_preview_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60, // 1 hour
      path: '/',
    });

    // Store page ID with token
    cookieStore.set('cms_preview_page', pageId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60, // 1 hour
      path: '/',
    });

    const previewUrl = `/p/preview/${page.slug}?token=${token}`;

    return NextResponse.json({
      success: true,
      previewUrl,
      token,
      expiresAt,
    });
  } catch (error) {
    apiLogger.error('Preview token generation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET - Validate preview token and return page data
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    const pageId = searchParams.get('pageId');

    if (!token || !pageId) {
      return NextResponse.json({ error: 'Token and pageId required' }, { status: 400 });
    }

    // Validate token from cookie
    const cookieStore = await cookies();
    const storedToken = cookieStore.get('cms_preview_token')?.value;
    const storedPageId = cookieStore.get('cms_preview_page')?.value;

    if (token !== storedToken || pageId !== storedPageId) {
      return NextResponse.json({ error: 'Invalid or expired preview token' }, { status: 401 });
    }

    const supabase = await createClient();

    // Fetch page (regardless of status for preview)
    const { data: page, error } = await supabase
      .from('pb_pages')
      .select('*')
      .eq('id', pageId)
      .single();

    if (error || !page) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, page });
  } catch (error) {
    apiLogger.error('Preview fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Clear preview mode
export async function DELETE() {
  try {
    const cookieStore = await cookies();

    cookieStore.delete('cms_preview_token');
    cookieStore.delete('cms_preview_page');

    return NextResponse.json({ success: true });
  } catch (error) {
    apiLogger.error('Preview clear error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
