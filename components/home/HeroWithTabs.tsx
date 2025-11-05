'use client';

import React from 'react';
import Link from 'next/link';
import { Truck, Wifi, Router, MapPin, Home, Building2 } from 'lucide-react';
import { AddressAutocomplete } from '@/components/coverage/AddressAutocomplete';
import { Button } from '@/components/ui/button';
import { InteractiveCoverageMapModal } from '@/components/coverage/InteractiveCoverageMapModal';

type CoverageType = 'residential' | 'business';

interface Tab {
  id: CoverageType;
  label: string;
  icon: React.ElementType;
  placeholder: string;
  description: string;
}

const COVERAGE_TABS: Tab[] = [
  {
    id: 'residential',
    label: 'Residential',
    icon: Home,
    placeholder: "Enter your home address",
    description: "Get connected today with our Fibre, LTE and 5G deals for homes."
  },
  {
    id: 'business',
    label: 'Business',
    icon: Building2,
    placeholder: "Enter your business address",
    description: "Enterprise-grade connectivity solutions for your business."
  }
];

export function HeroWithTabs() {
  const [activeTab, setActiveTab] = React.useState<CoverageType>('residential');
  const [address, setAddress] = React.useState('');
  const [coordinates, setCoordinates] = React.useState<{ lat: number; lng: number } | null>(null);
  const [addressComponents, setAddressComponents] = React.useState<any>(null);
  const [isChecking, setIsChecking] = React.useState(false);
  const [showMapModal, setShowMapModal] = React.useState(false);

  const currentTab = COVERAGE_TABS.find(tab => tab.id === activeTab) || COVERAGE_TABS[0];

  // Load persisted address from localStorage on mount
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedData = localStorage.getItem('circletel_coverage_address');
      if (savedData) {
        try {
          const parsed = JSON.parse(savedData);
          // Only load if it's less than 24 hours old
          const timestamp = new Date(parsed.timestamp);
          const now = new Date();
          const hoursDiff = (now.getTime() - timestamp.getTime()) / (1000 * 60 * 60);

          if (hoursDiff < 24 && parsed.address) {
            setAddress(parsed.address);
            if (parsed.coordinates) {
              setCoordinates(parsed.coordinates);
            }
            if (parsed.type) {
              setActiveTab(parsed.type);
            }
          }
        } catch (error) {
          console.error('Failed to load saved address:', error);
        }
      }
    }
  }, []);

  const handleLocationSelect = (data: any) => {
    setAddress(data.address);
    if (data.latitude && data.longitude) {
      setCoordinates({ lat: data.latitude, lng: data.longitude });
    }
    // Store full address components for later use
    setAddressComponents({
      suburb: data.suburb || data.town || '',
      city: data.town || '',
      province: data.province || '',
      postalCode: data.postalCode || ''
    });
  };

  const handleCheckCoverage = async () => {
    if (address.trim()) {
      setIsChecking(true);
      try {
        // Store address in localStorage for persistence with full components
        localStorage.setItem('circletel_coverage_address', JSON.stringify({
          address: address.trim(),
          coordinates: coordinates,
          type: activeTab,
          addressComponents: addressComponents || {},
          timestamp: new Date().toISOString()
        }));

        // Create a coverage lead with type
        const response = await fetch('/api/coverage/lead', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            address: address.trim(),
            coordinates: coordinates,
            coverageType: activeTab
          })
        });

        if (!response.ok) {
          throw new Error('Failed to create coverage lead');
        }

        const data = await response.json();

        // Redirect to packages page with leadId and type
        window.location.href = `/packages/${data.leadId}?type=${activeTab}`;
      } catch (error) {
        console.error('Coverage check failed:', error);
        alert('Coverage check failed. Please try again.');
        setIsChecking(false);
      }
    }
  };

  const handleMapSearch = (searchAddress: string, searchCoordinates: { lat: number; lng: number }) => {
    setAddress(searchAddress);
    setCoordinates(searchCoordinates);
    // Automatically trigger coverage check
    setTimeout(() => {
      handleCheckCoverage();
    }, 100);
  };

  return (
    <section className="relative min-h-[600px] md:min-h-[700px] overflow-hidden bg-gradient-to-br from-circleTel-darkNeutral via-purple-900 to-circleTel-darkNeutral">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-circleTel-orange rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>

        {/* Decorative dots */}
        <div className="absolute top-20 left-1/4 w-2 h-2 bg-cyan-400 rounded-full"></div>
        <div className="absolute top-40 right-1/3 w-3 h-3 bg-purple-400 rounded-full"></div>
        <div className="absolute bottom-1/4 left-1/3 w-2 h-2 bg-cyan-300 rounded-full"></div>
        <div className="absolute bottom-1/3 right-1/4 w-3 h-3 bg-purple-300 rounded-full"></div>

        {/* Dotted circles */}
        <div className="absolute top-1/4 left-20 w-32 h-32 border-4 border-dotted border-purple-400 opacity-20 rounded-full"></div>
        <div className="absolute bottom-1/4 right-20 w-24 h-24 border-4 border-dotted border-cyan-400 opacity-20 rounded-full"></div>
      </div>

      <div className="container relative z-10 mx-auto px-4 py-16 md:py-24">
        {/* Hero Content */}
        <div className="text-center max-w-5xl mx-auto mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold text-white mb-4 sm:mb-6 leading-tight px-2">
            Connectivity that can fit your budget
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl text-white/90 mb-6 sm:mb-8 px-2">
            {currentTab.description}
          </p>
        </div>

        {/* Coverage Checker Card with Tabs */}
        <div className="max-w-6xl mx-auto px-2">
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl overflow-hidden">
            {/* Tab Navigation - Vumatel Style */}
            <div className="flex border-b border-gray-200 bg-gray-50/50">
              {COVERAGE_TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;

                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id);
                      setAddress(''); // Reset address when switching tabs
                    }}
                    className={`
                      flex-1 flex items-center justify-center gap-2 px-4 py-4 sm:py-5 text-sm sm:text-base font-semibold
                      transition-all duration-200 border-b-3 relative
                      ${isActive
                        ? 'bg-white text-circleTel-orange border-circleTel-orange'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/50 border-transparent'
                      }
                    `}
                  >
                    <Icon className={`h-5 w-5 ${isActive ? 'text-circleTel-orange' : 'text-gray-500'}`} />
                    <span className="hidden sm:inline">{tab.label}</span>
                    <span className="sm:hidden">{tab.label.slice(0, 3)}</span>
                  </button>
                );
              })}
            </div>

            {/* Coverage Checker Content */}
            <div className="p-4 sm:p-6 md:p-10">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 md:gap-6">
                <div className="flex-1 p-1.5 sm:p-2 border-2 border-gray-200 rounded-full bg-gray-50/50 w-full">
                  <AddressAutocomplete
                    value={address}
                    onLocationSelect={handleLocationSelect}
                    placeholder={currentTab.placeholder}
                    className="w-full h-full text-sm sm:text-base"
                    showLocationButton={true}
                  />
                </div>
                <Button
                  onClick={handleCheckCoverage}
                  disabled={!address.trim() || isChecking}
                  size="lg"
                  className="bg-circleTel-orange hover:bg-circleTel-orange/90 text-white font-bold text-base sm:text-lg md:text-xl px-6 sm:px-8 md:px-10 py-4 sm:py-5 md:py-7 rounded-xl transition-all shadow-lg hover:shadow-xl disabled:opacity-60 disabled:bg-circleTel-orange w-full sm:w-auto sm:min-w-[200px] md:min-w-[240px] flex items-center justify-center gap-2 sm:gap-3"
                >
                  {isChecking ? (
                    <>
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                      Checking...
                    </>
                  ) : (
                    <>
                      <MapPin className="h-6 w-6" />
                      Check coverage
                    </>
                  )}
                </Button>
              </div>

              {/* Interactive Map Link */}
              <p className="text-center text-sm text-gray-600 mt-4">
                <button
                  onClick={() => setShowMapModal(true)}
                  className="text-circleTel-orange hover:text-circleTel-orange/80 font-medium underline transition-colors"
                >
                  Click here
                </button>
                {' '}to use our interactive map.
              </p>

              {/* Tab-specific messaging */}
              {activeTab === 'business' && (
                <p className="text-sm text-gray-600 mt-2 text-center">
                  Need help? Call <span className="font-semibold text-circleTel-orange">087 087 6305</span> to speak with a business connectivity specialist.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Interactive Coverage Map Modal */}
        <InteractiveCoverageMapModal
          isOpen={showMapModal}
          onClose={() => setShowMapModal(false)}
          onSearch={handleMapSearch}
          initialAddress={address}
          initialCoordinates={coordinates || undefined}
        />

        {/* Value Props */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto text-center">
          <div className="flex flex-col items-center text-white">
            <div className="w-16 h-16 bg-cyan-400 rounded-full flex items-center justify-center mb-3">
              <Wifi className="w-8 h-8 text-gray-900" />
            </div>
            <h3 className="text-lg font-semibold mb-1">Go capped or uncapped.</h3>
          </div>
          <div className="flex flex-col items-center text-white">
            <div className="w-16 h-16 bg-cyan-400 rounded-full flex items-center justify-center mb-3">
              <Truck className="w-8 h-8 text-gray-900" />
            </div>
            <h3 className="text-lg font-semibold mb-1">Free delivery.</h3>
          </div>
          <div className="flex flex-col items-center text-white">
            <div className="w-16 h-16 bg-cyan-400 rounded-full flex items-center justify-center mb-3">
              <Router className="w-8 h-8 text-gray-900" />
            </div>
            <h3 className="text-lg font-semibold mb-1">Save R1 000 on a router.*</h3>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="text-center mt-8 max-w-4xl mx-auto">
          <p className="text-white/60 text-sm">
            *Save up to R1000 if you sign up for selected SIM + Device packages. Only while stocks last. Maximum of 3 promotions per legal entity (business or individual). Offer subject to cancellation policy.
          </p>
          <p className="text-white/70 text-sm mt-2">
            View our{' '}
            <Link href="/terms" className="text-circleTel-orange hover:text-white underline transition-colors">
              Terms & Conditions
            </Link>
            {' '}for full details.
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes blob {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </section>
  );
}
