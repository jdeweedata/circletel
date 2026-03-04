'use client';
import { PiCellSignalFullBold, PiCheckCircleBold, PiClockBold, PiFunnelBold, PiMapPinBold, PiPackageBold, PiPlugBold, PiRadioBold, PiSpinnerBold, PiTrashBold, PiWifiBold, PiXCircleBold } from 'react-icons/pi';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  PartnerFeasibilitySite,
  CoverageResult,
  PackageOption,
  ServicePackage,
  PackageFilters,
} from '@/lib/partners/feasibility-types';
import { BusinessPackageCard } from './BusinessPackageCard';

interface CoverageResultsProps {
  sites: PartnerFeasibilitySite[];
  packagesPerSite?: Record<string, ServicePackage[]>;
  selectedPackages?: Record<string, ServicePackage[]>;
  onPackageSelect?: (siteId: string, pkg: ServicePackage) => void;
  onPackageDeselect?: (siteId: string, pkgId: string) => void;
  onSelectPackage?: (siteId: string, pkg: PackageOption) => void;
  onGenerateQuote?: () => void;
  onClearSelection?: () => void;
  canGenerateQuote?: boolean;
}

// Filter options
const TECH_FILTERS: Array<{ value: PackageFilters['technology']; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'fibre', label: 'Fibre' },
  { value: 'wireless', label: 'Wireless' },
  { value: 'lte', label: 'LTE' },
  { value: '5g', label: '5G' },
];

const SPEED_FILTERS = [
  { value: 0, label: 'Any Speed' },
  { value: 50, label: '50+ Mbps' },
  { value: 100, label: '100+ Mbps' },
  { value: 200, label: '200+ Mbps' },
];

const TECH_ICONS: Record<string, typeof Wifi> = {
  fibre: Cable,
  fiber: Cable,
  tarana: Radio,
  skyfibre: Radio,
  lte: Signal,
  '5g': Signal,
  default: Wifi,
};

const getTechIcon = (tech: string) => {
  const key = tech.toLowerCase();
  for (const [pattern, icon] of Object.entries(TECH_ICONS)) {
    if (key.includes(pattern)) return icon;
  }
  return TECH_ICONS.default;
};

