'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';
import {
  MapPin,
  Building2,
  Mail,
  Phone,
  Wifi,
  Shield,
  ShieldCheck,
  FileText,
  CheckCircle2,
  XCircle,
  Loader2,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Zap,
  Globe,
  Signal,
  Router,
  Antenna,
  Search,
  Package,
  User,
  DollarSign,
  Calendar,
  ClipboardList,
  ExternalLink,
  Filter,
  ArrowUpDown,
  SlidersHorizontal,
  Gauge,
  RotateCcw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import type { CoverageDetail, DetailedCoverage } from '../page';
import { mapDarkStyle } from './MapStyles';

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
  { id: 1, title: 'Address', icon: MapPin },
  { id: 2, title: 'Coverage', icon: Search },
  { id: 3, title: 'Packages', icon: Package },
  { id: 4, title: 'Client', icon: User },
  { id: 5, title: 'Review', icon: ClipboardList },
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
  styles: mapDarkStyle, // Using same dark style
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
    case 'fibre': return <Globe className="h-4 w-4 text-blue-500" />;
    case 'lte': return <Signal className="h-4 w-4 text-green-500" />;
    case '5g': return <Zap className="h-4 w-4 text-purple-500" />;
    case 'tarana': case 'skyfibre': case 'wireless': return <Antenna className="h-4 w-4 text-orange-500" />;
    case 'starlink': return <Sparkles className="h-4 w-4 text-cyan-500" />;
    default: return <Wifi className="h-4 w-4 text-gray-500" />;
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
  const [currentStep, setCurrentStep] = useState(1);
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
    if (currentStep < 5) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  // Validation for each step
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

  const totals = calculateTotals();

  // ============================================================================
  // Render
  // ============================================================================

  if (loadError) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">Failed to load Google Maps</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-circleTel-midnight-navy text-slate-100">
      {/* Progress Bar */}
      <div className="bg-circleTel-navy/50 backdrop-blur-xl border-b border-white/10 px-6 py-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isComplete = currentStep > step.id;
              const isLast = index === steps.length - 1;

              return (
                <div key={step.id} className="flex items-center flex-1">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-500 shadow-lg ${isComplete
                        ? 'bg-green-500 text-white shadow-green-500/20'
                        : isActive
                          ? 'bg-circleTel-orange text-white shadow-circleTel-orange/30 scale-110'
                          : 'bg-white/5 text-slate-500 border border-white/5'
                        }`}
                    >
                      {isComplete ? (
                        <CheckCircle2 className="h-6 w-6" />
                      ) : (
                        <Icon className={`h-6 w-6 ${isActive ? 'animate-pulse' : ''}`} />
                      )}
                    </div>
                    <span
                      className={`text-[10px] mt-2 font-black uppercase tracking-widest ${isActive ? 'text-circleTel-orange' : isComplete ? 'text-green-500' : 'text-slate-600'
                        }`}
                    >
                      {step.title}
                    </span>
                  </div>
                  {!isLast && (
                    <div
                      className={`flex-1 h-0.5 mx-4 rounded-full transition-all duration-500 ${isComplete ? 'bg-gradient-to-r from-green-500 to-green-500' : 'bg-white/5'
                        }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
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
                <div className="bg-white/5 rounded-2xl border border-white/10 p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden group hover:border-circleTel-orange/30 transition-all duration-500">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-circleTel-orange to-transparent opacity-0 group-hover:opacity-50 transition-opacity" />
                  <h2 className="text-2xl font-black text-white uppercase tracking-widest flex items-center gap-3">
                    <MapPin className="h-6 w-6 text-circleTel-orange" />
                    Site Location
                  </h2>
                  <p className="text-slate-400 mt-2 font-medium tracking-wide">
                    Define the target coordinates for feasibility analysis
                  </p>
                </div>

                {/* Toggle GPS/Address */}
                <div className="flex items-center gap-6 bg-black/20 p-2 rounded-xl border border-white/5 w-fit">
                  <button
                    onClick={() => setFormData(prev => ({ ...prev, useGPS: false }))}
                    className={`px-6 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${!formData.useGPS ? 'bg-circleTel-orange text-white shadow-lg shadow-circleTel-orange/20' : 'text-slate-500 hover:text-slate-300'
                      }`}
                  >
                    Address
                  </button>
                  <button
                    onClick={() => setFormData(prev => ({ ...prev, useGPS: true }))}
                    className={`px-6 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${formData.useGPS ? 'bg-circleTel-orange text-white shadow-lg shadow-circleTel-orange/20' : 'text-slate-500 hover:text-slate-300'
                      }`}
                  >
                    GPS
                  </button>
                </div>

                {/* Address/GPS Input */}
                <div className="relative group">
                  <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-slate-500 group-hover:text-circleTel-orange transition-colors" />
                  </div>
                  {formData.useGPS ? (
                    <Input
                      placeholder="Enter GPS coordinates (e.g., -26.2041, 28.0473)"
                      value={formData.gpsInput}
                      onChange={(e) => handleGPSInputChange(e.target.value)}
                      className="pl-12 bg-white/5 border-white/10 text-white placeholder:text-slate-600 focus:border-circleTel-orange/50 focus:ring-1 focus:ring-circleTel-orange/30 font-mono h-14 rounded-xl"
                    />
                  ) : (
                    <Input
                      ref={inputRef}
                      placeholder="Start typing an address..."
                      value={formData.address}
                      onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                      className="pl-12 bg-white/5 border-white/10 text-white placeholder:text-slate-600 focus:border-circleTel-orange/50 focus:ring-1 focus:ring-circleTel-orange/30 h-14 rounded-xl"
                    />
                  )}
                </div>

                {/* Map */}
                {isLoaded && (
                  <div className="rounded-lg overflow-hidden border">
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
                {/* Coverage Check Action */}
                <div className="pt-4">
                  <Button
                    onClick={checkCoverage}
                    disabled={(!formData.address && !formData.coordinates) || isLoading}
                    className="w-full bg-circleTel-orange hover:bg-circleTel-bright-orange text-white py-8 text-sm font-black uppercase tracking-[0.3em] rounded-xl shadow-[0_10px_30px_rgba(245,132,30,0.3)] disabled:opacity-20 disabled:shadow-none transition-all duration-500 overflow-hidden relative group"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_2s_infinite] pointer-events-none" />
                    {isLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin mr-3" />
                    ) : (
                      <Sparkles className="h-4 w-4 mr-3 animate-pulse text-white" />
                    )}
                    {isLoading ? 'Scanning Infrastructure...' : 'Initiate Scan'}
                  </Button>
                </div>
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
                <div className="bg-white/5 rounded-2xl border border-white/10 p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden group hover:border-circleTel-orange/30 transition-all duration-500">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-green-500 to-transparent opacity-50" />
                  <h2 className="text-2xl font-black text-white uppercase tracking-widest flex items-center gap-3">
                    <ShieldCheck className="h-6 w-6 text-green-500" />
                    Available Infrastructure
                  </h2>
                  <p className="text-slate-400 mt-2 font-medium tracking-wide">
                    Select the optimal packages for this location
                  </p>
                </div>

                {/* Specific Tech Badges */}
                <div className="flex flex-wrap gap-2">
                  {formData.coverage && Object.entries(formData.coverage).map(([tech, details]) => (
                    details?.available && (
                      <div key={tech} className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg flex items-center gap-2">
                        {getTechIcon(tech)}
                        <span className="text-[10px] font-black text-white uppercase tracking-widest">{tech} Ready</span>
                      </div>
                    )
                  ))}
                </div>

                {/* Filters Row */}
                <div className="flex flex-wrap items-center gap-3 py-2 px-1">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-slate-500" />
                    <span className="text-sm text-slate-400">Filters:</span>
                  </div>

                  {/* Technology Filter */}
                  <select
                    value={filters.technology}
                    onChange={(e) => setFilters(f => ({ ...f, technology: e.target.value as typeof filters.technology }))}
                    className="text-sm border border-white/10 rounded-lg px-3 py-1.5 bg-white/5 text-white focus:ring-2 focus:ring-circleTel-orange/20 focus:border-circleTel-orange"
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
                    className="text-sm border border-white/10 rounded-lg px-3 py-1.5 bg-white/5 text-white focus:ring-2 focus:ring-circleTel-orange/20 focus:border-circleTel-orange"
                  >
                    <option value="0">Any Speed</option>
                    <option value="50">50+ Mbps</option>
                    <option value="100">100+ Mbps</option>
                    <option value="200">200+ Mbps</option>
                    <option value="500">500+ Mbps</option>
                  </select>

                  {/* Sort By */}
                  <div className="flex items-center gap-1 ml-auto">
                    <ArrowUpDown className="h-4 w-4 text-gray-400" />
                    <select
                      value={filters.sortBy}
                      onChange={(e) => setFilters(f => ({ ...f, sortBy: e.target.value as typeof filters.sortBy }))}
                      className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:ring-2 focus:ring-circleTel-orange/20 focus:border-circleTel-orange"
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
                    <div className="col-span-2 text-center py-12 text-gray-500">
                      <Package className="h-10 w-10 mx-auto mb-3 opacity-40" />
                      <p className="font-medium">Loading packages...</p>
                    </div>
                  ) : filteredPackages.length === 0 ? (
                    <div className="col-span-2 text-center py-12 text-gray-500">
                      <SlidersHorizontal className="h-10 w-10 mx-auto mb-3 opacity-40" />
                      <p className="font-medium">No packages match your filters</p>
                      <button
                        onClick={() => setFilters({ technology: 'all', minSpeed: 0, maxPrice: 10000, sortBy: 'price' })}
                        className="mt-2 text-sm text-circleTel-orange hover:underline"
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
                          className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all hover:shadow-md ${isSelected
                            ? 'border-circleTel-orange bg-gradient-to-br from-circleTel-orange/5 to-circleTel-orange/10 shadow-sm'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                            }`}
                        >
                          {/* Selection indicator */}
                          <div className={`absolute top-3 right-3 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${isSelected ? 'border-circleTel-orange bg-circleTel-orange' : 'border-gray-300'
                            }`}>
                            {isSelected && <CheckCircle2 className="h-3 w-3 text-white" />}
                          </div>

                          {/* Package Header */}
                          <div className="flex items-start gap-3 mb-3 pr-6">
                            <div className={`p-2 rounded-lg ${isSelected ? 'bg-circleTel-orange/20' : 'bg-gray-100'}`}>
                              {getTechIcon(pkg.service_type || pkg.product_category)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-gray-900 truncate">{pkg.name}</h4>
                              <p className="text-xs text-gray-500 capitalize">
                                {pkg.service_type || pkg.product_category || 'Internet'}
                              </p>
                            </div>
                          </div>

                          {/* Speed & Price Row */}
                          <div className="flex items-end justify-between">
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-1 text-sm">
                                <Gauge className="h-4 w-4 text-blue-500" />
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
                  <p className="text-xs text-gray-400 text-center">
                    Showing {filteredPackages.length} of {availablePackages.length} packages
                  </p>
                )}
              </motion.div>
            )}

            {/* Step 3: Package Confirmation */}
            {currentStep === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="bg-white/5 rounded-2xl border border-white/10 p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden group hover:border-circleTel-orange/30 transition-all duration-500">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-circleTel-orange to-transparent opacity-50" />
                  <h2 className="text-2xl font-black text-white uppercase tracking-widest flex items-center gap-3">
                    <Package className="h-6 w-6 text-circleTel-orange" />
                    Review Selection
                  </h2>
                  <p className="text-slate-400 mt-2 font-medium tracking-wide">
                    Verify the chosen infrastructure packages
                  </p>
                </div>

                <div className="space-y-4">
                  {formData.selectedPackages.map((pkg) => (
                    <div key={pkg.id} className="relative p-6 rounded-2xl bg-white/5 border border-white/10 group hover:border-white/20 transition-all">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-white/5 rounded-xl group-hover:bg-circleTel-orange/10 transition-colors">
                            {getTechIcon(pkg.technology)}
                          </div>
                          <div>
                            <h4 className="text-sm font-black text-white uppercase tracking-widest">{pkg.name}</h4>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">
                              {pkg.speed} Mbps • {pkg.provider}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-black text-white tracking-widest leading-none">{formatPrice(pkg.price)}</p>
                          <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mt-1">/ month</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Totals Card */}
                <div className="bg-black/40 rounded-2xl border border-white/5 p-8 backdrop-blur-md shadow-2xl">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Monthly Subtotal</span>
                      <span className="text-sm font-black text-white tracking-widest">{formatPrice(totals.monthly)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">VAT (15%)</span>
                      <span className="text-sm font-black text-white tracking-widest">{formatPrice(totals.vat)}</span>
                    </div>
                    <div className="pt-4 mt-2 border-t border-white/5 flex justify-between items-center">
                      <span className="text-xs font-black text-white uppercase tracking-[0.2em]">Monthly Total</span>
                      <span className="text-2xl font-black text-circleTel-orange tracking-widest">{formatPrice(totals.total)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-8">
                  <Button variant="ghost" onClick={prevStep} className="text-slate-500 hover:text-white uppercase tracking-widest text-[10px] font-black">
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    Back to Selection
                  </Button>
                  <Button onClick={nextStep} className="bg-circleTel-orange hover:bg-circleTel-bright-orange text-white px-12 h-14 rounded-xl font-black uppercase tracking-[.2em] text-[10px] shadow-[0_10px_30px_rgba(245,132,30,0.3)]">
                    Client Details
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
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
                <div className="bg-white/5 rounded-2xl border border-white/10 p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden group hover:border-circleTel-orange/30 transition-all duration-500">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-circleTel-orange to-transparent opacity-50" />
                  <h2 className="text-2xl font-black text-white uppercase tracking-widest flex items-center gap-3">
                    <Building2 className="h-6 w-6 text-circleTel-orange" />
                    Client Profile
                  </h2>
                  <p className="text-slate-400 mt-2 font-medium tracking-wide">
                    Information for proposal generation
                  </p>
                </div>

                <div className="bg-white/5 rounded-2xl border border-white/5 p-8 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2 group">
                      <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block group-focus-within:text-circleTel-orange transition-colors">Company Name *</Label>
                      <Input
                        placeholder="e.g. Acme Corp"
                        value={formData.companyName}
                        onChange={(e) => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
                        className="bg-black/20 border-white/10 text-white placeholder:text-slate-600 focus:border-circleTel-orange/50 h-14 rounded-xl font-bold tracking-wide"
                      />
                    </div>
                    <div className="group">
                      <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block group-focus-within:text-circleTel-orange transition-colors">Contact Person</Label>
                      <Input
                        placeholder="Contact Name"
                        value={formData.contactName}
                        onChange={(e) => setFormData(prev => ({ ...prev, contactName: e.target.value }))}
                        className="bg-black/20 border-white/10 text-white placeholder:text-slate-600 focus:border-circleTel-orange/50 h-14 rounded-xl"
                      />
                    </div>
                    <div className="group">
                      <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block group-focus-within:text-circleTel-orange transition-colors">Email Address</Label>
                      <Input
                        type="email"
                        placeholder="client@company.com"
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        className="bg-black/20 border-white/10 text-white placeholder:text-slate-600 focus:border-circleTel-orange/50 h-14 rounded-xl"
                      />
                    </div>
                    <div className="group">
                      <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block group-focus-within:text-circleTel-orange transition-colors">Phone Number</Label>
                      <Input
                        type="tel"
                        placeholder="+27..."
                        value={formData.phone}
                        onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                        className="bg-black/20 border-white/10 text-white placeholder:text-slate-600 focus:border-circleTel-orange/50 h-14 rounded-xl"
                      />
                    </div>
                  </div>

                  <div className="pt-6 border-t border-white/5 space-y-6">
                    <div>
                      <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 block">Preferred Contract Term</Label>
                      <RadioGroup
                        value={formData.contractTerm.toString()}
                        onValueChange={(v) => setFormData(prev => ({ ...prev, contractTerm: parseInt(v) as 12 | 24 | 36 }))}
                        className="flex gap-4"
                      >
                        {contractTermOptions.map((opt) => (
                          <label
                            key={opt.value}
                            className={`flex-1 flex items-center justify-center gap-3 p-4 border rounded-xl cursor-pointer transition-all duration-300 ${formData.contractTerm === opt.value
                              ? 'border-circleTel-orange bg-circleTel-orange/10 text-white'
                              : 'border-white/5 bg-black/20 text-slate-500 hover:border-white/10'
                              }`}
                          >
                            <RadioGroupItem value={opt.value.toString()} className="sr-only" />
                            <span className="text-xs font-black uppercase tracking-widest">{opt.label}</span>
                          </label>
                        ))}
                      </RadioGroup>
                    </div>

                    <div className="flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/5">
                      <Checkbox
                        id="failover"
                        checked={formData.failover}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, failover: !!checked }))}
                        className="border-white/20 data-[state=checked]:bg-circleTel-orange data-[state=checked]:border-circleTel-orange"
                      />
                      <Label htmlFor="failover" className="text-[10px] font-black text-slate-300 uppercase tracking-widest cursor-pointer flex items-center gap-2">
                        <Shield className="h-4 w-4 text-green-500" />
                        Redundant Failover Required
                      </Label>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-8">
                  <Button variant="ghost" onClick={prevStep} className="text-slate-500 hover:text-white uppercase tracking-widest text-[10px] font-black">
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    Back to review
                  </Button>
                  <Button
                    onClick={nextStep}
                    disabled={!formData.companyName}
                    className="bg-circleTel-orange hover:bg-circleTel-bright-orange text-white px-12 h-14 rounded-xl font-black uppercase tracking-[.2em] text-[10px] shadow-[0_10px_30px_rgba(245,132,30,0.3)] disabled:opacity-20 transition-all active:scale-95"
                  >
                    Confirm Proposal
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
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
                  <div className="text-center py-16 bg-white/5 rounded-3xl border border-white/10 backdrop-blur-xl shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-green-500 opacity-50" />
                    <div className="w-20 h-20 bg-green-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-500/10">
                      <CheckCircle2 className="h-10 w-10 text-green-500" />
                    </div>
                    <h2 className="text-3xl font-black text-white uppercase tracking-widest leading-tight">Quote Generated</h2>
                    <p className="text-slate-400 mt-3 font-medium tracking-wide max-w-sm mx-auto">
                      Automated proposal has been created and synced with the sales pipeline
                    </p>

                    <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center px-8">
                      <Button
                        onClick={() => window.open(`/admin/quotes/${generatedQuoteId}`, '_blank')}
                        className="bg-circleTel-orange hover:bg-circleTel-bright-orange text-white h-14 px-8 rounded-xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-circleTel-orange/20"
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        View Document
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setCurrentStep(1);
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
                        className="border-white/10 hover:bg-white/5 text-slate-300 h-14 px-8 rounded-xl font-black uppercase tracking-widest text-[10px]"
                      >
                        <RotateCcw className="h-4 w-4 mr-2" />
                        New Feasibility
                      </Button>
                    </div>
                  </div>
                ) : (
                  // Review State
                  <>
                    <div className="bg-white/5 rounded-2xl border border-white/10 p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden group hover:border-circleTel-orange/30 transition-all duration-500">
                      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-circleTel-orange to-transparent opacity-50" />
                      <h2 className="text-2xl font-black text-white uppercase tracking-widest flex items-center gap-3">
                        <FileText className="h-6 w-6 text-circleTel-orange" />
                        Final Review
                      </h2>
                      <p className="text-slate-400 mt-2 font-medium tracking-wide">
                        Validate installation parameters before finalizing
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Summary Section */}
                      <div className="space-y-6">
                        {/* Location */}
                        <div className="p-6 bg-white/5 rounded-2xl border border-white/5 flex gap-4">
                          <div className="p-2 bg-circleTel-orange/10 rounded-lg h-fit">
                            <MapPin className="h-4 w-4 text-circleTel-orange" />
                          </div>
                          <div>
                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Site Address</span>
                            <p className="text-sm font-bold text-white mt-1 leading-relaxed">{formData.address}</p>
                          </div>
                        </div>

                        {/* Client */}
                        <div className="p-6 bg-white/5 rounded-2xl border border-white/5 flex gap-4">
                          <div className="p-2 bg-circleTel-orange/10 rounded-lg h-fit">
                            <Building2 className="h-4 w-4 text-circleTel-orange" />
                          </div>
                          <div className="flex-1">
                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Client Account</span>
                            <p className="text-sm font-black text-white mt-1 uppercase tracking-wider">{formData.companyName}</p>
                            <div className="grid grid-cols-2 gap-4 mt-3 pt-3 border-t border-white/5">
                              <div>
                                <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Contact</span>
                                <p className="text-[10px] text-slate-300 font-bold">{formData.contactName || 'N/A'}</p>
                              </div>
                              <div>
                                <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Term</span>
                                <p className="text-[10px] text-slate-300 font-bold">{formData.contractTerm} Months</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Calculations Section */}
                      <div className="bg-black/30 rounded-2xl border border-white/5 p-8 flex flex-col">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-6">Commercial Summary</span>

                        <div className="space-y-4 flex-1">
                          {formData.selectedPackages.map(pkg => (
                            <div key={pkg.id} className="flex justify-between items-center group">
                              <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-circleTel-orange" />
                                <span className="text-xs font-bold text-slate-300 group-hover:text-white transition-colors capitalize">{pkg.name}</span>
                              </div>
                              <span className="text-xs font-black text-white tracking-widest">{formatPrice(pkg.price)}</span>
                            </div>
                          ))}
                        </div>

                        <div className="pt-6 mt-6 border-t border-white/10 space-y-4">
                          <div className="flex justify-between items-center">
                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">VAT (15%)</span>
                            <span className="text-xs font-black text-slate-300 tracking-widest">{formatPrice(totals.vat)}</span>
                          </div>
                          <div className="flex justify-between items-center bg-white/5 p-4 rounded-xl">
                            <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Monthly Total</span>
                            <span className="text-2xl font-black text-circleTel-orange tracking-tighter">{formatPrice(totals.total)}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-10">
                      <Button variant="ghost" onClick={prevStep} className="text-slate-500 hover:text-white uppercase tracking-widest text-[10px] font-black">
                        <ChevronLeft className="h-4 w-4 mr-2" />
                        Edit details
                      </Button>
                      <Button
                        onClick={generateQuote}
                        disabled={isLoading}
                        className="bg-circleTel-orange hover:bg-circleTel-bright-orange text-white px-16 h-14 rounded-xl font-black uppercase tracking-[.3em] text-[10px] shadow-[0_15px_40px_rgba(245,132,30,0.4)] relative group transition-all active:scale-95"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_2s_infinite] pointer-events-none" />
                        {isLoading ? (
                          <Loader2 className="h-5 w-5 animate-spin mr-3" />
                        ) : (
                          <Zap className="h-4 w-4 mr-3 text-white fill-white shadow-xl shadow-white/50" />
                        )}
                        Finalize Proposal
                      </Button>
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
