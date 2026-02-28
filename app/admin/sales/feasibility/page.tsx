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
  Layers,
  Package
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { toast } from 'sonner';

// Import Single Site Stepper (to be created)
import { SingleSiteStepper } from './components/SingleSiteStepper';
import { EmailParseModal } from './components/EmailParseModal';
import { mapDarkStyle } from './components/MapStyles';

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

interface ServicePackage {
  id: string;
  name: string;
  service_type: string;
  product_category?: string;
  speed_down: number;
  speed_up: number;
  price: number;
  installation_fee?: number;
  provider?: string;
  features?: string[];
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
  styles: mapDarkStyle,
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

  // Package selection state
  const [availablePackages, setAvailablePackages] = useState<ServicePackage[]>([]);
  const [sitePackageSelections, setSitePackageSelections] = useState<Record<number, string>>({});
  const [isLoadingPackages, setIsLoadingPackages] = useState(false);

  // Email parse modal state
  const [isEmailParseOpen, setIsEmailParseOpen] = useState(false);

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

  // Fetch available business packages and auto-assign best-fit per site
  const fetchAndAssignPackages = async (results: SiteResult[]) => {
    setIsLoadingPackages(true);
    try {
      // Fetch all active business packages
      const res = await fetch('/api/admin/products?active=true&customer_type=business');
      if (!res.ok) throw new Error('Failed to fetch packages');
      const data = await res.json();
      const packages: ServicePackage[] = data.products || data || [];
      setAvailablePackages(packages);

      // Auto-assign best-fit package per site based on speed requirement and coverage
      const selections: Record<number, string> = {};
      results.forEach((result, index) => {
        if (result.status !== 'complete' || !result.coverage) return;

        // Determine best technology available at this site
        const coverageTechs = Object.entries(result.coverage)
          .filter(([, detail]) => detail?.available)
          .map(([tech]) => tech);

        // Filter packages matching available technologies and speed requirement
        const matchingPackages = packages.filter(pkg => {
          const pkgType = (pkg.service_type || '').toLowerCase();
          const pkgCategory = (pkg.product_category || '').toLowerCase();
          const hasMatchingTech = coverageTechs.some(tech => {
            if (tech === 'fibre') return pkgType.includes('fibre') || pkgCategory.includes('fibre');
            if (tech === 'tarana') return pkgType.includes('skyfibre') || pkgType.includes('wireless') || pkgCategory.includes('wireless');
            if (tech === 'lte') return pkgType.includes('lte') || pkgCategory.includes('lte');
            if (tech === '5g') return pkgType.includes('5g') || pkgCategory.includes('5g');
            return false;
          });
          return hasMatchingTech && pkg.speed_down >= formData.speed;
        });

        // Pick cheapest that meets speed requirement, or cheapest overall if none meet speed
        const sorted = matchingPackages.sort((a, b) => a.price - b.price);
        if (sorted.length > 0) {
          selections[index] = sorted[0].id;
        } else {
          // Fallback: cheapest package with matching tech regardless of speed
          const fallback = packages
            .filter(pkg => {
              const pkgType = (pkg.service_type || '').toLowerCase();
              const pkgCategory = (pkg.product_category || '').toLowerCase();
              return coverageTechs.some(tech => {
                if (tech === 'fibre') return pkgType.includes('fibre') || pkgCategory.includes('fibre');
                if (tech === 'tarana') return pkgType.includes('skyfibre') || pkgType.includes('wireless') || pkgCategory.includes('wireless');
                if (tech === 'lte') return pkgType.includes('lte') || pkgCategory.includes('lte');
                if (tech === '5g') return pkgType.includes('5g') || pkgCategory.includes('5g');
                return false;
              });
            })
            .sort((a, b) => a.price - b.price);
          if (fallback.length > 0) {
            selections[index] = fallback[0].id;
          }
        }
      });
      setSitePackageSelections(selections);
    } catch (error) {
      console.error('Failed to fetch packages:', error);
      toast.error('Failed to load packages. You can still retry.');
    } finally {
      setIsLoadingPackages(false);
    }
  };

