'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter, useSearchParams } from 'next/navigation';

function ConfirmationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Get payment reference from URL query params (returned by Netcash)
  const paymentReference = searchParams.get('Reference') || searchParams.get('reference');
  const transactionId = searchParams.get('TransactionId') || searchParams.get('transactionId');

  useEffect(() => {
    // Simulate fetching order details
    // In production, you would fetch from your API using the payment reference
    if (paymentReference) {
      setTimeout(() => {
        setOrderDetails({
          reference: paymentReference,
          transactionId: transactionId
        });
        setLoading(false);
      }, 1000);
    } else {
      setLoading(false);
    }
  }, [paymentReference, transactionId]);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <Loader2 className="w-16 h-16 text-circleTel-orange mx-auto mb-4 animate-spin" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Processing Your Order...
          </h1>
          <p className="text-gray-600">
            Please wait while we confirm your payment
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
        <div className="mb-6">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Payment Successful!
          </h1>
          <p className="text-lg text-gray-600">
            Thank you for choosing CircleTel. Your payment has been confirmed.
          </p>
          {orderDetails && (
            <div className="mt-4 text-sm text-gray-500">
              <p>Payment Reference: <span className="font-mono font-semibold">{orderDetails.reference}</span></p>
              {orderDetails.transactionId && (
                <p className="mt-1">Transaction ID: <span className="font-mono">{orderDetails.transactionId}</span></p>
              )}
            </div>
          )}
        </div>

        <div className="bg-gray-50 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            What happens next?
          </h2>
          <div className="text-left space-y-3">
            <div className="flex items-start space-x-3">
              <span className="flex-shrink-0 w-6 h-6 bg-circleTel-orange text-white text-sm font-bold rounded-full flex items-center justify-center">1</span>
              <p className="text-gray-700">You'll receive an order confirmation email shortly</p>
            </div>
            <div className="flex items-start space-x-3">
              <span className="flex-shrink-0 w-6 h-6 bg-circleTel-orange text-white text-sm font-bold rounded-full flex items-center justify-center">2</span>
              <p className="text-gray-700">Our team will contact you within 24 hours to coordinate installation</p>
            </div>
            <div className="flex items-start space-x-3">
              <span className="flex-shrink-0 w-6 h-6 bg-circleTel-orange text-white text-sm font-bold rounded-full flex items-center justify-center">3</span>
              <p className="text-gray-700">Professional installation will be scheduled at your preferred time</p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <Button
            onClick={() => router.push('/')}
            className="w-full bg-circleTel-orange hover:bg-circleTel-orange/90"
          >
            Return to Homepage
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push('/order/coverage')}
            className="w-full"
          >
            Place Another Order
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function ConfirmationPage() {
  return (
    <Suspense fallback={
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <Loader2 className="w-16 h-16 text-circleTel-orange mx-auto mb-4 animate-spin" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Loading...
          </h1>
        </div>
      </div>
    }>
      <ConfirmationContent />
    </Suspense>
  );
}