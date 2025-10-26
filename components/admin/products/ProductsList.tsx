'use client';

import React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Product } from '@/lib/types/products';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ProviderLogo } from '@/components/products/ProviderLogo';
import {
  Package,
  Edit,
  Eye,
  MoreHorizontal,
  ToggleLeft,
  ToggleRight,
  Copy,
  Archive,
  DollarSign,
  History,
  Star,
  TrendingUp,
  GripVertical,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export interface ProductsListProps {
  products: Product[];
  selectedIds?: string[];
  onSelect?: (productId: string, selected: boolean) => void;
  onEdit?: (product: Product) => void;
  onToggleStatus?: (product: Product) => void;
  onDuplicate?: (product: Product) => void;
  onArchive?: (product: Product) => void;
  onPriceEdit?: (product: Product) => void;
  onViewAuditHistory?: (product: Product) => void;
  hasEditPermission?: boolean;
  hasDeletePermission?: boolean;
  hasPricingPermission?: boolean;
  hasCreatePermission?: boolean;
  dragHandleProps?: any;
}

/**
 * ProductsList Component
 *
 * Enhanced list view for products in admin panel with:
 * - Provider logos
 * - Status badges
 * - Inline quick actions
 * - Bulk selection
 * - Better visual hierarchy
 * - Responsive design
 *
 * @example
 * ```tsx
 * <ProductsList
 *   products={products}
 *   selectedIds={selectedIds}
 *   onSelect={handleSelect}
 *   onEdit={handleEdit}
 *   hasEditPermission={true}
 * />
 * ```
 */
export function ProductsList({
  products,
  selectedIds = [],
  onSelect,
  onEdit,
  onToggleStatus,
  onDuplicate,
  onArchive,
  onPriceEdit,
  onViewAuditHistory,
  hasEditPermission = false,
  hasDeletePermission = false,
  hasPricingPermission = false,
  hasCreatePermission = false,
  dragHandleProps,
}: ProductsListProps) {
  const formatPrice = (priceStr: string | number) => {
    const price = typeof priceStr === 'string' ? parseFloat(priceStr) : priceStr;
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(price);
  };

  const getStatusBadge = (product: Product) => {
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

  return (
    <div className="space-y-3">
      {products.map((product) => {
        const isSelected = selectedIds.includes(product.id);
        const providerCode = product.metadata?.provider_code || product.metadata?.provider || '';
        const providerName = product.metadata?.provider_name || providerCode;

        return (
          <div
            key={product.id}
            className={cn(
              'flex items-center gap-4 p-4 border-2 rounded-lg transition-all duration-200',
              'hover:shadow-md hover:border-circleTel-orange/50',
              isSelected && 'border-circleTel-orange shadow-md bg-orange-50/30',
              !isSelected && 'border-gray-200 bg-white'
            )}
          >
            {/* Selection & Drag Handle */}
            <div className="flex items-center gap-2">
              {onSelect && (
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={(checked) => onSelect(product.id, checked as boolean)}
                  className="border-2"
                />
              )}
              {dragHandleProps && (
                <div
                  {...dragHandleProps}
                  className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-100 rounded"
                >
                  <GripVertical className="h-4 w-4 text-gray-400" />
                </div>
              )}
            </div>

            {/* Provider Logo / Product Icon */}
            <div className="flex-shrink-0">
              {providerCode ? (
                <div className="h-12 w-12 bg-gray-50 rounded-lg flex items-center justify-center p-1">
                  <ProviderLogo
                    providerCode={providerCode}
                    providerName={providerName}
                    variant="grayscale"
                    size="small"
                    priority={false}
                  />
                </div>
              ) : (
                <div className="h-12 w-12 bg-circleTel-lightNeutral rounded-lg flex items-center justify-center">
                  <Package className="h-6 w-6 text-circleTel-orange" />
                </div>
              )}
            </div>

            {/* Product Details */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h3 className="font-semibold text-gray-900 text-base truncate">
                  {product.name}
                </h3>
                {getStatusBadge(product)}
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

              <p className="text-sm text-gray-600 mb-2 line-clamp-1">
                {product.description || 'No description available'}
              </p>

              <div className="flex items-center gap-4 text-xs text-gray-500 flex-wrap">
                <span className="font-medium">SKU: {product.sku}</span>
                <span>•</span>
                <span className="capitalize">{product.category}</span>
                {product.service_type && (
                  <>
                    <span>•</span>
                    <Badge variant="outline" className="text-xs">{product.service_type}</Badge>
                  </>
                )}
                {product.pricing?.download_speed && product.pricing?.upload_speed && (
                  <>
                    <span>•</span>
                    <span>
                      Speed: {product.pricing.download_speed}/{product.pricing.upload_speed} Mbps
                    </span>
                  </>
                )}
                {product.metadata?.contract_months && (
                  <>
                    <span>•</span>
                    <span>Contract: {product.metadata.contract_months}mo</span>
                  </>
                )}
                <span>•</span>
                <span>Updated: {new Date(product.updated_at).toLocaleDateString()}</span>
              </div>
            </div>

            {/* Pricing */}
            <div className="text-right flex-shrink-0">
              <p className="font-bold text-circleTel-orange text-lg">
                {formatPrice(product.base_price_zar)}
              </p>
              <p className="text-xs text-gray-500">
                Cost: {formatPrice(product.cost_price_zar)}
              </p>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-1 flex-shrink-0">
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="h-8 w-8 p-0"
              >
                <Link href={`/admin/products/${product.id}`}>
                  <Eye className="h-4 w-4" />
                </Link>
              </Button>

              {hasEditPermission && (
                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                  className="h-8 w-8 p-0"
                >
                  <Link href={`/admin/products/${product.id}/edit`}>
                    <Edit className="h-4 w-4" />
                  </Link>
                </Button>
              )}

              {/* More Actions Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {hasPricingPermission && onPriceEdit && (
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
                  {hasEditPermission && onToggleStatus && (
                    <DropdownMenuItem onClick={() => onToggleStatus(product)}>
                      {product.is_active ? (
                        <>
                          <ToggleLeft className="w-4 h-4 mr-2" />
                          Deactivate
                        </>
                      ) : (
                        <>
                          <ToggleRight className="w-4 h-4 mr-2" />
                          Activate
                        </>
                      )}
                    </DropdownMenuItem>
                  )}
                  {hasCreatePermission && onDuplicate && (
                    <DropdownMenuItem onClick={() => onDuplicate(product)}>
                      <Copy className="w-4 h-4 mr-2" />
                      Duplicate
                    </DropdownMenuItem>
                  )}
                  {hasDeletePermission && onArchive && (
                    <DropdownMenuItem
                      onClick={() => onArchive(product)}
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
        );
      })}
    </div>
  );
}
