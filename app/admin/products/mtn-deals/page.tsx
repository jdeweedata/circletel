'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Search, Filter, RefreshCw, TrendingUp, Package, Smartphone } from 'lucide-react';

interface MTNDeal {
  id: string;
  deal_id: string;
  deal_name: string;
  device_name: string;
  price_plan: string;
  contract_term: number;
  monthly_price_incl_vat: number;
  device_payment_incl_vat: number;
  total_data: string;
  available_helios: boolean;
  available_ilula: boolean;
  promo_end_date: string;
  active: boolean;
}

export default function MTNDealsPage() {
  const [deals, setDeals] = useState<MTNDeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [contractFilter, setContractFilter] = useState('all');
  const [platformFilter, setPlatformFilter] = useState('all');
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    expiringSoon: 0,
    avgPrice: 0
  });

  useEffect(() => {
    fetchDeals();
    fetchStats();
  }, []);

  const fetchDeals = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/products/mtn-deals');
      const data = await response.json();
      
      if (data.success) {
        setDeals(data.deals);
      }
    } catch (error) {
      console.error('Failed to fetch deals:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/products/mtn-deals/stats');
      const data = await response.json();
      
      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const filteredDeals = deals.filter(deal => {
    const matchesSearch = 
      deal.device_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      deal.price_plan?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      deal.deal_id?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesContract = contractFilter === 'all' || deal.contract_term === parseInt(contractFilter);
    
    const matchesPlatform = 
      platformFilter === 'all' ||
      (platformFilter === 'helios' && deal.available_helios) ||
      (platformFilter === 'ilula' && deal.available_ilula);
    
    return matchesSearch && matchesContract && matchesPlatform;
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const getDaysUntilExpiry = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const days = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return days;
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-circleTel-darkNeutral">MTN Business Deals</h1>
          <p className="text-circleTel-secondaryNeutral mt-1">
            Device + Service bundles from Helios & iLula platforms
          </p>
        </div>
        <Button
          onClick={fetchDeals}
          variant="outline"
          className="border-circleTel-orange text-circleTel-orange hover:bg-circleTel-orange hover:text-white"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Deals</CardDescription>
            <CardTitle className="text-3xl">{stats.total.toLocaleString()}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-sm text-green-600">
              <Package className="w-4 h-4 mr-1" />
              All platforms
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Active Deals</CardDescription>
            <CardTitle className="text-3xl text-green-600">{stats.active.toLocaleString()}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-sm text-circleTel-secondaryNeutral">
              <TrendingUp className="w-4 h-4 mr-1" />
              Currently available
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Expiring Soon</CardDescription>
            <CardTitle className="text-3xl text-orange-600">{stats.expiringSoon.toLocaleString()}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-sm text-circleTel-secondaryNeutral">
              Next 30 days
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Avg. Monthly Price</CardDescription>
            <CardTitle className="text-3xl">{formatCurrency(stats.avgPrice)}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-sm text-circleTel-secondaryNeutral">
              Including VAT
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Search & Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search device, plan, or deal ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={contractFilter} onValueChange={setContractFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Contract Term" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Terms</SelectItem>
                <SelectItem value="12">12 Months</SelectItem>
                <SelectItem value="24">24 Months</SelectItem>
                <SelectItem value="36">36 Months</SelectItem>
              </SelectContent>
            </Select>

            <Select value={platformFilter} onValueChange={setPlatformFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Platform" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Platforms</SelectItem>
                <SelectItem value="helios">Helios Only</SelectItem>
                <SelectItem value="ilula">iLula Only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="text-sm text-circleTel-secondaryNeutral">
            Showing {filteredDeals.length} of {deals.length} deals
          </div>
        </CardContent>
      </Card>

      {/* Deals List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-circleTel-orange" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredDeals.map((deal) => {
            const daysLeft = getDaysUntilExpiry(deal.promo_end_date);
            const isExpiring = daysLeft < 30;

            return (
              <Card key={deal.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Smartphone className="w-5 h-5 text-circleTel-orange" />
                        {deal.device_name || 'No Device'}
                      </CardTitle>
                      <CardDescription className="mt-1">{deal.price_plan}</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      {deal.available_helios && (
                        <Badge variant="outline" className="text-xs">Helios</Badge>
                      )}
                      {deal.available_ilula && (
                        <Badge variant="outline" className="text-xs">iLula</Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-circleTel-secondaryNeutral">Deal ID</p>
                      <p className="font-mono font-medium">{deal.deal_id}</p>
                    </div>
                    <div>
                      <p className="text-circleTel-secondaryNeutral">Contract</p>
                      <p className="font-medium">{deal.contract_term} months</p>
                    </div>
                    <div>
                      <p className="text-circleTel-secondaryNeutral">Monthly</p>
                      <p className="font-bold text-circleTel-orange">
                        {formatCurrency(deal.monthly_price_incl_vat)}
                      </p>
                    </div>
                    <div>
                      <p className="text-circleTel-secondaryNeutral">Device Payment</p>
                      <p className="font-medium">
                        {formatCurrency(deal.device_payment_incl_vat)}
                      </p>
                    </div>
                    {deal.total_data && (
                      <div>
                        <p className="text-circleTel-secondaryNeutral">Data</p>
                        <p className="font-medium">{deal.total_data}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-circleTel-secondaryNeutral">Expires</p>
                      <p className={`font-medium ${isExpiring ? 'text-orange-600' : ''}`}>
                        {daysLeft > 0 ? `${daysLeft} days` : 'Expired'}
                      </p>
                    </div>
                  </div>

                  {isExpiring && daysLeft > 0 && (
                    <div className="bg-orange-50 border border-orange-200 rounded p-2 text-xs text-orange-700">
                      ⚠️ Expiring soon - {daysLeft} days remaining
                    </div>
                  )}

                  <Button
                    className="w-full bg-circleTel-orange hover:bg-[#e67516]"
                    onClick={() => {
                      // TODO: Add to quote functionality
                      alert('Add to Quote feature coming soon!');
                    }}
                  >
                    Add to Quote
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {!loading && filteredDeals.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No deals found</h3>
            <p className="text-gray-500">
              Try adjusting your search criteria or filters
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
