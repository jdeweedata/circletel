'use client';

import { useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { AlertCircle, Loader2, Upload, FileText, CheckCircle } from 'lucide-react';

interface InstallationCompletionModalProps {
  open: boolean;
  onClose: () => void;
  orderId: string;
  orderNumber: string;
  onSuccess: () => void;
}

export function InstallationCompletionModal({
  open,
  onClose,
  orderId,
  orderNumber,
  onSuccess,
}: InstallationCompletionModalProps) {
  const [notes, setNotes] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (!allowedTypes.includes(file.type)) {
      setError('Invalid file type. Only PDF, JPEG, PNG, and Word documents are allowed.');
      return;
    }

    // Validate file size (20MB)
    if (file.size > 20 * 1024 * 1024) {
      setError('File size must be less than 20MB');
      return;
    }

    setError('');
    setSelectedFile(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    /* Optional file upload */
    /* if (!selectedFile) {
      setError('Please select an installation document to upload');
      return;
    } */

    try {
      setIsSubmitting(true);

      const formData = new FormData();
      if (selectedFile) {
        formData.append('document', selectedFile);
      }
      if (notes) {
        formData.append('notes', notes);
      }

      const response = await fetch(`/api/admin/orders/${orderId}/complete-installation`, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Installation completed successfully', {
          description: `Order ${orderNumber} is now ready for activation`,
        });
        onSuccess();
        handleClose();
      } else {
        setError(result.error || 'Failed to complete installation');
        toast.error('Completion failed', {
          description: result.error || 'Please try again',
        });
      }
    } catch (err) {
      console.error('Installation completion error:', err);
      setError('Network error. Please check your connection and try again.');
      toast.error('Network error', {
        description: 'Failed to connect to server',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setNotes('');
    setSelectedFile(null);
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClose();
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Complete Installation
            </DialogTitle>
            <DialogDescription>
              Mark installation as completed for order{' '}
              <span className="font-semibold text-gray-900">{orderNumber}</span>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Installation Document Upload */}
            <div className="space-y-3">
              <Label htmlFor="document" className="text-base font-semibold">
                Installation Proof Document <span className="text-gray-400 font-normal">(Optional)</span>
              </Label>
              <p className="text-sm text-gray-600">
                Upload physical installation proof: equipment photos, installation photos, signed technician forms, etc.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
                <strong>Note:</strong> You can upload this later if not available immediately.
              </div>

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-circleTel-orange transition-colors">
                <input
                  ref={fileInputRef}
                  id="document"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                {!selectedFile ? (
                  <div className="space-y-3">
                    <Upload className="h-12 w-12 text-gray-400 mx-auto" />
                    <div>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Select Document
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500">
                      PDF, JPEG, PNG, or Word (Max 20MB)
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <FileText className="h-12 w-12 text-green-600 mx-auto" />
                    <div className="space-y-1">
                      <p className="font-medium text-gray-900">{selectedFile.name}</p>
                      <p className="text-sm text-gray-500">{formatFileSize(selectedFile.size)}</p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Change File
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Technician Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">
                Installation Notes
              </Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any notes about the installation (optional)..."
                rows={4}
              />
              <p className="text-xs text-gray-500">
                Optional: Add details about the installation, equipment used, etc.
              </p>
            </div>

            {/* Error Alert */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Info Alert */}
            <Alert>
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription>
                <strong>Next Step:</strong> After completing installation, you can activate the service
                and start billing once the payment method is verified.
              </AlertDescription>
            </Alert>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="bg-[#F5831F] hover:bg-[#d97219] text-white">
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Completing...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Complete Installation
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
