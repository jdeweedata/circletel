'use client';
import { PiArrowCounterClockwiseBold, PiCheckCircleBold, PiMagnifyingGlassBold, PiMapPinBold, PiNavigationArrowBold, PiPlusBold, PiSpinnerBold, PiTrashBold, PiWifiBold, PiXCircleBold } from 'react-icons/pi';

/**
 * Step 2: Location & Coverage
 *
 * Address input and coverage checking for each site
 */

import { useState, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import type { CPQStepProps } from '../CPQWizard';
import type { LocationSite, CoverageCheckResult } from '@/lib/cpq/types';

// Note: Google Maps types are already declared globally via @types/google.maps

export function LocationCoverageStep({
  session,
  stepData,
  onUpdateStepData,
  isSaving,
}: CPQStepProps) {
  const data = stepData.location_coverage || { sites: [], all_sites_checked: false };
  const [checkingIndex, setCheckingIndex] = useState<number | null>(null);
  const [bulkInput, setBulkInput] = useState('');
  const [showBulkInput, setShowBulkInput] = useState(false);

  // Add a new site
  const handleAddSite = useCallback(() => {
    const newSite: LocationSite = {
      index: data.sites.length,
      address: '',
      coverage_checked: false,
    };

    onUpdateStepData('location_coverage', {
      sites: [...data.sites, newSite],
    });
  }, [data.sites, onUpdateStepData]);

  // Remove a site
  const handleRemoveSite = useCallback(
    (index: number) => {
      const updatedSites = data.sites
        .filter((s) => s.index !== index)
        .map((s, i) => ({ ...s, index: i }));

      onUpdateStepData('location_coverage', {
        sites: updatedSites,
        all_sites_checked: updatedSites.every((s) => s.coverage_checked),
      });
    },
    [data.sites, onUpdateStepData]
  );

  // Update site address
  const handleAddressChange = useCallback(
    (index: number, address: string) => {
      const updatedSites = data.sites.map((s) =>
        s.index === index
          ? { ...s, address, coverage_checked: false, coverage_result: undefined }
          : s
      );

      onUpdateStepData('location_coverage', {
        sites: updatedSites,
        all_sites_checked: false,
      });
    },
    [data.sites, onUpdateStepData]
  );

  // Update site coordinates
  const handleCoordsChange = useCallback(
    (index: number, lat: number, lng: number) => {
      const updatedSites = data.sites.map((s) =>
        s.index === index
          ? { ...s, latitude: lat, longitude: lng }
          : s
      );

      onUpdateStepData('location_coverage', { sites: updatedSites });
    },
    [data.sites, onUpdateStepData]
  );

  // Check coverage for a site
  const handleCheckCoverage = useCallback(
    async (index: number) => {
      const site = data.sites.find((s) => s.index === index);
      if (!site?.address && !site?.latitude) {
        toast.error('Please enter an address or coordinates first');
        return;
      }

      setCheckingIndex(index);

      try {
        // Build coverage check request
        const params = new URLSearchParams();
        if (site.latitude && site.longitude) {
          params.set('lat', site.latitude.toString());
          params.set('lng', site.longitude.toString());
        }
        if (site.address) {
          params.set('address', site.address);
        }

        const response = await fetch(`/api/coverage/check?${params.toString()}`);
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Coverage check failed');
        }

        // Create coverage result
        const coverageResult: CoverageCheckResult = {
          is_feasible: result.is_feasible || result.hasCoverage || false,
          technologies: result.technologies || [],
          recommended_technology: result.recommended_technology,
          checked_at: new Date().toISOString(),
        };

        // Update site with coverage result
        const updatedSites = data.sites.map((s) =>
          s.index === index
            ? {
                ...s,
                coverage_checked: true,
                coverage_result: coverageResult,
                latitude: result.coordinates?.lat || s.latitude,
                longitude: result.coordinates?.lng || s.longitude,
              }
            : s
        );

        const allChecked = updatedSites.every((s) => s.coverage_checked);

        onUpdateStepData('location_coverage', {
          sites: updatedSites,
          all_sites_checked: allChecked,
        });

        if (coverageResult.is_feasible) {
          toast.success(`Site ${index + 1}: Coverage available`);
        } else {
          toast.warning(`Site ${index + 1}: Limited or no coverage`);
        }
      } catch (error) {
        console.error('Coverage check error:', error);
        toast.error(
          `Coverage check failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      } finally {
        setCheckingIndex(null);
      }
    },
    [data.sites, onUpdateStepData]
  );

  // Check all sites
  const handleCheckAll = useCallback(async () => {
    const uncheckedSites = data.sites.filter((s) => !s.coverage_checked && (s.address || s.latitude));

    for (const site of uncheckedSites) {
      await handleCheckCoverage(site.index);
    }
  }, [data.sites, handleCheckCoverage]);

  // Handle bulk address input
  const handleBulkAdd = useCallback(() => {
    if (!bulkInput.trim()) return;

    const lines = bulkInput.split('\n').filter((line) => line.trim());
    const newSites: LocationSite[] = lines.map((line, i) => {
      const trimmed = line.trim();

      // Check if it's GPS coordinates (format: lat, lng or lat lng)
      const coordMatch = trimmed.match(/^(-?\d+\.?\d*)[,\s]+(-?\d+\.?\d*)$/);

      if (coordMatch) {
        return {
          index: data.sites.length + i,
          address: '',
          latitude: parseFloat(coordMatch[1]),
          longitude: parseFloat(coordMatch[2]),
          coverage_checked: false,
        };
      }

      return {
        index: data.sites.length + i,
        address: trimmed,
        coverage_checked: false,
      };
    });

    onUpdateStepData('location_coverage', {
      sites: [...data.sites, ...newSites],
      all_sites_checked: false,
    });

    setBulkInput('');
    setShowBulkInput(false);
    toast.success(`Added ${newSites.length} sites`);
  }, [bulkInput, data.sites, onUpdateStepData]);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Site Locations</h2>
          <p className="text-sm text-gray-500">
            Add addresses and check coverage for each site
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowBulkInput(!showBulkInput)}
          >
            {showBulkInput ? 'Hide Bulk' : 'Bulk Add'}
          </Button>
          <Button onClick={handleAddSite}>
            <PiPlusBold className="h-4 w-4 mr-1" />
            Add Site
          </Button>
        </div>
      </div>

      {/* Bulk Input */}
      {showBulkInput && (
        <div className="bg-gray-50 rounded-lg p-4 border space-y-3">
          <Label>Bulk Add (one address or GPS coordinate per line)</Label>
          <Textarea
            placeholder={`123 Main Street, Johannesburg
456 Oak Avenue, Cape Town
-26.2041, 28.0473`}
            value={bulkInput}
            onChange={(e) => setBulkInput(e.target.value)}
            rows={4}
          />
          <Button onClick={handleBulkAdd} disabled={!bulkInput.trim()}>
            Add All Sites
          </Button>
        </div>
      )}

      {/* Sites List */}
      <div className="space-y-4">
        {data.sites.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed">
            <PiMapPinBold className="h-12 w-12 mx-auto text-gray-300" />
            <p className="mt-4 text-gray-500">No sites added yet</p>
            <Button onClick={handleAddSite} className="mt-4">
              <PiPlusBold className="h-4 w-4 mr-1" />
              Add Your First Site
            </Button>
          </div>
        ) : (
          data.sites.map((site) => (
            <div
              key={site.index}
              className="bg-white rounded-lg border p-4 space-y-4"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 bg-circleTel-orange text-white text-sm font-medium rounded-full">
                    {site.index + 1}
                  </span>
                  <span className="font-medium text-gray-900">Site {site.index + 1}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveSite(site.index)}
                  className="text-red-500 hover:text-red-700"
                >
                  <PiTrashBold className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Address */}
                <div className="space-y-2">
                  <Label>Address</Label>
                  <Input
                    placeholder="Enter street address"
                    value={site.address}
                    onChange={(e) => handleAddressChange(site.index, e.target.value)}
                  />
                </div>

                {/* Coordinates */}
                <div className="space-y-2">
                  <Label>GPS Coordinates (optional)</Label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      step="any"
                      placeholder="Latitude"
                      value={site.latitude || ''}
                      onChange={(e) =>
                        handleCoordsChange(
                          site.index,
                          parseFloat(e.target.value),
                          site.longitude || 0
                        )
                      }
                    />
                    <Input
                      type="number"
                      step="any"
                      placeholder="Longitude"
                      value={site.longitude || ''}
                      onChange={(e) =>
                        handleCoordsChange(
                          site.index,
                          site.latitude || 0,
                          parseFloat(e.target.value)
                        )
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Coverage Status */}
              <div className="flex items-center justify-between pt-2 border-t">
                {site.coverage_checked ? (
                  <div className="flex items-center gap-2">
                    {site.coverage_result?.is_feasible ? (
                      <>
                        <PiCheckCircleBold className="h-5 w-5 text-green-500" />
                        <span className="text-green-700 font-medium">Coverage Available</span>
                        {site.coverage_result.recommended_technology && (
                          <span className="text-sm text-gray-500 ml-2">
                            ({site.coverage_result.recommended_technology})
                          </span>
                        )}
                      </>
                    ) : (
                      <>
                        <PiXCircleBold className="h-5 w-5 text-red-500" />
                        <span className="text-red-700 font-medium">Limited Coverage</span>
                      </>
                    )}
                  </div>
                ) : (
                  <span className="text-gray-400 text-sm">Coverage not checked</span>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCheckCoverage(site.index)}
                  disabled={checkingIndex === site.index || (!site.address && !site.latitude)}
                >
                  {checkingIndex === site.index ? (
                    <>
                      <PiSpinnerBold className="h-4 w-4 mr-1 animate-spin" />
                      Checking...
                    </>
                  ) : site.coverage_checked ? (
                    <>
                      <PiArrowCounterClockwiseBold className="h-4 w-4 mr-1" />
                      Recheck
                    </>
                  ) : (
                    <>
                      <PiWifiBold className="h-4 w-4 mr-1" />
                      Check Coverage
                    </>
                  )}
                </Button>
              </div>

              {/* Coverage Technologies */}
              {site.coverage_result?.technologies && site.coverage_result.technologies.length > 0 && (
                <div className="bg-gray-50 rounded p-3">
                  <p className="text-sm font-medium text-gray-700 mb-2">Available Technologies:</p>
                  <div className="flex flex-wrap gap-2">
                    {site.coverage_result.technologies.map((tech, i) => (
                      <span
                        key={i}
                        className={`px-2 py-1 text-xs rounded-full ${
                          tech.available
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {tech.provider} - {tech.type}
                        {tech.speed_range && ` (${tech.speed_range.min}-${tech.speed_range.max}Mbps)`}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Check All Button */}
      {data.sites.length > 0 && !data.all_sites_checked && (
        <div className="flex justify-center">
          <Button
            onClick={handleCheckAll}
            disabled={checkingIndex !== null}
            className="bg-circleTel-orange hover:bg-orange-600"
          >
            {checkingIndex !== null ? (
              <>
                <PiSpinnerBold className="h-4 w-4 mr-2 animate-spin" />
                Checking Coverage...
              </>
            ) : (
              <>
                <PiWifiBold className="h-4 w-4 mr-2" />
                Check All Sites
              </>
            )}
          </Button>
        </div>
      )}

      {/* All Checked Summary */}
      {data.all_sites_checked && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
          <PiCheckCircleBold className="h-6 w-6 text-green-500 mx-auto mb-2" />
          <p className="text-green-700 font-medium">
            All {data.sites.length} sites have been checked
          </p>
          <p className="text-sm text-green-600">
            {data.sites.filter((s) => s.coverage_result?.is_feasible).length} with coverage,{' '}
            {data.sites.filter((s) => !s.coverage_result?.is_feasible).length} with limited coverage
          </p>
        </div>
      )}
    </div>
  );
}
