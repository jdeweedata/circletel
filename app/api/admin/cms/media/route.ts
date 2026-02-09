/**
 * CMS Media Library API
 *
 * GET /api/admin/cms/media - List media with filters
 * POST /api/admin/cms/media - Upload new media
 */

import { NextRequest, NextResponse } from 'next/server';
import { apiLogger } from '@/lib/logging';
import { createClient } from '@/lib/supabase/server';
import type { CMSMedia } from '@/lib/cms/types';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Allow longer for uploads

const STORAGE_BUCKET = 'cms-media';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
];

// GET - List media
export async function GET(request: NextRequest) {
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

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const folder = searchParams.get('folder');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const mimeType = searchParams.get('mime_type');

    // Build query
    let query = supabase
      .from('pb_media')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (folder && folder !== 'all') {
      query = query.eq('folder', folder);
    }

    if (mimeType) {
      query = query.eq('mime_type', mimeType);
    }

    if (search) {
      query = query.or(`original_filename.ilike.%${search}%,alt_text.ilike.%${search}%`);
    }

    const { data: media, error, count } = await query;

    if (error) {
      apiLogger.error('Failed to fetch media:', error);
      return NextResponse.json({ error: 'Failed to fetch media' }, { status: 500 });
    }

    // Get folder counts
    const { data: folders } = await supabase
      .from('pb_media')
      .select('folder')
      .order('folder');

    const folderCounts: Record<string, number> = {};
    folders?.forEach((item) => {
      folderCounts[item.folder] = (folderCounts[item.folder] || 0) + 1;
    });

    return NextResponse.json({
      success: true,
      media: media || [],
      total: count || 0,
      limit,
      offset,
      folders: Object.entries(folderCounts).map(([name, count]) => ({ name, count })),
    });
  } catch (error) {
    apiLogger.error('Media API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Upload media
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

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const folder = (formData.get('folder') as string) || 'general';
    const altText = (formData.get('alt_text') as string) || '';
    const caption = (formData.get('caption') as string) || '';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `Invalid file type. Allowed: ${ALLOWED_MIME_TYPES.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File size exceeds 10MB limit' },
        { status: 400 }
      );
    }

    // Generate unique filename
    const fileExtension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 10);
    const filename = `${timestamp}-${randomId}.${fileExtension}`;

    // Create storage path: folder/YYYY/MM/filename
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const storagePath = `${folder}/${year}/${month}/${filename}`;

    // Read file as buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(storagePath, buffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      apiLogger.error('Storage upload error:', uploadError);
      return NextResponse.json(
        { error: 'Failed to upload file to storage' },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(storagePath);

    const publicUrl = urlData.publicUrl;

    // Get image dimensions if it's an image
    let width: number | null = null;
    let height: number | null = null;

    // Note: For server-side image dimension detection, you'd need sharp or similar
    // For now, we'll let the client provide these or leave them null

    // Insert media record
    const mediaData: Partial<CMSMedia> = {
      filename,
      original_filename: file.name,
      mime_type: file.type,
      file_size: file.size,
      storage_path: storagePath,
      public_url: publicUrl,
      alt_text: altText || undefined,
      caption: caption || undefined,
      width: width || undefined,
      height: height || undefined,
      metadata: {},
      uploaded_by: user.id,
      folder,
    };

    const { data: media, error: insertError } = await supabase
      .from('pb_media')
      .insert(mediaData)
      .select()
      .single();

    if (insertError) {
      apiLogger.error('Failed to insert media record:', insertError);
      // Try to clean up the uploaded file
      await supabase.storage.from(STORAGE_BUCKET).remove([storagePath]);
      return NextResponse.json(
        { error: 'Failed to save media record' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      media,
    }, { status: 201 });
  } catch (error) {
    apiLogger.error('Media upload error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
