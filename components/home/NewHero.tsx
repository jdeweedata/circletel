'use client';

import React from 'react';
import { MapPin, Home, Building2, Briefcase, Monitor, Gamepad2, Wrench, Calendar, ArrowRight } from 'lucide-react';
import { SegmentTabs, SEGMENT_DATA, type SegmentType } from './SegmentTabs';
import { AddressAutocomplete } from '@/components/coverage/AddressAutocomplete';
import { InteractiveCoverageMapModal } from '@/components/coverage/InteractiveCoverageMapModal';
import { Button } from '@/components/ui/button';

const SEGMENT_ICONS: Record<SegmentType, React.ElementType> = {
  business: Building2,
  wfh: Briefcase,
  home: Home,
};

interface TrustItem {
  icon: React.ElementType;
  label: string;
}

const TRUST_ITEMS: Record<SegmentType, TrustItem[]> = {
  home: [
    { icon: Monitor, label: 'Netflix-ready' },
    { icon: Gamepad2, label: 'Gaming ping <20ms' },
    { icon: Wrench, label: 'Free installation' },
    { icon: Calendar, label: 'Month-to-month' },
  ],
  wfh: [
    { icon: Monitor, label: 'HD video calls' },
    { icon: () => <span className="text-sm font-bold">↑</span>, label: 'Fast uploads' },
    { icon: Wrench, label: 'Free installation' },
    { icon: Calendar, label: 'No lock-in' },
  ],
  business: [
    { icon: () => <span className="text-sm font-bold">99.9%</span>, label: 'SLA' },
    { icon: () => <span className="text-sm font-bold">24/7</span>, label: 'Support' },
    { icon: Building2, label: 'Local NOC' },
    { icon: Calendar, label: 'Same-day response' },
  ],
};

