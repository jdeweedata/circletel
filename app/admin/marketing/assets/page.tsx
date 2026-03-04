'use client';
import { PiArrowsClockwiseBold, PiDotsThreeBold, PiDownloadSimpleBold, PiEyeBold, PiEyeSlashBold, PiFileTextBold, PiFunnelBold, PiImageBold, PiMagnifyingGlassBold, PiPencilSimpleBold, PiPlusBold, PiSpinnerBold, PiTrashBold, PiUploadSimpleBold } from 'react-icons/pi';

/**
 * Admin Marketing Assets Page
 *
 * Manage the marketing asset library - upload, edit, and organize
 * marketing materials for ambassadors, partners, and internal use.
 */

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

type AssetCategory =
  | 'logo'
  | 'banner'
  | 'social'
  | 'flyer'
  | 'video'
  | 'document'
  | 'template'
  | 'other';

type AssetVisibility = 'public' | 'ambassadors' | 'partners' | 'internal';

interface MarketingAsset {
  id: string;
  title: string;
  description: string | null;
  category: AssetCategory;
  subcategory: string | null;
  file_url: string;
  file_name: string;
  file_size: number | null;
  mime_type: string | null;
  width: number | null;
  height: number | null;
  visibility: AssetVisibility;
  download_count: number;
  tags: string[];
  is_active: boolean;
  created_at: string;
}

interface AssetFormData {
  title: string;
  description: string;
  category: AssetCategory;
  subcategory: string;
  file_url: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  width: number;
  height: number;
  visibility: AssetVisibility;
  tags: string;
}

const categoryOptions: { value: AssetCategory; label: string }[] = [
  { value: 'logo', label: 'Logos' },
  { value: 'banner', label: 'Banners' },
  { value: 'social', label: 'Social Media' },
  { value: 'flyer', label: 'Flyers' },
  { value: 'video', label: 'Videos' },
  { value: 'document', label: 'Documents' },
  { value: 'template', label: 'Templates' },
  { value: 'other', label: 'Other' },
];

const visibilityOptions: { value: AssetVisibility; label: string }[] = [
  { value: 'public', label: 'Public (Everyone)' },
  { value: 'ambassadors', label: 'Ambassadors' },
  { value: 'partners', label: 'Partners' },
  { value: 'internal', label: 'Internal Only' },
];

const categoryIcons: Record<AssetCategory, typeof Image> = {
  logo: Image,
  banner: Image,
  social: Image,
  flyer: FileText,
  video: Video,
  document: FileText,
  template: FileText,
  other: FileText,
};

