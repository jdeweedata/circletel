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
  Calendar,
  Zap,
  TrendingUp,
  Home,
  MessageSquare
} from 'lucide-react';
import { useOrderContext } from './context/OrderContext';
import { format } from 'date-fns';

export default function OrderSummary() {
  const { state } = useOrderContext();
  const { coverage, account, contact, installation } = state.orderData;

  const selectedPackage = coverage?.selectedPackage;
  const pricing = coverage?.pricing;

  // Calculate pricing
  const basePrice = pricing?.monthly || selectedPackage?.monthlyPrice || 0;
  const promotionalPrice = (basePrice * 0.7); // 30% off for 3 months (example)
  const installationFee = pricing?.onceOff || selectedPackage?.onceOffPrice || 0;

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
          Pricing Breakdown
        </h3>

        <div className="space-y-2">
          {/* Regular Price */}
          <div className="flex justify-between items-center text-sm">
            <span className="text-circleTel-secondaryNeutral">Monthly Subscription</span>
            <span className="font-semibold">R{basePrice.toFixed(2)}/month</span>
          </div>

          {/* Promotional Pricing */}
          {promotionalPrice && promotionalPrice < basePrice && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 my-2">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium text-green-800">
                  🎉 First 3 Months Special
                </span>
                <Badge variant="secondary" className="bg-green-600 text-white">
                  Save 30%
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-green-700">Promotional Rate</span>
                <div className="text-right">
                  <span className="line-through text-xs text-green-700 mr-2">
                    R{basePrice.toFixed(2)}
                  </span>
                  <span className="font-bold text-green-800">
                    R{promotionalPrice.toFixed(2)}/month
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Installation Fee */}
          {installationFee > 0 && (
            <div className="flex justify-between items-center text-sm">
              <span className="text-circleTel-secondaryNeutral">Installation Fee</span>
              <span className="font-semibold">R{installationFee.toFixed(2)}</span>
            </div>
          )}

          <Separator className="my-2" />

          {/* Total */}
          <div className="flex justify-between items-center pt-2">
            <span className="font-bold text-circleTel-darkNeutral">Total Due Today</span>
            <span className="text-xl font-bold text-circleTel-orange">
              R{(basePrice + installationFee).toFixed(2)}
            </span>
          </div>

          {/* After Promo Notice */}
          {promotionalPrice && promotionalPrice < basePrice && (
            <p className="text-xs text-circleTel-secondaryNeutral italic pt-1">
              * Monthly fee will be R{basePrice.toFixed(2)} after promotional period
            </p>
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

          {/* Preferred Installation Date */}
          {installation?.preferredDate && (
            <div className="flex items-start gap-2">
              <Calendar className="h-4 w-4 text-circleTel-secondaryNeutral mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-circleTel-darkNeutral">Preferred Installation Date</p>
                <p className="text-circleTel-secondaryNeutral">
                  {format(new Date(installation.preferredDate), 'EEEE, MMMM d, yyyy')}
                </p>
              </div>
            </div>
          )}

          {/* Installation Timeline */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-2">
            <p className="text-xs font-medium text-blue-900 mb-2">📅 Installation Timeline</p>
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-blue-600" />
                <span className="text-blue-800">
                  <strong>Day 1-2:</strong> Order processing & scheduling
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-blue-600" />
                <span className="text-blue-800">
                  <strong>Day 3-5:</strong> Technician dispatch & installation
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-blue-600" />
                <span className="text-blue-800">
                  <strong>Day 6-7:</strong> Activation & testing
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-green-600" />
                <span className="text-blue-800">
                  <strong>Day 8:</strong> Service live! 🎉
                </span>
              </div>
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
