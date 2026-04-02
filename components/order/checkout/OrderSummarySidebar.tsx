'use client';

import { PiLockSimpleBold, PiWifiHighBold } from 'react-icons/pi';

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
  const displayPrice = promotionPrice ?? monthlyPrice;

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden sticky top-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-5 py-4">
        <div className="flex items-center gap-2 mb-1">
          <PiWifiHighBold className="w-4 h-4 text-white/80" />
          <span className="text-xs font-medium text-white/80 uppercase tracking-wide">Your plan</span>
        </div>
        <p className="text-white font-bold text-lg leading-tight">{packageName}</p>
        <p className="text-white/70 text-sm">{speed}</p>
      </div>

      {/* Pricing breakdown */}
      <div className="px-5 py-4 space-y-3">
        <div className="flex items-baseline justify-between">
          <span className="text-sm text-gray-500">Monthly</span>
          <div className="text-right">
            {promotionPrice ? (
              <>
                <span className="text-gray-900 font-semibold">R{promotionPrice}</span>
                <span className="text-gray-400 line-through text-xs ml-1.5">R{monthlyPrice}</span>
              </>
            ) : (
              <span className="text-gray-900 font-semibold">R{monthlyPrice}</span>
            )}
            <span className="text-gray-400 text-xs">/mo</span>
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

        {address && (
          <div className="pt-1 border-t border-gray-50">
            <p className="text-xs text-gray-400 leading-relaxed">{address}</p>
          </div>
        )}

        {/* Today's charge */}
        <div className="bg-gray-50 rounded-lg px-4 py-3 mt-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Charged today</span>
            <span className="text-2xl font-bold text-orange-500">R1.00</span>
          </div>
          <p className="text-xs text-gray-400 mt-0.5">
            Validation charge · credited to your account
          </p>
        </div>
      </div>

      {/* Trust strip */}
      <div className="px-5 py-3 border-t border-gray-50 bg-gray-50/50">
        <div className="flex items-center gap-1.5 mb-1">
          <PiLockSimpleBold className="w-3.5 h-3.5 text-gray-400" />
          <span className="text-xs text-gray-500 font-medium">Secure checkout</span>
        </div>
        <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-gray-400">
          <span>No lock-in contract</span>
          <span>·</span>
          <span>Cancel anytime</span>
          <span>·</span>
          <span>3D Secure</span>
        </div>
      </div>
    </div>
  );
}
