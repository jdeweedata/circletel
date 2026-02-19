'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';
import {
  MapPin,
  Building2,
  User,
  Mail,
  Phone,
  Wifi,
  Users,
  DollarSign,
  Shield,
  FileText,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  RefreshCcw,
  Download,
  ChevronRight,
  Sparkles,
  Zap,
  Globe,
  Signal,
  Router,
  Antenna,
  MousePointer,
  Navigation,
  List,
  Eye,
  ArrowLeft,
  Copy,
  Check,
  Clock,
  LayoutGrid,
  Layers
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { toast } from 'sonner';

// Import Single Site Stepper (to be created)
import { SingleSiteStepper } from './components/SingleSiteStepper';

// ============================================================================
// Types
// ============================================================================

interface CoverageDetail {
  available: boolean;
  technology?: string;
  maxSpeed?: number;
  products?: Array<{
    name: string;
    speed: number;
    price: number;
  }>;
  provider?: string;
  signalStrength?: string;
  estimatedSpeed?: number;
  distance?: number;
  baseStation?: string;
}

interface DetailedCoverage {
  fibre?: CoverageDetail;
  lte?: CoverageDetail;
  '5g'?: CoverageDetail;
  tarana?: CoverageDetail;
  starlink?: CoverageDetail;
}

interface MatchingProduct {
  id: string;
  name: string;
  speed: number;
  price: number;
  technology: string;
  provider: string;
  contention?: string;
}

interface SiteResult {
  address: string;
  coordinates?: { lat: number; lng: number };
  status: 'pending' | 'checking' | 'complete' | 'error' | 'partial';
  coverage?: DetailedCoverage;
  matchingProducts?: MatchingProduct[];
  recommendation?: string;
  error?: string;
}

interface FormData {
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  speed: number;
  contention: string;
  budget: string;
  failover: boolean;
  sites: string;
}

interface MapMarker {
  id: string;
  position: { lat: number; lng: number };
  address: string;
  status: 'pending' | 'geocoding' | 'checking' | 'complete' | 'error' | 'partial';
  lineNumber: number;
}

// Export types for use in stepper components
export type { CoverageDetail, DetailedCoverage, MatchingProduct, SiteResult };

// ============================================================================
// Constants
// ============================================================================

const speedOptions = [
  { value: 100, label: '100 Mbps', icon: Wifi },
  { value: 200, label: '200 Mbps', icon: Signal },
  { value: 500, label: '500 Mbps', icon: Router },
  { value: 1000, label: '1 Gbps', icon: Zap },
];

const contentionOptions = [
  { value: 'best-effort', label: 'Best Effort', description: 'Shared bandwidth' },
  { value: '10:1', label: '10:1', description: 'Business grade' },
  { value: 'dia', label: 'DIA', description: 'Dedicated Internet' },
];

const mapContainerStyle = {
  width: '100%',
  height: '100%',
};

const defaultCenter = { lat: -26.2041, lng: 28.0473 }; // Johannesburg

const mapOptions: google.maps.MapOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  mapTypeControl: true,
  streetViewControl: false,
  fullscreenControl: true,
  styles: [
    {
      featureType: 'poi',
      elementType: 'labels',
      stylers: [{ visibility: 'off' }],
    },
  ],
};

// Static libraries array to prevent Google Maps reload warning
const GOOGLE_MAPS_LIBRARIES: ('places')[] = ['places'];

// ============================================================================
// Helper Functions
// ============================================================================

const isGPSCoordinate = (text: string): boolean => {
  const gpsPattern = /^-?\d+\.?\d*\s*,\s*-?\d+\.?\d*$/;
  return gpsPattern.test(text.trim());
};

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

const parseSites = (sitesText: string): string[] => {
  return sitesText
    .split('\n')
    .map(s => s.trim())
    .filter(s => s.length > 0);
};

const getStatusColor = (status: string): string => {
  switch (status) {
    case 'complete': return '#22c55e'; // green
    case 'partial': return '#eab308'; // yellow
    case 'error': return '#ef4444'; // red
    case 'checking': return '#3b82f6'; // blue
    case 'geocoding': return '#8b5cf6'; // purple
    default: return '#6b7280'; // gray
  }
};

