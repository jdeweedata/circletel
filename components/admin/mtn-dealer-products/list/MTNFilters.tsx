import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { PiMagnifyingGlassBold } from 'react-icons/pi';
import { MTNDealerProductFilters, TECHNOLOGY_OPTIONS, CONTRACT_TERM_OPTIONS, PRODUCT_STATUS_OPTIONS } from '@/lib/types/mtn-dealer-products';

interface MTNFiltersProps {
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  filters: MTNDealerProductFilters;
  handleFilterChange: (key: keyof MTNDealerProductFilters, val: any) => void;
  clearFilters: () => void;
}

export function MTNFilters({
  searchQuery,
  setSearchQuery,
  filters,
  handleFilterChange,
  clearFilters,
}: MTNFiltersProps) {
  return (
    <div className="flex flex-wrap items-end gap-4 p-6 bg-white border rounded-xl shadow-sm mb-4">
      <div className="flex-1 min-w-[200px]">
        <Label className="text-xs text-gray-500">Search</Label>
        <div className="relative">
          <PiMagnifyingGlassBold className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by deal ID, price plan, device..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>
      
      <div className="w-[150px]">
        <Label className="text-xs text-gray-500">Technology</Label>
        <Select
          value={filters.technology || 'all'}
          onValueChange={(v) => handleFilterChange('technology', v)}
        >
          <SelectTrigger>
            <SelectValue placeholder="All" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            {TECHNOLOGY_OPTIONS.map(opt => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className="w-[150px]">
        <Label className="text-xs text-gray-500">Contract Term</Label>
        <Select
          value={filters.contract_term?.toString() || 'all'}
          onValueChange={(v) => handleFilterChange('contract_term', v === 'all' ? undefined : parseInt(v))}
        >
          <SelectTrigger>
            <SelectValue placeholder="All" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            {CONTRACT_TERM_OPTIONS.map(opt => (
              <SelectItem key={opt.value} value={opt.value.toString()}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className="w-[150px]">
        <Label className="text-xs text-gray-500">Device</Label>
        <Select
          value={filters.has_device === undefined ? 'all' : filters.has_device.toString()}
          onValueChange={(v) => handleFilterChange('has_device', v === 'all' ? undefined : v === 'true')}
        >
          <SelectTrigger>
            <SelectValue placeholder="All" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="true">With Device</SelectItem>
            <SelectItem value="false">SIM Only</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="w-[150px]">
        <Label className="text-xs text-gray-500">Status</Label>
        <Select
          value={filters.status || 'all'}
          onValueChange={(v) => handleFilterChange('status', v)}
        >
          <SelectTrigger>
            <SelectValue placeholder="All" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            {PRODUCT_STATUS_OPTIONS.map(opt => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <Button variant="ghost" onClick={clearFilters}>
        Clear Filters
      </Button>
    </div>
  );
}
