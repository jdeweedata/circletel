'use client';

import React from 'react';
import { Package, Wifi, Zap, CheckCircle } from 'lucide-react';
import { PackageDetails } from '@/lib/order/types';

// South African VAT rate (15%)
const VAT_RATE = 0.15;

interface PackageSummaryProps {
  package: PackageDetails;
  compact?: boolean;
  showVatInclusive?: boolean; // Default true - show VAT-inclusive prices
}

export function PackageSummary({ package: pkg, compact = false, showVatInclusive = true }: PackageSummaryProps) {
  const baseMonthlyPrice = typeof pkg.price === 'string' 
    ? parseFloat(pkg.price) 
    : pkg.price || pkg.monthlyPrice;

  const basePromotionPrice = pkg.promotion_price 
    ? (typeof pkg.promotion_price === 'string' ? parseFloat(pkg.promotion_price) : pkg.promotion_price)
    : null;

  // Calculate VAT-inclusive prices
  const monthlyPrice = showVatInclusive ? baseMonthlyPrice * (1 + VAT_RATE) : baseMonthlyPrice;
  const promotionPrice = basePromotionPrice !== null 
    ? (showVatInclusive ? basePromotionPrice * (1 + VAT_RATE) : basePromotionPrice)
    : null;

  const hasPromotion = promotionPrice !== null && promotionPrice < monthlyPrice;

  if (compact) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1">
            <div className="flex-shrink-0 w-10 h-10 bg-circleTel-orange/10 rounded-lg flex items-center justify-center">
              <Wifi className="w-5 h-5 text-circleTel-orange" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 text-sm mb-1">
                {pkg.name}
              </h3>
              <p className="text-xs text-gray-600 mb-2">
                {pkg.speed || `${pkg.speed_down}Mbps Down / ${pkg.speed_up}Mbps Up`}
              </p>
              {pkg.features && pkg.features.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {pkg.features.slice(0, 2).map((feature, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 text-xs text-gray-600 bg-gray-50 px-2 py-0.5 rounded"
                    >
                      <CheckCircle className="w-3 h-3 text-green-600" />
                      {feature}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            {hasPromotion ? (
              <>
                <div className="text-xs text-gray-500 line-through">
                  R{monthlyPrice.toFixed(2)}
                </div>
                <div className="text-lg font-bold text-circleTel-orange">
                  R{promotionPrice.toFixed(2)}
                </div>
                <div className="text-xs text-gray-600">per month {showVatInclusive && '(incl. VAT)'}</div>
              </>
            ) : (
              <>
                <div className="text-lg font-bold text-gray-900">
                  R{monthlyPrice.toFixed(2)}
                </div>
                <div className="text-xs text-gray-600">per month {showVatInclusive && '(incl. VAT)'}</div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-circleTel-orange/5 to-orange-50 rounded-xl border-2 border-circleTel-orange/20 p-6">
      <div className="flex items-start gap-4 mb-4">
        <div className="flex-shrink-0 w-14 h-14 bg-circleTel-orange rounded-xl flex items-center justify-center shadow-lg">
          <Package className="w-7 h-7 text-white" />
        </div>
        <div className="flex-1">
          <div className="flex items-start justify-between gap-4 mb-2">
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-1">
                {pkg.name}
              </h3>
              <div className="flex items-center gap-2 text-gray-700">
                <Zap className="w-4 h-4 text-circleTel-orange" />
                <span className="font-medium">
                  {pkg.speed || `${pkg.speed_down}Mbps Down / ${pkg.speed_up}Mbps Up`}
                </span>
              </div>
            </div>
            <div className="text-right">
              {hasPromotion ? (
                <>
                  <div className="text-sm text-gray-500 line-through">
                    R{monthlyPrice.toFixed(2)}
                  </div>
                  <div className="text-2xl font-bold text-circleTel-orange">
                    R{promotionPrice.toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-600">per month {showVatInclusive && '(incl. VAT)'}</div>
                  {pkg.promotion_months && (
                    <div className="text-xs text-circleTel-orange font-medium mt-1">
                      For {pkg.promotion_months} months
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="text-2xl font-bold text-gray-900">
                    R{monthlyPrice.toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-600">per month {showVatInclusive && '(incl. VAT)'}</div>
                </>
              )}
            </div>
          </div>

          {pkg.description && (
            <p className="text-sm text-gray-600 mb-3">
              {pkg.description}
            </p>
          )}

          {pkg.features && pkg.features.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {pkg.features.map((feature, index) => (
                <div
                  key={index}
                  className="flex items-start gap-2 text-sm text-gray-700"
                >
                  <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          )}

          {(pkg.installation_fee || pkg.activation_fee) && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex flex-wrap gap-4 text-sm">
                {pkg.installation_fee && (
                  <div>
                    <span className="text-gray-600">Installation:</span>{' '}
                    <span className="font-semibold text-gray-900">
                      R{pkg.installation_fee.toFixed(2)}
                    </span>
                  </div>
                )}
                {pkg.activation_fee && (
                  <div>
                    <span className="text-gray-600">Activation:</span>{' '}
                    <span className="font-semibold text-gray-900">
                      R{pkg.activation_fee.toFixed(2)}
                    </span>
                  </div>
                )}
                {pkg.router_included && (
                  <div className="flex items-center gap-1 text-green-700">
                    <CheckCircle className="w-4 h-4" />
                    <span className="font-medium">Router Included</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
