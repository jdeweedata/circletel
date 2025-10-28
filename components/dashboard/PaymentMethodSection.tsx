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

    try {
      // Initiate R1.00 validation charge
      const response = await fetch('/api/payment/netcash/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: 1.00, // R1.00 validation charge
          customerEmail: '', // Will be filled from user session
          customerName: '', // Will be filled from user session
          paymentReference: `VALIDATION-${Date.now()}`,
          isValidation: true,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to initiate payment validation');
      }

      const { paymentUrl } = await response.json();

      toast.success('Redirecting to secure payment...');

      // Redirect to NetCash payment page
      setTimeout(() => {
        window.location.href = paymentUrl;
      }, 1000);

    } catch (error) {
      console.error('Payment validation error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to add payment method');
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
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-circleTel-orange" />
                Payment Method
              </CardTitle>
              <CardDescription className="mt-1">
                Manage your payment method for automatic billing
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
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
              {/* Info Banner */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-blue-900 mb-1">
                      Secure Payment Method Validation
                    </p>
                    <p className="text-xs text-blue-700">
                      We'll charge <strong>R1.00</strong> to verify your payment method.
                      This amount will be <strong>credited to your account</strong> and can be used towards your service.
                    </p>
                  </div>
                </div>
              </div>

              {/* Add Payment Button */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-circleTel-orange transition-colors">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-gray-100 rounded-full mb-3">
                  <CreditCard className="w-6 h-6 text-gray-400" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">No Payment Method Added</h3>
                <p className="text-sm text-gray-600 mb-4 max-w-md mx-auto">
                  Add a payment method to enable automatic billing and complete your pending orders.
                </p>
                <Button
                  onClick={handleAddPaymentMethod}
                  disabled={isProcessing}
                  className="bg-circleTel-orange hover:bg-circleTel-orange/90"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Payment Method
                    </>
                  )}
                </Button>
              </div>

              {/* Payment Methods Accepted */}
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs text-gray-600 font-semibold mb-3">We Accept:</p>
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="relative h-6 w-auto">
                    <Image
                      src="/images/payment-logos/logo_mastercard-h.png"
                      alt="Mastercard"
                      width={40}
                      height={24}
                      className="object-contain"
                    />
                  </div>
                  <div className="relative h-5 w-auto">
                    <Image
                      src="/images/payment-logos/verified-by-visa.png"
                      alt="Visa"
                      width={32}
                      height={20}
                      className="object-contain"
                    />
                  </div>
                  <div className="relative h-5 w-auto">
                    <Image
                      src="/images/payment-logos/3d-secure.png"
                      alt="3D Secure"
                      width={32}
                      height={20}
                      className="object-contain"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-200">
                  <span className="text-xs text-gray-600 font-semibold">Secured by</span>
                  <div className="relative h-5 w-auto">
                    <Image
                      src="/images/payment-logos/logo_netcash-43.png"
                      alt="NetCash"
                      width={60}
                      height={20}
                      className="object-contain"
                    />
                  </div>
                  <Lock className="h-3 w-3 text-gray-500" />
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
