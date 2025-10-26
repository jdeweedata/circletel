'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Package,
  Zap,
  MapPin,
  Mail,
  TrendingUp
} from 'lucide-react';
import { useOrderContext } from './context/OrderContext';

export default function CompactOrderSummary() {
  const { state } = useOrderContext();
  const { coverage, package: packageData, account, contact } = state.orderData;

  const selectedPackage = packageData?.selectedPackage;
  const pricing = packageData?.pricing;

  // Calculate pricing
  const basePrice = pricing?.monthly || selectedPackage?.monthlyPrice || 0;
  const installationFee = pricing?.onceOff || selectedPackage?.onceOffPrice || 0;
  const totalAmount = basePrice + installationFee;
  const promotionalPrice = basePrice * 0.7; // 30% off example

  // Format customer email
  const customerEmail = account?.email || contact?.contactEmail || 'Not provided';

  return (
    <div className="bg-white rounded-lg border border-circleTel-lightNeutral p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-circleTel-darkNeutral">
          Order Summary
        </h3>
        <Badge variant="secondary" className="bg-circleTel-orange/10 text-circleTel-orange text-xs">
          {selectedPackage?.type?.toUpperCase() || 'N/A'}
        </Badge>
      </div>

      <Separator />

      {/* Package Info */}
      <div className="space-y-2">
        <div className="flex items-start gap-2">
          <Package className="h-4 w-4 text-circleTel-orange mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm text-circleTel-darkNeutral truncate">
              {selectedPackage?.name || 'Package Not Selected'}
            </p>
            {selectedPackage?.speed && (
              <div className="flex items-center gap-1.5 mt-1">
                <Zap className="h-3 w-3 text-circleTel-secondaryNeutral" />
                <span className="text-xs text-circleTel-secondaryNeutral">
                  {selectedPackage.speed}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Address */}
        {coverage?.address && (
          <div className="flex items-start gap-2">
            <MapPin className="h-4 w-4 text-circleTel-secondaryNeutral mt-0.5 flex-shrink-0" />
            <p className="text-xs text-circleTel-secondaryNeutral line-clamp-2">
              {coverage.address}
            </p>
          </div>
        )}

        {/* Email */}
        <div className="flex items-start gap-2">
          <Mail className="h-4 w-4 text-circleTel-secondaryNeutral mt-0.5 flex-shrink-0" />
          <p className="text-xs text-circleTel-secondaryNeutral truncate">
            {customerEmail}
          </p>
        </div>
      </div>

      <Separator />

      {/* Pricing */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp className="h-4 w-4 text-circleTel-orange" />
          <span className="text-xs font-medium text-circleTel-darkNeutral">Pricing</span>
        </div>

        <div className="space-y-1.5 text-xs">
          {/* Monthly Fee */}
          <div className="flex justify-between items-center">
            <span className="text-circleTel-secondaryNeutral">Monthly</span>
            <span className="font-medium">R{basePrice.toFixed(2)}</span>
          </div>

          {/* Promotional Pricing */}
          {promotionalPrice < basePrice && (
            <div className="bg-green-50 rounded px-2 py-1">
              <div className="flex justify-between items-center">
                <span className="text-green-700 text-[10px]">First 3 months</span>
                <span className="font-semibold text-green-800">
                  R{promotionalPrice.toFixed(2)}/mo
                </span>
              </div>
            </div>
          )}

          {/* Installation Fee */}
          {installationFee > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-circleTel-secondaryNeutral">Installation</span>
              <span className="font-medium">R{installationFee.toFixed(2)}</span>
            </div>
          )}

          <Separator className="my-1.5" />

          {/* Total */}
          <div className="flex justify-between items-center pt-1">
            <span className="font-semibold text-circleTel-darkNeutral">Total Due</span>
            <span className="text-lg font-bold text-circleTel-orange">
              R{totalAmount.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Quick Features */}
      {selectedPackage?.features && selectedPackage.features.length > 0 && (
        <>
          <Separator />
          <div>
            <p className="text-[10px] font-medium text-circleTel-secondaryNeutral mb-1.5 uppercase tracking-wide">
              Includes
            </p>
            <div className="space-y-1">
              {selectedPackage.features.slice(0, 3).map((feature, index) => (
                <div key={index} className="flex items-center gap-1.5 text-[11px]">
                  <div className="h-1 w-1 rounded-full bg-circleTel-orange flex-shrink-0" />
                  <span className="text-circleTel-secondaryNeutral truncate">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
