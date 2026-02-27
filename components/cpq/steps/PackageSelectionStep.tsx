'use client';

/**
 * Step 3: Package Selection
 *
 * AI-powered package recommendations and selection
 */

import { useState, useCallback, useEffect } from 'react';
import {
  Package,
  Sparkles,
  Loader2,
  CheckCircle2,
  Star,
  Filter,
  ArrowUpDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import type { CPQStepProps } from '../CPQWizard';
import type { AIRecommendation, SelectedPackage, ServicePackage } from '@/lib/cpq/types';

interface PackageWithRecommendation extends ServicePackage {
  recommendation?: AIRecommendation;
}

export function PackageSelectionStep({
  session,
  stepData,
  onUpdateStepData,
  isSaving,
}: CPQStepProps) {
  const data = stepData.package_selection || { selected_packages: [], ai_recommendations_shown: false };
  const locations = stepData.location_coverage?.sites || [];

  const [packages, setPackages] = useState<PackageWithRecommendation[]>([]);
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>(
    session?.ai_recommendations || []
  );
  const [isLoadingPackages, setIsLoadingPackages] = useState(false);
  const [isLoadingRecs, setIsLoadingRecs] = useState(false);
  const [selectedSiteIndex, setSelectedSiteIndex] = useState(0);

  // Filter state
  const [sortBy, setSortBy] = useState<'price' | 'speed' | 'recommendation'>('recommendation');
  const [filterSpeed, setFilterSpeed] = useState<string>('all');

  // Load packages on mount
  useEffect(() => {
    const loadPackages = async () => {
      setIsLoadingPackages(true);
      try {
        // Get coverage lead ID from first site if available
        const site = locations[selectedSiteIndex];
        const coverageLeadId = site?.coverage_result ? session?.id : undefined;

        const params = new URLSearchParams();
        if (coverageLeadId) {
          params.set('leadId', coverageLeadId);
        }
        params.set('type', 'business');

        const response = await fetch(`/api/coverage/packages?${params.toString()}`);
        const result = await response.json();

        if (result.packages) {
          setPackages(result.packages);
        }
      } catch (error) {
        console.error('Failed to load packages:', error);
        toast.error('Failed to load packages');
      } finally {
        setIsLoadingPackages(false);
      }
    };

    loadPackages();
  }, [locations, selectedSiteIndex, session?.id]);

  // Get AI recommendations
  const handleGetRecommendations = useCallback(async () => {
    if (!stepData.needs_assessment) {
      toast.error('Please complete needs assessment first');
      return;
    }

    setIsLoadingRecs(true);
    try {
      const response = await fetch('/api/cpq/ai/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requirements: stepData.needs_assessment,
          locations: locations.map((l) => ({
            address: l.address,
            coordinates: l.latitude && l.longitude ? { lat: l.latitude, lng: l.longitude } : undefined,
            coverage: l.coverage_result,
          })),
          budget: stepData.needs_assessment.budget_min || stepData.needs_assessment.budget_max
            ? {
                min: stepData.needs_assessment.budget_min,
                max: stepData.needs_assessment.budget_max,
              }
            : undefined,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        toast.error(result.error || 'Failed to get recommendations');
        return;
      }

      setRecommendations(result.recommendations || []);
      onUpdateStepData('package_selection', { ai_recommendations_shown: true });
      toast.success('AI recommendations loaded');
    } catch (error) {
      console.error('Recommendation error:', error);
      toast.error('Failed to get recommendations');
    } finally {
      setIsLoadingRecs(false);
    }
  }, [stepData.needs_assessment, locations, onUpdateStepData]);

  // Toggle package selection for a site
  const handleTogglePackage = useCallback(
    (pkg: ServicePackage, siteIndex: number) => {
      const existing = data.selected_packages.find(
        (sp) => sp.package_id === pkg.id && sp.site_index === siteIndex
      );

      let updatedPackages: SelectedPackage[];

      if (existing) {
        // Remove selection
        updatedPackages = data.selected_packages.filter(
          (sp) => !(sp.package_id === pkg.id && sp.site_index === siteIndex)
        );
      } else {
        // Add selection
        const rec = recommendations.find((r) => r.package_id === pkg.id);
        const newSelection: SelectedPackage = {
          package_id: pkg.id,
          package_name: pkg.name,
          site_index: siteIndex,
          base_price: pkg.price,
          quantity: 1,
          contract_term_months: 24,
          ai_recommended: !!rec,
          ai_confidence: rec?.confidence,
          ai_reasoning: rec?.reasoning,
        };
        updatedPackages = [...data.selected_packages, newSelection];
      }

      onUpdateStepData('package_selection', { selected_packages: updatedPackages });
    },
    [data.selected_packages, recommendations, onUpdateStepData]
  );

  // Check if package is selected for site
  const isPackageSelected = (packageId: string, siteIndex: number) => {
    return data.selected_packages.some(
      (sp) => sp.package_id === packageId && sp.site_index === siteIndex
    );
  };

  // Sort and filter packages
  const displayPackages = packages
    .map((pkg) => ({
      ...pkg,
      recommendation: recommendations.find((r) => r.package_id === pkg.id),
    }))
    .filter((pkg) => {
      if (filterSpeed === 'all') return true;
      const speed = parseInt(filterSpeed);
      return pkg.speed_down >= speed;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'price':
          return a.price - b.price;
        case 'speed':
          return b.speed_down - a.speed_down;
        case 'recommendation':
          const aRec = a.recommendation?.confidence || 0;
          const bRec = b.recommendation?.confidence || 0;
          return bRec - aRec;
        default:
          return 0;
      }
    });

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Select Packages</h2>
          <p className="text-sm text-gray-500">
            Choose packages for each site based on AI recommendations
          </p>
        </div>
        <Button
          onClick={handleGetRecommendations}
          disabled={isLoadingRecs}
          className="bg-circleTel-orange hover:bg-orange-600"
        >
          {isLoadingRecs ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Loading...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              Get AI Recommendations
            </>
          )}
        </Button>
      </div>

      {/* Site Selector */}
      {locations.length > 1 && (
        <div className="flex items-center gap-4 bg-gray-50 rounded-lg p-4">
          <Label>Selecting for Site:</Label>
          <Select
            value={selectedSiteIndex.toString()}
            onValueChange={(v) => setSelectedSiteIndex(parseInt(v))}
          >
            <SelectTrigger className="w-64">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {locations.map((loc) => (
                <SelectItem key={loc.index} value={loc.index.toString()}>
                  Site {loc.index + 1}: {loc.address || 'No address'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-400" />
          <Select value={filterSpeed} onValueChange={setFilterSpeed}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by speed" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Speeds</SelectItem>
              <SelectItem value="50">50+ Mbps</SelectItem>
              <SelectItem value="100">100+ Mbps</SelectItem>
              <SelectItem value="200">200+ Mbps</SelectItem>
              <SelectItem value="500">500+ Mbps</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <ArrowUpDown className="h-4 w-4 text-gray-400" />
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recommendation">AI Recommended</SelectItem>
              <SelectItem value="price">Price (Low to High)</SelectItem>
              <SelectItem value="speed">Speed (High to Low)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Packages Grid */}
      {isLoadingPackages ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-circleTel-orange" />
          <span className="ml-2 text-gray-500">Loading packages...</span>
        </div>
      ) : displayPackages.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Package className="h-12 w-12 mx-auto text-gray-300" />
          <p className="mt-4 text-gray-500">No packages available</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayPackages.map((pkg) => {
            const isSelected = isPackageSelected(pkg.id, selectedSiteIndex);
            const hasRec = !!pkg.recommendation;

            return (
              <div
                key={pkg.id}
                onClick={() => handleTogglePackage(pkg, selectedSiteIndex)}
                className={`relative rounded-lg border-2 p-4 cursor-pointer transition-all ${
                  isSelected
                    ? 'border-circleTel-orange bg-orange-50'
                    : hasRec
                    ? 'border-amber-300 bg-amber-50 hover:border-amber-400'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {/* AI Badge */}
                {hasRec && (
                  <div className="absolute -top-2 -right-2">
                    <Badge className="bg-amber-500 text-white">
                      <Star className="h-3 w-3 mr-1 fill-current" />
                      {pkg.recommendation?.confidence}%
                    </Badge>
                  </div>
                )}

                {/* Selected Indicator */}
                {isSelected && (
                  <div className="absolute top-2 left-2">
                    <CheckCircle2 className="h-5 w-5 text-circleTel-orange" />
                  </div>
                )}

                <div className="pt-2">
                  <h3 className="font-semibold text-gray-900">{pkg.name}</h3>
                  <p className="text-2xl font-bold text-circleTel-orange mt-1">
                    R{pkg.price.toLocaleString()}
                    <span className="text-sm font-normal text-gray-500">/month</span>
                  </p>

                  <div className="mt-3 space-y-1 text-sm text-gray-600">
                    <p>
                      <span className="font-medium">Speed:</span> {pkg.speed_down}/{pkg.speed_up} Mbps
                    </p>
                    <p>
                      <span className="font-medium">Type:</span> {pkg.service_type}
                    </p>
                  </div>

                  {/* AI Reasoning */}
                  {pkg.recommendation?.reasoning && (
                    <p className="mt-3 text-xs text-amber-700 bg-amber-100 rounded p-2">
                      {pkg.recommendation.reasoning}
                    </p>
                  )}

                  {/* Match Scores */}
                  {pkg.recommendation?.match_scores && (
                    <div className="mt-3 grid grid-cols-2 gap-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Bandwidth:</span>
                        <span className="font-medium">{pkg.recommendation.match_scores.bandwidth}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Budget:</span>
                        <span className="font-medium">{pkg.recommendation.match_scores.budget}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Coverage:</span>
                        <span className="font-medium">{pkg.recommendation.match_scores.coverage}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">SLA:</span>
                        <span className="font-medium">{pkg.recommendation.match_scores.sla}%</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Selected Summary */}
      {data.selected_packages.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <span className="font-medium text-green-800">
              {data.selected_packages.length} package(s) selected
            </span>
          </div>
          <div className="text-sm text-green-700">
            {locations.map((loc) => {
              const count = data.selected_packages.filter((sp) => sp.site_index === loc.index).length;
              return count > 0 ? (
                <p key={loc.index}>
                  Site {loc.index + 1}: {count} package(s)
                </p>
              ) : null;
            })}
          </div>
        </div>
      )}
    </div>
  );
}
