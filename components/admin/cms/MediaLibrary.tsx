'use client';

/**
 * CMS Page Builder - Media Library
 *
 * Component for browsing, uploading, and managing media files.
 */

import { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import type { CMSMedia } from '@/lib/cms/types';
import {
  Upload,
  Search,
  Folder,
  Image as ImageIcon,
  Trash2,
  Edit2,
  Check,
  X,
  Loader2,
  Grid,
  List,
  RefreshCw,
  FolderPlus,
  Download,
  Copy,
  MoreHorizontal,
} from 'lucide-react';

// ============================================
// Types
// ============================================

interface MediaLibraryProps {
  onSelect?: (media: CMSMedia) => void;
  selectionMode?: boolean;
  selectedId?: string;
  allowedTypes?: string[];
  className?: string;
}

interface FolderInfo {
  name: string;
  count: number;
}

// ============================================
// Media Library Component
// ============================================

export function MediaLibrary({
  onSelect,
  selectionMode = false,
  selectedId,
  allowedTypes,
  className,
}: MediaLibraryProps) {
  const [media, setMedia] = useState<CMSMedia[]>([]);
  const [folders, setFolders] = useState<FolderInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentFolder, setCurrentFolder] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [editingMedia, setEditingMedia] = useState<CMSMedia | null>(null);
  const [editAltText, setEditAltText] = useState('');
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);

  // Fetch media
  const fetchMedia = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (currentFolder !== 'all') params.append('folder', currentFolder);
      if (searchTerm) params.append('search', searchTerm);

      const response = await fetch(`/api/admin/cms/media?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch media');

      const data = await response.json();

      let filteredMedia = data.media || [];

      // Filter by allowed types if specified
      if (allowedTypes && allowedTypes.length > 0) {
        filteredMedia = filteredMedia.filter((m: CMSMedia) =>
          allowedTypes.some((type) => m.mime_type.startsWith(type))
        );
      }

      setMedia(filteredMedia);
      setFolders(data.folders || []);
    } catch (err) {
      console.error('Failed to fetch media:', err);
      setError('Failed to load media library');
    } finally {
      setLoading(false);
    }
  }, [currentFolder, searchTerm, allowedTypes]);

  useEffect(() => {
    fetchMedia();
  }, [fetchMedia]);

  // Handle file upload
  const handleUpload = async (files: FileList) => {
    setUploading(true);
    setError(null);

    const uploadPromises = Array.from(files).map(async (file) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', currentFolder === 'all' ? 'general' : currentFolder);

      const response = await fetch('/api/admin/cms/media', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Upload failed');
      }

      return response.json();
    });

    try {
      await Promise.all(uploadPromises);
      fetchMedia();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload failed';
      setError(errorMessage);
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
        handleUpload(e.dataTransfer.files);
      }
    },
    [currentFolder]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  // Handle delete
  const handleDelete = async (mediaId: string) => {
    if (!confirm('Are you sure you want to delete this file?')) return;

    try {
      const response = await fetch(`/api/admin/cms/media/${mediaId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete');

      setMedia((prev) => prev.filter((m) => m.id !== mediaId));
    } catch (err) {
      console.error('Delete failed:', err);
      setError('Failed to delete file');
    }
  };

  // Handle update
  const handleUpdate = async (mediaId: string, altText: string) => {
    try {
      const response = await fetch(`/api/admin/cms/media/${mediaId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alt_text: altText }),
      });

      if (!response.ok) throw new Error('Failed to update');

      const data = await response.json();
      setMedia((prev) =>
        prev.map((m) => (m.id === mediaId ? data.media : m))
      );
      setEditingMedia(null);
    } catch (err) {
      console.error('Update failed:', err);
      setError('Failed to update file');
    }
  };

  // Copy URL to clipboard
  const copyUrl = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div
      className={cn('flex flex-col h-full', className)}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      {/* Header */}
      <div className="p-4 border-b bg-white">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Media Library</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchMedia}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Refresh"
            >
              <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
            </button>
            <button
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {viewMode === 'grid' ? (
                <List className="w-4 h-4" />
              ) : (
                <Grid className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Search and Upload */}
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search media..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <label className="cursor-pointer">
            <input
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={(e) => e.target.files && handleUpload(e.target.files)}
            />
            <div className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors">
              {uploading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
              <span className="text-sm font-medium">Upload</span>
            </div>
          </label>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Folders Sidebar */}
        <div className="w-48 border-r bg-gray-50 p-3 overflow-y-auto">
          <div className="space-y-1">
            <button
              onClick={() => setCurrentFolder('all')}
              className={cn(
                'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors',
                currentFolder === 'all'
                  ? 'bg-orange-100 text-orange-700'
                  : 'hover:bg-gray-100 text-gray-700'
              )}
            >
              <Folder className="w-4 h-4" />
              <span>All Files</span>
              <span className="ml-auto text-xs text-gray-500">
                {media.length}
              </span>
            </button>
            {folders.map((folder) => (
              <button
                key={folder.name}
                onClick={() => setCurrentFolder(folder.name)}
                className={cn(
                  'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors',
                  currentFolder === folder.name
                    ? 'bg-orange-100 text-orange-700'
                    : 'hover:bg-gray-100 text-gray-700'
                )}
              >
                <Folder className="w-4 h-4" />
                <span className="truncate">{folder.name}</span>
                <span className="ml-auto text-xs text-gray-500">
                  {folder.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Media Grid/List */}
        <div className="flex-1 overflow-y-auto p-4">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
            </div>
          ) : media.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
              <ImageIcon className="w-12 h-12 mb-4 text-gray-300" />
              <p className="text-sm">No media files found</p>
              <p className="text-xs mt-1">Upload images or drag and drop</p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {media.map((item) => (
                <MediaGridItem
                  key={item.id}
                  media={item}
                  selected={selectedId === item.id}
                  selectionMode={selectionMode}
                  onSelect={() => onSelect?.(item)}
                  onDelete={() => handleDelete(item.id)}
                  onEdit={() => {
                    setEditingMedia(item);
                    setEditAltText(item.alt_text || '');
                  }}
                  onCopy={() => copyUrl(item.public_url)}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {media.map((item) => (
                <MediaListItem
                  key={item.id}
                  media={item}
                  selected={selectedId === item.id}
                  selectionMode={selectionMode}
                  onSelect={() => onSelect?.(item)}
                  onDelete={() => handleDelete(item.id)}
                  onEdit={() => {
                    setEditingMedia(item);
                    setEditAltText(item.alt_text || '');
                  }}
                  onCopy={() => copyUrl(item.public_url)}
                  formatFileSize={formatFileSize}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {editingMedia && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">Edit Media</h3>
            <div className="space-y-4">
              <div>
                <img
                  src={editingMedia.public_url}
                  alt={editingMedia.alt_text || ''}
                  className="w-full h-48 object-cover rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Alt Text
                </label>
                <input
                  type="text"
                  value={editAltText}
                  onChange={(e) => setEditAltText(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  placeholder="Describe the image"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setEditingMedia(null)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleUpdate(editingMedia.id, editAltText)}
                  className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// Media Grid Item Component
// ============================================

interface MediaItemProps {
  media: CMSMedia;
  selected: boolean;
  selectionMode: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onEdit: () => void;
  onCopy: () => void;
}

function MediaGridItem({
  media,
  selected,
  selectionMode,
  onSelect,
  onDelete,
  onEdit,
  onCopy,
}: MediaItemProps) {
  const [showActions, setShowActions] = useState(false);

  return (
    <div
      className={cn(
        'relative group rounded-lg overflow-hidden border-2 transition-all cursor-pointer',
        selected ? 'border-orange-500 ring-2 ring-orange-200' : 'border-transparent hover:border-gray-300'
      )}
      onClick={selectionMode ? onSelect : undefined}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className="aspect-square bg-gray-100">
        <img
          src={media.public_url}
          alt={media.alt_text || media.original_filename}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>

      {/* Selection indicator */}
      {selectionMode && selected && (
        <div className="absolute top-2 right-2 w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
          <Check className="w-4 h-4 text-white" />
        </div>
      )}

      {/* Hover actions */}
      {showActions && !selectionMode && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className="p-2 bg-white rounded-lg hover:bg-gray-100"
            title="Edit"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCopy();
            }}
            className="p-2 bg-white rounded-lg hover:bg-gray-100"
            title="Copy URL"
          >
            <Copy className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-2 bg-white rounded-lg hover:bg-red-100 text-red-600"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* File name */}
      <div className="p-2 bg-white">
        <p className="text-xs text-gray-600 truncate" title={media.original_filename}>
          {media.original_filename}
        </p>
      </div>
    </div>
  );
}

// ============================================
// Media List Item Component
// ============================================

interface MediaListItemProps extends MediaItemProps {
  formatFileSize: (bytes: number) => string;
}

function MediaListItem({
  media,
  selected,
  selectionMode,
  onSelect,
  onDelete,
  onEdit,
  onCopy,
  formatFileSize,
}: MediaListItemProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-4 p-3 rounded-lg border transition-all cursor-pointer',
        selected ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:border-gray-300'
      )}
      onClick={selectionMode ? onSelect : undefined}
    >
      <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
        <img
          src={media.public_url}
          alt={media.alt_text || media.original_filename}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-900 truncate">{media.original_filename}</p>
        <p className="text-sm text-gray-500">
          {formatFileSize(media.file_size)} • {media.mime_type}
        </p>
      </div>

      {selectionMode ? (
        selected && (
          <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
            <Check className="w-4 h-4 text-white" />
          </div>
        )
      ) : (
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className="p-2 hover:bg-gray-100 rounded-lg"
            title="Edit"
          >
            <Edit2 className="w-4 h-4 text-gray-600" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCopy();
            }}
            className="p-2 hover:bg-gray-100 rounded-lg"
            title="Copy URL"
          >
            <Copy className="w-4 h-4 text-gray-600" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-2 hover:bg-red-100 rounded-lg"
            title="Delete"
          >
            <Trash2 className="w-4 h-4 text-red-600" />
          </button>
        </div>
      )}
    </div>
  );
}

export default MediaLibrary;
