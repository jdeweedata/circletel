'use client';

import { useEffect, useState, Suspense } from 'react';
import { useParams } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, MapPin, Wifi, Zap, Heart, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Package {
  id: string;
  name: string;
  service_type: string;
  product_category?: string;
  speed_down: number;
  speed_up: number;
  price: number;
  promotion_price?: number;
  promotion_months?: number;
  description: string;
  features: string[];
}

interface PackageCardProps {
  package: Package;
  index: number;
  onSelect: (pkg: Package) => void;
}

const colorSchemes = {
  // LTE packages - Purple
  lte: {
    backgroundColor: '#8B5CF6', // Purple
    textColor: '#FFFFFF',
    badgeColor: '#EC4899'
  },
  // SkyFibre packages - Yellow
  skyfibre: {
    backgroundColor: '#FCD34D', // Yellow
    textColor: '#1F2937',
    badgeColor: '#EC4899'
  },
  // HomeFibre packages - Orange
  homefibreconnect: {
    backgroundColor: '#F97316', // Orange
    textColor: '#FFFFFF',
    badgeColor: '#EC4899'
  },
  // BizFibre packages - Blue
  bizfibreconnect: {
    backgroundColor: '#60A5FA', // Blue
    textColor: '#FFFFFF',
    badgeColor: '#EC4899'
  },
  // 5G packages - Teal
  '5g': {
    backgroundColor: '#14B8A6', // Teal
    textColor: '#FFFFFF',
    badgeColor: '#EC4899'
  },
  // Wireless packages - Green
  wireless: {
    backgroundColor: '#10B981', // Green
    textColor: '#FFFFFF',
    badgeColor: '#EC4899'
  },
  // Fibre packages - Red/Rose
  fibre: {
    backgroundColor: '#F43F5E', // Rose
    textColor: '#FFFFFF',
    badgeColor: '#EC4899'
  },
  // Default fallback - Indigo
  default: {
    backgroundColor: '#6366F1', // Indigo
    textColor: '#FFFFFF',
    badgeColor: '#EC4899'
  }
};

