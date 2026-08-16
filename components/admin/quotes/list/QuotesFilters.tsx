'use client';

import { PiMagnifyingGlassBold } from 'react-icons/pi';
import { Input } from '@/components/ui/input';
import { FilterChips } from '@/components/portal/modernist/PortalModernistShell';

interface QuotesFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
}

const STATUS_OPTIONS = [
  { value: 'open', label: 'Active' },
  { value: 'all', label: 'All' },
  { value: 'draft', label: 'Draft' },
  { value: 'pending_approval', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'sent', label: 'Sent' },
  { value: 'viewed', label: 'Viewed' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'expired', label: 'Expired' },
];

export function QuotesFilters({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
}: QuotesFiltersProps) {
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
      <FilterChips
        options={STATUS_OPTIONS}
        value={statusFilter}
        onChange={onStatusFilterChange}
      />

      <div className="relative w-full max-w-md">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <PiMagnifyingGlassBold className="h-4 w-4" style={{ color: '#9CA3AF' }} />
        </div>
        <Input
          type="text"
          placeholder="Search company, email, or quote number…"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="h-11 w-full rounded-none border-2 pl-10 shadow-none"
          style={{
            borderColor: 'var(--pm-divider)',
            color: 'var(--pm-navy)',
          }}
        />
      </div>
    </div>
  );
}
