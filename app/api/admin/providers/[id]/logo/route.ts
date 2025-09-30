// Provider Logo Upload API
import { NextRequest, NextResponse } from 'next/server';
import { mtnWMSClient } from '@/lib/coverage/mtn/wms-client';
import path from 'path';
import { writeFile, mkdir } from 'fs/promises';
import sharp from 'sharp';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/svg+xml', 'image/webp'];
const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'provider-logos');

// Upload provider logo
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params;

    // Verify provider exists
    const { data: provider, error: providerError } = await mtnWMSClient.supabase
      .from('network_providers')
      .select('id, name')
      .eq('id', id)
      .single();

    if (providerError || !provider) {
      return NextResponse.json({
        success: false,
        error: 'Provider not found',
        code: 'NOT_FOUND'
      }, { status: 404 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({
        success: false,
        error: 'No file provided',
        code: 'NO_FILE'
      }, { status: 400 });
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid file type. Only JPEG, PNG, SVG, and WebP are allowed',
        code: 'INVALID_FILE_TYPE'
      }, { status: 400 });
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({
        success: false,
        error: 'File too large. Maximum size is 5MB',
        code: 'FILE_TOO_LARGE'
      }, { status: 400 });
    }

    // Create upload directory if it doesn't exist
    await mkdir(UPLOAD_DIR, { recursive: true });

    // Generate filename
    const timestamp = Date.now();
    const sanitizedName = provider.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const extension = path.extname(file.name) || '.png';
    const filename = `${sanitizedName}_${timestamp}${extension}`;
    const filePath = path.join(UPLOAD_DIR, filename);
    const relativePath = `/uploads/provider-logos/${filename}`;

    // Process image with Sharp (resize and optimize)
    const buffer = Buffer.from(await file.arrayBuffer());
    let processedBuffer = buffer;
    let dimensions = { width: 0, height: 0 };

    if (file.type !== 'image/svg+xml') {
      const image = sharp(buffer);
      const metadata = await image.metadata();

      dimensions = {
        width: metadata.width || 0,
        height: metadata.height || 0
      };

      // Resize if too large (max 200x200)
      if (metadata.width && metadata.height && (metadata.width > 200 || metadata.height > 200)) {
        processedBuffer = await image
          .resize(200, 200, { fit: 'inside', withoutEnlargement: true })
          .jpeg({ quality: 90 })
          .toBuffer();
      }
    }

    // Save file
    await writeFile(filePath, processedBuffer);

    // Delete old logo if exists
    const { data: existingLogo } = await mtnWMSClient.supabase
      .from('provider_logos')
      .select('id, file_path')
      .eq('provider_id', id)
      .single();

    if (existingLogo) {
      // Delete old logo file (optional - could keep for backup)
      // await unlink(path.join(process.cwd(), 'public', existingLogo.file_path)).catch(() => {});

      // Delete old logo record
      await mtnWMSClient.supabase
        .from('provider_logos')
        .delete()
        .eq('id', existingLogo.id);
    }

    // Save logo record to database
    const { data: logoRecord, error: logoError } = await mtnWMSClient.supabase
      .from('provider_logos')
      .insert([{
        provider_id: id,
        filename,
        original_name: file.name,
        mime_type: file.type,
        file_size: processedBuffer.length,
        file_path: relativePath,
        dimensions: file.type !== 'image/svg+xml' ? dimensions : null
      }])
      .select()
      .single();

    if (logoError) {
      throw logoError;
    }

    // Update provider record with logo_id
    await mtnWMSClient.supabase
      .from('network_providers')
      .update({ logo_id: logoRecord.id })
      .eq('id', id);

    return NextResponse.json({
      success: true,
      data: {
        id: logoRecord.id,
        filename,
        originalName: file.name,
        filePath: relativePath,
        fileSize: processedBuffer.length,
        dimensions,
        mimeType: file.type
      }
    });

  } catch (error) {
    console.error('Error uploading logo:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to upload logo',
      code: 'UPLOAD_ERROR'
    }, { status: 500 });
  }
}

// Delete provider logo
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params;

    // Get current logo
    const { data: provider, error } = await mtnWMSClient.supabase
      .from('network_providers')
      .select(`
        logo_id,
        provider_logos (
          id,
          file_path
        )
      `)
      .eq('id', id)
      .single();

    if (error || !provider || !provider.logo_id) {
      return NextResponse.json({
        success: false,
        error: 'No logo found for this provider',
        code: 'NO_LOGO'
      }, { status: 404 });
    }

    // Remove logo_id from provider
    await mtnWMSClient.supabase
      .from('network_providers')
      .update({ logo_id: null })
      .eq('id', id);

    // Delete logo record
    await mtnWMSClient.supabase
      .from('provider_logos')
      .delete()
      .eq('id', provider.logo_id);

    // Optionally delete file from filesystem
    // const logoPath = path.join(process.cwd(), 'public', provider.provider_logos.file_path);
    // await unlink(logoPath).catch(() => {});

    return NextResponse.json({
      success: true,
      message: 'Logo deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting logo:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to delete logo',
      code: 'DELETE_ERROR'
    }, { status: 500 });
  }
}