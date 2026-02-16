'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useCustomerAuth } from '@/components/providers/CustomerAuthProvider';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Loader2, LogIn, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

/**
 * Payment Callback Page
 *
 * This page handles the return from external payment gateways (NetCash).
 * It does NOT require authentication, allowing it to work even if the session
 * was lost during the external redirect.
 */
export default function PaymentCallbackPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, session, loading } = useCustomerAuth();

  const [redirectCountdown, setRedirectCountdown] = useState(5);
  const [shouldAutoRedirect, setShouldAutoRedirect] = useState(false);

  // Extract payment status from URL params
  const paymentMethod = searchParams.get('payment_method');
  const reason = searchParams.get('reason');
  const reference = searchParams.get('ref');

  const isSuccess = paymentMethod === 'success';
  const isCancelled = paymentMethod === 'cancelled';
  const isError = paymentMethod === 'error';

  // Check if user is authenticated after auth provider loads
  useEffect(() => {
    if (!loading && (user || session)) {
      setShouldAutoRedirect(true);
    }
  }, [loading, user, session]);

  // Auto-redirect countdown for authenticated users
  useEffect(() => {
    if (!shouldAutoRedirect) return;

    if (redirectCountdown > 0) {
      const timer = setTimeout(() => {
        setRedirectCountdown(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      // Redirect to billing page
      router.push('/dashboard/billing');
    }
  }, [shouldAutoRedirect, redirectCountdown, router]);

  // Handle manual navigation
  const handleGoToBilling = () => {
    if (user || session) {
      router.push('/dashboard/billing');
    } else {
      router.push('/auth/login?redirect=/dashboard/billing');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-circleTel-lightNeutral via-white to-circleTel-lightNeutral flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/">
            <Image
              src="/images/circletel-logo.svg"
              alt="CircleTel"
              width={180}
              height={45}
              className="mx-auto"
              priority
            />
          </Link>
        </div>

        <Card className="shadow-lg">
          <CardContent className="p-8 text-center">
            {/* Status Icon */}
            {isSuccess ? (
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-12 h-12 text-green-600" />
              </div>
            ) : isCancelled ? (
              <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <XCircle className="w-12 h-12 text-amber-600" />
              </div>
            ) : isError ? (
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <XCircle className="w-12 h-12 text-red-600" />
              </div>
            ) : (
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Loader2 className="w-12 h-12 text-gray-400 animate-spin" />
              </div>
            )}

            {/* Status Message */}
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {isSuccess && 'Payment Method Added!'}
              {isCancelled && 'Payment Cancelled'}
              {isError && 'Payment Error'}
              {!paymentMethod && 'Processing...'}
            </h1>

            <p className="text-gray-600 mb-6">
              {isSuccess && 'Your card has been successfully verified and added to your account.'}
              {isCancelled && (reason || 'The payment process was cancelled. You can try again anytime.')}
              {isError && 'There was an error processing your payment. Please try again.'}
              {!paymentMethod && 'Please wait while we process your payment...'}
            </p>

            {/* Reference Number (if available) */}
            {reference && (
              <div className="bg-gray-50 rounded-lg p-3 mb-6">
                <p className="text-xs text-gray-500 mb-1">Reference</p>
                <p className="text-sm font-mono text-gray-700">{reference}</p>
              </div>
            )}

            {/* Auth Status and Navigation */}
            {loading ? (
              <div className="flex items-center justify-center gap-2 text-gray-500">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Checking session...</span>
              </div>
            ) : (user || session) ? (
              <>
                {/* Authenticated - show auto-redirect countdown */}
                <div className="mb-4 text-sm text-gray-500">
                  Redirecting to billing in {redirectCountdown}s...
                </div>
                <Button
                  onClick={handleGoToBilling}
                  className="w-full bg-circleTel-orange hover:bg-circleTel-orange/90"
                >
                  Go to Billing Now
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </>
            ) : (
              <>
                {/* Not authenticated - show login prompt */}
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                  <p className="text-sm text-amber-800">
                    Your session has expired. Please log in again to view your billing details.
                  </p>
                </div>
                <Button
                  onClick={handleGoToBilling}
                  className="w-full bg-circleTel-orange hover:bg-circleTel-orange/90"
                >
                  <LogIn className="w-4 h-4 mr-2" />
                  Log In to Continue
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* Help Text */}
        <p className="text-center text-sm text-gray-500 mt-6">
          Need help?{' '}
          <a href="https://wa.me/27824873900" className="text-circleTel-orange hover:underline">
            WhatsApp 082 487 3900
          </a>
        </p>
      </div>
    </div>
  );
}
