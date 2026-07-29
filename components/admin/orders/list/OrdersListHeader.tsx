'use client';

import { PiArrowsClockwiseBold, PiDownloadSimpleBold } from 'react-icons/pi';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/backend';

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
    <PageHeader
      title="Customer Orders"
      subtitle={`Last updated: ${lastRefreshed.toLocaleTimeString()}`}
      actions={
        <>
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
          <Button variant="default" size="sm" onClick={onExport} className="gap-2">
            <PiDownloadSimpleBold className="h-4 w-4" />
            <span className="hidden sm:inline">Export CSV</span>
          </Button>
        </>
      }
    />
  );
}
