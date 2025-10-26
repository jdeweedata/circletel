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
  Building2,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  MapPin,
  Sparkles,
  Info
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
  
  // Expandable sections state
  const [expandedPackage, setExpandedPackage] = useState(true);
  const [expandedAddress, setExpandedAddress] = useState(false);
  const [expandedPricing, setExpandedPricing] = useState(false);

  // Extract order data from context
  const { coverage, package: packageData, account, contact, installation } = state.orderData;
  const selectedPackage = packageData?.selectedPackage;
  const pricing = packageData?.pricing;

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
        customerName: `${account?.firstName || ''} ${account?.lastName || ''}`.trim(),
        customerEmail: account?.email || contact?.contactEmail || '',
        customerPhone: account?.phone || contact?.contactPhone || '',

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
        preferredDate: installation?.preferredDate,
        specialInstructions: installation?.specialInstructions,

        // Notes
        customerNotes: installation?.specialInstructions,
      };

      // Save order data for retry persistence
      saveOrderData({
        customerName: `${account?.firstName || ''} ${account?.lastName || ''}`.trim(),
        customerEmail: account?.email || contact?.contactEmail || '',
        customerPhone: account?.phone || contact?.contactPhone || '',
        packageId: selectedPackage?.id || '',
        packageName: selectedPackage?.name || '',
        serviceType: selectedPackage?.type || 'fibre',
        speed: selectedPackage?.speed || '',
        basePrice,
        installationFee,
        totalAmount,
        installationAddress: coverage.address || '',
        coordinates: coverage.coordinates,
        preferredDate: installation?.preferredDate ? installation.preferredDate.toISOString() : undefined,
        specialInstructions: installation?.specialInstructions,
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
          customerEmail: account?.email || contact?.contactEmail || '',
          customerName: `${account?.firstName || ''} ${account?.lastName || ''}`.trim(),
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
    <div className="w-full min-h-screen relative overflow-hidden">
      {/* Textured Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-orange-50/30 via-blue-50/20 to-green-50/30">
        <div className="absolute inset-0 opacity-30" 
             style={{
               backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23F5831F' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
             }}
        />
      </div>

      {/* Header */}
      <div className="relative w-full px-4 sm:px-6 lg:px-8 xl:px-12 pt-8 pb-6">
        <div className="max-w-screen-2xl mx-auto text-center">
          <h1 className="text-3xl lg:text-4xl font-black text-gray-900 mb-2">
            Complete Your Order
          </h1>
          <p className="text-lg text-gray-600 font-medium">
            You're moments away from connecting to high-speed fibre
          </p>
        </div>
      </div>

      {/* Retry Session Info Banner */}
      <div className="relative w-full px-4 sm:px-6 lg:px-8 xl:px-12 mb-6">
        <div className="max-w-screen-2xl mx-auto">
        {retrySession.hasData && !showErrorDisplay && (
          <Alert className="border-blue-300 bg-gradient-to-r from-blue-50 to-blue-100 rounded-2xl shadow-sm" data-testid="retry-session-banner">
            <AlertCircle className="h-5 w-5 text-blue-600" />
            <AlertDescription className="text-blue-900">
              <div className="flex items-center justify-between">
                <div>
                  <strong className="text-base">Previous payment attempt detected</strong>
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
                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-200 rounded-xl font-semibold"
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
      </div>

      {/* Two Column Layout */}
      {!showErrorDisplay && (
        <div className="relative w-full px-4 sm:px-6 lg:px-8 xl:px-12 pb-12 lg:pb-20">
          <div className="max-w-screen-2xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 xl:gap-12">
            {/* Left Column - Order Summary (Sticky on desktop) */}
            <div className="lg:col-span-5 order-2 lg:order-1">
              <div className="lg:sticky lg:top-6 space-y-5">
                {/* Package Details Card */}
                <Card className="rounded-2xl shadow-lg border-2 border-gray-100 hover:shadow-xl transition-shadow duration-300 animate-slide-up" style={{animationDelay: '100ms'}}>
                  <CardHeader className="pb-3 cursor-pointer hover:bg-gray-50/50 transition-colors rounded-t-2xl" onClick={() => setExpandedPackage(!expandedPackage)}>
                    <CardTitle className="flex items-center justify-between text-lg font-bold">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-orange-100 rounded-xl">
                          <Package className="h-5 w-5 text-circleTel-orange" />
                        </div>
                        <span>Package</span>
                      </div>
                      {expandedPackage ? (
                        <ChevronUp className="h-5 w-5 text-gray-500" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-gray-500" />
                      )}
                    </CardTitle>
                  </CardHeader>
                  {expandedPackage && (
                    <CardContent className="animate-fade-in-down">
                      <div className="space-y-4">
                        <div className="p-3 bg-gradient-to-r from-orange-50 to-orange-100/50 rounded-xl border-l-4 border-circleTel-orange">
                          <h4 className="font-black text-xl text-gray-900">{selectedPackage?.name || 'Package Not Selected'}</h4>
                          <p className="text-base text-gray-700 font-semibold mt-1 flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-circleTel-orange" />
                            {selectedPackage?.speed}
                          </p>
                        </div>
                        {selectedPackage?.features && selectedPackage.features.length > 0 && (
                          <div className="space-y-2">
                            {selectedPackage.features.slice(0, 5).map((feature: any, index: number) => (
                              <div key={index} className="flex items-start gap-3 text-sm text-gray-700 p-2 hover:bg-gray-50 rounded-lg transition-colors">
                                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                                <span className="font-medium">{feature}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  )}
                </Card>

                {/* Installation Address Card */}
                <Card className="rounded-2xl shadow-lg border-2 border-gray-100 hover:shadow-xl transition-shadow duration-300 animate-slide-up" style={{animationDelay: '200ms'}}>
                  <CardHeader className="pb-3 cursor-pointer hover:bg-gray-50/50 transition-colors rounded-t-2xl" onClick={() => setExpandedAddress(!expandedAddress)}>
                    <CardTitle className="flex items-center justify-between text-lg font-bold">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-xl">
                          <MapPin className="h-5 w-5 text-blue-600" />
                        </div>
                        <span>Address</span>
                      </div>
                      {expandedAddress ? (
                        <ChevronUp className="h-5 w-5 text-gray-500" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-gray-500" />
                      )}
                    </CardTitle>
                  </CardHeader>
                  {expandedAddress && (
                    <CardContent className="animate-fade-in-down">
                      {coverage?.address ? (
                        <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100/30 rounded-xl border border-blue-200">
                          <div className="text-sm text-gray-800 leading-relaxed space-y-1 font-medium">
                            {coverage.address.split(',').map((line, idx) => (
                              <div key={idx} className="flex items-start gap-2">
                                {idx === 0 && <Building2 className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />}
                                <span className={idx === 0 ? 'font-bold' : ''}>{line.trim()}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 italic p-3 bg-gray-50 rounded-lg">Address not provided</p>
                      )}
                    </CardContent>
                  )}
                </Card>

                {/* Order Summary Card */}
                <Card className="rounded-2xl shadow-lg border-2 border-gray-100 hover:shadow-xl transition-shadow duration-300 animate-slide-up" style={{animationDelay: '300ms'}} data-testid="order-summary">
                  <CardHeader className="pb-3 cursor-pointer hover:bg-gray-50/50 transition-colors rounded-t-2xl" onClick={() => setExpandedPricing(!expandedPricing)}>
                    <CardTitle className="flex items-center justify-between text-lg font-bold">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 rounded-xl">
                          <Sparkles className="h-5 w-5 text-green-600" />
                        </div>
                        <span>Pricing</span>
                      </div>
                      {expandedPricing ? (
                        <ChevronUp className="h-5 w-5 text-gray-500" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-gray-500" />
                      )}
                    </CardTitle>
                  </CardHeader>
                  {expandedPricing && (
                    <CardContent className="animate-fade-in-down">
                      <OrderSummary />
                    </CardContent>
                  )}
                  
                  {/* Total Due Today - Always Visible */}
                  <div className="px-6 pb-5">
                    <div className="p-4 bg-gradient-to-br from-green-50 via-emerald-50 to-green-100 rounded-2xl border-2 border-dashed border-green-400 relative overflow-hidden">
                      {/* Animated background on price change */}
                      <div className="absolute inset-0 bg-green-200/30 animate-pulse-price opacity-0" />
                      
                      <div className="relative flex items-center justify-between">
                        <div>
                          <p className="text-sm font-bold text-gray-700 uppercase tracking-wide">Total Due Today</p>
                          <p className="text-xs text-gray-600 mt-0.5">No payment required — billing starts after activation</p>
                        </div>
                        <div className="text-right">
                          <p className="text-3xl font-black text-green-700 tabular-nums">
                            R{totalAmount.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            </div>

            {/* Right Column - Payment Options */}
            <div className="lg:col-span-7 order-1 lg:order-2">
              <Card className="rounded-2xl shadow-2xl border-2 border-gray-200 animate-slide-up" style={{animationDelay: '400ms'}}>
          <CardHeader className="pb-6 space-y-4">
            {/* Personable Message */}
            <div className="text-center pb-2">
              <h2 className="text-2xl lg:text-3xl font-black text-gray-900 mb-2">
                You're almost there — let's secure your connection!
              </h2>
              <p className="text-base text-gray-600">
                Choose your preferred payment method below
              </p>
            </div>
            
            {/* Trust Badge */}
            <div className="flex justify-center">
              <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-full border-2 border-green-300 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105 group">
                <div className="relative">
                  <Shield className="h-6 w-6 text-green-600 group-hover:text-green-700 transition-colors" />
                  <div className="absolute inset-0 bg-green-400 rounded-full blur-sm opacity-0 group-hover:opacity-30 animate-pulse-green transition-opacity" />
                </div>
                <span className="font-bold text-green-800 text-sm uppercase tracking-wide">
                  PCI-SSL / Trusted & Secure
                </span>
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Payment Methods Grid */}
            <div className="space-y-4">
              <h3 className="text-xl font-black text-gray-900 flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-circleTel-orange" />
                Choose Your Payment Method
              </h3>
              
              {/* Payment Options Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Credit/Debit Cards */}
                <div className="relative border-3 border-gray-200 rounded-2xl p-5 hover:border-circleTel-orange hover:bg-gradient-to-br hover:from-orange-50 hover:to-orange-100/30 transition-all duration-300 cursor-pointer group hover:shadow-xl hover:scale-105 animate-payment-card" style={{animationDelay: '100ms'}}>
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="p-1 bg-green-100 rounded-full">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-gradient-to-br from-orange-100 to-orange-200 rounded-2xl group-hover:from-circleTel-orange group-hover:to-orange-600 group-hover:scale-110 transition-all duration-300 shadow-md">
                      <CreditCard className="h-6 w-6 text-circleTel-orange group-hover:text-white transition-colors" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-black text-base text-gray-900 mb-1 group-hover:text-circleTel-orange transition-colors">Credit & Debit</h4>
                      <p className="text-xs text-gray-600 mb-3 font-medium">Visa, Mastercard & more</p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="relative h-6 w-auto grayscale group-hover:grayscale-0 transition-all">
                          <Image src="/images/payment-logos/logo_mastercard-h.png" alt="Mastercard" width={40} height={24} className="object-contain" />
                        </div>
                        <div className="flex gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                          <div className="relative h-5 w-auto">
                            <Image src="/images/payment-logos/verified-by-visa.png" alt="Verified by Visa" width={35} height={20} className="object-contain" />
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
                <div className="relative border-3 border-gray-200 rounded-2xl p-5 hover:border-green-400 hover:bg-gradient-to-br hover:from-green-50 hover:to-emerald-100/30 transition-all duration-300 cursor-pointer group hover:shadow-xl hover:scale-105 animate-payment-card" style={{animationDelay: '200ms'}}>
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="p-1 bg-green-100 rounded-full animate-bounce-subtle">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-gradient-to-br from-green-100 to-green-200 rounded-2xl group-hover:from-green-500 group-hover:to-emerald-600 group-hover:scale-110 transition-all duration-300 shadow-md">
                      <Smartphone className="h-6 w-6 text-green-600 group-hover:text-white transition-colors" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-black text-base text-gray-900 mb-1 group-hover:text-green-600 transition-colors">Instant EFT</h4>
                      <p className="text-xs text-gray-600 mb-3 font-medium">Real-time confirmation</p>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs bg-green-100 text-green-800 border-green-300 font-bold shadow-sm">
                          Instant
                        </Badge>
                        <div className="relative h-5 w-auto opacity-60 group-hover:opacity-100 transition-opacity">
                          <Image src="/images/payment-logos/logo_instant-eft.png" alt="Instant EFT" width={50} height={20} className="object-contain" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bank EFT */}
                <div className="relative border-3 border-gray-200 rounded-2xl p-5 hover:border-blue-400 hover:bg-gradient-to-br hover:from-blue-50 hover:to-blue-100/30 transition-all duration-300 cursor-pointer group hover:shadow-xl hover:scale-105 animate-payment-card" style={{animationDelay: '300ms'}}>
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="p-1 bg-blue-100 rounded-full">
                      <CheckCircle className="h-4 w-4 text-blue-600" />
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl group-hover:from-blue-500 group-hover:to-blue-600 group-hover:scale-110 transition-all duration-300 shadow-md">
                      <Building2 className="h-6 w-6 text-blue-600 group-hover:text-white transition-colors" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-black text-base text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">Bank Transfer</h4>
                      <p className="text-xs text-gray-600 mb-3 font-medium">Upload proof of payment</p>
                      <div className="relative h-6 w-auto opacity-60 group-hover:opacity-100 transition-opacity">
                        <Image src="/images/payment-logos/logo_bank-eft-h.png" alt="Bank EFT" width={60} height={24} className="object-contain" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Scan to Pay */}
                <div className="relative border-3 border-gray-200 rounded-2xl p-5 hover:border-purple-400 hover:bg-gradient-to-br hover:from-purple-50 hover:to-purple-100/30 transition-all duration-300 cursor-pointer group hover:shadow-xl hover:scale-105 animate-payment-card" style={{animationDelay: '400ms'}}>
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="p-1 bg-purple-100 rounded-full">
                      <CheckCircle className="h-4 w-4 text-purple-600" />
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-gradient-to-br from-purple-100 to-purple-200 rounded-2xl group-hover:from-purple-500 group-hover:to-purple-600 group-hover:scale-110 transition-all duration-300 shadow-md">
                      <Smartphone className="h-6 w-6 text-purple-600 group-hover:text-white transition-colors" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-black text-base text-gray-900 mb-1 group-hover:text-purple-600 transition-colors">Scan to Pay</h4>
                      <p className="text-xs text-gray-600 mb-3 font-medium">QR code & mobile wallets</p>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-800 border-purple-300 font-bold shadow-sm">
                          Mobile
                        </Badge>
                        <div className="relative h-5 w-auto opacity-60 group-hover:opacity-100 transition-opacity">
                          <Image src="/images/payment-logos/logo_scan-to-pay.png" alt="Scan to Pay" width={50} height={20} className="object-contain" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Powered by Netcash */}
              <div className="flex items-center justify-center gap-3 py-4 bg-gradient-to-r from-gray-50 via-white to-gray-50 rounded-2xl border border-gray-200 shadow-sm">
                <span className="text-xs text-gray-600 font-semibold">Secured by</span>
                <div className="relative h-7 w-auto">
                  <Image src="/images/payment-logos/logo_netcash-43.png" alt="Netcash" width={90} height={28} className="object-contain" />
                </div>
                <Lock className="h-4 w-4 text-gray-500" />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-8 pb-2">
              {onBack && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onBack}
                  disabled={isProcessing}
                  className="sm:w-36 h-12 rounded-xl border-2 font-bold hover:bg-gray-50 transition-all"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              )}

              <Button
                onClick={handlePayment}
                disabled={isProcessing}
                className="flex-1 bg-gradient-to-r from-circleTel-orange to-orange-600 hover:from-orange-600 hover:to-circleTel-orange h-14 text-lg font-black rounded-2xl shadow-2xl hover:shadow-3xl hover:scale-105 transition-all duration-300 relative overflow-hidden group"
              >
                {/* Animated shine effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                
                {isProcessing ? (
                  <>
                    <Loader2 className="h-6 w-6 mr-2 animate-spin" />
                    Processing Payment...
                  </>
                ) : (
                  <>
                    <Shield className="h-6 w-6 mr-2" />
                    Complete Secure Payment
                  </>
                )}
              </Button>
            </div>

            {/* Terms Notice with Contextual Helper */}
            <div className="pt-4 space-y-3">
              <p className="text-xs text-center text-gray-600">
                By proceeding, you agree to{' '}
                <a href="/terms" className="text-circleTel-orange hover:underline font-bold transition-colors">
                  Terms & Conditions
                </a>{' '}
                and{' '}
                <a href="/privacy" className="text-circleTel-orange hover:underline font-bold transition-colors">
                  Privacy Policy
                </a>
              </p>
              
              {/* Contextual hint */}
              <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-xl border border-blue-200">
                <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-blue-900 leading-relaxed">
                  <strong>Secure checkout:</strong> You'll be redirected to Netcash's payment gateway. All payments are encrypted and PCI-DSS compliant.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
            </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Custom CSS Animations */}
      <style jsx>{`
        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fade-in-down {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes payment-card {
          from {
            opacity: 0;
            transform: translateY(15px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        
        @keyframes pulse-green {
          0%, 100% {
            opacity: 0.3;
          }
          50% {
            opacity: 0.6;
          }
        }
        
        @keyframes pulse-price {
          0%, 100% {
            opacity: 0;
          }
          50% {
            opacity: 0.5;
          }
        }
        
        @keyframes bounce-subtle {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-3px);
          }
        }
        
        .animate-slide-up {
          animation: slide-up 0.6s ease-out forwards;
          opacity: 0;
        }
        
        .animate-fade-in-down {
          animation: fade-in-down 0.3s ease-out forwards;
        }
        
        .animate-payment-card {
          animation: payment-card 0.5s ease-out forwards;
          opacity: 0;
        }
        
        .animate-pulse-green {
          animation: pulse-green 2s ease-in-out infinite;
        }
        
        .animate-pulse-price {
          animation: pulse-price 0.8s ease-in-out;
        }
        
        .animate-bounce-subtle {
          animation: bounce-subtle 1s ease-in-out infinite;
        }
        
        .border-3 {
          border-width: 3px;
        }
        
        .shadow-3xl {
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        }
      `}</style>
    </div>
  );
}
