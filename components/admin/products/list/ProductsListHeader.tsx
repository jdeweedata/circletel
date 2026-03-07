'use client';

import { PiArrowsClockwiseBold, PiDownloadSimpleBold, PiPlusBold } from 'react-icons/pi';
import { Button } from '@/components/ui/button';
import { DetailPageHeader } from '@/components/admin/shared/DetailPageHeader';
import { PermissionGate } from '@/components/rbac/PermissionGate';
import { PERMISSIONS } from '@/lib/rbac/permissions';
import Link from 'next/link';

interface ProductsListHeaderProps {
  lastRefreshed: Date;
  onRefresh: () => void;
  onExport: () => void;
  isLoading?: boolean;
}

export function ProductsListHeader({
  lastRefreshed,
  onRefresh,
  onExport,
  isLoading,
}: ProductsListHeaderProps) {
  return (
    <DetailPageHeader
      breadcrumbs={[
        { label: 'Dashboard', href: '/admin' },
        { label: 'Products' },
      ]}
      title="Product Management"
      actions={
        <>
          <span className="text-xs text-slate-500 mr-2 hidden sm:inline">
            Last updated: {lastRefreshed.toLocaleTimeString()}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isLoading}
            className="gap-2"
          >
            <PiArrowsClockwiseBold className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onExport}
            className="gap-2"
          >
            <PiDownloadSimpleBold className="h-4 w-4" />
            <span className="hidden sm:inline">Export CSV</span>
          </Button>
          <PermissionGate permissions={[PERMISSIONS.PRODUCTS.CREATE]}>
            <Link href="/admin/products/new">
              <Button size="sm" className="gap-2">
                <PiPlusBold className="h-4 w-4" />
                <span className="hidden sm:inline">New Product</span>
              </Button>
            </Link>
          </PermissionGate>
        </>
      }
    />
  );
}
