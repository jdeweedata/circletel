'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  X,
  CheckCircle2,
  XCircle,
  Archive,
  Tag,
  ToggleLeft,
  ToggleRight,
  Star,
  TrendingUp,
  Edit,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export interface BulkActionsToolbarProps {
  selectedCount: number;
  onClearSelection: () => void;
  onBulkActivate?: () => void;
  onBulkDeactivate?: () => void;
  onBulkArchive?: () => void;
  onBulkSetCategory?: (category: string) => void;
  onBulkSetFeatured?: (featured: boolean) => void;
  onBulkSetPopular?: (popular: boolean) => void;
  onQuickEdit?: () => void;
  hasEditPermission?: boolean;
  hasDeletePermission?: boolean;
  className?: string;
}

/**
 * BulkActionsToolbar Component
 *
 * Floating toolbar that appears when products are selected for bulk operations.
 * Features:
 * - Fixed positioning at bottom of screen
 * - Smooth slide-up animation
 * - Bulk status changes (activate/deactivate)
 * - Bulk category assignment
 * - Bulk feature flags (featured/popular)
 * - Archive multiple products
 * - Clear selection
 *
 * @example
 * ```tsx
 * <BulkActionsToolbar
 *   selectedCount={5}
 *   onClearSelection={() => setSelected([])}
 *   onBulkActivate={handleBulkActivate}
 *   onBulkArchive={handleBulkArchive}
 *   hasEditPermission={true}
 * />
 * ```
 */
export function BulkActionsToolbar({
  selectedCount,
  onClearSelection,
  onBulkActivate,
  onBulkDeactivate,
  onBulkArchive,
  onBulkSetCategory,
  onBulkSetFeatured,
  onBulkSetPopular,
  onQuickEdit,
  hasEditPermission = false,
  hasDeletePermission = false,
  className,
}: BulkActionsToolbarProps) {
  // Don't render if no items selected
  if (selectedCount === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        'fixed bottom-0 left-0 right-0 z-50',
        'bg-white border-t-2 border-gray-200 shadow-2xl',
        'animate-in slide-in-from-bottom duration-300',
        className
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          {/* Left Section - Selection Info */}
          <div className="flex items-center gap-3">
            <Badge className="bg-circleTel-orange text-white px-3 py-1.5 text-sm font-bold">
              {selectedCount} {selectedCount === 1 ? 'product' : 'products'} selected
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearSelection}
              className="text-gray-600 hover:text-gray-900"
            >
              <X className="h-4 w-4 mr-1" />
              Clear Selection
            </Button>
          </div>

          {/* Right Section - Bulk Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Status Actions */}
            {hasEditPermission && (
              <>
                {onBulkActivate && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onBulkActivate}
                    className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                  >
                    <CheckCircle2 className="h-4 w-4 mr-1" />
                    Activate
                  </Button>
                )}
                {onBulkDeactivate && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onBulkDeactivate}
                    className="bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    Deactivate
                  </Button>
                )}
              </>
            )}

            {/* Category Assignment */}
            {hasEditPermission && onBulkSetCategory && (
              <Select onValueChange={onBulkSetCategory}>
                <SelectTrigger className="w-[160px] h-9">
                  <Tag className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Set Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="connectivity">Connectivity</SelectItem>
                  <SelectItem value="hardware">Hardware</SelectItem>
                  <SelectItem value="software">Software</SelectItem>
                  <SelectItem value="services">Services</SelectItem>
                  <SelectItem value="bundles">Bundles</SelectItem>
                </SelectContent>
              </Select>
            )}

            {/* Quick Edit */}
            {hasEditPermission && onQuickEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={onQuickEdit}
                className="bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100"
              >
                <Edit className="h-4 w-4 mr-1" />
                Quick Edit
              </Button>
            )}

            {/* Feature Flags */}
            {hasEditPermission && (
              <>
                {onBulkSetFeatured && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onBulkSetFeatured(true)}
                    className="bg-yellow-50 border-yellow-200 text-yellow-700 hover:bg-yellow-100"
                  >
                    <Star className="h-4 w-4 mr-1" />
                    Set Featured
                  </Button>
                )}
                {onBulkSetPopular && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onBulkSetPopular(true)}
                    className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                  >
                    <TrendingUp className="h-4 w-4 mr-1" />
                    Set Popular
                  </Button>
                )}
              </>
            )}

            {/* Archive */}
            {hasDeletePermission && onBulkArchive && (
              <Button
                variant="outline"
                size="sm"
                onClick={onBulkArchive}
                className="bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
              >
                <Archive className="h-4 w-4 mr-1" />
                Archive
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
