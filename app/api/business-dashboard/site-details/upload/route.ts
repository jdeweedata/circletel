/**
 * Business Dashboard Site Details Upload API
 *
 * POST /api/business-dashboard/site-details/upload - Upload site photos
 * DELETE /api/business-dashboard/site-details/upload - Delete site photo
 *
 * @module app/api/business-dashboard/site-details/upload/route
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { SitePhoto } from '@/types/site-details';

const BUCKET_NAME = 'site-photos';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/heic'];

// ============================================================================
// POST - Upload site photos
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get business customer record
    const { data: businessCustomer, error: customerError } = await supabase
      .from('business_customers')
      .select('id')
      .eq('auth_user_id', user.id)
      .single();

    if (customerError || !businessCustomer) {
      return NextResponse.json(
        { error: 'Business customer not found' },
        { status: 404 }
      );
    }

    // Parse multipart form data
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 });
    }

    const uploadedPhotos: SitePhoto[] = [];
    const errors: string[] = [];

    for (const file of files) {
      // Validate file type
      if (!ALLOWED_TYPES.includes(file.type)) {
        errors.push(`${file.name}: Invalid file type. Only JPG, PNG, and HEIC are allowed.`);
        continue;
      }

      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        errors.push(`${file.name}: File too large. Maximum size is 10MB.`);
        continue;
      }

      // Generate unique filename
      const timestamp = Date.now();
      const extension = file.name.split('.').pop() || 'jpg';
      const filename = `${businessCustomer.id}/${timestamp}-${Math.random().toString(36).substring(7)}.${extension}`;

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filename, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        errors.push(`${file.name}: Upload failed`);
        continue;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(uploadData.path);

      uploadedPhotos.push({
        url: urlData.publicUrl,
        filename: file.name,
        uploaded_at: new Date().toISOString(),
      });
    }

    if (uploadedPhotos.length === 0 && errors.length > 0) {
      return NextResponse.json(
        { error: 'All uploads failed', errors },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      photos: uploadedPhotos,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('Error uploading site photos:', error);
    return NextResponse.json(
      { error: 'Failed to upload photos' },
      { status: 500 }
    );
  }
}

// ============================================================================
// DELETE - Remove site photo
// ============================================================================

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get business customer record
    const { data: businessCustomer, error: customerError } = await supabase
      .from('business_customers')
      .select('id')
      .eq('auth_user_id', user.id)
      .single();

    if (customerError || !businessCustomer) {
      return NextResponse.json(
        { error: 'Business customer not found' },
        { status: 404 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { url } = body as { url: string };

    if (!url) {
      return NextResponse.json({ error: 'Photo URL required' }, { status: 400 });
    }

    // Extract path from URL
    // URL format: https://{project}.supabase.co/storage/v1/object/public/site-photos/{path}
    const urlParts = url.split('/');
    const bucketIndex = urlParts.indexOf(BUCKET_NAME);
    if (bucketIndex === -1) {
      return NextResponse.json({ error: 'Invalid photo URL' }, { status: 400 });
    }

    const path = urlParts.slice(bucketIndex + 1).join('/');

    // Verify the photo belongs to this customer (path starts with customer ID)
    if (!path.startsWith(businessCustomer.id)) {
      return NextResponse.json(
        { error: 'Cannot delete this photo' },
        { status: 403 }
      );
    }

    // Delete from Supabase Storage
    const { error: deleteError } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([path]);

    if (deleteError) {
      console.error('Delete error:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete photo' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Photo deleted',
    });
  } catch (error) {
    console.error('Error deleting site photo:', error);
    return NextResponse.json(
      { error: 'Failed to delete photo' },
      { status: 500 }
    );
  }
}
