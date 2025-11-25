'use client';

import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Wifi, Truck } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProductOrderCardProps {
  product: {
    id: string;
    name: string;
    service_type?: string;
    speed_down?: number;
    speed_up?: number;
    price?: number;
    base_price_zar?: number | string;
    promotion_price?: number;
    features?: string[];
    description?: string;
    metadata?: {
      data_limit?: string;
      router_included?: boolean;
      router_model?: string;
      router_color?: string;
      router_image?: string;
      delivery_days?: string;
      contract_months?: number;
    };
  };
  className?: string;
  showDelivery?: boolean;
}

/**
 * ProductOrderCard Component
 *
 * Order confirmation card showing plan details, hardware, delivery
 * MTN-inspired design with CircleTel styling
 */
export function ProductOrderCard({
  product,
  className,
  showDelivery = true,
}: ProductOrderCardProps) {
  const price = product.price || parseFloat(String(product.base_price_zar || 0));
  const hasPromo = product.promotion_price && product.promotion_price < price;
  const finalPrice = hasPromo ? product.promotion_price : price;
  const dataLimit = product.metadata?.data_limit;
  const isUncapped = !dataLimit || dataLimit.toLowerCase() === 'unlimited' || dataLimit === '∞';
  const contractMonths = product.metadata?.contract_months || 12;

  return (
    <Card className={cn("overflow-hidden", className)}>
      {/* Header */}
      <CardHeader className="border-b bg-gray-50 py-4">
        <h2 className="text-lg md:text-xl font-bold text-gray-900">
          Please confirm your order.
        </h2>
      </CardHeader>

      <CardContent className="p-0">
        {/* Decorative wave/zigzag border */}
        <div className="w-full h-3 bg-gray-50 relative overflow-hidden">
          <svg
            viewBox="0 0 1200 12"
            className="absolute bottom-0 w-full"
            preserveAspectRatio="none"
          >
            <path
              d="M0,12 Q30,0 60,12 T120,12 T180,12 T240,12 T300,12 T360,12 T420,12 T480,12 T540,12 T600,12 T660,12 T720,12 T780,12 T840,12 T900,12 T960,12 T1020,12 T1080,12 T1140,12 T1200,12 V12 H0 Z"
              fill="white"
            />
          </svg>
        </div>

        {/* Plan Details */}
        <div className="p-4 md:p-6 border-b">
          <div className="flex items-center gap-2 mb-3">
            <Badge className="bg-amber-400 text-circleTel-darkNeutral font-bold text-xs px-3 py-1">
              PLAN
            </Badge>
          </div>

          <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
            <div className="flex-1">
              <h3 className="font-bold text-lg text-gray-900">{product.name}</h3>

              <ul className="mt-3 space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="w-1 h-4 bg-amber-400 rounded-full flex-shrink-0 mt-0.5" />
                  <span>
                    {isUncapped ? 'Unlimited' : dataLimit} GB at best {product.service_type || '5G'} speeds
                  </span>
                </li>
                {product.speed_down && (
                  <li className="flex items-start gap-2">
                    <span className="w-1 h-4 bg-amber-400 rounded-full flex-shrink-0 mt-0.5" />
                    <span>{product.speed_down}Mbps download speeds at {product.speed_up || product.speed_down}Mbps upload</span>
                  </li>
                )}
                <li className="flex items-start gap-2">
                  <span className="w-1 h-4 bg-amber-400 rounded-full flex-shrink-0 mt-0.5" />
                  <span>Internet service works only at your registered address.</span>
                </li>
              </ul>

              <p className="text-xs text-gray-500 mt-4">
                Network speeds are based on best effort service or up to the stated maximum Fair Usage Policy (FUP).
              </p>
            </div>

            {/* Pricing */}
            <div className="text-left md:text-right flex-shrink-0">
              <span className="text-2xl md:text-3xl font-bold text-gray-900">
                R{Math.round(finalPrice!)}
              </span>
              <p className="text-sm text-gray-500">pm×{contractMonths}</p>
            </div>
          </div>
        </div>

        {/* Router (if included) */}
        {product.metadata?.router_included && (
          <div className="p-4 md:p-6 border-b">
            <div className="flex items-center gap-4">
              <div className="w-16 h-20 md:w-20 md:h-24 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Wifi className="h-8 w-8 text-gray-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-gray-900 truncate">
                  {product.metadata.router_model || `${product.service_type || 'Home'} Router`}
                </h4>
                <p className="text-sm text-gray-500">
                  {product.metadata.router_color || 'Black'}
                </p>
              </div>
              <span className="text-lg font-bold text-gray-500 flex-shrink-0">FREE</span>
            </div>
          </div>
        )}

        {/* Delivery */}
        {showDelivery && (
          <div className="p-4 md:p-6 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Truck className="h-5 w-5 text-gray-400" />
                <div>
                  <h4 className="font-bold text-gray-900">Delivery</h4>
                  <p className="text-sm text-amber-600 flex items-center gap-1">
                    <span className="w-1 h-4 bg-amber-400 rounded-full" />
                    {product.metadata?.delivery_days || '1 - 3 working days'}
                  </p>
                </div>
              </div>
              <span className="text-lg font-bold text-gray-500">FREE</span>
            </div>
          </div>
        )}

        {/* Total / Pay Monthly Footer */}
        <div className="p-4 md:p-6 bg-circleTel-darkNeutral text-white">
          <div className="flex justify-between items-center">
            <span className="font-bold text-lg">Pay monthly</span>
            <div className="text-right">
              <span className="text-2xl md:text-3xl font-bold">
                R{Math.round(finalPrice!)}
              </span>
              <p className="text-sm text-gray-400">pm×{contractMonths}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default ProductOrderCard;
