'use client';
import { PiGearBold, PiMinusBold, PiPackageBold, PiPlusBold } from 'react-icons/pi';

/**
 * Step 4: Configure
 *
 * Configure packages with add-ons and quantities per site
 */

import { useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { CPQStepProps } from '../CPQWizard';
import type { AddOn, ConfigurationData } from '@/lib/cpq/types';

// Available add-ons
const AVAILABLE_ADDONS: Omit<AddOn, 'quantity'>[] = [
  { add_on_id: 'static-ip', name: 'Static IP Address', price: 150 },
  { add_on_id: 'voice-bundle', name: 'Voice Bundle (10 ext)', price: 500 },
  { add_on_id: 'wifi-mesh', name: 'WiFi Mesh System', price: 350 },
  { add_on_id: 'router-premium', name: 'Premium Router', price: 200 },
  { add_on_id: 'support-24x7', name: '24/7 Support', price: 400 },
];

// Contract term options
const CONTRACT_TERMS = [
  { value: 12, label: '12 months' },
  { value: 24, label: '24 months', discount: 5 },
  { value: 36, label: '36 months', discount: 10 },
];

export function ConfigureStep({
  session,
  stepData,
  onUpdateStepData,
  isSaving,
}: CPQStepProps) {
  const data = stepData.configuration || { per_site_config: [] };
  const selectedPackages = stepData.package_selection?.selected_packages || [];
  const locations = stepData.location_coverage?.sites || [];

  // Get config for a site
  const getSiteConfig = (siteIndex: number) => {
    return (
      data.per_site_config.find((c) => c.site_index === siteIndex) || {
        site_index: siteIndex,
        add_ons: [],
        custom_options: {},
      }
    );
  };

  // Update config for a site
  const updateSiteConfig = useCallback(
    (siteIndex: number, updates: Partial<ConfigurationData['per_site_config'][0]>) => {
      const existing = data.per_site_config.find((c) => c.site_index === siteIndex);
      let updatedConfigs;

      if (existing) {
        updatedConfigs = data.per_site_config.map((c) =>
          c.site_index === siteIndex ? { ...c, ...updates } : c
        );
      } else {
        updatedConfigs = [
          ...data.per_site_config,
          { site_index: siteIndex, add_ons: [], custom_options: {}, ...updates },
        ];
      }

      onUpdateStepData('configuration', { per_site_config: updatedConfigs });
    },
    [data.per_site_config, onUpdateStepData]
  );

  // Toggle add-on for a site
  const toggleAddOn = useCallback(
    (siteIndex: number, addOn: Omit<AddOn, 'quantity'>) => {
      const config = getSiteConfig(siteIndex);
      const existingAddOn = config.add_ons.find((a) => a.add_on_id === addOn.add_on_id);

      let updatedAddOns: AddOn[];
      if (existingAddOn) {
        updatedAddOns = config.add_ons.filter((a) => a.add_on_id !== addOn.add_on_id);
      } else {
        updatedAddOns = [...config.add_ons, { ...addOn, quantity: 1 }];
      }

      updateSiteConfig(siteIndex, { add_ons: updatedAddOns });
    },
    [getSiteConfig, updateSiteConfig]
  );

  // Update add-on quantity
  const updateAddOnQuantity = useCallback(
    (siteIndex: number, addOnId: string, quantity: number) => {
      const config = getSiteConfig(siteIndex);
      const updatedAddOns = config.add_ons.map((a) =>
        a.add_on_id === addOnId ? { ...a, quantity: Math.max(1, quantity) } : a
      );

      updateSiteConfig(siteIndex, { add_ons: updatedAddOns });
    },
    [getSiteConfig, updateSiteConfig]
  );

  // Update package quantity
  const updatePackageQuantity = useCallback(
    (packageId: string, siteIndex: number, quantity: number) => {
      const updatedPackages = selectedPackages.map((sp) =>
        sp.package_id === packageId && sp.site_index === siteIndex
          ? { ...sp, quantity: Math.max(1, quantity) }
          : sp
      );

      onUpdateStepData('package_selection', { selected_packages: updatedPackages });
    },
    [selectedPackages, onUpdateStepData]
  );

  // Update contract term
  const updateContractTerm = useCallback(
    (packageId: string, siteIndex: number, term: number) => {
      const updatedPackages = selectedPackages.map((sp) =>
        sp.package_id === packageId && sp.site_index === siteIndex
          ? { ...sp, contract_term_months: term }
          : sp
      );

      onUpdateStepData('package_selection', { selected_packages: updatedPackages });
    },
    [selectedPackages, onUpdateStepData]
  );

  // Group packages by site
  const packagesBySite = locations.map((loc) => ({
    site: loc,
    packages: selectedPackages.filter((sp) => sp.site_index === loc.index),
  }));

  if (selectedPackages.length === 0) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <PiPackageBold className="h-12 w-12 mx-auto text-gray-300" />
        <p className="mt-4 text-gray-500">No packages selected</p>
        <p className="text-sm text-gray-400">Please go back and select packages first</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Configure Packages</h2>
        <p className="text-sm text-gray-500">
          Adjust quantities, contract terms, and add-ons for each site
        </p>
      </div>

      {packagesBySite.map(
        ({ site, packages: sitePackages }) =>
          sitePackages.length > 0 && (
            <div key={site.index} className="bg-white rounded-lg border p-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="flex items-center justify-center w-6 h-6 bg-circleTel-orange text-white text-sm font-medium rounded-full">
                  {site.index + 1}
                </span>
                <span className="font-semibold text-gray-900">
                  Site {site.index + 1}: {site.address || 'No address'}
                </span>
              </div>

              {/* Packages for this site */}
              {sitePackages.map((pkg) => (
                <div
                  key={`${pkg.package_id}-${site.index}`}
                  className="border-t pt-4 mt-4 first:border-t-0 first:pt-0 first:mt-0"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">{pkg.package_name}</h4>
                      <p className="text-sm text-gray-500">
                        R{pkg.base_price.toLocaleString()}/month per unit
                      </p>
                    </div>

                    {/* Quantity & Contract */}
                    <div className="flex items-center gap-4">
                      {/* Quantity */}
                      <div className="flex items-center gap-2">
                        <Label className="text-xs text-gray-500">Qty:</Label>
                        <div className="flex items-center border rounded">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              updatePackageQuantity(pkg.package_id, site.index, pkg.quantity - 1)
                            }
                            disabled={pkg.quantity <= 1}
                          >
                            <PiMinusBold className="h-3 w-3" />
                          </Button>
                          <span className="w-8 text-center text-sm">{pkg.quantity}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              updatePackageQuantity(pkg.package_id, site.index, pkg.quantity + 1)
                            }
                          >
                            <PiPlusBold className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>

                      {/* Contract Term */}
                      <div className="flex items-center gap-2">
                        <Label className="text-xs text-gray-500">Term:</Label>
                        <Select
                          value={pkg.contract_term_months.toString()}
                          onValueChange={(v) =>
                            updateContractTerm(pkg.package_id, site.index, parseInt(v))
                          }
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {CONTRACT_TERMS.map((term) => (
                              <SelectItem key={term.value} value={term.value.toString()}>
                                {term.label}
                                {term.discount && ` (-${term.discount}%)`}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Add-ons Section */}
              <div className="border-t pt-4 mt-4">
                <h5 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
                  <PiGearBold className="h-4 w-4" />
                  Add-ons for this site
                </h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {AVAILABLE_ADDONS.map((addOn) => {
                    const config = getSiteConfig(site.index);
                    const selected = config.add_ons.find((a) => a.add_on_id === addOn.add_on_id);

                    return (
                      <div
                        key={addOn.add_on_id}
                        className={`flex items-center justify-between p-3 rounded border ${
                          selected ? 'border-circleTel-orange bg-orange-50' : 'border-gray-200'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Checkbox
                            checked={!!selected}
                            onCheckedChange={() => toggleAddOn(site.index, addOn)}
                          />
                          <div>
                            <p className="text-sm font-medium">{addOn.name}</p>
                            <p className="text-xs text-gray-500">R{addOn.price}/month</p>
                          </div>
                        </div>

                        {selected && (
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                updateAddOnQuantity(site.index, addOn.add_on_id, selected.quantity - 1)
                              }
                              disabled={selected.quantity <= 1}
                            >
                              <PiMinusBold className="h-3 w-3" />
                            </Button>
                            <span className="w-6 text-center text-sm">{selected.quantity}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                updateAddOnQuantity(site.index, addOn.add_on_id, selected.quantity + 1)
                              }
                            >
                              <PiPlusBold className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )
      )}
    </div>
  );
}