export default function AdminAssetsPage() {
  const [assets, setAssets] = useState<MarketingAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<AssetCategory | 'all'>('all');
  const [visibilityFilter, setVisibilityFilter] = useState<AssetVisibility | 'all'>('all');

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<MarketingAsset | null>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<AssetFormData>({
    title: '',
    description: '',
    category: 'logo',
    subcategory: '',
    file_url: '',
    file_name: '',
    file_size: 0,
    mime_type: '',
    width: 0,
    height: 0,
    visibility: 'internal',
    tags: '',
  });

  // Delete confirmation
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Action menu
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);

  const fetchAssets = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (categoryFilter !== 'all') params.set('category', categoryFilter);
      if (visibilityFilter !== 'all') params.set('visibility', visibilityFilter);
      if (searchTerm) params.set('search', searchTerm);

      const res = await fetch(`/api/admin/marketing/assets?${params}`);
      if (!res.ok) throw new Error('Failed to fetch assets');

      const data = await res.json();
      setAssets(data.assets || []);
    } catch (err) {
      console.error('Error fetching assets:', err);
      setError(err instanceof Error ? err.message : 'Failed to load assets');
    } finally {
      setLoading(false);
    }
  }, [categoryFilter, visibilityFilter, searchTerm]);

  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  const openCreateModal = () => {
    setEditingAsset(null);
    setFormData({
      title: '',
      description: '',
      category: 'logo',
      subcategory: '',
      file_url: '',
      file_name: '',
      file_size: 0,
      mime_type: '',
      width: 0,
      height: 0,
      visibility: 'internal',
      tags: '',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (asset: MarketingAsset) => {
    setEditingAsset(asset);
    setFormData({
      title: asset.title,
      description: asset.description || '',
      category: asset.category,
      subcategory: asset.subcategory || '',
      file_url: asset.file_url,
      file_name: asset.file_name,
      file_size: asset.file_size || 0,
      mime_type: asset.mime_type || '',
      width: asset.width || 0,
      height: asset.height || 0,
      visibility: asset.visibility,
      tags: asset.tags?.join(', ') || '',
    });
    setIsModalOpen(true);
    setActionMenuOpen(null);
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      const payload = {
        ...formData,
        tags: formData.tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
      };

      const url = editingAsset
        ? `/api/admin/marketing/assets/${editingAsset.id}`
        : '/api/admin/marketing/assets';

      const res = await fetch(url, {
        method: editingAsset ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to save asset');
      }

      setIsModalOpen(false);
      fetchAssets();
    } catch (err) {
      console.error('Error saving asset:', err);
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setDeleting(true);

      const res = await fetch(`/api/admin/marketing/assets/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete asset');

      setDeleteConfirm(null);
      fetchAssets();
    } catch (err) {
      console.error('Error deleting asset:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete');
    } finally {
      setDeleting(false);
    }
  };

  const toggleActive = async (asset: MarketingAsset) => {
    try {
      const res = await fetch(`/api/admin/marketing/assets/${asset.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !asset.is_active }),
      });

      if (!res.ok) throw new Error('Failed to update asset');

      fetchAssets();
      setActionMenuOpen(null);
    } catch (err) {
      console.error('Error toggling asset:', err);
      setError(err instanceof Error ? err.message : 'Failed to update');
    }
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return '—';
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  };

  const visibilityBadgeColors: Record<AssetVisibility, string> = {
    public: 'bg-green-100 text-green-700',
    ambassadors: 'bg-blue-100 text-blue-700',
    partners: 'bg-purple-100 text-purple-700',
    internal: 'bg-gray-100 text-gray-700',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Marketing Assets</h1>
          <p className="text-gray-500 mt-1">
            Manage branded materials for ambassadors and partners
          </p>
        </div>
        <Button onClick={openCreateModal}>
          <PiPlusBold className="h-4 w-4 mr-2" />
          Upload Asset
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 bg-white p-4 rounded-lg border">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <PiMagnifyingGlassBold className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search assets..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select
          value={categoryFilter}
          onValueChange={(value) => setCategoryFilter(value as AssetCategory | 'all')}
        >
          <SelectTrigger className="w-[160px]">
            <PiFunnelBold className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categoryOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={visibilityFilter}
          onValueChange={(value) => setVisibilityFilter(value as AssetVisibility | 'all')}
        >
          <SelectTrigger className="w-[160px]">
            <PiEyeBold className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Visibility" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Visibility</SelectItem>
            {visibilityOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" size="icon" onClick={fetchAssets}>
          <PiArrowsClockwiseBold className={cn('h-4 w-4', loading && 'animate-spin')} />
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      )}

      {/* Assets Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <PiSpinnerBold className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : assets.length === 0 ? (
        <div className="bg-white rounded-xl border p-12 text-center">
          <PiUploadSimpleBold className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No assets yet
          </h3>
          <p className="text-gray-500 mb-6">
            Upload marketing materials for your team and partners.
          </p>
          <Button onClick={openCreateModal}>
            <PiPlusBold className="h-4 w-4 mr-2" />
            Upload First Asset
          </Button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {assets.map((asset) => {
            const Icon = categoryIcons[asset.category] || FileText;
            const isImage = asset.mime_type?.startsWith('image/');

            return (
              <div
                key={asset.id}
                className={cn(
                  'bg-white rounded-xl border overflow-hidden group',
                  !asset.is_active && 'opacity-60'
                )}
              >
                {/* Preview */}
                <div className="aspect-video bg-gray-100 relative overflow-hidden">
                  {isImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={asset.file_url}
                      alt={asset.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Icon className="h-12 w-12 text-gray-400" />
                    </div>
                  )}

                  {/* Actions overlay */}
                  <div className="absolute top-2 right-2">
                    <div className="relative">
                      <button
                        onClick={() =>
                          setActionMenuOpen(
                            actionMenuOpen === asset.id ? null : asset.id
                          )
                        }
                        className="p-1.5 bg-white/90 rounded-lg shadow hover:bg-white"
                      >
                        <PiDotsThreeBold className="h-4 w-4" />
                      </button>

                      {actionMenuOpen === asset.id && (
                        <>
                          <div
                            className="fixed inset-0 z-40"
                            onClick={() => setActionMenuOpen(null)}
                          />
                          <div className="absolute right-0 mt-1 w-40 bg-white rounded-lg shadow-lg border z-50">
                            <div className="py-1">
                              <button
                                onClick={() => openEditModal(asset)}
                                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
                              >
                                <PiPencilSimpleBold className="h-4 w-4" />
                                Edit
                              </button>
                              <button
                                onClick={() => toggleActive(asset)}
                                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
                              >
                                {asset.is_active ? (
                                  <>
                                    <PiEyeSlashBold className="h-4 w-4" />
                                    Deactivate
                                  </>
                                ) : (
                                  <>
                                    <PiEyeBold className="h-4 w-4" />
                                    Activate
                                  </>
                                )}
                              </button>
                              <button
                                onClick={() => {
                                  setDeleteConfirm(asset.id);
                                  setActionMenuOpen(null);
                                }}
                                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2 text-red-600"
                              >
                                <PiTrashBold className="h-4 w-4" />
                                Delete
                              </button>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Info */}
                <div className="p-4">
                  <h3 className="font-medium text-gray-900 truncate">
                    {asset.title}
                  </h3>
                  <div className="flex items-center gap-2 mt-2">
                    <span
                      className={cn(
                        'px-2 py-0.5 text-xs font-medium rounded-full',
                        visibilityBadgeColors[asset.visibility]
                      )}
                    >
                      {asset.visibility}
                    </span>
                    <span className="text-xs text-gray-500">
                      {asset.download_count} downloads
                    </span>
                  </div>
                  <div className="text-xs text-gray-400 mt-2">
                    {formatFileSize(asset.file_size)}
                    {asset.width && asset.height && (
                      <span> · {asset.width}×{asset.height}</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingAsset ? 'Edit Asset' : 'Upload New Asset'}
            </DialogTitle>
            <DialogDescription>
              {editingAsset
                ? 'Update asset details and visibility settings.'
                : 'Add a new marketing asset to the library.'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="Asset title"
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Brief description..."
                  rows={2}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) =>
                    setFormData({ ...formData, category: value as AssetCategory })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categoryOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="visibility">Visibility</Label>
                <Select
                  value={formData.visibility}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      visibility: value as AssetVisibility,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {visibilityOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="file_url">File URL</Label>
              <Input
                id="file_url"
                value={formData.file_url}
                onChange={(e) =>
                  setFormData({ ...formData, file_url: e.target.value })
                }
                placeholder="https://storage.example.com/asset.png"
              />
              <p className="text-xs text-gray-500 mt-1">
                Direct link to the asset file (Supabase Storage or CDN)
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="file_name">File Name</Label>
                <Input
                  id="file_name"
                  value={formData.file_name}
                  onChange={(e) =>
                    setFormData({ ...formData, file_name: e.target.value })
                  }
                  placeholder="logo-orange.png"
                />
              </div>
              <div>
                <Label htmlFor="mime_type">MIME Type</Label>
                <Input
                  id="mime_type"
                  value={formData.mime_type}
                  onChange={(e) =>
                    setFormData({ ...formData, mime_type: e.target.value })
                  }
                  placeholder="image/png"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="width">Width (px)</Label>
                <Input
                  id="width"
                  type="number"
                  value={formData.width || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      width: parseInt(e.target.value) || 0,
                    })
                  }
                />
              </div>
              <div>
                <Label htmlFor="height">Height (px)</Label>
                <Input
                  id="height"
                  type="number"
                  value={formData.height || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      height: parseInt(e.target.value) || 0,
                    })
                  }
                />
              </div>
              <div>
                <Label htmlFor="file_size">File Size (bytes)</Label>
                <Input
                  id="file_size"
                  type="number"
                  value={formData.file_size || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      file_size: parseInt(e.target.value) || 0,
                    })
                  }
                />
              </div>
            </div>

            <div>
              <Label htmlFor="tags">Tags (comma separated)</Label>
              <Input
                id="tags"
                value={formData.tags}
                onChange={(e) =>
                  setFormData({ ...formData, tags: e.target.value })
                }
                placeholder="logo, orange, brand"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving || !formData.title || !formData.file_url}
            >
              {saving ? (
                <>
                  <PiSpinnerBold className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : editingAsset ? (
                'Update Asset'
              ) : (
                'Upload Asset'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Asset</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this asset? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
              disabled={deleting}
            >
              {deleting ? (
                <>
                  <PiSpinnerBold className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
