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
  BarChart3
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
}

/**
 * AdminProductCard Component
 *
 * Modern card-based product display for admin panel with:
 * - Provider logo integration
 * - Status badges (Active, Featured, Popular)
 * - Quick action buttons on hover
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
  hasEditPermission = false,
  hasDeletePermission = false,
  hasPricingPermission = false,
  hasCreatePermission = false,
  isDragging = false,
  dragHandleProps,
  showStats = false,
  stats,
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
      return <Badge variant="secondary" className="text-xs">Inactive</Badge>;
    }

    switch (product.status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800 text-xs">Active</Badge>;
      case 'draft':
        return <Badge className="bg-gray-100 text-gray-800 text-xs">Draft</Badge>;
      case 'archived':
        return <Badge className="bg-red-100 text-red-800 text-xs">Archived</Badge>;
      default:
        return <Badge variant="outline" className="capitalize text-xs">{product.status}</Badge>;
    }
  };

  // Extract provider info from product metadata
  const providerCode = product.metadata?.provider_code || product.metadata?.provider || '';
  const providerName = product.metadata?.provider_name || providerCode;

  return (
    <div
      className={cn(
        'group relative w-full h-full',
        'bg-white rounded-xl border-2 transition-all duration-300',
        'hover:shadow-lg hover:scale-[1.02]',
        selected && 'border-circleTel-orange shadow-lg ring-2 ring-circleTel-orange ring-offset-2',
        !selected && 'border-gray-200 hover:border-circleTel-orange/50',
        isDragging && 'opacity-50 rotate-2 scale-105'
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
            className="cursor-grab active:cursor-grabbing p-1 bg-white rounded border-2 border-gray-200 hover:border-circleTel-orange transition-colors"
          >
            <GripVertical className="h-4 w-4 text-gray-400" />
          </div>
        )}
      </div>

      {/* Quick Actions - Top Right - Always visible for better UX */}
      <div className="absolute top-3 right-3 flex gap-1 z-10">
        {onView && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="secondary"
                  size="sm"
                  className="h-8 w-8 p-0 bg-white shadow-md hover:bg-gray-100"
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
                  className="h-8 w-8 p-0 bg-white shadow-md hover:bg-gray-100"
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
                  className="h-8 w-8 p-0 bg-white shadow-md hover:bg-gray-100"
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
            <div className="rounded-lg bg-gray-50 px-3 py-2">
              <ProviderLogo
                providerCode={providerCode}
                providerName={providerName}
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
            <div className="h-16 w-16 bg-circleTel-lightNeutral rounded-full flex items-center justify-center">
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
            {product.is_featured && (
              <Badge className="bg-yellow-100 text-yellow-800 text-xs">
                <Star className="w-3 h-3 mr-1 fill-current" />
                Featured
              </Badge>
            )}
            {product.is_popular && (
              <Badge className="bg-green-100 text-green-800 text-xs">
                <TrendingUp className="w-3 h-3 mr-1" />
                Popular
              </Badge>
            )}
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

        {/* Pricing */}
        <div className="border-t border-gray-200 pt-4 mb-4">
          <div className="text-center">
            <div className="text-2xl font-extrabold text-circleTel-orange">
              {formatPrice(product.base_price_zar)}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Cost: {formatPrice(product.cost_price_zar)}
            </div>
            {product.metadata?.contract_months && (
              <div className="text-xs text-gray-500 mt-1">
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
            <div className="flex items-center justify-between flex-1 px-3 py-2 border border-gray-200 rounded-lg bg-gray-50">
              <span className="text-sm font-medium text-gray-700">
                {product.is_active ? 'Active' : 'Inactive'}
              </span>
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
                className="data-[state=checked]:bg-circleTel-orange"
                title={!hasEditPermission ? 'You do not have edit permission' : ''}
              />
            </div>
          )}

          {/* More Actions Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className={onToggleStatus ? "w-auto" : "flex-1"}>
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
