'use client';

import React, { useState, useEffect } from 'react';
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
  Package,
  Smartphone,
  Building2
} from 'lucide-react';
import Image from 'next/image';
import { toast } from 'sonner';
import { useOrderContext } from '../context/OrderContext';
import OrderSummary from '../OrderSummary';
import { PaymentErrorDisplay } from '@/components/payment/PaymentErrorDisplay';
import { detectPaymentErrorCode, PaymentErrorCode } from '@/lib/payment/payment-errors';
import {
  saveOrderData,
  getOrderData,
  clearOrderData,
  recordPaymentAttempt,
  getRetryInfo,
  savePaymentError,
  getPaymentError,
  saveOrderId,
  getRetrySession,
} from '@/lib/payment/payment-persistence';

interface PaymentStageProps {
  onComplete: () => void;
  onBack?: () => void;
}

export default function PaymentStage({ onComplete, onBack }: PaymentStageProps) {
  const { state } = useOrderContext();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentErrorCode, setPaymentErrorCode] = useState<PaymentErrorCode | null>(null);
  const [retrySession, setRetrySession] = useState(getRetrySession());
  const [showErrorDisplay, setShowErrorDisplay] = useState(false);

  // Extract order data from context
  const { coverage, account, contact, installation } = state.orderData;
  const selectedPackage = coverage?.selectedPackage;
  const pricing = coverage?.pricing;

  // Calculate totals
  const basePrice = pricing?.monthly || selectedPackage?.monthlyPrice || 0;
  const installationFee = pricing?.onceOff || selectedPackage?.onceOffPrice || 0;
  const totalAmount = basePrice + installationFee;

  // Check for payment errors on mount (returning from payment gateway)
  useEffect(() => {
    const savedError = getPaymentError();
    if (savedError) {
      const errorCode = detectPaymentErrorCode(savedError.message);
      setPaymentErrorCode(errorCode);
      setError(savedError.message);
      setShowErrorDisplay(true);
      toast.error('Payment failed. Please review the error below.');
    }

    // Update retry session info
    setRetrySession(getRetrySession());
  }, []);

  const handlePayment = async () => {
    setIsProcessing(true);
    setError(null);
    setShowErrorDisplay(false);

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

      // Save order data for retry persistence
      saveOrderData({
        customerName: `${account.firstName} ${account.lastName}`,
        customerEmail: account.email || contact.contactEmail,
        customerPhone: account.phone || contact.contactPhone,
        packageId: selectedPackage?.id || '',
        packageName: selectedPackage?.name || '',
        serviceType: selectedPackage?.type || 'fibre',
        speed: selectedPackage?.speed || '',
        basePrice,
        installationFee,
        totalAmount,
        installationAddress: coverage.address || '',
        coordinates: coverage.coordinates,
        preferredDate: installation.preferredDate,
        specialInstructions: installation.specialInstructions,
        createdAt: new Date().toISOString(),
      });

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

      // Save order ID for tracking
      saveOrderId(order.id);

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
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      const errorCode = detectPaymentErrorCode(err instanceof Error ? err : errorMessage);

      // Record payment attempt
      recordPaymentAttempt(errorCode, errorMessage);

      // Update state
      setError(errorMessage);
      setPaymentErrorCode(errorCode);
      setShowErrorDisplay(true);
      setRetrySession(getRetrySession());
      setIsProcessing(false);

      toast.error('Payment initiation failed. Please try again.');
    }
  };

  const handleRetry = () => {
    setShowErrorDisplay(false);
    setError(null);
    setPaymentErrorCode(null);
    handlePayment();
  };

  const handleBackToSummary = () => {
    if (onBack) {
      onBack();
    }
  };

  const handleClearRetrySession = () => {
    clearOrderData();
    setRetrySession(getRetrySession());
    setShowErrorDisplay(false);
    setError(null);
    setPaymentErrorCode(null);
    toast.success('Payment session cleared');
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto py-4">
          <h2 className="text-2xl lg:text-3xl font-bold text-circleTel-darkNeutral">Complete Your Order</h2>
          <p className="text-circleTel-secondaryNeutral mt-1">
            Review your order and proceed to secure payment
          </p>
        </div>
      </div>

      {/* Retry Session Info Banner */}
      <div className="w-full px-4 sm:px-6 lg:px-8">
      {retrySession.hasData && !showErrorDisplay && (
        <Alert className="border-blue-200 bg-blue-50" data-testid="retry-session-banner">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-900">
            <div className="flex items-center justify-between">
              <div>
                <strong>Previous payment attempt detected</strong>
                <p className="text-sm mt-1">
                  {retrySession.retryCount > 0 && (
                    <>
                      You've attempted payment {retrySession.retryCount} time{retrySession.retryCount !== 1 ? 's' : ''}.
                      {' '}
                    </>
                  )}
                  Order created {retrySession.orderAge}.
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearRetrySession}
                className="text-blue-600 hover:text-blue-700 hover:bg-blue-100"
              >
                Clear Session
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Payment Error Display */}
      {showErrorDisplay && paymentErrorCode && (
        <PaymentErrorDisplay
          errorCode={paymentErrorCode}
          errorMessage={error || undefined}
          retryCount={retrySession.retryCount}
          onRetry={handleRetry}
          onBack={handleBackToSummary}
        />
      )}
      </div>

      {/* Two Column Layout */}
      {!showErrorDisplay && (
        <div className="w-full px-4 sm:px-6 lg:px-8 pb-8 lg:pb-12">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {/* Left Column - Order Summary (Sticky on desktop) */}
            <div className="lg:col-span-1">
              <div className="lg:sticky lg:top-6">
                <Card data-testid="order-summary">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Package className="h-5 w-5 text-circleTel-orange" />
                      Order Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <OrderSummary />
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Right Column - Payment Options */}
            <div className="lg:col-span-2">
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
            <div className="pt-4 border-t">
              <p className="text-sm font-semibold text-circleTel-darkNeutral mb-4">
                Accepted Payment Methods
              </p>
              
              {/* Payment Options Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {/* Credit/Debit Cards */}
                <div className="border border-gray-200 rounded-lg p-4 hover:border-circleTel-orange transition-colors">
                  <div className="flex items-start gap-3">
                    <CreditCard className="h-5 w-5 text-circleTel-orange mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <h4 className="font-medium text-sm text-gray-900 mb-1">Credit & Debit Cards</h4>
                      <p className="text-xs text-gray-600 mb-3">Visa, Mastercard, American Express, Diners Club</p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="relative h-6 w-auto">
                          <Image src="/images/payment-logos/logo_mastercard-h.png" alt="Mastercard" width={40} height={24} className="object-contain" />
                        </div>
                        <div className="flex gap-1">
                          <div className="relative h-5 w-auto">
                            <Image src="/images/payment-logos/verified-by-visa.png" alt="Verified by Visa" width={35} height={20} className="object-contain" />
                          </div>
                          <div className="relative h-5 w-auto">
                            <Image src="/images/payment-logos/mastercard-secure-code.png" alt="Mastercard SecureCode" width={35} height={20} className="object-contain" />
                          </div>
                          <div className="relative h-5 w-auto">
                            <Image src="/images/payment-logos/3d-secure.png" alt="3D Secure" width={35} height={20} className="object-contain" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Instant EFT */}
                <div className="border border-gray-200 rounded-lg p-4 hover:border-circleTel-orange transition-colors">
                  <div className="flex items-start gap-3">
                    <Smartphone className="h-5 w-5 text-circleTel-orange mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <h4 className="font-medium text-sm text-gray-900 mb-1">Instant EFT</h4>
                      <p className="text-xs text-gray-600 mb-2">Real-time bank transfer - Instant confirmation</p>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs bg-green-100 text-green-800 border-green-200">
                          ⚡ Instant
                        </Badge>
                        <div className="relative h-5 w-auto">
                          <Image src="/images/payment-logos/logo_instant-eft.png" alt="Instant EFT" width={50} height={20} className="object-contain" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bank EFT */}
                <div className="border border-gray-200 rounded-lg p-4 hover:border-circleTel-orange transition-colors">
                  <div className="flex items-start gap-3">
                    <Building2 className="h-5 w-5 text-circleTel-orange mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <h4 className="font-medium text-sm text-gray-900 mb-1">Bank EFT</h4>
                      <p className="text-xs text-gray-600 mb-3">Standard electronic funds transfer</p>
                      <div className="relative h-6 w-auto">
                        <Image src="/images/payment-logos/logo_bank-eft-h.png" alt="Bank EFT" width={60} height={24} className="object-contain" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Scan to Pay */}
                <div className="border border-gray-200 rounded-lg p-4 hover:border-circleTel-orange transition-colors">
                  <div className="flex items-start gap-3">
                    <Smartphone className="h-5 w-5 text-circleTel-orange mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <h4 className="font-medium text-sm text-gray-900 mb-1">Scan to Pay</h4>
                      <p className="text-xs text-gray-600 mb-2">QR code for mobile wallets & banking apps</p>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800 border-blue-200">
                          📱 Mobile
                        </Badge>
                        <div className="relative h-5 w-auto">
                          <Image src="/images/payment-logos/logo_scan-to-pay.png" alt="Scan to Pay" width={50} height={20} className="object-contain" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Powered by Netcash */}
              <div className="flex items-center justify-center gap-2 py-3 bg-gray-50 rounded-lg">
                <span className="text-xs text-gray-600">Powered by</span>
                <div className="relative h-6 w-auto">
                  <Image src="/images/payment-logos/logo_netcash-43.png" alt="Netcash" width={80} height={24} className="object-contain" />
                </div>
              </div>
            </div>

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
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