function PackageCard({ package: pkg, index, onSelect }: PackageCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  // Get service type and normalize it for color scheme lookup
  const serviceType = (pkg.service_type?.toLowerCase() || pkg.product_category?.toLowerCase() || 'default').replace(/\s+/g, '');
  const colorScheme = colorSchemes[serviceType as keyof typeof colorSchemes] || colorSchemes.default;
  const isPromotion = !!pkg.promotion_price;

  return (
    <button
      onClick={() => onSelect(pkg)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        'group relative overflow-hidden rounded-2xl shadow-md transition-all hover:shadow-2xl text-left w-full',
        isHovered && 'scale-[1.02]'
      )}
      style={{
        animationDelay: `${index * 0.1}s`,
        animation: 'fadeInUp 0.5s ease-out forwards'
      }}
    >
      <div
        className="relative min-h-[380px] p-8 flex flex-col justify-between"
        style={{
          backgroundColor: colorScheme.backgroundColor,
          color: colorScheme.textColor,
        }}
      >
        {/* Badge */}
        {isPromotion && (
          <div className="absolute top-6 right-6 z-20">
            <span
              className="inline-block px-4 py-1.5 text-[10px] font-bold uppercase rounded-full text-white shadow-lg"
              style={{ backgroundColor: colorScheme.badgeColor }}
            >
              HERO DEAL
            </span>
          </div>
        )}

        {/* Decorative Patterns */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-32 h-32 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: `repeating-linear-gradient(
                45deg,
                currentColor,
                currentColor 2px,
                transparent 2px,
                transparent 6px
              )`
            }}></div>
          </div>

          <div className="absolute top-10 right-10 w-24 h-24 opacity-20">
            <div className="grid grid-cols-8 gap-1.5">
              {Array.from({ length: 64 }).map((_, i) => (
                <div key={i} className="w-1.5 h-1.5 rounded-full bg-current" />
              ))}
            </div>
          </div>

          <svg className="absolute bottom-0 left-0 w-32 h-32 opacity-20" viewBox="0 0 100 100">
            <path d="M0,100 Q50,50 100,100 L0,100 Z" fill="currentColor"/>
          </svg>

          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 opacity-5">
            <div className="absolute inset-0 rounded-full border-8 border-current"></div>
            <div className="absolute inset-8 rounded-full border-8 border-current"></div>
          </div>
        </div>

        {/* Content */}
        <div className="relative z-10 flex-1">
          <div className="text-xs font-bold uppercase tracking-wider mb-2 opacity-70">
            {pkg.service_type || pkg.product_category}
          </div>

          <h3 className="text-2xl md:text-3xl font-bold leading-tight mb-2">
            {pkg.name}
          </h3>

          <p className="text-sm md:text-base opacity-90 mb-4">
            {pkg.speed_down}Mbps Down / {pkg.speed_up}Mbps Up
          </p>

          {pkg.features && pkg.features.length > 0 && (
            <div className="mb-4 space-y-1">
              {pkg.features.slice(0, 3).map((feature, idx) => (
                <div key={idx} className="flex items-start gap-2 text-xs opacity-80">
                  <div className="w-1 h-1 rounded-full bg-current flex-shrink-0 mt-1.5" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          )}

          <div className="mb-4">
            <div className="text-4xl font-bold">
              R {(pkg.promotion_price || pkg.price).toFixed(2)}
            </div>
            {pkg.promotion_price && (
              <div className="text-sm opacity-70 mt-1">
                <span className="line-through">R {pkg.price}</span>
                <span className="ml-2">for {pkg.promotion_months} months</span>
              </div>
            )}
            <div className="text-sm opacity-70 mt-1">per month</div>
          </div>

          {pkg.description && (
            <p className="text-xs opacity-70 mb-4">{pkg.description}</p>
          )}
        </div>

        {/* CTA Button */}
        <div className="relative z-10 flex items-center justify-center mt-6">
          <div
            className={cn(
              "flex items-center gap-2 px-6 py-3 rounded-full font-semibold text-sm shadow-lg transition-all",
              // Use dark button for light backgrounds (yellow/skyfibre)
              serviceType === 'skyfibre'
                ? 'bg-gray-900 text-white'
                : 'bg-white text-gray-900',
              isHovered && 'scale-105 shadow-xl'
            )}
          >
            <Heart className="w-4 h-4 text-pink-500 fill-current" />
            <span>Get this deal</span>
          </div>
        </div>
      </div>
    </button>
  );
}

function PackagesContent() {
  const params = useParams();
  const leadId = params.leadId as string;

  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [address, setAddress] = useState('');
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);

  useEffect(() => {
    fetchPackages();
  }, [leadId]);

  const fetchPackages = async () => {
    try {
      const response = await fetch(`/api/coverage/packages?leadId=${leadId}`);
      if (!response.ok) throw new Error('Failed to fetch packages');

      const data = await response.json();
      setPackages(data.packages || []);
      setAddress(data.address || '');
    } catch (error) {
      console.error('Error fetching packages:', error);
      toast.error('Failed to load packages');
    } finally {
      setLoading(false);
    }
  };

  const handlePackageSelect = (pkg: Package) => {
    setSelectedPackage(pkg);
    // Scroll to show the floating CTA
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleContinue = () => {
    if (selectedPackage) {
      window.location.href = `/order?package=${selectedPackage.id}&leadId=${leadId}`;
    }
  };

  // Group packages by service type
  const packageGroups = {
    all: packages,
    fibre: packages.filter(p => p.service_type?.toLowerCase() === 'fibre'),
    wireless: packages.filter(p => p.service_type?.toLowerCase() === 'wireless'),
    '5g': packages.filter(p => p.service_type?.toLowerCase() === '5g'),
  };

  const filteredPackages = packageGroups[activeTab as keyof typeof packageGroups] || packages;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-circleTel-orange" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <Navbar />

      <div className="container mx-auto px-4 py-8 lg:py-12">
        {/* Coverage Hero Section */}
        <div className="relative bg-gradient-to-br from-circleTel-orange to-orange-600 rounded-3xl p-8 lg:p-12 mb-8 text-white overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-64 h-64 bg-white rounded-full -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full translate-x-1/2 translate-y-1/2" />
          </div>

          <div className="relative z-10 max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full mb-4">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl lg:text-4xl font-bold mb-4">
              Great News! We&apos;ve Got You Covered
            </h1>
            <div className="flex items-center justify-center gap-2 text-lg text-orange-100 mb-4">
              <MapPin className="w-5 h-5" />
              <span>{address || 'Your selected location'}</span>
            </div>
            <p className="text-lg text-orange-100">
              Choose from our available packages below and get connected today.
            </p>
          </div>
        </div>

        {/* Packages Section */}
        <div className="bg-white rounded-3xl shadow-sm overflow-hidden">
          <div className="p-8 lg:p-12">
            <div className="mb-10">
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
                All Available Packages
              </h2>
              <p className="text-gray-600">
                Choose the perfect package for your connectivity needs
              </p>
            </div>

            {/* MTN Coverage Disclaimer - Phase 1 Fallback Notice */}
            <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="font-semibold text-blue-900 flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Coverage Information
              </p>
              <p className="mt-2 text-sm text-blue-800 leading-relaxed">
                Coverage estimates are based on network provider infrastructure data and are as accurate as provided by the network providers.
                Actual availability may vary based on location and network conditions.
              </p>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <TabsList className="grid grid-cols-2 sm:grid-cols-4 bg-gray-100 p-1 rounded-xl w-full sm:w-auto">
                  <TabsTrigger
                    value="all"
                    className="rounded-lg font-medium transition-all data-[state=active]:bg-white data-[state=active]:shadow-sm"
                  >
                    All
                  </TabsTrigger>
                  <TabsTrigger
                    value="fibre"
                    className="rounded-lg font-medium transition-all data-[state=active]:bg-circleTel-orange data-[state=active]:text-white"
                  >
                    Fibre
                  </TabsTrigger>
                  <TabsTrigger
                    value="wireless"
                    className="rounded-lg font-medium transition-all data-[state=active]:bg-circleTel-orange data-[state=active]:text-white"
                  >
                    Wireless
                  </TabsTrigger>
                  <TabsTrigger
                    value="5g"
                    className="rounded-lg font-medium transition-all data-[state=active]:bg-circleTel-orange data-[state=active]:text-white"
                  >
                    5G
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* Package Grids */}
              <TabsContent value="all" className="mt-0">
                {filteredPackages.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredPackages.map((pkg, index) => (
                      <PackageCard
                        key={pkg.id}
                        package={pkg}
                        index={index}
                        onSelect={handlePackageSelect}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16 bg-gray-50 rounded-xl">
                    <p className="text-gray-500">No packages available at this time.</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="fibre" className="mt-0">
                {packageGroups.fibre.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {packageGroups.fibre.map((pkg, index) => (
                      <PackageCard
                        key={pkg.id}
                        package={pkg}
                        index={index}
                        onSelect={handlePackageSelect}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16 bg-gray-50 rounded-xl">
                    <p className="text-gray-500">No fibre packages available.</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="wireless" className="mt-0">
                {packageGroups.wireless.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {packageGroups.wireless.map((pkg, index) => (
                      <PackageCard
                        key={pkg.id}
                        package={pkg}
                        index={index}
                        onSelect={handlePackageSelect}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16 bg-gray-50 rounded-xl">
                    <p className="text-gray-500">No wireless packages available.</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="5g" className="mt-0">
                {packageGroups['5g'].length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {packageGroups['5g'].map((pkg, index) => (
                      <PackageCard
                        key={pkg.id}
                        package={pkg}
                        index={index}
                        onSelect={handlePackageSelect}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16 bg-gray-50 rounded-xl">
                    <p className="text-gray-500">No 5G packages available.</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Info Section */}
        <div className="mt-12 bg-white rounded-3xl p-8 lg:p-12 shadow-sm">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 rounded-full mb-4">
                <Zap className="w-8 h-8 text-circleTel-orange" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Super-Fast Speeds</h3>
              <p className="text-gray-600">
                From 10 Mbps to unlimited speeds, we have options for every need.
              </p>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 rounded-full mb-4">
                <Wifi className="w-8 h-8 text-circleTel-orange" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Reliable Connection</h3>
              <p className="text-gray-600">
                Enterprise-grade connectivity with 99.9% uptime guarantee.
              </p>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 rounded-full mb-4">
                <Shield className="w-8 h-8 text-circleTel-orange" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">24/7 Support</h3>
              <p className="text-gray-600">
                Our dedicated support team is always here to help you stay connected.
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-12 bg-gradient-to-r from-circleTel-orange to-orange-600 rounded-3xl p-8 lg:p-12 text-white text-center">
          <h2 className="text-2xl lg:text-3xl font-bold mb-4">
            Need help choosing the right package?
          </h2>
          <p className="text-lg text-orange-100 mb-6 max-w-2xl mx-auto">
            Our team of experts is ready to help you find the perfect connectivity solution for your needs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/contact"
              className="inline-flex items-center justify-center px-8 py-4 bg-white text-circleTel-orange font-semibold rounded-xl hover:bg-gray-100 transition-colors"
            >
              Contact Us
            </a>
            <a
              href="tel:0860123456"
              className="inline-flex items-center justify-center px-8 py-4 bg-orange-700 text-white font-semibold rounded-xl hover:bg-orange-800 transition-colors"
            >
              Call 086 012 3456
            </a>
          </div>
        </div>
      </div>

      {/* Floating CTA */}
      {selectedPackage && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-circleTel-orange shadow-2xl p-4 z-50 animate-in slide-in-from-bottom duration-300">
          <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-1">
              <div className="hidden sm:flex items-center justify-center w-12 h-12 bg-circleTel-orange rounded-full flex-shrink-0">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <div className="text-center sm:text-left">
                <h3 className="font-bold text-lg text-gray-900">{selectedPackage.name}</h3>
                <p className="text-sm text-gray-600">
                  R{(selectedPackage.promotion_price || selectedPackage.price).toFixed(2)}/month
                  {selectedPackage.promotion_price && ` (${selectedPackage.promotion_months} months promo)`}
                </p>
              </div>
            </div>
            <div className="flex gap-3 w-full sm:w-auto">
              <Button
                variant="outline"
                onClick={() => setSelectedPackage(null)}
                className="flex-1 sm:flex-none"
              >
                Change
              </Button>
              <Button
                onClick={handleContinue}
                className="flex-1 sm:flex-none bg-circleTel-orange hover:bg-orange-600 text-white px-8"
              >
                Continue with this package →
              </Button>
            </div>
          </div>
        </div>
      )}

      <Footer />

      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}

export default function PackagesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-circleTel-orange" />
      </div>
    }>
      <PackagesContent />
    </Suspense>
  );
}
