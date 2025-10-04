'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Loader2, CheckCircle, XCircle, Wifi, Home, Building, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@supabase/supabase-js';
import { AddressAutocomplete } from './AddressAutocomplete';
import { PackageCard } from '@/components/packages/PackageCard';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY! || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface CoverageResult {
  available: boolean;
  services: string[];
  speeds: Array<{ download: number; upload: number }>;
  packages?: Array<{
    id: string;
    name: string;
    service_type: string;
    speed_down: number;
    speed_up: number;
    price: number;
    promotion_price?: number;
    promotion_months?: number;
    description: string;
    features: string[];
  }>;
  areas?: Array<{
    service_type: string;
    area_name: string;
    activation_days: number;
  }>;
  coordinates?: {
    lat: number;
    lng: number;
  };
  address?: string;
  leadId?: string;
}

const serviceIcons: Record<string, any> = {
  'SkyFibre': Wifi,
  'HomeFibreConnect': Home,
  'BizFibreConnect': Building,
};

const serviceDescriptions: Record<string, string> = {
  'SkyFibre': 'Wireless broadband - Quick deployment',
  'HomeFibreConnect': 'Premium residential fibre',
  'BizFibreConnect': 'Enterprise-grade business fibre',
};

interface CoverageCheckerProps {
  onCoverageFound?: (result: CoverageResult) => void;
  onNoCoverage?: () => void;
  onPackageSelect?: (packageId: string, leadId: string) => void;
  className?: string;
  showPackages?: boolean;
}

