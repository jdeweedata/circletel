'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Product } from '@/lib/types/products';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import {
  Package,
  Edit,
  Eye,
  Copy,
  Archive,
  DollarSign,
  History,
  GripVertical,
  UploadCloud,
  CheckCircle2,
  CloudOff,
  RefreshCw,
  AlertCircle,
  ArrowDown,
  ArrowUp,
  MoreHorizontal,
} from 'lucide-react';
import { getCategoryTheme, formatCategoryName } from '@/lib/admin/product-category-theme';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export interface AdminProductCardProps {
  product: Product;
  selected?: boolean;
  onSelect?: (productId: string, selected: boolean) => void;
  onEdit?: (product: Product) => void;
  onView?: (product: Product) => void;
  onToggleStatus?: (product: Product) => void;
  onDuplicate?: (product: Product) => void;
  onArchive?: (product: Product) => void;
  onPriceEdit?: (product: Product) => void;
  onViewAuditHistory?: (product: Product) => void;
  onPublish?: (product: Product) => void;
  onResync?: (product: Product) => void;
  hasEditPermission?: boolean;
  hasDeletePermission?: boolean;
  hasPricingPermission?: boolean;
  hasCreatePermission?: boolean;
  isDragging?: boolean;
  dragHandleProps?: any;
  showStats?: boolean;
  stats?: {
    orders?: number;
    views?: number;
    revenue?: number;
  };
  integrationStatus?: {
    zohoProductId?: string | null;
    syncStatus?: 'ok' | 'failed' | 'pending' | null;
    lastSyncedAt?: string | null;
    lastSyncError?: string | null;
    retryCount?: number;
    nextRetryAt?: string | null;
    lastRetryAt?: string | null;
    errorDetails?: any;
  };
}

/**
 * AdminProductCard Component
 *
 * Clean, minimal card design matching the reference:
 * - Category badge (top-left)
 * - Product icon + name + SKU (centered)
 * - Price display
 * - Speed specs (DOWN/UP)
 * - Footer with sync status + visibility toggle
 */
