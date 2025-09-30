'use client';

import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Wifi, Zap, Star } from 'lucide-react';

interface PricingCardProps {
  price: string;
  originalPrice?: string;
  speed: string;
  provider: string;
  serviceType: string;
  signalQuality: 'excellent' | 'good' | 'fair';
  features: string[];
  isPopular?: boolean;
  onSelect: () => void;
}

const getSignalIcon = (quality: string) => {
  switch (quality) {
    case 'excellent':
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case 'good':
      return <Wifi className="h-4 w-4 text-blue-500" />;
    default:
      return <Zap className="h-4 w-4 text-orange-500" />;
  }
};

const getSignalColor = (quality: string) => {
  switch (quality) {
    case 'excellent':
      return 'text-green-600';
    case 'good':
      return 'text-blue-600';
    default:
      return 'text-orange-600';
  }
};

const getProviderLogo = (provider: string) => {
  // Map provider names to display names/logos
  const providerMap: Record<string, string> = {
    'MTN': 'MTN',
    'Vodacom': 'Vodacom',
    'Telkom': 'Telkom',
    'Vuma': 'Vuma',
    'MetroFibre': 'MetroFibre',
    'Openserve': 'Openserve',
    'DFA': 'DFA',
    'Frogfoot': 'Frogfoot',
    'Evotel': 'Evotel',
    'CircleTel': 'CircleTel'
  };

  return providerMap[provider] || provider;
};

export function PricingCard({
  price,
  originalPrice,
  speed,
  provider,
  serviceType,
  signalQuality,
  features,
  isPopular = false,
  onSelect
}: PricingCardProps) {
  return (
    <Card className={`relative w-full max-w-sm transition-all duration-200 hover:shadow-lg ${
      isPopular ? 'ring-2 ring-orange-500 scale-105' : 'hover:scale-102'
    }`}>
      {isPopular && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <Badge className="bg-orange-500 text-white px-3 py-1 text-xs font-medium">
            <Star className="h-3 w-3 mr-1" />
            Most Popular
          </Badge>
        </div>
      )}

      <CardHeader className="text-center pb-4">
        {/* Price Section */}
        <div className="bg-gray-900 text-white rounded-lg py-3 px-4 mb-3">
          <div className="flex items-center justify-center gap-2">
            <span className="text-2xl font-bold">R{price}</span>
            {originalPrice && (
              <span className="text-sm text-gray-400 line-through">R{originalPrice}</span>
            )}
          </div>
          <p className="text-xs text-gray-300 mt-1">uncapped {serviceType.toLowerCase()}</p>
        </div>

        {/* Provider Logo/Name */}
        <div className="flex items-center justify-center mb-2">
          <div className="bg-white border rounded px-3 py-2 text-sm font-medium text-gray-700">
            {getProviderLogo(provider)}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 text-center">
        {/* Speed Information */}
        <div className="space-y-1">
          <p className="text-sm text-gray-600">Download Speed</p>
          <p className="text-xl font-semibold text-gray-900">{speed}</p>
        </div>

        {/* Signal Quality */}
        <div className="flex items-center justify-center gap-2">
          {getSignalIcon(signalQuality)}
          <span className={`text-sm font-medium ${getSignalColor(signalQuality)}`}>
            {signalQuality} signal
          </span>
        </div>

        {/* Features */}
        <div className="space-y-2 text-left">
          {features.slice(0, 4).map((feature, index) => (
            <div key={index} className="flex items-center gap-2 text-sm text-gray-600">
              <CheckCircle className="h-3 w-3 text-green-500 flex-shrink-0" />
              <span>{feature}</span>
            </div>
          ))}
        </div>
      </CardContent>

      <CardFooter className="pt-4">
        <Button
          onClick={onSelect}
          className="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium py-3 rounded-lg transition-colors"
        >
          Check out plan
        </Button>
      </CardFooter>
    </Card>
  );
}