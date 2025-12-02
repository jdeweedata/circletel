'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Search,
  Filter,
  SlidersHorizontal,
  Signal,
  Zap,
  Smartphone,
  SimCard,
  ChevronLeft,
  ChevronRight,
  Loader2,
  X,
} from 'lucide-react';
import { MTNDealCard, MTNDealGrid, MTNDeal } from '@/components/deals/MTNDealCard';

// Format currency
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export default function DealsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // State
  const [deals, setDeals] = useState<MTNDeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  
  // Filters
  const [search, setSearch] = useState('');
  const [technology, setTechnology] = useState<string>('all');
  const [contractTerm, setContractTerm] = useState<string>('all');
  const [hasDevice, setHasDevice] = useState<string>('all');
  const [sortBy, setSortBy] = useState('price_asc');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 5000]);
  const [filterOptions, setFilterOptions] = useState<any>(null);
  
  // Active tab
  const [activeTab, setActiveTab] = useState('all');
  
  // Fetch deals
  const fetchDeals = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        per_page: '24',
        sort_by: sortBy,
      });
      
      if (technology !== 'all') params.append('technology', technology);
      if (contractTerm !== 'all') params.append('contract_term', contractTerm);
      if (hasDevice !== 'all') params.append('has_device', hasDevice);
      if (search) params.append('search', search);
      if (priceRange[0] > 0) params.append('min_price', priceRange[0].toString());
      if (priceRange[1] < 5000) params.append('max_price', priceRange[1].toString());
      
      const response = await fetch(`/api/deals/mtn?${params}`);
      const result = await response.json();
      
      if (result.success) {
        setDeals(result.data.deals);
        setTotalPages(result.data.pagination.total_pages);
        setTotal(result.data.pagination.total);
        if (!filterOptions) {
          setFilterOptions(result.data.filters);
        }
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Failed to load deals');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchDeals();
  }, [page, technology, contractTerm, hasDevice, sortBy, search, priceRange]);
  
  // Handle deal selection
  const handleSelectDeal = (deal: MTNDeal) => {
    // Navigate to order flow with deal selected
    router.push(`/order/mobile-deal?deal_id=${deal.id}`);
  };
  
  // Clear filters
  const clearFilters = () => {
    setSearch('');
    setTechnology('all');
    setContractTerm('all');
    setHasDevice('all');
    setPriceRange([0, 5000]);
    setPage(1);
  };
  
  // Check if any filters are active
  const hasActiveFilters = search || technology !== 'all' || contractTerm !== 'all' || hasDevice !== 'all' || priceRange[0] > 0 || priceRange[1] < 5000;
  
  // Filter sidebar content
  const FilterContent = () => (
    <div className="space-y-6">
      {/* Search */}
      <div className="space-y-2">
        <Label>Search</Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search deals..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-10"
          />
        </div>
      </div>
      
      {/* Technology */}
      <div className="space-y-2">
        <Label>Technology</Label>
        <Select value={technology} onValueChange={(v) => { setTechnology(v); setPage(1); }}>
          <SelectTrigger>
            <SelectValue placeholder="All Technologies" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Technologies</SelectItem>
            <SelectItem value="LTE">LTE</SelectItem>
            <SelectItem value="5G">5G</SelectItem>
            <SelectItem value="LTE/5G">LTE/5G</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {/* Contract Term */}
      <div className="space-y-2">
        <Label>Contract Term</Label>
        <Select value={contractTerm} onValueChange={(v) => { setContractTerm(v); setPage(1); }}>
          <SelectTrigger>
            <SelectValue placeholder="All Terms" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Terms</SelectItem>
            <SelectItem value="0">Month-to-Month</SelectItem>
            <SelectItem value="12">12 Months</SelectItem>
            <SelectItem value="24">24 Months</SelectItem>
            <SelectItem value="36">36 Months</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {/* Device Type */}
      <div className="space-y-2">
        <Label>Deal Type</Label>
        <Select value={hasDevice} onValueChange={(v) => { setHasDevice(v); setPage(1); }}>
          <SelectTrigger>
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="true">With Device</SelectItem>
            <SelectItem value="false">SIM Only</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {/* Price Range */}
      <div className="space-y-4">
        <Label>Price Range (per month)</Label>
        <div className="px-2">
          <Slider
            value={priceRange}
            onValueChange={(v) => setPriceRange(v as [number, number])}
            min={0}
            max={5000}
            step={50}
            className="w-full"
          />
        </div>
        <div className="flex justify-between text-sm text-gray-500">
          <span>{formatCurrency(priceRange[0])}</span>
          <span>{formatCurrency(priceRange[1])}</span>
        </div>
      </div>
      
      {/* Clear Filters */}
      {hasActiveFilters && (
        <Button variant="outline" className="w-full" onClick={clearFilters}>
          <X className="h-4 w-4 mr-2" />
          Clear Filters
        </Button>
      )}
    </div>
  );
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 right-0 w-96 h-96 bg-circleTel-orange rounded-full blur-3xl translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500 rounded-full blur-3xl -translate-x-1/2 translate-y-1/2" />
        </div>
        
        <div className="container mx-auto px-4 py-12 md:py-16 relative">
          <div className="max-w-3xl">
            <Badge className="bg-circleTel-orange text-white mb-4">
              <Signal className="h-3 w-3 mr-1" />
              Business Mobile
            </Badge>
            
            <h1 className="text-3xl md:text-5xl font-bold mb-4">
              Mobile Deals for Your Business
            </h1>
            
            <p className="text-lg text-gray-300 mb-6 max-w-2xl">
              Discover our range of mobile deals with devices and SIM-only options.
              Flexible contracts, great data bundles, and competitive pricing.
            </p>
            
            {/* Quick Stats */}
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full">
                <Smartphone className="h-4 w-4" />
                <span className="text-sm">Device Deals</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full">
                <SimCard className="h-4 w-4" />
                <span className="text-sm">SIM Only</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full">
                <Zap className="h-4 w-4" />
                <span className="text-sm">5G Available</span>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Main Content */}
      <section className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Desktop Sidebar */}
          <aside className="hidden lg:block w-72 flex-shrink-0">
            <Card className="sticky top-4">
              <CardContent className="p-6">
                <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
                  <SlidersHorizontal className="h-5 w-5" />
                  Filters
                </h2>
                <FilterContent />
              </CardContent>
            </Card>
          </aside>
          
          {/* Main Content */}
          <div className="flex-1">
            {/* Mobile Filter Button & Sort */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                {/* Mobile Filter Sheet */}
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline" className="lg:hidden">
                      <Filter className="h-4 w-4 mr-2" />
                      Filters
                      {hasActiveFilters && (
                        <Badge className="ml-2 bg-circleTel-orange text-white">!</Badge>
                      )}
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left">
                    <SheetHeader>
                      <SheetTitle>Filters</SheetTitle>
                      <SheetDescription>
                        Narrow down your search
                      </SheetDescription>
                    </SheetHeader>
                    <div className="mt-6">
                      <FilterContent />
                    </div>
                  </SheetContent>
                </Sheet>
                
                <p className="text-sm text-gray-500">
                  {total.toLocaleString()} deals found
                </p>
              </div>
              
              {/* Sort */}
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="price_asc">Price: Low to High</SelectItem>
                  <SelectItem value="price_desc">Price: High to Low</SelectItem>
                  <SelectItem value="data_desc">Most Data</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Quick Tabs */}
            <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); setHasDevice(v === 'all' ? 'all' : v === 'devices' ? 'true' : 'false'); setPage(1); }} className="mb-6">
              <TabsList>
                <TabsTrigger value="all">All Deals</TabsTrigger>
                <TabsTrigger value="devices">
                  <Smartphone className="h-4 w-4 mr-1" />
                  With Device
                </TabsTrigger>
                <TabsTrigger value="sim">
                  <SimCard className="h-4 w-4 mr-1" />
                  SIM Only
                </TabsTrigger>
              </TabsList>
            </Tabs>
            
            {/* Error State */}
            {error && (
              <Card className="mb-6 border-red-200 bg-red-50">
                <CardContent className="p-4 text-center text-red-600">
                  {error}
                </CardContent>
              </Card>
            )}
            
            {/* Deals Grid */}
            <MTNDealGrid 
              deals={deals} 
              onSelect={handleSelectDeal}
              loading={loading}
              emptyMessage="No deals match your filters. Try adjusting your search criteria."
            />
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 mt-8">
                <Button
                  variant="outline"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                <span className="text-sm text-gray-500">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="bg-circleTel-orange text-white py-12">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            Need Help Choosing?
          </h2>
          <p className="text-lg mb-6 opacity-90 max-w-2xl mx-auto">
            Our team can help you find the perfect deal for your business needs.
            Get personalized recommendations based on your requirements.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button size="lg" variant="secondary" className="bg-white text-circleTel-orange hover:bg-gray-100">
              Request a Quote
            </Button>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
              Contact Sales
            </Button>
          </div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
}
