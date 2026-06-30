'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  DOC_TYPE_OPTIONS,
  ALLOWED_FILE_TYPES,
  MAX_DOC_BYTES,
  type DocType,
} from '@/lib/onboarding/document-upload';

interface UploadDocumentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerId: string;
  clinicName: string;
  submissionId?: string;
  authHeaders: () => Record<string, string>;
  onUploaded: (count: number) => void;
}

export function UploadDocumentModal({
  open,
  onOpenChange,
  customerId,
  clinicName,
  submissionId,
  authHeaders,
  onUploaded,
}: UploadDocumentModalProps) {
  const [docType, setDocType] = useState<DocType>('company_registration');
  const [segment, setSegment] = useState('unjani');
  const [emailFrom, setEmailFrom] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailReceivedAt, setEmailReceivedAt] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState<{ type: string; name: string }[]>([]);

  const reset = () => {
    setDocType('company_registration');
    setSegment('unjani');
    setEmailFrom('');
    setEmailSubject('');
    setEmailReceivedAt('');
    setFile(null);
    setUploaded([]);
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error('Choose a file first');
      return;
    }
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      toast.error('File must be a JPG, PNG, or PDF');
      return;
    }
    if (file.size > MAX_DOC_BYTES) {
      toast.error('File must be 5MB or smaller');
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('customerId', customerId);
      fd.append('documentType', docType);
      fd.append('segment', segment);
      if (emailFrom.trim()) fd.append('emailFrom', emailFrom.trim());
      if (emailSubject.trim()) fd.append('emailSubject', emailSubject.trim());
      if (emailReceivedAt.trim()) fd.append('emailReceivedAt', emailReceivedAt.trim());
      if (submissionId) fd.append('submissionId', submissionId);
      fd.append('file', file);
      const res = await fetch('/api/admin/b2b/upload-document', {
        method: 'POST',
        headers: { ...authHeaders() },
        body: fd,
      });
      const data = await res.json();
      if (res.ok && data.success) {
        const label = DOC_TYPE_OPTIONS.find((o) => o.value === docType)?.label ?? docType;
        setUploaded((u) => [...u, { type: label, name: file.name }]);
        toast.success(`Uploaded ${label}`);
        setFile(null);
      } else {
        toast.error(data.error || 'Upload failed');
      }
    } catch {
      toast.error('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    onUploaded(uploaded.length);
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => (o ? onOpenChange(o) : handleClose())}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload documents — {clinicName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="upload-document-type" className="text-xs font-semibold text-gray-500">
                Document type
              </Label>
              <select
                id="upload-document-type"
                value={docType}
                onChange={(e) => setDocType(e.target.value as DocType)}
                className="h-10 w-full rounded-md border border-gray-300 px-2 py-2 text-sm"
              >
                {DOC_TYPE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="upload-segment" className="text-xs font-semibold text-gray-500">
                Segment
              </Label>
              <select
                id="upload-segment"
                value={segment}
                onChange={(e) => setSegment(e.target.value)}
                className="h-10 w-full rounded-md border border-gray-300 px-2 py-2 text-sm"
              >
                <option value="unjani">Unjani</option>
                <option value="smb">SMB</option>
                <option value="edu">Education</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="upload-email-from" className="text-xs font-semibold text-gray-500">
              Email from
            </Label>
            <Input
              id="upload-email-from"
              type="email"
              value={emailFrom}
              onChange={(event) => setEmailFrom(event.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="upload-email-subject" className="text-xs font-semibold text-gray-500">
              Email subject
            </Label>
            <Input
              id="upload-email-subject"
              value={emailSubject}
              onChange={(event) => setEmailSubject(event.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="upload-email-received-at" className="text-xs font-semibold text-gray-500">
              Email received
            </Label>
            <Input
              id="upload-email-received-at"
              type="datetime-local"
              value={emailReceivedAt}
              onChange={(event) => setEmailReceivedAt(event.target.value)}
            />
          </div>

          <input
            type="file"
            accept="image/jpeg,image/png,application/pdf"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="w-full text-sm"
          />

          <Button
            className="w-full bg-circleTel-orange hover:bg-circleTel-orange-dark text-white"
            disabled={uploading || !file}
            onClick={handleUpload}
          >
            {uploading ? 'Uploading…' : 'Upload this document'}
          </Button>
        </div>

        {uploaded.length > 0 && (
          <div className="rounded border border-gray-100 bg-gray-50 p-3 text-sm">
            <p className="font-semibold text-gray-700 mb-1">Uploaded ({uploaded.length})</p>
            <ul className="space-y-1">
              {uploaded.map((u, i) => (
                <li key={i} className="text-gray-600">
                  ✓ {u.type} — {u.name}
                </li>
              ))}
            </ul>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
