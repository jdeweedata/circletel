'use client';

/**
 * KYC Upload Component Test Page
 * Test the KYC document upload functionality
 *
 * Access: http://localhost:3006/test/kyc-upload
 */

import { useState, useEffect } from 'react';
import { KycDocumentUpload } from '@/components/order/KycDocumentUpload';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

export default function KycUploadTestPage() {
  const [orderId, setOrderId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadCount, setUploadCount] = useState(0);

  // Create a test order on mount
  useEffect(() => {
    createTestOrder();
  }, []);

  const createTestOrder = async () => {
    setLoading(true);
    setError(null);

    try {
      // Create test order via API
      const response = await fetch('/api/test/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: 'Test',
          lastName: 'User',
          email: 'test@example.com',
          phone: '+27123456789',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create test order');
      }

      setOrderId(data.orderId);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadComplete = () => {
    setUploadCount((prev) => prev + 1);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-2xl">KYC Upload Component Test</CardTitle>
            <CardDescription>
              Test the KYC document upload functionality with drag-and-drop, file validation, and preview
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading && (
              <div className="flex items-center gap-2 text-gray-600">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Creating test order...</span>
              </div>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {orderId && (
              <div className="space-y-4">
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Test Order Created:</strong> {orderId}
                    <br />
                    <span className="text-sm text-gray-600">
                      You can now test uploading KYC documents for this order
                    </span>
                  </AlertDescription>
                </Alert>

                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div>
                    <p className="font-medium text-blue-900">Documents Uploaded</p>
                    <p className="text-sm text-blue-700">
                      {uploadCount} document{uploadCount !== 1 ? 's' : ''} uploaded successfully
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={createTestOrder}
                    size="sm"
                  >
                    Create New Test Order
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* KYC Upload Component */}
        {orderId && (
          <KycDocumentUpload
            orderId={orderId}
            onUploadComplete={handleUploadComplete}
          />
        )}

        {/* Testing Instructions */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Testing Instructions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">What to Test:</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                <li>Select different document types (ID Document, Proof of Address, etc.)</li>
                <li>Drag and drop files onto the upload area</li>
                <li>Click "Browse Files" to select files via file picker</li>
                <li>Test with different file types: PDF, JPG, PNG</li>
                <li>Try uploading a file larger than 5MB (should show error)</li>
                <li>Try uploading an unsupported file type like .txt (should show error)</li>
                <li>Verify image preview appears for JPG/PNG files</li>
                <li>Check that uploaded documents list shows all uploads</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Expected Behavior:</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                <li>✅ Drag-and-drop area highlights when dragging files over it</li>
                <li>✅ File validation happens before upload (size and type)</li>
                <li>✅ Preview appears for image files after selection</li>
                <li>✅ Upload button shows loading state during upload</li>
                <li>✅ Success message appears after successful upload</li>
                <li>✅ Document appears in "Uploaded Documents" list</li>
                <li>✅ Can upload multiple documents of different types</li>
              </ul>
            </div>

            <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <h3 className="font-semibold text-yellow-900 mb-2">Important Notes:</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-yellow-800">
                <li>Files are uploaded to Supabase Storage bucket: <code>kyc-documents</code></li>
                <li>Maximum file size: 5MB</li>
                <li>Allowed file types: PDF, JPG, PNG</li>
                <li>Files are organized by order ID and document type</li>
                <li>Storage policies ensure only authenticated users can upload/view</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