  // Check a single site's coverage (extracted for parallel use)
  const checkSingleSite = async (index: number, site: string): Promise<SiteResult> => {
    // Update status to checking
    setSiteResults(prev => prev.map((r, idx) =>
      idx === index ? { ...r, status: 'checking' } : r
    ));
    setMarkers(prev => prev.map((m, idx) =>
      idx === index ? { ...m, status: 'checking' } : m
    ));

    try {
      const coords = parseCoordinates(site);
      const requestBody = coords
        ? { coordinates: { lat: coords.lat, lng: coords.lng } }
        : { address: site };

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
      const coverage: DetailedCoverage = {};

      // Check for Fibre (MTN)
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
      const dfaServices = apiData.providers?.dfa?.services || [];
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

      const hasCoverage = Object.values(coverage).some(c => c?.available);
      const status: SiteResult['status'] = hasCoverage ? 'complete' : 'error';

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

      const siteResult: SiteResult = {
        address: site,
        coordinates: coords || undefined,
        status,
        coverage,
        matchingProducts: [],
        recommendation,
      };

      setSiteResults(prev => prev.map((r, idx) => idx === index ? siteResult : r));
      setMarkers(prev => prev.map((m, idx) => idx === index ? { ...m, status } : m));

      return siteResult;
    } catch (error) {
      console.error(`Error checking site ${index}:`, error);
      const errorResult: SiteResult = {
        address: site,
        coordinates: parseCoordinates(site) || undefined,
        status: 'error',
        error: error instanceof Error ? error.message : 'Coverage check failed',
      };
      setSiteResults(prev => prev.map((r, idx) => idx === index ? errorResult : r));
      setMarkers(prev => prev.map((m, idx) => idx === index ? { ...m, status: 'error' } : m));
      return errorResult;
    }
  };