export function NewHero() {
  const [activeSegment, setActiveSegment] = React.useState<SegmentType>('home');
  const [address, setAddress] = React.useState('');
  const [coordinates, setCoordinates] = React.useState<{ lat: number; lng: number } | null>(null);
  const [addressComponents, setAddressComponents] = React.useState<Record<string, string>>({});
  const [isChecking, setIsChecking] = React.useState(false);
  const [showMapModal, setShowMapModal] = React.useState(false);

  const currentSegment = SEGMENT_DATA[activeSegment];
  const SegmentIcon = SEGMENT_ICONS[activeSegment];
  const trustItems = TRUST_ITEMS[activeSegment];

  // Load persisted address from sessionStorage on mount
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedData = sessionStorage.getItem('circletel_coverage_address');
      if (savedData) {
        try {
          const parsed = JSON.parse(savedData);
          const timestamp = new Date(parsed.timestamp);
          const now = new Date();
          const hoursDiff = (now.getTime() - timestamp.getTime()) / (1000 * 60 * 60);

          if (hoursDiff < 24 && parsed.address) {
            setAddress(parsed.address);
            if (parsed.coordinates) {
              setCoordinates(parsed.coordinates);
            }
            // Map old types to new segments
            if (parsed.type === 'residential') {
              setActiveSegment('home');
            } else if (parsed.type === 'business') {
              setActiveSegment('business');
            }
          }
        } catch (error) {
          console.error('Failed to load saved address:', error);
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
      // Store address in sessionStorage
      sessionStorage.setItem('circletel_coverage_address', JSON.stringify({
        address: address.trim(),
        coordinates,
        type: activeSegment === 'business' ? 'business' : 'residential',
        addressComponents,
        timestamp: new Date().toISOString(),
      }));

      // Create a coverage lead
      const response = await fetch('/api/coverage/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: address.trim(),
          coordinates,
          coverageType: activeSegment === 'business' ? 'business' : 'residential',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create coverage lead');
      }

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
    <section className="bg-circleTel-grey200 py-12 md:py-20">
      <div className="container mx-auto px-4">
        {/* Heading */}
        <div className="text-center mb-8 md:mb-12">
          <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold text-circleTel-navy mb-4">
            Connect Your World
          </h1>
          <p className="font-body text-lg md:text-xl text-circleTel-grey600">
            Fast, reliable internet for every need
          </p>
        </div>

        {/* Segment Tabs */}
        <SegmentTabs
          activeSegment={activeSegment}
          onSegmentChange={(segment) => {
            setActiveSegment(segment);
            setAddress(''); // Reset address when switching
          }}
          className="mb-8 md:mb-12"
        />

        {/* Hero Card */}
        <div className="max-w-5xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-6 md:p-10">
            {/* Address Search Bar - Full Width at Top */}
            <div className="mb-8">
              {/* Input + Button Row */}
              <div className="flex flex-col md:flex-row gap-3">
                <div className="relative flex-1">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-circleTel-orange z-10" />
                  <AddressAutocomplete
                    value={address}
                    onLocationSelect={handleLocationSelect}
                    placeholder={currentSegment.placeholder}
                    className="w-full [&_input]:pl-12 [&_input]:pr-4 [&_input]:py-4 [&_input]:h-14 [&_input]:text-base [&_input]:rounded-xl [&_input]:border-2 [&_input]:border-gray-200 [&_input]:focus:border-circleTel-orange [&_input]:shadow-inner"
                    showLocationButton={false}
                    showMapButton={false}
                  />
                </div>
                <Button
                  onClick={handleCheckCoverage}
                  disabled={!address.trim() || isChecking}
                  className="h-14 px-8 md:w-auto bg-circleTel-orange hover:bg-circleTel-orange-dark text-white font-semibold text-base rounded-xl shadow-md transition-all disabled:opacity-60"
                >
                  {isChecking ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                      Checking...
                    </>
                  ) : (
                    <>
                      Check Availability
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </>
                  )}
                </Button>
              </div>

              {/* Links Row - Accessible with focus states */}
              <div className="flex flex-col sm:flex-row justify-center sm:justify-between items-center gap-2 mt-3 text-sm">
                <button
                  type="button"
                  aria-label="Use my current location for address"
                  onClick={() => {
                    if (navigator.geolocation) {
                      navigator.geolocation.getCurrentPosition(
                        (position) => {
                          setCoordinates({
                            lat: position.coords.latitude,
                            lng: position.coords.longitude,
                          });
                        },
                        (error) => console.error('Geolocation error:', error)
                      );
                    }
                  }}
                  className="flex items-center gap-1.5 text-circleTel-orange-accessible hover:underline font-medium focus:outline-none focus:ring-2 focus:ring-circleTel-orange focus:ring-offset-2 rounded px-2 py-1 transition-colors"
                >
                  <MapPin className="w-4 h-4" aria-hidden="true" />
                  Use my location
                </button>
                <button
                  type="button"
                  aria-label="Open interactive map to find your address"
                  onClick={() => setShowMapModal(true)}
                  className="text-circleTel-orange-accessible hover:underline font-medium focus:outline-none focus:ring-2 focus:ring-circleTel-orange focus:ring-offset-2 rounded px-2 py-1 transition-colors"
                >
                  Can&apos;t find your address? Use our map
                </button>
              </div>
            </div>

            {/* Segment Content - Below Address Bar */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              {/* Left: Segment Info */}
              <div className="space-y-4">
                {/* Icon + Title */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-circleTel-orange/10 rounded-xl flex items-center justify-center">
                    <SegmentIcon className="w-5 h-5 md:w-6 md:h-6 text-circleTel-orange" />
                  </div>
                  <h2 className="font-heading text-2xl md:text-3xl font-semibold text-circleTel-navy">
                    {currentSegment.title}
                  </h2>
                </div>

                {/* Tags */}
                <p className="font-body text-circleTel-grey600">
                  {currentSegment.tags.join(' · ')}
                </p>

                {/* Price */}
                <div className="py-2">
                  <p className="font-heading text-3xl md:text-4xl font-bold text-circleTel-navy">
                    From R{currentSegment.priceFrom.toLocaleString()}<span className="text-lg md:text-xl font-normal">/month</span>
                  </p>
                </div>

                {/* Badge */}
                <div>
                  <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-semibold bg-circleTel-orange text-white">
                    {currentSegment.badge}
                  </span>
                </div>

                {/* Technologies */}
                <p className="font-body text-sm text-circleTel-grey600">
                  {currentSegment.technologies}
                </p>
              </div>

              {/* Right: Trust Points + Microcopy */}
              <div className="space-y-4">
                {/* Trust Points as List */}
                <div className="grid grid-cols-2 gap-3">
                  {trustItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <div key={item.label} className="flex items-center gap-2 text-circleTel-navy">
                        <div className="w-8 h-8 bg-circleTel-orange/10 rounded-lg flex items-center justify-center text-circleTel-orange">
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className="font-body text-sm font-medium">
                          {item.label}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Microcopy */}
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-circleTel-grey600 font-body pt-2">
                  <span className="flex items-center gap-1">
                    <span className="text-green-500">✓</span> Free installation
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="text-green-500">✓</span> No contracts
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="text-green-500">✓</span> Cancel anytime
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Trust Bar - Simplified */}
        <div className="max-w-4xl mx-auto mt-8 md:mt-10">
          <div className="flex flex-wrap justify-center gap-6 md:gap-10 text-circleTel-grey600 text-sm">
            <span>99.9% Uptime SLA</span>
            <span className="hidden md:inline">·</span>
            <span>24/7 Local Support</span>
            <span className="hidden md:inline">·</span>
            <span>Same-Day Installation</span>
            <span className="hidden md:inline">·</span>
            <span>No Lock-in Contracts</span>
          </div>
        </div>
      </div>

      {/* Interactive Map Modal */}
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
