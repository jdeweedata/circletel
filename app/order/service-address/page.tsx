'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useOrderContext } from '@/components/order/context/OrderContext';
import { TopProgressBar } from '@/components/order/TopProgressBar';
import { PackageSummary } from '@/components/order/PackageSummary';
import { toast } from 'sonner';
import { MapPin, Building2, Home, ArrowRight, ArrowLeft } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type PropertyType = 
  | 'freestanding_home'
  | 'gated_estate'
  | 'apartment_complex'
  | 'townhouse'
  | 'office_business_park'
  | 'industrial_warehouse'
  | 'educational_facility'
  | 'healthcare_facility'
  | 'freestanding_building'
  | 'soho';

interface PropertyTypeOption {
  value: PropertyType;
  label: string;
  icon: typeof Home;
}

const residentialOptions: PropertyTypeOption[] = [
  { value: 'freestanding_home', label: 'Freestanding Home (Single Dwelling Unit – SDU)', icon: Home },
  { value: 'gated_estate', label: 'Gated Estate or Security Estate', icon: Building2 },
  { value: 'apartment_complex', label: 'Apartment / Flat Complex', icon: Building2 },
  { value: 'townhouse', label: 'Townhouse', icon: Home },
];

const businessOptions: PropertyTypeOption[] = [
  { value: 'office_business_park', label: 'Office or Business Park', icon: Building2 },
  { value: 'industrial_warehouse', label: 'Industrial or Warehouse', icon: Building2 },
  { value: 'educational_facility', label: 'Educational Facility', icon: Building2 },
  { value: 'healthcare_facility', label: 'Healthcare Facility', icon: Building2 },
  { value: 'freestanding_building', label: 'Free Standing Building', icon: Building2 },
  { value: 'soho', label: 'Small Office Home Office (SOHO)', icon: Home },
];

