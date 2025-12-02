'use client';

import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Smartphone, 
  SimCard, 
  Signal, 
  Wifi,
  Phone,
  MessageSquare,
  Database,
  Gift,
  Calendar,
  ChevronRight,
  Zap
} from 'lucide-react';

// Note: These are CircleTel-branded deals (sourced from MTN dealer network)
export interface MTNDeal {
  id: string;
  deal_id: string;
  price_plan: string;
  device_name: string | null;
  has_device: boolean;
  technology: 'LTE' | '5G' | 'LTE/5G';
  contract_term: number;
  contract_term_label: string;
  mtn_price_incl_vat: number;
  selling_price_incl_vat: number;
  data_bundle: string | null;
  data_bundle_gb: number | null;
  anytime_minutes: string | null;
  sms_bundle: string | null;
  once_off_pay_in_incl_vat: number;
  freebies_device: string | null;
  freebies_priceplan: string | null;
  free_sim: boolean;
  promo_start_date: string | null;
  promo_end_date: string | null;
}

interface DealCardProps {
  deal: MTNDeal;
  onSelect?: (deal: MTNDeal) => void;
  variant?: 'default' | 'compact' | 'featured';
  showOrderButton?: boolean;
}

// Format currency
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// Parse data value from string like "20.0GB"
const parseDataValue = (dataStr: string | null): string => {
  if (!dataStr) return '0GB';
  return dataStr.replace('.0GB', 'GB');
};

// Parse minutes from string like "500min"
const parseMinutes = (minStr: string | null): string => {
  if (!minStr || minStr === '0min') return '0';
  return minStr.replace('min', '');
};

