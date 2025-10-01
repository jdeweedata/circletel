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

  const handleCheckCoverage = async () => {
    if (!address.trim()) {
      toast.error('Please enter an address');
      return;
    }

    setIsChecking(true);
    setResults(null);

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

      // Step 2: Create a lead entry (similar to Supersonic's process)
      const leadResponse = await fetch('/api/coverage/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address,
          coordinates: finalCoordinates
        })
      });

      if (!leadResponse.ok) {
        throw new Error('Failed to create lead');
      }

      const leadData = await leadResponse.json();
      const leadId = leadData.leadId;

      // Step 3: Check coverage and get available packages
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

      setResults(result);

      if (result.available) {
        toast.success('Great news! Service is available in your area');
        if (onCoverageFound) {
          onCoverageFound(result);
        }
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
      setIsChecking(false);
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

        {results && results.available && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              <span className="font-semibold">Service available at your location!</span>
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