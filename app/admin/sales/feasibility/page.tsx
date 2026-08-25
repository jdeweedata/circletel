'use client';
import { PiBroadcastBold, PiBuildingsBold, PiCellSignalFullBold, PiCheckCircleBold, PiClockBold, PiCurrencyDollarBold, PiCursorBold, PiGlobeBold, PiLightningBold, PiMapPinBold, PiShieldBold, PiShieldCheckBold, PiShieldWarningBold, PiSparkleBold, PiSpinnerBold, PiWifiHighBold, PiXCircleBold } from 'react-icons/pi';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import {
  FilterChips,
  KpiStrip,
  PmButton,
} from '@/components/portal/modernist/PortalModernistShell';

import { SingleSiteStepper } from './components/SingleSiteStepper';
import { EmailParseModal } from './components/EmailParseModal';

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
  { value: 100, label: '100 Mbps', icon: PiWifiHighBold },
  { value: 200, label: '200 Mbps', icon: PiCellSignalFullBold },
  { value: 500, label: '500 Mbps', icon: PiWifiHighBold },
  { value: 1000, label: '1 Gbps', icon: PiLightningBold },
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
  styles: [],
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
    case 'fibre': return <PiGlobeBold className="h-4 w-4 text-blue-500" />;
    case 'lte': return <PiCellSignalFullBold className="h-4 w-4 text-green-500" />;
    case '5g': return <PiLightningBold className="h-4 w-4 text-purple-500" />;
    case 'tarana': return <PiBroadcastBold className="h-4 w-4 text-orange-500" />;
    case 'starlink': return <PiSparkleBold className="h-4 w-4 text-cyan-500" />;
    default: return <PiWifiHighBold className="h-4 w-4 text-gray-500" />;
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

  const addressFromUrl = searchParams.get('address');

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
  const bulkStepOrder = ['form', 'checking', 'results'] as const;
  const handleBulkStepChange = (value: string) => {
    const targetIdx = bulkStepOrder.indexOf(value as (typeof bulkStepOrder)[number]);
    const currentIdx = bulkStepOrder.indexOf(step);
    if (targetIdx >= 0 && targetIdx <= currentIdx) {
      setStep(value as typeof step);
    }
  };
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
          <PiXCircleBold className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900">Failed to load Google Maps</h2>
          <p className="text-gray-500 mt-2">Please check your API key configuration.</p>
        </div>
      </div>
    );
  }

  // ============================================================================
  // Render
  // ============================================================================

  const subtitle = addressFromUrl
    ? decodeURIComponent(addressFromUrl)
    : 'Check coverage and generate B2B quotes';

  return (
    <div
      className="h-[calc(100vh-80px)] flex flex-col text-slate-900"
      style={{ background: 'var(--pm-ground, transparent)' }}
    >
      <div
        className="flex-shrink-0 px-6 py-4"
        style={{ borderBottom: '2px solid var(--pm-divider)', background: '#FFFFFF' }}
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <p
              className="text-[10px] font-extrabold tracking-[0.08em] uppercase mb-1"
              style={{ color: 'var(--pm-navy)' }}
            >
              Sales
            </p>
            <h1
              className="text-[1.5rem] sm:text-[1.75rem] font-extrabold leading-tight break-words"
              style={{ color: 'var(--pm-navy)' }}
            >
              Feasibility
            </h1>
            <p className="mt-1 text-sm truncate" style={{ color: 'var(--pm-body)' }}>
              {subtitle}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <PmButton variant="secondary" onClick={() => setIsEmailParseOpen(true)}>
              Parse email
            </PmButton>
            <FilterChips
              options={[
                { value: 'single', label: 'Single Site' },
                { value: 'multiple', label: 'Multiple Sites' },
              ]}
              value={activeTab}
              onChange={handleTabChange}
            />
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'single' ? (
          // Single Site Mode - Stepper Wizard
          <SingleSiteStepper />
        ) : (
          // Multiple Sites Mode - Split Map View (existing implementation)
          <div className="h-full flex flex-col lg:flex-row" style={{ background: 'var(--pm-ground, transparent)' }}>
            {/* Left Panel - Form (45%) */}
            <div className="w-full lg:w-[45%] xl:w-[42%] h-full overflow-y-auto border-r border-black/[0.06] scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent">
              <div className="p-6 space-y-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p
                      className="text-[10px] font-extrabold tracking-[0.08em] uppercase"
                      style={{ color: 'var(--pm-navy)' }}
                    >
                      Multiple sites
                    </p>
                    <h2 className="mt-1 text-xl font-extrabold" style={{ color: 'var(--pm-navy)' }}>
                      Bulk feasibility
                    </h2>
                    <p className="mt-1 text-sm" style={{ color: 'var(--pm-body)' }}>
                      Check coverage for multiple sites at once
                    </p>
                  </div>
                  {step !== 'form' && (
                    <PmButton variant="secondary" onClick={resetForm}>
                      Start over
                    </PmButton>
                  )}
                </div>

                <FilterChips
                  options={[
                    { value: 'form', label: 'Details' },
                    { value: 'checking', label: 'Coverage' },
                    { value: 'results', label: 'Review' },
                  ]}
                  value={step}
                  onChange={handleBulkStepChange}
                />

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
                      <div className="rounded-xl bg-white shadow-sm ring-1 ring-black/[0.06] overflow-hidden">
                        <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--pm-divider)' }}>
                          <h3
                            className="text-[10px] font-extrabold tracking-[0.08em] uppercase"
                            style={{ color: 'var(--pm-navy)' }}
                          >
                            Client details
                          </h3>
                        </div>
                        <div className="p-4 space-y-3">
                          <Input
                            placeholder="Company Name *"
                            value={formData.companyName}
                            onChange={(e) => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
                            className="h-10"
                          />
                          <Input
                            placeholder="Contact Name"
                            value={formData.contactName}
                            onChange={(e) => setFormData(prev => ({ ...prev, contactName: e.target.value }))}
                            className="h-10"
                          />
                          <div className="grid grid-cols-2 gap-3">
                            <Input
                              type="email"
                              placeholder="Email"
                              value={formData.email}
                              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                              className="h-10"
                            />
                            <Input
                              type="tel"
                              placeholder="Phone"
                              value={formData.phone}
                              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                              className="h-10"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Service Requirements Card */}
                      <div className="rounded-xl bg-white shadow-sm ring-1 ring-black/[0.06] overflow-hidden">
                        <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--pm-divider)' }}>
                          <h3
                            className="text-[10px] font-extrabold tracking-[0.08em] uppercase"
                            style={{ color: 'var(--pm-navy)' }}
                          >
                            Service requirements
                          </h3>
                        </div>
                        <div className="p-4 space-y-4">
                          {/* Speed Options */}
                          <div className="space-y-2">
                            <label
                              className="text-[10px] font-extrabold tracking-[0.08em] uppercase block mb-2"
                              style={{ color: 'var(--pm-navy)' }}
                            >
                              Minimum speed
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                              {speedOptions.map((opt) => {
                                const Icon = opt.icon;
                                const isSelected = formData.speed === opt.value;
                                return (
                                  <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => setFormData(prev => ({ ...prev, speed: opt.value }))}
                                    className="p-3 rounded-lg border bg-white flex items-center gap-3"
                                    style={{
                                      borderColor: isSelected ? 'var(--pm-navy)' : '#E5E7EB',
                                      borderBottom: isSelected ? '3px solid var(--pm-accent)' : undefined,
                                    }}
                                  >
                                    <div
                                      className="p-2 rounded-md"
                                      style={{
                                        background: isSelected ? 'var(--pm-navy)' : '#F3F4F6',
                                        color: isSelected ? '#FFFFFF' : '#4B5563',
                                      }}
                                    >
                                      <Icon className="h-4 w-4" />
                                    </div>
                                    <span
                                      className="text-sm font-extrabold"
                                      style={{ color: 'var(--pm-navy)' }}
                                    >
                                      {opt.label}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* Contention Options */}
                          <div className="space-y-2">
                            <label
                              className="text-[10px] font-extrabold tracking-[0.08em] uppercase block mb-2"
                              style={{ color: 'var(--pm-navy)' }}
                            >
                              Service level
                            </label>
                            <div className="grid grid-cols-3 gap-2">
                              {contentionOptions.map((opt) => {
                                const isSelected = formData.contention === opt.value;
                                return (
                                  <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => setFormData(prev => ({ ...prev, contention: opt.value }))}
                                    className="p-2.5 rounded-lg border bg-white text-center"
                                    style={{
                                      borderColor: isSelected ? 'var(--pm-navy)' : '#E5E7EB',
                                      borderBottom: isSelected ? '3px solid var(--pm-accent)' : undefined,
                                    }}
                                  >
                                    <span
                                      className="text-xs font-extrabold block uppercase tracking-wide"
                                      style={{ color: 'var(--pm-navy)' }}
                                    >
                                      {opt.label}
                                    </span>
                                    <span className="text-[10px] mt-0.5 block" style={{ color: '#6B7280' }}>
                                      {opt.description}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* Budget & Failover */}
                          <div className="flex gap-3 items-center pt-3" style={{ borderTop: '1px solid var(--pm-divider)' }}>
                            <div className="flex-1">
                              <label
                                className="text-[10px] font-extrabold tracking-[0.08em] uppercase block mb-1.5"
                                style={{ color: 'var(--pm-navy)' }}
                              >
                                Budget (optional)
                              </label>
                              <div className="relative">
                                <PiCurrencyDollarBold className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                                <Input
                                  type="number"
                                  placeholder="Per site"
                                  value={formData.budget}
                                  onChange={(e) => setFormData(prev => ({ ...prev, budget: e.target.value }))}
                                  className="pl-9 h-10"
                                />
                              </div>
                            </div>
                            <div className="flex-1">
                              <label
                                className="text-[10px] font-extrabold tracking-[0.08em] uppercase block mb-1.5"
                                style={{ color: 'var(--pm-navy)' }}
                              >
                                Failover
                              </label>
                              <label
                                className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg cursor-pointer border bg-white"
                                style={{
                                  borderColor: formData.failover ? 'var(--pm-navy)' : '#E5E7EB',
                                  borderBottom: formData.failover ? '3px solid var(--pm-accent)' : undefined,
                                  color: 'var(--pm-navy)',
                                }}
                              >
                                <Checkbox
                                  checked={formData.failover}
                                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, failover: !!checked }))}
                                />
                                <PiShieldBold className="h-3 w-3" />
                                <span className="text-[10px] font-extrabold uppercase tracking-wide">Failover</span>
                              </label>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Sites Card */}
                      <div className="rounded-xl bg-white shadow-sm ring-1 ring-black/[0.06] overflow-hidden">
                        <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid var(--pm-divider)' }}>
                          <h3
                            className="text-[10px] font-extrabold tracking-[0.08em] uppercase"
                            style={{ color: 'var(--pm-navy)' }}
                          >
                            Sites to check
                          </h3>
                          <span
                            className="text-[10px] font-extrabold tracking-[0.08em] uppercase"
                            style={{ color: 'var(--pm-navy)' }}
                          >
                            {siteCount} site{siteCount !== 1 ? 's' : ''}
                          </span>
                        </div>
                        <div className="p-4">
                          <div className="relative group">
                            <Textarea
                              placeholder="Paste addresses or GPS coordinates here (one per line)..."
                              value={formData.sites}
                              onChange={(e) => setFormData(prev => ({ ...prev, sites: e.target.value }))}
                              rows={6}
                              className="font-mono text-xs resize-none scrollbar-thin scrollbar-thumb-slate-300"
                            />
                            {formData.sites && (
                              <button
                                type="button"
                                onClick={() => setFormData(prev => ({ ...prev, sites: '' }))}
                                className="absolute top-2 right-2 p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md"
                                title="Clear all"
                              >
                                <PiXCircleBold className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                          <div className="flex items-center justify-between mt-3 pt-3" style={{ borderTop: '1px dashed var(--pm-divider)' }}>
                            <p className="text-[10px] font-extrabold uppercase tracking-wide flex items-center gap-1.5" style={{ color: 'var(--pm-navy)' }}>
                              <PiCursorBold className="h-3 w-3" />
                              Click the map to add a site
                            </p>
                            <p className="text-[10px]" style={{ color: '#6B7280' }}>
                              One address or GPS per line
                            </p>
                          </div>
                        </div>
                      </div>

                      <PmButton
                        onClick={checkFeasibility}
                        disabled={siteCount === 0 || !formData.companyName}
                        className="w-full"
                      >
                        Check coverage{siteCount > 0 ? ` · ${siteCount} site${siteCount !== 1 ? 's' : ''}` : ''}
                      </PmButton>
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
                      <div className="rounded-xl bg-white shadow-sm ring-1 ring-black/[0.06] p-6">
                        <p
                          className="text-[10px] font-extrabold tracking-[0.08em] uppercase"
                          style={{ color: 'var(--pm-navy)' }}
                        >
                          Coverage
                        </p>
                        <h2 className="mt-1 text-xl font-extrabold" style={{ color: 'var(--pm-navy)' }}>
                          Checking coverage
                        </h2>
                        <p className="mt-1 text-sm" style={{ color: 'var(--pm-body)' }}>
                          {siteResults.length} location{siteResults.length !== 1 ? 's' : ''}
                        </p>
                        <div className="mt-6 h-1.5 bg-slate-200 rounded-full overflow-hidden max-w-sm">
                          <motion.div
                            className="h-full"
                            style={{ background: 'var(--pm-accent)' }}
                            initial={{ width: 0 }}
                            animate={{ width: `${((completedCount + errorCount) / siteResults.length) * 100}%` }}
                            transition={{ duration: 0.3 }}
                          />
                        </div>
                        <p className="text-[10px] font-extrabold tracking-[0.08em] uppercase mt-3" style={{ color: 'var(--pm-navy)' }}>
                          {completedCount + errorCount} of {siteResults.length} complete
                        </p>
                      </div>

                      {/* Site List */}
                      <div className="rounded-xl bg-white shadow-sm ring-1 ring-black/[0.06] overflow-hidden">
                        <div className="max-h-[350px] overflow-y-auto divide-y divide-slate-200 scrollbar-thin scrollbar-thumb-slate-300">
                          {siteResults.map((result, index) => (
                            <div
                              key={index}
                              className={`px-4 py-4 flex items-center gap-4 ${result.status === 'checking' ? 'bg-[color-mix(in_srgb,var(--pm-navy)_6%,white)]' :
                                result.status === 'complete' ? 'bg-white' :
                                  result.status === 'error' ? 'bg-red-50' :
                                    'bg-white'
                                }`}
                            >
                              <span className="text-[10px] font-extrabold w-6 text-center" style={{ color: 'var(--pm-navy)' }}>{index + 1}</span>
                              <div className={`p-2 rounded-lg ${result.status === 'checking' ? 'text-[color:var(--pm-navy)]' :
                                result.status === 'complete' ? 'bg-green-100 text-green-700' :
                                  result.status === 'error' ? 'bg-red-100 text-red-600' :
                                    'bg-slate-100 text-slate-600'
                                }`}>
                                {result.status === 'checking' ? (
                                  <PiSpinnerBold className="h-4 w-4 animate-spin" />
                                ) : result.status === 'complete' ? (
                                  <PiShieldCheckBold className="h-4 w-4" />
                                ) : result.status === 'error' ? (
                                  <PiShieldWarningBold className="h-4 w-4" />
                                ) : (
                                  <PiClockBold className="h-4 w-4" />
                                )}
                              </div>
                              <span className="text-sm font-bold flex-1 truncate text-slate-700">{result.address}</span>
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
                      <KpiStrip
                        variant="cards"
                        items={[
                          {
                            label: 'Covered',
                            value: String(completedCount),
                            accent: '#2F9E5E',
                            valueColor: '#2F9E5E',
                          },
                          {
                            label: 'Failed',
                            value: String(errorCount),
                            accent: '#DC2626',
                            valueColor: '#DC2626',
                          },
                          {
                            label: 'Total sites',
                            value: String(siteResults.length),
                            accent: '#13274A',
                          },
                        ]}
                      />

                      {isLoadingPackages && (
                        <div className="flex items-center gap-4 p-5 rounded-xl bg-white shadow-sm ring-1 ring-black/[0.06]">
                          <PiSpinnerBold className="h-5 w-5 animate-spin" style={{ color: 'var(--pm-navy)' }} />
                          <div>
                            <span className="text-sm font-extrabold block" style={{ color: 'var(--pm-navy)' }}>Matching packages</span>
                            <span className="text-xs" style={{ color: '#6B7280' }}>Best available services for covered sites</span>
                          </div>
                        </div>
                      )}

                      {/* Site Results List with Package Selection */}
                      <div className="rounded-xl bg-white shadow-sm ring-1 ring-black/[0.06] overflow-hidden">
                        <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid var(--pm-divider)' }}>
                          <span
                            className="text-[10px] font-extrabold tracking-[0.08em] uppercase"
                            style={{ color: 'var(--pm-navy)' }}
                          >
                            Site results
                          </span>
                          <span
                            className="text-[10px] font-extrabold tracking-[0.08em] uppercase"
                            style={{ color: 'var(--pm-navy)' }}
                          >
                            {Object.keys(sitePackageSelections).filter(k => sitePackageSelections[Number(k)]).length}/{completedCount} selected
                          </span>
                        </div>
                        <div className="max-h-[320px] overflow-y-auto divide-y divide-slate-200 scrollbar-thin scrollbar-thumb-slate-300">
                          {siteResults.map((result, index) => (
                            <div
                              key={index}
                              onClick={() => setSelectedSite(selectedSite === index ? null : index)}
                              className={`p-4 cursor-pointer ${selectedSite === index ? 'bg-[color-mix(in_srgb,var(--pm-navy)_6%,white)]' :
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
                                          className="w-full text-sm border rounded-lg px-3 py-2 bg-white focus:outline-none"
                                          style={{
                                            borderColor: sitePackageSelections[index] ? 'var(--pm-navy)' : '#E5E7EB',
                                            borderBottom: sitePackageSelections[index] ? '3px solid var(--pm-accent)' : undefined,
                                          }}
                                        >
                                          <option value="">Select a package...</option>
                                          {availablePackages.map(pkg => (
                                            <option key={pkg.id} value={pkg.id}>
                                              {pkg.name} • {pkg.speed_down}Mbps • R{pkg.price.toLocaleString()}/mo
                                            </option>
                                          ))}
                                        </select>
                                        {sitePackageSelections[index] && (
                                          <div className="flex items-center gap-1.5 mt-1.5" style={{ color: 'var(--pm-navy)' }}>
                                            <PiCheckCircleBold className="h-3.5 w-3.5" />
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
                                  <PmButton
                                    variant="secondary"
                                    onClick={(e) => { e.stopPropagation(); retrySite(index); }}
                                  >
                                    Retry
                                  </PmButton>
                                )}
                              </div>

                              {/* Expanded Details */}
                              <AnimatePresence>
                                {selectedSite === index && result.coverage && (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="mt-3 pt-3 border-t border-slate-300 overflow-hidden"
                                  >
                                    <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">Coverage Details</p>
                                    <div className="grid grid-cols-2 gap-2">
                                      {Object.entries(result.coverage).map(([tech, details]) => (
                                        details?.available && (
                                          <div key={tech} className="flex items-center gap-2 text-xs bg-slate-50 rounded-lg p-2">
                                            {getTechIcon(tech)}
                                            <div>
                                              <span className="capitalize font-medium text-slate-700">{tech}</span>
                                              {details.provider && (
                                                <span className="text-slate-500 ml-1">({details.provider})</span>
                                              )}
                                              {details.distance && (
                                                <span className="text-slate-500 block">{details.distance.toFixed(1)}km away</span>
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
                          <div className="rounded-xl bg-white shadow-sm ring-1 ring-black/[0.06] p-5 text-center">
                            <PiCheckCircleBold className="h-8 w-8 mx-auto mb-3" style={{ color: '#2F9E5E' }} />
                            <h3 className="text-lg font-extrabold" style={{ color: 'var(--pm-navy)' }}>
                              {generatedQuoteIds.length} quote{generatedQuoteIds.length !== 1 ? 's' : ''} created
                            </h3>
                            <p className="text-sm mt-1 mb-4" style={{ color: 'var(--pm-body)' }}>
                              Quotes are ready for review and sending
                            </p>
                            <PmButton onClick={() => window.open('/admin/quotes', '_blank')}>
                              View quotes
                            </PmButton>
                          </div>
                        ) : (
                          <PmButton
                            onClick={generateQuotes}
                            disabled={
                              Object.keys(sitePackageSelections).filter(k => sitePackageSelections[Number(k)]).length === 0 ||
                              isGeneratingQuotes ||
                              isLoadingPackages
                            }
                            className="w-full"
                          >
                            {isGeneratingQuotes
                              ? 'Generating quotes…'
                              : `Generate quotes · ${Object.keys(sitePackageSelections).filter(k => sitePackageSelections[Number(k)]).length} site${Object.keys(sitePackageSelections).filter(k => sitePackageSelections[Number(k)]).length !== 1 ? 's' : ''}`}
                          </PmButton>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Right Panel - Map (55%) */}
              <div className="flex-1 h-full lg:h-full relative border-l border-slate-200">
                {!isLoaded ? (
                  <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'var(--pm-ground, #fff)' }}>
                    <div className="text-center">
                      <PiSpinnerBold className="h-8 w-8 animate-spin mx-auto mb-3" style={{ color: 'var(--pm-navy)' }} />
                      <p className="text-sm" style={{ color: 'var(--pm-body)' }}>Loading map</p>
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
              <div className="absolute top-4 left-4 rounded-xl bg-white shadow-sm ring-1 ring-black/[0.06] overflow-hidden">
                <div className="px-3 py-2" style={{ borderBottom: '1px solid var(--pm-divider)' }}>
                  <p className="text-[10px] font-extrabold tracking-[0.08em] uppercase" style={{ color: 'var(--pm-navy)' }}>Map legend</p>
                </div>
                <div className="p-3 space-y-2">
                  <div className="flex items-center gap-2 text-[10px] font-extrabold">
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                    <span style={{ color: 'var(--pm-navy)' }}>Covered</span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-extrabold">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                    <span style={{ color: 'var(--pm-navy)' }}>Failed</span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-extrabold">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: 'var(--pm-accent)' }} />
                    <span style={{ color: 'var(--pm-navy)' }}>Checking</span>
                  </div>
                </div>
              </div>

              {/* Status Badge - Top Right */}
              <div className="absolute top-4 right-4 flex flex-col items-end gap-2">
                <div className="rounded-xl bg-white shadow-sm ring-1 ring-black/[0.06] px-4 py-2.5 flex items-center gap-3">
                  <PiMapPinBold className="h-4 w-4" style={{ color: 'var(--pm-navy)' }} />
                  <div>
                    <span className="text-lg font-extrabold tabular-nums" style={{ color: 'var(--pm-navy)' }}>
                      {markers.filter(m => m.status !== 'geocoding').length}
                    </span>
                    <span className="text-[10px] font-extrabold tracking-[0.08em] uppercase ml-2" style={{ color: 'var(--pm-navy)' }}>
                      Mapped
                    </span>
                  </div>
                </div>
              </div>
              {step === 'form' && (
                <div
                  className="rounded-lg px-3 py-1.5 text-xs font-extrabold shadow-sm flex items-center gap-1.5"
                  style={{ background: 'var(--pm-navy)', color: '#FFFFFF' }}
                >
                  <PiCursorBold className="h-3 w-3" />
                  Click to add location
                </div>
              )}
            </div>

            {/* Company Name Badge - Bottom Right */}
            {formData.companyName && (
              <div className="absolute bottom-4 right-4 rounded-xl bg-white shadow-sm ring-1 ring-black/[0.06] px-4 py-2.5">
                <div className="flex items-center gap-3">
                  <PiBuildingsBold className="h-4 w-4" style={{ color: 'var(--pm-navy)' }} />
                  <span className="text-xs font-extrabold" style={{ color: 'var(--pm-navy)' }}>{formData.companyName}</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      <EmailParseModal
        open={isEmailParseOpen}
        onOpenChange={setIsEmailParseOpen}
        onApply={handleEmailParsed}
      />
    </div>
  );
}
