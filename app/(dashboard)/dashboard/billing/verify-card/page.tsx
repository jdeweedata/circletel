'use client';

/**
 * Card Verification Page
 *
 * Allows customers to add or update their credit card for recurring payments.
 * Uses NetCash PCI Vault for secure card tokenization.
 */

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CreditCard, Shield, CheckCircle2, AlertCircle, Loader2, ArrowLeft } from 'lucide-react';

export default function VerifyCardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Check for success/error in URL params (from callback redirect)
  useEffect(() => {
    const successParam = searchParams.get('success');
    const errorParam = searchParams.get('error');
    const messageParam = searchParams.get('message');
    const cardParam = searchParams.get('card');

    if (successParam === 'card_added') {
      setSuccess(true);
    }

    if (errorParam) {
      switch (errorParam) {
        case 'tokenization_failed':
          setError(messageParam || 'Card verification failed. Please try again.');
          break;
        case 'storage_failed':
          setError('Failed to save card details. Please try again.');
          break;
        case 'gateway_not_configured':
          setError('Payment gateway is not available. Please contact support.');
          break;
        case 'customer_not_found':
          setError('Customer account not found. Please contact support.');
          break;
        default:
          setError('An error occurred. Please try again.');
      }
    }
  }, [searchParams]);

  const handleVerifyCard = () => {
    setIsLoading(true);
    setError(null);

    // Redirect to tokenization endpoint
    window.location.href = '/api/payments/tokenize?source=reverify&return=/dashboard/billing/verify-card';
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-lg mx-auto px-4">
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Card Added Successfully</h1>
            <p className="text-gray-600 mb-6">
              Your card has been securely saved for recurring payments.
              Future invoices will be automatically charged to this card.
            </p>
            <div className="space-y-3">
              <Link
                href="/dashboard/billing"
                className="block w-full py-3 px-4 bg-circleTel-orange text-white font-semibold rounded-lg hover:bg-orange-600 transition-colors"
              >
                View Billing Dashboard
              </Link>
              <Link
                href="/dashboard"
                className="block w-full py-3 px-4 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition-colors"
              >
                Go to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-lg mx-auto px-4">
        {/* Back link */}
        <Link
          href="/dashboard/billing"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Billing</span>
        </Link>

        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-circleTel-orange to-orange-600 px-6 py-8 text-white">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
                <CreditCard className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Add Payment Card</h1>
                <p className="text-white/80">Secure card verification for recurring payments</p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-red-800">Verification Failed</p>
                  <p className="text-sm text-red-600 mt-1">{error}</p>
                </div>
              </div>
            )}

            {/* Security info */}
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-blue-800">Secure Payment</p>
                  <p className="text-sm text-blue-600 mt-1">
                    Your card details are securely processed by NetCash PCI-DSS compliant
                    payment gateway. CircleTel never stores your full card number.
                  </p>
                </div>
              </div>
            </div>

            {/* Benefits */}
            <div className="mb-6 space-y-3">
              <h3 className="font-semibold text-gray-900">Benefits of Card Payment</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span>Automatic payment on due date - no missed payments</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span>Earn credit card rewards on your bills</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span>Easy to update or change your card anytime</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span>Instant confirmation of payment</span>
                </li>
              </ul>
            </div>

            {/* Accepted cards */}
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-3">Accepted Cards</h3>
              <div className="flex items-center gap-4">
                <div className="bg-gray-100 px-4 py-2 rounded-lg">
                  <span className="font-bold text-blue-700">VISA</span>
                </div>
                <div className="bg-gray-100 px-4 py-2 rounded-lg">
                  <span className="font-bold text-orange-600">Mastercard</span>
                </div>
              </div>
            </div>

            {/* Action button */}
            <button
              onClick={handleVerifyCard}
              disabled={isLoading}
              className="w-full py-4 px-6 bg-circleTel-orange text-white font-bold rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Redirecting to Secure Payment...</span>
                </>
              ) : (
                <>
                  <CreditCard className="w-5 h-5" />
                  <span>Add Credit/Debit Card</span>
                </>
              )}
            </button>

            <p className="mt-4 text-xs text-center text-gray-500">
              You will be redirected to NetCash secure payment page to enter your card details.
            </p>
          </div>
        </div>

        {/* Help */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>
            Need help? Contact us at{' '}
            <a href="tel:0860247253" className="text-circleTel-orange hover:underline">
              0860 247 253
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
