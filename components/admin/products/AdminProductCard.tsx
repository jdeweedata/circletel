'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Product } from '@/lib/types/products';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { ProviderLogo } from '@/components/products/ProviderLogo';
import {
  Package,
  Edit,
  Eye,
  ToggleLeft,
  ToggleRight,
  Copy,
  Archive,
  DollarSign,
  History,
  Star,
  TrendingUp,
  GripVertical,
  ShoppingCart,
  Users,
  BarChart3,
  UploadCloud,
  Cloud,
  CloudOff,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
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
 * Modern card-based product display for admin panel with:
 * - Provider logo integration
 * - Status badges (Active, Featured, Popular)
 * - shadcn/ui Switch toggle with label/description
 * - Quick action buttons (View, Edit, Price)
 * - Bulk selection checkbox
 * - Drag handle for reordering
 * - Visual stats (orders, views, revenue)
 * - CircleTel brand styling
 *
 * @example
 * ```tsx
 * <AdminProductCard
 *   product={product}
 *   selected={isSelected}
 *   onSelect={handleSelect}
 *   onEdit={handleEdit}
 *   onToggleStatus={handleToggle}
 *   hasEditPermission={true}
 *   showStats={true}
 *   stats={{ orders: 12, views: 345, revenue: 8988 }}
 * />
 * ```
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
  showStats = false,
  stats,
  integrationStatus,
}: AdminProductCardProps) {
  const formatPrice = (priceStr: string | number) => {
    const price = typeof priceStr === 'string' ? parseFloat(priceStr) : priceStr;
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(price);
  };

  const getStatusBadge = () => {
    if (!product.is_active) {
      return <Badge className="bg-gray-200 text-gray-700 border-gray-300 text-xs">Inactive</Badge>;
    }

    switch (product.status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-700 border-green-300 text-xs">Active</Badge>;
      case 'draft':
        return <Badge className="bg-blue-50 text-blue-700 border-blue-300 text-xs">Draft</Badge>;
      case 'archived':
        return <Badge className="bg-gray-100 text-gray-600 border-gray-300 text-xs">Archived</Badge>;
      default:
        return <Badge variant="outline" className="capitalize text-xs">{product.status}</Badge>;
    }
  };

  const getSyncStatusBadge = () => {
    if (!integrationStatus) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge className="bg-gray-100 text-gray-600 border-gray-300 text-xs">
                <CloudOff className="w-3 h-3 mr-1" />
                Not Synced
              </Badge>
            </TooltipTrigger>
            <TooltipContent>Product has not been published to Zoho CRM</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    const { syncStatus, zohoProductId, lastSyncedAt, lastSyncError, retryCount, nextRetryAt } = integrationStatus;

    switch (syncStatus) {
      case 'ok':
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge className="bg-green-50 text-green-700 border-green-200 text-xs cursor-help">
                  <Cloud className="w-3 h-3 mr-1" />
                  Synced
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <div className="text-xs">
                  <div className="font-semibold">Synced to Zoho CRM</div>
                  {zohoProductId && <div className="text-gray-400">ID: {zohoProductId}</div>}
                  {lastSyncedAt && (
                    <div className="text-gray-400">
                      Last synced: {new Date(lastSyncedAt).toLocaleString()}
                    </div>
                  )}
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      case 'failed':
        const maxRetries = 5;
        const isRetryScheduled = nextRetryAt && new Date(nextRetryAt) > new Date();
        const hasExhaustedRetries = (retryCount ?? 0) >= maxRetries;

        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge className="bg-red-50 text-red-700 border-red-200 text-xs cursor-help">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  Sync Failed
                  {(retryCount ?? 0) > 0 && ` (${retryCount}/${maxRetries})`}
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <div className="text-xs max-w-xs">
                  <div className="font-semibold text-red-700">Sync to Zoho CRM Failed</div>
                  {lastSyncError && (
                    <div className="text-gray-600 mt-1">{lastSyncError}</div>
                  )}
                  {isRetryScheduled && (
                    <div className="text-blue-600 mt-1">
                      ⏰ Auto-retry scheduled: {new Date(nextRetryAt!).toLocaleString()}
                    </div>
                  )}
                  {hasExhaustedRetries && (
                    <div className="text-orange-600 mt-1">
                      ⚠️ Max retries reached. Manual re-sync required.
                    </div>
                  )}
                  {onResync && !hasExhaustedRetries && (
                    <div className="text-blue-600 mt-1">Click "Re-sync" to retry now</div>
                  )}
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      case 'pending':
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
                  <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                  Syncing...
                </Badge>
              </TooltipTrigger>
              <TooltipContent>Sync to Zoho CRM in progress</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      default:
        return null;
    }
  };

  // Extract provider info from product metadata and ensure string types
  const providerCode = String(
    (product.metadata?.provider_code as string | undefined) ??
      (product.metadata?.provider as string | undefined) ??
      ''
  );
  const providerName = String(
    (product.metadata?.provider_name as string | undefined) ?? providerCode
  );

  return (
    <div
      className={cn(
        'group relative w-full h-full',
        'bg-white rounded-2xl border transition-all duration-200 ease-in-out',
        'shadow-sm hover:shadow-md hover:-translate-y-0.5',
        selected && 'border-circleTel-orange shadow-md ring-2 ring-circleTel-orange ring-offset-2',
        !selected && 'border-gray-200 hover:border-gray-300',
        isDragging && 'opacity-50 rotate-1 scale-105'
      )}
    >
      {/* Selection Checkbox & Drag Handle - Top Left */}
      <div className="absolute top-3 left-3 flex items-center gap-2 z-10" onClick={(e) => e.stopPropagation()}>
        {onSelect && (
          <Checkbox
            checked={selected}
            onCheckedChange={(checked) => onSelect(product.id, checked as boolean)}
            className="bg-white border-2 shadow-sm"
          />
        )}
        {dragHandleProps && (
          <div
            {...dragHandleProps}
            className="cursor-grab active:cursor-grabbing p-1 bg-white rounded-lg border border-gray-200 hover:border-gray-300 shadow-sm transition-all"
          >
            <GripVertical className="h-4 w-4 text-gray-400" />
          </div>
        )}
      </div>

      {/* Quick Actions - Top Right - Always visible for better UX */}
      <div className="absolute top-3 right-3 flex gap-1.5 z-10">
        {onView && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="secondary"
                  size="sm"
                  className="h-8 w-8 p-0 bg-white border border-gray-200 shadow-sm hover:bg-gray-50 hover:border-gray-300 rounded-lg transition-all"
                  onClick={(e) => {
                    console.log('[AdminProductCard] View clicked for:', product.id);
                    e.stopPropagation();
                    onView(product);
                  }}
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>View Details</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        {onEdit && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="secondary"
                  size="sm"
                  className="h-8 w-8 p-0 bg-white border border-gray-200 shadow-sm hover:bg-gray-50 hover:border-gray-300 rounded-lg transition-all"
                  onClick={(e) => {
                    console.log('[AdminProductCard] Edit clicked for:', product.id, 'hasEditPermission:', hasEditPermission);
                    e.stopPropagation();
                    onEdit(product);
                  }}
                  disabled={!hasEditPermission}
                  title={!hasEditPermission ? 'You do not have edit permission' : ''}
                >
                  <Edit className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{hasEditPermission ? 'Edit Product' : 'No Edit Permission'}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        {onPriceEdit && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="secondary"
                  size="sm"
                  className="h-8 w-8 p-0 bg-white border border-gray-200 shadow-sm hover:bg-gray-50 hover:border-gray-300 rounded-lg transition-all"
                  onClick={(e) => {
                    console.log('[AdminProductCard] Price edit clicked for:', product.id, 'hasPricingPermission:', hasPricingPermission);
                    e.stopPropagation();
                    onPriceEdit(product);
                  }}
                  disabled={!hasPricingPermission}
                  title={!hasPricingPermission ? 'You do not have pricing permission' : ''}
                >
                  <DollarSign className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{hasPricingPermission ? 'Edit Price' : 'No Pricing Permission'}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>

      {/* Card Content */}
      <div className="p-6 pt-12">
        {/* Provider Logo */}
        {providerCode && (
          <div className="flex justify-center mb-4">
            <div className="rounded-xl bg-gray-50 border border-gray-100 px-4 py-3 shadow-sm">
              <ProviderLogo
                providerCode={providerCode}
                providerName={providerName}
                logoUrl=""
                variant="grayscale"
                size="small"
                priority={false}
              />
            </div>
          </div>
        )}

        {/* Product Icon (if no provider) */}
        {!providerCode && (
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 bg-circleTel-orange/10 border border-circleTel-orange/20 rounded-xl flex items-center justify-center shadow-sm">
              <Package className="h-8 w-8 text-circleTel-orange" />
            </div>
          </div>
        )}

        {/* Product Name & Badges */}
        <div className="text-center mb-3">
          <h3 className="font-bold text-gray-900 text-lg mb-2 line-clamp-2 min-h-[3.5rem]">
            {product.name}
          </h3>
          <div className="flex items-center justify-center gap-2 flex-wrap">
            {getStatusBadge()}
            {getSyncStatusBadge()}
            {product.is_featured && (
              <Badge className="bg-purple-100 text-purple-700 border-purple-300 text-xs">
                <Star className="w-3 h-3 mr-1 fill-current" />
                Featured
              </Badge>
            )}
            {product.is_popular && (
              <Badge className="bg-orange-100 text-orange-700 border-orange-300 text-xs">
                <TrendingUp className="w-3 h-3 mr-1" />
                Popular
              </Badge>
            )}
          </div>
        </div>

        {/* Pricing - Prominent Display */}
        <div className="text-center mb-4">
          <div className="flex items-baseline justify-center gap-2">
            <span className="text-3xl font-bold text-circleTel-orange">
              {formatPrice(product.base_price_zar)}
            </span>
            <span className="text-sm text-gray-500">/month</span>
          </div>
        </div>

        {/* Product Description */}
        <p className="text-sm text-gray-600 text-center mb-4 line-clamp-2 min-h-[2.5rem]">
          {product.description || 'No description available'}
        </p>

        {/* Product Details */}
        <div className="grid grid-cols-2 gap-2 mb-4 text-xs text-gray-500">
          <div className="text-left">
            <span className="font-semibold">SKU:</span> {product.sku}
          </div>
          <div className="text-right">
            <span className="font-semibold capitalize">{product.category}</span>
          </div>
          {product.service_type && (
            <div className="col-span-2 text-center">
              <Badge variant="outline" className="text-xs">{product.service_type}</Badge>
            </div>
          )}
        </div>

        {/* Speed/Technical Details */}
        {product.pricing?.download_speed && product.pricing?.upload_speed && (
          <div className="flex justify-center gap-4 mb-4 text-sm">
            <div className="flex items-center gap-1">
              <span className="text-gray-500">↓</span>
              <span className="font-semibold">{product.pricing.download_speed}Mbps</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-gray-500">↑</span>
              <span className="font-semibold">{product.pricing.upload_speed}Mbps</span>
            </div>
          </div>
        )}

        {/* Additional Pricing Details */}
        <div className="border-t border-gray-200 pt-3 mb-4">
          <div className="text-center space-y-1">
            <div className="text-xs text-gray-500">
              Cost Price: {formatPrice(product.cost_price_zar)}
            </div>
            {product.metadata?.contract_months && (
              <div className="text-xs text-gray-500">
                Contract: {product.metadata.contract_months} months
              </div>
            )}
          </div>
        </div>

        {/* Visual Stats */}
        {showStats && stats && (
          <div className="grid grid-cols-3 gap-2 mb-4 border-t border-gray-200 pt-4">
            {stats.orders !== undefined && (
              <div className="text-center">
                <div className="flex justify-center mb-1">
                  <ShoppingCart className="h-4 w-4 text-blue-500" />
                </div>
                <div className="text-lg font-bold text-gray-900">{stats.orders}</div>
                <div className="text-xs text-gray-500">Orders</div>
              </div>
            )}
            {stats.views !== undefined && (
              <div className="text-center">
                <div className="flex justify-center mb-1">
                  <Users className="h-4 w-4 text-green-500" />
                </div>
                <div className="text-lg font-bold text-gray-900">{stats.views}</div>
                <div className="text-xs text-gray-500">Views</div>
              </div>
            )}
            {stats.revenue !== undefined && (
              <div className="text-center">
                <div className="flex justify-center mb-1">
                  <BarChart3 className="h-4 w-4 text-orange-500" />
                </div>
                <div className="text-lg font-bold text-gray-900">
                  {formatPrice(stats.revenue).replace(/\.\d+/, '')}
                </div>
                <div className="text-xs text-gray-500">Revenue</div>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          {onToggleStatus && (
            <div className="flex items-center justify-between flex-1 px-4 py-3.5 border border-gray-200 rounded-xl bg-white hover:bg-gray-50/50 transition-all duration-200 shadow-sm">
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-semibold text-gray-900">
                  {product.is_active ? 'Active' : 'Inactive'}
                </span>
                <span className="text-xs text-gray-500 leading-tight">
                  {product.is_active ? 'Visible to customers' : 'Hidden from customers'}
                </span>
              </div>
              <Switch
                checked={product.is_active}
                disabled={!hasEditPermission}
                onCheckedChange={(checked) => {
                  console.log('[AdminProductCard] Toggle switch clicked for:', product.id, 'new state:', checked, 'hasEditPermission:', hasEditPermission);
                  if (hasEditPermission) {
                    onToggleStatus(product);
                  } else {
                    console.warn('[AdminProductCard] Toggle blocked: No edit permission');
                    alert('You do not have permission to edit products');
                  }
                }}
                className={cn(
                  "data-[state=checked]:bg-orange-500 data-[state=unchecked]:bg-gray-200",
                  "[&>span]:ring-2 [&>span]:ring-offset-0",
                  "[&>span]:data-[state=unchecked]:ring-gray-400",
                  "[&>span]:data-[state=checked]:ring-white",
                  !hasEditPermission && "opacity-50 cursor-not-allowed"
                )}
              />
            </div>
          )}

          {/* More Actions Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className={cn("rounded-xl shadow-sm", onToggleStatus ? "w-auto" : "flex-1")}>
                More Actions
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {hasCreatePermission && onDuplicate && (
                <DropdownMenuItem onClick={(e) => {
                  e.stopPropagation();
                  onDuplicate(product);
                }}>
                  <Copy className="w-4 h-4 mr-2" />
                  Duplicate
                </DropdownMenuItem>
              )}
              {onViewAuditHistory && (
                <DropdownMenuItem onClick={(e) => {
                  e.stopPropagation();
                  onViewAuditHistory(product);
                }}>
                  <History className="w-4 h-4 mr-2" />
                  View History
                </DropdownMenuItem>
              )}
              {hasEditPermission && onPublish && product.source_admin_product_id && (
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onPublish(product);
                  }}
                >
                  <UploadCloud className="w-4 h-4 mr-2" />
                  Publish to catalogue
                </DropdownMenuItem>
              )}
              {hasEditPermission && onResync && integrationStatus && (
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onResync(product);
                  }}
                  className={integrationStatus.syncStatus === 'failed' ? 'text-orange-600' : ''}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Re-sync to Zoho
                </DropdownMenuItem>
              )}
              {hasDeletePermission && onArchive && (
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onArchive(product);
                  }}
                  className="text-red-600"
                >
                  <Archive className="w-4 h-4 mr-2" />
                  Archive
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Updated Date Footer */}
      <div className="px-6 pb-4 text-xs text-gray-400 text-center">
        Updated: {new Date(product.updated_at).toLocaleDateString()}
      </div>
    </div>
  );
}
