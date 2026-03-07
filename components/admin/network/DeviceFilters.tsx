'use client';

import { useState } from 'react';
import {
  PiArrowsClockwiseBold,
  PiDownloadBold,
  PiFunnelBold,
  PiMagnifyingGlassBold,
  PiXBold,
} from 'react-icons/pi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';

interface DeviceFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusChange: (value: string) => void;
  groupFilter: string;
  onGroupChange: (value: string) => void;
  modelFilter: string;
  onModelChange: (value: string) => void;
  groups: string[];
  models: string[];
  onRefresh: () => void;
  onExport: () => void;
  refreshing: boolean;
}

export function DeviceFilters({
  search,
  onSearchChange,
  statusFilter,
  onStatusChange,
  groupFilter,
  onGroupChange,
  modelFilter,
  onModelChange,
  groups,
  models,
  onRefresh,
  onExport,
  refreshing,
}: DeviceFiltersProps) {
  const [filtersOpen, setFiltersOpen] = useState(false);

  const hasFilters = statusFilter || groupFilter || modelFilter;
  const activeFilterCount = [statusFilter, groupFilter, modelFilter].filter(Boolean).length;

  const clearAllFilters = () => {
    onStatusChange('');
    onGroupChange('');
    onModelChange('');
  };

  return (
    <Card>
      <CardContent className="pt-4 pb-4">
        <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen}>
          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <PiMagnifyingGlassBold className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by SN, name, or IP..."
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Filters toggle */}
            <CollapsibleTrigger asChild>
              <Button variant="outline" size="sm">
                <PiFunnelBold className="h-4 w-4 mr-2" />
                Filters
                {activeFilterCount > 0 && (
                  <Badge variant="secondary" className="ml-2 h-5 px-1.5">
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
            </CollapsibleTrigger>

            {/* Actions */}
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={refreshing}
            >
              <PiArrowsClockwiseBold className={cn('h-4 w-4 mr-2', refreshing && 'animate-spin')} />
              Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={onExport}>
              <PiDownloadBold className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>

          {/* Active filter chips */}
          {hasFilters && (
            <div className="flex flex-wrap items-center gap-2 mt-3">
              {statusFilter && (
                <Badge variant="secondary" className="gap-1">
                  Status: {statusFilter}
                  <button onClick={() => onStatusChange('')} className="ml-1 hover:text-red-500">
                    <PiXBold className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {groupFilter && (
                <Badge variant="secondary" className="gap-1">
                  Group: {groupFilter}
                  <button onClick={() => onGroupChange('')} className="ml-1 hover:text-red-500">
                    <PiXBold className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {modelFilter && (
                <Badge variant="secondary" className="gap-1">
                  Model: {modelFilter}
                  <button onClick={() => onModelChange('')} className="ml-1 hover:text-red-500">
                    <PiXBold className="h-3 w-3" />
                  </button>
                </Badge>
              )}
            </div>
          )}

          {/* Expanded filters */}
          <CollapsibleContent>
            <div className="flex flex-wrap items-end gap-4 mt-4 pt-4 border-t">
              <div className="w-40">
                <label className="text-sm font-medium text-gray-700 mb-1 block">Status</label>
                <Select value={statusFilter || 'all'} onValueChange={(v) => onStatusChange(v === 'all' ? '' : v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="online">Online</SelectItem>
                    <SelectItem value="offline">Offline</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="w-48">
                <label className="text-sm font-medium text-gray-700 mb-1 block">Group</label>
                <Select value={groupFilter || 'all'} onValueChange={(v) => onGroupChange(v === 'all' ? '' : v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Groups" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Groups</SelectItem>
                    {groups.map((g) => (
                      <SelectItem key={g} value={g}>{g}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-48">
                <label className="text-sm font-medium text-gray-700 mb-1 block">Model</label>
                <Select value={modelFilter || 'all'} onValueChange={(v) => onModelChange(v === 'all' ? '' : v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Models" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Models</SelectItem>
                    {models.map((m) => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {hasFilters && (
                <Button variant="ghost" size="sm" onClick={clearAllFilters}>
                  <PiXBold className="h-4 w-4 mr-1" />
                  Clear All
                </Button>
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}