export function AdminProductCard({
  product,
  selected = false,
  onSelect,
  onEdit,
  onView,
  onToggleStatus,
  onDuplicate,
  onArchive,
  onPriceEdit,
  onViewAuditHistory,
  onPublish,
  onResync,
  hasEditPermission = false,
  hasDeletePermission = false,
  hasPricingPermission = false,
  hasCreatePermission = false,
  isDragging = false,
  dragHandleProps,
  integrationStatus,
}: AdminProductCardProps) {
  // Get sync status indicator
  const getSyncStatus = () => {
    if (!integrationStatus || !integrationStatus.syncStatus) {
      return { icon: CloudOff, text: 'Not Synced', color: 'text-gray-400' };
    }
    switch (integrationStatus.syncStatus) {
      case 'ok':
        return { icon: CheckCircle2, text: 'Synced', color: 'text-emerald-500' };
      case 'failed':
        return { icon: AlertCircle, text: 'Failed', color: 'text-red-500' };
      case 'pending':
        return { icon: RefreshCw, text: 'Syncing', color: 'text-blue-500', spinning: true };
      default:
        return { icon: CloudOff, text: 'Not Synced', color: 'text-gray-400' };
    }
  };

  const syncStatus = getSyncStatus();
  const SyncIcon = syncStatus.icon;

  // Get category theme
  const theme = getCategoryTheme(product.category);
  const CategoryIcon = theme.icon;

  return (
    <div
      className={cn(
        'group relative w-full',
        'bg-white rounded-2xl border transition-all duration-200 ease-in-out',
        'shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)]',
        selected && 'border-circleTel-orange ring-2 ring-circleTel-orange ring-offset-2',
        !selected && 'border-gray-100 hover:border-gray-200',
        isDragging && 'opacity-50 rotate-1 scale-105'
      )}
    >
      {/* Selection Checkbox & Drag Handle - Hidden by default, shown on hover */}
      <div
        className={cn(
          'absolute top-3 left-3 flex items-center gap-1.5 z-20',
          'opacity-0 group-hover:opacity-100 transition-opacity duration-200'
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {onSelect && (
          <Checkbox
            checked={selected}
            onCheckedChange={(checked) => onSelect(product.id, checked as boolean)}
            className="h-4 w-4 bg-white border-gray-300 shadow-sm"
          />
        )}
        {dragHandleProps && (
          <div
            {...dragHandleProps}
            className="cursor-grab active:cursor-grabbing p-0.5 bg-white/80 rounded border border-gray-200 shadow-sm"
          >
            <GripVertical className="h-3.5 w-3.5 text-gray-400" />
          </div>
        )}
      </div>

      {/* Quick Actions - Top Right - Hidden by default */}
      <div
        className={cn(
          'absolute top-3 right-3 z-20',
          'opacity-0 group-hover:opacity-100 transition-opacity duration-200'
        )}
      >
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="secondary"
              size="sm"
              className="h-7 w-7 p-0 bg-white/90 backdrop-blur-sm border border-gray-200 shadow-sm hover:bg-white rounded-lg"
            >
              <MoreHorizontal className="h-4 w-4 text-gray-600" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            {onView && (
              <DropdownMenuItem onClick={() => onView(product)}>
                <Eye className="w-4 h-4 mr-2" />
                View Details
              </DropdownMenuItem>
            )}
            {onEdit && hasEditPermission && (
              <DropdownMenuItem onClick={() => onEdit(product)}>
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </DropdownMenuItem>
            )}
            {onPriceEdit && hasPricingPermission && (
              <DropdownMenuItem onClick={() => onPriceEdit(product)}>
                <DollarSign className="w-4 h-4 mr-2" />
                Edit Price
              </DropdownMenuItem>
            )}
            {onViewAuditHistory && (
              <DropdownMenuItem onClick={() => onViewAuditHistory(product)}>
                <History className="w-4 h-4 mr-2" />
                View History
              </DropdownMenuItem>
            )}
            {hasCreatePermission && onDuplicate && (
              <DropdownMenuItem onClick={() => onDuplicate(product)}>
                <Copy className="w-4 h-4 mr-2" />
                Duplicate
              </DropdownMenuItem>
            )}
            {hasEditPermission && onPublish && product.source_admin_product_id && (
              <DropdownMenuItem onClick={() => onPublish(product)}>
                <UploadCloud className="w-4 h-4 mr-2" />
                Publish
              </DropdownMenuItem>
            )}
            {hasEditPermission && onResync && integrationStatus && (
              <DropdownMenuItem onClick={() => onResync(product)}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Re-sync
              </DropdownMenuItem>
            )}
            {hasDeletePermission && onArchive && (
              <DropdownMenuItem onClick={() => onArchive(product)} className="text-red-600">
                <Archive className="w-4 h-4 mr-2" />
                Archive
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Card Content */}
      <div className="p-5">
        {/* Category Badge - Top Left */}
        {product.category && (
          <div className="mb-4">
            <Badge
              className={cn(
                'text-[10px] font-bold uppercase tracking-wider border-0',
                'px-2.5 py-1 rounded',
                theme.bg,
                theme.color
              )}
            >
              {formatCategoryName(product.category)}
            </Badge>
          </div>
        )}

        {/* Product Icon + Name + SKU */}
        <div className="flex flex-col items-center text-center mb-4">
          {/* Product Icon */}
          <div className="h-12 w-12 bg-slate-100 rounded-xl flex items-center justify-center mb-3">
            <CategoryIcon className="h-6 w-6 text-slate-600" />
          </div>

          {/* Product Name */}
          <h3 className="font-semibold text-gray-900 text-base leading-tight mb-1 line-clamp-2">
            {product.name}
          </h3>

          {/* SKU */}
          <span className="text-xs text-gray-400 font-mono">
            {product.sku}
          </span>
        </div>

        {/* Price Display */}
        <div className="text-center mb-5">
          <div className="flex items-baseline justify-center gap-1">
            <span className="text-sm text-gray-500">R</span>
            <span className="text-3xl font-bold text-gray-900">
              {Math.round(parseFloat(String(product.base_price_zar)))}
            </span>
            <span className="text-sm text-gray-400">/ month</span>
          </div>
        </div>

        {/* Speed Specs Grid */}
        {(product.pricing?.download_speed || product.pricing?.upload_speed) && (
          <div className="bg-slate-50 rounded-xl p-4 mb-4">
            <div className="grid grid-cols-2 gap-4">
              {/* Download Speed */}
              {product.pricing?.download_speed && (
                <div className="flex items-center gap-2">
                  <ArrowDown className="h-4 w-4 text-emerald-500" />
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase font-semibold tracking-wide">
                      DOWN
                    </div>
                    <div className="text-sm font-semibold text-slate-700">
                      {product.pricing.download_speed}Mbps
                    </div>
                  </div>
                </div>
              )}

              {/* Upload Speed */}
              {product.pricing?.upload_speed && (
                <div className="flex items-center gap-2">
                  <ArrowUp className="h-4 w-4 text-blue-500" />
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase font-semibold tracking-wide">
                      UP
                    </div>
                    <div className="text-sm font-semibold text-slate-700">
                      {product.pricing.upload_speed}Mbps
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer: Sync Status + Hidden Toggle */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          {/* Sync Status */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className={cn('flex items-center gap-1.5 cursor-help', syncStatus.color)}>
                  <SyncIcon className={cn('h-4 w-4', syncStatus.spinning && 'animate-spin')} />
                  <span className="text-xs font-medium">{syncStatus.text}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                {integrationStatus?.syncStatus === 'ok' && integrationStatus.lastSyncedAt && (
                  <span>Last synced: {new Date(integrationStatus.lastSyncedAt).toLocaleString()}</span>
                )}
                {integrationStatus?.syncStatus === 'failed' && integrationStatus.lastSyncError && (
                  <span className="text-red-600">{integrationStatus.lastSyncError}</span>
                )}
                {!integrationStatus?.syncStatus && <span>Product not synced to Zoho CRM</span>}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Visibility Toggle */}
          {onToggleStatus && (
            <div className="flex items-center gap-2">
              <span className={cn(
                "text-[10px] uppercase font-bold tracking-wide transition-colors",
                product.is_active ? "text-emerald-600" : "text-red-500"
              )}>
                {product.is_active ? "VISIBLE" : "HIDDEN"}
              </span>
              <Switch
                checked={product.is_active}
                disabled={!hasEditPermission}
                onCheckedChange={() => {
                  if (hasEditPermission) {
                    onToggleStatus(product);
                  }
                }}
                className={cn(
                  'h-6 w-12 shadow-inner transition-colors',
                  'data-[state=checked]:bg-emerald-500 data-[state=unchecked]:bg-red-400',
                  !hasEditPermission && 'opacity-50 cursor-not-allowed'
                )}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
