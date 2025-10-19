'use client';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Wifi, Zap, Router } from 'lucide-react';

interface ProductCardProps {
  // Product from products table
  product?: {
    id: string;
    name: string;
    speed: string;
    price: number;
    promo_price?: number | null;
    installation_fee: number;
    router_model?: string | null;
    router_included: boolean;
    router_rental_fee?: number | null;
    category: string;
    metadata?: {
      costBreakdown?: {
        dfaWholesale?: number;
        staticIP?: number;
        infrastructure?: number;
        markup?: number;
      };
      features?: string[];
    } | null;
  };
  // Service package from coverage API (alternative to product)
  id?: string;
  name?: string;
  service_type?: string;
  product_category?: string;
  speed_down?: number;
  speed_up?: number;
  price?: number;
  promotion_price?: number;
  promotion_months?: number;
  description?: string;
  features?: string[];
  installation_fee?: number;
  router_included?: boolean;
  // Common props
  onSelect?: (productId: string) => void;
  featured?: boolean;
  isPopular?: boolean;
  isSelected?: boolean;
  selectable?: boolean;
}

export function ProductCard({
  product,
  id,
  name,
  service_type,
  speed_down,
  speed_up,
  price: directPrice,
  promotion_price,
  promotion_months,
  description,
  features: directFeatures,
  installation_fee: directInstallationFee,
  router_included: directRouterIncluded,
  onSelect,
  featured = false,
  isPopular = false,
  isSelected = false,
  selectable = false,
}: ProductCardProps) {
  // Support both product object and direct props
  const productId = product?.id || id || '';
  const productName = product?.name || name || '';
  const productSpeed = product?.speed || (speed_down ? `${speed_down}/${speed_up}Mbps` : '');
  const basePrice = product?.price || directPrice || 0;
  const promoPrice = product?.promo_price || promotion_price;
  const installFee = product?.installation_fee ?? directInstallationFee ?? 0;
  const routerIncluded = product?.router_included ?? directRouterIncluded ?? false;

  const hasPromo = promoPrice && promoPrice < basePrice;
  const displayPrice = hasPromo ? promoPrice : basePrice;
  const savings = hasPromo ? basePrice - promoPrice! : 0;
  const showPopular = featured || isPopular;

  function formatPrice(price: number): string {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0
    }).format(price);
  }

  const featuresList = product?.metadata?.features || directFeatures || [
    'Uncapped data',
    'No throttling',
    'Free installation (conditions apply)',
    '24/7 customer support'
  ];

  return (
    <Card className={`relative ${showPopular ? 'border-circleTel-orange border-2 shadow-lg' : ''} ${isSelected ? 'ring-2 ring-circleTel-orange bg-orange-50/50' : ''} ${selectable ? 'cursor-pointer hover:border-circleTel-orange transition-all' : ''}`}>
      {showPopular && (
        <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-circleTel-orange">
          Most Popular
        </Badge>
      )}

      {isSelected && (
        <Badge className="absolute -top-3 right-4 bg-green-600">
          <Check className="w-3 h-3 mr-1" />
          Selected
        </Badge>
      )}

      {hasPromo && (
        <Badge className="absolute top-4 right-4 bg-green-600">
          Save {formatPrice(savings)}
        </Badge>
      )}

      <CardHeader>
        <CardTitle className="text-2xl">{productName}</CardTitle>
        <CardDescription className="flex items-center gap-2 text-lg">
          <Wifi className="w-5 h-5 text-circleTel-orange" />
          {productSpeed}
        </CardDescription>
        {service_type && (
          <Badge variant="secondary" className="w-fit mt-2">
            {service_type}
          </Badge>
        )}
        {promotion_months && hasPromo && (
          <p className="text-sm text-circleTel-orange mt-2">
            Special price for {promotion_months} months
          </p>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Pricing */}
        <div className="space-y-1">
          <div className="flex items-baseline gap-2">
            {hasPromo && (
              <span className="text-2xl text-muted-foreground line-through">
                {formatPrice(product.price)}
              </span>
            )}
            <span className="text-4xl font-bold text-circleTel-orange">
              {formatPrice(displayPrice)}
            </span>
            <span className="text-muted-foreground">/month</span>
          </div>
          {installFee > 0 && (
            <p className="text-sm text-muted-foreground">
              Installation: {formatPrice(installFee)}
            </p>
          )}
          {installFee === 0 && (
            <p className="text-sm text-green-600 font-medium">
              Free Installation
            </p>
          )}
        </div>

        {/* Router Information */}
        {product.router_model && (
          <div className="flex items-start gap-2 p-3 bg-muted rounded-lg">
            <Router className="w-5 h-5 mt-0.5 text-circleTel-orange flex-shrink-0" />
            <div className="flex-1">
              <p className="font-medium text-sm">{product.router_model}</p>
              {product.router_rental_fee ? (
                <p className="text-xs text-muted-foreground">
                  Rental: {formatPrice(product.router_rental_fee)}/month
                </p>
              ) : (
                <p className="text-xs text-green-600">
                   Included free
                </p>
              )}
            </div>
          </div>
        )}

        {/* Description (if provided) */}
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}

        {/* Features */}
        <ul className="space-y-2">
          {featuresList.slice(0, 4).map((feature, index) => (
            <li key={index} className="flex items-start gap-2 text-sm">
              <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>

        {/* First Month Total */}
        <div className="pt-4 border-t">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">First month total:</span>
            <span className="font-semibold">
              {formatPrice(displayPrice + installFee)}
            </span>
          </div>
        </div>
      </CardContent>

      <CardFooter>
        <Button
          className="w-full bg-circleTel-orange hover:bg-circleTel-orange/90"
          size="lg"
          onClick={() => onSelect?.(productId)}
        >
          {selectable ? (
            <>
              <Check className="w-4 h-4 mr-2" />
              {isSelected ? 'Selected' : 'Select for Comparison'}
            </>
          ) : (
            <>
              <Zap className="w-4 h-4 mr-2" />
              Get Started
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
