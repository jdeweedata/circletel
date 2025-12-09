'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useOrderContext } from '@/components/order/context/OrderContext';
import { useCustomerAuth } from '@/components/providers/CustomerAuthProvider';
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
  const { isAuthenticated, customer, user, session, loading: authLoading } = useCustomerAuth();
  
  const [serviceType, setServiceType] = useState<'residential' | 'business'>(
    state.orderData.account?.accountType === 'business' ? 'business' : 'residential'
  );
  const [propertyType, setPropertyType] = useState<PropertyType | ''>('');
  const [installationAddress, setInstallationAddress] = useState(
    state.orderData.coverage?.address || ''
  );

  const streetInputRef = useRef<HTMLInputElement>(null);

  // Protect route - require package selection first
  useEffect(() => {
    const hasPackageData = state.orderData.package?.selectedPackage;
    const hasCoverageData = state.orderData.coverage?.address || 
                            state.orderData.coverage?.coordinates;
    
    // Check sessionStorage as backup
    const savedCoverage = typeof window !== 'undefined'
      ? sessionStorage.getItem('circletel_coverage_address')
      : null;
    
    if (!hasPackageData && !hasCoverageData && !savedCoverage) {
      // No valid order flow - redirect to home
      router.replace('/');
    }
  }, [state.orderData.package, state.orderData.coverage, router]);

  // Load persisted address from sessionStorage as backup
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedData = sessionStorage.getItem('circletel_coverage_address');
      if (savedData && !installationAddress) {
        try {
          const parsed = JSON.parse(savedData);
          // Only load if it's less than 24 hours old
          const timestamp = new Date(parsed.timestamp);
          const now = new Date();
          const hoursDiff = (now.getTime() - timestamp.getTime()) / (1000 * 60 * 60);

          if (hoursDiff < 24 && parsed.address) {
            setInstallationAddress(parsed.address);

            // Set service type if available
            if (parsed.type) {
              setServiceType(parsed.type);
            }
          }
        } catch (error) {
          console.error('Failed to load saved address:', error);
        }
      }
    }
  }, [installationAddress]);

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

  // Note: Google Places Autocomplete removed - address is read-only from coverage check

  const handleContinue = async () => {
    // Validation
    if (!installationAddress.trim()) {
      toast.error('Installation address is required');
      return;
    }
    if (!propertyType) {
      toast.error('Please select your property type');
      return;
    }

    // Update sessionStorage
    if (typeof window !== 'undefined') {
      const existingData = sessionStorage.getItem('circletel_coverage_address');
      let savedData = { address: installationAddress, type: serviceType };

      if (existingData) {
        try {
          const parsed = JSON.parse(existingData);
          savedData = { ...parsed, ...savedData };
        } catch (error) {
          console.error('Failed to parse existing address data:', error);
        }
      }

      sessionStorage.setItem('circletel_coverage_address', JSON.stringify({
        ...savedData,
        address: installationAddress,
        type: serviceType,
        propertyType: propertyType,
        timestamp: new Date().toISOString()
      }));
    }

    // Save to order context
    actions.updateOrderData({
      account: {
        ...state.orderData.account,
        installationAddress: {
          street: installationAddress,
          country: 'South Africa',
        },
        installationLocationType: propertyType,
        accountType: serviceType === 'residential' ? 'personal' : 'business',
      },
    });

    // Mark step as complete
    actions.markStepComplete(2);

    // Create pending order (without payment)
    try {
      toast.loading('Creating your order...');

      const { coverage, package: packageData, account } = state.orderData;
      const selectedPackage = packageData?.selectedPackage;
      const pricing = packageData?.pricing;

          // Wait for auth to finish loading if still in progress
      if (authLoading) {
        console.log('[ServiceAddress] Auth still loading, waiting...');
        toast.dismiss();
        toast.loading('Verifying your session...');
        // Wait up to 5 seconds for auth to complete, checking every 250ms
        let attempts = 0;
        const maxAttempts = 20; // 20 * 250ms = 5 seconds
        while (authLoading && attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 250));
          attempts++;
        }
        toast.dismiss();
      }

      // Get customer details - prioritize session email for OAuth users (most reliable)
      // Then fall back to customer record, then user object, then order context
      const customerEmail = session?.user?.email || user?.email || customer?.email || account?.email || '';
      const customerPhone = customer?.phone || user?.user_metadata?.phone || account?.phone || '';
      const customerFirstName = customer?.first_name || user?.user_metadata?.first_name || user?.user_metadata?.full_name?.split(' ')[0] || account?.firstName || '';
      const customerLastName = customer?.last_name || user?.user_metadata?.last_name || user?.user_metadata?.full_name?.split(' ').slice(1).join(' ') || account?.lastName || '';

      console.log('[ServiceAddress] Creating order with:', {
        email: customerEmail,
        hasPackage: !!selectedPackage,
        hasAddress: !!installationAddress,
        isAuthenticated,
        authLoading,
        hasUser: !!user,
        userEmail: user?.email,
        sessionEmail: session?.user?.email,
        hasCustomer: !!customer,
        customerEmail: customer?.email,
        accountEmail: account?.email
      });

      // Only redirect to login if truly not authenticated AND no email available
      if (!customerEmail) {
        if (!isAuthenticated && !session?.user) {
          toast.dismiss();
          toast.error('Please log in to continue with your order.');
          router.push('/auth/login?redirect=/order/service-address');
          return;
        } else {
          // Authenticated but no email - this shouldn't happen, log and show error
          console.error('[ServiceAddress] Authenticated user has no email:', {
            isAuthenticated,
            hasSession: !!session,
            sessionUser: session?.user?.email,
            user: user?.email
          });
          toast.dismiss();
          toast.error('Unable to retrieve your email. Please try logging in again.');
          router.push('/auth/login?redirect=/order/service-address');
          return;
        }
      }

      const orderResponse = await fetch('/api/orders/create-pending', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {})
        },
        body: JSON.stringify({
          // Package details
          service_package_id: selectedPackage?.id || null,
          package_name: selectedPackage?.name || 'Selected Package',
          package_speed: selectedPackage?.speed || '',
          package_price: pricing?.monthly || selectedPackage?.monthlyPrice || 0,

          // Installation details
          installation_address: installationAddress,
          coordinates: coverage?.coordinates || null,
          installation_location_type: propertyType,
          installation_fee: pricing?.onceOff || selectedPackage?.onceOffPrice || 0,

          // Customer details - use auth provider data if available
          email: customerEmail,
          phone: customerPhone,
          first_name: customerFirstName,
          last_name: customerLastName,
          account_type: serviceType === 'residential' ? 'personal' : 'business',
        }),
      });

      const result = await orderResponse.json();

      if (!orderResponse.ok || !result.success) {
        throw new Error(result.error || 'Failed to create order');
      }

      toast.dismiss();

      // Handle existing order case - user already has a pending order for this address
      if (result.existing_order) {
        toast.info(`You already have a pending order (${result.order.order_number}). Redirecting to your dashboard...`);

        // Store for dashboard reference
        if (typeof window !== 'undefined') {
          localStorage.setItem('circletel_pending_order_id', result.order.id);
        }

        router.push('/dashboard');
        return;
      }

      // New order created successfully
      toast.success('Order created successfully! Redirecting to your dashboard...');

      // Redirect to dashboard (will show login if not authenticated)
      // Store order ID for later reference
      if (typeof window !== 'undefined') {
        localStorage.setItem('circletel_pending_order_id', result.order.id);
      }

      router.push('/dashboard');
    } catch (error) {
      toast.dismiss();
      console.error('Order creation error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create order. Please try again.');
    }
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

              {/* Address Fields - Read Only for Confirmation */}
              <div className="space-y-6 mb-8">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-blue-900 mb-1">
                        Service Address (from Coverage Check)
                      </p>
                      <p className="text-xs text-blue-700">
                        This address cannot be changed. If you need to check a different address, please start a new coverage check.
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="street" className="text-sm font-medium text-gray-700 mb-2 block">
                    Installation Address *
                  </Label>
                  <Input
                    ref={streetInputRef}
                    id="street"
                    type="text"
                    value={installationAddress}
                    className="w-full bg-gray-50 cursor-not-allowed"
                    disabled
                    readOnly
                  />
                </div>
              </div>

              {/* Property Type Selection */}
              <div className="mb-8">
                <Label htmlFor="propertyType" className="text-base font-semibold text-gray-900 mb-4 block">
                  Property Type *
                </Label>
                <Select value={propertyType} onValueChange={(value) => setPropertyType(value as PropertyType)}>
                  <SelectTrigger className="w-full h-12 bg-white">
                    <SelectValue placeholder="Select your property type" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    {currentOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value} className="bg-white hover:bg-gray-50">
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
                  disabled={authLoading}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-circleTel-orange hover:bg-circleTel-orange/90 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {authLoading ? 'Loading...' : 'Create Order'}
                  {!authLoading && <ArrowRight className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
