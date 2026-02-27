/**
 * Admin Marketing Asset API - Individual Asset Operations
 *
 * GET /api/admin/marketing/assets/[id] - Get single asset
 * PUT /api/admin/marketing/assets/[id] - Update asset
 * DELETE /api/admin/marketing/assets/[id] - Delete asset
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  getAssetById,
  updateAsset,
  deleteAsset,
  type AssetCategory,
  type AssetVisibility,
} from '@/lib/marketing/asset-service';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
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

    const asset = await getAssetById(id);

    if (!asset) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
    }

    return NextResponse.json({ asset });
  } catch (error) {
    console.error('Admin asset GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
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

    // Check if asset exists
    const existingAsset = await getAssetById(id);
    if (!existingAsset) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
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
      is_active,
    } = body;

    // Build update object with only provided fields
    const updates: Record<string, unknown> = {};

    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (category !== undefined) updates.category = category as AssetCategory;
    if (subcategory !== undefined) updates.subcategory = subcategory;
    if (file_url !== undefined) updates.file_url = file_url;
    if (file_name !== undefined) updates.file_name = file_name;
    if (file_size !== undefined) updates.file_size = file_size;
    if (mime_type !== undefined) updates.mime_type = mime_type;
    if (width !== undefined) updates.width = width;
    if (height !== undefined) updates.height = height;
    if (duration !== undefined) updates.duration = duration;
    if (variations !== undefined) updates.variations = variations;
    if (visibility !== undefined) updates.visibility = visibility as AssetVisibility;
    if (requires_approval !== undefined) updates.requires_approval = requires_approval;
    if (tags !== undefined) updates.tags = tags;
    if (metadata !== undefined) updates.metadata = metadata;
    if (is_active !== undefined) updates.is_active = is_active;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      );
    }

    const result = await updateAsset(id, updates);

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ asset: result.asset });
  } catch (error) {
    console.error('Admin asset PUT error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
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

    // Check if asset exists
    const existingAsset = await getAssetById(id);
    if (!existingAsset) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
    }

    const result = await deleteAsset(id);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin asset DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
