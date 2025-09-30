'use client';

import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Check, Wifi, Home, Building2, Cloud, HeadphonesIcon, Package, ArrowRight } from 'lucide-react';
import type { Product } from '@/lib/types/products';
import { formatPrice, formatSpeed } from '@/lib/types/products';
import { cn } from '@/lib/utils';

interface ProductCardProps {
  product: Product;
  onSelect?: (product: Product) => void;
  onCompare?: (product: Product) => void;
  isComparing?: boolean;
  className?: string;
}

const categoryIcons = {
  connectivity: Wifi,
  it_services: Cloud,
  bundle: Package,
  add_on: HeadphonesIcon,
};

const serviceTypeIcons = {
  SkyFibre: Wifi,
  HomeFibreConnect: Home,
  BizFibreConnect: Building2,
  IT_Support: HeadphonesIcon,
  Cloud_Services: Cloud,
};

export function ProductCard({
  product,
  onSelect,
  onCompare,
  isComparing = false,
  className
}: ProductCardProps) {
  const Icon = product.service_type 
    ? serviceTypeIcons[product.service_type] 
    : categoryIcons[product.category];

  const hasPromotion = product.active_promotion && product.final_price !== product.monthly_price;
  
  return (
    <Card className={cn(
      "group relative overflow-hidden transition-all duration-200 hover:shadow-lg",
      isComparing && "ring-2 ring-primary",
      className
    )}>
      {/* Featured/Popular badges */}
      {product.is_featured && (
        <Badge className="absolute top-4 right-4 z-10" variant="default">
          Featured
        </Badge>
      )}
      {product.is_popular && !product.is_featured && (
        <Badge className="absolute top-4 right-4 z-10" variant="secondary">
          Popular
        </Badge>
      )}
      
      {/* Promotion badge */}
      {hasPromotion && (
        <Badge className="absolute top-4 left-4 z-10 bg-red-500 text-white">
          {product.active_promotion?.discount_type === 'percentage' 
            ? `${product.active_promotion.discount_value}% OFF`
            : 'SPECIAL'
          }
        </Badge>
      )}

      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">{product.name}</h3>
              {product.short_description && (
                <p className="text-sm text-muted-foreground mt-1">
                  {product.short_description}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Speed info for connectivity products */}
        {product.download_speed && (
          <div className="mt-3 flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground">Download:</span>
              <span className="font-semibold">{formatSpeed(product.download_speed)}</span>
            </div>
            {product.upload_speed && (
              <div className="flex items-center gap-1">
                <span className="text-muted-foreground">Upload:</span>
                <span className="font-semibold">{formatSpeed(product.upload_speed)}</span>
              </div>
            )}
          </div>
        )}
      </CardHeader>

      <CardContent className="pb-4">
        {/* Pricing */}
        <div className="mb-4">
          <div className="flex items-baseline gap-2">
            {hasPromotion && (
              <span className="text-sm text-muted-foreground line-through">
                {formatPrice(product.monthly_price)}
              </span>
            )}
            <span className="text-2xl font-bold">
              {formatPrice(product.final_price || product.monthly_price)}
            </span>
            <span className="text-sm text-muted-foreground">/month</span>
          </div>
          
          {product.setup_fee > 0 && (
            <p className="text-sm text-muted-foreground mt-1">
              Setup fee: {formatPrice(product.setup_fee)}
            </p>
          )}

          {product.is_bundle && product.bundle_savings && product.bundle_savings > 0 && (
            <Badge variant="outline" className="mt-2 text-green-600">
              Save {formatPrice(product.bundle_savings)}/month
            </Badge>
          )}
        </div>

        {/* Features */}
        {product.features && product.features.length > 0 && (
          <ul className="space-y-2">
            {product.features.slice(0, 5).map((feature, index) => (
              <li key={index} className="flex items-start gap-2 text-sm">
                <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">{feature}</span>
              </li>
            ))}
            {product.features.length > 5 && (
              <li className="text-sm text-muted-foreground pl-6">
                +{product.features.length - 5} more features
              </li>
            )}
          </ul>
        )}
      </CardContent>

      <CardFooter className="pt-4 border-t">
        <div className="flex gap-2 w-full">
          <Button 
            onClick={() => onSelect?.(product)}
            className="flex-1"
          >
            Select
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          {onCompare && (
            <Button
              variant={isComparing ? "secondary" : "outline"}
              size="sm"
              onClick={() => onCompare(product)}
            >
              {isComparing ? "Remove" : "Compare"}
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}
