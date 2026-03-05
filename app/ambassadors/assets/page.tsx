'use client';
import { PiArrowSquareOutBold, PiDownloadSimpleBold, PiFileTextBold, PiFunnelBold, PiGridFourBold, PiImageBold, PiListBold, PiMagnifyingGlassBold, PiVideoCameraBold } from 'react-icons/pi';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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
  variations: Array<{
    label: string;
    url: string;
    width?: number;
    height?: number;
  }>;
  tags: string[];
  download_count: number;
}

const categoryIcons: Record<string, any> = {
  logo: Image,
  banner: Image,
  social: Image,
  flyer: PiFileTextBold,
  video: PiVideoCameraBold,
  document: PiFileTextBold,
  template: PiFileTextBold,
  other: PiFileTextBold,
};

const categoryLabels: Record<string, string> = {
  logo: 'Logos',
  banner: 'Banners',
  social: 'Social Media',
  flyer: 'Flyers',
  video: 'Videos',
  document: 'Documents',
  template: 'Templates',
  other: 'Other',
};

export default function AmbassadorAssetsPage() {
  const supabase = createClient();

  const [assets, setAssets] = useState<MarketingAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    const fetchAssets = async () => {
      try {
        let query = supabase
          .from('marketing_assets')
          .select('*')
          .in('visibility', ['public', 'ambassadors'])
          .eq('is_active', true)
          .order('created_at', { ascending: false });

        if (categoryFilter !== 'all') {
          query = query.eq('category', categoryFilter);
        }

        const { data, error } = await query;

        if (error) throw error;

        setAssets(data || []);
      } catch (error) {
        console.error('Error fetching assets:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAssets();
  }, [supabase, categoryFilter]);

  const handleDownload = async (asset: MarketingAsset, url?: string) => {
    const downloadUrl = url || asset.file_url;

    // Track download
    await supabase
      .from('marketing_assets')
      .update({
        download_count: asset.download_count + 1,
        last_downloaded_at: new Date().toISOString(),
      })
      .eq('id', asset.id);

    // Open download
    window.open(downloadUrl, '_blank');
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'Unknown size';
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  };

  const filteredAssets = assets.filter((asset) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      asset.title.toLowerCase().includes(term) ||
      asset.description?.toLowerCase().includes(term) ||
      asset.tags?.some((tag) => tag.toLowerCase().includes(term))
    );
  });

  // Group by category
  const groupedAssets = filteredAssets.reduce((acc, asset) => {
    if (!acc[asset.category]) {
      acc[asset.category] = [];
    }
    acc[asset.category].push(asset);
    return acc;
  }, {} as Record<string, MarketingAsset[]>);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-circleTel-orange border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Marketing Assets</h1>
        <p className="text-gray-500 mt-1">
          Download branded materials to promote CircleTel
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <PiMagnifyingGlassBold className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search assets..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <PiFunnelBold className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {Object.entries(categoryLabels).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex border rounded-lg">
          <button
            onClick={() => setViewMode('grid')}
            className={cn(
              'p-2 rounded-l-lg',
              viewMode === 'grid'
                ? 'bg-circleTel-orange text-white'
                : 'text-gray-500 hover:bg-gray-100'
            )}
          >
            <PiGridFourBold className="w-5 h-5" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={cn(
              'p-2 rounded-r-lg',
              viewMode === 'list'
                ? 'bg-circleTel-orange text-white'
                : 'text-gray-500 hover:bg-gray-100'
            )}
          >
            <PiListBold className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Assets */}
      {filteredAssets.length === 0 ? (
        <div className="bg-white rounded-xl border p-12 text-center">
          <PiImageBold className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No assets found
          </h3>
          <p className="text-gray-500">
            {searchTerm
              ? 'Try adjusting your search terms'
              : 'Marketing assets will appear here'}
          </p>
        </div>
      ) : categoryFilter === 'all' ? (
        // Grouped view
        <div className="space-y-8">
          {Object.entries(groupedAssets).map(([category, categoryAssets]) => {
            const Icon = categoryIcons[category] || PiFileTextBold;
            return (
              <div key={category}>
                <div className="flex items-center gap-2 mb-4">
                  <Icon className="w-5 h-5 text-gray-500" />
                  <h2 className="text-lg font-semibold text-gray-900">
                    {categoryLabels[category] || category}
                  </h2>
                  <span className="text-sm text-gray-500">
                    ({categoryAssets.length})
                  </span>
                </div>

                {viewMode === 'grid' ? (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {categoryAssets.map((asset) => (
                      <AssetCard
                        key={asset.id}
                        asset={asset}
                        onDownload={handleDownload}
                        formatFileSize={formatFileSize}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {categoryAssets.map((asset) => (
                      <AssetListItem
                        key={asset.id}
                        asset={asset}
                        onDownload={handleDownload}
                        formatFileSize={formatFileSize}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredAssets.map((asset) => (
            <AssetCard
              key={asset.id}
              asset={asset}
              onDownload={handleDownload}
              formatFileSize={formatFileSize}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredAssets.map((asset) => (
            <AssetListItem
              key={asset.id}
              asset={asset}
              onDownload={handleDownload}
              formatFileSize={formatFileSize}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Asset Card Component
function AssetCard({
  asset,
  onDownload,
  formatFileSize,
}: {
  asset: MarketingAsset;
  onDownload: (asset: MarketingAsset, url?: string) => void;
  formatFileSize: (bytes: number | null) => string;
}) {
  const [showVariations, setShowVariations] = useState(false);
  const isImage = asset.mime_type?.startsWith('image/');

  return (
    <div className="bg-white rounded-xl border overflow-hidden group">
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
            {asset.category === 'video' ? (
              <PiVideoCameraBold className="w-12 h-12 text-gray-400" />
            ) : (
              <PiFileTextBold className="w-12 h-12 text-gray-400" />
            )}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="font-medium text-gray-900 truncate">{asset.title}</h3>
        {asset.description && (
          <p className="text-sm text-gray-500 truncate mt-1">
            {asset.description}
          </p>
        )}
        <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
          {asset.width && asset.height && (
            <span>
              {asset.width}×{asset.height}
            </span>
          )}
          <span>{formatFileSize(asset.file_size)}</span>
          <span>•</span>
          <span>{asset.download_count} downloads</span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 mt-4">
          <button
            onClick={() => onDownload(asset)}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-circleTel-orange text-white text-sm font-medium rounded-lg hover:bg-orange-600 transition-colors"
          >
            <PiDownloadSimpleBold className="w-4 h-4" />
            Download
          </button>
          {asset.variations && asset.variations.length > 0 && (
            <button
              onClick={() => setShowVariations(!showVariations)}
              className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
              title="More sizes"
            >
              <PiArrowSquareOutBold className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Variations */}
        {showVariations && asset.variations && asset.variations.length > 0 && (
          <div className="mt-3 pt-3 border-t space-y-2">
            <p className="text-xs font-medium text-gray-500">Other sizes:</p>
            {asset.variations.map((variation, i) => (
              <button
                key={i}
                onClick={() => onDownload(asset, variation.url)}
                className="w-full flex items-center justify-between px-3 py-2 text-sm bg-gray-50 hover:bg-gray-100 rounded-lg"
              >
                <span>{variation.label}</span>
                {variation.width && variation.height && (
                  <span className="text-xs text-gray-400">
                    {variation.width}×{variation.height}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Asset List Item Component
function AssetListItem({
  asset,
  onDownload,
  formatFileSize,
}: {
  asset: MarketingAsset;
  onDownload: (asset: MarketingAsset) => void;
  formatFileSize: (bytes: number | null) => string;
}) {
  const Icon = categoryIcons[asset.category] || PiFileTextBold;

  return (
    <div className="bg-white rounded-lg border p-4 flex items-center gap-4">
      <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
        <Icon className="w-6 h-6 text-gray-400" />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-gray-900 truncate">{asset.title}</h3>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span className="capitalize">{asset.category}</span>
          <span>•</span>
          <span>{formatFileSize(asset.file_size)}</span>
          {asset.width && asset.height && (
            <>
              <span>•</span>
              <span>
                {asset.width}×{asset.height}
              </span>
            </>
          )}
        </div>
      </div>
      <button
        onClick={() => onDownload(asset)}
        className="flex items-center gap-2 px-4 py-2 bg-circleTel-orange text-white text-sm font-medium rounded-lg hover:bg-orange-600 transition-colors"
      >
        <PiDownloadSimpleBold className="w-4 h-4" />
        Download
      </button>
    </div>
  );
}
