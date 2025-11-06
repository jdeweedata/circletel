'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Search, Smartphone, Plus, TrendingUp } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface MTNDeal {
  id: string;
  deal_id: string;
  deal_name: string;
  device_name: string;
  price_plan: string;
  contract_term: number;
  monthly_price_incl_vat: number;
  monthly_price_ex_vat: number;
  device_payment_incl_vat: number;
  total_data: string;
  total_minutes: string;
  sms_bundle: string;
  available_helios: boolean;
  available_ilula: boolean;
  promo_end_date: string;
  active: boolean;
}

interface MTNDealSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectDeal: (deal: MTNDeal) => void;
  contractTerm?: number;
  customerProfile?: {
    budget?: number;
    dataUsage?: 'low' | 'medium' | 'high';
    devicePreference?: string;
  };
}

export function MTNDealSelector({
  isOpen,
  onClose,
  onSelectDeal,
  contractTerm,
  customerProfile
}: MTNDealSelectorProps) {
  const [deals, setDeals] = useState<MTNDeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [contractFilter, setContractFilter] = useState<string>(contractTerm?.toString() || 'all');
  const [platformFilter, setPlatformFilter] = useState('all');
  const [showRecommended, setShowRecommended] = useState(!!customerProfile);

  useEffect(() => {
    if (isOpen) {
      if (showRecommended && customerProfile) {
        fetchRecommendations();
      } else {
        fetchDeals();
      }
    }
  }, [isOpen, showRecommended, contractFilter, platformFilter]);

  const fetchDeals = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('limit', '50');
      
      if (contractFilter !== 'all') {
        params.append('contract_term', contractFilter);
      }
      if (platformFilter !== 'all') {
        params.append('platform', platformFilter);
      }
      if (searchQuery) {
        params.append('search', searchQuery);
      }

      const response = await fetch(`/api/products/mtn-deals?${params}`);
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

  const fetchRecommendations = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/products/mtn-deals/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          budget: customerProfile?.budget,
          preferredContractTerm: contractTerm || 24,
          dataUsage: customerProfile?.dataUsage || 'medium',
          devicePreference: customerProfile?.devicePreference,
          limit: 10
        })
      });

      const data = await response.json();

      if (data.success) {
        setDeals(data.recommendations.map((rec: any) => rec.deal));
      }
    } catch (error) {
      console.error('Failed to fetch recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    fetchDeals();
  };

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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-circleTel-orange" />
            Select MTN Business Deal
          </DialogTitle>
          <DialogDescription>
            Choose a device + service bundle to add to the quote
          </DialogDescription>
        </DialogHeader>

        {/* View Toggle */}
        {customerProfile && (
          <div className="flex gap-2 mb-4">
            <Button
              variant={showRecommended ? 'default' : 'outline'}
              size="sm"
              onClick={() => setShowRecommended(true)}
              className={showRecommended ? 'bg-circleTel-orange' : ''}
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Recommended
            </Button>
            <Button
              variant={!showRecommended ? 'default' : 'outline'}
              size="sm"
              onClick={() => setShowRecommended(false)}
            >
              Browse All
            </Button>
          </div>
        )}

        {/* Filters */}
        {!showRecommended && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div className="md:col-span-2 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search device or plan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
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
                <SelectItem value="helios">Helios</SelectItem>
                <SelectItem value="ilula">iLula</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Deals List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-circleTel-orange" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {deals.map((deal) => {
              const daysLeft = getDaysUntilExpiry(deal.promo_end_date);
              const isExpiring = daysLeft < 30 && daysLeft > 0;
              const totalMonthly = deal.monthly_price_incl_vat + deal.device_payment_incl_vat;

              return (
                <Card key={deal.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-base flex items-center gap-2">
                          {deal.device_name || 'Device Bundle'}
                        </CardTitle>
                        <CardDescription className="text-sm mt-1">
                          {deal.price_plan}
                        </CardDescription>
                      </div>
                      <div className="flex gap-1">
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
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-gray-500">Contract</p>
                        <p className="font-medium">{deal.contract_term} months</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Monthly</p>
                        <p className="font-bold text-circleTel-orange">
                          {formatCurrency(deal.monthly_price_incl_vat)}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Device</p>
                        <p className="font-medium">
                          {formatCurrency(deal.device_payment_incl_vat)}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Total/Month</p>
                        <p className="font-bold">
                          {formatCurrency(totalMonthly)}
                        </p>
                      </div>
                      {deal.total_data && (
                        <div>
                          <p className="text-gray-500">Data</p>
                          <p className="font-medium">{deal.total_data}</p>
                        </div>
                      )}
                      {deal.total_minutes && (
                        <div>
                          <p className="text-gray-500">Minutes</p>
                          <p className="font-medium">{deal.total_minutes}</p>
                        </div>
                      )}
                    </div>

                    {isExpiring && (
                      <div className="bg-orange-50 border border-orange-200 rounded p-2 text-xs text-orange-700">
                        ⚠️ Expiring in {daysLeft} days
                      </div>
                    )}

                    <Button
                      className="w-full bg-circleTel-orange hover:bg-[#e67516]"
                      onClick={() => {
                        onSelectDeal(deal);
                        onClose();
                      }}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add to Quote
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {!loading && deals.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <Smartphone className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p>No deals found matching your criteria</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
