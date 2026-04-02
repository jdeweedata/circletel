'use client';
import { PiArrowRightBold, PiBuildingsBold, PiHouseBold, PiMapPinBold, PiPackageBold } from 'react-icons/pi';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useOrderContext } from '@/components/order/context/OrderContext';
import { AddressAutocomplete } from '@/components/coverage/AddressAutocomplete';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { getBundleProduct, isValidBundleSlug } from '@/lib/products/bundles';

type CoverageType = 'residential' | 'business';

interface AddressData {
  address: string;
  province?: string;
  suburb?: string;
  street?: string;
  streetNumber?: string;
  town?: string;
  buildingComplex?: string;
  postalCode?: string;
  latitude?: number;
  longitude?: number;
}

export default function CoveragePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { state, actions } = useOrderContext();

  const [address, setAddress] = useState('');
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [addressComponents, setAddressComponents] = useState<Partial<AddressData>>({});
  const [coverageType, setCoverageType] = useState<CoverageType>('residential');
  const [isChecking, setIsChecking] = useState(false);
  const [propertyType, setPropertyType] = useState<string>('');

  const RESIDENTIAL_PROPERTY_TYPES = [
    { value: 'freestanding_home', label: 'Freestanding Home (SDU)' },
    { value: 'gated_estate', label: 'Gated / Security Estate' },
    { value: 'apartment', label: 'Apartment / Flat Complex' },
    { value: 'townhouse', label: 'Townhouse' },
  ];

  const BUSINESS_PROPERTY_TYPES = [
    { value: 'office_park', label: 'Office or Business Park' },
    { value: 'industrial', label: 'Industrial or Warehouse' },
    { value: 'educational', label: 'Educational Facility' },
    { value: 'healthcare', label: 'Healthcare Facility' },
    { value: 'freestanding_commercial', label: 'Free Standing Building' },
    { value: 'soho', label: 'SOHO (Small Office Home Office)' },
  ];

  const propertyTypeOptions = coverageType === 'business'
    ? BUSINESS_PROPERTY_TYPES
    : RESIDENTIAL_PROPERTY_TYPES;

  // Check for preselected bundle product from query params
  const productSlug = searchParams.get('product');
  const bundleProduct = productSlug && isValidBundleSlug(productSlug)
    ? getBundleProduct(productSlug)
    : null;

  // Set current stage to 1 when this page loads
  useEffect(() => {
    if (state.currentStage !== 1) {
      actions.setCurrentStage(1);
    }
  }, [state.currentStage, actions]);

  // Auto-select coverage type based on bundle product
  useEffect(() => {
    if (bundleProduct) {
      setCoverageType(bundleProduct.coverageType);
      // Store selected bundle in context
      actions.updateOrderData({
        coverage: {
          ...state.orderData.coverage,
          selectedBundle: {
            slug: bundleProduct.slug,
            name: bundleProduct.name,
            category: bundleProduct.category,
          },
        },
      });
    }
  }, [bundleProduct]);

  // Reset propertyType when coverageType changes
  useEffect(() => {
    setPropertyType('');
  }, [coverageType]);

  const handleLocationSelect = (data: AddressData) => {
    setAddress(data.address);
    if (data.latitude && data.longitude) {
      setCoordinates({ lat: data.latitude, lng: data.longitude });
    }
    setAddressComponents({
      province: data.province,
      suburb: data.suburb,
      street: data.street,
      streetNumber: data.streetNumber,
      town: data.town,
      postalCode: data.postalCode
    });
  };

  const handleCheckCoverage = async () => {
    if (!address.trim()) {
      toast.error('Please enter your address');
      return;
    }
    if (!propertyType) {
      toast.error('Please select your property type');
      return;
    }

    setIsChecking(true);

    try {
      // Store address in sessionStorage (clears when browser closes)
      sessionStorage.setItem('circletel_coverage_address', JSON.stringify({
        address: address.trim(),
        coordinates: coordinates,
        type: coverageType,
        propertyType: propertyType,
        addressComponents: addressComponents || {},
        timestamp: new Date().toISOString()
      }));

      // Create a coverage lead
      const response = await fetch('/api/coverage/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: address.trim(),
          coordinates,
          customer_type: coverageType === 'business' ? 'smme' : 'consumer',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create coverage lead');
      }

      const data = await response.json();

      // Update OrderContext with coverage data
      actions.updateOrderData({
        coverage: {
          leadId: data.leadId,
          address: address.trim(),
          coordinates: coordinates || undefined,
          coverageType: coverageType,
          propertyType: propertyType,
        }
      });

      // Mark coverage step as complete
      actions.markStepComplete(1);

      // Redirect based on whether a bundle product was preselected
      if (bundleProduct) {
        // Go to bundle tier selection
        router.push(`/order/bundle/${bundleProduct.slug}`);
      } else {
        // Go to generic packages page
        router.push(`/order/packages?leadId=${data.leadId}&type=${coverageType}`);
      }
    } catch (error) {
      console.error('Coverage check failed:', error);
      toast.error('Coverage check failed. Please try again.');
      setIsChecking(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 bg-circleTel-orange/10 rounded-xl flex items-center justify-center">
              <PiMapPinBold className="h-6 w-6 text-circleTel-orange" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Check Coverage</h1>
              <p className="text-gray-600">Find available services at your location</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bundle Product Banner */}
      {bundleProduct && (
        <div className="bg-gradient-to-r from-circleTel-orange/10 to-orange-50 border-b border-orange-100">
          <div className="max-w-4xl mx-auto px-4 py-3">
            <div className="flex items-center gap-3">
              <PiPackageBold className="h-5 w-5 text-circleTel-orange" />
              <div>
                <span className="font-medium text-gray-900">
                  Ordering: {bundleProduct.name}
                </span>
                <span className="text-gray-600 ml-2">
                  — {bundleProduct.tagline}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="flex items-center gap-2 text-circleTel-orange">
            <div className="h-8 w-8 rounded-full bg-circleTel-orange text-white flex items-center justify-center font-semibold">1</div>
            <span className="font-medium">Coverage</span>
          </div>
          <div className="w-12 h-0.5 bg-gray-200" />
          <div className="flex items-center gap-2 text-gray-400">
            <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center font-semibold">2</div>
            <span>Package</span>
          </div>
          <div className="w-12 h-0.5 bg-gray-200" />
          <div className="flex items-center gap-2 text-gray-400">
            <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center font-semibold">3</div>
            <span>Details</span>
          </div>
          <div className="w-12 h-0.5 bg-gray-200" />
          <div className="flex items-center gap-2 text-gray-400">
            <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center font-semibold">4</div>
            <span>Payment</span>
          </div>
        </div>

        {/* Coverage Type Selection */}
        <div className="bg-white rounded-2xl shadow-sm border p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">What type of connection do you need?</h2>
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setCoverageType('residential')}
              className={cn(
                'flex flex-col items-center gap-3 p-6 rounded-xl border-2 transition-all',
                coverageType === 'residential'
                  ? 'border-circleTel-orange bg-orange-50'
                  : 'border-gray-200 hover:border-gray-300'
              )}
            >
              <PiHouseBold className={cn(
                'h-8 w-8',
                coverageType === 'residential' ? 'text-circleTel-orange' : 'text-gray-400'
              )} />
              <div className="text-center">
                <div className={cn(
                  'font-semibold',
                  coverageType === 'residential' ? 'text-circleTel-orange' : 'text-gray-700'
                )}>
                  Residential
                </div>
                <div className="text-sm text-gray-500">Home internet</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setCoverageType('business')}
              className={cn(
                'flex flex-col items-center gap-3 p-6 rounded-xl border-2 transition-all',
                coverageType === 'business'
                  ? 'border-circleTel-orange bg-orange-50'
                  : 'border-gray-200 hover:border-gray-300'
              )}
            >
              <PiBuildingsBold className={cn(
                'h-8 w-8',
                coverageType === 'business' ? 'text-circleTel-orange' : 'text-gray-400'
              )} />
              <div className="text-center">
                <div className={cn(
                  'font-semibold',
                  coverageType === 'business' ? 'text-circleTel-orange' : 'text-gray-700'
                )}>
                  Business
                </div>
                <div className="text-sm text-gray-500">Office connectivity</div>
              </div>
            </button>
          </div>
        </div>

        {/* Address Input */}
        <div className="bg-white rounded-2xl shadow-sm border p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Enter your address</h2>
          <AddressAutocomplete
            value={address}
            onLocationSelect={handleLocationSelect}
            placeholder="Start typing your address..."
            showLocationButton={true}
            showMapButton={true}
            className="[&_input]:h-14 [&_input]:text-lg [&_input]:rounded-xl [&_input]:border-gray-300"
          />

          {address && coordinates && (
            <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center gap-2 text-green-700">
                <PiMapPinBold className="h-4 w-4" />
                <span className="text-sm font-medium">Address confirmed</span>
              </div>
              <p className="text-sm text-green-600 mt-1">{address}</p>
            </div>
          )}

          {coordinates && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Property Type
              </label>
              <select
                value={propertyType}
                onChange={(e) => setPropertyType(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="">Select your property type...</option>
                {propertyTypeOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Check Coverage Button */}
        <Button
          onClick={handleCheckCoverage}
          disabled={!address.trim() || isChecking}
          className="w-full h-14 text-lg font-semibold bg-circleTel-orange hover:bg-orange-600 rounded-xl"
        >
          {isChecking ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
              Checking Coverage...
            </div>
          ) : (
            <div className="flex items-center gap-2">
              Check Coverage
              <PiArrowRightBold className="h-5 w-5" />
            </div>
          )}
        </Button>

        {/* Info Text */}
        <p className="text-center text-sm text-gray-500 mt-4">
          We'll show you all available packages for your location
        </p>
      </div>
    </div>
  );
}
