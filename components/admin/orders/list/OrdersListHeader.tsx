'use client';

import { PiArrowsClockwiseBold, PiDownloadSimpleBold } from 'react-icons/pi';
import { Button } from '@/components/ui/button';
import { DetailPageHeader } from '@/components/admin/shared/DetailPageHeader';

interface OrdersListHeaderProps {
  lastRefreshed: Date;
  onRefresh: () => void;
  onExport: () => void;
  isLoading?: boolean;
}

export function OrdersListHeader({
  lastRefreshed,
  onRefresh,
  onExport,
  isLoading,
}: OrdersListHeaderProps) {
  return (
    <DetailPageHeader
      breadcrumbs={[
        { label: 'Dashboard', href: '/admin' },
        { label: 'Orders' },
      ]}
      title="Customer Orders"
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
            variant="default"
            size="sm"
            onClick={onExport}
            className="gap-2"
          >
            <PiDownloadSimpleBold className="h-4 w-4" />
            <span className="hidden sm:inline">Export CSV</span>
          </Button>
        </>
      }
    />
  );
}