function CoverageSiteCard({
  site,
  packages,
  selectedPackages,
  onPackageSelect,
  onPackageDeselect,
  onSelectPackage,
}: {
  site: PartnerFeasibilitySite;
  packages?: ServicePackage[];
  selectedPackages?: ServicePackage[];
  onPackageSelect?: (pkg: ServicePackage) => void;
  onPackageDeselect?: (pkgId: string) => void;
  onSelectPackage?: (pkg: PackageOption) => void;
}) {
  const [filters, setFilters] = useState<PackageFilters>({
    technology: 'all',
    minSpeed: 0,
    sortBy: 'price',
  });

  const isComplete = site.coverage_status === 'complete';
  const isFailed = site.coverage_status === 'failed';
  const isChecking = site.coverage_status === 'checking';
  const isPending = site.coverage_status === 'pending';

  const feasibleResults = (site.coverage_results || []).filter(
    (r) => r.is_feasible
  );
  const hasCoverage = feasibleResults.length > 0;
  const hasPackages = packages && packages.length > 0;

  // Filter and sort packages
  const filteredPackages = useMemo(() => {
    if (!packages) return [];

    return packages
      .filter((pkg) => {
        // Technology filter
        if (filters.technology !== 'all') {
          const type = pkg.service_type?.toLowerCase() || '';
          switch (filters.technology) {
            case 'fibre':
              if (!type.includes('fibre') && !type.includes('fiber')) return false;
              break;
            case 'wireless':
              if (!type.includes('tarana') && !type.includes('sky') && !type.includes('wireless')) return false;
              break;
            case 'lte':
              if (!type.includes('lte')) return false;
              break;
            case '5g':
              if (!type.includes('5g')) return false;
              break;
          }
        }

        // Speed filter
        if (filters.minSpeed > 0 && pkg.speed_down < filters.minSpeed) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        switch (filters.sortBy) {
          case 'price':
            return a.price - b.price;
          case 'speed':
            return b.speed_down - a.speed_down;
          case 'name':
            return a.name.localeCompare(b.name);
          default:
            return 0;
        }
      });
  }, [packages, filters]);

  const selectedIds = new Set(selectedPackages?.map((p) => p.id) || []);

  const handleTogglePackage = (pkg: ServicePackage) => {
    if (selectedIds.has(pkg.id)) {
      onPackageDeselect?.(pkg.id);
    } else {
      onPackageSelect?.(pkg);
    }
  };

  return (
    <div className="border rounded-lg p-4 bg-white">
      {/* Site Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start gap-2">
          <PiMapPinBold className="w-5 h-5 text-gray-400 mt-0.5" />
          <div>
            <p className="font-medium text-gray-900">{site.address}</p>
            {site.latitude && site.longitude && (
              <p className="text-xs text-gray-500">
                {site.latitude.toFixed(6)}, {site.longitude.toFixed(6)}
              </p>
            )}
          </div>
        </div>
        <StatusBadge status={site.coverage_status} hasCoverage={hasCoverage} />
      </div>

      {/* Loading State */}
      {(isPending || isChecking) && (
        <div className="flex items-center gap-2 text-gray-500 py-4">
          <PiSpinnerBold className="w-5 h-5 animate-spin" />
          <span className="text-sm">
            {isChecking ? 'Checking coverage...' : 'Waiting to check...'}
          </span>
        </div>
      )}

      {/* Failed State */}
      {isFailed && (
        <div className="flex items-center gap-2 text-red-600 py-4">
          <PiXCircleBold className="w-5 h-5" />
          <span className="text-sm">Failed to check coverage</span>
        </div>
      )}

      {/* Coverage Results (technology availability) */}
      {isComplete && (
        <div className="space-y-3">
          {!hasCoverage && (
            <div className="flex items-center gap-2 text-amber-600 py-2">
              <PiXCircleBold className="w-5 h-5" />
              <span className="text-sm">No coverage available at this location</span>
            </div>
          )}

          {feasibleResults.map((result, idx) => (
            <TechnologyResult
              key={idx}
              result={result}
              onSelectPackage={onSelectPackage}
            />
          ))}
        </div>
      )}

      {/* Business Packages Grid */}
      {isComplete && hasPackages && (
        <div className="mt-4 pt-4 border-t">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <PiPackageBold className="w-4 h-4 text-circleTel-orange" />
              <span className="font-medium text-gray-900">Available Packages</span>
            </div>
            <span className="text-sm text-gray-500">
              Showing {filteredPackages.length} of {packages.length} packages
            </span>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            {/* Technology filter */}
            <div className="flex items-center gap-1">
              <PiFunnelBold className="w-4 h-4 text-gray-400" />
              <div className="flex gap-1">
                {TECH_FILTERS.map((f) => (
                  <button
                    key={f.value}
                    onClick={() => setFilters((prev) => ({ ...prev, technology: f.value }))}
                    className={`px-2 py-1 text-xs rounded-md transition-colors ${
                      filters.technology === f.value
                        ? 'bg-circleTel-orange text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Speed filter */}
            <select
              value={filters.minSpeed}
              onChange={(e) => setFilters((prev) => ({ ...prev, minSpeed: Number(e.target.value) }))}
              className="text-xs border rounded-md px-2 py-1 bg-white"
            >
              {SPEED_FILTERS.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>

            {/* Sort */}
            <select
              value={filters.sortBy}
              onChange={(e) => setFilters((prev) => ({ ...prev, sortBy: e.target.value as PackageFilters['sortBy'] }))}
              className="text-xs border rounded-md px-2 py-1 bg-white"
            >
              <option value="price">Sort by Price</option>
              <option value="speed">Sort by Speed</option>
              <option value="name">Sort by Name</option>
            </select>
          </div>

          {/* Package Grid */}
          {filteredPackages.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {filteredPackages.map((pkg) => (
                <BusinessPackageCard
                  key={pkg.id}
                  pkg={pkg}
                  isSelected={selectedIds.has(pkg.id)}
                  onToggle={() => handleTogglePackage(pkg)}
                />
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 text-center py-4">
              No packages match your filters. Try adjusting the filters above.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function StatusBadge({
  status,
  hasCoverage,
}: {
  status: string;
  hasCoverage: boolean;
}) {
  switch (status) {
    case 'pending':
      return (
        <Badge variant="outline" className="text-gray-500">
          <PiClockBold className="w-3 h-3 mr-1" />
          Pending
        </Badge>
      );
    case 'checking':
      return (
        <Badge variant="outline" className="text-blue-500">
          <PiSpinnerBold className="w-3 h-3 mr-1 animate-spin" />
          Checking
        </Badge>
      );
    case 'complete':
      return hasCoverage ? (
        <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
          <PiCheckCircleBold className="w-3 h-3 mr-1" />
          Available
        </Badge>
      ) : (
        <Badge variant="outline" className="text-amber-600">
          <PiXCircleBold className="w-3 h-3 mr-1" />
          No Coverage
        </Badge>
      );
    case 'failed':
      return (
        <Badge variant="destructive">
          <PiXCircleBold className="w-3 h-3 mr-1" />
          Failed
        </Badge>
      );
    default:
      return null;
  }
}

function TechnologyResult({
  result,
  onSelectPackage,
}: {
  result: CoverageResult;
  onSelectPackage?: (pkg: PackageOption) => void;
}) {
  const Icon = getTechIcon(result.technology);
  const packages = result.packages || [];

  return (
    <div className="border rounded-lg p-3 bg-gray-50">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4 text-circleTel-orange" />
        <span className="font-medium text-sm">{result.technology}</span>
        <span className="text-xs text-gray-500">via {result.provider}</span>
        {result.confidence >= 0.8 && (
          <Badge variant="outline" className="text-green-600 text-xs">
            High Confidence
          </Badge>
        )}
      </div>

      {packages.length > 0 && (
        <div className="grid gap-2 mt-2">
          {packages.slice(0, 3).map((pkg, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-2 bg-white rounded border"
            >
              <div>
                <p className="text-sm font-medium">{pkg.name}</p>
                <p className="text-xs text-gray-500">
                  {pkg.speed_down}/{pkg.speed_up} Mbps
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-circleTel-orange">
                  R{pkg.price.toLocaleString()}
                </span>
                {onSelectPackage && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onSelectPackage(pkg)}
                  >
                    Select
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function CoverageResults({
  sites,
  packagesPerSite,
  selectedPackages,
  onPackageSelect,
  onPackageDeselect,
  onSelectPackage,
  onGenerateQuote,
  onClearSelection,
  canGenerateQuote = false,
}: CoverageResultsProps) {
  const allComplete = sites.every(
    (s) => s.coverage_status === 'complete' || s.coverage_status === 'failed'
  );
  const anyHasCoverage = sites.some(
    (s) =>
      s.coverage_status === 'complete' &&
      (s.coverage_results || []).some((r) => r.is_feasible)
  );

  // Calculate totals from selected packages
  const allSelectedPackages = useMemo(() => {
    if (!selectedPackages) return [];
    return Object.values(selectedPackages).flat();
  }, [selectedPackages]);

  const { monthlyTotal, vatAmount, grandTotal } = useMemo(() => {
    const monthly = allSelectedPackages.reduce((sum, pkg) => {
      // Use promotion price if available
      const price = pkg.promotion_price && pkg.promotion_price < pkg.price
        ? pkg.promotion_price
        : pkg.price;
      return sum + price;
    }, 0);
    const vat = monthly * 0.15;
    return {
      monthlyTotal: monthly,
      vatAmount: vat,
      grandTotal: monthly + vat,
    };
  }, [allSelectedPackages]);

  const hasSelectedPackages = allSelectedPackages.length > 0;

  return (
    <Card>
      <CardHeader className="pb-3 border-b">
        <CardTitle className="flex items-center justify-between text-lg">
          <span className="flex items-center gap-2">
            <PiWifiBold className="w-5 h-5 text-circleTel-orange" />
            Coverage Results
          </span>
          {allComplete && anyHasCoverage && !hasSelectedPackages && onGenerateQuote && (
            <Button
              onClick={onGenerateQuote}
              disabled={!canGenerateQuote}
              className="bg-circleTel-orange hover:bg-circleTel-orange-dark"
            >
              Generate Quote
            </Button>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="p-4 space-y-4">
        {sites.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            No sites to check. Add sites in the form above.
          </p>
        ) : (
          sites.map((site) => (
            <CoverageSiteCard
              key={site.id}
              site={site}
              packages={packagesPerSite?.[site.id]}
              selectedPackages={selectedPackages?.[site.id]}
              onPackageSelect={
                onPackageSelect
                  ? (pkg) => onPackageSelect(site.id, pkg)
                  : undefined
              }
              onPackageDeselect={
                onPackageDeselect
                  ? (pkgId) => onPackageDeselect(site.id, pkgId)
                  : undefined
              }
              onSelectPackage={
                onSelectPackage
                  ? (pkg) => onSelectPackage(site.id, pkg)
                  : undefined
              }
            />
          ))
        )}

        {/* Pricing Summary */}
        {hasSelectedPackages && (
          <div className="mt-6 border-t pt-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <PiPackageBold className="w-4 h-4 text-circleTel-orange" />
                Selected Packages Summary
              </h4>

              {/* Selected packages list */}
              <div className="space-y-2 mb-4">
                {Object.entries(selectedPackages || {}).map(([siteId, pkgs]) => {
                  const site = sites.find((s) => s.id === siteId);
                  if (!pkgs || pkgs.length === 0) return null;
                  return (
                    <div key={siteId} className="text-sm">
                      <p className="text-gray-500 text-xs mb-1">
                        {site?.address || 'Unknown Site'}
                      </p>
                      {pkgs.map((pkg) => (
                        <div key={pkg.id} className="flex justify-between items-center py-1">
                          <span className="text-gray-700">{pkg.name}</span>
                          <span className="font-medium">
                            R{(pkg.promotion_price && pkg.promotion_price < pkg.price
                              ? pkg.promotion_price
                              : pkg.price
                            ).toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>

              {/* Totals */}
              <div className="border-t pt-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Monthly Total</span>
                  <span className="font-medium">R{monthlyTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">VAT (15%)</span>
                  <span className="font-medium">R{vatAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-base font-bold border-t pt-2">
                  <span className="text-gray-900">Grand Total</span>
                  <span className="text-circleTel-orange">
                    R{grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 mt-4 pt-3 border-t">
                {onClearSelection && (
                  <Button
                    variant="outline"
                    onClick={onClearSelection}
                    className="flex-1"
                  >
                    <PiTrashBold className="w-4 h-4 mr-2" />
                    Clear Selection
                  </Button>
                )}
                {onGenerateQuote && (
                  <Button
                    onClick={onGenerateQuote}
                    className="flex-1 bg-circleTel-orange hover:bg-circleTel-orange-dark"
                  >
                    <PiCheckCircleBold className="w-4 h-4 mr-2" />
                    Generate Quote
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
