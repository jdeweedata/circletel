/**
 * Admin Marketing Assets API
 *
 * GET - List all assets with filters
 * POST - Create a new asset
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  getAssets,
  createAsset,
  type AssetCategory,
  type AssetVisibility,
} from '@/lib/marketing/asset-service';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify admin user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if admin
    const { data: adminUser } = await supabase
      .from('admin_users')
      .select('id')
      .eq('id', user.id)
      .single();

    if (!adminUser) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Parse query params
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category') as AssetCategory | null;
    const visibility = searchParams.get('visibility') as AssetVisibility | null;
    const search = searchParams.get('search');
    const isActive = searchParams.get('is_active');
    const limit = searchParams.get('limit');
    const offset = searchParams.get('offset');

    const { assets, total } = await getAssets({
      category: category || undefined,
      visibility: visibility || undefined,
      search: search || undefined,
      isActive: isActive === null ? undefined : isActive === 'true',
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined,
    });

    return NextResponse.json({ assets, total });
  } catch (error) {
    console.error('Admin assets GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify admin user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if admin
    const { data: adminUser } = await supabase
      .from('admin_users')
      .select('id')
      .eq('id', user.id)
      .single();

    if (!adminUser) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Parse request body
    const body = await request.json();

    const {
      title,
      description,
      category,
      subcategory,
      file_url,
      file_name,
      file_size,
      mime_type,
      width,
      height,
      duration,
      variations,
      visibility,
      requires_approval,
      tags,
      metadata,
    } = body;

    // Validate required fields
    if (!title || !category || !file_url || !file_name) {
      return NextResponse.json(
        { error: 'Title, category, file_url, and file_name are required' },
        { status: 400 }
      );
    }

    const result = await createAsset(
      {
        title,
        description,
        category,
        subcategory,
        file_url,
        file_name,
        file_size,
        mime_type,
        width,
        height,
        duration,
        variations,
        visibility,
        requires_approval,
        tags,
        metadata,
      },
      user.id
    );

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ asset: result.asset }, { status: 201 });
  } catch (error) {
    console.error('Admin assets POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
