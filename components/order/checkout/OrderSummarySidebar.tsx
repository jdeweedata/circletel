'use client';

import { PiLockSimpleBold, PiWifiHighBold, PiShieldBold, PiHeartBold } from 'react-icons/pi';

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
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden sticky top-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-5 py-4">
        <div className="flex items-center gap-2 mb-1">
          <PiWifiHighBold className="w-4 h-4 text-white/80" />
          <span className="text-sm font-semibold text-white/90 uppercase tracking-wide">Your plan</span>
        </div>
        <p className="text-white font-extrabold text-xl leading-tight">{packageName}</p>
        <p className="text-white/70 text-sm">{speed}</p>
      </div>

      {/* Pricing breakdown */}
      <div className="px-5 py-4 space-y-3">
        <div className="flex items-baseline justify-between">
          <span className="text-sm text-gray-500">Monthly</span>
          <div className="text-right">
            {promotionPrice ? (
              <>
                <span className="text-lg font-bold text-gray-900">R{promotionPrice}</span>
                <span className="text-gray-400 line-through text-xs ml-1.5">R{monthlyPrice}</span>
              </>
            ) : (
              <span className="text-lg font-bold text-gray-900">R{monthlyPrice}</span>
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
            <span className="text-3xl font-extrabold text-circleTel-orange">R1.00</span>
          </div>
          <p className="text-xs text-gray-400 mt-0.5">
            Validation charge · credited to your account
          </p>
        </div>
      </div>

      {/* Trust strip */}
      <div className="px-5 py-4 border-t border-gray-50">
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
