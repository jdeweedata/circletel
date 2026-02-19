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
  ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import type { CoverageDetail, DetailedCoverage } from '../page';

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

  // Setup autocomplete on input
  useEffect(() => {
    if (isLoaded && inputRef.current && !autocompleteRef.current) {
      autocompleteRef.current = new google.maps.places.Autocomplete(inputRef.current, {
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

      const data = await response.json();

      // Build coverage object
      const coverage: DetailedCoverage = {};

      if (data.mtn?.available || data.fibre?.available) {
        coverage.fibre = {
          available: true,
          technology: 'Fibre',
          provider: 'MTN',
          products: data.mtn?.products || data.fibre?.products || [],
        };
      }
      if (data.lte?.available) {
        coverage.lte = {
          available: true,
          technology: 'LTE',
          provider: data.lte.provider || 'Multiple',
        };
      }
      if (data['5g']?.available) {
        coverage['5g'] = {
          available: true,
          technology: '5G',
          provider: data['5g'].provider || 'Multiple',
        };
      }
      if (data.tarana?.available || data.wireless?.available) {
        coverage.tarana = {
          available: true,
          technology: 'Tarana',
          provider: 'CircleTel',
          distance: data.tarana?.distance,
          baseStation: data.tarana?.baseStation,
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
        const packagesRes = await fetch(`/api/coverage/packages?leadId=${data.leadId}&coverageType=business`);
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
    <div className="h-full flex flex-col bg-gradient-to-br from-ui-bg via-white to-circleTel-orange/5">
      {/* Progress Bar */}
      <div className="bg-white border-b px-6 py-4">
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
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                        isComplete
                          ? 'bg-green-500 text-white'
                          : isActive
                          ? 'bg-circleTel-orange text-white'
                          : 'bg-gray-200 text-gray-500'
                      }`}
                    >
                      {isComplete ? (
                        <CheckCircle2 className="h-5 w-5" />
                      ) : (
                        <Icon className="h-5 w-5" />
                      )}
                    </div>
                    <span
                      className={`text-xs mt-1 font-medium ${
                        isActive ? 'text-circleTel-orange' : isComplete ? 'text-green-600' : 'text-gray-500'
                      }`}
                    >
                      {step.title}
                    </span>
                  </div>
                  {!isLast && (
                    <div
                      className={`flex-1 h-1 mx-2 rounded ${
                        isComplete ? 'bg-green-500' : 'bg-gray-200'
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
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Enter Site Address</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Search for an address or click on the map to select a location
                  </p>
                </div>

                {/* Toggle GPS/Address */}
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={!formData.useGPS}
                      onChange={() => setFormData(prev => ({ ...prev, useGPS: false }))}
                      className="text-circleTel-orange"
                    />
                    <span className="text-sm">Search Address</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={formData.useGPS}
                      onChange={() => setFormData(prev => ({ ...prev, useGPS: true }))}
                      className="text-circleTel-orange"
                    />
                    <span className="text-sm">Enter GPS Coordinates</span>
                  </label>
                </div>

                {/* Address/GPS Input */}
                {formData.useGPS ? (
                  <Input
                    placeholder="Enter GPS coordinates (e.g., -26.2041, 28.0473)"
                    value={formData.gpsInput}
                    onChange={(e) => handleGPSInputChange(e.target.value)}
                    className="font-mono"
                  />
                ) : (
                  <Input
                    ref={inputRef}
                    placeholder="Start typing an address..."
                    value={formData.address}
                    onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  />
                )}

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

                {/* Selected Location Info */}
                {formData.coordinates && (
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium text-gray-700">Selected Location:</p>
                    <p className="text-sm text-gray-600 mt-1">{formData.address || 'Address pending...'}</p>
                    <p className="text-xs text-gray-400 mt-1 font-mono">
                      {formData.coordinates.lat.toFixed(6)}, {formData.coordinates.lng.toFixed(6)}
                    </p>
                  </div>
                )}

                {/* Check Coverage Button */}
                <Button
                  onClick={checkCoverage}
                  disabled={isLoading || (!formData.coordinates && !formData.address)}
                  className="w-full bg-circleTel-orange hover:bg-circleTel-orange/90 text-white py-4"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Checking Coverage...
                    </>
                  ) : (
                    <>
                      <Search className="h-4 w-4 mr-2" />
                      Check Coverage
                    </>
                  )}
                </Button>
              </motion.div>
            )}

            {/* Step 2: Coverage Results */}
            {currentStep === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Coverage Results</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Available technologies at {formData.address}
                  </p>
                </div>

                {/* Coverage Summary */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {formData.coverage && Object.entries(formData.coverage).map(([tech, details]) => (
                    <div
                      key={tech}
                      className={`p-4 rounded-lg border-2 ${
                        details?.available
                          ? 'border-green-200 bg-green-50'
                          : 'border-gray-200 bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        {getTechIcon(tech)}
                        <span className="font-medium capitalize">{tech}</span>
                      </div>
                      {details?.available ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-gray-400" />
                      )}
                      {details?.provider && (
                        <p className="text-xs text-gray-500 mt-1">{details.provider}</p>
                      )}
                    </div>
                  ))}
                </div>

                {/* Available Packages */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Packages</h3>
                  <div className="space-y-3">
                    {availablePackages.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>Loading packages...</p>
                      </div>
                    ) : (
                      availablePackages.map((pkg) => {
                        const isSelected = formData.selectedPackages.some(p => p.id === pkg.id);
                        return (
                          <div
                            key={pkg.id}
                            onClick={() => togglePackage(pkg, 'primary')}
                            className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                              isSelected
                                ? 'border-circleTel-orange bg-circleTel-orange/5'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <Checkbox checked={isSelected} />
                                <div>
                                  <div className="flex items-center gap-2">
                                    {getTechIcon(pkg.service_type || pkg.product_category)}
                                    <span className="font-medium">{pkg.name}</span>
                                  </div>
                                  <p className="text-sm text-gray-500">
                                    {pkg.speed_down} Mbps down / {pkg.speed_up} Mbps up
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-semibold text-lg">{formatPrice(pkg.price)}</p>
                                <p className="text-xs text-gray-500">/month</p>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Selected Summary */}
                {formData.selectedPackages.length > 0 && (
                  <div className="p-4 bg-circleTel-orange/10 rounded-lg border border-circleTel-orange/20">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">
                        {formData.selectedPackages.length} package(s) selected
                      </span>
                      <span className="font-bold text-lg">
                        {formatPrice(totals.monthly)}/mo
                      </span>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* Step 3: Package Confirmation - Combined with Step 2 for simplicity */}
            {currentStep === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Confirm Package Selection</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Review your selected packages before proceeding
                  </p>
                </div>

                <div className="space-y-3">
                  {formData.selectedPackages.map((pkg, index) => (
                    <div key={pkg.id} className="p-4 rounded-lg border bg-white">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            {getTechIcon(pkg.technology)}
                            <span className="font-medium">{pkg.name}</span>
                            <span className="text-xs bg-gray-100 px-2 py-0.5 rounded capitalize">
                              {pkg.itemType}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500 mt-1">
                            {pkg.speed} Mbps • {pkg.provider}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{formatPrice(pkg.price)}/mo</p>
                          {pkg.installationFee > 0 && (
                            <p className="text-xs text-gray-500">
                              +{formatPrice(pkg.installationFee)} install
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Totals */}
                <div className="p-4 bg-gray-50 rounded-lg space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Monthly Subtotal</span>
                    <span>{formatPrice(totals.monthly)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>VAT (15%)</span>
                    <span>{formatPrice(totals.vat)}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-lg pt-2 border-t">
                    <span>Monthly Total</span>
                    <span>{formatPrice(totals.total)}</span>
                  </div>
                  {totals.installation > 0 && (
                    <div className="flex justify-between text-sm text-gray-500">
                      <span>One-time Installation</span>
                      <span>{formatPrice(totals.installation)}</span>
                    </div>
                  )}
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
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Client Details</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Enter the client's business information
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Label>Company Name *</Label>
                    <Input
                      placeholder="Acme Corporation"
                      value={formData.companyName}
                      onChange={(e) => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label>Contact Name</Label>
                    <Input
                      placeholder="John Smith"
                      value={formData.contactName}
                      onChange={(e) => setFormData(prev => ({ ...prev, contactName: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label>Phone</Label>
                    <Input
                      type="tel"
                      placeholder="082 123 4567"
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label>Email</Label>
                    <Input
                      type="email"
                      placeholder="john@acme.com"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    />
                  </div>
                </div>

                {/* Contract Term */}
                <div>
                  <Label>Contract Term</Label>
                  <RadioGroup
                    value={formData.contractTerm.toString()}
                    onValueChange={(v) => setFormData(prev => ({ ...prev, contractTerm: parseInt(v) as 12 | 24 | 36 }))}
                    className="flex gap-4 mt-2"
                  >
                    {contractTermOptions.map((opt) => (
                      <label
                        key={opt.value}
                        className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer ${
                          formData.contractTerm === opt.value
                            ? 'border-circleTel-orange bg-circleTel-orange/5'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <RadioGroupItem value={opt.value.toString()} />
                        <span>{opt.label}</span>
                      </label>
                    ))}
                  </RadioGroup>
                </div>

                {/* Additional Options */}
                <div className="flex gap-4">
                  <div className="flex-1">
                    <Label>Budget (Optional)</Label>
                    <Input
                      type="number"
                      placeholder="R 5,000"
                      value={formData.budget}
                      onChange={(e) => setFormData(prev => ({ ...prev, budget: e.target.value }))}
                    />
                  </div>
                  <div className="flex items-end pb-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        checked={formData.failover}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, failover: !!checked }))}
                      />
                      <span className="text-sm flex items-center gap-1">
                        <Shield className="h-4 w-4 text-green-600" />
                        Failover Required
                      </span>
                    </label>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <Label>Additional Notes</Label>
                  <Textarea
                    placeholder="Any special requirements or notes..."
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    rows={3}
                  />
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
                className="space-y-6"
              >
                {generatedQuoteId ? (
                  // Success State
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle2 className="h-8 w-8 text-green-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">Quote Generated!</h2>
                    <p className="text-gray-500 mt-2">
                      Your quote has been created successfully.
                    </p>
                    <div className="mt-6 space-y-3">
                      <Button
                        onClick={() => window.open(`/admin/quotes/${generatedQuoteId}`, '_blank')}
                        className="bg-circleTel-orange hover:bg-circleTel-orange/90"
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        View Quote
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
                        className="ml-2"
                      >
                        Start New Quote
                      </Button>
                    </div>
                  </div>
                ) : (
                  // Review State
                  <>
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">Review & Generate Quote</h2>
                      <p className="text-sm text-gray-500 mt-1">
                        Please review all details before generating the quote
                      </p>
                    </div>

                    {/* Location Summary */}
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h3 className="font-medium text-gray-700 flex items-center gap-2 mb-2">
                        <MapPin className="h-4 w-4 text-circleTel-orange" />
                        Location
                      </h3>
                      <p className="text-sm">{formData.address}</p>
                    </div>

                    {/* Client Summary */}
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h3 className="font-medium text-gray-700 flex items-center gap-2 mb-2">
                        <Building2 className="h-4 w-4 text-circleTel-orange" />
                        Client
                      </h3>
                      <div className="text-sm space-y-1">
                        <p><strong>{formData.companyName}</strong></p>
                        {formData.contactName && <p>{formData.contactName}</p>}
                        {formData.email && <p>{formData.email}</p>}
                        {formData.phone && <p>{formData.phone}</p>}
                      </div>
                    </div>

                    {/* Packages Summary */}
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h3 className="font-medium text-gray-700 flex items-center gap-2 mb-2">
                        <Package className="h-4 w-4 text-circleTel-orange" />
                        Packages ({formData.selectedPackages.length})
                      </h3>
                      <div className="space-y-2">
                        {formData.selectedPackages.map((pkg) => (
                          <div key={pkg.id} className="flex justify-between text-sm">
                            <span>{pkg.name}</span>
                            <span className="font-medium">{formatPrice(pkg.price)}/mo</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Totals */}
                    <div className="p-4 bg-circleTel-orange/10 rounded-lg border border-circleTel-orange/20">
                      <div className="flex justify-between text-sm mb-1">
                        <span>Monthly + VAT</span>
                        <span className="font-bold text-lg">{formatPrice(totals.total)}</span>
                      </div>
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>Contract Term</span>
                        <span>{formData.contractTerm} months</span>
                      </div>
                    </div>

                    {/* Generate Button */}
                    <Button
                      onClick={generateQuote}
                      disabled={isLoading}
                      className="w-full bg-circleTel-orange hover:bg-circleTel-orange/90 text-white py-6 text-lg font-semibold"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin mr-2" />
                          Generating Quote...
                        </>
                      ) : (
                        <>
                          <FileText className="h-5 w-5 mr-2" />
                          Generate Quote
                        </>
                      )}
                    </Button>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Navigation Footer */}
      {!generatedQuoteId && (
        <div className="bg-white border-t px-6 py-4">
          <div className="max-w-4xl mx-auto flex justify-between">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 1}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back
            </Button>

            {currentStep < 5 && (
              <Button
                onClick={nextStep}
                disabled={!canProceed()}
                className="bg-circleTel-orange hover:bg-circleTel-orange/90"
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
