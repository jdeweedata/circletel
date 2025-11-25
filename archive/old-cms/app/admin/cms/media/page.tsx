'use client';

/**
 * CMS Media Library Page
 *
 * Browse, upload, and manage media files
 * Features:
 * - Grid view of uploaded media
 * - Upload new files
 * - Copy URL to clipboard
 * - Filter by file type
 * - Search by filename
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import MediaUpload from '@/components/cms/MediaUpload';
import { Copy, CheckCircle2, Upload as UploadIcon, RefreshCw } from 'lucide-react';

export default function MediaLibraryPage() {
  const [showUpload, setShowUpload] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [regeneratingIndex, setRegeneratingIndex] = useState<number | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<
    Array<{ url: string; filename: string; size: number }>
  >([]);

  const handleUploadComplete = (urls: string[]) => {
    // In production, this would fetch file metadata from the media_library table
    // For now, just add the URLs to the list
    const newFiles = urls.map(url => ({
      url,
      filename: url.split('/').pop() || 'unknown',
      size: 0,
    }));
    setUploadedFiles(prev => [...newFiles, ...prev]);
  };

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  const handleRegenerateImage = async (index: number, filename: string) => {
    // Check if AI image generation is enabled
    const enabled = process.env.NEXT_PUBLIC_ENABLE_AI_IMAGE_GENERATION === 'true';

    if (!enabled) {
      alert(
        'AI Image Generation is currently disabled.\n\n' +
        'To enable this feature, add the following to your .env.local file:\n\n' +
        'ENABLE_AI_IMAGE_GENERATION=true\n' +
        'GOOGLE_AI_API_KEY=your_api_key\n\n' +
        'Note: AI image generation incurs additional costs based on Gemini 3 pricing.'
      );
      return;
    }

    setRegeneratingIndex(index);

    try {
      // Extract prompt from filename (simplified for demo)
      const prompt = filename.replace(/\.(jpg|jpeg|png|gif|webp)$/i, '').replace(/-/g, ' ');

      const response = await fetch('/api/cms/generate/image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          aspectRatio: '16:9',
          resolution: '2K',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Image regeneration failed');
      }

      if (data.success && data.image_url) {
        // Update the file URL with the new generated image
        setUploadedFiles(prev =>
          prev.map((file, i) =>
            i === index
              ? { ...file, url: data.image_url }
              : file
          )
        );
        alert('Image regenerated successfully!');
      } else {
        throw new Error('Image generation failed');
      }
    } catch (error) {
      console.error('Image regeneration error:', error);
      alert(error instanceof Error ? error.message : 'Failed to regenerate image');
    } finally {
      setRegeneratingIndex(null);
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Media Library</h1>
          <p className="text-muted-foreground">
            Upload and manage images for your content
          </p>
        </div>

        <button
          onClick={() => setShowUpload(!showUpload)}
          className="flex items-center gap-2 px-4 py-2 bg-circleTel-orange text-white rounded-lg font-semibold hover:bg-orange-600 transition-colors"
        >
          <UploadIcon className="w-4 h-4" />
          {showUpload ? 'Hide Upload' : 'Upload Media'}
        </button>
      </div>

      {/* Upload Section */}
      {showUpload && (
        <Card>
          <CardHeader>
            <CardTitle>Upload New Media</CardTitle>
          </CardHeader>
          <CardContent>
            <MediaUpload onUploadComplete={handleUploadComplete} maxFiles={10} maxSizeMB={5} />
          </CardContent>
        </Card>
      )}

      {/* Media Grid */}
      <Card>
        <CardHeader>
          <CardTitle>Uploaded Media ({uploadedFiles.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {uploadedFiles.length === 0 ? (
            <div className="text-center py-12">
              <UploadIcon className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">
                No media uploaded yet. Click "Upload Media" to get started.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {uploadedFiles.map((file, index) => (
                <div
                  key={index}
                  className="relative border rounded-lg overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow group"
                >
                  {/* Image Preview */}
                  <div className="aspect-square bg-gray-100">
                    <img
                      src={file.url}
                      alt={file.filename}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* File Info */}
                  <div className="p-3">
                    <p
                      className="text-xs font-medium text-gray-700 truncate"
                      title={file.filename}
                    >
                      {file.filename}
                    </p>

                    {/* Actions */}
                    <div className="mt-2 flex gap-2">
                      <button
                        onClick={() => copyToClipboard(file.url)}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs rounded transition-colors"
                      >
                        {copiedUrl === file.url ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-green-600" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            Copy
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => handleRegenerateImage(index, file.filename)}
                        disabled={regeneratingIndex === index}
                        className="flex items-center justify-center gap-1 px-3 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-700 text-xs rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Regenerate image with AI"
                      >
                        {regeneratingIndex === index ? (
                          <RefreshCw className="w-3 h-3 animate-spin" />
                        ) : (
                          <RefreshCw className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Usage Tips */}
      <Card>
        <CardHeader>
          <CardTitle>Usage Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc list-inside space-y-2 text-sm text-gray-700">
            <li>Uploaded images are publicly accessible via their URLs</li>
            <li>Supported formats: PNG, JPG, GIF, WebP</li>
            <li>Maximum file size: 5MB per file</li>
            <li>Click "Copy" to copy the URL to your clipboard</li>
            <li>
              Click the <RefreshCw className="inline w-3 h-3 text-blue-600" /> button to regenerate an image with AI
              {process.env.NEXT_PUBLIC_ENABLE_AI_IMAGE_GENERATION !== 'true' && (
                <span className="text-orange-600 ml-1">(currently disabled - see alert for setup)</span>
              )}
            </li>
            <li>Images are automatically optimized for web delivery</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
