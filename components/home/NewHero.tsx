'use client';

import React from 'react';
import { MapPin, Home, Building2, Briefcase, ArrowRight, Zap, CheckCircle } from 'lucide-react';
import { AddressAutocomplete } from '@/components/coverage/AddressAutocomplete';
import { InteractiveCoverageMapModal } from '@/components/coverage/InteractiveCoverageMapModal';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type SegmentType = 'business' | 'wfh' | 'home';

const SEGMENT_CONFIG: Record<SegmentType, {
  label: string;
  shortLabel: string;
  icon: React.ElementType;
  priceFrom: string;
  tagline: string;
  placeholder: string;
}> = {
  home: {
    label: 'Home',
    shortLabel: 'Home',
    icon: Home,
    priceFrom: 'R799',
    tagline: 'Stream, game & connect the whole family',
    placeholder: 'Enter your home address',
  },
  wfh: {
    label: 'Work from Home',
    shortLabel: 'SOHO',
    icon: Briefcase,
    priceFrom: 'R799',
    tagline: 'Reliable video calls & fast uploads',
    placeholder: 'Enter your home office address',
  },
  business: {
    label: 'Business',
    shortLabel: 'Business',
    icon: Building2,
    priceFrom: 'R1,299',
    tagline: '99.9% SLA with 24/7 local support',
    placeholder: 'Enter your business address',
  },
};

interface NewHeroProps {
  activeSegment?: SegmentType;
  onSegmentChange?: (segment: SegmentType) => void;
}

