'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  CheckCircle,
  MapPin,
  Zap,
  ArrowRight,
  Filter,
  Grid3x3,
  List,
  Loader2,
  Home,
  Building2,
  Wifi,
} from 'lucide-react';
import { ProductCard } from '@/components/products/ProductCard';
import { PackageComparison } from '@/components/coverage/PackageComparison';

interface ServicePackage {
  id: string;
  name: string;
  service_type: string;
  product_category: string;
  speed_down: number;
  speed_up: number;
  price: number;
  promotion_price?: number;
  promotion_months?: number;
  description: string;
  features: string[];
  installation_fee?: number;
  router_included?: boolean;
}

interface CoverageResultData {
  available: boolean;
  leadId: string;
  address: string;
  coordinates: { lat: number; lng: number };
  services: string[];
  packages: ServicePackage[];
}

type ViewMode = 'grid' | 'comparison';
type SortBy = 'price-low' | 'price-high' | 'speed-high' | 'speed-low';
type FilterCategory = 'all' | 'fibre' | 'wireless' | 'business' | 'home';

export default function CoverageResultsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const leadId = searchParams.get('leadId');

  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState<CoverageResultData | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortBy>('price-low');
  const [filterCategory, setFilterCategory] = useState<FilterCategory>('all');
  const [selectedPackages, setSelectedPackages] = useState<string[]>([]);

  useEffect(() => {
    if (!leadId) {
      router.push('/coverage');
      return;
    }

    fetchCoverageResults();
  }, [leadId, router]);

  const fetchCoverageResults = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/coverage/packages?leadId=${leadId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch coverage results');
      }

      const data = await response.json();

      if (!data.available) {
        router.push('/coverage');
        return;
      }

      setResults(data);
    } catch (error) {
      console.error('Error fetching coverage results:', error);
      router.push('/coverage');
    } finally {
      setLoading(false);
    }
  };

  const getFilteredPackages = (): ServicePackage[] => {
    if (!results?.packages) return [];

    let filtered = [...results.packages];

    // Apply category filter
    if (filterCategory !== 'all') {
      filtered = filtered.filter((pkg) => {
        switch (filterCategory) {
          case 'fibre':
            return pkg.service_type.toLowerCase().includes('fibre');
          case 'wireless':
            return pkg.service_type.toLowerCase().includes('wireless') ||
                   pkg.service_type.toLowerCase().includes('lte') ||
                   pkg.service_type.toLowerCase().includes('5g');
          case 'business':
            return pkg.product_category.toLowerCase().includes('business') ||
                   pkg.name.toLowerCase().includes('biz');
          case 'home':
            return pkg.product_category.toLowerCase().includes('home') ||
                   pkg.product_category.toLowerCase().includes('residential');
          default:
            return true;
        }
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price-low':
          return (a.promotion_price || a.price) - (b.promotion_price || b.price);
        case 'price-high':
          return (b.promotion_price || b.price) - (a.promotion_price || a.price);
        case 'speed-high':
          return b.speed_down - a.speed_down;
        case 'speed-low':
          return a.speed_down - b.speed_down;
        default:
          return 0;
      }
    });

    return filtered;
  };

  const handlePackageSelect = (packageId: string) => {
    if (viewMode === 'comparison') {
      setSelectedPackages((prev) => {
        if (prev.includes(packageId)) {
          return prev.filter((id) => id !== packageId);
        } else if (prev.length < 3) {
          return [...prev, packageId];
        }
        return prev;
      });
    } else {
      // Navigate to order page
      router.push(`/order/consumer?package=${packageId}&lead=${leadId}`);
    }
  };

  const getServiceIcon = (serviceType: string) => {
    if (serviceType.toLowerCase().includes('fibre')) return Building2;
    if (serviceType.toLowerCase().includes('wireless') ||
        serviceType.toLowerCase().includes('lte') ||
        serviceType.toLowerCase().includes('5g')) return Wifi;
    return Home;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-circleTel-lightNeutral via-white to-circleTel-lightNeutral flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-circleTel-orange mx-auto mb-4" />
          <p className="text-lg text-circleTel-secondaryNeutral">Loading your coverage results...</p>
        </div>
      </div>
    );
  }

  if (!results) {
    return null;
  }

  const filteredPackages = getFilteredPackages();

  return (
    <div className="min-h-screen bg-gradient-to-br from-circleTel-lightNeutral via-white to-circleTel-lightNeutral">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-2">
              <img src="/logo.svg" alt="CircleTel" className="h-8 w-auto" />
              <span className="text-xl font-bold text-circleTel-darkNeutral">CircleTel</span>
            </Link>
            <nav className="hidden md:flex items-center space-x-6">
              <Link href="/" className="text-circleTel-secondaryNeutral hover:text-circleTel-orange transition-colors">Home</Link>
              <Link href="/bundles" className="text-circleTel-secondaryNeutral hover:text-circleTel-orange transition-colors">Bundles</Link>
              <Link href="/contact" className="text-circleTel-secondaryNeutral hover:text-circleTel-orange transition-colors">Contact</Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Success Header */}
        <div className="text-center max-w-4xl mx-auto mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-circleTel-darkNeutral">
              Great news! We can connect you
            </h1>
          </div>

          <div className="flex items-center justify-center gap-2 text-circleTel-secondaryNeutral mb-2">
            <MapPin className="w-4 h-4" />
            <p className="text-lg">{results.address}</p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2">
            {results.services.map((service) => {
              const Icon = getServiceIcon(service);
              return (
                <Badge key={service} variant="secondary" className="flex items-center gap-1">
                  <Icon className="w-3 h-3" />
                  {service}
                </Badge>
              );
            })}
          </div>
        </div>

        {/* Filters and View Controls */}
        <div className="bg-white rounded-lg shadow-sm border border-circleTel-lightNeutral p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex flex-wrap gap-4 items-center">
              {/* Category Filter */}
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-circleTel-secondaryNeutral" />
                <Select value={filterCategory} onValueChange={(value) => setFilterCategory(value as FilterCategory)}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Packages</SelectItem>
                    <SelectItem value="fibre">Fibre Only</SelectItem>
                    <SelectItem value="wireless">Wireless Only</SelectItem>
                    <SelectItem value="business">Business</SelectItem>
                    <SelectItem value="home">Home</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Sort By */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-circleTel-secondaryNeutral">Sort by:</span>
                <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortBy)}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="price-low">Price: Low to High</SelectItem>
                    <SelectItem value="price-high">Price: High to Low</SelectItem>
                    <SelectItem value="speed-high">Speed: Fastest First</SelectItem>
                    <SelectItem value="speed-low">Speed: Slowest First</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="text-sm text-circleTel-secondaryNeutral">
                {filteredPackages.length} package{filteredPackages.length !== 1 ? 's' : ''} available
              </div>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-2 bg-circleTel-lightNeutral rounded-lg p-1">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className={viewMode === 'grid' ? 'bg-circleTel-orange hover:bg-circleTel-orange/90' : ''}
              >
                <Grid3x3 className="w-4 h-4 mr-2" />
                Grid
              </Button>
              <Button
                variant={viewMode === 'comparison' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('comparison')}
                className={viewMode === 'comparison' ? 'bg-circleTel-orange hover:bg-circleTel-orange/90' : ''}
              >
                <List className="w-4 h-4 mr-2" />
                Compare
              </Button>
            </div>
          </div>

          {viewMode === 'comparison' && (
            <div className="mt-3 pt-3 border-t border-circleTel-lightNeutral">
              <p className="text-sm text-circleTel-secondaryNeutral">
                Select up to 3 packages to compare side-by-side. {selectedPackages.length}/3 selected
              </p>
            </div>
          )}
        </div>

        {/* Packages Display */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {filteredPackages.map((pkg, index) => (
              <ProductCard
                key={pkg.id}
                {...pkg}
                isPopular={index === 1}
                onSelect={() => handlePackageSelect(pkg.id)}
              />
            ))}
          </div>
        ) : (
          <>
            {selectedPackages.length > 0 ? (
              <PackageComparison
                packages={filteredPackages.filter((pkg) => selectedPackages.includes(pkg.id))}
                onSelectPackage={(packageId) => router.push(`/order/consumer?package=${packageId}&lead=${leadId}`)}
                onRemovePackage={(packageId) => setSelectedPackages((prev) => prev.filter((id) => id !== packageId))}
              />
            ) : (
              <div className="bg-white rounded-lg border-2 border-dashed border-circleTel-lightNeutral p-12 text-center mb-6">
                <List className="w-12 h-12 text-circleTel-secondaryNeutral mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-circleTel-darkNeutral mb-2">
                  Select packages to compare
                </h3>
                <p className="text-circleTel-secondaryNeutral mb-6">
                  Click on packages below to add them to the comparison view
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPackages.map((pkg) => (
                <ProductCard
                  key={pkg.id}
                  {...pkg}
                  isSelected={selectedPackages.includes(pkg.id)}
                  onSelect={() => handlePackageSelect(pkg.id)}
                  selectable
                />
              ))}
            </div>
          </>
        )}

        {/* No Results */}
        {filteredPackages.length === 0 && (
          <div className="text-center py-12">
            <Zap className="w-16 h-16 text-circleTel-secondaryNeutral mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-circleTel-darkNeutral mb-2">
              No packages match your filters
            </h3>
            <p className="text-circleTel-secondaryNeutral mb-4">
              Try adjusting your filters to see more options
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setFilterCategory('all');
                setSortBy('price-low');
              }}
            >
              Reset Filters
            </Button>
          </div>
        )}

        {/* CTA Section */}
        <div className="mt-12 bg-gradient-to-r from-circleTel-orange to-orange-600 rounded-2xl p-8 text-white text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            Need help choosing the right package?
          </h2>
          <p className="text-lg mb-6 max-w-2xl mx-auto">
            Our connectivity experts are here to help you find the perfect solution for your needs
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              variant="secondary"
              className="bg-white text-circleTel-orange hover:bg-white/90"
              onClick={() => window.location.href = 'tel:0860247253'}
            >
              Call 0860 CIRCLE
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white text-white hover:bg-white/10"
              onClick={() => window.location.href = '/contact'}
            >
              Contact Support
            </Button>
          </div>
        </div>

        {/* Check Another Address */}
        <div className="mt-8 text-center">
          <Link href="/coverage">
            <Button variant="outline" size="lg">
              <MapPin className="w-4 h-4 mr-2" />
              Check Another Address
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
