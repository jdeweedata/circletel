'use client';

/**
 * KYC Document Upload Component
 * Drag-and-drop file upload for KYC documents with validation and preview
 */

import { useState, useCallback, useRef } from 'react';
import { Upload, X, CheckCircle, AlertCircle, FileText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import type { KycDocumentType } from '@/lib/types/customer-journey';

interface UploadedDocument {
  id: string;
  type: KycDocumentType;
  filename: string;
  filesize: number;
  url: string;
  uploadedAt: Date;
  status: 'uploading' | 'uploaded' | 'error';
  error?: string;
}

interface KycDocumentUploadProps {
  orderId: string;
  onUploadComplete?: (document: UploadedDocument) => void;
  existingDocuments?: UploadedDocument[];
}

const DOCUMENT_TYPES: { value: KycDocumentType; label: string; description: string }[] = [
  { value: 'id_document', label: 'ID Document', description: 'South African ID or passport' },
  { value: 'proof_of_address', label: 'Proof of Address', description: 'Utility bill or bank statement (last 3 months)' },
  { value: 'bank_statement', label: 'Bank Statement', description: 'Recent bank statement (last 3 months)' },
  { value: 'company_registration', label: 'Company Registration', description: 'For business accounts' },
];

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];

export function KycDocumentUpload({
  orderId,
  onUploadComplete,
  existingDocuments = [],
}: KycDocumentUploadProps) {
  const [selectedType, setSelectedType] = useState<KycDocumentType>('id_document');
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [documents, setDocuments] = useState<UploadedDocument[]>(existingDocuments);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<{ file: File; url: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Validate file
  const validateFile = (file: File): { valid: boolean; error?: string } => {
    if (file.size > MAX_FILE_SIZE) {
      return { valid: false, error: 'File size must be less than 5MB' };
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return { valid: false, error: 'Only PDF, JPG, and PNG files are allowed' };
    }

    return { valid: true };
  };

  // Handle file upload
  const uploadFile = async (file: File) => {
    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('orderId', orderId);
      formData.append('documentType', selectedType);

      const response = await fetch('/api/kyc/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Upload failed');
      }

      // Add to documents list
      const newDocument: UploadedDocument = {
        id: result.documentId,
        type: selectedType,
        filename: file.name,
        filesize: file.size,
        url: result.url,
        uploadedAt: new Date(),
        status: 'uploaded',
      };

      setDocuments((prev) => [...prev, newDocument]);
      setPreview(null);

      if (onUploadComplete) {
        onUploadComplete(newDocument);
      }
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  // Handle file selection
  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) return;

      const file = files[0];
      const validation = validateFile(file);

      if (!validation.valid) {
        setError(validation.error || 'Invalid file');
        return;
      }

      // Create preview
      const previewUrl = URL.createObjectURL(file);
      setPreview({ file, url: previewUrl });
      setError(null);
    },
    []
  );

  // Handle drag events
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
  };

  const handleUploadClick = () => {
    if (preview) {
      uploadFile(preview.file);
    }
  };

  const handleCancelPreview = () => {
    if (preview) {
      URL.revokeObjectURL(preview.url);
      setPreview(null);
    }
    setError(null);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-6">
      {/* Document Type Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Select Document Type</CardTitle>
          <CardDescription>Choose the type of document you want to upload</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {DOCUMENT_TYPES.map((type) => (
              <button
                key={type.value}
                onClick={() => setSelectedType(type.value)}
                className={`p-4 border-2 rounded-lg text-left transition-all ${
                  selectedType === type.value
                    ? 'border-circleTel-orange bg-circleTel-orange/10'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-semibold">{type.label}</div>
                <div className="text-sm text-gray-600 mt-1">{type.description}</div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle>Upload {DOCUMENT_TYPES.find((t) => t.value === selectedType)?.label}</CardTitle>
          <CardDescription>
            Drag and drop your file here, or click to browse. Max size: 5MB. Formats: PDF, JPG, PNG
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!preview ? (
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragActive
                  ? 'border-circleTel-orange bg-circleTel-orange/10'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-lg font-medium mb-2">Drop your file here</p>
              <p className="text-sm text-gray-600 mb-4">or</p>
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
              >
                Browse Files
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleChange}
              />
            </div>
          ) : (
            <div className="border rounded-lg p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <FileText className="h-10 w-10 text-circleTel-orange" />
                  <div>
                    <p className="font-medium">{preview.file.name}</p>
                    <p className="text-sm text-gray-600">{formatFileSize(preview.file.size)}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCancelPreview}
                  disabled={uploading}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {preview.file.type.startsWith('image/') && (
                <div className="mb-4">
                  <img
                    src={preview.url}
                    alt="Preview"
                    className="max-h-64 mx-auto rounded-lg border"
                  />
                </div>
              )}

              <Button
                onClick={handleUploadClick}
                disabled={uploading}
                className="w-full"
              >
                {uploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Document
                  </>
                )}
              </Button>
            </div>
          )}

          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Uploaded Documents List */}
      {documents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Uploaded Documents</CardTitle>
            <CardDescription>Your submitted KYC documents</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-8 w-8 text-gray-400" />
                    <div>
                      <p className="font-medium">{doc.filename}</p>
                      <p className="text-sm text-gray-600">
                        {DOCUMENT_TYPES.find((t) => t.value === doc.type)?.label} •{' '}
                        {formatFileSize(doc.filesize)} •{' '}
                        {doc.uploadedAt.toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {doc.status === 'uploaded' && (
                      <Badge variant="default" className="bg-green-500">
                        <CheckCircle className="mr-1 h-3 w-3" />
                        Uploaded
                      </Badge>
                    )}
                    {doc.status === 'uploading' && (
                      <Badge variant="secondary">
                        <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                        Uploading...
                      </Badge>
                    )}
                    {doc.status === 'error' && (
                      <Badge variant="destructive">
                        <AlertCircle className="mr-1 h-3 w-3" />
                        Error
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
