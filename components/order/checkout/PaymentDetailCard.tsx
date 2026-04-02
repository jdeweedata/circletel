'use client';

import { PiCreditCardBold } from 'react-icons/pi';

interface PaymentDetailCardProps {
  packageName: string;
  speed: string;
  monthlyPrice: number;
  promotionPrice?: number;
  installationFee?: number;
  isSimOnly?: boolean;
}

export function PaymentDetailCard({
  packageName,
  speed,
  monthlyPrice,
  promotionPrice,
  installationFee = 0,
  isSimOnly = false,
}: PaymentDetailCardProps) {
  const displayMonthly = promotionPrice ?? monthlyPrice;

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Package header */}
      <div className="px-5 py-4 border-b border-gray-50">
        <p className="text-sm font-bold text-circleTel-navy mb-1">Order Summary</p>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold text-gray-900 text-sm">{packageName}</p>
            <p className="text-xs text-gray-400 mt-0.5">{speed}</p>
          </div>
          <span className="text-sm font-semibold text-gray-700">R{displayMonthly}<span className="text-xs font-normal text-gray-400">/mo</span></span>
        </div>
      </div>

      {/* Line items */}
      <div className="px-5 py-4 space-y-2.5">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">Sub Total</span>
          <span className="text-gray-700">R{displayMonthly}/mo</span>
        </div>
        {!isSimOnly && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Installation</span>
            {installationFee > 0 ? (
              <span className="text-gray-700">R{installationFee}</span>
            ) : (
              <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">FREE</span>
            )}
          </div>
        )}
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">Payment Fee</span>
          <span className="text-gray-400 text-xs">R1.00 validation</span>
        </div>

        <div className="border-t border-gray-100 pt-2.5 flex items-center justify-between">
          <span className="text-sm font-semibold text-gray-800">Total today</span>
          <span className="text-2xl font-extrabold text-circleTel-orange">R1.00</span>
        </div>
      </div>

      {/* Payment method */}
      <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex items-center gap-2.5">
        <PiCreditCardBold className="w-4 h-4 text-gray-400 flex-shrink-0" />
        <div>
          <p className="text-xs font-medium text-gray-700">Credit or Debit Card</p>
          <p className="text-[11px] text-gray-400">Visa · Mastercard · 3D Secure</p>
        </div>
      </div>
    </div>
  );
}
