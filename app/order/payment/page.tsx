'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useOrderContext } from '@/components/order/context/OrderContext';
import { TopProgressBar } from '@/components/order/TopProgressBar';
import { PackageSummary } from '@/components/order/PackageSummary';
import { toast } from 'sonner';
import {
  CreditCard,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Shield,
  Lock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import Image from 'next/image';
import {
  saveOrderData,
  recordPaymentAttempt,
  saveOrderId,
} from '@/lib/payment/payment-persistence';

export default function PaymentPage() {
  const router = useRouter();
  const { state, actions } = useOrderContext();

  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Extract order data from context
  const { coverage, package: packageData, account } = state.orderData;
  const selectedPackage = packageData?.selectedPackage;
  const pricing = packageData?.pricing;

  // Calculate totals
  const basePrice = pricing?.monthly || selectedPackage?.monthlyPrice || 0;
  const installationFee = pricing?.onceOff || selectedPackage?.onceOffPrice || 0;
  const totalAmount = basePrice + installationFee;

  // Validation charge: R1.00 to verify payment method
  const VALIDATION_AMOUNT = 1.00;

  // Protect route - require complete order flow
  useEffect(() => {
    const hasPackageData = packageData?.selectedPackage;
    const hasAccountData = account?.email;
    const hasCoverageData = coverage?.address || coverage?.coordinates;
    
    // Check sessionStorage as backup
    const savedCoverage = typeof window !== 'undefined'
      ? sessionStorage.getItem('circletel_coverage_address')
      : null;
    
    if (!hasPackageData && !hasCoverageData && !savedCoverage) {
      // No valid order flow - redirect to home
      router.replace('/');
    }
  }, [packageData, account, coverage, router]);

  // Set current stage to 3 when this page loads
  useEffect(() => {
    if (state.currentStage !== 3) {
      actions.setCurrentStage(3);
    }
  }, [state.currentStage, actions]);

  const handlePayment = async () => {
    setIsProcessing(true);
    setError(null);

    try {
      console.log('Order Context State:', {
        account,
        selectedPackage,
        coverage,
      });

      // Validate essential account data
      if (!account?.email || !account?.phone) {
        console.error('Missing account data:', { account });
        toast.error('Missing customer information. Please complete the account creation step.');
        setIsProcessing(false);
        return;
      }

      // Generate names from email if not provided
      const emailUsername = account.email.split('@')[0];
      const firstName = account.firstName || emailUsername;
      const lastName = account.lastName || 'Customer';

      if (!selectedPackage?.name || !selectedPackage?.speed) {
        console.error('Missing package data:', { selectedPackage });
        toast.error('Missing package information. Please select a package.');
        setIsProcessing(false);
        return;
      }

      if (!coverage?.address) {
        console.error('Missing coverage data:', { coverage });
        toast.error('Missing installation address. Please complete the service address step.');
        setIsProcessing(false);
        return;
      }

      // Step 1: Create order in database
      const orderData = {
        // Customer information (snake_case for API)
        first_name: firstName,
        last_name: lastName,
        email: account.email,
        phone: account.phone,

        // Service details
        service_package_id: selectedPackage.id || null,
        package_name: selectedPackage.name,
        package_speed: selectedPackage.speed,
        package_price: basePrice, // Actual package price (for subscription billing)

        // Pricing
        installation_fee: installationFee,

        // Validation charge (R1.00 credited to client account)
        payment_amount: VALIDATION_AMOUNT,
        is_validation_charge: true,

        // Installation address
        installation_address: coverage.address,
        coordinates: coverage.coordinates || null,

        // Property info
        installation_location_type: account.installationLocationType || null,
        account_type: account.accountType || 'personal',
      };

      console.log('Sending order data:', orderData); // Debug log

      // Save order data for retry persistence
      saveOrderData({
        customerName: `${firstName} ${lastName}`.trim(),
        customerEmail: account.email,
        customerPhone: account.phone,
        packageId: selectedPackage?.id || '',
        packageName: selectedPackage?.name || '',
        serviceType: selectedPackage?.type || 'fibre',
        speed: selectedPackage?.speed || '',
        basePrice,
        installationFee,
        totalAmount,
        installationAddress: coverage?.address || '',
        coordinates: coverage?.coordinates,
        createdAt: new Date().toISOString(),
      });

      // Call order creation API
      const orderResponse = await fetch('/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      });

      const orderResult = await orderResponse.json();

      if (!orderResponse.ok || !orderResult.success) {
        console.error('Order creation failed:', orderResult);
        const errorMessage = orderResult.details
          ? `${orderResult.error}: ${orderResult.details}`
          : orderResult.error || 'Failed to create order';
        throw new Error(errorMessage);
      }

      // Handle existing order case - duplicate prevention
      if (orderResult.existing_order) {
        toast.info(`You already have a pending order (${orderResult.order.order_number}). Redirecting to your dashboard...`);
        router.push('/dashboard');
        return;
      }

      const { order } = orderResult;

      // Save order ID for tracking
      saveOrderId(order.id);

      // Step 2: Initiate Netcash payment
      // Note: Charging R1.00 for payment method validation only
      // The actual package fee will be billed separately via subscription
      const paymentResponse = await fetch('/api/payment/netcash/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order.id,
          amount: VALIDATION_AMOUNT, // R1.00 validation charge (credited to client account)
          customerEmail: account.email,
          customerName: `${firstName} ${lastName}`.trim(),
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

      // Mark step as complete
      actions.markStepComplete(3);

      // Small delay for user to see toast
      setTimeout(() => {
        window.location.href = paymentUrl;
      }, 1000);

    } catch (err) {
      console.error('Payment initiation error:', err);
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';

      // Record payment attempt
      recordPaymentAttempt('payment_failed', errorMessage);

      // Update state
      setError(errorMessage);
      setIsProcessing(false);

      toast.error('Payment initiation failed. Please try again.');
    }
  };

  const handleBack = () => {
    router.push('/order/service-address');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Progress Bar */}
      <TopProgressBar currentStep={3} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        {/* Header */}
        <div className="text-center mb-8 lg:mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-circleTel-orange/10 rounded-full mb-4">
            <CreditCard className="w-8 h-8 text-circleTel-orange" />
          </div>
          <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-3">
            Complete Your Payment
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            You're one step away from high-speed connectivity
          </p>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto">
          {/* Package Summary */}
          {selectedPackage && (
            <div className="mb-6">
              <PackageSummary package={selectedPackage} compact />
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 lg:p-8">
              {/* Security Badge */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-green-900 mb-1">
                      Secure Payment Processing
                    </p>
                    <p className="text-xs text-green-700">
                      Your payment is secured with PCI-DSS compliant encryption. All transactions are processed through NetCash's secure gateway.
                    </p>
                  </div>
                </div>
              </div>

              {/* Error Display */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-red-900 mb-1">
                        Payment Failed
                      </p>
                      <p className="text-xs text-red-700">
                        {error}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Order Summary */}
              <div className="mb-8">
                <Label className="text-base font-semibold text-gray-900 mb-4 block">
                  Order Summary
                </Label>
                <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                  {/* Package Details */}
                  <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                    <span className="text-sm text-gray-600">Monthly Subscription</span>
                    <span className="text-base font-semibold text-gray-900">R{basePrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                    <span className="text-sm text-gray-600">Installation Fee</span>
                    <span className="text-base font-semibold text-gray-900">
                      {installationFee > 0 ? `R${installationFee.toFixed(2)}` : 'FREE'}
                    </span>
                  </div>

                  {/* Validation Charge Notice */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 my-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-blue-900 mb-1">
                          Payment Method Validation
                        </p>
                        <p className="text-xs text-blue-700">
                          We'll charge <strong>R1.00</strong> to verify your payment method.
                          This amount will be <strong>credited to your account</strong> and can be used towards your service.
                          Your first monthly bill will be processed separately after service activation.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-2">
                    <span className="text-base font-bold text-gray-900">Charge Today (Validation)</span>
                    <span className="text-2xl font-bold text-circleTel-orange">R{VALIDATION_AMOUNT.toFixed(2)}</span>
                  </div>
                  <div className="pt-2">
                    <p className="text-xs text-gray-500">
                      * Package fee of R{basePrice.toFixed(2)}/month will be billed separately after service activation
                    </p>
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div className="mb-8">
                <Label className="text-base font-semibold text-gray-900 mb-4 block">
                  Payment Method
                </Label>

                {/* Credit/Debit Card Option */}
                <div className="border-2 border-circleTel-orange bg-circleTel-orange/5 rounded-lg p-6">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="p-3 bg-circleTel-orange rounded-lg">
                      <CreditCard className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-gray-900 mb-1">
                        Credit or Debit Card
                      </h3>
                      <p className="text-sm text-gray-600 mb-4">
                        Secure payment with Visa, Mastercard, and more
                      </p>

                      {/* Card Logos */}
                      <div className="flex items-center gap-3 flex-wrap">
                        <div className="relative h-8 w-auto">
                          <Image
                            src="/images/payment-logos/logo_mastercard-h.png"
                            alt="Mastercard"
                            width={50}
                            height={32}
                            className="object-contain"
                          />
                        </div>
                        <div className="flex gap-2">
                          <div className="relative h-6 w-auto">
                            <Image
                              src="/images/payment-logos/verified-by-visa.png"
                              alt="Verified by Visa"
                              width={40}
                              height={24}
                              className="object-contain"
                            />
                          </div>
                          <div className="relative h-6 w-auto">
                            <Image
                              src="/images/payment-logos/3d-secure.png"
                              alt="3D Secure"
                              width={40}
                              height={24}
                              className="object-contain"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      <div className="p-2 bg-green-100 rounded-full">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      </div>
                    </div>
                  </div>

                  {/* Info Banner */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-xs text-blue-900 leading-relaxed">
                      <strong>How it works:</strong> Clicking "Proceed to Payment" will redirect you to NetCash's secure payment gateway where you can complete your transaction safely.
                    </p>
                  </div>
                </div>
              </div>

              {/* Powered by NetCash */}
              <div className="flex items-center justify-center gap-3 py-4 bg-gray-50 rounded-lg mb-6">
                <span className="text-xs text-gray-600 font-semibold">Secured by</span>
                <div className="relative h-7 w-auto">
                  <Image
                    src="/images/payment-logos/logo_netcash-43.png"
                    alt="NetCash"
                    width={90}
                    height={28}
                    className="object-contain"
                  />
                </div>
                <Lock className="h-4 w-4 text-gray-500" />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t">
                <button
                  type="button"
                  onClick={handleBack}
                  disabled={isProcessing}
                  className="flex items-center justify-center gap-2 px-6 py-3 border-2 border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ArrowLeft className="w-5 h-5" />
                  Back
                </button>

                <button
                  type="button"
                  onClick={handlePayment}
                  disabled={isProcessing}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-circleTel-orange hover:bg-circleTel-orange/90 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      Proceed to Payment
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </div>

              {/* Terms Notice */}
              <div className="pt-4">
                <p className="text-xs text-center text-gray-600">
                  By proceeding, you agree to{' '}
                  <a href="/terms" className="text-circleTel-orange hover:underline font-medium">
                    Terms & Conditions
                  </a>{' '}
                  and{' '}
                  <a href="/privacy" className="text-circleTel-orange hover:underline font-medium">
                    Privacy Policy
                  </a>
                </p>
              </div>
            </div>
          </div>

          {/* Help Text */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Need help? Contact us at{' '}
              <a href="tel:0877772473" className="text-circleTel-orange hover:underline font-medium">
                087 777 2473
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
