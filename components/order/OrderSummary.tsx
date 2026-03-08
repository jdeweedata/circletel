'use client';
import { PiChatBold, PiEnvelopeBold, PiGlobeBold, PiHeadsetBold, PiHouseBold, PiLightningBold, PiMapPinBold, PiPackageBold, PiPhoneBold, PiPlusBold, PiTrendUpBold, PiUserBold, PiWifiHighBold } from 'react-icons/pi';

import React from 'react';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useOrderContext } from './context/OrderContext';

const ADDON_ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  globe: PiGlobeBold,
  headset: PiHeadsetBold,
  wifi: PiWifiHighBold,
};

export default function OrderSummary() {
  const { state } = useOrderContext();
  const { coverage, package: packageData, account, contact, installation } = state.orderData;

  const selectedPackage = packageData?.selectedPackage;
  const selectedAddons = packageData?.selectedAddons || [];
  const pricing = packageData?.pricing;

  // Calculate base pricing (without addons for display)
  const basePriceFromBreakdown = pricing?.breakdown?.find(b => b.name === selectedPackage?.name)?.amount;
  const basePrice = basePriceFromBreakdown || pricing?.monthly || selectedPackage?.monthlyPrice || 0;
  const promotionPrice = selectedPackage?.promotion_price
    ? (typeof selectedPackage.promotion_price === 'string' ? parseFloat(selectedPackage.promotion_price) : selectedPackage.promotion_price)
    : null;
  const hasPromotion = promotionPrice !== null && promotionPrice < basePrice;
  const deliveryFee = selectedPackage?.delivery_fee || 0;
  const activationFee = selectedPackage?.activation_fee || 0;

  // Calculate add-ons total
  const addonsTotal = selectedAddons.reduce(
    (sum, sa) => sum + sa.addon.price_incl_vat * sa.quantity,
    0
  );
  const totalMonthly = basePrice + addonsTotal;

  // Format customer name
  const customerName = contact?.contactName ||
    `${account?.firstName || ''} ${account?.lastName || ''}`.trim() ||
    'Customer';

  return (
    <div className="space-y-4">
      {/* Pricing Breakdown Section */}
      <div>
        <h3 className="text-sm font-semibold text-circleTel-navy mb-3 flex items-center gap-2">
          <PiTrendUpBold className="h-4 w-4 text-circleTel-orange" />
          Pricing Information
        </h3>

        <div className="space-y-3">
          {/* Base Package */}
          <div className="bg-circleTel-lightNeutral rounded-lg p-3">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-circleTel-navy">{selectedPackage?.name || 'Monthly Subscription'}</span>
              {hasPromotion ? (
                <div className="text-right">
                  <div className="text-xs text-gray-500 line-through">R{basePrice.toFixed(2)}</div>
                  <div className="text-lg font-bold text-circleTel-orange">R{promotionPrice.toFixed(2)}</div>
                </div>
              ) : (
                <span className="text-lg font-bold text-circleTel-navy">R{basePrice.toFixed(2)}</span>
              )}
            </div>
            {hasPromotion && selectedPackage?.promotion_months && (
              <Badge variant="secondary" className="bg-green-600 text-white text-xs">
                Special: R{promotionPrice.toFixed(2)}/month for {selectedPackage.promotion_months} months
              </Badge>
            )}
          </div>

          {/* Selected Add-ons */}
          {selectedAddons.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-circleTel-navy">
                <PiPlusBold className="h-4 w-4 text-circleTel-orange" />
                Add-ons
              </div>
              {selectedAddons.map((sa) => {
                const IconComponent = ADDON_ICON_MAP[sa.addon.icon || ''] || PiPlusBold;
                return (
                  <div key={sa.addon.id} className="flex items-center justify-between bg-orange-50 rounded-lg p-2.5">
                    <div className="flex items-center gap-2">
                      <IconComponent className="h-4 w-4 text-circleTel-orange" />
                      <span className="text-sm text-gray-700">{sa.addon.name}</span>
                    </div>
                    <span className="text-sm font-semibold text-circleTel-orange">
                      +R{sa.addon.price_incl_vat.toFixed(2)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Monthly Total (if add-ons present) */}
          {selectedAddons.length > 0 && (
            <div className="bg-circleTel-navy/5 border border-circleTel-navy/20 rounded-lg p-3">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-circleTel-navy">Total Monthly</span>
                <span className="text-lg font-bold text-circleTel-navy">R{totalMonthly.toFixed(2)}</span>
              </div>
            </div>
          )}

          {/* Activation Fee */}
          {activationFee > 0 && (
            <div className="flex justify-between items-center text-sm bg-blue-50 border border-blue-200 rounded-lg p-3">
              <span className="text-circleTel-secondaryNeutral">One-time Activation Fee</span>
              <span className="font-semibold">R{activationFee.toFixed(2)}</span>
            </div>
          )}

          {/* Delivery Fee */}
          {deliveryFee > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-yellow-900">Delivery Fee (Due Today)</span>
                <span className="text-lg font-bold text-yellow-900">R{deliveryFee.toFixed(2)}</span>
              </div>
              <p className="text-xs text-yellow-700 mt-1">Payable upfront for equipment delivery</p>
            </div>
          )}

          <Separator className="my-2" />

          {/* Billing Information - Compact */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-semibold text-blue-900 flex items-center gap-1.5">
                <PiTrendUpBold className="h-3.5 w-3.5" />
                Billing Details
              </h4>
            </div>
            <div className="space-y-1 text-xs text-blue-800">
              <p><strong>No payment today</strong> - Billed after activation</p>
              <p><strong>Pro-rata billing</strong> for first month</p>
              {activationFee > 0 && <p><strong>Activation:</strong> R{activationFee.toFixed(2)} (first bill)</p>}
              {deliveryFee > 0 && <p><strong>Delivery:</strong> R{deliveryFee.toFixed(2)} (upfront)</p>}
            </div>
          </div>

          {/* Total Due Today */}
          {deliveryFee > 0 ? (
            <div className="bg-circleTel-orange/10 border-2 border-circleTel-orange rounded-lg p-4">
              <div className="flex justify-between items-center">
                <span className="font-bold text-circleTel-navy">Total Due Today</span>
                <span className="text-2xl font-bold text-circleTel-orange">
                  R{deliveryFee.toFixed(2)}
                </span>
              </div>
              <p className="text-xs text-circleTel-secondaryNeutral mt-1">Delivery fee only - Monthly billing starts after activation</p>
            </div>
          ) : (
            <div className="bg-green-50 border-2 border-green-500 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <span className="font-bold text-green-900">Total Due Today</span>
                <span className="text-2xl font-bold text-green-700">R0.00</span>
              </div>
              <p className="text-xs text-green-700 mt-1">✓ No payment required - Billing starts after service activation</p>
            </div>
          )}
        </div>
      </div>

      {/* Next Steps */}
      <div className="bg-circleTel-orange/5 border border-circleTel-orange/20 rounded-lg p-3">
        <h4 className="text-xs font-semibold text-circleTel-orange mb-2">
          What Happens Next?
        </h4>
        <ul className="space-y-1 text-xs text-circleTel-secondaryNeutral">
          <li className="flex items-start gap-2">
            <span className="text-circleTel-orange mt-0.5">✓</span>
            <span>Order confirmation email sent immediately</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-circleTel-orange mt-0.5">✓</span>
            <span>Team contacts you within 24 hours</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-circleTel-orange mt-0.5">✓</span>
            <span>Installation scheduled at your convenience</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
