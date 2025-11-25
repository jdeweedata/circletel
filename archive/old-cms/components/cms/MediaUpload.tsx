'use client';

/**
 * CircleTel CMS - Media Upload Component
 *
 * Drag-and-drop file upload with Supabase Storage integration
 * Features:
 * - Drag and drop support
 * - File type validation (images only)
 * - Size validation (max 5MB)
 * - Upload progress tracking
 * - Image preview
 * - Multiple file support
 */

import { useState, useCallback, useRef } from 'react';
import { Upload, X, Image as ImageIcon, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

interface MediaUploadProps {
  onUploadComplete: (urls: string[]) => void;
  maxFiles?: number;
  maxSizeMB?: number;
  accept?: string;
  bucket?: string;
}

interface UploadedFile {
  id: string;
  file: File;
  preview: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress: number;
  url?: string;
  error?: string;
}

export default function MediaUpload({
  onUploadComplete,
  maxFiles = 10,
  maxSizeMB = 5,
  accept = 'image/png,image/jpeg,image/jpg,image/gif,image/webp',
  bucket = 'cms-media',
}: MediaUploadProps) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    // Check file type
    const acceptedTypes = accept.split(',').map(t => t.trim());
    if (!acceptedTypes.some(type => file.type.match(type.replace('*', '.*')))) {
      return `Invalid file type. Accepted: ${accept}`;
    }

    // Check file size
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return `File too large. Max size: ${maxSizeMB}MB`;
    }

    return null;
  };

  const uploadFile = async (uploadedFile: UploadedFile): Promise<void> => {
    const formData = new FormData();
    formData.append('file', uploadedFile.file);
    formData.append('bucket', bucket);

    try {
      // Update status to uploading
      setFiles(prev =>
        prev.map(f =>
          f.id === uploadedFile.id
            ? { ...f, status: 'uploading' as const, progress: 0 }
            : f
        )
      );

      const response = await fetch('/api/cms/media/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      }

      const data = await response.json();

      // Update status to success
      setFiles(prev =>
        prev.map(f =>
          f.id === uploadedFile.id
            ? { ...f, status: 'success' as const, progress: 100, url: data.url }
            : f
        )
      );

      // Notify parent of successful upload
      onUploadComplete([data.url]);
    } catch (error) {
      console.error('Upload error:', error);
      setFiles(prev =>
        prev.map(f =>
          f.id === uploadedFile.id
            ? {
                ...f,
                status: 'error' as const,
                error: error instanceof Error ? error.message : 'Upload failed',
              }
            : f
        )
      );
    }
  };

  const handleFiles = useCallback(
    (fileList: FileList | null) => {
      if (!fileList) return;

      const newFiles: UploadedFile[] = [];

      for (let i = 0; i < fileList.length && newFiles.length + files.length < maxFiles; i++) {
        const file = fileList[i];
        const error = validateFile(file);

        if (error) {
          alert(error);
          continue;
        }

        const uploadedFile: UploadedFile = {
          id: `${Date.now()}-${i}`,
          file,
          preview: URL.createObjectURL(file),
          status: 'pending',
          progress: 0,
        };

        newFiles.push(uploadedFile);
      }

      if (newFiles.length > 0) {
        setFiles(prev => [...prev, ...newFiles]);

        // Start uploading
        newFiles.forEach(file => {
          uploadFile(file);
        });
      }
    },
    [files.length, maxFiles]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      handleFiles(e.target.files);
      // Reset input so same file can be uploaded again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [handleFiles]
  );

  const handleRemoveFile = (id: string) => {
    setFiles(prev => {
      const file = prev.find(f => f.id === id);
      if (file?.preview) {
        URL.revokeObjectURL(file.preview);
      }
      return prev.filter(f => f.id !== id);
    });
  };

  const handleRetryUpload = (id: string) => {
    const file = files.find(f => f.id === id);
    if (file) {
      uploadFile(file);
    }
  };

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragging
            ? 'border-circleTel-orange bg-orange-50'
            : 'border-gray-300 hover:border-circleTel-orange hover:bg-gray-50'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={accept}
          onChange={handleFileInputChange}
          className="hidden"
        />

        <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />

        <p className="text-lg font-medium text-gray-700 mb-2">
          {isDragging ? 'Drop files here' : 'Click to upload or drag and drop'}
        </p>

        <p className="text-sm text-gray-500">
          PNG, JPG, GIF, WebP up to {maxSizeMB}MB (max {maxFiles} files)
        </p>
      </div>

      {/* Uploaded Files List */}
      {files.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-700">Uploaded Files ({files.length})</h3>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {files.map(file => (
              <div
                key={file.id}
                className="relative border rounded-lg overflow-hidden bg-white shadow-sm"
              >
                {/* Image Preview */}
                <div className="aspect-square bg-gray-100 flex items-center justify-center">
                  {file.preview ? (
                    <img
                      src={file.preview}
                      alt={file.file.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <ImageIcon className="w-12 h-12 text-gray-400" />
                  )}

                  {/* Status Overlay */}
                  {file.status === 'uploading' && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                      <Loader2 className="w-8 h-8 text-white animate-spin" />
                    </div>
                  )}

                  {file.status === 'success' && (
                    <div className="absolute top-2 right-2 bg-green-500 rounded-full p-1">
                      <CheckCircle2 className="w-4 h-4 text-white" />
                    </div>
                  )}

                  {file.status === 'error' && (
                    <div className="absolute inset-0 bg-red-500 bg-opacity-20 flex items-center justify-center">
                      <AlertCircle className="w-8 h-8 text-red-600" />
                    </div>
                  )}
                </div>

                {/* File Info */}
                <div className="p-2">
                  <p className="text-xs font-medium text-gray-700 truncate" title={file.file.name}>
                    {file.file.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {(file.file.size / 1024).toFixed(1)} KB
                  </p>

                  {/* Progress Bar */}
                  {file.status === 'uploading' && (
                    <div className="mt-2 bg-gray-200 rounded-full h-1.5">
                      <div
                        className="bg-circleTel-orange h-1.5 rounded-full transition-all duration-300"
                        style={{ width: `${file.progress}%` }}
                      />
                    </div>
                  )}

                  {/* Error Message */}
                  {file.status === 'error' && (
                    <p className="text-xs text-red-600 mt-1">{file.error}</p>
                  )}
                </div>

                {/* Remove Button */}
                <button
                  onClick={() => handleRemoveFile(file.id)}
                  className="absolute top-1 right-1 bg-white rounded-full p-1 shadow-md hover:bg-gray-100 transition-colors"
                  title="Remove"
                >
                  <X className="w-4 h-4 text-gray-600" />
                </button>

                {/* Retry Button (for errors) */}
                {file.status === 'error' && (
                  <button
                    onClick={() => handleRetryUpload(file.id)}
                    className="absolute bottom-2 right-2 bg-circleTel-orange text-white text-xs px-2 py-1 rounded hover:bg-orange-600"
                  >
                    Retry
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Summary */}
      {files.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
          <p className="text-blue-900">
            <strong>Status:</strong>{' '}
            {files.filter(f => f.status === 'success').length} uploaded,{' '}
            {files.filter(f => f.status === 'uploading').length} uploading,{' '}
            {files.filter(f => f.status === 'error').length} failed
          </p>
        </div>
      )}
    </div>
  );
}
