'use client';

interface OrderSummarySidebarProps {
  packageName: string;
  speed: string;
  monthlyPrice: number;
  promotionPrice?: number;
  promotionMonths?: number;
  installationFee?: number;
}

export function OrderSummarySidebar({
  packageName,
  speed,
  monthlyPrice,
  promotionPrice,
  promotionMonths,
  installationFee = 0,
}: OrderSummarySidebarProps) {
  return (
    <div className="bg-gray-50 rounded-xl border border-gray-200 p-6 sticky top-6">
      <h3 className="font-semibold text-gray-900 mb-4">Order Summary</h3>

      <div className="mb-4">
        <p className="font-medium text-gray-900">{packageName}</p>
        <p className="text-sm text-gray-500">{speed}</p>
      </div>

      <div className="space-y-2 text-sm border-t border-gray-200 pt-4">
        <div className="flex justify-between">
          <span className="text-gray-600">Monthly subscription</span>
          <span className="text-gray-900">
            {promotionPrice ? (
              <>
                <span className="text-orange-500 font-medium">R{promotionPrice}</span>
                <span className="text-gray-400 line-through ml-1 text-xs">R{monthlyPrice}</span>
              </>
            ) : (
              `R${monthlyPrice}`
            )}
          </span>
        </div>
        {promotionMonths && (
          <p className="text-xs text-gray-400">
            Promo price for {promotionMonths} months, then R{monthlyPrice}/month
          </p>
        )}
        <div className="flex justify-between">
          <span className="text-gray-600">Installation</span>
          <span className="text-gray-900">{installationFee > 0 ? `R${installationFee}` : 'FREE'}</span>
        </div>
      </div>

      <div className="border-t border-gray-200 mt-4 pt-4">
        <div className="flex justify-between items-center">
          <span className="font-semibold text-gray-900">Charged today</span>
          <span className="text-xl font-bold text-orange-500">R1.00</span>
        </div>
        <p className="text-xs text-gray-400 mt-1">
          Validation charge — credited to your account
        </p>
      </div>
    </div>
  );
}
