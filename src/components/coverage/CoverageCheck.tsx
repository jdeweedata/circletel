import React, { useState } from 'react';
import { MapPin, Wifi, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AddressAutocomplete } from './AddressAutocomplete';
import { CoverageResultModal } from './CoverageResultModal';
import { coverageApiService, type CoverageResult } from '@/services/coverageApi';

interface LocationData {
  address: string;
  province: string;
  suburb: string;
  street: string;
  streetNumber: string;
  town: string;
  buildingComplex: string;
  postalCode: string;
  latitude: number | null;
  longitude: number | null;
}

const CoverageCheck = () => {
  const [locationData, setLocationData] = useState<LocationData>({
    address: '',
    province: '',
    suburb: '',
    street: '',
    streetNumber: '',
    town: '',
    buildingComplex: '',
    postalCode: '',
    latitude: null,
    longitude: null,
  });

  const [isChecking, setIsChecking] = useState(false);
  const [coverageResult, setCoverageResult] = useState<CoverageResult | null>(null);
  const [showResultModal, setShowResultModal] = useState(false);

  const handleLocationSelect = (data: Partial<LocationData>) => {
    setLocationData(prev => ({ ...prev, ...data }));
  };

  const handleCoverageCheck = async () => {
    if (!locationData.address) {
      alert('Please enter a valid address first');
      return;
    }

    setIsChecking(true);

    try {
      let latitude = locationData.latitude;
      let longitude = locationData.longitude;

      // If we don't have coordinates, try to geocode the address
      if (!latitude || !longitude) {
        console.log('No coordinates available, attempting to geocode address:', locationData.address);

        // Use Google Maps geocoding service as fallback
        const { googleMapsService } = await import('@/services/googleMaps');
        const geocodeResult = await googleMapsService.geocodeAddress(locationData.address);

        if (geocodeResult) {
          latitude = geocodeResult.latitude;
          longitude = geocodeResult.longitude;
          console.log('Geocoded coordinates:', { latitude, longitude });

          // Update location data with coordinates
          setLocationData(prev => ({
            ...prev,
            latitude,
            longitude,
            province: geocodeResult.addressComponents.province || prev.province,
            suburb: geocodeResult.addressComponents.sublocality || geocodeResult.addressComponents.locality || prev.suburb,
            street: geocodeResult.addressComponents.route || prev.street,
            streetNumber: geocodeResult.addressComponents.streetNumber || prev.streetNumber,
            town: geocodeResult.addressComponents.locality || prev.town,
            postalCode: geocodeResult.addressComponents.postalCode || prev.postalCode,
          }));
        } else {
          alert('Unable to find coordinates for this address. Please try a more specific address.');
          return;
        }
      }

      // Use the coverage API service for FTTB coverage check
      const result = await coverageApiService.checkFTTBCoverage({
        latitude,
        longitude,
        address: locationData.address,
      });

      // Display coverage results in modal
      setCoverageResult(result);
      setShowResultModal(true);
    } catch (error) {
      console.error('Coverage check failed:', error);
      alert('Failed to check coverage. Please check your internet connection and try again.');
    } finally {
      setIsChecking(false);
    }
  };


  return (
    <section className="relative bg-gradient-to-b from-circleTel-orange to-circleTel-orange/80 text-white overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 -right-20 h-40 w-40 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-20 -left-20 h-60 w-60 bg-white/5 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 right-1/3 h-20 w-20 bg-white/10 rounded-full blur-2xl"></div>
      </div>

      <div className="container mx-auto px-4 py-16 md:py-20 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Main heading */}
          <div className="mb-6">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
              Business <span className="inline-flex items-baseline">
                Fibre Coverage
                <span className="ml-2 text-2xl md:text-3xl bg-white text-circleTel-orange px-3 py-1 rounded-full font-space-mono">
                  FTTB<span className="text-base md:text-lg">Check</span>
                </span>
              </span>
            </h1>
            <p className="text-xl md:text-2xl font-light opacity-90">
              Check Dark Fibre Africa FTTB availability for your business
            </p>
          </div>

          {/* Coverage check form */}
          <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-6 md:p-8 mb-6 border border-white/20">
            <div className="max-w-3xl mx-auto">
              {/* Address input section */}
              <div className="relative mb-6">
                <AddressAutocomplete
                  value={locationData.address}
                  onLocationSelect={handleLocationSelect}
                  placeholder="What is your address?"
                  showLocationButton={true}
                />
              </div>

              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-4">
                <Button
                  onClick={handleCoverageCheck}
                  disabled={isChecking || !locationData.address}
                  className="bg-orange-600 text-black hover:bg-orange-700 font-semibold h-12 px-8 rounded-full text-lg flex items-center gap-2 min-w-[200px] border border-black"
                >
                  {isChecking ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black"></div>
                      Checking...
                    </>
                  ) : (
                    <>
                      <Wifi size={20} />
                      Check Coverage
                      <ArrowRight size={20} />
                    </>
                  )}
                </Button>
              </div>

              {/* Existing customer link */}
              <div className="text-center">
                <span className="text-white/80 text-sm">
                  Already have CircleTel Fibre?{' '}
                  <a
                    href="https://portal.circletel.co.za/sign-in"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white hover:text-white/80 underline font-medium"
                  >
                    Sign in
                  </a>
                </span>
              </div>
            </div>
          </div>

          {/* Disclaimer */}
          <p className="text-white/70 text-sm">
            *Prices may differ based on location and ISP
          </p>

          {/* Hidden form fields for backend integration */}
          <div className="hidden">
            <input type="hidden" value={locationData.province} name="province" />
            <input type="hidden" value={locationData.suburb} name="suburb" />
            <input type="hidden" value={locationData.street} name="street" />
            <input type="hidden" value={locationData.streetNumber} name="streetNumber" />
            <input type="hidden" value={locationData.town} name="town" />
            <input type="hidden" value={locationData.buildingComplex} name="buildingComplex" />
            <input type="hidden" value={locationData.postalCode} name="postalCode" />
            <input type="hidden" value={locationData.latitude?.toString() || ''} name="latitude" />
            <input type="hidden" value={locationData.longitude?.toString() || ''} name="longitude" />
          </div>
        </div>
      </div>

      {/* Bottom wave decoration */}
      <div className="absolute bottom-0 left-0 w-full">
        <svg
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
          className="relative block w-full h-12"
          style={{ fill: 'rgba(255,255,255,0.1)' }}
        >
          <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z"></path>
        </svg>
      </div>

      {/* Coverage Result Modal */}
      <CoverageResultModal
        open={showResultModal}
        onOpenChange={setShowResultModal}
        result={coverageResult}
        address={locationData.address}
      />
    </section>
  );
};

export default CoverageCheck;