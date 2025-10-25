'use client';

import React from 'react';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  Package,
  MapPin,
  User,
  Mail,
  Phone,
  Zap,
  TrendingUp,
  Home,
  MessageSquare
} from 'lucide-react';
import { useOrderContext } from './context/OrderContext';

export default function OrderSummary() {
  const { state } = useOrderContext();
  const { coverage, account, contact, installation } = state.orderData;

  const selectedPackage = coverage?.selectedPackage;
  const pricing = coverage?.pricing;

  // Calculate pricing
  const basePrice = pricing?.monthly || selectedPackage?.monthlyPrice || 0;
  const promotionPrice = selectedPackage?.promotion_price 
    ? (typeof selectedPackage.promotion_price === 'string' ? parseFloat(selectedPackage.promotion_price) : selectedPackage.promotion_price)
    : null;
  const hasPromotion = promotionPrice !== null && promotionPrice < basePrice;
  const deliveryFee = selectedPackage?.delivery_fee || 0;
  const activationFee = selectedPackage?.activation_fee || 0;

  // Format customer name
  const customerName = contact?.contactName ||
    `${account?.firstName || ''} ${account?.lastName || ''}`.trim() ||
    'Customer';

  return (
    <div className="space-y-6">
      {/* Package Details Section */}
      <div>
        <h3 className="text-sm font-semibold text-circleTel-darkNeutral mb-3 flex items-center gap-2">
          <Package className="h-4 w-4 text-circleTel-orange" />
          Package Details
        </h3>

        <div className="bg-circleTel-lightNeutral rounded-lg p-4 space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-bold text-lg text-circleTel-darkNeutral">
                {selectedPackage?.name || 'Package Not Selected'}
              </p>
              <p className="text-sm text-circleTel-secondaryNeutral">
                {selectedPackage?.description || ''}
              </p>
            </div>
            <Badge variant="secondary" className="bg-circleTel-orange/10 text-circleTel-orange">
              {selectedPackage?.type?.toUpperCase() || 'N/A'}
            </Badge>
          </div>

          {/* Speed Display */}
          {selectedPackage?.speed && (
            <div className="flex items-center gap-2 text-sm">
              <Zap className="h-4 w-4 text-circleTel-orange" />
              <span className="font-medium">Speed:</span>
              <span className="text-circleTel-secondaryNeutral">
                {selectedPackage.speed}
              </span>
            </div>
          )}

          {/* Features */}
          {selectedPackage?.features && selectedPackage.features.length > 0 && (
            <div className="pt-2">
              <p className="text-xs font-medium text-circleTel-secondaryNeutral mb-2">
                Included Features:
              </p>
              <div className="space-y-1">
                {selectedPackage.features.slice(0, 3).map((feature, index) => (
                  <div key={index} className="flex items-center gap-2 text-xs">
                    <div className="h-1.5 w-1.5 rounded-full bg-circleTel-orange" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Pricing Breakdown Section */}
      <div>
        <h3 className="text-sm font-semibold text-circleTel-darkNeutral mb-3 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-circleTel-orange" />
          Pricing Information
        </h3>

        <div className="space-y-3">
          {/* Monthly Subscription */}
          <div className="bg-circleTel-lightNeutral rounded-lg p-3">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-circleTel-darkNeutral">Monthly Subscription</span>
              {hasPromotion ? (
                <div className="text-right">
                  <div className="text-xs text-gray-500 line-through">R{basePrice.toFixed(2)}</div>
                  <div className="text-lg font-bold text-circleTel-orange">R{promotionPrice.toFixed(2)}</div>
                </div>
              ) : (
                <span className="text-lg font-bold text-circleTel-darkNeutral">R{basePrice.toFixed(2)}</span>
              )}
            </div>
            {hasPromotion && selectedPackage?.promotion_months && (
              <Badge variant="secondary" className="bg-green-600 text-white text-xs">
                Special: R{promotionPrice.toFixed(2)}/month for {selectedPackage.promotion_months} months
              </Badge>
            )}
          </div>

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

          <Separator className="my-3" />

          {/* Billing Information */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-blue-900 mb-2 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Billing Information
            </h4>
            <div className="space-y-2 text-xs text-blue-800">
              <div className="flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">•</span>
                <span><strong>No payment required today</strong> - You will only be billed once your service is activated</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">•</span>
                <span><strong>Pro-rata billing:</strong> Your first bill will be calculated based on the remaining days in the month from activation date</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">•</span>
                <span><strong>Recurring billing:</strong> Monthly subscription will be billed on the same day each month after activation</span>
              </div>
              {activationFee > 0 && (
                <div className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">•</span>
                  <span><strong>Activation fee:</strong> R{activationFee.toFixed(2)} will be included in your first bill</span>
                </div>
              )}
              {deliveryFee > 0 && (
                <div className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">•</span>
                  <span><strong>Delivery fee:</strong> R{deliveryFee.toFixed(2)} is payable upfront for equipment delivery</span>
                </div>
              )}
            </div>
          </div>

          {/* Total Due Today */}
          {deliveryFee > 0 ? (
            <div className="bg-circleTel-orange/10 border-2 border-circleTel-orange rounded-lg p-4">
              <div className="flex justify-between items-center">
                <span className="font-bold text-circleTel-darkNeutral">Total Due Today</span>
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

      {/* Installation Details Section */}
      <div>
        <h3 className="text-sm font-semibold text-circleTel-darkNeutral mb-3 flex items-center gap-2">
          <Home className="h-4 w-4 text-circleTel-orange" />
          Installation Details
        </h3>

        <div className="space-y-3 text-sm">
          {/* Installation Address */}
          <div className="flex items-start gap-2">
            <MapPin className="h-4 w-4 text-circleTel-secondaryNeutral mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-circleTel-darkNeutral">Installation Address</p>
              <p className="text-circleTel-secondaryNeutral">
                {coverage?.address || 'Address not provided'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Customer Details Section */}
      <div>
        <h3 className="text-sm font-semibold text-circleTel-darkNeutral mb-3 flex items-center gap-2">
          <User className="h-4 w-4 text-circleTel-orange" />
          Customer Details
        </h3>

        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-circleTel-secondaryNeutral flex-shrink-0" />
            <span className="text-circleTel-secondaryNeutral">Name:</span>
            <span className="font-medium">{customerName}</span>
          </div>

          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-circleTel-secondaryNeutral flex-shrink-0" />
            <span className="text-circleTel-secondaryNeutral">Email:</span>
            <span className="font-medium">
              {account?.email || contact?.contactEmail || 'Not provided'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-circleTel-secondaryNeutral flex-shrink-0" />
            <span className="text-circleTel-secondaryNeutral">Phone:</span>
            <span className="font-medium">
              {account?.phone || contact?.contactPhone || 'Not provided'}
            </span>
          </div>
        </div>
      </div>

      {/* Special Instructions */}
      {installation?.specialInstructions && (
        <div>
          <h3 className="text-sm font-semibold text-circleTel-darkNeutral mb-3 flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-circleTel-orange" />
            Special Instructions
          </h3>
          <div className="bg-circleTel-lightNeutral rounded-lg p-3">
            <p className="text-sm text-circleTel-secondaryNeutral">
              {installation.specialInstructions}
            </p>
          </div>
        </div>
      )}

      {/* Next Steps */}
      <div className="bg-circleTel-orange/5 border border-circleTel-orange/20 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-circleTel-orange mb-2">
          What Happens Next?
        </h4>
        <ul className="space-y-1.5 text-xs text-circleTel-secondaryNeutral">
          <li className="flex items-start gap-2">
            <span className="text-circleTel-orange mt-0.5">✓</span>
            <span>You'll receive an order confirmation email immediately</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-circleTel-orange mt-0.5">✓</span>
            <span>Our team will contact you within 24 hours to schedule installation</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-circleTel-orange mt-0.5">✓</span>
            <span>A technician will be dispatched on your preferred date</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-circleTel-orange mt-0.5">✓</span>
            <span>Your service will be activated and tested before completion</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
