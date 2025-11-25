'use client';

import React from 'react';
import Image from 'next/image';
import { Home, Wifi, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ProductHeroProps {
  product: {
    id: string;
    name: string;
    sku?: string;
    service_type?: string;
    speed_down?: number;
    speed_up?: number;
    price?: number;
    base_price_zar?: number | string;
    promotion_price?: number;
    description?: string;
    metadata?: {
      data_limit?: string;
      router_included?: boolean;
      router_model?: string;
      router_image?: string;
    };
  };
  onClose?: () => void;
}

/**
 * ProductHero Component
 *
 * Large hero section for product detail pages
 * Features: Large data visual, router image, product branding
 */
export function ProductHero({ product, onClose }: ProductHeroProps) {
  const dataLimit = product.metadata?.data_limit;
  const isUncapped = !dataLimit || dataLimit.toLowerCase() === 'unlimited' || dataLimit === '∞';
  const displayData = isUncapped ? '∞' : dataLimit;

  return (
    <section className="bg-white border-b relative">
      {/* Close Button (for modal usage) */}
      {onClose && (
        <div className="absolute top-4 right-4 z-10">
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="rounded-full hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      )}

      {/* Header Bar */}
      <div className="border-b px-4 py-3">
        <p className="text-sm text-gray-600">Create your deal</p>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row items-start gap-8">
          {/* Left: Data Visual */}
          <div className="flex-shrink-0 w-full md:w-auto">
            <div className="relative">
              {/* Large Data Display */}
              <div className="text-left md:text-center">
                <div className="flex items-center gap-2 mb-3">
                  <Home className="h-5 w-5 text-gray-500" />
                  <span className="text-sm text-gray-500 uppercase tracking-wider font-medium">
                    HOME INTERNET
                  </span>
                </div>

                <div className="flex items-baseline">
                  <span className="text-8xl md:text-9xl font-bold text-circleTel-darkNeutral leading-none">
                    {displayData}
                  </span>
                  {!isUncapped && (
                    <span className="text-3xl md:text-4xl font-bold text-gray-400 ml-2">GB</span>
                  )}
                </div>

                <p className="text-2xl md:text-3xl font-bold text-circleTel-orange italic mt-2">
                  {isUncapped ? 'uncapped' : ''}
                </p>

                {product.metadata?.router_included && (
                  <div className="mt-6 inline-block bg-circleTel-darkNeutral text-white px-5 py-2.5 rounded-lg">
                    <span className="text-circleTel-orange font-bold">FREE</span>
                    <span className="ml-2">to use {product.service_type || '5G'} router</span>
                  </div>
                )}
              </div>

              {/* Router Image (positioned to the right on desktop) */}
              {product.metadata?.router_image ? (
                <div className="hidden md:block absolute -right-20 top-0 w-32">
                  <Image
                    src={product.metadata.router_image}
                    alt={product.metadata.router_model || 'Router'}
                    width={128}
                    height={192}
                    className="object-contain"
                  />
                </div>
              ) : product.metadata?.router_included ? (
                <div className="hidden md:flex absolute -right-16 top-8 w-24 h-36 bg-gray-100 rounded-lg items-center justify-center">
                  <Wifi className="h-10 w-10 text-gray-300" />
                </div>
              ) : null}
            </div>
          </div>

          {/* Right: Product Info (for larger screens) */}
          <div className="flex-1 pt-4 md:pt-0">
            <p className="text-gray-500 text-sm mb-1">{product.sku || product.name}</p>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
              {displayData} {!isUncapped ? 'GB' : 'Uncapped'}
            </h1>
            {product.description && (
              <p className="text-gray-600 text-sm max-w-md">
                {product.description}
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export default ProductHero;
