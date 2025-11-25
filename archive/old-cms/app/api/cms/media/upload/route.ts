/**
 * CMS Media Upload API Route
 *
 * Handles file uploads to Supabase Storage for CMS media
 * Features:
 * - Authentication required
 * - Permission check (cms:create or cms:edit)
 * - File validation (type, size)
 * - Automatic filename sanitization
 * - Unique filename generation
 * - Public URL generation
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { authenticateAdmin, requirePermission } from '@/lib/auth/admin-api-auth';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'];

/**
 * POST /api/cms/media/upload
 *
 * Upload a file to Supabase Storage
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user
    const authResult = await authenticateAdmin(request);
    if (!authResult.success) {
      return authResult.response;
    }

    const { adminUser } = authResult;

    // 2. Check permissions (user needs cms:create or cms:edit)
    const permissionError = requirePermission(adminUser, ['cms:create', 'cms:edit']);
    if (permissionError) {
      return permissionError;
    }

    const supabase = await createClient();

    // 3. Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const bucket = (formData.get('bucket') as string) || 'cms-media';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // 4. Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          error: `Invalid file type: ${file.type}. Allowed types: ${ALLOWED_TYPES.join(', ')}`,
        },
        { status: 400 }
      );
    }

    // 5. Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          error: `File too large: ${(file.size / 1024 / 1024).toFixed(2)}MB. Max size: ${
            MAX_FILE_SIZE / 1024 / 1024
          }MB`,
        },
        { status: 400 }
      );
    }

    // 6. Sanitize filename and generate unique name
    const fileExt = file.name.split('.').pop();
    const sanitizedName = file.name
      .replace(/\.[^/.]+$/, '') // Remove extension
      .replace(/[^a-z0-9]/gi, '_') // Replace special chars with underscore
      .toLowerCase();

    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const uniqueFilename = `${sanitizedName}_${timestamp}_${randomSuffix}.${fileExt}`;

    // 7. Convert File to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 8. Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(uniqueFilename, buffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.error('Supabase Storage upload error:', uploadError);
      return NextResponse.json(
        { error: `Upload failed: ${uploadError.message}` },
        { status: 500 }
      );
    }

    // 9. Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from(bucket).getPublicUrl(uploadData.path);

    // 10. Track upload in database (optional - for analytics)
    // TODO: Insert into cms_media_uploads table for tracking

    // 11. Return success response
    return NextResponse.json({
      success: true,
      url: publicUrl,
      filename: uniqueFilename,
      size: file.size,
      type: file.type,
    });
  } catch (error) {
    console.error('Media upload error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Upload failed' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/cms/media/upload
 *
 * Get upload configuration and limits
 */
export async function GET() {
  return NextResponse.json({
    maxFileSize: MAX_FILE_SIZE,
    maxFileSizeMB: MAX_FILE_SIZE / 1024 / 1024,
    allowedTypes: ALLOWED_TYPES,
    bucket: 'cms-media',
  });
}