  // Check feasibility for all sites (parallel batches of 3)
  const checkFeasibility = async () => {
    const sites = parseSites(formData.sites);
    if (sites.length === 0) {
      toast.error('No sites entered - please enter at least one address or GPS coordinate.');
      return;
    }

    setIsChecking(true);
    setStep('checking');
    setAvailablePackages([]);
    setSitePackageSelections({});

    // Initialize results
    const initialResults: SiteResult[] = sites.map(site => ({
      address: site,
      coordinates: parseCoordinates(site) || undefined,
      status: 'pending',
    }));
    setSiteResults(initialResults);

    // Process in parallel batches of 3
    const BATCH_SIZE = 3;
    const allResults: SiteResult[] = [...initialResults];

    for (let i = 0; i < sites.length; i += BATCH_SIZE) {
      const batch = sites.slice(i, i + BATCH_SIZE);
      const batchResults = await Promise.all(
        batch.map((site, batchIdx) => checkSingleSite(i + batchIdx, site))
      );
      batchResults.forEach((result, batchIdx) => {
        allResults[i + batchIdx] = result;
      });
      // Small delay between batches to respect rate limits
      if (i + BATCH_SIZE < sites.length) {
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    }

    setIsChecking(false);
    setStep('results');

    // Auto-fetch packages and assign best-fit
    await fetchAndAssignPackages(allResults);
  };

  // Retry a single site (reuses checkSingleSite)
  const retrySite = async (index: number) => {
    const site = siteResults[index];
    if (!site) return;
    const result = await checkSingleSite(index, site.address);
    // Re-assign package if coverage found
    if (result.status === 'complete' && availablePackages.length > 0) {
      await fetchAndAssignPackages(siteResults.map((r, i) => i === index ? result : r));
    }
  };

  // Generate quotes for all successful sites with selected packages
  const generateQuotes = async () => {
    // Filter sites with coverage AND a selected package
    const sitesWithPackages = siteResults
      .map((result, index) => ({ result, index }))
      .filter(({ result, index }) =>
        result.status === 'complete' && sitePackageSelections[index]
      );

    if (sitesWithPackages.length === 0) {
      toast.error('No sites with packages selected. Please select a package for at least one site.');
      return;
    }

    setIsGeneratingQuotes(true);

    try {
      const response = await fetch('/api/quotes/business/bulk-create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientDetails: {
            companyName: formData.companyName,
            contactName: formData.contactName || undefined,
            contactEmail: formData.email || undefined,
            contactPhone: formData.phone || undefined,
          },
          requirements: {
            speedRequirement: String(formData.speed),
            contention: formData.contention,
            contractTerm: 24,
          },
          sites: sitesWithPackages.map(({ result, index }) => ({
            address: result.address,
            coordinates: result.coordinates,
            packages: [{
              packageId: sitePackageSelections[index],
              itemType: 'primary' as const,
            }],
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Quote generation failed');
      }

      const quoteNumbers = data.summary?.quoteNumbers || [];
      setGeneratedQuoteIds(quoteNumbers);

      if (data.successCount > 0) {
        toast.success(
          `${data.successCount} quote(s) created.` +
          (data.failureCount > 0 ? ` ${data.failureCount} failed.` : '') +
          (data.summary?.totalMonthlyValue ? ` Total: R${data.summary.totalMonthlyValue.toFixed(2)}/mo` : '')
        );
      } else {
        toast.error(`All ${data.failureCount} quote(s) failed. Check site packages.`);
      }
    } catch (error) {
      console.error('Error generating quotes:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to generate quotes. Please try again.');
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
    setAvailablePackages([]);
    setSitePackageSelections({});
  };

  // Handle parsed email data - populate form and switch to multi-site mode
  const handleEmailParsed = (parsedData: FormData) => {
    resetForm();
    setFormData(parsedData);
    if (activeTab !== 'multiple') {
      handleTabChange('multiple');
    }
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

  // Progress steps for Multiple Sites mode
  const progressSteps = [
    { id: 'form', label: 'Enter Details', icon: FileText },
    { id: 'checking', label: 'Check Coverage', icon: Signal },
    { id: 'results', label: 'Review & Quote', icon: Package },
  ];

  return (
    <div className="h-[calc(100vh-80px)] flex flex-col bg-circleTel-midnight-navy text-slate-100 selection:bg-circleTel-orange/30">
      {/* Header with Tab Toggle */}
      <div className="bg-circleTel-navy/50 backdrop-blur-xl border-b border-white/10 px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="p-2.5 bg-gradient-to-br from-circleTel-orange to-orange-600 rounded-xl shadow-lg shadow-orange-500/20">
              <MapPin className="h-6 w-6 text-white" />
            </div>
            <div>
              <div>
                <h1 className="text-xl font-bold text-white tracking-tight">
                  Sales Feasibility Portal
                </h1>
                <p className="text-sm text-slate-400 font-medium">
                  Check coverage and generate B2B quotes
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Parse Email Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEmailParseOpen(true)}
                className="gap-2 border-circleTel-orange/30 text-circleTel-orange hover:bg-circleTel-orange/5 hover:border-circleTel-orange/50"
              >
                <Mail className="h-4 w-4" />
                <span className="hidden sm:inline">Parse Email</span>
              </Button>

              {/* Mode indicator badge */}
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-full backdrop-blur-md">
                <div className={`w-2 h-2 rounded-full ${activeTab === 'single' ? 'bg-circleTel-orange animate-pulse' : 'bg-purple-500'}`} />
                <span className="text-xs font-semibold text-slate-300">
                  {activeTab === 'single' ? 'Single Site Mode' : 'Bulk Mode'}
                </span>
              </div>
            </div>
          </div>

          {/* Tab Toggle - Enhanced */}
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="grid w-full max-w-lg grid-cols-2 h-12 p-1 bg-black/40 border border-white/10 rounded-xl backdrop-blur-lg">
              <TabsTrigger
                value="single"
                className="flex items-center gap-2 rounded-lg data-[state=active]:bg-circleTel-orange data-[state=active]:text-white text-slate-400 transition-all duration-300"
              >
                <MapPin className="h-4 w-4" />
                <span className="font-semibold uppercase tracking-wider text-[10px]">Single Site</span>
                <span className="hidden sm:inline text-[8px] opacity-70 ml-1">Quick check</span>
              </TabsTrigger>
              <TabsTrigger
                value="multiple"
                className="flex items-center gap-2 rounded-lg data-[state=active]:bg-circleTel-orange data-[state=active]:text-white text-slate-400 transition-all duration-300"
              >
                <Layers className="h-4 w-4" />
                <span className="font-semibold uppercase tracking-wider text-[10px]">Multiple Sites</span>
                <span className="hidden sm:inline text-[8px] opacity-70 ml-1">Bulk quotes</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'single' ? (
          // Single Site Mode - Stepper Wizard
          <SingleSiteStepper />
        ) : (
          // Multiple Sites Mode - Split Map View (existing implementation)
          <div className="h-full flex flex-col lg:flex-row bg-circleTel-midnight-navy">
            {/* Left Panel - Form (45%) */}
            <div className="w-full lg:w-[45%] xl:w-[42%] h-full overflow-y-auto border-r border-white/5 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
              <div className="p-6 space-y-5">
                {/* Header with Progress */}
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">
                      Bulk Feasibility Check
                    </h2>
                    <p className="text-sm text-slate-500">
                      Check coverage for multiple sites at once
                    </p>
                  </div>
                  {step !== 'form' && (
                    <Button variant="outline" size="sm" onClick={resetForm} className="gap-1.5">
                      <ArrowLeft className="h-4 w-4" />
                      Start Over
                    </Button>
                  )}
                </div>

                {/* Progress Stepper */}
                <div className="flex items-center justify-between bg-black/30 rounded-xl p-3 border border-white/5 shadow-2xl backdrop-blur-md">
                  {progressSteps.map((s, idx) => {
                    const Icon = s.icon;
                    const isActive = step === s.id;
                    const isComplete = (step === 'checking' && idx === 0) || (step === 'results' && idx < 2);
                    return (
                      <div key={s.id} className="flex items-center gap-2">
                        <div className={`flex items-center justify-center w-8 h-8 rounded-full transition-all duration-500 ${isActive ? 'bg-circleTel-orange text-white shadow-lg shadow-orange-500/40 ring-4 ring-circleTel-orange/20' :
                          isComplete ? 'bg-green-500/20 text-green-400 border border-green-500/20' :
                            'bg-white/5 text-slate-600 border border-white/5'
                          }`}>
                          {isComplete ? <CheckCircle2 className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                        </div>
                        <span className={`text-[10px] font-bold uppercase tracking-tighter hidden sm:inline ${isActive ? 'text-white' : isComplete ? 'text-green-400' : 'text-slate-600'
                          }`}>{s.label}</span>
                        {idx < progressSteps.length - 1 && (
                          <ChevronRight className="h-3 w-3 text-white/5 mx-1" />
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Form Step */}
                <AnimatePresence mode="wait">
                  {step === 'form' && (
                    <motion.div
                      key="form"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-4"
                    >
                      {/* Client Details Card */}
                      <div className="bg-white/5 rounded-xl border border-white/5 shadow-xl overflow-hidden backdrop-blur-sm">
                        <div className="px-4 py-3 bg-white/5 border-b border-white/5">
                          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                            <Building2 className="h-3 w-3 text-circleTel-orange" />
                            Client Details
                          </h3>
                        </div>
                        <div className="p-4 space-y-3">
                          <Input
                            placeholder="Company Name *"
                            value={formData.companyName}
                            onChange={(e) => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
                            className="bg-black/20 border-white/5 text-white focus:border-circleTel-orange/30 focus:ring-circleTel-orange/10 placeholder:text-slate-600 h-10"
                          />
                          <Input
                            placeholder="Contact Name"
                            value={formData.contactName}
                            onChange={(e) => setFormData(prev => ({ ...prev, contactName: e.target.value }))}
                            className="bg-black/20 border-white/5 text-white placeholder:text-slate-600 h-10"
                          />
                          <div className="grid grid-cols-2 gap-3">
                            <Input
                              type="email"
                              placeholder="Email"
                              value={formData.email}
                              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                              className="bg-black/20 border-white/5 text-white placeholder:text-slate-600 h-10"
                            />
                            <Input
                              type="tel"
                              placeholder="Phone"
                              value={formData.phone}
                              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                              className="bg-black/20 border-white/5 text-white placeholder:text-slate-600 h-10"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Service Requirements Card */}
                      <div className="bg-white/5 rounded-xl border border-white/5 shadow-xl overflow-hidden backdrop-blur-sm">
                        <div className="px-4 py-3 bg-white/5 border-b border-white/5">
                          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                            <Wifi className="h-3 w-3 text-circleTel-orange" />
                            Service Requirements
                          </h3>
                        </div>
                        <div className="p-4 space-y-4">
                          {/* Speed Options */}
                          <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Minimum Speed</label>
                            <div className="grid grid-cols-2 gap-2">
                              {speedOptions.map((opt) => {
                                const Icon = opt.icon;
                                const isSelected = formData.speed === opt.value;
                                return (
                                  <button
                                    key={opt.value}
                                    onClick={() => setFormData(prev => ({ ...prev, speed: opt.value }))}
                                    className={`p-3 rounded-lg border transition-all duration-300 flex items-center gap-3 ${isSelected
                                      ? 'border-circleTel-orange bg-circleTel-orange/10 shadow-[0_0_15px_rgba(245,132,30,0.2)]'
                                      : 'border-white/5 bg-black/20 hover:border-white/20 hover:bg-white/5'
                                      }`}
                                  >
                                    <div className={`p-2 rounded-md ${isSelected ? 'bg-circleTel-orange text-white' : 'bg-white/5 text-slate-500'}`}>
                                      <Icon className="h-4 w-4" />
                                    </div>
                                    <span className={`text-sm font-bold ${isSelected ? 'text-white' : 'text-slate-400'}`}>
                                      {opt.label}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* Contention Options */}
                          <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Service Level</label>
                            <div className="grid grid-cols-3 gap-2">
                              {contentionOptions.map((opt) => {
                                const isSelected = formData.contention === opt.value;
                                return (
                                  <button
                                    key={opt.value}
                                    onClick={() => setFormData(prev => ({ ...prev, contention: opt.value }))}
                                    className={`p-2.5 rounded-lg border transition-all duration-300 text-center ${isSelected
                                      ? 'border-circleTel-orange bg-circleTel-orange/10 shadow-[0_0_10px_rgba(245,132,30,0.1)]'
                                      : 'border-white/5 bg-black/20 hover:border-white/20 hover:bg-white/5'
                                      }`}
                                  >
                                    <span className={`text-xs font-black block uppercase tracking-tight ${isSelected ? 'text-circleTel-orange' : 'text-slate-400'}`}>
                                      {opt.label}
                                    </span>
                                    <span className="text-[8px] text-slate-600 mt-0.5 block font-bold">{opt.description}</span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* Budget & Failover */}
                          <div className="flex gap-3 items-center pt-3 border-t border-white/5">
                            <div className="flex-1">
                              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] block mb-1.5">
                                Budget (Optional)
                              </label>
                              <div className="relative">
                                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600" />
                                <Input
                                  type="number"
                                  placeholder="Per site"
                                  value={formData.budget}
                                  onChange={(e) => setFormData(prev => ({ ...prev, budget: e.target.value }))}
                                  className="pl-9 bg-black/20 border-white/5 text-white h-10"
                                />
                              </div>
                            </div>
                            <div className="flex-1">
                              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] block mb-1.5 text-right px-4">
                                Security
                              </label>
                              <label className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg cursor-pointer transition-all duration-300 border ${formData.failover
                                ? 'bg-green-500/10 border-green-500/40 text-green-400'
                                : 'bg-black/20 border-white/5 text-slate-500 hover:border-white/10'
                                }`}>
                                <Checkbox
                                  checked={formData.failover}
                                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, failover: !!checked }))}
                                  className="border-white/20 data-[state=checked]:bg-green-500"
                                />
                                <Shield className="h-3 w-3" />
                                <span className="text-[10px] font-black uppercase">Failover</span>
                              </label>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Sites Card */}
                      <div className="bg-white/5 rounded-xl border border-white/5 shadow-xl overflow-hidden backdrop-blur-sm">
                        <div className="px-4 py-3 bg-white/5 border-b border-white/5 flex items-center justify-between">
                          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                            <MapPin className="h-3 w-3 text-circleTel-orange" />
                            Sites to Check
                          </h3>
                          <span className={`text-[10px] font-black px-3 py-1 rounded-full border shadow-[0_0_10px_rgba(255,255,255,0.05)] ${siteCount > 0 ? 'bg-circleTel-orange/20 border-circleTel-orange/30 text-circleTel-orange' : 'bg-white/5 border-white/10 text-slate-600'
                            }`}>
                            {siteCount} SITE{siteCount !== 1 ? 'S' : ''}
                          </span>
                        </div>
                        <div className="p-4">
                          <div className="relative group">
                            <Textarea
                              placeholder="Paste addresses or GPS coordinates here (one per line)..."
                              value={formData.sites}
                              onChange={(e) => setFormData(prev => ({ ...prev, sites: e.target.value }))}
                              rows={6}
                              className="font-mono text-xs border-white/5 bg-black/20 text-white focus:bg-black/40 focus:border-circleTel-orange/30 resize-none placeholder:text-slate-700 scrollbar-thin scrollbar-thumb-white/10"
                            />
                            {formData.sites && (
                              <button
                                onClick={() => setFormData(prev => ({ ...prev, sites: '' }))}
                                className="absolute top-2 right-2 p-1.5 text-slate-500 hover:text-white hover:bg-white/10 rounded-md transition-all opacity-0 group-hover:opacity-100"
                                title="Clear all"
                              >
                                <XCircle className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                          <div className="flex items-center justify-between mt-3 pt-3 border-t border-dashed border-white/5">
                            <div className="flex items-center gap-4">
                              <p className="text-[10px] text-slate-600 font-bold flex items-center gap-1.5 uppercase tracking-wider">
                                <MousePointer className="h-3 w-3" />
                                Map Selection Enabled
                              </p>
                            </div>
                            <p className="text-[10px] text-slate-700 font-bold italic">
                              Bulk CSV supported
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Submit Button - Enhanced */}
                      <Button
                        onClick={checkFeasibility}
                        disabled={siteCount === 0 || !formData.companyName}
                        className="w-full bg-circleTel-orange hover:bg-circleTel-bright-orange text-white py-8 text-sm font-black uppercase tracking-[0.3em] rounded-xl shadow-[0_10px_30px_rgba(245,132,30,0.3)] disabled:opacity-20 disabled:shadow-none transition-all duration-500 active:scale-[0.98] border-none"
                      >
                        <Sparkles className="h-4 w-4 mr-3 animate-pulse" />
                        Initialize Scan
                        {siteCount > 0 && (
                          <span className="ml-4 px-2.5 py-1 bg-black/20 rounded font-bold text-[10px]">
                            {siteCount} SITES
                          </span>
                        )}
                      </Button>
                    </motion.div>
                  )}

                  {/* Checking Step */}
                  {step === 'checking' && (
                    <motion.div
                      key="checking"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-4"
                    >
                      {/* Progress Header */}
                      <div className="bg-white/5 rounded-2xl border border-white/10 shadow-2xl p-8 text-center backdrop-blur-xl relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-circleTel-orange to-transparent opacity-50" />
                        <div className="relative inline-flex mb-6">
                          <div className="absolute inset-0 bg-circleTel-orange/20 rounded-full animate-ping" />
                          <div className="relative p-5 bg-circleTel-orange rounded-full shadow-[0_0_30px_rgba(245,132,30,0.4)]">
                            <Loader2 className="h-10 w-10 animate-spin text-white" />
                          </div>
                        </div>
                        <h2 className="text-2xl font-black text-white uppercase tracking-widest mt-4">Analyzing Coverage</h2>
                        <p className="text-slate-400 mt-2 font-medium tracking-wide">
                          Optimizing routes for {siteResults.length} location{siteResults.length !== 1 ? 's' : ''}...
                        </p>
                        {/* Progress Bar */}
                        <div className="mt-8 h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5 max-w-sm mx-auto">
                          <motion.div
                            className="h-full bg-gradient-to-r from-circleTel-orange to-orange-400 shadow-[0_0_10px_rgba(245,132,30,0.5)]"
                            initial={{ width: 0 }}
                            animate={{ width: `${((completedCount + errorCount) / siteResults.length) * 100}%` }}
                            transition={{ duration: 0.3 }}
                          />
                        </div>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-4">
                          {completedCount + errorCount} of {siteResults.length} complete
                        </p>
                      </div>

                      {/* Site List */}
                      <div className="bg-white/5 rounded-xl border border-white/5 shadow-xl overflow-hidden backdrop-blur-sm">
                        <div className="max-h-[350px] overflow-y-auto divide-y divide-white/5 scrollbar-thin scrollbar-thumb-white/10">
                          {siteResults.map((result, index) => (
                            <div
                              key={index}
                              className={`px-4 py-4 flex items-center gap-4 transition-all duration-300 ${result.status === 'checking' ? 'bg-circleTel-orange/5' :
                                result.status === 'complete' ? 'bg-green-500/5' :
                                  result.status === 'error' ? 'bg-red-500/5' :
                                    'bg-transparent'
                                }`}
                            >
                              <span className="text-[10px] font-black text-slate-600 w-6 text-center">{index + 1}</span>
                              <div className={`p-2 rounded-lg ${result.status === 'checking' ? 'bg-circleTel-orange/20 text-circleTel-orange animate-pulse' :
                                result.status === 'complete' ? 'bg-green-500/20 text-green-400' :
                                  result.status === 'error' ? 'bg-red-500/20 text-red-500' :
                                    'bg-white/5 text-slate-600'
                                }`}>
                                {result.status === 'checking' ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : result.status === 'complete' ? (
                                  <ShieldCheck className="h-4 w-4" />
                                ) : result.status === 'error' ? (
                                  <ShieldAlert className="h-4 w-4" />
                                ) : (
                                  <Clock className="h-4 w-4" />
                                )}
                              </div>
                              <span className="text-sm font-bold flex-1 truncate text-slate-300">{result.address}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Results Step */}
                  {step === 'results' && (
                    <motion.div
                      key="results"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-4"
                    >
                      {/* Summary Cards */}
                      <div className="grid grid-cols-3 gap-3">
                        <div className="bg-green-500/5 rounded-xl border border-green-500/20 p-4 text-center shadow-[0_0_20px_rgba(34,197,94,0.05)] backdrop-blur-sm group hover:border-green-500/40 transition-all duration-300">
                          <div className="inline-flex p-2.5 bg-green-500/20 rounded-lg mb-2 group-hover:scale-110 transition-transform">
                            <ShieldCheck className="h-5 w-5 text-green-400" />
                          </div>
                          <span className="text-2xl font-black text-white block tracking-tighter">{completedCount}</span>
                          <p className="text-[10px] text-green-500 font-bold uppercase tracking-widest mt-1">Fiber Found</p>
                        </div>
                        <div className="bg-red-500/5 rounded-xl border border-red-500/20 p-4 text-center shadow-[0_0_20px_rgba(239,68,68,0.05)] backdrop-blur-sm group hover:border-red-500/40 transition-all duration-300">
                          <div className="inline-flex p-2.5 bg-red-500/20 rounded-lg mb-2 group-hover:scale-110 transition-transform">
                            <ShieldAlert className="h-5 w-5 text-red-400" />
                          </div>
                          <span className="text-2xl font-black text-white block tracking-tighter">{errorCount}</span>
                          <p className="text-[10px] text-red-500 font-bold uppercase tracking-widest mt-1">No Density</p>
                        </div>
                        <div className="bg-white/5 rounded-xl border border-white/10 p-4 text-center shadow-[0_0_20px_rgba(255,255,255,0.02)] backdrop-blur-sm group hover:border-white/20 transition-all duration-300">
                          <div className="inline-flex p-2.5 bg-white/10 rounded-lg mb-2 group-hover:scale-110 transition-transform">
                            <MapPin className="h-5 w-5 text-slate-400" />
                          </div>
                          <span className="text-2xl font-black text-white block tracking-tighter">{siteResults.length}</span>
                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Total Sites</p>
                        </div>
                      </div>

                      {/* Package Loading */}
                      {isLoadingPackages && (
                        <div className="flex items-center gap-4 p-5 bg-circleTel-orange/10 border border-circleTel-orange/30 rounded-xl backdrop-blur-md">
                          <div className="p-2 bg-circleTel-orange rounded-lg">
                            <Loader2 className="h-5 w-5 animate-spin text-white" />
                          </div>
                          <div>
                            <span className="text-sm font-bold text-white block uppercase tracking-wide">Optimizing Packages</span>
                            <span className="text-[10px] text-circleTel-orange font-bold uppercase">Matching best available services to discovered sites</span>
                          </div>
                        </div>
                      )}

                      {/* Site Results List with Package Selection */}
                      <div className="bg-white/5 rounded-xl border border-white/10 shadow-xl overflow-hidden backdrop-blur-sm">
                        <div className="px-4 py-3 bg-white/5 border-b border-white/10 flex items-center justify-between">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                            <MapPin className="h-3 w-3 text-circleTel-orange" />
                            Site Results
                          </span>
                          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                            {Object.keys(sitePackageSelections).filter(k => sitePackageSelections[Number(k)]).length}/{completedCount} SELECTED
                          </span>
                        </div>
                        <div className="max-h-[320px] overflow-y-auto divide-y divide-white/5 scrollbar-thin scrollbar-thumb-white/10">
                          {siteResults.map((result, index) => (
                            <div
                              key={index}
                              onClick={() => setSelectedSite(selectedSite === index ? null : index)}
                              className={`p-4 cursor-pointer transition-all ${selectedSite === index ? 'bg-orange-50/50' :
                                result.status === 'complete' ? 'hover:bg-slate-50' :
                                  result.status === 'error' ? 'bg-red-50/30 hover:bg-red-50/50' :
                                    'hover:bg-slate-50'
                                }`}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex items-start gap-3 flex-1 min-w-0">
                                  <div className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${result.status === 'complete' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                    }`}>
                                    {index + 1}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <p className="text-sm font-medium text-slate-900 truncate">{result.address}</p>
                                    {/* Coverage tech badges */}
                                    {result.coverage && (
                                      <div className="flex flex-wrap gap-1.5 mt-2">
                                        {Object.entries(result.coverage).map(([tech, details]) => (
                                          details?.available && (
                                            <span key={tech} className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 rounded-md text-xs font-medium text-slate-700">
                                              {getTechIcon(tech)}
                                              <span className="capitalize">{tech}</span>
                                            </span>
                                          )
                                        ))}
                                      </div>
                                    )}
                                    {/* Package selector for sites with coverage */}
                                    {result.status === 'complete' && availablePackages.length > 0 && (
                                      <div className="mt-3" onClick={(e) => e.stopPropagation()}>
                                        <select
                                          value={sitePackageSelections[index] || ''}
                                          onChange={(e) => {
                                            setSitePackageSelections(prev => ({
                                              ...prev,
                                              [index]: e.target.value,
                                            }));
                                          }}
                                          className={`w-full text-sm border-2 rounded-lg px-3 py-2 transition-all ${sitePackageSelections[index]
                                            ? 'border-green-300 bg-green-50 focus:border-green-400'
                                            : 'border-slate-200 bg-white hover:border-slate-300 focus:border-circleTel-orange'
                                            } focus:outline-none focus:ring-2 focus:ring-circleTel-orange/20`}
                                        >
                                          <option value="">Select a package...</option>
                                          {availablePackages.map(pkg => (
                                            <option key={pkg.id} value={pkg.id}>
                                              {pkg.name} • {pkg.speed_down}Mbps • R{pkg.price.toLocaleString()}/mo
                                            </option>
                                          ))}
                                        </select>
                                        {sitePackageSelections[index] && (
                                          <div className="flex items-center gap-1.5 mt-1.5 text-green-600">
                                            <CheckCircle2 className="h-3.5 w-3.5" />
                                            <span className="text-xs font-medium">
                                              {availablePackages.find(p => p.id === sitePackageSelections[index])?.name}
                                            </span>
                                          </div>
                                        )}
                                      </div>
                                    )}
                                    {result.status === 'error' && (
                                      <p className="text-xs text-red-500 mt-1.5">{result.error || 'No coverage available'}</p>
                                    )}
                                  </div>
                                </div>
                                {result.status === 'error' && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={(e) => { e.stopPropagation(); retrySite(index); }}
                                    className="flex-shrink-0"
                                  >
                                    <RefreshCcw className="h-3.5 w-3.5 mr-1" />
                                    Retry
                                  </Button>
                                )}
                              </div>

                              {/* Expanded Details */}
                              <AnimatePresence>
                                {selectedSite === index && result.coverage && (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="mt-3 pt-3 border-t border-slate-200 overflow-hidden"
                                  >
                                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Coverage Details</p>
                                    <div className="grid grid-cols-2 gap-2">
                                      {Object.entries(result.coverage).map(([tech, details]) => (
                                        details?.available && (
                                          <div key={tech} className="flex items-center gap-2 text-xs bg-slate-50 rounded-lg p-2">
                                            {getTechIcon(tech)}
                                            <div>
                                              <span className="capitalize font-medium text-slate-700">{tech}</span>
                                              {details.provider && (
                                                <span className="text-slate-400 ml-1">({details.provider})</span>
                                              )}
                                              {details.distance && (
                                                <span className="text-slate-400 block">{details.distance.toFixed(1)}km away</span>
                                              )}
                                            </div>
                                          </div>
                                        )
                                      ))}
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="space-y-3">
                        {generatedQuoteIds.length > 0 ? (
                          <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-5 text-center">
                            <div className="inline-flex p-3 bg-green-100 rounded-full mb-3">
                              <CheckCircle2 className="h-6 w-6 text-green-600" />
                            </div>
                            <h3 className="text-lg font-bold text-green-800">
                              {generatedQuoteIds.length} Quote{generatedQuoteIds.length !== 1 ? 's' : ''} Created!
                            </h3>
                            <p className="text-sm text-green-600 mt-1 mb-4">
                              Quotes are ready for review and sending
                            </p>
                            <Button
                              onClick={() => window.open('/admin/quotes', '_blank')}
                              className="bg-green-600 hover:bg-green-700 text-white"
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View Quotes
                            </Button>
                          </div>
                        ) : (
                          <Button
                            onClick={generateQuotes}
                            disabled={
                              Object.keys(sitePackageSelections).filter(k => sitePackageSelections[Number(k)]).length === 0 ||
                              isGeneratingQuotes ||
                              isLoadingPackages
                            }
                            className="w-full bg-gradient-to-r from-circleTel-orange to-orange-500 hover:from-circleTel-orange/90 hover:to-orange-500/90 text-white py-5 text-base font-semibold rounded-xl shadow-lg shadow-orange-500/20 disabled:opacity-50 disabled:shadow-none transition-all"
                          >
                            {isGeneratingQuotes ? (
                              <>
                                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                                Generating Quotes...
                              </>
                            ) : (
                              <>
                                <FileText className="h-5 w-5 mr-2" />
                                Generate Quotes
                                <span className="ml-2 px-2.5 py-0.5 bg-white/20 rounded-full text-sm">
                                  {Object.keys(sitePackageSelections).filter(k => sitePackageSelections[Number(k)]).length} site{Object.keys(sitePackageSelections).filter(k => sitePackageSelections[Number(k)]).length !== 1 ? 's' : ''}
                                </span>
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Right Panel - Map (55%) */}
              <div className="flex-1 h-full lg:h-full relative border-l border-white/5">
                {!isLoaded ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-circleTel-midnight-navy">
                    <div className="text-center">
                      <Loader2 className="h-10 w-10 animate-spin text-circleTel-orange mx-auto mb-3" />
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Initializing Map Engine</p>
                    </div>
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

              </div>

              {/* Map Control Overlays */}
              {/* Map Legend - Top Left */}
              <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-xl rounded-xl shadow-2xl border border-white/10 overflow-hidden">
                <div className="px-3 py-2 bg-white/5 border-b border-white/5">
                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Map Legend</p>
                </div>
                <div className="p-3 space-y-2">
                  <div className="flex items-center gap-2 text-[10px] font-bold">
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                    <span className="text-slate-400">Coverage Found</span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-bold">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
                    <span className="text-slate-400">No Density</span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-bold">
                    <div className="w-2.5 h-2.5 rounded-full bg-circleTel-orange animate-pulse shadow-[0_0_10px_rgba(245,132,30,0.5)]" />
                    <span className="text-slate-400">Scanning...</span>
                  </div>
                </div>
              </div>

              {/* Status Badge - Top Right */}
              <div className="absolute top-4 right-4 flex flex-col items-end gap-2">
                <div className="bg-black/60 backdrop-blur-xl rounded-xl shadow-2xl border border-white/10 px-4 py-2.5 flex items-center gap-3">
                  <div className="p-1.5 bg-circleTel-orange/20 rounded-lg">
                    <MapPin className="h-4 w-4 text-circleTel-orange" />
                  </div>
                  <div>
                    <span className="text-lg font-black text-white tracking-tighter">
                      {markers.filter(m => m.status !== 'geocoding').length}
                    </span>
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">
                      Mapped
                    </span>
                  </div>
                </div>
              </div>
              {step === 'form' && (
                <div className="bg-circleTel-orange/90 backdrop-blur-sm text-white rounded-lg px-3 py-1.5 text-xs font-medium shadow-lg flex items-center gap-1.5">
                  <MousePointer className="h-3 w-3" />
                  Click to add location
                </div>
              )}
            </div>

            {/* Company Name Badge - Bottom Right */}
            {formData.companyName && (
              <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-xl rounded-xl shadow-2xl border border-white/10 px-4 py-2.5 group hover:border-circleTel-orange/30 transition-all">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 bg-white/5 rounded-lg group-hover:bg-circleTel-orange/10 transition-colors">
                    <Building2 className="h-4 w-4 text-slate-400 group-hover:text-circleTel-orange" />
                  </div>
                  <span className="text-xs font-black text-white uppercase tracking-wider">{formData.companyName}</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
