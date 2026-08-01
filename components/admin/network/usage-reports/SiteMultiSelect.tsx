'use client';

import { useMemo, useState } from 'react';
import { PiMagnifyingGlassBold } from 'react-icons/pi';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export interface UsageReportSite {
  id: string;
  name: string;
  account_number: string;
  status: string;
  service_id: string | null;
  service_status: string | null;
  corporate_code: string;
  account_name: string;
}

interface SiteMultiSelectProps {
  sites: UsageReportSite[];
  selectedIds: string[];
  loading: boolean;
  onChange: (siteIds: string[]) => void;
}

export function filterUsageReportSites(
  sites: UsageReportSite[],
  query: string
): UsageReportSite[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return sites;
  return sites.filter((site) =>
    [site.name, site.account_number, site.account_name, site.corporate_code]
      .join(' ')
      .toLowerCase()
      .includes(normalized)
  );
}

export function SiteMultiSelect({
  sites,
  selectedIds,
  loading,
  onChange,
}: SiteMultiSelectProps) {
  const [query, setQuery] = useState('');
  const visibleSites = useMemo(
    () => filterUsageReportSites(sites, query),
    [query, sites]
  );
  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const allVisibleSelected =
    visibleSites.length > 0 && visibleSites.every((site) => selectedSet.has(site.id));

  const toggleSite = (siteId: string, checked: boolean) => {
    if (checked) onChange([...new Set([...selectedIds, siteId])]);
    else onChange(selectedIds.filter((id) => id !== siteId));
  };

  const toggleVisible = () => {
    if (allVisibleSelected) {
      const visibleIds = new Set(visibleSites.map((site) => site.id));
      onChange(selectedIds.filter((id) => !visibleIds.has(id)));
      return;
    }
    onChange([...new Set([...selectedIds, ...visibleSites.map((site) => site.id)])]);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold text-slate-900">Sites</p>
        <span className="text-xs font-medium text-slate-500">
          {selectedIds.length} selected
        </span>
      </div>

      <div className="relative">
        <PiMagnifyingGlassBold className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
        <Input
          aria-label="Search sites"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by site, account or corporate"
          className="pl-9"
        />
      </div>

      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={toggleVisible}
          disabled={loading || visibleSites.length === 0}
        >
          {allVisibleSelected ? 'Clear visible' : 'Select visible'}
        </Button>
        {selectedIds.length > 0 && (
          <Button type="button" variant="ghost" size="sm" onClick={() => onChange([])}>
            Clear all
          </Button>
        )}
      </div>

      <div className="max-h-80 overflow-y-auto rounded-lg border border-slate-200">
        {loading ? (
          <p className="p-6 text-center text-sm text-slate-500">Loading eligible sites…</p>
        ) : visibleSites.length === 0 ? (
          <p className="p-6 text-center text-sm text-slate-500">
            No eligible sites match these filters.
          </p>
        ) : (
          visibleSites.map((site) => (
            <div
              key={site.id}
              className="flex items-start gap-3 border-b border-slate-100 p-3 last:border-b-0 hover:bg-slate-50"
            >
              <Checkbox
                id={`usage-site-${site.id}`}
                aria-label={`Select ${site.name}`}
                checked={selectedSet.has(site.id)}
                onCheckedChange={(checked) => toggleSite(site.id, checked === true)}
                className="mt-0.5"
              />
              <Label
                htmlFor={`usage-site-${site.id}`}
                className="min-w-0 flex-1 cursor-pointer font-normal"
              >
                <span className="block truncate text-sm font-medium text-slate-900">
                  {site.name}
                </span>
                <span className="block truncate text-xs text-slate-500">
                  {site.account_number || 'No account number'} · {site.account_name}
                </span>
              </Label>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                {site.status}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
