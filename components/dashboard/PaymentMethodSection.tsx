'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  CreditCard,
  Plus,
  Shield,
  CheckCircle,
  AlertCircle,
  Loader2,
  Lock
} from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';

interface PendingOrder {
  id: string;
  order_number: string;
  package_name: string;
  package_price: number;
  installation_address: string;
  created_at: string;
}

interface PaymentMethodSectionProps {
  pendingOrders?: PendingOrder[];
  hasPaymentMethod?: boolean;
}

export function PaymentMethodSection({
  pendingOrders = [],
  hasPaymentMethod = false
}: PaymentMethodSectionProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleAddPaymentMethod = async () => {
    setIsProcessing(true);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, 45000);

    try {
      // Initiate R1.00 validation charge using dedicated payment-method-initiate endpoint
      // This endpoint handles authentication, customer lookup, and correct return URLs
      const response = await fetch('/api/payments/payment-method-initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // No body needed - endpoint handles everything internally based on authenticated user
        body: JSON.stringify({}),
        signal: controller.signal,
      });

      const data = await response.json();

      if (!response.ok || !data.success || !data.payment_url) {
        throw new Error(data.error || 'Failed to initiate payment validation');
      }

      toast.success('Redirecting to secure payment...');

      // Redirect to NetCash payment page
      // After payment, user will be redirected to /dashboard/billing?payment_method=success|cancelled
      setTimeout(() => {
        window.location.href = data.payment_url as string;
      }, 1000);
    } catch (error: any) {
      console.error('Payment validation error:', error);
      if (error?.name === 'AbortError') {
        toast.error('Payment gateway took too long to respond. Please try again or contact support.');
      } else {
        toast.error(error instanceof Error ? error.message : 'Failed to add payment method');
      }
    } finally {
      clearTimeout(timeoutId);
      setIsProcessing(false);
    }
  };

  const hasPendingOrders = pendingOrders.length > 0;

  return (
    <div className="space-y-6">
      {/* Pending Orders Alert */}
      {hasPendingOrders && !hasPaymentMethod && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-orange-900 mb-1">
                Complete Your Order
              </p>
              <p className="text-xs text-orange-700 mb-3">
                You have {pendingOrders.length} pending {pendingOrders.length === 1 ? 'order' : 'orders'} waiting for payment method validation.
                Add a payment method to complete your order.
              </p>
              <div className="space-y-2">
                {pendingOrders.map((order) => (
                  <div key={order.id} className="bg-white rounded-lg p-3 text-xs">
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-semibold text-gray-900">{order.package_name}</span>
                      <Badge variant="outline" className="text-xs">Pending</Badge>
                    </div>
                    <p className="text-gray-600">{order.installation_address}</p>
                    <p className="text-gray-500 mt-1">
                      Order #{order.order_number} • {new Date(order.created_at).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Method Card */}
      <Card>
        <CardContent className="space-y-4 pt-6">
          {hasPaymentMethod ? (
            // Existing Payment Method
            <div className="border border-green-200 bg-green-50 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 mb-1">Payment Method Active</p>
                    <p className="text-sm text-gray-600">
                      Your payment method has been verified and is ready for automatic billing.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // No Payment Method - Show Add Option
            <div className="space-y-4">
              {/* Info Banner - Enhanced with Security Badge */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-xl p-5 shadow-sm">
                <div className="flex items-start gap-3">
                  <Shield className="w-6 h-6 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-blue-900 mb-2">
                      Secure Payment Method Validation
                    </p>
                    <p className="text-sm text-blue-700 leading-relaxed">
                      We'll charge <strong>R1.00</strong> to verify your payment method.
                      This amount will be <strong>credited to your account</strong> and can be used towards your service.
                    </p>
                    {/* NetCash Security Badge - Prominent Placement */}
                    <div className="mt-3 inline-flex items-center gap-2 bg-green-600 text-white px-3 py-1.5 rounded-full text-xs font-semibold shadow-md">
                      <Lock className="w-3.5 h-3.5" />
                      <span>Secured by NetCash</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Add Payment Button - Enhanced Empty State */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-circleTel-orange hover:bg-orange-50/30 transition-all duration-300">
                {/* Enhanced Empty State Icon with Gradient */}
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-circleTel-orange to-orange-600 rounded-full mb-4 shadow-lg">
                  <div className="relative">
                    <CreditCard className="w-9 h-9 text-white" />
                    <Shield className="w-5 h-5 text-white absolute -bottom-1 -right-1 bg-green-500 rounded-full p-0.5" />
                  </div>
                </div>
                <h3 className="font-bold text-gray-900 text-lg mb-2">No Payment Method Added</h3>
                <p className="text-sm text-gray-600 mb-5 max-w-md mx-auto leading-relaxed">
                  Add a payment method to enable automatic billing and complete your pending orders.
                </p>
                <Button
                  onClick={handleAddPaymentMethod}
                  disabled={isProcessing}
                  className="bg-circleTel-orange hover:bg-circleTel-orange/90 text-base px-6 py-6 h-auto shadow-md hover:shadow-lg transition-all"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Plus className="w-5 h-5 mr-2" />
                      Add Payment Method
                    </>
                  )}
                </Button>
                {/* CTA Secondary Text */}
                <p className="text-xs text-gray-500 mt-4 flex items-center justify-center gap-2">
                  <Shield className="w-3.5 h-3.5" />
                  <span>Takes only 2 minutes • Bank-level security</span>
                </p>
              </div>

              {/* Payment Methods Accepted - Enhanced Spacing */}
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-5 border border-gray-200">
                <p className="text-sm text-gray-700 font-semibold mb-4">We Accept:</p>
                {/* Card Payment Methods */}
                <div className="flex items-center gap-6 flex-wrap justify-center mb-4">
                  <div className="relative h-8 w-auto">
                    <Image
                      src="/images/payment-logos/logo_mastercard-h.png"
                      alt="Mastercard"
                      width={50}
                      height={32}
                      className="object-contain"
                    />
                  </div>
                  <div className="relative h-7 w-auto">
                    <Image
                      src="/images/payment-logos/verified-by-visa.png"
                      alt="Visa"
                      width={45}
                      height={28}
                      className="object-contain"
                    />
                  </div>
                  <div className="relative h-7 w-auto">
                    <Image
                      src="/images/payment-logos/3d-secure.png"
                      alt="3D Secure"
                      width={45}
                      height={28}
                      className="object-contain"
                    />
                  </div>
                </div>
                {/* Additional Payment Methods Text */}
                <p className="text-xs text-gray-600 text-center leading-relaxed">
                  Instant EFT • Capitec Pay • Scan to Pay • Retail Payments
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
