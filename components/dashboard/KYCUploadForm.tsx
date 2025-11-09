'use client'

/**
 * Unified KYC Document Upload Form
 * Simplified interface without FICA/RICA distinction
 */

import React, { useState, useCallback, useRef } from 'react'
import { Upload, File, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import {
  validateFile,
  uploadFileToStorage,
  deleteFileFromStorage,
  fileToBase64,
  isImageFile,
  getFileIcon,
} from '@/lib/utils/file-upload'
import { formatFileSize } from '@/lib/types/fica-rica'

interface KYCUploadFormProps {
  orderId: string
  customerId: string
  onUploadComplete?: (documentType: string, fileUrl: string) => void
  onError?: (error: string) => void
}

interface UploadedFile {
  file: File
  preview?: string
  documentType: 'id_document' | 'proof_of_address'
  uploading: boolean
  uploaded: boolean
  error?: string
  fileUrl?: string
  filePath?: string
}

const DOCUMENT_TYPES = [
  {
    value: 'id_document',
    label: 'Proof of Identity',
    description: 'South African ID, Passport, or Driver\'s License',
    examples: 'Clear copy of ID document (both sides if applicable)'
  },
  {
    value: 'proof_of_address',
    label: 'Proof of Address',
    description: 'Utility bill, bank statement, or lease agreement',
    examples: 'Document must be less than 3 months old'
  }
] as const

export function KYCUploadForm({
  orderId,
  customerId,
  onUploadComplete,
  onError,
}: KYCUploadFormProps) {
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [selectedDocumentType, setSelectedDocumentType] = useState<'id_document' | 'proof_of_address' | ''>('')
  const [uploadProgress, setUploadProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Handle drag events
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(false)

      if (!selectedDocumentType) {
        onError?.('Please select a document type first')
        return
      }

      const droppedFiles = Array.from(e.dataTransfer.files)
      await processFiles(droppedFiles, selectedDocumentType)
    },
    [selectedDocumentType]
  )

  // Handle file selection
  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!selectedDocumentType) {
        onError?.('Please select a document type first')
        return
      }

      const selectedFiles = e.target.files ? Array.from(e.target.files) : []
      await processFiles(selectedFiles, selectedDocumentType)

      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    },
    [selectedDocumentType]
  )

  // Process and validate files
  const processFiles = async (
    fileList: File[],
    documentType: 'id_document' | 'proof_of_address'
  ) => {
    const newFiles: UploadedFile[] = []

    for (const file of fileList) {
      // Validate file
      const validation = validateFile(file, documentType)

      if (!validation.valid) {
        onError?.(validation.errors.join('. '))
        continue
      }

      // Generate preview for images
      let preview: string | undefined
      if (isImageFile(file)) {
        try {
          preview = await fileToBase64(file)
        } catch (error) {
          console.error('Failed to generate preview:', error)
        }
      }

      newFiles.push({
        file,
        preview,
        documentType,
        uploading: false,
        uploaded: false,
      })
    }

    setFiles(prev => [...prev, ...newFiles])
  }

  // Upload a single file
  const uploadFile = async (index: number) => {
    const fileToUpload = files[index]
    if (!fileToUpload || fileToUpload.uploading || fileToUpload.uploaded) return

    // Mark as uploading
    setFiles(prev =>
      prev.map((f, i) => (i === index ? { ...f, uploading: true, error: undefined } : f))
    )

    try {
      // Upload to FICA category (unified KYC storage)
      const result = await uploadFileToStorage(
        fileToUpload.file,
        orderId,
        customerId,
        fileToUpload.documentType,
        'fica', // Use 'fica' category internally for KYC
        progress => {
          setUploadProgress(progress.percentage)
        }
      )

      if (result.success && result.fileUrl) {
        // Mark as uploaded
        setFiles(prev =>
          prev.map((f, i) =>
            i === index
              ? {
                  ...f,
                  uploading: false,
                  uploaded: true,
                  fileUrl: result.fileUrl,
                  filePath: result.filePath,
                }
              : f
          )
        )

        // Call completion callback
        onUploadComplete?.(fileToUpload.documentType, result.fileUrl)
      } else {
        // Mark as failed
        setFiles(prev =>
          prev.map((f, i) =>
            i === index ? { ...f, uploading: false, error: result.error } : f
          )
        )
        onError?.(result.error || 'Upload failed')
      }
    } catch (error) {
      console.error('Upload error:', error)
      setFiles(prev =>
        prev.map((f, i) =>
          i === index
            ? { ...f, uploading: false, error: 'Unexpected error during upload' }
            : f
        )
      )
    } finally {
      setUploadProgress(0)
    }
  }

  // Upload all files
  const uploadAll = async () => {
    for (let i = 0; i < files.length; i++) {
      if (!files[i].uploaded && !files[i].uploading) {
        await uploadFile(i)
      }
    }
  }

  // Remove file from list
  const removeFile = async (index: number) => {
    const fileToRemove = files[index]

    // If already uploaded, delete from storage
    if (fileToRemove.uploaded && fileToRemove.filePath) {
      await deleteFileFromStorage(fileToRemove.filePath)
    }

    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  // Trigger file input click
  const triggerFileSelect = () => {
    if (!selectedDocumentType) {
      onError?.('Please select a document type first')
      return
    }
    fileInputRef.current?.click()
  }

  const hasFiles = files.length > 0
  const hasUploadingFiles = files.some(f => f.uploading)
  const allFilesUploaded = files.length > 0 && files.every(f => f.uploaded)

  const selectedDocInfo = DOCUMENT_TYPES.find(d => d.value === selectedDocumentType)

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>KYC Document Upload</CardTitle>
          <CardDescription>
            Upload required documents to verify your identity and activate your service
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Document Type Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Document Type
            </label>
            <select
              value={selectedDocumentType}
              onChange={e => setSelectedDocumentType(e.target.value as any)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-circleTel-orange focus:border-transparent"
            >
              <option value="">-- Select Document Type --</option>
              {DOCUMENT_TYPES.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* Selected Document Info */}
          {selectedDocInfo && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>{selectedDocInfo.description}</strong>
                <br />
                <span className="text-sm text-gray-600">{selectedDocInfo.examples}</span>
              </AlertDescription>
            </Alert>
          )}

          {/* Drag and Drop Zone */}
          {selectedDocumentType && (
            <div
              onDragEnter={handleDragEnter}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`
                border-2 border-dashed rounded-lg p-8 text-center transition-colors
                ${isDragging
                  ? 'border-circleTel-orange bg-orange-50'
                  : 'border-gray-300 hover:border-gray-400'
                }
              `}
            >
              <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-medium text-gray-700 mb-2">
                Drag and drop files here
              </p>
              <p className="text-sm text-gray-500 mb-4">or</p>
              <Button type="button" onClick={triggerFileSelect} variant="outline">
                Browse Files
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileSelect}
                accept=".pdf,.jpg,.jpeg,.png"
                multiple
                className="hidden"
              />
              <p className="text-xs text-gray-400 mt-4">
                Accepted formats: PDF, JPG, PNG (Max 5MB)
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* File List */}
      {hasFiles && (
        <Card>
          <CardHeader>
            <CardTitle>Selected Files</CardTitle>
            <CardDescription>
              {files.length} file{files.length !== 1 ? 's' : ''} selected
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {files.map((fileItem, index) => (
                <div
                  key={index}
                  className="flex items-center gap-4 p-4 border rounded-lg hover:bg-gray-50"
                >
                  {/* File Icon/Preview */}
                  <div className="flex-shrink-0">
                    {fileItem.preview ? (
                      <img
                        src={fileItem.preview}
                        alt="Preview"
                        className="w-12 h-12 object-cover rounded"
                      />
                    ) : (
                      <div className="w-12 h-12 flex items-center justify-center bg-gray-100 rounded text-2xl">
                        {getFileIcon(fileItem.file)}
                      </div>
                    )}
                  </div>

                  {/* File Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {fileItem.file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {DOCUMENT_TYPES.find(d => d.value === fileItem.documentType)?.label} • {formatFileSize(fileItem.file.size)}
                    </p>
                    {fileItem.error && (
                      <p className="text-xs text-red-600 mt-1">{fileItem.error}</p>
                    )}
                    {fileItem.uploading && (
                      <Progress value={uploadProgress} className="mt-2" />
                    )}
                  </div>

                  {/* Status Icon */}
                  <div className="flex-shrink-0">
                    {fileItem.uploaded && (
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    )}
                    {fileItem.uploading && (
                      <Loader2 className="w-6 h-6 text-circleTel-orange animate-spin" />
                    )}
                    {fileItem.error && (
                      <AlertCircle className="w-6 h-6 text-red-600" />
                    )}
                    {!fileItem.uploaded && !fileItem.uploading && !fileItem.error && (
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => uploadFile(index)}
                        variant="outline"
                      >
                        Upload
                      </Button>
                    )}
                  </div>

                  {/* Remove Button */}
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="flex-shrink-0 text-gray-400 hover:text-red-600 transition-colors"
                    disabled={fileItem.uploading}
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Upload All Button */}
            {!allFilesUploaded && (
              <div className="mt-6 flex justify-end gap-3">
                <Button
                  type="button"
                  onClick={uploadAll}
                  disabled={hasUploadingFiles}
                  className="bg-circleTel-orange hover:bg-orange-600"
                >
                  {hasUploadingFiles ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>Upload All Files</>
                  )}
                </Button>
              </div>
            )}

            {/* Success Message */}
            {allFilesUploaded && (
              <Alert className="mt-6 border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  All files uploaded successfully! Your documents will be reviewed by our compliance team within 1-2 business days.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
