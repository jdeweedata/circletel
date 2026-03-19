'use client';

import { PiMagnifyingGlassBold } from 'react-icons/pi';
import { Input } from '@/components/ui/input';

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
    <div className="flex flex-col sm:flex-row gap-4 p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
      <div className="flex-1 relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <PiMagnifyingGlassBold className="h-5 w-5 text-slate-400" />
        </div>
        <Input
          type="text"
          placeholder="Search quotes by company, email, or number..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 h-10 border-slate-200 focus:ring-primary focus:border-primary shadow-sm rounded-lg w-full"
        />
      </div>

      <select
        value={statusFilter}
        onChange={(e) => onStatusFilterChange(e.target.value)}
        className="h-10 px-4 py-2 bg-slate-50 border border-slate-200 text-slate-700 rounded-lg text-sm font-medium focus:ring-2 focus:ring-primary focus:border-primary focus:bg-white outline-none sm:w-48 transition-colors cursor-pointer"
      >
        <option value="all">All Statuses</option>
        <option value="draft">Draft</option>
        <option value="pending_approval">Pending Approval</option>
        <option value="approved">Approved</option>
        <option value="sent">Sent</option>
        <option value="viewed">Viewed</option>
        <option value="accepted">Accepted</option>
        <option value="rejected">Rejected</option>
        <option value="expired">Expired</option>
      </select>
    </div>
  );
}