export default function ServiceAddressPage() {
  const router = useRouter();
  const { state, actions } = useOrderContext();
  
  const [serviceType, setServiceType] = useState<'residential' | 'business'>(
    state.orderData.account?.accountType === 'business' ? 'business' : 'residential'
  );
  const [propertyType, setPropertyType] = useState<PropertyType | ''>('');
  const [address, setAddress] = useState({
    street: state.orderData.coverage?.address || '',
    suburb: '',
    city: '',
    province: '',
    postalCode: '',
  });

  // Set current stage to 2 when this page loads
  useEffect(() => {
    if (state.currentStage !== 2) {
      actions.setCurrentStage(2);
    }
  }, [state.currentStage, actions]);

  // Pre-fill property type if already saved
  useEffect(() => {
    if (state.orderData.account?.installationLocationType) {
      setPropertyType(state.orderData.account.installationLocationType as PropertyType);
    }
  }, [state.orderData.account?.installationLocationType]);

  const handleContinue = () => {
    // Validation
    if (!address.street.trim()) {
      toast.error('Please enter your street address');
      return;
    }
    if (!propertyType) {
      toast.error('Please select your property type');
      return;
    }

    // Save to order context
    actions.updateOrderData({
      account: {
        ...state.orderData.account,
        installationAddress: {
          street: address.street,
          suburb: address.suburb,
          city: address.city,
          province: address.province,
          postalCode: address.postalCode,
          country: 'South Africa',
        },
        installationLocationType: propertyType,
        accountType: serviceType === 'residential' ? 'personal' : 'business',
      },
    });

    // Mark step as complete
    actions.markStepComplete(2);

    toast.success('Service address confirmed!');
    router.push('/order/payment');
  };

  const handleBack = () => {
    router.push('/order/account');
  };

  const currentOptions = serviceType === 'residential' ? residentialOptions : businessOptions;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Progress Bar */}
      <TopProgressBar currentStep={2} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        {/* Header */}
        <div className="text-center mb-8 lg:mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-circleTel-orange/10 rounded-full mb-4">
            <MapPin className="w-8 h-8 text-circleTel-orange" />
          </div>
          <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-3">
            Confirm Service Address
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Please confirm your installation address and property type
          </p>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto">
          {/* Package Summary */}
          {state.orderData.package?.selectedPackage && (
            <div className="mb-6">
              <PackageSummary package={state.orderData.package.selectedPackage} compact />
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 lg:p-8">
              {/* Service Type Selection */}
              <div className="mb-8">
                <Label className="text-base font-semibold text-gray-900 mb-4 block">
                  Service Type
                </Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => {
                      setServiceType('residential');
                      setPropertyType('');
                    }}
                    className={`p-6 rounded-lg border-2 transition-all duration-200 ${
                      serviceType === 'residential'
                        ? 'border-circleTel-orange bg-circleTel-orange/5'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Home className={`w-8 h-8 mb-3 ${
                      serviceType === 'residential' ? 'text-circleTel-orange' : 'text-gray-400'
                    }`} />
                    <h3 className="font-semibold text-gray-900 mb-1">Residential</h3>
                    <p className="text-sm text-gray-600">For homes and personal use</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setServiceType('business');
                      setPropertyType('');
                    }}
                    className={`p-6 rounded-lg border-2 transition-all duration-200 ${
                      serviceType === 'business'
                        ? 'border-circleTel-orange bg-circleTel-orange/5'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Building2 className={`w-8 h-8 mb-3 ${
                      serviceType === 'business' ? 'text-circleTel-orange' : 'text-gray-400'
                    }`} />
                    <h3 className="font-semibold text-gray-900 mb-1">Business</h3>
                    <p className="text-sm text-gray-600">For commercial properties</p>
                  </button>
                </div>
              </div>

              {/* Address Fields */}
              <div className="space-y-6 mb-8">
                <div>
                  <Label htmlFor="street" className="text-sm font-medium text-gray-700 mb-2 block">
                    Street Address *
                  </Label>
                  <Input
                    id="street"
                    type="text"
                    value={address.street}
                    onChange={(e) => setAddress({ ...address, street: e.target.value })}
                    placeholder="e.g., 123 Main Street"
                    className="w-full"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="suburb" className="text-sm font-medium text-gray-700 mb-2 block">
                      Suburb
                    </Label>
                    <Input
                      id="suburb"
                      type="text"
                      value={address.suburb}
                      onChange={(e) => setAddress({ ...address, suburb: e.target.value })}
                      placeholder="e.g., Sandton"
                      className="w-full"
                    />
                  </div>

                  <div>
                    <Label htmlFor="city" className="text-sm font-medium text-gray-700 mb-2 block">
                      City
                    </Label>
                    <Input
                      id="city"
                      type="text"
                      value={address.city}
                      onChange={(e) => setAddress({ ...address, city: e.target.value })}
                      placeholder="e.g., Johannesburg"
                      className="w-full"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="province" className="text-sm font-medium text-gray-700 mb-2 block">
                      Province
                    </Label>
                    <Input
                      id="province"
                      type="text"
                      value={address.province}
                      onChange={(e) => setAddress({ ...address, province: e.target.value })}
                      placeholder="e.g., Gauteng"
                      className="w-full"
                    />
                  </div>

                  <div>
                    <Label htmlFor="postalCode" className="text-sm font-medium text-gray-700 mb-2 block">
                      Postal Code
                    </Label>
                    <Input
                      id="postalCode"
                      type="text"
                      value={address.postalCode}
                      onChange={(e) => setAddress({ ...address, postalCode: e.target.value })}
                      placeholder="e.g., 2196"
                      className="w-full"
                    />
                  </div>
                </div>
              </div>

              {/* Property Type Selection */}
              <div className="mb-8">
                <Label htmlFor="propertyType" className="text-base font-semibold text-gray-900 mb-4 block">
                  Property Type *
                </Label>
                <Select value={propertyType} onValueChange={(value) => setPropertyType(value as PropertyType)}>
                  <SelectTrigger className="w-full h-12">
                    <SelectValue placeholder="Select your property type" />
                  </SelectTrigger>
                  <SelectContent>
                    {currentOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center gap-2">
                          <option.icon className="w-4 h-4 text-gray-500" />
                          <span>{option.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t">
                <button
                  type="button"
                  onClick={handleBack}
                  className="flex items-center justify-center gap-2 px-6 py-3 border-2 border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                  Back
                </button>

                <button
                  type="button"
                  onClick={handleContinue}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-circleTel-orange hover:bg-circleTel-orange/90 text-white font-medium rounded-lg transition-colors"
                >
                  Continue to Payment
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Help Text */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Need help? Contact us at{' '}
              <a href="tel:0877772473" className="text-circleTel-orange hover:underline font-medium">
                087 777 2473
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
