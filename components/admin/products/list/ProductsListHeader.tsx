'use client';

import { PiPlusBold, PiArrowsClockwiseBold, PiDownloadSimpleBold } from 'react-icons/pi';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { PermissionGate } from '@/components/rbac/PermissionGate';
import { PERMISSIONS } from '@/lib/rbac/permissions';

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
  const router = useRouter();

  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
          Product Management
        </h1>
        <div className="flex items-center gap-3 mt-2">
          <p className="text-sm font-medium text-slate-500">
            Manage your catalogue of hardware, services, and connectivity.
          </p>
          <span className="text-xs text-slate-500 hidden sm:inline border-l border-slate-300 pl-3">
            Last updated: {lastRefreshed.toLocaleTimeString()}
          </span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={isLoading}
          className="gap-2 border-slate-200 text-slate-700 bg-white hover:bg-slate-50"
        >
          <PiArrowsClockwiseBold className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Refresh</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onExport}
          className="gap-2 border-slate-200 text-slate-700 bg-white hover:bg-slate-50"
        >
          <PiDownloadSimpleBold className="h-4 w-4" />
          <span className="hidden sm:inline">Export CSV</span>
        </Button>
        <PermissionGate permissions={[PERMISSIONS.PRODUCTS.CREATE]}>
          <Button 
            onClick={() => router.push('/admin/products/new')}
            size="sm"
            className="bg-primary hover:bg-primary/90 text-white shadow-sm flex-shrink-0 gap-2"
          >
            <PiPlusBold className="h-4 w-4" />
            <span className="hidden sm:inline">New Product</span>
          </Button>
        </PermissionGate>
      </div>
    </div>
  );
}