export function CoverageChecker({
  onCoverageFound,
  onNoCoverage,
  onPackageSelect,
  className,
  showPackages = true
}: CoverageCheckerProps) {
  const [address, setAddress] = useState('');
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [results, setResults] = useState<CoverageResult | null>(null);
  const [showNoServiceDialog, setShowNoServiceDialog] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [progressStage, setProgressStage] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');

  const handleCheckCoverage = async () => {
    if (!address.trim()) {
      toast.error('Please enter an address');
      return;
    }

    setIsChecking(true);
    setResults(null);
    setIsRedirecting(false);
    setProgressStage(1);
    setProgressMessage('Finding your location...');

    try {
      // Step 1: Geocode the address if coordinates aren't available
      let finalCoordinates = coordinates;
      if (!finalCoordinates && address) {
        // Use Google Geocoding to get coordinates
        const geocodeResponse = await fetch(`/api/geocode?address=${encodeURIComponent(address)}`);
        if (geocodeResponse.ok) {
          const geocodeData = await geocodeResponse.json();
          finalCoordinates = {
            lat: geocodeData.latitude,
            lng: geocodeData.longitude
          };
        }
      }

      // Step 2: Create a lead entry and check coverage
      setProgressStage(2);
      setProgressMessage('Checking coverage availability...');

      // Extract UTM parameters from URL if available
      const urlParams = new URLSearchParams(window.location.search);
      const trackingData = {
        utm_source: urlParams.get('utm_source') || undefined,
        utm_medium: urlParams.get('utm_medium') || undefined,
        utm_campaign: urlParams.get('utm_campaign') || undefined,
        referrer_url: document.referrer || undefined,
      };

      const leadResponse = await fetch('/api/coverage/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address,
          coordinates: finalCoordinates,
          customer_type: 'residential', // Default to residential, can be made dynamic
          ...trackingData
        })
      });

      if (!leadResponse.ok) {
        throw new Error('Failed to create lead');
      }

      const leadData = await leadResponse.json();
      const leadId = leadData.leadId;

      // Step 3: Load personalized packages
      setProgressStage(3);
      setProgressMessage('Loading your personalized packages...');

      const coverageResponse = await fetch(`/api/coverage/packages?leadId=${leadId}`);
      if (!coverageResponse.ok) {
        throw new Error('Failed to check coverage');
      }

      const coverageData = await coverageResponse.json();

      const result: CoverageResult = {
        ...coverageData,
        address,
        coordinates: finalCoordinates,
        leadId
      };

      if (result.available) {
        toast.success('Great news! Service is available in your area');
        if (onCoverageFound) {
          // Set redirecting flag to prevent any UI update before redirect
          setIsRedirecting(true);
          // Call callback immediately - this will trigger redirect
          onCoverageFound(result);
          // Keep isChecking true and never set it to false to maintain loading state
          return;
        }
        // Only set results if no callback provided (standalone usage)
        setResults(result);
      } else {
        toast.info('Service coming soon to your area');
        setShowNoServiceDialog(true);
        if (onNoCoverage) {
          onNoCoverage();
        }
      }
    } catch (error) {
      console.error('Coverage check failed:', error);
      toast.error('Unable to check coverage. Please try again.');

      // Fallback to original method
      try {
        const { data, error } = await supabase.functions.invoke('check-coverage', {
          body: { address, coordinates }
        });

        if (error) throw error;
        setResults(data);
      } catch (fallbackError) {
        console.error('Fallback coverage check also failed:', fallbackError);
      }
    } finally {
      // Only clear loading state if we're not redirecting
      if (!isRedirecting) {
        setIsChecking(false);
      }
    }
  };

  const handleLocationSelect = (data: any) => {
    setAddress(data.address);
    if (data.latitude && data.longitude) {
      setCoordinates({ lat: data.latitude, lng: data.longitude });
    }
  };

  const handlePackageSelection = (packageId: string) => {
    setSelectedPackage(packageId);
    if (onPackageSelect && results?.leadId) {
      onPackageSelect(packageId, results.leadId);
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-orange-500" />
          Check Service Availability
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-4">
          <AddressAutocomplete
            value={address}
            onLocationSelect={handleLocationSelect}
            placeholder="Enter your address (e.g., 18 Rasmus Erasmus, Centurion)"
            className="w-full"
            showLocationButton={true}
          />
          <Button
            onClick={handleCheckCoverage}
            disabled={isChecking || !address.trim()}
            className="w-full bg-orange-500 hover:bg-orange-600 h-12 text-lg font-semibold"
            size="lg"
          >
            {isChecking ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                Checking coverage...
              </>
            ) : (
              <>
                Show me my deals
                <ArrowRight className="h-5 w-5 ml-2" />
              </>
            )}
          </Button>
        </div>

        {/* Progress Indicator */}
        {isChecking && (
          <div className="space-y-4 p-6 bg-gray-50 rounded-lg border-2 border-orange-200 animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-center justify-center gap-2 text-orange-600">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="font-semibold">{progressMessage}</span>
            </div>

            {/* Progress Steps */}
            <div className="flex items-center justify-center gap-2">
              {[1, 2, 3].map((step) => (
                <div key={step} className="flex items-center gap-2">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all ${
                      progressStage > step
                        ? 'bg-green-500 text-white'
                        : progressStage === step
                        ? 'bg-orange-500 text-white ring-2 ring-orange-300 ring-offset-2'
                        : 'bg-gray-300 text-gray-600'
                    }`}
                  >
                    {progressStage > step ? <CheckCircle className="h-4 w-4" /> : step}
                  </div>
                  {step < 3 && (
                    <div
                      className={`h-0.5 w-12 transition-all ${
                        progressStage > step ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>

            {/* Step Labels */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className={`text-xs ${progressStage >= 1 ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
                Location
              </div>
              <div className={`text-xs ${progressStage >= 2 ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
                Coverage
              </div>
              <div className={`text-xs ${progressStage >= 3 ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
                Packages
              </div>
            </div>
          </div>
        )}

        {results && results.available && (
          <div className="space-y-4 animate-in fade-in-slide-in-from-bottom-2">
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              <span className="font-semibold">Service available at your location!</span>
            </div>

            {/* MTN Coverage Disclaimer - Phase 1 Fallback Notice */}
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
              <p className="font-medium">📍 Coverage Information</p>
              <p className="mt-1 text-xs leading-relaxed">
                Coverage estimates are based on network infrastructure data and may not reflect current real-time availability.
                We recommend contacting the service provider to confirm exact coverage at your location.
              </p>
            </div>

            <div className="space-y-3">
              {results.services.map((service) => {
                const Icon = serviceIcons[service] || Wifi;
                const activationDays = results.areas?.find(a => a.service_type === service)?.activation_days || 3;

                return (
                  <div key={service} className="p-4 border rounded-lg bg-gray-50">
                    <div className="flex items-start gap-3">
                      <Icon className="h-6 w-6 text-orange-500 mt-1" />
                      <div className="flex-1">
                        <p className="font-semibold">{service}</p>
                        <p className="text-sm text-gray-600">{serviceDescriptions[service]}</p>
                        <p className="text-xs text-green-600 mt-1">
                          Can be activated in {activationDays} days
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Package Selection */}
            {showPackages && results.packages && results.packages.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Choose your package:
                </h3>
                <div className="grid gap-4 md:grid-cols-2">
                  {results.packages.map((pkg, index) => (
                    <PackageCard
                      key={pkg.id}
                      id={pkg.id}
                      name={pkg.name}
                      service_type={pkg.service_type}
                      speed_down={pkg.speed_down}
                      speed_up={pkg.speed_up}
                      price={pkg.price}
                      promotion_price={pkg.promotion_price}
                      promotion_months={pkg.promotion_months}
                      description={pkg.description}
                      features={pkg.features}
                      isPopular={index === 1} // Mark second package as popular (most common sweet spot)
                      isSelected={selectedPackage === pkg.id}
                      onSelect={handlePackageSelection}
                    />
                  ))}
                </div>
                {selectedPackage && (
                  <Button
                    className="w-full bg-orange-500 hover:bg-orange-600"
                    onClick={() => window.location.href = `/order?package=${selectedPackage}&lead=${results.leadId}`}
                  >
                    Sign up now
                  </Button>
                )}
              </div>
            )}

            {(!showPackages || !results.packages?.length) && (
              <Button
                className="w-full bg-orange-500 hover:bg-orange-600"
                onClick={() => window.location.href = '/products'}
              >
                View Available Products
              </Button>
            )}
          </div>
        )}

        {results && !results.available && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-center gap-2 text-amber-600">
              <XCircle className="h-5 w-5" />
              <span className="font-semibold">Service coming soon to your area!</span>
            </div>
            <p className="text-sm text-gray-600">
              We're rapidly expanding our network. Leave your details and we'll notify you as soon as service becomes available.
            </p>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setShowNoServiceDialog(true)}
            >
              Get Notified When Available
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}