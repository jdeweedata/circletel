'use client';
import { PiArrowsDownUpBold, PiBroadcastBold, PiBuildingsBold, PiCellSignalFullBold, PiCheckCircleBold, PiFunnelBold, PiGaugeBold, PiGlobeBold, PiLightningBold, PiMagnifyingGlassBold, PiMapPinBold, PiPackageBold, PiShieldBold, PiSlidersHorizontalBold, PiSparkleBold, PiWifiHighBold, PiXCircleBold } from 'react-icons/pi';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';
import type { DetailedCoverage } from '../page';
import SkyFibreOrderabilityCard from '@/components/admin/skyfibre/SkyFibreOrderabilityCard';
import {
  getAdminSkyFibreCapacity,
  isAdminSkyFibrePackage,
} from '@/lib/coverage/skyfibre/admin-ui';
import type { SkyFibreCapacityMbps } from '@/lib/coverage/skyfibre/types';
import {
  FilterChips,
  KpiStrip,
  PmButton,
} from '@/components/portal/modernist/PortalModernistShell';
// import { mapDarkStyle } from './MapStyles';  // Dark styles no longer used

// ============================================================================
// Types
// ============================================================================

interface StepperFormData {
  // Step 1: Address
  address: string;
  coordinates: { lat: number; lng: number } | null;
  useGPS: boolean;
  gpsInput: string;

  // Step 2: Coverage (populated after check)
  leadId: string | null;
  coverage: DetailedCoverage | null;
  coverageChecked: boolean;

  // Step 3: Packages
  selectedPackages: SelectedPackage[];

  // Step 4: Client Details
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  contractTerm: 12 | 24 | 36;
  budget: string;
  failover: boolean;
  notes: string;
}

interface SelectedPackage {
  id: string;
  name: string;
  speed: number;
  price: number;
  installationFee: number;
  technology: string;
  provider: string;
  serviceType?: string;
  productCategory?: string;
  itemType: 'primary' | 'secondary' | 'additional';
}

interface ServicePackage {
  id: string;
  name: string;
  service_type: string;
  product_category: string;
  speed_down: number;
  speed_up: number;
  price: number;
  installation_fee: number;
  provider?: string;
  features?: string[];
  active: boolean;
}

// ============================================================================
// Constants
// ============================================================================

const steps = [
  { id: 1, title: 'Address' },
  { id: 2, title: 'Coverage' },
  { id: 3, title: 'Packages' },
  { id: 4, title: 'Client' },
  { id: 5, title: 'Review' },
];

const contractTermOptions = [
  { value: 12, label: '12 Months' },
  { value: 24, label: '24 Months' },
  { value: 36, label: '36 Months' },
];

const defaultCenter = { lat: -26.2041, lng: 28.0473 }; // Johannesburg

const mapContainerStyle = {
  width: '100%',
  height: '300px',
  borderRadius: '0.5rem',
};

const mapOptions: google.maps.MapOptions = {
  disableDefaultUI: true,
  zoomControl: true,
  mapTypeControl: false,
  streetViewControl: false,
  fullscreenControl: false,
  styles: [], // Light default map style
};

// Static libraries array to prevent Google Maps reload warning
const GOOGLE_MAPS_LIBRARIES: ('places')[] = ['places'];

// ============================================================================
// Helper Functions
// ============================================================================

const parseCoordinates = (text: string): { lat: number; lng: number } | null => {
  const match = text.trim().match(/^(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)$/);
  if (match) {
    const lat = parseFloat(match[1]);
    const lng = parseFloat(match[2]);
    if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      return { lat, lng };
    }
  }
  return null;
};

const getTechIcon = (tech: string) => {
  switch (tech.toLowerCase()) {
    case 'fibre': return <PiGlobeBold className="h-4 w-4 text-blue-500" />;
    case 'lte': return <PiCellSignalFullBold className="h-4 w-4 text-green-500" />;
    case '5g': return <PiLightningBold className="h-4 w-4 text-purple-500" />;
    case 'tarana': case 'skyfibre': case 'wireless': return <PiBroadcastBold className="h-4 w-4 text-orange-500" />;
    case 'starlink': return <PiSparkleBold className="h-4 w-4 text-cyan-500" />;
    default: return <PiWifiHighBold className="h-4 w-4 text-gray-500" />;
  }
};