export function NewHero({ activeSegment: externalSegment, onSegmentChange }: NewHeroProps) {
  const [internalSegment, setInternalSegment] = React.useState<SegmentType>('home');
  const activeSegment = externalSegment ?? internalSegment;
  const setActiveSegment = onSegmentChange ?? setInternalSegment;

  const [address, setAddress] = React.useState('');
  const [coordinates, setCoordinates] = React.useState<{ lat: number; lng: number } | null>(null);
  const [addressComponents, setAddressComponents] = React.useState<Record<string, string>>({});
  const [isChecking, setIsChecking] = React.useState(false);
  const [showMapModal, setShowMapModal] = React.useState(false);

  const config = SEGMENT_CONFIG[activeSegment];

  // Load persisted address from sessionStorage
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedData = sessionStorage.getItem('circletel_coverage_address');
      if (savedData) {
        try {
          const parsed = JSON.parse(savedData);
          const timestamp = new Date(parsed.timestamp);
          const hoursDiff = (Date.now() - timestamp.getTime()) / (1000 * 60 * 60);
          if (hoursDiff < 24 && parsed.address) {
            setAddress(parsed.address);
            if (parsed.coordinates) setCoordinates(parsed.coordinates);
          }
        } catch (e) {
          console.error('Failed to load saved address:', e);
        }
      }
    }
  }, []);

  const handleLocationSelect = (data: {
    address: string;
    latitude?: number;
    longitude?: number;
    suburb?: string;
    town?: string;
    province?: string;
    postalCode?: string;
  }) => {
    setAddress(data.address);
    if (data.latitude && data.longitude) {
      setCoordinates({ lat: data.latitude, lng: data.longitude });
    }
    setAddressComponents({
      suburb: data.suburb || data.town || '',
      city: data.town || '',
      province: data.province || '',
      postalCode: data.postalCode || '',
    });
  };

  const handleCheckCoverage = async () => {
    if (!address.trim()) return;
    setIsChecking(true);
    try {
      sessionStorage.setItem('circletel_coverage_address', JSON.stringify({
        address: address.trim(),
        coordinates,
        type: activeSegment === 'business' ? 'business' : 'residential',
        addressComponents,
        timestamp: new Date().toISOString(),
      }));

      const response = await fetch('/api/coverage/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: address.trim(),
          coordinates,
          coverageType: activeSegment === 'business' ? 'business' : 'residential',
        }),
      });

      if (!response.ok) throw new Error('Failed to create coverage lead');
      const data = await response.json();
      const packageType = activeSegment === 'business' ? 'business' : 'residential';
      window.location.href = `/packages/${data.leadId}?type=${packageType}`;
    } catch (error) {
      console.error('Coverage check failed:', error);
      alert('Coverage check failed. Please try again.');
      setIsChecking(false);
    }
  };

  const handleMapSearch = (searchAddress: string, searchCoordinates: { lat: number; lng: number }) => {
    setAddress(searchAddress);
    setCoordinates(searchCoordinates);
    setTimeout(() => handleCheckCoverage(), 100);
  };

  return (
    <section className="relative bg-gradient-to-br from-circleTel-navy via-circleTel-navy to-circleTel-navy/95 overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 right-0 w-96 h-96 bg-circleTel-orange rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500 rounded-full blur-3xl" />
      </div>

      <div className="relative container mx-auto px-4 py-10 md:py-16">
        {/* Promo Banner */}
        <div className="flex justify-center mb-4">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-circleTel-orange to-orange-500 rounded-full px-3 py-1.5 shadow-lg">
            <Zap className="w-3.5 h-3.5 text-white" />
            <span className="text-white text-xs md:text-sm font-bold">FREE Installation</span>
            <span className="text-white/80 text-xs">(worth R2,500)</span>
          </div>
        </div>

        {/* Hero Heading */}
        <div className="text-center mb-6">
          <h1 className="font-heading text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-2">
            <span className="text-circleTel-orange">Premium</span> Internet
          </h1>
          <p className="text-white/80 text-base md:text-lg max-w-md mx-auto">
            {config.tagline}
          </p>
        </div>

        {/* Compact Segment Pills */}
        <div className="flex justify-center gap-2 mb-6">
          {(Object.keys(SEGMENT_CONFIG) as SegmentType[]).map((seg) => {
            const Icon = SEGMENT_CONFIG[seg].icon;
            const isActive = activeSegment === seg;
            return (
              <button
                key={seg}
                onClick={() => {
                  setActiveSegment(seg);
                  setAddress('');
                }}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium transition-all',
                  'focus:outline-none focus:ring-2 focus:ring-circleTel-orange focus:ring-offset-2 focus:ring-offset-circleTel-navy',
                  isActive
                    ? 'bg-circleTel-orange text-white shadow-lg'
                    : 'bg-white/10 text-white/80 hover:bg-white/20'
                )}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{SEGMENT_CONFIG[seg].label}</span>
                <span className="sm:hidden">{SEGMENT_CONFIG[seg].shortLabel}</span>
              </button>
            );
          })}
        </div>

        {/* Price Display */}
        <div className="text-center mb-6">
          <p className="text-white text-sm">From</p>
          <p className="text-circleTel-orange text-3xl md:text-4xl font-bold">
            {config.priceFrom}<span className="text-lg font-normal">/mo</span>
          </p>
        </div>

        {/* Compact Search Card */}
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-xl shadow-xl p-4">
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-circleTel-orange z-10" />
                <AddressAutocomplete
                  value={address}
                  onLocationSelect={handleLocationSelect}
                  placeholder={config.placeholder}
                  className="w-full [&_input]:pl-10 [&_input]:pr-3 [&_input]:py-3 [&_input]:h-12 [&_input]:text-sm [&_input]:rounded-lg [&_input]:border [&_input]:border-gray-200 [&_input]:focus:border-circleTel-orange"
                  showLocationButton={false}
                  showMapButton={false}
                />
              </div>
              <Button
                onClick={handleCheckCoverage}
                disabled={!address.trim() || isChecking}
                className="h-12 px-6 bg-circleTel-orange hover:bg-circleTel-orange-dark text-white font-semibold rounded-lg shadow-md transition-all disabled:opacity-60"
              >
                {isChecking ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Checking...
                  </>
                ) : (
                  <>
                    Check Coverage
                    <ArrowRight className="ml-1.5 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
            {/* Helper Links */}
            <div className="flex justify-center gap-4 mt-2 text-xs">
              <button
                type="button"
                onClick={() => {
                  if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(
                      (pos) => setCoordinates({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
                      (err) => console.error('Geolocation error:', err)
                    );
                  }
                }}
                className="text-circleTel-orange hover:underline"
              >
                Use my location
              </button>
              <span className="text-gray-300">|</span>
              <button
                type="button"
                onClick={() => setShowMapModal(true)}
                className="text-circleTel-orange hover:underline"
              >
                Use map
              </button>
            </div>
          </div>
        </div>

        {/* Compact Trust Bar */}
        <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 mt-6 text-white/80 text-xs md:text-sm">
          <span className="flex items-center gap-1.5">
            <CheckCircle className="w-3.5 h-3.5 text-green-400" />
            99.9% Uptime
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle className="w-3.5 h-3.5 text-green-400" />
            24/7 Support
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle className="w-3.5 h-3.5 text-green-400" />
            No Contracts
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle className="w-3.5 h-3.5 text-green-400" />
            Same-Day Install
          </span>
        </div>
      </div>

      {/* Map Modal */}
      <InteractiveCoverageMapModal
        isOpen={showMapModal}
        onClose={() => setShowMapModal(false)}
        onSearch={handleMapSearch}
        initialAddress={address}
        initialCoordinates={coordinates || undefined}
        layout="horizontal"
      />
    </section>
  );
}

// Re-export for backwards compatibility
export { SEGMENT_CONFIG as SEGMENT_DATA };
