'use client';

/**
 * CMS Page Builder - Media Picker Modal
 *
 * Modal component for selecting media from the library.
 * Used by block editors to insert images.
 */

import { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { MediaLibrary } from './MediaLibrary';
import type { CMSMedia } from '@/lib/cms/types';
import {
  X,
  Image as ImageIcon,
  Upload,
  Link,
  Loader2,
} from 'lucide-react';

// ============================================
// Types
// ============================================

interface MediaPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (media: { url: string; alt: string; width?: number; height?: number }) => void;
  allowedTypes?: string[];
  title?: string;
}

type PickerTab = 'library' | 'upload' | 'url';

// ============================================
// Media Picker Modal
// ============================================

export function MediaPicker({
  isOpen,
  onClose,
  onSelect,
  allowedTypes = ['image/'],
  title = 'Select Image',
}: MediaPickerProps) {
  const [activeTab, setActiveTab] = useState<PickerTab>('library');
  const [selectedMedia, setSelectedMedia] = useState<CMSMedia | null>(null);
  const [urlInput, setUrlInput] = useState('');
  const [urlAlt, setUrlAlt] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Handle library selection
  const handleLibrarySelect = (media: CMSMedia) => {
    setSelectedMedia(media);
  };

  // Handle URL insert
  const handleUrlInsert = () => {
    if (!urlInput.trim()) return;
    onSelect({
      url: urlInput.trim(),
      alt: urlAlt.trim() || 'Image',
    });
    onClose();
  };

  // Handle file upload
  const handleFileUpload = async (files: FileList) => {
    if (files.length === 0) return;

    setUploading(true);
    setUploadError(null);

    try {
      const file = files[0];
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'general');

      const response = await fetch('/api/admin/cms/media', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Upload failed');
      }

      const data = await response.json();

      // Immediately select the uploaded file
      onSelect({
        url: data.media.public_url,
        alt: data.media.alt_text || file.name,
        width: data.media.width,
        height: data.media.height,
      });
      onClose();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload failed';
      setUploadError(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  // Handle drag and drop
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        handleFileUpload(e.dataTransfer.files);
      }
    },
    []
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  // Handle insert selected
  const handleInsertSelected = () => {
    if (!selectedMedia) return;
    onSelect({
      url: selectedMedia.public_url,
      alt: selectedMedia.alt_text || selectedMedia.original_filename,
      width: selectedMedia.width || undefined,
      height: selectedMedia.height || undefined,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-4xl h-[80vh] mx-4 bg-white rounded-xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('library')}
            className={cn(
              'flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors',
              activeTab === 'library'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            )}
          >
            <ImageIcon className="w-4 h-4" />
            Media Library
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            className={cn(
              'flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors',
              activeTab === 'upload'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            )}
          >
            <Upload className="w-4 h-4" />
            Upload
          </button>
          <button
            onClick={() => setActiveTab('url')}
            className={cn(
              'flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors',
              activeTab === 'url'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            )}
          >
            <Link className="w-4 h-4" />
            URL
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {activeTab === 'library' && (
            <MediaLibrary
              selectionMode
              selectedId={selectedMedia?.id}
              onSelect={handleLibrarySelect}
              allowedTypes={allowedTypes}
              className="h-full"
            />
          )}

          {activeTab === 'upload' && (
            <div
              className="h-full flex items-center justify-center p-8"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
            >
              <div className="text-center">
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept={allowedTypes.join(',')}
                    className="hidden"
                    onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
                  />
                  <div className="w-32 h-32 mx-auto mb-4 rounded-full bg-orange-50 flex items-center justify-center">
                    {uploading ? (
                      <Loader2 className="w-12 h-12 text-orange-500 animate-spin" />
                    ) : (
                      <Upload className="w-12 h-12 text-orange-500" />
                    )}
                  </div>
                  <p className="text-lg font-medium text-gray-900 mb-2">
                    {uploading ? 'Uploading...' : 'Click to upload'}
                  </p>
                  <p className="text-sm text-gray-500">
                    or drag and drop your file here
                  </p>
                  <p className="text-xs text-gray-400 mt-2">
                    Max file size: 10MB • Supported: JPG, PNG, WebP, GIF, SVG
                  </p>
                </label>

                {uploadError && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    {uploadError}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'url' && (
            <div className="h-full flex items-center justify-center p-8">
              <div className="w-full max-w-md space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Image URL
                  </label>
                  <input
                    type="url"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="https://example.com/image.jpg"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Alt Text
                  </label>
                  <input
                    type="text"
                    value={urlAlt}
                    onChange={(e) => setUrlAlt(e.target.value)}
                    placeholder="Describe the image"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>

                {urlInput && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-2">Preview:</p>
                    <img
                      src={urlInput}
                      alt={urlAlt || 'Preview'}
                      className="max-h-48 mx-auto rounded-lg"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">?</text></svg>';
                      }}
                    />
                  </div>
                )}

                <button
                  onClick={handleUrlInsert}
                  disabled={!urlInput.trim()}
                  className={cn(
                    'w-full px-4 py-2 rounded-lg font-medium transition-colors',
                    urlInput.trim()
                      ? 'bg-orange-500 text-white hover:bg-orange-600'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  )}
                >
                  Insert Image
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer - only show when library tab is active and media is selected */}
        {activeTab === 'library' && selectedMedia && (
          <div className="px-6 py-4 border-t bg-gray-50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src={selectedMedia.public_url}
                alt={selectedMedia.alt_text || ''}
                className="w-12 h-12 object-cover rounded-lg"
              />
              <div>
                <p className="font-medium text-gray-900 text-sm">
                  {selectedMedia.original_filename}
                </p>
                <p className="text-xs text-gray-500">
                  {selectedMedia.width && selectedMedia.height
                    ? `${selectedMedia.width} x ${selectedMedia.height}`
                    : selectedMedia.mime_type}
                </p>
              </div>
            </div>
            <button
              onClick={handleInsertSelected}
              className="px-6 py-2 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition-colors"
            >
              Insert Selected
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================
// Hook for using MediaPicker
// ============================================

export function useMediaPicker() {
  const [isOpen, setIsOpen] = useState(false);
  const [onSelectCallback, setOnSelectCallback] = useState<
    ((media: { url: string; alt: string; width?: number; height?: number }) => void) | null
  >(null);

  const openPicker = (
    callback: (media: { url: string; alt: string; width?: number; height?: number }) => void
  ) => {
    setOnSelectCallback(() => callback);
    setIsOpen(true);
  };

  const closePicker = () => {
    setIsOpen(false);
    setOnSelectCallback(null);
  };

  const handleSelect = (media: { url: string; alt: string; width?: number; height?: number }) => {
    onSelectCallback?.(media);
    closePicker();
  };

  return {
    isOpen,
    openPicker,
    closePicker,
    MediaPickerComponent: () => (
      <MediaPicker
        isOpen={isOpen}
        onClose={closePicker}
        onSelect={handleSelect}
      />
    ),
  };
}

export default MediaPicker;
