'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Check, ArrowDown, ArrowUp, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProductShowcaseCardProps {
  product: {
    id: string;
    name: string;
    slug?: string;
    service_type?: string;
    speed_down?: number;
    speed_up?: number;
    price?: number;
    base_price_zar?: number | string;
    promotion_price?: number;
    features?: string[];
    metadata?: {
      data_limit?: string;
      router_included?: boolean;
    };
    is_featured?: boolean;
  };
  onViewDeal?: (product: any) => void;
}

/**
 * ProductShowcaseCard Component
 *
 * MTN-inspired product card for category landing pages
 * Features: Data visual header, speed specs, pricing with promo support, key features
 */
export function ProductShowcaseCard({ product, onViewDeal }: ProductShowcaseCardProps) {
  const price = product.price || parseFloat(String(product.base_price_zar || 0));
  const hasPromo = product.promotion_price && product.promotion_price < price;
  const dataLimit = product.metadata?.data_limit;
  const isUncapped = !dataLimit || dataLimit.toLowerCase() === 'unlimited' || dataLimit === '∞';
  const displayData = isUncapped ? '∞' : dataLimit;

  // Generate slug if not present
  const productSlug = product.slug || product.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 group relative">
      {/* Featured Badge */}
      {product.is_featured && (
        <div className="absolute top-4 right-4 z-10">
          <Badge className="bg-circleTel-orange text-white font-bold">
            <Zap className="h-3 w-3 mr-1" />
            Popular
          </Badge>
        </div>
      )}

      {/* Visual Header - Data Amount */}
      <div className="bg-circleTel-darkNeutral text-white p-8 text-center relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 left-0 w-32 h-32 bg-white rounded-full -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-48 h-48 bg-white rounded-full translate-x-1/4 translate-y-1/4" />
        </div>

        <p className="text-sm text-gray-400 uppercase tracking-wider mb-2">
          {product.service_type || 'Internet'}
        </p>
        <div className="flex items-baseline justify-center gap-1">
          <span className="text-7xl font-bold tracking-tight">{displayData}</span>
          {!isUncapped && <span className="text-2xl font-bold text-gray-400">GB</span>}
        </div>
        <p className="text-circleTel-orange font-semibold mt-2 text-lg">
          {isUncapped ? 'Uncapped' : 'Monthly Data'}
        </p>
      </div>

      {/* Product Info */}
      <CardContent className="p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2 min-h-[56px]">
          {product.name}
        </h3>

        {/* Speed Specs */}
        {(product.speed_down || product.speed_up) && (
          <div className="flex items-center gap-4 mb-4 p-3 bg-gray-50 rounded-lg">
            {product.speed_down && (
              <div className="flex items-center gap-2">
                <ArrowDown className="h-4 w-4 text-emerald-500" />
                <span className="font-semibold text-gray-900">{product.speed_down}</span>
                <span className="text-xs text-gray-500">Mbps</span>
              </div>
            )}
            {product.speed_down && product.speed_up && (
              <div className="w-px h-6 bg-gray-300" />
            )}
            {product.speed_up && (
              <div className="flex items-center gap-2">
                <ArrowUp className="h-4 w-4 text-blue-500" />
                <span className="font-semibold text-gray-900">{product.speed_up}</span>
                <span className="text-xs text-gray-500">Mbps</span>
              </div>
            )}
          </div>
        )}

        {/* Pricing */}
        <div className="mb-5">
          {hasPromo ? (
            <div className="space-y-1">
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="text-3xl font-bold text-circleTel-orange">
                  R{Math.round(product.promotion_price!)}
                </span>
                <span className="text-lg text-gray-400 line-through">
                  R{Math.round(price)}
                </span>
              </div>
              <Badge className="bg-red-500 text-white text-xs">
                Save R{Math.round(price - product.promotion_price!)}
              </Badge>
            </div>
          ) : (
            <span className="text-3xl font-bold text-gray-900">R{Math.round(price)}</span>
          )}
          <p className="text-sm text-gray-500 mt-1">per month</p>
        </div>

        {/* Key Features (max 3) */}
        {product.features && product.features.length > 0 && (
          <ul className="space-y-2 mb-6">
            {product.features.slice(0, 3).map((feature, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                <Check className="h-4 w-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                <span className="line-clamp-1">{feature}</span>
              </li>
            ))}
          </ul>
        )}

        {/* Router Included Badge */}
        {product.metadata?.router_included && (
          <div className="mb-4 p-2 bg-amber-50 border border-amber-200 rounded-lg text-center">
            <span className="text-sm font-semibold text-amber-700">
              FREE Router Included
            </span>
          </div>
        )}

        {/* CTA */}
        <Link href={`/products/${productSlug}`} className="block">
          <Button
            className={cn(
              "w-full bg-circleTel-orange hover:bg-circleTel-orange/90 transition-all",
              "group-hover:shadow-lg group-hover:scale-[1.02]"
            )}
            onClick={(e) => {
              if (onViewDeal) {
                e.preventDefault();
                onViewDeal(product);
              }
            }}
          >
            View Deal
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

export default ProductShowcaseCard;
