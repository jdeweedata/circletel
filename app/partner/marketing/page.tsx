'use client';

/**
 * Partner Marketing Materials Page
 *
 * Provides partners with access to marketing assets:
 * - Logos and brand materials
 * - Social media templates
 * - Flyers and banners
 * - Product documentation
 */

import { useState, useEffect } from 'react';
import {
  Download,
  Search,
  Grid3X3,
  List,
  Image as ImageIcon,
  FileText,
  Video,
  File,
  Filter,
  Eye,
  ChevronDown,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface AssetVariation {
  label: string;
  url: string;
  width?: number;
  height?: number;
}

interface MarketingAsset {
  id: string;
  title: string;
  description: string | null;
  category: string;
  subcategory: string | null;
  file_url: string;
  file_name: string;
  file_size: number | null;
  mime_type: string | null;
  width: number | null;
  height: number | null;
  variations: AssetVariation[];
  visibility: string;
  download_count: number;
  tags: string[];
  created_at: string;
}

const CATEGORIES = [
  { value: 'all', label: 'All Assets' },
  { value: 'logo', label: 'Logos' },
  { value: 'banner', label: 'Banners' },
  { value: 'social', label: 'Social Media' },
  { value: 'flyer', label: 'Flyers' },
  { value: 'document', label: 'Documents' },
  { value: 'video', label: 'Videos' },
  { value: 'template', label: 'Templates' },
];

function getCategoryIcon(category: string) {
  switch (category) {
    case 'logo':
    case 'banner':
    case 'social':
    case 'flyer':
      return <ImageIcon className="w-5 h-5" />;
    case 'video':
      return <Video className="w-5 h-5" />;
    case 'document':
    case 'template':
      return <FileText className="w-5 h-5" />;
    default:
      return <File className="w-5 h-5" />;
  }
}

function formatFileSize(bytes: number | null): string {
  if (!bytes) return 'Unknown size';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function AssetCard({
  asset,
  viewMode,
  onDownload,
  onPreview,
}: {
  asset: MarketingAsset;
  viewMode: 'grid' | 'list';
  onDownload: (asset: MarketingAsset) => void;
  onPreview: (asset: MarketingAsset) => void;
}) {
  const isImage = asset.mime_type?.startsWith('image/');

  if (viewMode === 'list') {
    return (
      <div className="flex items-center gap-4 p-4 bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
        {/* Thumbnail */}
        <div className="flex-shrink-0 w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
          {isImage ? (
            <img
              src={asset.file_url}
              alt={asset.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="text-gray-400">{getCategoryIcon(asset.category)}</div>
          )}
        </div>

        {/* Details */}
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-gray-900 truncate">{asset.title}</h3>
          <p className="text-sm text-gray-500">
            {asset.category.charAt(0).toUpperCase() + asset.category.slice(1)} |{' '}
            {formatFileSize(asset.file_size)}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onPreview(asset)}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            title="Preview"
          >
            <Eye className="w-5 h-5" />
          </button>
          <button
            onClick={() => onDownload(asset)}
            className="flex items-center gap-2 px-4 py-2 bg-circleTel-orange text-white rounded-lg hover:bg-orange-600 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span className="text-sm font-medium">Download</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:border-gray-300 hover:shadow-md transition-all">
      {/* Image/Preview area */}
      <div className="aspect-[4/3] bg-gray-100 relative group">
        {isImage ? (
          <img
            src={asset.file_url}
            alt={asset.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            {getCategoryIcon(asset.category)}
          </div>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <button
            onClick={() => onPreview(asset)}
            className="p-3 bg-white rounded-full text-gray-700 hover:bg-gray-100 transition-colors"
            title="Preview"
          >
            <Eye className="w-5 h-5" />
          </button>
          <button
            onClick={() => onDownload(asset)}
            className="p-3 bg-circleTel-orange rounded-full text-white hover:bg-orange-600 transition-colors"
            title="Download"
          >
            <Download className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Details */}
      <div className="p-4">
        <h3 className="font-medium text-gray-900 truncate mb-1">{asset.title}</h3>
        <p className="text-sm text-gray-500 line-clamp-2 mb-3">
          {asset.description || 'No description'}
        </p>
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-full">
            {getCategoryIcon(asset.category)}
            <span className="capitalize">{asset.category}</span>
          </span>
          <span>{formatFileSize(asset.file_size)}</span>
        </div>
      </div>
    </div>
  );
}

export default function PartnerMarketingPage() {
  const [assets, setAssets] = useState<MarketingAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [previewAsset, setPreviewAsset] = useState<MarketingAsset | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);

  useEffect(() => {
    fetchAssets();
  }, [selectedCategory, searchQuery]);

  const fetchAssets = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCategory !== 'all') {
        params.append('category', selectedCategory);
      }
      if (searchQuery) {
        params.append('search', searchQuery);
      }
      params.append('is_active', 'true');

      const response = await fetch(`/api/partners/marketing/assets?${params}`);
      if (response.ok) {
        const data = await response.json();
        setAssets(data.assets || []);
      }
    } catch (error) {
      console.error('Error fetching assets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (asset: MarketingAsset) => {
    setDownloading(asset.id);
    try {
      // Track download
      await fetch(`/api/partners/marketing/assets/${asset.id}/download`, {
        method: 'POST',
      });

      // Trigger download
      const link = document.createElement('a');
      link.href = asset.file_url;
      link.download = asset.file_name;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Download error:', error);
    } finally {
      setDownloading(null);
    }
  };

  const handlePreview = (asset: MarketingAsset) => {
    setPreviewAsset(asset);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Marketing Materials</h1>
        <p className="text-gray-600 mt-1">
          Download logos, banners, flyers, and other marketing materials for your campaigns.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search assets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-circleTel-orange/20 focus:border-circleTel-orange"
          />
        </div>

        {/* Category filter */}
        <div className="relative">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="appearance-none pl-10 pr-10 py-2.5 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-circleTel-orange/20 focus:border-circleTel-orange"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        </div>

        {/* View toggle */}
        <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-lg">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-md transition-colors ${
              viewMode === 'grid'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Grid3X3 className="w-5 h-5" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-md transition-colors ${
              viewMode === 'list'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <List className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Results count */}
      <div className="text-sm text-gray-500">
        {loading ? 'Loading...' : `${assets.length} asset${assets.length !== 1 ? 's' : ''} found`}
      </div>

      {/* Assets grid/list */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-circleTel-orange border-t-transparent rounded-full animate-spin" />
        </div>
      ) : assets.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ImageIcon className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="font-medium text-gray-900 mb-1">No assets found</h3>
          <p className="text-gray-500">
            {searchQuery || selectedCategory !== 'all'
              ? 'Try adjusting your filters'
              : 'Marketing materials will appear here'}
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {assets.map((asset) => (
            <AssetCard
              key={asset.id}
              asset={asset}
              viewMode="grid"
              onDownload={handleDownload}
              onPreview={handlePreview}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {assets.map((asset) => (
            <AssetCard
              key={asset.id}
              asset={asset}
              viewMode="list"
              onDownload={handleDownload}
              onPreview={handlePreview}
            />
          ))}
        </div>
      )}

      {/* Preview Modal */}
      {previewAsset && (
        <div
          className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
          onClick={() => setPreviewAsset(null)}
        >
          <div
            className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div>
                <h3 className="font-semibold text-gray-900">{previewAsset.title}</h3>
                <p className="text-sm text-gray-500 capitalize">{previewAsset.category}</p>
              </div>
              <button
                onClick={() => setPreviewAsset(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal content */}
            <div className="p-4 max-h-[60vh] overflow-y-auto">
              {previewAsset.mime_type?.startsWith('image/') ? (
                <img
                  src={previewAsset.file_url}
                  alt={previewAsset.title}
                  className="w-full h-auto rounded-lg"
                />
              ) : previewAsset.mime_type?.startsWith('video/') ? (
                <video
                  src={previewAsset.file_url}
                  controls
                  className="w-full h-auto rounded-lg"
                />
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                  {getCategoryIcon(previewAsset.category)}
                  <p className="mt-2">{previewAsset.file_name}</p>
                  <p className="text-sm">{formatFileSize(previewAsset.file_size)}</p>
                </div>
              )}

              {previewAsset.description && (
                <p className="mt-4 text-gray-600">{previewAsset.description}</p>
              )}

              {/* Variations */}
              {previewAsset.variations && previewAsset.variations.length > 0 && (
                <div className="mt-6">
                  <h4 className="font-medium text-gray-900 mb-3">Available Sizes</h4>
                  <div className="flex flex-wrap gap-2">
                    {previewAsset.variations.map((variation, idx) => (
                      <a
                        key={idx}
                        href={variation.url}
                        download
                        className="inline-flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm transition-colors"
                      >
                        <Download className="w-4 h-4" />
                        {variation.label}
                        {variation.width && variation.height && (
                          <span className="text-gray-500">
                            ({variation.width}x{variation.height})
                          </span>
                        )}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal footer */}
            <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200">
              <button
                onClick={() => setPreviewAsset(null)}
                className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => handleDownload(previewAsset)}
                disabled={downloading === previewAsset.id}
                className="flex items-center gap-2 px-4 py-2 bg-circleTel-orange text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                {downloading === previewAsset.id ? 'Downloading...' : 'Download'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
