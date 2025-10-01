'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  CreditCard,
  Loader2,
  AlertCircle,
  CheckCircle,
  Shield,
  ArrowLeft,
  Lock,
  Package
} from 'lucide-react';
import { toast } from 'sonner';
import { useOrderContext } from '../context/OrderContext';
import OrderSummary from '../OrderSummary';

interface PaymentStageProps {
  onComplete: () => void;
  onBack?: () => void;
}

export default function PaymentStage({ onComplete, onBack }: PaymentStageProps) {
  const { state } = useOrderContext();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Extract order data from context
  const { coverage, account, contact, installation } = state.orderData;
  const selectedPackage = coverage?.selectedPackage;
  const pricing = coverage?.pricing;

  // Calculate totals
  const basePrice = pricing?.monthly || selectedPackage?.monthlyPrice || 0;
  const installationFee = pricing?.onceOff || selectedPackage?.onceOffPrice || 0;
  const totalAmount = basePrice + installationFee;

  const handlePayment = async () => {
    setIsProcessing(true);
    setError(null);

    try {
      // Step 1: Create order in database
      const orderData = {
        // Customer information
        customerName: `${account.firstName} ${account.lastName}`,
        customerEmail: account.email || contact.contactEmail,
        customerPhone: account.phone || contact.contactPhone,

        // Service details
        packageId: selectedPackage?.id || '',
        serviceType: selectedPackage?.type || 'fibre',
        speedDown: parseInt(selectedPackage?.speed?.split('/')[0] || '0'),
        speedUp: parseInt(selectedPackage?.speed?.split('/')[1] || '0'),

        // Pricing
        basePrice: basePrice,
        installationFee: installationFee,
        totalAmount: totalAmount,

        // Installation address
        installationAddress: coverage.address || '',
        coordinates: coverage.coordinates,

        // Installation preferences
        preferredDate: installation.preferredDate,
        specialInstructions: installation.specialInstructions,

        // Notes
        customerNotes: installation.specialInstructions,
      };

      // Call order creation API
      const orderResponse = await fetch('/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      });

      if (!orderResponse.ok) {
        const errorData = await orderResponse.json();
        throw new Error(errorData.error || 'Failed to create order');
      }

      const { order } = await orderResponse.json();

      // Step 2: Initiate Netcash payment
      const paymentResponse = await fetch('/api/payment/netcash/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order.id,
          amount: totalAmount,
          customerEmail: account.email || contact.contactEmail,
          customerName: `${account.firstName} ${account.lastName}`,
          paymentReference: order.payment_reference,
        }),
      });

      if (!paymentResponse.ok) {
        const errorData = await paymentResponse.json();
        throw new Error(errorData.error || 'Failed to initiate payment');
      }

      const { paymentUrl } = await paymentResponse.json();

      // Step 3: Redirect to Netcash payment page
      toast.success('Redirecting to secure payment...');

      // Small delay for user to see toast
      setTimeout(() => {
        window.location.href = paymentUrl;
      }, 1000);

    } catch (err) {
      console.error('Payment initiation error:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      setIsProcessing(false);
      toast.error('Payment initiation failed. Please try again.');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-circleTel-darkNeutral">Payment</h2>
        <p className="text-circleTel-secondaryNeutral mt-1">
          Review your order and proceed to secure payment
        </p>
      </div>

      {/* Order Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-circleTel-orange" />
            Order Summary
          </CardTitle>
          <CardDescription>
            Please review your order details before proceeding
          </CardDescription>
        </CardHeader>
        <CardContent>
          <OrderSummary />
        </CardContent>
      </Card>

      {/* Payment Information Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-circleTel-orange" />
            Secure Payment
          </CardTitle>
          <CardDescription>
            You'll be redirected to Netcash's secure payment gateway
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Payment Amount Display */}
          <div className="bg-circleTel-lightNeutral rounded-lg p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-circleTel-secondaryNeutral">
                Monthly Subscription
              </span>
              <span className="font-semibold">
                R{basePrice.toFixed(2)}
              </span>
            </div>

            {installationFee > 0 && (
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-circleTel-secondaryNeutral">
                  Installation Fee
                </span>
                <span className="font-semibold">
                  R{installationFee.toFixed(2)}
                </span>
              </div>
            )}

            <Separator className="my-3" />

            <div className="flex justify-between items-center">
              <span className="text-lg font-bold text-circleTel-darkNeutral">
                Total Due Today
              </span>
              <span className="text-2xl font-bold text-circleTel-orange">
                R{totalAmount.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Security Features */}
          <div className="space-y-2">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-medium text-sm">Secure Payment Processing</p>
                <p className="text-xs text-circleTel-secondaryNeutral">
                  Your payment is processed securely through Netcash's PCI-DSS compliant gateway
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Lock className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-medium text-sm">256-bit SSL Encryption</p>
                <p className="text-xs text-circleTel-secondaryNeutral">
                  All payment information is encrypted and never stored on our servers
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-medium text-sm">Instant Confirmation</p>
                <p className="text-xs text-circleTel-secondaryNeutral">
                  You'll receive an order confirmation email immediately after payment
                </p>
              </div>
            </div>
          </div>

          {/* Accepted Payment Methods */}
          <div className="pt-4">
            <p className="text-sm font-medium text-circleTel-darkNeutral mb-3">
              Accepted Payment Methods
            </p>
            <div className="flex gap-2 flex-wrap">
              <Badge variant="outline" className="px-3 py-1">
                💳 Credit Card
              </Badge>
              <Badge variant="outline" className="px-3 py-1">
                💳 Debit Card
              </Badge>
              <Badge variant="outline" className="px-3 py-1">
                🏦 EFT
              </Badge>
              <Badge variant="outline" className="px-3 py-1">
                💰 Instant EFT
              </Badge>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            {onBack && (
              <Button
                type="button"
                variant="outline"
                onClick={onBack}
                disabled={isProcessing}
                className="flex-1"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            )}

            <Button
              onClick={handlePayment}
              disabled={isProcessing}
              className="flex-1 bg-circleTel-orange hover:bg-circleTel-orange/90"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="h-4 w-4 mr-2" />
                  Pay with Netcash
                </>
              )}
            </Button>
          </div>

          {/* Terms Notice */}
          <p className="text-xs text-center text-circleTel-secondaryNeutral pt-2">
            By proceeding with payment, you agree to CircleTel's{' '}
            <a href="/terms" className="text-circleTel-orange hover:underline">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="/privacy" className="text-circleTel-orange hover:underline">
              Privacy Policy
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
