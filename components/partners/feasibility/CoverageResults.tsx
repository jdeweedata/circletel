'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  MapPin,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  Wifi,
  Radio,
  Cable,
  Signal,
} from 'lucide-react';
import {
  PartnerFeasibilitySite,
  CoverageResult,
  PackageOption,
} from '@/lib/partners/feasibility-types';

interface CoverageResultsProps {
  sites: PartnerFeasibilitySite[];
  onSelectPackage?: (siteId: string, pkg: PackageOption) => void;
  onGenerateQuote?: () => void;
  canGenerateQuote?: boolean;
}

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
  onSelectPackage,
}: {
  site: PartnerFeasibilitySite;
  onSelectPackage?: (pkg: PackageOption) => void;
}) {
  const isComplete = site.coverage_status === 'complete';
  const isFailed = site.coverage_status === 'failed';
  const isChecking = site.coverage_status === 'checking';
  const isPending = site.coverage_status === 'pending';

  const feasibleResults = (site.coverage_results || []).filter(
    (r) => r.is_feasible
  );
  const hasCoverage = feasibleResults.length > 0;

  return (
    <div className="border rounded-lg p-4 bg-white">
      {/* Site Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start gap-2">
          <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
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
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">
            {isChecking ? 'Checking coverage...' : 'Waiting to check...'}
          </span>
        </div>
      )}

      {/* Failed State */}
      {isFailed && (
        <div className="flex items-center gap-2 text-red-600 py-4">
          <XCircle className="w-5 h-5" />
          <span className="text-sm">Failed to check coverage</span>
        </div>
      )}

      {/* Results */}
      {isComplete && (
        <div className="space-y-3">
          {!hasCoverage && (
            <div className="flex items-center gap-2 text-amber-600 py-2">
              <XCircle className="w-5 h-5" />
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
          <Clock className="w-3 h-3 mr-1" />
          Pending
        </Badge>
      );
    case 'checking':
      return (
        <Badge variant="outline" className="text-blue-500">
          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
          Checking
        </Badge>
      );
    case 'complete':
      return hasCoverage ? (
        <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
          <CheckCircle className="w-3 h-3 mr-1" />
          Available
        </Badge>
      ) : (
        <Badge variant="outline" className="text-amber-600">
          <XCircle className="w-3 h-3 mr-1" />
          No Coverage
        </Badge>
      );
    case 'failed':
      return (
        <Badge variant="destructive">
          <XCircle className="w-3 h-3 mr-1" />
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
  onSelectPackage,
  onGenerateQuote,
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

  return (
    <Card>
      <CardHeader className="pb-3 border-b">
        <CardTitle className="flex items-center justify-between text-lg">
          <span className="flex items-center gap-2">
            <Wifi className="w-5 h-5 text-circleTel-orange" />
            Coverage Results
          </span>
          {allComplete && anyHasCoverage && onGenerateQuote && (
            <Button
              onClick={onGenerateQuote}
              disabled={!canGenerateQuote}
              className="bg-circleTel-orange hover:bg-circleTel-orange/90"
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
              onSelectPackage={
                onSelectPackage
                  ? (pkg) => onSelectPackage(site.id, pkg)
                  : undefined
              }
            />
          ))
        )}
      </CardContent>
    </Card>
  );
}
