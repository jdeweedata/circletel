'use client';
import {
  PiArchiveBold,
  PiArrowCounterClockwiseBold,
  PiClockCounterClockwiseBold,
  PiPauseBold,
  PiPencilSimpleBold,
  PiPlayCircleBold,
  PiRocketBold,
  PiWarningBold,
} from 'react-icons/pi';

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Product } from '@/lib/types/products';
import { PERMISSIONS } from '@/lib/rbac/permissions';
import { PermissionGate } from '@/components/rbac/PermissionGate';
import { PublishReadinessChecklist } from '@/components/admin/products/shared/PublishReadinessChecklist';
import type { LifecycleGateResult, ProductLine } from '@/lib/types/product-lines';

interface ProductLifecycleActionsProps {
  product: Product;
  onStatusChange: (newStatus: string, isActive: boolean) => Promise<void>;
  onEdit: () => void;
  onArchive: () => void;
  onViewHistory: () => void;
}

export const ProductLifecycleActions: React.FC<ProductLifecycleActionsProps> = ({
  product,
  onStatusChange,
  onEdit,
  onArchive,
  onViewHistory,
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

  if (product.status === 'draft') {
    return (
      <DraftPublishActions
        product={product}
        loading={loading}
        onEdit={onEdit}
        onViewHistory={onViewHistory}
        onPublish={() => handleAction('publish', 'active', true)}
      />
    );
  }

  if (product.status === 'active' && product.is_active) {
    return (
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={onViewHistory}>
          <PiClockCounterClockwiseBold className="mr-2 h-4 w-4" />
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
              <PiPauseBold className="mr-2 h-4 w-4" />
            )}
            Deactivate
          </Button>
        </PermissionGate>
        <PermissionGate permissions={[PERMISSIONS.PRODUCTS.EDIT]}>
          <Button
            className="bg-circleTel-orange hover:bg-circleTel-orange-dark"
            size="sm"
            onClick={onEdit}
          >
            <PiPencilSimpleBold className="mr-2 h-4 w-4" />
            Edit Product
          </Button>
        </PermissionGate>
      </div>
    );
  }

  if (product.status === 'active' && !product.is_active) {
    return (
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={onViewHistory}>
          <PiClockCounterClockwiseBold className="mr-2 h-4 w-4" />
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
              <PiPlayCircleBold className="mr-2 h-4 w-4" />
            )}
            Reactivate
          </Button>
        </PermissionGate>
        <PermissionGate permissions={[PERMISSIONS.PRODUCTS.DELETE]}>
          <Button variant="destructive" size="sm" onClick={onArchive}>
            <PiArchiveBold className="mr-2 h-4 w-4" />
            Archive
          </Button>
        </PermissionGate>
        <PermissionGate permissions={[PERMISSIONS.PRODUCTS.EDIT]}>
          <Button
            className="bg-circleTel-orange hover:bg-circleTel-orange-dark"
            size="sm"
            onClick={onEdit}
          >
            <PiPencilSimpleBold className="mr-2 h-4 w-4" />
            Edit Product
          </Button>
        </PermissionGate>
      </div>
    );
  }

  if (product.status === 'archived') {
    return (
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={onViewHistory}>
          <PiClockCounterClockwiseBold className="mr-2 h-4 w-4" />
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
              <PiArrowCounterClockwiseBold className="mr-2 h-4 w-4" />
            )}
            Restore to Draft
          </Button>
        </PermissionGate>
        <div className="text-sm text-gray-500 italic ml-2">Product is archived</div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" onClick={onViewHistory}>
        <PiClockCounterClockwiseBold className="mr-2 h-4 w-4" />
        History
      </Button>
      <PermissionGate permissions={[PERMISSIONS.PRODUCTS.EDIT]}>
        <Button
          className="bg-circleTel-orange hover:bg-circleTel-orange-dark"
          size="sm"
          onClick={onEdit}
        >
          <PiPencilSimpleBold className="mr-2 h-4 w-4" />
          Edit
        </Button>
      </PermissionGate>
    </div>
  );
};

function DraftPublishActions({
  product,
  loading,
  onEdit,
  onViewHistory,
  onPublish,
}: {
  product: Product;
  loading: string | null;
  onEdit: () => void;
  onViewHistory: () => void;
  onPublish: () => void;
}) {
  const [gate, setGate] = useState<LifecycleGateResult | null>(null);
  const [line, setLine] = useState<ProductLine | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function check() {
      setChecking(true);
      try {
        const res = await fetch(
          `/api/admin/product-lines/publish-check?sku=${encodeURIComponent(product.sku || product.id)}`
        );
        const data = await res.json();
        if (cancelled) return;
        setLine(data.line ?? null);
        setGate(data.gate ?? null);
      } catch {
        if (!cancelled) {
          setLine(null);
          setGate(null);
        }
      } finally {
        if (!cancelled) setChecking(false);
      }
    }
    check();
    return () => {
      cancelled = true;
    };
  }, [product.id, product.sku]);

  const linked = Boolean(line);
  const blocked = linked && gate != null && !gate.allowed;

  return (
    <div className="flex flex-col items-end gap-3">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={onViewHistory}>
          <PiClockCounterClockwiseBold className="mr-2 h-4 w-4" />
          History
        </Button>
        <PermissionGate permissions={[PERMISSIONS.PRODUCTS.EDIT]}>
          <Button variant="outline" size="sm" onClick={onEdit}>
            <PiPencilSimpleBold className="mr-2 h-4 w-4" />
            Edit Draft
          </Button>
        </PermissionGate>
        <PermissionGate permissions={[PERMISSIONS.PRODUCTS.EDIT]}>
          <Button
            className="bg-green-600 hover:bg-green-700 text-white"
            size="sm"
            onClick={onPublish}
            disabled={!!loading || checking || blocked}
            title={blocked ? 'Parent product line is not publish-ready' : undefined}
          >
            {loading === 'publish' || checking ? (
              <span className="animate-spin mr-2">⏳</span>
            ) : (
              <PiRocketBold className="mr-2 h-4 w-4" />
            )}
            Publish to Catalogue
          </Button>
        </PermissionGate>
      </div>
      {linked && gate && (
        <div className="w-80 text-left">
          {blocked && (
            <p className="mb-2 flex items-start gap-1 text-xs text-amber-800">
              <PiWarningBold className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              Publish blocked until {line?.name || 'the parent line'} has current CPS/BRD/FSD and finance sign-off.
            </p>
          )}
          <PublishReadinessChecklist items={gate.items} />
        </div>
      )}
    </div>
  );
}
