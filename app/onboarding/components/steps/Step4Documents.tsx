'use client';
import { useState } from 'react';
import { requiredDocsFor } from '@/lib/onboarding/document-requirements';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PiCheckCircle, PiCameraBold } from 'react-icons/pi';

export interface Step4DocumentsProps {
  token: string;
  submissionId: string | null;
  step2: any;
  documents: Record<string, any>;
  onChange: (docs: Record<string, any>) => void;
  canGoNext: boolean;
}

export function Step4Documents({
  token,
  submissionId,
  step2,
  documents,
  onChange,
  canGoNext,
}: Step4DocumentsProps) {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const required = requiredDocsFor('unjani', {
    vatRegistered: step2.vat === 'Yes',
    entityType: step2.entityType,
  }).filter((d) => d.required);

  const handleFileSelect = async (docType: string, file: File) => {
    if (!submissionId) {
      setError('Submission ID not ready. Please refresh and try again.');
      return;
    }

    // Client-side file validation
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];

    if (file.size > maxSize) {
      setError(`File is too large. Maximum size is 5MB (${file.name} is ${(file.size / 1024 / 1024).toFixed(1)}MB).`);
      return;
    }

    if (!allowedTypes.includes(file.type)) {
      setError(`File type not allowed. Please upload a PDF, JPEG, or PNG file.`);
      return;
    }

    setBusy(docType);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('token', token);
    formData.append('documentType', docType);
    formData.append('submissionId', submissionId);

    try {
      const res = await fetch('/api/onboarding/upload-document', {
        method: 'POST',
        body: formData,
      });

      const json = await res.json();

      if (json.success) {
        onChange({
          ...documents,
          [docType]: { documentId: json.documentId, fileName: file.name },
        });
      } else {
        setError(json.error || 'Upload failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error(err);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Supporting documents
        </h2>
        <p className="text-gray-600">
          Upload the required documents to verify your company details and
          banking.
        </p>
        <p className="text-sm text-circleTel-orange-accessible mt-2">
          📷 On your phone, tap a document below to <strong>take a photo</strong> with your
          camera — or choose a PDF/image you already have.
        </p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded text-red-800 text-sm">
          {error}
        </div>
      )}

      <Card>
        <CardContent className="pt-6 space-y-3">
          {required.map((doc) => (
            <div
              key={doc.type}
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
            >
              <div className="flex-1">
                <p className="font-semibold text-gray-900">{doc.label}</p>
                {documents[doc.type] ? (
                  <p className="text-sm text-green-600 flex items-center gap-1 mt-1">
                    <PiCheckCircle className="w-4 h-4" />
                    Uploaded: {documents[doc.type].fileName}
                  </p>
                ) : (
                  <p className="text-xs text-gray-500 mt-1">
                    PDF, JPEG, or PNG (max 5MB)
                  </p>
                )}
              </div>

              <label className="ml-4 cursor-pointer">
                <input
                  type="file"
                  accept="application/pdf,image/jpeg,image/png"
                  disabled={busy === doc.type}
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      handleFileSelect(doc.type, e.target.files[0]);
                    }
                  }}
                  className="sr-only"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={busy === doc.type}
                  asChild
                >
                  <span className="cursor-pointer">
                    <PiCameraBold className="w-4 h-4 mr-1" />
                    {busy === doc.type ? 'Uploading...' : 'Take photo or upload'}
                  </span>
                </Button>
              </label>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="text-sm text-gray-600">
        <p className="font-semibold mb-2">What we need:</p>
        <ul className="space-y-1 text-xs list-disc list-inside">
          <li>
            Clear, readable documents in colour (front and back for ID documents)
          </li>
          <li>Recent documents (bank statements dated within 3 months)</li>
          <li>Company/director names must match your banking details</li>
        </ul>
      </div>
    </div>
  );
}