export function MTNDealCard({ 
  deal, 
  onSelect, 
  variant = 'default',
  showOrderButton = true 
}: DealCardProps) {
  const is5G = deal.technology === '5G' || deal.technology === 'LTE/5G';
  const hasFreebies = deal.freebies_device || deal.freebies_priceplan || deal.free_sim;
  
  if (variant === 'compact') {
    return (
      <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => onSelect?.(deal)}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {deal.has_device ? (
                <div className="p-2 bg-gray-100 rounded-lg">
                  <Smartphone className="h-5 w-5 text-gray-600" />
                </div>
              ) : (
                <div className="p-2 bg-orange-100 rounded-lg">
                  <SimCard className="h-5 w-5 text-circleTel-orange" />
                </div>
              )}
              <div>
                <p className="font-medium text-sm line-clamp-1">
                  {deal.has_device ? deal.device_name : deal.price_plan}
                </p>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span>{parseDataValue(deal.data_bundle)}</span>
                  <span>•</span>
                  <span>{deal.contract_term_label}</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="font-bold text-circleTel-orange">
                {formatCurrency(deal.selling_price_incl_vat)}
              </p>
              <p className="text-xs text-gray-500">per month</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className={`overflow-hidden hover:shadow-lg transition-all ${variant === 'featured' ? 'border-circleTel-orange border-2' : ''}`}>
      {/* Header */}
      <div className={`px-4 py-3 ${is5G ? 'bg-gradient-to-r from-purple-600 to-blue-600' : 'bg-gradient-to-r from-gray-800 to-gray-700'} text-white`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {is5G ? (
              <Zap className="h-4 w-4" />
            ) : (
              <Signal className="h-4 w-4" />
            )}
            <span className="font-semibold text-sm">{deal.technology}</span>
          </div>
          <Badge variant="secondary" className="bg-white/20 text-white text-xs">
            {deal.contract_term_label}
          </Badge>
        </div>
      </div>
      
      <CardContent className="p-4 space-y-4">
        {/* Device/Plan Name */}
        <div className="flex items-start gap-3">
          {deal.has_device ? (
            <div className="p-2 bg-gray-100 rounded-lg flex-shrink-0">
              <Smartphone className="h-6 w-6 text-gray-600" />
            </div>
          ) : (
            <div className="p-2 bg-orange-100 rounded-lg flex-shrink-0">
              <SimCard className="h-6 w-6 text-circleTel-orange" />
            </div>
          )}
          <div className="min-w-0">
            <h3 className="font-semibold text-gray-900 line-clamp-2">
              {deal.has_device ? deal.device_name : 'SIM Only'}
            </h3>
            <p className="text-sm text-gray-500 line-clamp-1">{deal.price_plan}</p>
          </div>
        </div>
        
        {/* Price */}
        <div className="text-center py-3 bg-gray-50 rounded-lg">
          <p className="text-3xl font-bold text-circleTel-orange">
            {formatCurrency(deal.selling_price_incl_vat)}
          </p>
          <p className="text-sm text-gray-500">per month</p>
          {deal.once_off_pay_in_incl_vat > 0 && (
            <p className="text-xs text-gray-400 mt-1">
              + {formatCurrency(deal.once_off_pay_in_incl_vat)} once-off
            </p>
          )}
        </div>
        
        {/* Bundle Details */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-2 bg-blue-50 rounded-lg">
            <Database className="h-4 w-4 text-blue-600 mx-auto mb-1" />
            <p className="text-sm font-semibold text-blue-900">{parseDataValue(deal.data_bundle)}</p>
            <p className="text-xs text-blue-600">Data</p>
          </div>
          <div className="p-2 bg-green-50 rounded-lg">
            <Phone className="h-4 w-4 text-green-600 mx-auto mb-1" />
            <p className="text-sm font-semibold text-green-900">{parseMinutes(deal.anytime_minutes)}</p>
            <p className="text-xs text-green-600">Minutes</p>
          </div>
          <div className="p-2 bg-purple-50 rounded-lg">
            <MessageSquare className="h-4 w-4 text-purple-600 mx-auto mb-1" />
            <p className="text-sm font-semibold text-purple-900">{deal.sms_bundle?.replace('sms', '') || '0'}</p>
            <p className="text-xs text-purple-600">SMS</p>
          </div>
        </div>
        
        {/* Freebies */}
        {hasFreebies && (
          <div className="flex items-center gap-2 p-2 bg-amber-50 rounded-lg">
            <Gift className="h-4 w-4 text-amber-600 flex-shrink-0" />
            <p className="text-xs text-amber-800 line-clamp-1">
              {deal.free_sim && 'Free SIM'}
              {deal.freebies_device && ` • ${deal.freebies_device}`}
              {deal.freebies_priceplan && ` • ${deal.freebies_priceplan}`}
            </p>
          </div>
        )}
      </CardContent>
      
      {showOrderButton && (
        <CardFooter className="p-4 pt-0">
          <Button 
            className="w-full bg-circleTel-orange hover:bg-orange-600"
            onClick={() => onSelect?.(deal)}
          >
            Select Deal
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}

// Grid component for displaying multiple deals
interface DealGridProps {
  deals: MTNDeal[];
  onSelect?: (deal: MTNDeal) => void;
  variant?: 'default' | 'compact';
  loading?: boolean;
  emptyMessage?: string;
}

export function MTNDealGrid({ 
  deals, 
  onSelect, 
  variant = 'default',
  loading = false,
  emptyMessage = 'No deals found'
}: DealGridProps) {
  if (loading) {
    return (
      <div className={`grid gap-4 ${variant === 'compact' ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'}`}>
        {[...Array(8)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <div className="h-12 bg-gray-200" />
            <CardContent className="p-4 space-y-3">
              <div className="h-12 bg-gray-100 rounded" />
              <div className="h-20 bg-gray-100 rounded" />
              <div className="h-16 bg-gray-100 rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }
  
  if (deals.length === 0) {
    return (
      <div className="text-center py-12">
        <SimCard className="h-12 w-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500">{emptyMessage}</p>
      </div>
    );
  }
  
  return (
    <div className={`grid gap-4 ${variant === 'compact' ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'}`}>
      {deals.map((deal) => (
        <MTNDealCard 
          key={deal.id} 
          deal={deal} 
          onSelect={onSelect}
          variant={variant}
        />
      ))}
    </div>
  );
}
