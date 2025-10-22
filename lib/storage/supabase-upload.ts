/**
 * Supabase Storage Upload Utility
 * Handles file uploads to Supabase Storage with validation and error handling
 */

import { supabase } from '@/lib/supabase';
import type { KycDocumentType } from '@/lib/types/customer-journey';
import type { SupabaseClient } from '@supabase/supabase-js';

export interface UploadOptions {
  bucket: string;
  folder?: string;
  maxSizeBytes?: number;
  allowedTypes?: string[];
  supabaseClient?: SupabaseClient; // Optional custom client (e.g., with service role)
}

export interface UploadResult {
  success: boolean;
  path?: string;
  url?: string;
  error?: string;
}

const DEFAULT_MAX_SIZE = 5 * 1024 * 1024; // 5MB
const DEFAULT_ALLOWED_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'application/pdf',
];

/**
 * Validate file before upload
 */
export function validateFile(
  file: File,
  options: UploadOptions
): { valid: boolean; error?: string } {
  const maxSize = options.maxSizeBytes || DEFAULT_MAX_SIZE;
  const allowedTypes = options.allowedTypes || DEFAULT_ALLOWED_TYPES;

  // Check file size
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File size exceeds ${Math.round(maxSize / 1024 / 1024)}MB limit`,
    };
  }

  // Check file type
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `File type ${file.type} not allowed. Allowed types: PDF, JPG, PNG`,
    };
  }

  return { valid: true };
}

/**
 * Upload file to Supabase Storage
 */
export async function uploadFile(
  file: File,
  options: UploadOptions
): Promise<UploadResult> {
  try {
    // Validate file
    const validation = validateFile(file, options);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    // Use custom client if provided, otherwise use default
    const client = options.supabaseClient || supabase;

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const extension = file.name.split('.').pop();
    const filename = `${timestamp}_${randomString}.${extension}`;

    // Construct full path
    const folder = options.folder || '';
    const path = folder ? `${folder}/${filename}` : filename;

    // Upload to Supabase Storage
    const { data, error } = await client.storage
      .from(options.bucket)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('Supabase upload error:', error);
      return {
        success: false,
        error: error.message || 'Upload failed',
      };
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = client.storage.from(options.bucket).getPublicUrl(data.path);

    return {
      success: true,
      path: data.path,
      url: publicUrl,
    };
  } catch (error: any) {
    console.error('Upload error:', error);
    return {
      success: false,
      error: error.message || 'Unexpected error during upload',
    };
  }
}

/**
 * Upload KYC document
 * Convenience wrapper for uploading KYC documents
 */
export async function uploadKycDocument(
  file: File,
  orderId: string,
  documentType: KycDocumentType,
  supabaseClient?: SupabaseClient
): Promise<UploadResult> {
  return uploadFile(file, {
    bucket: 'kyc-documents',
    folder: `${orderId}/${documentType}`,
    maxSizeBytes: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'],
    supabaseClient, // Pass through the custom client
  });
}

/**
 * Delete file from Supabase Storage
 */
export async function deleteFile(
  bucket: string,
  path: string
): Promise<{ success: boolean; error?: string }> {
  try {

    const { error } = await supabase.storage.from(bucket).remove([path]);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Get signed URL for private file (expires in 1 hour)
 */
export async function getSignedUrl(
  bucket: string,
  path: string,
  expiresIn: number = 3600
): Promise<{ url?: string; error?: string }> {
  try {

    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, expiresIn);

    if (error) {
      return { error: error.message };
    }

    return { url: data.signedUrl };
  } catch (error: any) {
    return { error: error.message };
  }
}