const formatPrice = (amount: number) => {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// ============================================================================
// Main Component
// ============================================================================

export function SingleSiteStepper() {
  const searchParams = useSearchParams();
  const [currentStep, setCurrentStep] = useState(1);
  const [maxReached, setMaxReached] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [availablePackages, setAvailablePackages] = useState<ServicePackage[]>([]);
  const [generatedQuoteId, setGeneratedQuoteId] = useState<string | null>(null);

  // Package filters
  const [filters, setFilters] = useState({
    technology: 'all' as 'all' | 'fibre' | 'lte' | '5g' | 'wireless',
    minSpeed: 0,
    maxPrice: 10000,
    sortBy: 'price' as 'price' | 'speed' | 'name',
  });

  const [formData, setFormData] = useState<StepperFormData>({
    address: '',
    coordinates: null,
    useGPS: false,
    gpsInput: '',
    leadId: null,
    coverage: null,
    coverageChecked: false,
    selectedPackages: [],
    companyName: '',
    contactName: '',
    email: '',
    phone: '',
    contractTerm: 24,
    budget: '',
    failover: false,
    notes: '',
  });

  // Map state
  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [markerPosition, setMarkerPosition] = useState<{ lat: number; lng: number } | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const geocoderRef = useRef<google.maps.Geocoder | null>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const lat = parseFloat(searchParams.get('lat') || '');
    const lng = parseFloat(searchParams.get('lng') || '');
    const addressParam = searchParams.get('address');
    const address = addressParam ? decodeURIComponent(addressParam) : '';
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      const coords = { lat, lng };
      setFormData((prev) => ({
        ...prev,
        coordinates: coords,
        address: address || prev.address,
        gpsInput: `${lat}, ${lng}`,
      }));
      setMarkerPosition(coords);
      setMapCenter(coords);
    } else if (address) {
      setFormData((prev) => ({ ...prev, address }));
    }
  }, [searchParams]);

  // Filtered and sorted packages
  const filteredPackages = availablePackages
    .filter(pkg => {
      // Filter by technology
      if (filters.technology !== 'all') {
        const techMatch =
          (filters.technology === 'fibre' && (pkg.service_type?.toLowerCase().includes('fibre') || pkg.product_category?.toLowerCase().includes('fibre'))) ||
          (filters.technology === 'lte' && (pkg.service_type?.toLowerCase().includes('lte') || pkg.product_category?.toLowerCase().includes('lte'))) ||
          (filters.technology === '5g' && (pkg.service_type?.toLowerCase().includes('5g') || pkg.product_category?.toLowerCase().includes('5g'))) ||
          (filters.technology === 'wireless' && (
            pkg.service_type?.toLowerCase().includes('wireless') ||
            pkg.service_type?.toLowerCase().includes('skyfibre') ||
            pkg.product_category?.toLowerCase().includes('tarana') ||
            pkg.product_category?.toLowerCase().includes('connectivity')
          ));
        if (!techMatch) return false;
      }
      // Filter by speed
      if (pkg.speed_down < filters.minSpeed) return false;
      // Filter by price
      if (pkg.price > filters.maxPrice) return false;
      return true;
    })
    .sort((a, b) => {
      switch (filters.sortBy) {
        case 'price': return a.price - b.price;
        case 'speed': return b.speed_down - a.speed_down;
        case 'name': return a.name.localeCompare(b.name);
        default: return 0;
      }
    });

  const selectedSkyFibrePackages = formData.selectedPackages
    .filter((pkg) => isAdminSkyFibrePackage({
      name: pkg.name,
      serviceType: pkg.serviceType,
      productCategory: pkg.productCategory,
      technology: pkg.technology,
    }))
    .map((pkg) => ({
      ...pkg,
      capacityMbps: getAdminSkyFibreCapacity(pkg.speed) ?? (100 as SkyFibreCapacityMbps),
    }));

  // Load Google Maps
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries: GOOGLE_MAPS_LIBRARIES,
  });

  // Initialize geocoder and autocomplete
  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
    geocoderRef.current = new google.maps.Geocoder();
  }, []);

  // Setup autocomplete on input - with retry logic for Places API
  useEffect(() => {
    if (!isLoaded || !inputRef.current || autocompleteRef.current) return;

    // Function to initialize autocomplete
    const initAutocomplete = () => {
      // Check if Places API is available
      if (typeof google === 'undefined' || !google.maps?.places?.Autocomplete) {
        return false;
      }

      try {
        autocompleteRef.current = new google.maps.places.Autocomplete(inputRef.current!, {
          componentRestrictions: { country: 'za' },
          fields: ['formatted_address', 'geometry'],
        });

        autocompleteRef.current.addListener('place_changed', () => {
          const place = autocompleteRef.current?.getPlace();
          if (place?.geometry?.location) {
            const lat = place.geometry.location.lat();
            const lng = place.geometry.location.lng();
            setFormData(prev => ({
              ...prev,
              address: place.formatted_address || '',
              coordinates: { lat, lng },
              coverageChecked: false,
              coverage: null,
              leadId: null,
            }));
            setMarkerPosition({ lat, lng });
            setMapCenter({ lat, lng });
            mapRef.current?.setZoom(15);
          }
        });
        return true;
      } catch (error) {
        console.error('Error initializing autocomplete:', error);
        return false;
      }
    };

    // Try immediately, then retry with delays if needed
    if (!initAutocomplete()) {
      const retryIntervals = [100, 300, 500, 1000];
      let retryIndex = 0;

      const retryInit = () => {
        if (retryIndex >= retryIntervals.length) {
          console.warn('Google Places Autocomplete failed to initialize after retries');
          return;
        }
        setTimeout(() => {
          if (!autocompleteRef.current && initAutocomplete()) {
            // Success
          } else if (!autocompleteRef.current) {
            retryIndex++;
            retryInit();
          }
        }, retryIntervals[retryIndex]);
      };
      retryInit();
    }
  }, [isLoaded]);

  // Handle map click
  const onMapClick = useCallback((e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      setMarkerPosition({ lat, lng });
      setFormData(prev => ({
        ...prev,
        coordinates: { lat, lng },
        coverageChecked: false,
        coverage: null,
        leadId: null,
      }));

      // Reverse geocode to get address
      if (geocoderRef.current) {
        geocoderRef.current.geocode({ location: { lat, lng } }, (results, status) => {
          if (status === 'OK' && results && results[0]) {
            setFormData(prev => ({
              ...prev,
              address: results[0].formatted_address,
            }));
          }
        });
      }
    }
  }, []);

  // Handle GPS input change
  const handleGPSInputChange = (value: string) => {
    setFormData(prev => ({ ...prev, gpsInput: value }));
    const coords = parseCoordinates(value);
    if (coords) {
      setFormData(prev => ({
        ...prev,
        coordinates: coords,
        coverageChecked: false,
        coverage: null,
        leadId: null,
      }));
      setMarkerPosition(coords);
      setMapCenter(coords);
      mapRef.current?.setZoom(15);

      // Reverse geocode
      if (geocoderRef.current) {
        geocoderRef.current.geocode({ location: coords }, (results, status) => {
          if (status === 'OK' && results && results[0]) {
            setFormData(prev => ({
              ...prev,
              address: results[0].formatted_address,
            }));
          }
        });
      }
    }
  };

  // Check coverage
  const checkCoverage = async () => {
    if (!formData.coordinates && !formData.address) {
      toast.error('Please enter an address or GPS coordinates');
      return;
    }

    setIsLoading(true);

    try {
      const requestBody = formData.coordinates
        ? { coordinates: { lat: formData.coordinates.lat, lng: formData.coordinates.lng } }
        : { address: formData.address };

      const response = await fetch('/api/coverage/aggregate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error('Coverage check failed');
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Coverage check failed');
      }

      const data = result.data;
      const services = data.providers?.mtn?.services || [];
      const bestServices = data.bestServices || [];

      // Build coverage object from services array
      const coverage: DetailedCoverage = {};

      // Check for Fibre
      const fibreService = services.find((s: { type: string; available: boolean }) =>
        s.type === 'fibre' && s.available
      );
      if (fibreService) {
        coverage.fibre = {
          available: true,
          technology: 'Fibre',
          provider: fibreService.provider || 'MTN',
        };
      }

      // Check for LTE
      const lteService = services.find((s: { type: string; available: boolean }) =>
        (s.type === 'fixed_lte' || s.type === 'lte') && s.available
      );
      if (lteService) {
        coverage.lte = {
          available: true,
          technology: 'Fixed LTE',
          provider: lteService.provider || 'MTN',
        };
      }

      // Check for 5G
      const fiveGService = services.find((s: { type: string; available: boolean }) =>
        s.type === '5g' && s.available
      );
      if (fiveGService) {
        coverage['5g'] = {
          available: true,
          technology: '5G',
          provider: fiveGService.provider || 'MTN',
        };
      }

      // Check for Tarana/Wireless
      const taranaService = services.find((s: { type: string; available: boolean }) =>
        (s.type === 'uncapped_wireless' || s.type === 'licensed_wireless') && s.available
      );
      if (taranaService) {
        const metadata = (taranaService as { metadata?: { baseStationValidation?: { nearestStation?: { siteName: string; distanceKm: number } } } }).metadata;
        coverage.tarana = {
          available: true,
          technology: taranaService.technology || 'Tarana Wireless',
          provider: 'CircleTel',
          distance: metadata?.baseStationValidation?.nearestStation?.distanceKm,
          baseStation: metadata?.baseStationValidation?.nearestStation?.siteName,
        };
      }

      // Check DFA fibre coverage (separate provider from MTN)
      const dfaServices = data.providers?.dfa?.services || [];
      const dfaFibreService = dfaServices.find((s: { type: string; available: boolean }) =>
        s.type === 'fibre' && s.available
      );
      if (dfaFibreService && !coverage.fibre) {
        coverage.fibre = {
          available: true,
          technology: 'DFA Fibre',
          provider: (dfaFibreService as { provider?: string }).provider || 'DFA',
        };
      }

      setFormData(prev => ({
        ...prev,
        coverage,
        coverageChecked: true,
        leadId: data.leadId || null,
      }));

      // Fetch available packages
      if (data.leadId) {
        const packagesRes = await fetch(`/api/coverage/packages?leadId=${data.leadId}&type=business`);
        if (packagesRes.ok) {
          const packagesData = await packagesRes.json();
          setAvailablePackages(packagesData.packages || []);
        }
      } else {
        // Fallback: fetch all active business packages
        const packagesRes = await fetch('/api/admin/products?active=true&customer_type=business');
        if (packagesRes.ok) {
          const packagesData = await packagesRes.json();
          setAvailablePackages(packagesData.products || packagesData || []);
        }
      }

      const hasCoverage = Object.values(coverage).some(c => c?.available);
      if (hasCoverage) {
        toast.success('Coverage found! Proceed to select packages.');
        setCurrentStep(2);
        setMaxReached((prev) => Math.max(prev, 2));
      } else {
        toast.error('No coverage available at this location');
      }
    } catch (error) {
      console.error('Coverage check error:', error);
      toast.error('Failed to check coverage. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle package selection
  const togglePackage = (pkg: ServicePackage, itemType: 'primary' | 'secondary' | 'additional') => {
    setFormData(prev => {
      const existing = prev.selectedPackages.find(p => p.id === pkg.id);
      if (existing) {
        // Remove if already selected
        return {
          ...prev,
          selectedPackages: prev.selectedPackages.filter(p => p.id !== pkg.id),
        };
      } else {
        // Add package
        return {
          ...prev,
          selectedPackages: [
            ...prev.selectedPackages,
            {
              id: pkg.id,
              name: pkg.name,
              speed: pkg.speed_down,
              price: pkg.price,
              installationFee: pkg.installation_fee || 0,
              technology: pkg.service_type || pkg.product_category,
              provider: pkg.provider || 'CircleTel',
              serviceType: pkg.service_type,
              productCategory: pkg.product_category,
              itemType,
            },
          ],
        };
      }
    });
  };

  // Calculate totals
  const calculateTotals = () => {
    const monthly = formData.selectedPackages.reduce((sum, p) => sum + p.price, 0);
    const installation = formData.selectedPackages.reduce((sum, p) => sum + p.installationFee, 0);
    const vat = monthly * 0.15;
    return { monthly, installation, vat, total: monthly + vat };
  };

  // Generate quote
  const generateQuote = async () => {
    if (formData.selectedPackages.length === 0) {
      toast.error('Please select at least one package');
      return;
    }

    if (!formData.companyName) {
      toast.error('Please enter a company name');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/quotes/business/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: formData.companyName,
          contactName: formData.contactName,
          contactEmail: formData.email,
          contactPhone: formData.phone,
          customerType: 'business',
          contractTerm: formData.contractTerm,
          address: formData.address,
          coordinates: formData.coordinates,
          leadId: formData.leadId,
          items: formData.selectedPackages.map(pkg => ({
            packageId: pkg.id,
            packageName: pkg.name,
            itemType: pkg.itemType,
            quantity: 1,
            monthlyPrice: pkg.price,
            installationFee: pkg.installationFee,
          })),
          notes: formData.notes,
          failoverRequired: formData.failover,
          budget: formData.budget ? parseInt(formData.budget) : null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create quote');
      }

      const data = await response.json();
      setGeneratedQuoteId(data.quoteId || data.quote?.id);
      toast.success('Quote generated successfully!');
      setCurrentStep(5);
    } catch (error) {
      console.error('Quote generation error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to generate quote');
    } finally {
      setIsLoading(false);
    }
  };

  // Navigate steps
  const nextStep = () => {
    if (currentStep < 5) {
      const next = currentStep + 1;
      setCurrentStep(next);
      setMaxReached((prev) => Math.max(prev, next));
    }
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.coverageChecked && formData.coverage && Object.values(formData.coverage).some(c => c?.available);
      case 2:
        return formData.selectedPackages.length > 0;
      case 3:
        return formData.selectedPackages.length > 0;
      case 4:
        return formData.companyName.length > 0;
      default:
        return true;
    }
  };

  const handleStepChange = (value: string) => {
    const target = Number(value);
    if (!Number.isFinite(target)) return;
    if (target <= maxReached) {
      setCurrentStep(target);
      return;
    }
    if (target === currentStep + 1 && canProceed()) {
      nextStep();
    }
  };

  const totals = calculateTotals();

  // ============================================================================
  // Render
  // ============================================================================

  if (loadError) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <PiXCircleBold className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">Failed to load Google Maps</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col" style={{ background: 'var(--pm-ground, transparent)', color: 'var(--pm-body)' }}>
      <div
        className="px-6 py-4"
        style={{ background: '#FFFFFF', borderBottom: '2px solid var(--pm-divider)' }}
      >
        <FilterChips
          options={steps.map((step) => ({ value: String(step.id), label: step.title }))}
          value={String(currentStep)}
          onChange={handleStepChange}
        />
      </div>

      {/* Step Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto">
          <AnimatePresence mode="wait">
            {/* Step 1: Address */}
            {currentStep === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="rounded-xl bg-white px-6 py-5 shadow-sm ring-1 ring-black/[0.06]">
                  <p
                    className="text-[10px] font-extrabold tracking-[0.08em] uppercase"
                    style={{ color: 'var(--pm-navy)' }}
                  >
                    Address
                  </p>
                  <h2 className="mt-1 text-xl font-extrabold" style={{ color: 'var(--pm-navy)' }}>
                    Site location
                  </h2>
                  <p className="mt-1 text-sm" style={{ color: 'var(--pm-body)' }}>
                    Set the coordinates for this feasibility check
                  </p>
                </div>

                <FilterChips
                  options={[
                    { value: 'address', label: 'Address' },
                    { value: 'gps', label: 'GPS' },
                  ]}
                  value={formData.useGPS ? 'gps' : 'address'}
                  onChange={(value) => setFormData((prev) => ({ ...prev, useGPS: value === 'gps' }))}
                />

                <div className="relative">
                  <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                    <PiMagnifyingGlassBold className="h-4 w-4 text-slate-500" />
                  </div>
                  {formData.useGPS ? (
                    <Input
                      placeholder="Enter GPS coordinates (e.g., -26.2041, 28.0473)"
                      value={formData.gpsInput}
                      onChange={(e) => handleGPSInputChange(e.target.value)}
                      className="pl-12 h-12 rounded-xl font-mono"
                    />
                  ) : (
                    <Input
                      ref={inputRef}
                      placeholder="Start typing an address..."
                      value={formData.address}
                      onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                      className="pl-12 h-12 rounded-xl"
                    />
                  )}
                </div>

                {isLoaded && (
                  <div className="rounded-xl overflow-hidden ring-1 ring-black/[0.06]">
                    <GoogleMap
                      mapContainerStyle={mapContainerStyle}
                      center={mapCenter}
                      zoom={12}
                      options={mapOptions}
                      onLoad={onMapLoad}
                      onClick={onMapClick}
                    >
                      {markerPosition && (
                        <Marker
                          position={markerPosition}
                          icon={{
                            path: google.maps.SymbolPath.CIRCLE,
                            fillColor: '#F5841E',
                            fillOpacity: 1,
                            strokeColor: '#ffffff',
                            strokeWeight: 2,
                            scale: 10,
                          }}
                        />
                      )}
                    </GoogleMap>
                  </div>
                )}
                {!isLoaded && !loadError && (
                  <p className="text-sm" style={{ color: 'var(--pm-body)' }}>Loading map</p>
                )}
                <PmButton
                  onClick={checkCoverage}
                  disabled={(!formData.address && !formData.coordinates) || isLoading}
                  className="w-full"
                >
                  {isLoading ? 'Checking coverage…' : 'Check coverage'}
                </PmButton>
              </motion.div>
            )}

            {/* Step 2: Coverage Results & Package Selection */}
            {currentStep === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="rounded-xl bg-white px-6 py-5 shadow-sm ring-1 ring-black/[0.06]">
                  <p
                    className="text-[10px] font-extrabold tracking-[0.08em] uppercase"
                    style={{ color: 'var(--pm-navy)' }}
                  >
                    Coverage
                  </p>
                  <h2 className="mt-1 text-xl font-extrabold" style={{ color: 'var(--pm-navy)' }}>
                    Available infrastructure
                  </h2>
                  <p className="mt-1 text-sm" style={{ color: 'var(--pm-body)' }}>
                    Select packages for this location
                  </p>
                </div>

                {formData.coverage && (
                  <KpiStrip
                    variant="cards"
                    items={[
                      {
                        label: 'Fibre',
                        value: formData.coverage.fibre?.available ? 'Available' : 'None',
                        accent: formData.coverage.fibre?.available ? '#2F9E5E' : '#13274A',
                        valueColor: formData.coverage.fibre?.available ? '#2F9E5E' : '#6B7280',
                      },
                      {
                        label: 'LTE',
                        value: formData.coverage.lte?.available ? 'Available' : 'None',
                        accent: formData.coverage.lte?.available ? '#2F9E5E' : '#13274A',
                        valueColor: formData.coverage.lte?.available ? '#2F9E5E' : '#6B7280',
                      },
                      {
                        label: '5G',
                        value: formData.coverage['5g']?.available ? 'Available' : 'None',
                        accent: formData.coverage['5g']?.available ? '#2F9E5E' : '#13274A',
                        valueColor: formData.coverage['5g']?.available ? '#2F9E5E' : '#6B7280',
                      },
                      {
                        label: 'Wireless',
                        value: formData.coverage.tarana?.available ? 'Available' : 'None',
                        accent: formData.coverage.tarana?.available ? '#2F9E5E' : '#13274A',
                        valueColor: formData.coverage.tarana?.available ? '#2F9E5E' : '#6B7280',
                      },
                    ]}
                  />
                )}

                {/* Filters Row */}
                <div className="flex flex-wrap items-center gap-3 py-2 px-1">
                  <div className="flex items-center gap-2">
                    <PiFunnelBold className="h-4 w-4 text-slate-500" />
                    <span className="text-sm text-slate-600">Filters:</span>
                  </div>

                  {/* Technology Filter */}
                  <select
                    value={filters.technology}
                    onChange={(e) => setFilters(f => ({ ...f, technology: e.target.value as typeof filters.technology }))}
                        className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white"
                  >
                    <option value="all">All Technologies</option>
                    <option value="fibre">Fibre</option>
                    <option value="lte">LTE</option>
                    <option value="5g">5G</option>
                    <option value="wireless">Wireless/Tarana</option>
                  </select>

                  {/* Min Speed Filter */}
                  <select
                    value={filters.minSpeed}
                    onChange={(e) => setFilters(f => ({ ...f, minSpeed: Number(e.target.value) }))}
                        className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white"
                  >
                    <option value="0">Any Speed</option>
                    <option value="50">50+ Mbps</option>
                    <option value="100">100+ Mbps</option>
                    <option value="200">200+ Mbps</option>
                    <option value="500">500+ Mbps</option>
                  </select>

                  {/* Sort By */}
                  <div className="flex items-center gap-1 ml-auto">
                    <PiArrowsDownUpBold className="h-4 w-4 text-slate-400" />
                    <select
                      value={filters.sortBy}
                      onChange={(e) => setFilters(f => ({ ...f, sortBy: e.target.value as typeof filters.sortBy }))}
                          className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white"
                    >
                      <option value="price">Price: Low to High</option>
                      <option value="speed">Speed: High to Low</option>
                      <option value="name">Name: A-Z</option>
                    </select>
                  </div>
                </div>

                {/* Package Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {availablePackages.length === 0 ? (
                    <div className="col-span-2 text-center py-12 text-slate-500">
                      <PiPackageBold className="h-10 w-10 mx-auto mb-3 opacity-40" />
                      <p className="font-medium">Loading packages...</p>
                    </div>
                  ) : filteredPackages.length === 0 ? (
                    <div className="col-span-2 text-center py-12 text-slate-500">
                      <PiSlidersHorizontalBold className="h-10 w-10 mx-auto mb-3 opacity-40" />
                      <p className="font-medium">No packages match your filters</p>
                      <button
                        onClick={() => setFilters({ technology: 'all', minSpeed: 0, maxPrice: 10000, sortBy: 'price' })}
                        className="mt-2 text-sm font-extrabold hover:underline"
                        style={{ color: 'var(--pm-navy)' }}
                      >
                        Clear filters
                      </button>
                    </div>
                  ) : (
                    filteredPackages.map((pkg) => {
                      const isSelected = formData.selectedPackages.some(p => p.id === pkg.id);
                      return (
                        <div
                          key={pkg.id}
                          onClick={() => togglePackage(pkg, 'primary')}
                          className="relative p-4 rounded-xl bg-white cursor-pointer shadow-sm ring-1 ring-black/[0.06]"
                          style={
                            isSelected
                              ? { borderBottom: '3px solid var(--pm-accent)' }
                              : undefined
                          }
                        >
                          <div
                            className="absolute top-3 right-3 w-5 h-5 rounded-full border-2 flex items-center justify-center"
                            style={{
                              borderColor: isSelected ? 'var(--pm-navy)' : '#D1D5DB',
                              background: isSelected ? 'var(--pm-navy)' : '#FFFFFF',
                            }}
                          >
                            {isSelected && <PiCheckCircleBold className="h-3 w-3 text-white" />}
                          </div>

                          <div className="flex items-start gap-3 mb-3 pr-6">
                            <div className="p-2 rounded-lg bg-slate-100">
                              {getTechIcon(pkg.service_type || pkg.product_category)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-extrabold truncate" style={{ color: 'var(--pm-navy)' }}>{pkg.name}</h4>
                              <p className="text-xs capitalize" style={{ color: '#6B7280' }}>
                                {pkg.service_type || pkg.product_category || 'Internet'}
                              </p>
                            </div>
                          </div>

                          {/* Speed & Price Row */}
                          <div className="flex items-end justify-between">
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-1 text-sm">
                                <PiGaugeBold className="h-4 w-4 text-blue-500" />
                                <span className="font-medium">{pkg.speed_down}</span>
                                <span className="text-gray-400">Mbps</span>
                              </div>
                              {pkg.speed_up > 0 && (
                                <span className="text-xs text-gray-400">
                                  ↑{pkg.speed_up} Mbps
                                </span>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="text-xl font-bold text-gray-900">{formatPrice(pkg.price)}</p>
                              <p className="text-xs text-gray-500">/month</p>
                            </div>
                          </div>

                          {/* Features Tags */}
                          {pkg.features && pkg.features.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-3 pt-3 border-t border-gray-100">
                              {pkg.features.slice(0, 3).map((feature, i) => (
                                <span key={i} className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                                  {feature}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Results count */}
                {filteredPackages.length > 0 && (
                  <p className="text-xs text-center" style={{ color: '#6B7280' }}>
                    Showing {filteredPackages.length} of {availablePackages.length} packages
                  </p>
                )}
                <div className="flex justify-end pt-2">
                  <PmButton onClick={nextStep} disabled={formData.selectedPackages.length === 0}>
                    Continue to packages
                  </PmButton>
                </div>
              </motion.div>
            )}

            {/* Step 3: PiPackageBold Confirmation */}
            {currentStep === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="rounded-xl bg-white px-6 py-5 shadow-sm ring-1 ring-black/[0.06]">
                  <p
                    className="text-[10px] font-extrabold tracking-[0.08em] uppercase"
                    style={{ color: 'var(--pm-navy)' }}
                  >
                    Packages
                  </p>
                  <h2 className="mt-1 text-xl font-extrabold" style={{ color: 'var(--pm-navy)' }}>
                    Review selection
                  </h2>
                  <p className="mt-1 text-sm" style={{ color: 'var(--pm-body)' }}>
                    Verify the chosen packages
                  </p>
                </div>

                <div className="space-y-4">
                  {formData.selectedPackages.map((pkg) => (
                    <div key={pkg.id} className="relative p-6 rounded-xl bg-white shadow-sm ring-1 ring-black/[0.06]">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-slate-100 rounded-lg">
                            {getTechIcon(pkg.technology)}
                          </div>
                          <div>
                            <h4 className="text-sm font-extrabold" style={{ color: 'var(--pm-navy)' }}>{pkg.name}</h4>
                            <p className="text-[10px] font-extrabold tracking-[0.08em] uppercase mt-1" style={{ color: '#6B7280' }}>
                              {pkg.speed} Mbps · {pkg.provider}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-extrabold tabular-nums" style={{ color: 'var(--pm-navy)' }}>{formatPrice(pkg.price)}</p>
                          <p className="text-[10px] font-extrabold tracking-[0.08em] uppercase mt-1" style={{ color: '#6B7280' }}>/ month</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {selectedSkyFibrePackages.length > 0 && formData.coordinates && (
                  <div className="space-y-4">
                    <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-black/[0.06]">
                      <h3 className="text-sm font-extrabold" style={{ color: 'var(--pm-navy)' }}>
                        SkyFibre CSP validation
                      </h3>
                      <p className="mt-2 text-sm" style={{ color: 'var(--pm-body)' }}>
                        Run CSP orderability for selected Tarana/SkyFibre packages before generating the business quote.
                      </p>
                    </div>
                    {selectedSkyFibrePackages.map((pkg) => (
                      <SkyFibreOrderabilityCard
                        key={pkg.id}
                        leadId={formData.leadId}
                        lat={formData.coordinates!.lat}
                        lng={formData.coordinates!.lng}
                        address={formData.address}
                        packageName={pkg.name}
                        initialCapacityMbps={pkg.capacityMbps}
                      />
                    ))}
                  </div>
                )}

                {/* Totals Card */}
                <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-black/[0.06]">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-extrabold tracking-[0.08em] uppercase" style={{ color: 'var(--pm-navy)' }}>Monthly subtotal</span>
                      <span className="text-sm font-extrabold tabular-nums" style={{ color: 'var(--pm-navy)' }}>{formatPrice(totals.monthly)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-extrabold tracking-[0.08em] uppercase" style={{ color: 'var(--pm-navy)' }}>VAT (15%)</span>
                      <span className="text-sm font-extrabold tabular-nums" style={{ color: 'var(--pm-navy)' }}>{formatPrice(totals.vat)}</span>
                    </div>
                    <div className="pt-4 mt-2 flex justify-between items-center" style={{ borderTop: '1px solid var(--pm-divider)' }}>
                      <span className="text-[10px] font-extrabold tracking-[0.08em] uppercase" style={{ color: 'var(--pm-navy)' }}>Monthly total</span>
                      <span className="text-2xl font-extrabold tabular-nums" style={{ color: 'var(--pm-navy)' }}>{formatPrice(totals.total)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-4">
                  <PmButton variant="ghost" onClick={prevStep}>
                    Back to selection
                  </PmButton>
                  <PmButton onClick={nextStep}>
                    Client details
                  </PmButton>
                </div>
              </motion.div>
            )}

            {/* Step 4: Client Details */}
            {currentStep === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="rounded-xl bg-white px-6 py-5 shadow-sm ring-1 ring-black/[0.06]">
                  <p
                    className="text-[10px] font-extrabold tracking-[0.08em] uppercase"
                    style={{ color: 'var(--pm-navy)' }}
                  >
                    Client
                  </p>
                  <h2 className="mt-1 text-xl font-extrabold" style={{ color: 'var(--pm-navy)' }}>
                    Client profile
                  </h2>
                  <p className="mt-1 text-sm" style={{ color: 'var(--pm-body)' }}>
                    Information for the quote
                  </p>
                </div>

                <div className="rounded-xl bg-white p-6 space-y-6 shadow-sm ring-1 ring-black/[0.06]">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                      <Label className="text-[10px] font-extrabold tracking-[0.08em] uppercase mb-2 block" style={{ color: 'var(--pm-navy)' }}>Company name *</Label>
                      <Input
                        placeholder="e.g. Acme Corp"
                        value={formData.companyName}
                        onChange={(e) => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
                        className="h-12 rounded-xl"
                      />
                    </div>
                    <div>
                      <Label className="text-[10px] font-extrabold tracking-[0.08em] uppercase mb-2 block" style={{ color: 'var(--pm-navy)' }}>Contact person</Label>
                      <Input
                        placeholder="Contact Name"
                        value={formData.contactName}
                        onChange={(e) => setFormData(prev => ({ ...prev, contactName: e.target.value }))}
                        className="h-12 rounded-xl"
                      />
                    </div>
                    <div>
                      <Label className="text-[10px] font-extrabold tracking-[0.08em] uppercase mb-2 block" style={{ color: 'var(--pm-navy)' }}>Email</Label>
                      <Input
                        type="email"
                        placeholder="client@company.com"
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        className="h-12 rounded-xl"
                      />
                    </div>
                    <div>
                      <Label className="text-[10px] font-extrabold tracking-[0.08em] uppercase mb-2 block" style={{ color: 'var(--pm-navy)' }}>Phone</Label>
                      <Input
                        type="tel"
                        placeholder="+27..."
                        value={formData.phone}
                        onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                        className="h-12 rounded-xl"
                      />
                    </div>
                  </div>

                  <div className="pt-6 space-y-6" style={{ borderTop: '1px solid var(--pm-divider)' }}>
                    <div>
                      <Label className="text-[10px] font-extrabold tracking-[0.08em] uppercase mb-4 block" style={{ color: 'var(--pm-navy)' }}>Contract term</Label>
                      <RadioGroup
                        value={formData.contractTerm.toString()}
                        onValueChange={(v) => setFormData(prev => ({ ...prev, contractTerm: parseInt(v) as 12 | 24 | 36 }))}
                        className="flex gap-4"
                      >
                        {contractTermOptions.map((opt) => (
                          <label
                            key={opt.value}
                            className="flex-1 flex items-center justify-center gap-3 p-4 border rounded-lg cursor-pointer bg-white"
                            style={{
                              borderColor: formData.contractTerm === opt.value ? 'var(--pm-navy)' : '#E5E7EB',
                              borderBottom: formData.contractTerm === opt.value ? '3px solid var(--pm-accent)' : undefined,
                            }}
                          >
                            <RadioGroupItem value={opt.value.toString()} className="sr-only" />
                            <span className="text-xs font-extrabold uppercase tracking-wide" style={{ color: 'var(--pm-navy)' }}>{opt.label}</span>
                          </label>
                        ))}
                      </RadioGroup>
                    </div>

                    <div className="flex items-center gap-4 p-4 rounded-lg bg-white ring-1 ring-black/[0.06]">
                      <Checkbox
                        id="failover"
                        checked={formData.failover}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, failover: !!checked }))}
                      />
                      <Label htmlFor="failover" className="text-sm font-medium cursor-pointer flex items-center gap-2" style={{ color: 'var(--pm-body)' }}>
                        <PiShieldBold className="h-4 w-4" />
                        Redundant failover required
                      </Label>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-4">
                  <PmButton variant="ghost" onClick={prevStep}>
                    Back to review
                  </PmButton>
                  <PmButton
                    onClick={nextStep}
                    disabled={!formData.companyName}
                  >
                    Confirm proposal
                  </PmButton>
                </div>
              </motion.div>
            )}

            {/* Step 5: Review & Submit */}
            {currentStep === 5 && (
              <motion.div
                key="step5"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                {generatedQuoteId ? (
                  // Success State
                  <div className="text-center py-16 rounded-xl bg-white shadow-sm ring-1 ring-black/[0.06]">
                    <PiCheckCircleBold className="h-12 w-12 mx-auto mb-6" style={{ color: '#2F9E5E' }} />
                    <h2 className="text-2xl font-extrabold" style={{ color: 'var(--pm-navy)' }}>Quote generated</h2>
                    <p className="mt-3 max-w-sm mx-auto text-sm" style={{ color: 'var(--pm-body)' }}>
                      The proposal is in the sales pipeline
                    </p>

                    <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center px-8">
                      <PmButton
                        onClick={() => window.open(`/admin/quotes/${generatedQuoteId}`, '_blank')}
                      >
                        View document
                      </PmButton>
                      <PmButton
                        variant="secondary"
                        onClick={() => {
                          setCurrentStep(1);
                          setMaxReached(1);
                          setFormData({
                            address: '',
                            coordinates: null,
                            useGPS: false,
                            gpsInput: '',
                            leadId: null,
                            coverage: null,
                            coverageChecked: false,
                            selectedPackages: [],
                            companyName: '',
                            contactName: '',
                            email: '',
                            phone: '',
                            contractTerm: 24,
                            budget: '',
                            failover: false,
                            notes: '',
                          });
                          setGeneratedQuoteId(null);
                          setMarkerPosition(null);
                        }}
                      >
                        New feasibility
                      </PmButton>
                    </div>
                  </div>
                ) : (
                  // Review State
                  <>
                    <div className="rounded-xl bg-white px-6 py-5 shadow-sm ring-1 ring-black/[0.06]">
                      <p
                        className="text-[10px] font-extrabold tracking-[0.08em] uppercase"
                        style={{ color: 'var(--pm-navy)' }}
                      >
                        Review
                      </p>
                      <h2 className="mt-1 text-xl font-extrabold" style={{ color: 'var(--pm-navy)' }}>
                        Final review
                      </h2>
                      <p className="mt-1 text-sm" style={{ color: 'var(--pm-body)' }}>
                        Confirm details before generating the quote
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-6">
                        <div className="p-6 rounded-xl bg-white shadow-sm ring-1 ring-black/[0.06] flex gap-4">
                          <PiMapPinBold className="h-4 w-4 mt-1" style={{ color: 'var(--pm-navy)' }} />
                          <div>
                            <span className="text-[10px] font-extrabold tracking-[0.08em] uppercase" style={{ color: 'var(--pm-navy)' }}>Site address</span>
                            <p className="text-sm font-medium mt-1 leading-relaxed" style={{ color: 'var(--pm-body)' }}>{formData.address}</p>
                          </div>
                        </div>

                        <div className="p-6 rounded-xl bg-white shadow-sm ring-1 ring-black/[0.06] flex gap-4">
                          <PiBuildingsBold className="h-4 w-4 mt-1" style={{ color: 'var(--pm-navy)' }} />
                          <div className="flex-1">
                            <span className="text-[10px] font-extrabold tracking-[0.08em] uppercase" style={{ color: 'var(--pm-navy)' }}>Client account</span>
                            <p className="text-sm font-extrabold mt-1" style={{ color: 'var(--pm-navy)' }}>{formData.companyName}</p>
                            <div className="grid grid-cols-2 gap-4 mt-3 pt-3" style={{ borderTop: '1px solid var(--pm-divider)' }}>
                              <div>
                                <span className="text-[10px] font-extrabold tracking-[0.08em] uppercase" style={{ color: 'var(--pm-navy)' }}>Contact</span>
                                <p className="text-xs mt-1" style={{ color: 'var(--pm-body)' }}>{formData.contactName || 'N/A'}</p>
                              </div>
                              <div>
                                <span className="text-[10px] font-extrabold tracking-[0.08em] uppercase" style={{ color: 'var(--pm-navy)' }}>Term</span>
                                <p className="text-xs mt-1" style={{ color: 'var(--pm-body)' }}>{formData.contractTerm} months</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-xl bg-white p-6 flex flex-col shadow-sm ring-1 ring-black/[0.06]">
                        <span className="text-[10px] font-extrabold tracking-[0.08em] uppercase mb-6" style={{ color: 'var(--pm-navy)' }}>Commercial summary</span>

                        <div className="space-y-4 flex-1">
                          {formData.selectedPackages.map(pkg => (
                            <div key={pkg.id} className="flex justify-between items-center">
                              <span className="text-xs font-medium capitalize" style={{ color: 'var(--pm-body)' }}>{pkg.name}</span>
                              <span className="text-xs font-extrabold tabular-nums" style={{ color: 'var(--pm-navy)' }}>{formatPrice(pkg.price)}</span>
                            </div>
                          ))}
                        </div>

                        <div className="pt-6 mt-6 space-y-4" style={{ borderTop: '1px solid var(--pm-divider)' }}>
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-extrabold tracking-[0.08em] uppercase" style={{ color: 'var(--pm-navy)' }}>VAT (15%)</span>
                            <span className="text-xs font-extrabold tabular-nums" style={{ color: 'var(--pm-navy)' }}>{formatPrice(totals.vat)}</span>
                          </div>
                          <div className="flex justify-between items-center p-4 rounded-lg" style={{ background: 'var(--pm-surface)' }}>
                            <span className="text-[10px] font-extrabold tracking-[0.08em] uppercase" style={{ color: 'var(--pm-navy)' }}>Monthly total</span>
                            <span className="text-2xl font-extrabold tabular-nums" style={{ color: 'var(--pm-navy)' }}>{formatPrice(totals.total)}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-6">
                      <PmButton variant="ghost" onClick={prevStep}>
                        Edit details
                      </PmButton>
                      <PmButton
                        onClick={generateQuote}
                        disabled={isLoading}
                      >
                        {isLoading ? 'Generating quote…' : 'Generate quote'}
                      </PmButton>
                    </div>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div >

      {/* Navigation Footer - Removed for unified UI */}
    </div >
  );
}
