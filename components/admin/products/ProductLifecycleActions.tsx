'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Rocket,
  Pause,
  Archive,
  Edit,
  History,
  Trash2,
  RotateCcw,
  PlayCircle,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { Product } from '@/lib/types/products';
import { usePermissions } from '@/hooks/usePermissions';
import { PERMISSIONS } from '@/lib/rbac/permissions';
import { PermissionGate } from '@/components/rbac/PermissionGate';

interface ProductLifecycleActionsProps {
  product: Product;
  onStatusChange: (newStatus: string, isActive: boolean) => Promise<void>;
  onEdit: () => void;
  onArchive: () => void; // Opens archive dialog
  onViewHistory: () => void;
}

export const ProductLifecycleActions: React.FC<ProductLifecycleActionsProps> = ({
  product,
  onStatusChange,
  onEdit,
  onArchive,
  onViewHistory
}) => {
  const [loading, setLoading] = useState<string | null>(null);

  const handleAction = async (actionId: string, status: string, isActive: boolean) => {
    try {
      setLoading(actionId);
      await onStatusChange(status, isActive);
    } finally {
      setLoading(null);
    }
  };

  // Draft Actions
  if (product.status === 'draft') {
    return (
      <div className="flex items-center gap-2">
         <Button
          variant="outline"
          size="sm"
          onClick={onViewHistory}
        >
          <History className="mr-2 h-4 w-4" />
          History
        </Button>
        <PermissionGate permissions={[PERMISSIONS.PRODUCTS.EDIT]}>
          <Button
            variant="outline"
            size="sm"
            onClick={onEdit}
          >
            <Edit className="mr-2 h-4 w-4" />
            Edit Draft
          </Button>
        </PermissionGate>
        <PermissionGate permissions={[PERMISSIONS.PRODUCTS.EDIT]}>
          <Button
            className="bg-green-600 hover:bg-green-700 text-white"
            size="sm"
            onClick={() => handleAction('publish', 'active', true)}
            disabled={!!loading}
          >
            {loading === 'publish' ? (
              <span className="animate-spin mr-2">⏳</span>
            ) : (
              <Rocket className="mr-2 h-4 w-4" />
            )}
            Publish to Catalogue
          </Button>
        </PermissionGate>
      </div>
    );
  }

  // Active Actions
  if (product.status === 'active' && product.is_active) {
    return (
      <div className="flex items-center gap-2">
         <Button
          variant="outline"
          size="sm"
          onClick={onViewHistory}
        >
          <History className="mr-2 h-4 w-4" />
          History
        </Button>
        <PermissionGate permissions={[PERMISSIONS.PRODUCTS.EDIT]}>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleAction('deactivate', 'active', false)}
            disabled={!!loading}
          >
            {loading === 'deactivate' ? (
              <span className="animate-spin mr-2">⏳</span>
            ) : (
              <Pause className="mr-2 h-4 w-4" />
            )}
            Deactivate
          </Button>
        </PermissionGate>
        <PermissionGate permissions={[PERMISSIONS.PRODUCTS.EDIT]}>
          <Button
            className="bg-circleTel-orange hover:bg-circleTel-orange/90"
            size="sm"
            onClick={onEdit}
          >
            <Edit className="mr-2 h-4 w-4" />
            Edit Product
          </Button>
        </PermissionGate>
      </div>
    );
  }

  // Inactive Actions
  if (product.status === 'active' && !product.is_active) {
    return (
      <div className="flex items-center gap-2">
         <Button
          variant="outline"
          size="sm"
          onClick={onViewHistory}
        >
          <History className="mr-2 h-4 w-4" />
          History
        </Button>
        <PermissionGate permissions={[PERMISSIONS.PRODUCTS.EDIT]}>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleAction('reactivate', 'active', true)}
            disabled={!!loading}
            className="border-green-600 text-green-600 hover:bg-green-50"
          >
            {loading === 'reactivate' ? (
              <span className="animate-spin mr-2">⏳</span>
            ) : (
              <PlayCircle className="mr-2 h-4 w-4" />
            )}
            Reactivate
          </Button>
        </PermissionGate>
        <PermissionGate permissions={[PERMISSIONS.PRODUCTS.DELETE]}>
          <Button
            variant="destructive"
            size="sm"
            onClick={onArchive}
          >
            <Archive className="mr-2 h-4 w-4" />
            Archive
          </Button>
        </PermissionGate>
         <PermissionGate permissions={[PERMISSIONS.PRODUCTS.EDIT]}>
          <Button
            className="bg-circleTel-orange hover:bg-circleTel-orange/90"
            size="sm"
            onClick={onEdit}
          >
            <Edit className="mr-2 h-4 w-4" />
            Edit Product
          </Button>
        </PermissionGate>
      </div>
    );
  }

  // Archived Actions
  if (product.status === 'archived') {
    return (
      <div className="flex items-center gap-2">
         <Button
          variant="outline"
          size="sm"
          onClick={onViewHistory}
        >
          <History className="mr-2 h-4 w-4" />
          History
        </Button>
        <PermissionGate permissions={[PERMISSIONS.PRODUCTS.EDIT]}>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleAction('restore', 'draft', false)}
            disabled={!!loading}
          >
            {loading === 'restore' ? (
              <span className="animate-spin mr-2">⏳</span>
            ) : (
              <RotateCcw className="mr-2 h-4 w-4" />
            )}
            Restore to Draft
          </Button>
        </PermissionGate>
        <div className="text-sm text-gray-500 italic ml-2">
          Product is archived
        </div>
      </div>
    );
  }

  // Fallback
  return (
    <div className="flex items-center gap-2">
       <Button
          variant="outline"
          size="sm"
          onClick={onViewHistory}
        >
          <History className="mr-2 h-4 w-4" />
          History
        </Button>
      <PermissionGate permissions={[PERMISSIONS.PRODUCTS.EDIT]}>
        <Button
          className="bg-circleTel-orange hover:bg-circleTel-orange/90"
          size="sm"
          onClick={onEdit}
        >
          <Edit className="mr-2 h-4 w-4" />
          Edit
        </Button>
      </PermissionGate>
    </div>
  );
};
