'use client';

/**
 * Searchable site picker (#695). A plain dropdown does not survive 26 sites,
 * and #688 ruled out a persistent rail — so selection lives in a command
 * palette and focus lives in the cards above the document.
 *
 * Deliberately shows no availability badge: the map rules out a per-site
 * telemetry probe on list load.
 */

import { useMemo, useState } from 'react';
import { PiBuildingsBold, PiCaretDownBold, PiCheckBold } from 'react-icons/pi';

import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

import {
  filterUsageReportSites,
  type UsageReportSite,
} from '../SiteMultiSelect';

interface SitePickerProps {
  sites: UsageReportSite[];
  selectedIds: string[];
  loading: boolean;
  onChange: (siteIds: string[]) => void;
}

export function SitePicker({
  sites,
  selectedIds,
  loading,
  onChange,
}: SitePickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  // Reuses the shipped filter so search behaviour is inherited, not reinvented.
  const filtered = useMemo(
    () => filterUsageReportSites(sites, query),
    [sites, query]
  );

  const toggle = (siteId: string) =>
    onChange(
      selectedIds.includes(siteId)
        ? selectedIds.filter((id) => id !== siteId)
        : [...selectedIds, siteId]
    );

  // Select-all applies to what is on screen, so "UNJ" + select all is the
  // Unjani preset without needing a special case.
  const selectFiltered = () => {
    const merged = new Set(selectedIds);
    for (const site of filtered) merged.add(site.id);
    onChange(Array.from(merged));
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="gap-2 font-normal" disabled={loading}>
          <PiBuildingsBold className="h-4 w-4 text-slate-400" />
          {loading
            ? 'Loading sites…'
            : selectedIds.length === 0
              ? 'Choose sites'
              : `${selectedIds.length} site${selectedIds.length === 1 ? '' : 's'}`}
          <PiCaretDownBold className="h-3.5 w-3.5 text-slate-400" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search site, account or corporate…"
            value={query}
            onValueChange={setQuery}
          />
          <CommandList>
            <CommandEmpty>No eligible site matches.</CommandEmpty>
            <CommandGroup>
              {filtered.map((site) => {
                const isSelected = selectedIds.includes(site.id);
                return (
                  <CommandItem
                    key={site.id}
                    value={site.id}
                    onSelect={() => toggle(site.id)}
                    className="gap-2"
                  >
                    <PiCheckBold
                      className={cn(
                        'h-4 w-4 shrink-0',
                        isSelected ? 'text-orange-600' : 'text-transparent'
                      )}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm">{site.name}</span>
                      <span className="block text-xs text-slate-500">
                        {site.account_number}
                      </span>
                    </span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
          <div className="flex items-center justify-between border-t border-slate-100 px-2 py-1.5">
            <Button variant="ghost" size="sm" onClick={selectFiltered}>
              Select {query ? 'these' : 'all'} ({filtered.length})
            </Button>
            <Button variant="ghost" size="sm" onClick={() => onChange([])}>
              Clear
            </Button>
          </div>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
