/**
 * File Upload Utility
 * Handles file validation, upload to Supabase Storage, and error handling
 */

import { createClient } from '@/lib/supabase/client'
import type { FICADocumentType, RICADocumentType } from '@/lib/types/fica-rica'
import {
  isValidFileType,
  isValidFileSize,
  isValidFileExtension,
  getFileExtension,
  MAX_FILE_SIZE,
  MAX_FILE_SIZE_LARGE,
} from '@/lib/types/fica-rica'

export interface FileUploadResult {
  success: boolean
  fileUrl?: string
  filePath?: string
  fileName?: string
  fileSize?: number
  error?: string
}

export interface FileValidationResult {
  valid: boolean
  errors: string[]
}

export interface UploadProgress {
  loaded: number
  total: number
  percentage: number
}

/**
 * Validate a file before upload
 */
export function validateFile(
  file: File,
  documentType: FICADocumentType | RICADocumentType
): FileValidationResult {
  const errors: string[] = []

  // Check file type
  if (!isValidFileType(file)) {
    errors.push('File type not accepted. Please upload PDF, JPG, or PNG files only.')
  }

  // Check file extension
  if (!isValidFileExtension(file.name)) {
    errors.push('Invalid file extension. Accepted: .pdf, .jpg, .jpeg, .png')
  }

  // Check file size (lease agreements can be larger)
  const maxSize = documentType === 'proof_of_address' && file.name.toLowerCase().includes('lease')
    ? MAX_FILE_SIZE_LARGE
    : MAX_FILE_SIZE

  if (!isValidFileSize(file, maxSize)) {
    const maxSizeMB = maxSize / (1024 * 1024)
    errors.push(`File size exceeds ${maxSizeMB}MB limit. Please compress or reduce file size.`)
  }

  // Check if file is empty
  if (file.size === 0) {
    errors.push('File is empty. Please select a valid file.')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Validate multiple files
 */
export function validateFiles(
  files: File[],
  documentType: FICADocumentType | RICADocumentType
): FileValidationResult {
  const allErrors: string[] = []

  files.forEach((file, index) => {
    const result = validateFile(file, documentType)
    if (!result.valid) {
      result.errors.forEach(error => {
        allErrors.push(`File ${index + 1} (${file.name}): ${error}`)
      })
    }
  })

  return {
    valid: allErrors.length === 0,
    errors: allErrors,
  }
}

/**
 * Generate unique file name with timestamp
 */
export function generateUniqueFileName(originalFileName: string): string {
  const timestamp = Date.now()
  const extension = getFileExtension(originalFileName)
  const nameWithoutExt = originalFileName.slice(0, originalFileName.lastIndexOf('.'))
  const sanitizedName = nameWithoutExt
    .replace(/[^a-zA-Z0-9-_]/g, '_')
    .substring(0, 50) // Limit length

  return `${sanitizedName}_${timestamp}${extension}`
}

/**
 * Upload file to Supabase Storage and save metadata via API
 *
 * @param file - File to upload
 * @param orderId - Order ID
 * @param customerId - Customer ID
 * @param documentType - FICA or RICA document type
 * @param category - 'fica' or 'rica'
 * @param onProgress - Optional progress callback
 * @returns Upload result with file URL and path
 */
export async function uploadFileToStorage(
  file: File,
  orderId: string,
  customerId: string,
  documentType: FICADocumentType | RICADocumentType,
  category: 'fica' | 'rica',
  onProgress?: (progress: UploadProgress) => void
): Promise<FileUploadResult> {
  try {
    const supabase = createClient()

    // Validate file first
    const validation = validateFile(file, documentType)
    if (!validation.valid) {
      return {
        success: false,
        error: validation.errors.join('. '),
      }
    }

    // Generate unique file name
    const uniqueFileName = generateUniqueFileName(file.name)

    // Create storage path: {customer_id}/{order_id}/{category}/{document_type}/{filename}
    const storagePath = `${customerId}/${orderId}/${category}/${documentType}/${uniqueFileName}`

    // Upload file to Supabase Storage
    const { data, error } = await supabase.storage
      .from('kyc-documents')
      .upload(storagePath, file, {
        cacheControl: '3600',
        upsert: false,
      })

    if (error) {
      console.error('Storage upload error:', error)
      return {
        success: false,
        error: `Failed to upload file: ${error.message}`,
      }
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('kyc-documents')
      .getPublicUrl(storagePath)

    const fileUrl = urlData.publicUrl

    // Save metadata via API
    try {
      const response = await fetch('/api/compliance/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId,
          customerId,
          category,
          documentType,
          fileName: uniqueFileName,
          fileSize: file.size,
          filePath: storagePath,
          fileUrl,
          mimeType: file.type,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save document metadata')
      }

      const result = await response.json()

      return {
        success: true,
        fileUrl,
        filePath: storagePath,
        fileName: uniqueFileName,
        fileSize: file.size,
      }
    } catch (apiError) {
      // If API call fails, try to delete uploaded file
      await supabase.storage.from('kyc-documents').remove([storagePath])

      throw apiError
    }
  } catch (error) {
    console.error('Upload error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown upload error',
    }
  }
}

/**
 * Delete file from Supabase Storage
 */
export async function deleteFileFromStorage(filePath: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient()

    const { error } = await supabase.storage
      .from('kyc-documents')
      .remove([filePath])

    if (error) {
      console.error('Storage delete error:', error)
      return {
        success: false,
        error: `Failed to delete file: ${error.message}`,
      }
    }

    return { success: true }
  } catch (error) {
    console.error('Delete error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown delete error',
    }
  }
}

/**
 * Convert File to Base64 for preview
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

/**
 * Check if file is an image
 */
export function isImageFile(file: File): boolean {
  return file.type.startsWith('image/')
}

/**
 * Check if file is a PDF
 */
export function isPDFFile(file: File): boolean {
  return file.type === 'application/pdf'
}

/**
 * Get file icon based on type
 */
export function getFileIcon(file: File): string {
  if (isImageFile(file)) return '🖼️'
  if (isPDFFile(file)) return '📄'
  return '📎'
}

/**
 * Format bytes to human-readable size
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}
