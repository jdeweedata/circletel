'use client';

import { PiLockSimpleBold, PiMapPinBold, PiWifiHighBold, PiShieldBold, PiHeartBold } from 'react-icons/pi';
import {
  ORDER_PROCESSING_FEE_AMOUNT,
  ORDER_PROCESSING_FEE_DESCRIPTION,
  ORDER_PROCESSING_FEE_LABEL,
} from '@/lib/payments/payment-amounts';

interface OrderSummarySidebarProps {
  packageName: string;
  speed: string;
  monthlyPrice: number;
  promotionPrice?: number;
  promotionMonths?: number;
  installationFee?: number;
  isSimOnly?: boolean;
  address?: string;
}

export function OrderSummarySidebar({
  packageName,
  speed,
  monthlyPrice,
  promotionPrice,
  promotionMonths,
  installationFee = 0,
  isSimOnly = false,
  address,
}: OrderSummarySidebarProps) {
  // Prices arrive EX-VAT (raw service_packages.price), matching the package card's convention.
  // The card displays incl-VAT via Math.round(price * 1.15) — mirror that here so the
  // advertised price (e.g. R899) reconciles with checkout instead of being re-divided.
  const VAT_RATE = 0.15;
  const inclVAT = (exVat: number): number => Math.round(exVat * (1 + VAT_RATE));
  const effectivePrice = promotionPrice ?? monthlyPrice; // ex-VAT

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-lg shadow-gray-200/60 lg:sticky lg:top-6">
      {/* Header */}
      <div className="bg-circleTel-orange px-6 py-6">
        <div className="mb-3 flex items-center gap-2">
          <PiWifiHighBold className="w-4 h-4 text-white/80" />
          <span className="text-xs font-bold uppercase tracking-[0.12em] text-white/90">Your plan</span>
        </div>
        <p className="text-xl font-extrabold leading-tight text-white">{packageName}</p>
        <p className="mt-1 text-sm text-white/90">{speed}</p>
      </div>

      {/* Pricing breakdown */}
      <div className="space-y-4 px-6 py-6">
        {address && (
          <div className="flex gap-2.5 text-sm leading-relaxed text-gray-500">
            <PiMapPinBold className="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-400" />
            <p>{address}</p>
          </div>
        )}

        <div className="space-y-1">
          <div className="flex items-baseline justify-between">
            <span className="text-sm text-gray-500">Monthly (excl. VAT)</span>
            <div className="text-right">
              {promotionPrice ? (
                <>
                  <span className="text-sm font-semibold text-gray-900">R{promotionPrice.toFixed(2)}</span>
                  <span className="text-gray-400 line-through text-xs ml-1.5">R{monthlyPrice.toFixed(2)}</span>
                </>
              ) : (
                <span className="text-sm font-semibold text-gray-900">R{monthlyPrice.toFixed(2)}</span>
              )}
              <span className="text-gray-400 text-xs">/mo</span>
            </div>
          </div>
          <div className="flex items-baseline justify-between text-sm text-gray-500">
            <span>VAT (15%)</span>
            <span>R{(inclVAT(effectivePrice) - effectivePrice).toFixed(2)}</span>
          </div>
          <div className="flex items-baseline justify-between border-t border-gray-200 pt-3">
            <span className="text-sm font-medium text-gray-700">Monthly (incl. VAT)</span>
            <div className="text-right">
              {promotionPrice ? (
                <>
                  <span className="text-lg font-bold text-gray-900">R{inclVAT(promotionPrice).toFixed(2)}</span>
                  <span className="text-gray-400 line-through text-xs ml-1.5">R{inclVAT(monthlyPrice).toFixed(2)}</span>
                </>
              ) : (
                <span className="text-lg font-bold text-gray-900">R{inclVAT(monthlyPrice).toFixed(2)}</span>
              )}
              <span className="text-gray-400 text-xs">/mo</span>
            </div>
          </div>
        </div>
        {!isSimOnly && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Installation</span>
            {installationFee > 0 ? (
              <span className="text-sm text-gray-900">R{installationFee}</span>
            ) : (
              <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">FREE</span>
            )}
          </div>
        )}

        {/* Today's charge */}
        <div className="mt-5 rounded-xl bg-circleTel-orange-light px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <span className="text-sm font-semibold text-circleTel-navy">{ORDER_PROCESSING_FEE_LABEL}</span>
              <p className="mt-1 text-xs leading-relaxed text-gray-500">
                {ORDER_PROCESSING_FEE_DESCRIPTION}
              </p>
            </div>
            <span className="text-3xl font-extrabold text-circleTel-orange">
              R{ORDER_PROCESSING_FEE_AMOUNT.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Trust strip */}
      <div className="border-t border-gray-200 px-6 py-5">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <div className="inline-flex items-center justify-center w-8 h-8 bg-orange-100 rounded-full mb-1">
              <PiLockSimpleBold className="w-4 h-4 text-circleTel-orange" />
            </div>
            <p className="text-[11px] text-gray-500 font-medium">3D Secure</p>
          </div>
          <div>
            <div className="inline-flex items-center justify-center w-8 h-8 bg-orange-100 rounded-full mb-1">
              <PiShieldBold className="w-4 h-4 text-circleTel-orange" />
            </div>
            <p className="text-[11px] text-gray-500 font-medium">No Lock-In</p>
          </div>
          <div>
            <div className="inline-flex items-center justify-center w-8 h-8 bg-orange-100 rounded-full mb-1">
              <PiHeartBold className="w-4 h-4 text-circleTel-orange" />
            </div>
            <p className="text-[11px] text-gray-500 font-medium">Cancel Anytime</p>
          </div>
        </div>
      </div>
    </div>
  );
}
