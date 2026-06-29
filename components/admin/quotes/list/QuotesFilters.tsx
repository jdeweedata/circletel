'use client';

import { PiMagnifyingGlassBold } from 'react-icons/pi';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FilterToolbar } from '@/components/backend';

interface QuotesFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
}

export function QuotesFilters({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
}: QuotesFiltersProps) {
  return (
    <FilterToolbar>
      <div className="relative min-w-0 flex-1">
        <PiMagnifyingGlassBold className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input
          type="text"
          placeholder="Search quotes by company, email, or number..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="h-10 w-full pl-10"
        />
      </div>

      <Select
        value={statusFilter}
        onValueChange={onStatusFilterChange}
      >
        <SelectTrigger className="h-10 w-full sm:w-48">
          <SelectValue placeholder="All Statuses" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Statuses</SelectItem>
          <SelectItem value="draft">Draft</SelectItem>
          <SelectItem value="pending_approval">Pending Approval</SelectItem>
          <SelectItem value="approved">Approved</SelectItem>
          <SelectItem value="sent">Sent</SelectItem>
          <SelectItem value="viewed">Viewed</SelectItem>
          <SelectItem value="accepted">Accepted</SelectItem>
          <SelectItem value="rejected">Rejected</SelectItem>
          <SelectItem value="expired">Expired</SelectItem>
        </SelectContent>
      </Select>
    </FilterToolbar>
  );
}