const getMarkerIcon = (status: string): google.maps.Symbol => ({
  path: google.maps.SymbolPath.CIRCLE,
  fillColor: getStatusColor(status),
  fillOpacity: 1,
  strokeColor: '#ffffff',
  strokeWeight: 2,
  scale: 10,
});

const getTechIcon = (tech: string) => {
  switch (tech.toLowerCase()) {
    case 'fibre': return <Globe className="h-4 w-4 text-blue-500" />;
    case 'lte': return <Signal className="h-4 w-4 text-green-500" />;
    case '5g': return <Zap className="h-4 w-4 text-purple-500" />;
    case 'tarana': return <Antenna className="h-4 w-4 text-orange-500" />;
    case 'starlink': return <Sparkles className="h-4 w-4 text-cyan-500" />;
    default: return <Wifi className="h-4 w-4 text-gray-500" />;
  }
};

// ============================================================================
// Main Component
// ============================================================================

export default function FeasibilityPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get mode from URL or default to 'single'
  const modeFromUrl = searchParams.get('mode');
  const [activeTab, setActiveTab] = useState<'single' | 'multiple'>(
    modeFromUrl === 'multiple' ? 'multiple' : 'single'
  );

  // Update URL when tab changes
  const handleTabChange = (value: string) => {
    const newMode = value as 'single' | 'multiple';
    setActiveTab(newMode);
    const params = new URLSearchParams(searchParams.toString());
    params.set('mode', newMode);
    router.push(`?${params.toString()}`, { scroll: false });
  };

  // ============================================================================
  // Multiple Sites Mode State (existing implementation)
  // ============================================================================

  // Form state
  const [formData, setFormData] = useState<FormData>({
    companyName: '',
    contactName: '',
    email: '',
    phone: '',
    speed: 100,
    contention: 'best-effort',
    budget: '',
    failover: false,
    sites: '',
  });

  // UI state
  const [step, setStep] = useState<'form' | 'checking' | 'results'>('form');
  const [isChecking, setIsChecking] = useState(false);
  const [siteResults, setSiteResults] = useState<SiteResult[]>([]);
  const [selectedSite, setSelectedSite] = useState<number | null>(null);
  const [isGeneratingQuotes, setIsGeneratingQuotes] = useState(false);
  const [generatedQuoteIds, setGeneratedQuoteIds] = useState<string[]>([]);

  // Map state
  const [markers, setMarkers] = useState<MapMarker[]>([]);
  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [mapZoom, setMapZoom] = useState(6);
  const mapRef = useRef<google.maps.Map | null>(null);
  const geocoderRef = useRef<google.maps.Geocoder | null>(null);

  // Load Google Maps
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries: GOOGLE_MAPS_LIBRARIES,
  });

  // Initialize geocoder when map loads
  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
    geocoderRef.current = new google.maps.Geocoder();
  }, []);

  // Parse sites and update markers with live geocoding
  useEffect(() => {
    if (activeTab !== 'multiple') return;

    const sites = parseSites(formData.sites);
    const newMarkers: MapMarker[] = [];

    sites.forEach((site, index) => {
      const coords = parseCoordinates(site);
      if (coords) {
        // Direct GPS coordinates
        newMarkers.push({
          id: `site-${index}`,
          position: coords,
          address: site,
          status: 'pending',
          lineNumber: index + 1,
        });
      } else if (site.length > 5 && geocoderRef.current) {
        // Address to geocode
        const existingMarker = markers.find(m => m.address === site);
        if (existingMarker) {
          newMarkers.push(existingMarker);
        } else {
          // Create placeholder marker
          const placeholderMarker: MapMarker = {
            id: `site-${index}`,
            position: defaultCenter,
            address: site,
            status: 'geocoding',
            lineNumber: index + 1,
          };
          newMarkers.push(placeholderMarker);

          // Geocode asynchronously
          geocoderRef.current.geocode({ address: `${site}, South Africa` }, (results, status) => {
            if (status === 'OK' && results && results[0]) {
              const location = results[0].geometry.location;
              setMarkers(prev => prev.map(m =>
                m.id === placeholderMarker.id
                  ? { ...m, position: { lat: location.lat(), lng: location.lng() }, status: 'pending' }
                  : m
              ));
            }
          });
        }
      }
    });

    if (newMarkers.length > 0) {
      setMarkers(newMarkers);
      // Fit bounds to show all markers
      if (mapRef.current && newMarkers.length > 0) {
        const validMarkers = newMarkers.filter(m => m.status !== 'geocoding');
        if (validMarkers.length > 0) {
          const bounds = new google.maps.LatLngBounds();
          validMarkers.forEach(m => bounds.extend(m.position));
          mapRef.current.fitBounds(bounds, 50);
        }
      }
    } else {
      setMarkers([]);
    }
  }, [formData.sites, activeTab]);

  // Handle map click to add GPS coordinates
  const onMapClick = useCallback((e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      const lat = e.latLng.lat().toFixed(6);
      const lng = e.latLng.lng().toFixed(6);
      const newCoord = `${lat}, ${lng}`;

      setFormData(prev => ({
        ...prev,
        sites: prev.sites ? `${prev.sites}\n${newCoord}` : newCoord,
      }));

      toast.success(`Location added: ${newCoord}`);
    }
  }, []);

  // Check feasibility for all sites
  const checkFeasibility = async () => {
    const sites = parseSites(formData.sites);
    if (sites.length === 0) {
      toast.error('No sites entered - please enter at least one address or GPS coordinate.');
      return;
    }

    setIsChecking(true);
    setStep('checking');

    // Initialize results
    const initialResults: SiteResult[] = sites.map(site => ({
      address: site,
      coordinates: parseCoordinates(site) || undefined,
      status: 'pending',
    }));
    setSiteResults(initialResults);

    // Check each site
    for (let i = 0; i < sites.length; i++) {
      const site = sites[i];

      // Update status to checking
      setSiteResults(prev => prev.map((r, idx) =>
        idx === i ? { ...r, status: 'checking' } : r
      ));
      setMarkers(prev => prev.map((m, idx) =>
        idx === i ? { ...m, status: 'checking' } : m
      ));

      try {
        // Prepare request body
        const coords = parseCoordinates(site);
        const requestBody = coords
          ? { coordinates: { lat: coords.lat, lng: coords.lng } }
          : { address: site };

        // Call coverage API
        const response = await fetch('/api/coverage/aggregate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          throw new Error(`Coverage check failed: ${response.statusText}`);
        }

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || 'Coverage check failed');
        }

        const apiData = result.data;
        const services = apiData.providers?.mtn?.services || [];

        // Process coverage data
        const coverage: DetailedCoverage = {};
        const matchingProducts: MatchingProduct[] = [];

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

        // Determine status based on coverage
        const hasCoverage = Object.values(coverage).some(c => c?.available);
        const status = hasCoverage ? 'complete' : 'error';

        // Generate recommendation
        let recommendation = '';
        if (coverage.fibre?.available) {
          recommendation = 'Fibre recommended for best performance';
        } else if (coverage.tarana?.available) {
          recommendation = 'Tarana wireless recommended';
        } else if (coverage['5g']?.available) {
          recommendation = '5G available as backup';
        } else if (coverage.lte?.available) {
          recommendation = 'LTE available as last resort';
        } else {
          recommendation = 'No coverage available at this location';
        }

        // Update results
        setSiteResults(prev => prev.map((r, idx) =>
          idx === i ? {
            ...r,
            status,
            coverage,
            matchingProducts,
            recommendation,
            coordinates: coords || r.coordinates,
          } : r
        ));
        setMarkers(prev => prev.map((m, idx) =>
          idx === i ? { ...m, status } : m
        ));

      } catch (error) {
        console.error(`Error checking site ${i}:`, error);
        setSiteResults(prev => prev.map((r, idx) =>
          idx === i ? {
            ...r,
            status: 'error',
            error: error instanceof Error ? error.message : 'Coverage check failed',
          } : r
        ));
        setMarkers(prev => prev.map((m, idx) =>
          idx === i ? { ...m, status: 'error' } : m
        ));
      }

      // Small delay between requests to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    setIsChecking(false);
    setStep('results');
  };

  // Retry a single site
  const retrySite = async (index: number) => {
    const site = siteResults[index];
    if (!site) return;

    setSiteResults(prev => prev.map((r, idx) =>
      idx === index ? { ...r, status: 'checking', error: undefined } : r
    ));
    setMarkers(prev => prev.map((m, idx) =>
      idx === index ? { ...m, status: 'checking' } : m
    ));

    try {
      const coords = parseCoordinates(site.address);
      const requestBody = coords
        ? { coordinates: { lat: coords.lat, lng: coords.lng } }
        : { address: site.address };

      const response = await fetch('/api/coverage/aggregate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) throw new Error('Coverage check failed');

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Coverage check failed');
      }

      const apiData = result.data;
      const services = apiData.providers?.mtn?.services || [];
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
        };
      }

      const hasCoverage = Object.values(coverage).some(c => c?.available);

      setSiteResults(prev => prev.map((r, idx) =>
        idx === index ? {
          ...r,
          status: hasCoverage ? 'complete' : 'error',
          coverage,
          error: hasCoverage ? undefined : 'No coverage available',
        } : r
      ));
      setMarkers(prev => prev.map((m, idx) =>
        idx === index ? { ...m, status: hasCoverage ? 'complete' : 'error' } : m
      ));
    } catch (error) {
      setSiteResults(prev => prev.map((r, idx) =>
        idx === index ? {
          ...r,
          status: 'error',
          error: 'Retry failed',
        } : r
      ));
      setMarkers(prev => prev.map((m, idx) =>
        idx === index ? { ...m, status: 'error' } : m
      ));
    }
  };

  // Generate quotes for all successful sites
  const generateQuotes = async () => {
    const validSites = siteResults.filter(s => s.status === 'complete');
    if (validSites.length === 0) {
      toast.error('No sites with coverage available for quote generation.');
      return;
    }

    setIsGeneratingQuotes(true);

    try {
      const response = await fetch('/api/quotes/business/bulk-create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: formData.companyName,
          contactName: formData.contactName,
          email: formData.email,
          phone: formData.phone,
          speed: formData.speed,
          contention: formData.contention,
          budget: formData.budget ? parseInt(formData.budget) : null,
          failover: formData.failover,
          sites: validSites.map(s => ({
            address: s.address,
            coordinates: s.coordinates,
            coverage: s.coverage,
          })),
        }),
      });

      if (!response.ok) throw new Error('Quote generation failed');

      const data = await response.json();
      setGeneratedQuoteIds(data.quoteIds || []);

      toast.success(`${data.quoteIds?.length || 0} quote(s) created successfully.`);
    } catch (error) {
      console.error('Error generating quotes:', error);
      toast.error('Failed to generate quotes. Please try again.');
    } finally {
      setIsGeneratingQuotes(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      companyName: '',
      contactName: '',
      email: '',
      phone: '',
      speed: 100,
      contention: 'best-effort',
      budget: '',
      failover: false,
      sites: '',
    });
    setStep('form');
    setSiteResults([]);
    setMarkers([]);
    setSelectedSite(null);
    setGeneratedQuoteIds([]);
  };

  // Site count
  const siteCount = parseSites(formData.sites).length;
  const completedCount = siteResults.filter(s => s.status === 'complete').length;
  const errorCount = siteResults.filter(s => s.status === 'error').length;

  // Map loading error
  if (loadError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900">Failed to load Google Maps</h2>
          <p className="text-gray-500 mt-2">Please check your API key configuration.</p>
        </div>
      </div>
    );
  }

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <div className="h-[calc(100vh-80px)] flex flex-col">
      {/* Header with Tab Toggle */}
      <div className="bg-white border-b px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <MapPin className="h-6 w-6 text-circleTel-orange" />
              Sales Feasibility Portal
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Check coverage and generate quotes for B2B customers
            </p>
          </div>
        </div>

        {/* Tab Toggle */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="single" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Single Site
            </TabsTrigger>
            <TabsTrigger value="multiple" className="flex items-center gap-2">
              <Layers className="h-4 w-4" />
              Multiple Sites
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'single' ? (
          // Single Site Mode - Stepper Wizard
          <SingleSiteStepper />
        ) : (
          // Multiple Sites Mode - Split Map View (existing implementation)
          <div className="h-full flex flex-col lg:flex-row">
            {/* Left Panel - Form (40%) */}
            <div className="w-full lg:w-[40%] h-full overflow-y-auto bg-gradient-to-br from-ui-bg via-white to-circleTel-orange/5">
              <div className="p-6 space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      Bulk Feasibility Check
                    </h2>
                    <p className="text-sm text-gray-500">
                      Enter multiple addresses or GPS coordinates
                    </p>
                  </div>
                  {step !== 'form' && (
                    <Button variant="outline" size="sm" onClick={resetForm}>
                      <ArrowLeft className="h-4 w-4 mr-1" />
                      New Check
                    </Button>
                  )}
                </div>

                {/* Form Step */}
                <AnimatePresence mode="wait">
                  {step === 'form' && (
                    <motion.div
                      key="form"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-6"
                    >
                      {/* Client Details */}
                      <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-circleTel-orange" />
                          Client Details
                        </h3>
                        <div className="grid grid-cols-1 gap-3">
                          <Input
                            placeholder="Company Name *"
                            value={formData.companyName}
                            onChange={(e) => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
                          />
                          <Input
                            placeholder="Contact Name"
                            value={formData.contactName}
                            onChange={(e) => setFormData(prev => ({ ...prev, contactName: e.target.value }))}
                          />
                          <div className="grid grid-cols-2 gap-3">
                            <Input
                              type="email"
                              placeholder="Email"
                              value={formData.email}
                              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                            />
                            <Input
                              type="tel"
                              placeholder="Phone"
                              value={formData.phone}
                              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Service Requirements */}
                      <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide flex items-center gap-2">
                          <Wifi className="h-4 w-4 text-circleTel-orange" />
                          Service Requirements
                        </h3>

                        {/* Speed Options */}
                        <div className="space-y-2">
                          <label className="text-xs text-gray-500 uppercase">Speed Required</label>
                          <div className="grid grid-cols-4 gap-2">
                            {speedOptions.map((opt) => {
                              const Icon = opt.icon;
                              return (
                                <button
                                  key={opt.value}
                                  onClick={() => setFormData(prev => ({ ...prev, speed: opt.value }))}
                                  className={`p-3 rounded-lg border-2 transition-all text-center ${
                                    formData.speed === opt.value
                                      ? 'border-circleTel-orange bg-circleTel-orange/10 text-circleTel-orange'
                                      : 'border-gray-200 hover:border-gray-300'
                                  }`}
                                >
                                  <Icon className="h-5 w-5 mx-auto mb-1" />
                                  <span className="text-xs font-medium">{opt.label}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Contention Options */}
                        <div className="space-y-2">
                          <label className="text-xs text-gray-500 uppercase">Contention Ratio</label>
                          <div className="grid grid-cols-3 gap-2">
                            {contentionOptions.map((opt) => (
                              <button
                                key={opt.value}
                                onClick={() => setFormData(prev => ({ ...prev, contention: opt.value }))}
                                className={`p-3 rounded-lg border-2 transition-all ${
                                  formData.contention === opt.value
                                    ? 'border-circleTel-orange bg-circleTel-orange/10'
                                    : 'border-gray-200 hover:border-gray-300'
                                }`}
                              >
                                <span className={`text-sm font-semibold ${formData.contention === opt.value ? 'text-circleTel-orange' : ''}`}>
                                  {opt.label}
                                </span>
                                <p className="text-xs text-gray-500">{opt.description}</p>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Budget & Failover */}
                        <div className="flex gap-3 items-start">
                          <div className="flex-1">
                            <Input
                              type="number"
                              placeholder="Budget per site (R)"
                              value={formData.budget}
                              onChange={(e) => setFormData(prev => ({ ...prev, budget: e.target.value }))}
                            />
                          </div>
                          <label className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                            <Checkbox
                              checked={formData.failover}
                              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, failover: !!checked }))}
                            />
                            <span className="text-sm">
                              <Shield className="h-4 w-4 inline mr-1 text-green-600" />
                              Failover
                            </span>
                          </label>
                        </div>
                      </div>

                      {/* Sites */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-circleTel-orange" />
                            Sites to Check
                          </h3>
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                            {siteCount} site{siteCount !== 1 ? 's' : ''}
                          </span>
                        </div>
                        <div className="relative">
                          <Textarea
                            placeholder="Enter addresses or GPS coordinates (one per line)&#10;&#10;Examples:&#10;123 Main Street, Sandton&#10;-26.107567, 28.056702"
                            value={formData.sites}
                            onChange={(e) => setFormData(prev => ({ ...prev, sites: e.target.value }))}
                            rows={8}
                            className="font-mono text-sm"
                          />
                          <div className="absolute bottom-2 right-2 flex gap-1">
                            <button
                              onClick={() => setFormData(prev => ({ ...prev, sites: '' }))}
                              className="p-1 text-gray-400 hover:text-gray-600 rounded"
                              title="Clear all"
                            >
                              <XCircle className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <MousePointer className="h-3 w-3" />
                          Tip: Click on the map to add GPS coordinates
                        </p>
                      </div>

                      {/* Submit Button */}
                      <Button
                        onClick={checkFeasibility}
                        disabled={siteCount === 0 || !formData.companyName}
                        className="w-full bg-circleTel-orange hover:bg-circleTel-orange/90 text-white py-6 text-lg font-semibold"
                      >
                        <Sparkles className="h-5 w-5 mr-2" />
                        Check Feasibility ({siteCount} site{siteCount !== 1 ? 's' : ''})
                      </Button>
                    </motion.div>
                  )}

                  {/* Checking Step */}
                  {step === 'checking' && (
                    <motion.div
                      key="checking"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-4"
                    >
                      <div className="text-center py-8">
                        <Loader2 className="h-12 w-12 animate-spin text-circleTel-orange mx-auto mb-4" />
                        <h2 className="text-xl font-semibold text-gray-900">Checking Coverage</h2>
                        <p className="text-gray-500 mt-2">
                          {completedCount + errorCount} of {siteResults.length} sites checked
                        </p>
                      </div>

                      <div className="space-y-2 max-h-[400px] overflow-y-auto">
                        {siteResults.map((result, index) => (
                          <div
                            key={index}
                            className={`p-3 rounded-lg border flex items-center gap-3 ${
                              result.status === 'checking' ? 'bg-blue-50 border-blue-200' :
                              result.status === 'complete' ? 'bg-green-50 border-green-200' :
                              result.status === 'error' ? 'bg-red-50 border-red-200' :
                              'bg-gray-50 border-gray-200'
                            }`}
                          >
                            <span className="text-xs font-mono text-gray-400 w-6">{index + 1}</span>
                            {result.status === 'checking' ? (
                              <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                            ) : result.status === 'complete' ? (
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                            ) : result.status === 'error' ? (
                              <XCircle className="h-4 w-4 text-red-500" />
                            ) : (
                              <Clock className="h-4 w-4 text-gray-400" />
                            )}
                            <span className="text-sm flex-1 truncate">{result.address}</span>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {/* Results Step */}
                  {step === 'results' && (
                    <motion.div
                      key="results"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-4"
                    >
                      {/* Summary */}
                      <div className="grid grid-cols-3 gap-3">
                        <div className="p-3 rounded-lg bg-green-50 border border-green-200 text-center">
                          <CheckCircle2 className="h-6 w-6 text-green-500 mx-auto mb-1" />
                          <span className="text-2xl font-bold text-green-700">{completedCount}</span>
                          <p className="text-xs text-green-600">Coverage Found</p>
                        </div>
                        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-center">
                          <XCircle className="h-6 w-6 text-red-500 mx-auto mb-1" />
                          <span className="text-2xl font-bold text-red-700">{errorCount}</span>
                          <p className="text-xs text-red-600">No Coverage</p>
                        </div>
                        <div className="p-3 rounded-lg bg-gray-50 border border-gray-200 text-center">
                          <MapPin className="h-6 w-6 text-gray-500 mx-auto mb-1" />
                          <span className="text-2xl font-bold text-gray-700">{siteResults.length}</span>
                          <p className="text-xs text-gray-600">Total Sites</p>
                        </div>
                      </div>

                      {/* Site Results List */}
                      <div className="space-y-2 max-h-[350px] overflow-y-auto">
                        {siteResults.map((result, index) => (
                          <div
                            key={index}
                            onClick={() => setSelectedSite(selectedSite === index ? null : index)}
                            className={`p-3 rounded-lg border cursor-pointer transition-all ${
                              selectedSite === index ? 'border-circleTel-orange bg-circleTel-orange/5' :
                              result.status === 'complete' ? 'border-green-200 bg-green-50 hover:border-green-300' :
                              result.status === 'error' ? 'border-red-200 bg-red-50 hover:border-red-300' :
                              'border-gray-200 bg-gray-50 hover:border-gray-300'
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex items-start gap-2">
                                <span className="text-xs font-mono text-gray-400 mt-0.5">{index + 1}</span>
                                {result.status === 'complete' ? (
                                  <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                                ) : (
                                  <XCircle className="h-4 w-4 text-red-500 mt-0.5" />
                                )}
                                <div>
                                  <p className="text-sm font-medium">{result.address}</p>
                                  {result.recommendation && (
                                    <p className="text-xs text-gray-500 mt-1">{result.recommendation}</p>
                                  )}
                                </div>
                              </div>
                              {result.status === 'error' && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => { e.stopPropagation(); retrySite(index); }}
                                >
                                  <RefreshCcw className="h-3 w-3" />
                                </Button>
                              )}
                            </div>

                            {/* Expanded Details */}
                            {selectedSite === index && result.coverage && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                className="mt-3 pt-3 border-t"
                              >
                                <div className="grid grid-cols-2 gap-2">
                                  {Object.entries(result.coverage).map(([tech, details]) => (
                                    details?.available && (
                                      <div key={tech} className="flex items-center gap-2 text-xs">
                                        {getTechIcon(tech)}
                                        <span className="capitalize">{tech}</span>
                                        {details.provider && (
                                          <span className="text-gray-400">({details.provider})</span>
                                        )}
                                      </div>
                                    )
                                  ))}
                                </div>
                              </motion.div>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Actions */}
                      <div className="space-y-3 pt-4 border-t">
                        {generatedQuoteIds.length > 0 ? (
                          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <CheckCircle2 className="h-5 w-5 text-green-500" />
                              <span className="font-semibold text-green-700">
                                {generatedQuoteIds.length} Quote(s) Generated
                              </span>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open('/admin/quotes', '_blank')}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View Quotes
                            </Button>
                          </div>
                        ) : (
                          <Button
                            onClick={generateQuotes}
                            disabled={completedCount === 0 || isGeneratingQuotes}
                            className="w-full bg-circleTel-orange hover:bg-circleTel-orange/90 text-white py-4"
                          >
                            {isGeneratingQuotes ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                Generating Quotes...
                              </>
                            ) : (
                              <>
                                <FileText className="h-4 w-4 mr-2" />
                                Generate Quotes ({completedCount} site{completedCount !== 1 ? 's' : ''})
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Right Panel - Map (60%) */}
            <div className="w-full lg:w-[60%] h-[400px] lg:h-full relative">
              {!isLoaded ? (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                  <Loader2 className="h-8 w-8 animate-spin text-circleTel-orange" />
                </div>
              ) : (
                <GoogleMap
                  mapContainerStyle={mapContainerStyle}
                  center={mapCenter}
                  zoom={mapZoom}
                  options={mapOptions}
                  onLoad={onMapLoad}
                  onClick={onMapClick}
                >
                  {markers.map((marker) => (
                    marker.status !== 'geocoding' && (
                      <Marker
                        key={marker.id}
                        position={marker.position}
                        icon={getMarkerIcon(marker.status)}
                        label={{
                          text: marker.lineNumber.toString(),
                          color: '#ffffff',
                          fontSize: '10px',
                          fontWeight: 'bold',
                        }}
                        onClick={() => {
                          const index = siteResults.findIndex(s => s.address === marker.address);
                          if (index >= 0) setSelectedSite(index);
                        }}
                      />
                    )
                  ))}
                </GoogleMap>
              )}

              {/* Map Legend */}
              <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur rounded-lg shadow-lg p-3">
                <p className="text-xs font-semibold text-gray-700 mb-2">Legend</p>
                <div className="space-y-1 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                    <span>Coverage Available</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <span>No Coverage</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500" />
                    <span>Checking...</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-gray-500" />
                    <span>Pending</span>
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-2 pt-2 border-t">
                  Click map to add location
                </p>
              </div>

              {/* Site Count Overlay */}
              <div className="absolute top-4 right-4 bg-white/95 backdrop-blur rounded-lg shadow-lg px-4 py-2">
                <span className="text-sm font-semibold text-gray-700">
                  {markers.filter(m => m.status !== 'geocoding').length} pin{markers.filter(m => m.status !== 'geocoding').length !== 1 ? 's' : ''} on map
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
