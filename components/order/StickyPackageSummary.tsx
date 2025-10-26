'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Package, Zap, Calendar, Check } from 'lucide-react';
import Link from 'next/link';
import type { PackageDetails } from '@/lib/order/types';

interface StickyPackageSummaryProps {
  package: PackageDetails;
  showChangeLink?: boolean;
}

export function StickyPackageSummary({ 
  package: pkg, 
  showChangeLink = true 
}: StickyPackageSummaryProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Convert string prices to numbers for calculations
  const priceValue = typeof pkg.price === 'string' ? parseFloat(pkg.price) : pkg.price || 0;
  const promoValue = typeof pkg.promotion_price === 'string' ? parseFloat(pkg.promotion_price) : pkg.promotion_price;
  const installValue = typeof pkg.installation_fee === 'string' ? parseFloat(pkg.installation_fee) : pkg.installation_fee || 0;
  
  const monthlyPrice = promoValue || priceValue;
  const vatAmount = monthlyPrice * 0.15;
  const totalInclVAT = monthlyPrice + vatAmount;
  const speedDown = pkg.speed_down || 0;
  const speedUp = pkg.speed_up || 0;
  
  // Calculate next billing date (30 days from now)
  const nextBillingDate = new Date();
  nextBillingDate.setDate(nextBillingDate.getDate() + 30);
  const formattedDate = nextBillingDate.toLocaleDateString('en-ZA', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  return (
    <>
      {/* Desktop: Sticky sidebar */}
      <div className="hidden lg:block sticky top-4 h-fit">
        <div className="bg-white border-2 border-circleTel-orange rounded-xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-circleTel-orange to-orange-600 text-white p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                <span className="font-semibold">Your Selected Package</span>
              </div>
              {showChangeLink && (
                <Link 
                  href="/order/packages" 
                  className="text-sm text-white hover:text-white/80 underline transition-colors"
                >
                  Change
                </Link>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="p-5 space-y-4">
            {/* Package Name */}
            <div>
              <h3 className="font-bold text-lg text-gray-900">{pkg.name}</h3>
              <div className="flex items-center gap-2 mt-1 text-sm text-gray-600">
                <Zap className="w-4 h-4 text-circleTel-orange" />
                <span>{pkg.speed_down}/{pkg.speed_up} Mbps</span>
              </div>
              {pkg.data_limit && (
                <div className="flex items-center gap-2 mt-1 text-sm text-gray-600">
                  <Check className="w-4 h-4 text-green-600" />
                  <span>{pkg.data_limit}</span>
                </div>
              )}
            </div>

            {/* Pricing */}
            <div className="space-y-2 pt-3 border-t">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Monthly</span>
                <span className="font-medium">R{monthlyPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">VAT (15%)</span>
                <span className="font-medium">R{vatAmount.toFixed(2)}</span>
              </div>
              {installValue > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Installation (once-off)</span>
                  <span className="font-medium">R{installValue.toFixed(2)}</span>
                </div>
              )}
            </div>

            {/* Total */}
            <div className="bg-circleTel-orange/10 rounded-lg p-3 border border-circleTel-orange/20">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-gray-900">Total (incl. VAT)</span>
                <span className="text-2xl font-bold text-circleTel-orange">
                  R{totalInclVAT.toFixed(2)}
                </span>
              </div>
              <p className="text-xs text-gray-600 mt-1">per month</p>
            </div>

            {/* Next Billing Date */}
            <div className="flex items-center gap-2 text-sm text-gray-600 pt-2">
              <Calendar className="w-4 h-4" />
              <span>First billing: {formattedDate}</span>
            </div>

            {/* Features */}
            {(pkg.installation_fee === 0 || !pkg.installation_fee) && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex items-center gap-2 text-green-800">
                  <Check className="w-4 h-4" />
                  <span className="text-sm font-medium">Free installation</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile: Collapsible at top */}
      <div className="lg:hidden mb-4">
        <div className="bg-white border-2 border-circleTel-orange rounded-lg shadow-md overflow-hidden">
          {/* Collapsed Header */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="w-full p-4 flex items-center justify-between bg-gradient-to-r from-circleTel-orange to-orange-600 text-white"
          >
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              <span className="font-semibold text-sm">
                {pkg.name} • R{totalInclVAT.toFixed(2)}/mo
              </span>
            </div>
            {isCollapsed ? (
              <ChevronDown className="w-5 h-5" />
            ) : (
              <ChevronUp className="w-5 h-5" />
            )}
          </button>

          {/* Expanded Content */}
          {!isCollapsed && (
            <div className="p-4 space-y-3">
              {/* Speed */}
              <div className="flex items-center gap-2 text-sm">
                <Zap className="w-4 h-4 text-circleTel-orange" />
                <span>{pkg.speed_down}/{pkg.speed_up} Mbps</span>
              </div>

              {/* Pricing Breakdown */}
              <div className="space-y-2 pt-2 border-t text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Monthly</span>
                  <span>R{monthlyPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">VAT (15%)</span>
                  <span>R{vatAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold pt-2 border-t">
                  <span>Total (incl. VAT)</span>
                  <span className="text-circleTel-orange">R{totalInclVAT.toFixed(2)}</span>
                </div>
              </div>

              {/* Next Billing */}
              <div className="flex items-center gap-2 text-xs text-gray-600 pt-2">
                <Calendar className="w-3 h-3" />
                <span>First billing: {formattedDate}</span>
              </div>

              {/* Change Link */}
              {showChangeLink && (
                <Link 
                  href="/order/packages" 
                  className="block text-center text-sm text-circleTel-orange hover:text-orange-600 font-medium pt-2 border-t"
                >
                  Change Package
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
