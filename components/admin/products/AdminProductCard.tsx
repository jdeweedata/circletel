'use client';
import { PiArchiveBold, PiArrowDownBold, PiArrowUpBold, PiArrowsClockwiseBold, PiCheckCircleBold, PiClockCounterClockwiseBold, PiCloudArrowUpBold, PiCloudSlashBold, PiCopyBold, PiCurrencyDollarBold, PiDotsSixVerticalBold, PiDotsThreeBold, PiEyeBold, PiPackageBold, PiPencilSimpleBold, PiWarningCircleBold } from 'react-icons/pi';

import React from 'react';
import { cn } from '@/lib/utils';
import { Product } from '@/lib/types/products';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
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
  hideCategoryBadge?: boolean;
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
  hideCategoryBadge = false,
}: AdminProductCardProps) {
  // Get sync status indicator
  const getSyncStatus = () => {
    if (!integrationStatus || !integrationStatus.syncStatus) {
      return { icon: PiCloudSlashBold, text: 'Not Synced', color: 'text-gray-400' };
    }
    switch (integrationStatus.syncStatus) {
      case 'ok':
        return { icon: PiCheckCircleBold, text: 'Synced', color: 'text-emerald-500' };
      case 'failed':
        return { icon: PiWarningCircleBold, text: 'Failed', color: 'text-red-500' };
      case 'pending':
        return { icon: PiArrowsClockwiseBold, text: 'Syncing', color: 'text-blue-500', spinning: true };
      default:
        return { icon: PiCloudSlashBold, text: 'Not Synced', color: 'text-gray-400' };
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
            <PiDotsSixVerticalBold className="h-3.5 w-3.5 text-gray-400" />
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
              <PiDotsThreeBold className="h-4 w-4 text-gray-600" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            {onView && (
              <DropdownMenuItem onClick={() => onView(product)}>
                <PiEyeBold className="w-4 h-4 mr-2" />
                View Details
              </DropdownMenuItem>
            )}
            {onEdit && hasEditPermission && (
              <DropdownMenuItem onClick={() => onEdit(product)}>
                <PiPencilSimpleBold className="w-4 h-4 mr-2" />
                Edit
              </DropdownMenuItem>
            )}
            {onPriceEdit && hasPricingPermission && (
              <DropdownMenuItem onClick={() => onPriceEdit(product)}>
                <PiCurrencyDollarBold className="w-4 h-4 mr-2" />
                Edit Price
              </DropdownMenuItem>
            )}
            {onViewAuditHistory && (
              <DropdownMenuItem onClick={() => onViewAuditHistory(product)}>
                <PiClockCounterClockwiseBold className="w-4 h-4 mr-2" />
                View History
              </DropdownMenuItem>
            )}
            {hasCreatePermission && onDuplicate && (
              <DropdownMenuItem onClick={() => onDuplicate(product)}>
                <PiCopyBold className="w-4 h-4 mr-2" />
                Duplicate
              </DropdownMenuItem>
            )}
            {hasEditPermission && onPublish && product.source_admin_product_id && (
              <DropdownMenuItem onClick={() => onPublish(product)}>
                <PiCloudArrowUpBold className="w-4 h-4 mr-2" />
                Publish
              </DropdownMenuItem>
            )}
            {hasEditPermission && onResync && integrationStatus && (
              <DropdownMenuItem onClick={() => onResync(product)}>
                <PiArrowsClockwiseBold className="w-4 h-4 mr-2" />
                Re-sync
              </DropdownMenuItem>
            )}
            {hasDeletePermission && onArchive && (
              <DropdownMenuItem onClick={() => onArchive(product)} className="text-red-600">
                <PiArchiveBold className="w-4 h-4 mr-2" />
                Archive
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Card Content */}
      <div className="p-4">
        {/* Category Badge - Top Left */}
        {product.category && !hideCategoryBadge && (
          <div className="mb-3">
            <Badge
              className={cn(
                'text-[10px] font-bold uppercase tracking-wider border-0',
                'px-2 py-0.5 rounded',
                theme.bg,
                theme.color
              )}
            >
              {formatCategoryName(product.category)}
            </Badge>
          </div>
        )}

        {/* Product Icon + Name + SKU + Price (Horizontal) */}
        <div className="flex items-start gap-4 mb-3">
          {/* Product Icon */}
          <div className="h-10 w-10 shrink-0 bg-slate-50 border border-slate-100 rounded-lg flex items-center justify-center">
            <CategoryIcon className="h-5 w-5 text-slate-500" />
          </div>

          <div className="flex-1 min-w-0">
            {/* Product Name & SKU */}
            <div className="flex flex-col mb-1">
              <h3 className="font-semibold text-gray-900 text-sm leading-tight line-clamp-2">
                {product.name}
              </h3>
              <span className="text-[11px] text-gray-500 font-mono truncate mt-0.5">
                {product.sku}
              </span>
            </div>
            
            {/* Price Display */}
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-xs text-gray-500">R</span>
              <span className="text-lg font-bold text-gray-900">
                {Math.round(parseFloat(String(product.base_price_zar)))}
              </span>
              <span className="text-[10px] text-gray-400">/ mo</span>
            </div>
          </div>
        </div>

        {/* Speed Specs Inline */}
        {(product.pricing?.download_speed || product.pricing?.upload_speed) && (
          <div className="flex items-center gap-4 bg-slate-50/80 rounded-lg px-3 py-2 mb-3 border border-slate-100">
            {/* Download Speed */}
            {product.pricing?.download_speed && (
              <div className="flex items-center gap-1.5 text-slate-700">
                <PiArrowDownBold className="h-3 w-3 text-emerald-500" />
                <div className="flex items-baseline gap-1">
                  <span className="text-[13px] font-semibold">{product.pricing.download_speed}</span>
                  <span className="text-[10px] text-slate-400 font-medium">Mbps</span>
                </div>
              </div>
            )}

            {/* Upload Speed */}
            {product.pricing?.upload_speed && (
              <div className="flex items-center gap-1.5 text-slate-700">
                <PiArrowUpBold className="h-3 w-3 text-blue-500" />
                <div className="flex items-baseline gap-1">
                  <span className="text-[13px] font-semibold">{product.pricing.upload_speed}</span>
                  <span className="text-[10px] text-slate-400 font-medium">Mbps</span>
                </div>
              </div>
            )}
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
