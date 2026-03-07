'use client';

import { PiFunnelBold, PiMagnifyingGlassBold, PiXBold } from 'react-icons/pi';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SectionCard } from '@/components/admin/shared/SectionCard';

interface OrdersFiltersProps {
  searchQuery: string;
  statusFilter: string;
  paymentStatusFilter: string;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onPaymentStatusChange: (value: string) => void;
  onClearAll: () => void;
  hasActiveFilters: boolean;
}

export function OrdersFilters({
  searchQuery,
  statusFilter,
  paymentStatusFilter,
  onSearchChange,
  onStatusChange,
  onPaymentStatusChange,
  onClearAll,
  hasActiveFilters,
}: OrdersFiltersProps) {
  return (
    <SectionCard
      title="Filters"
      icon={PiFunnelBold}
      compact
      action={
        hasActiveFilters ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearAll}
            className="text-xs text-slate-500 hover:text-slate-700 gap-1"
          >
            <PiXBold className="h-3 w-3" />
            Clear all
          </Button>
        ) : null
      }
    >
      <div className="flex flex-col md:flex-row gap-3">
        <div className="flex-1">
          <div className="relative">
            <PiMagnifyingGlassBold className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search by order number, name, email, or phone..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 bg-white"
            />
          </div>
        </div>
        <Select value={statusFilter} onValueChange={onStatusChange}>
          <SelectTrigger className="w-full md:w-48 bg-white">
            <SelectValue placeholder="Order Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="payment_method_pending">Payment Method Pending</SelectItem>
            <SelectItem value="payment_method_registered">Payment Method Registered</SelectItem>
            <SelectItem value="installation_scheduled">Installation Scheduled</SelectItem>
            <SelectItem value="installation_in_progress">Installation In Progress</SelectItem>
            <SelectItem value="installation_completed">Installation Completed</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
        <Select value={paymentStatusFilter} onValueChange={onPaymentStatusChange}>
          <SelectTrigger className="w-full md:w-48 bg-white">
            <SelectValue placeholder="Payment Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Payments</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="partial">Partial</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </SectionCard>
  );
}
