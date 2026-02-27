'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { CheckCircle2, XCircle, Loader2, MessageSquare } from 'lucide-react';
import Link from 'next/link';

// =============================================================================
// TYPES
// =============================================================================

interface TokenValidation {
  valid: boolean;
  customerName?: string;
  phone?: string;
  expiresAt?: string;
  error?: string;
  alreadyOptedIn?: boolean;
}

interface ConfirmResult {
  success: boolean;
  message?: string;
  error?: string;
  customerName?: string;
}

// =============================================================================
// OPT-IN PAGE
// =============================================================================

export default function WhatsAppOptInPage() {
  const params = useParams();
  const token = params.token as string;

  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [validation, setValidation] = useState<TokenValidation | null>(null);
  const [confirmResult, setConfirmResult] = useState<ConfirmResult | null>(null);

  // Validate token on mount
  useEffect(() => {
    async function validateToken() {
      try {
        const response = await fetch(`/api/whatsapp/optin?token=${token}`);
        const data = await response.json();
        setValidation(data);
      } catch (error) {
        setValidation({
          valid: false,
          error: 'Failed to validate token. Please try again.',
        });
      } finally {
        setLoading(false);
      }
    }

    if (token) {
      validateToken();
    }
  }, [token]);

  // Handle confirmation
  const handleConfirm = async () => {
    setConfirming(true);

    try {
      const response = await fetch('/api/whatsapp/optin/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();

      if (response.ok) {
        setConfirmResult({
          success: true,
          message: data.message,
          customerName: data.customerName,
        });
      } else {
        setConfirmResult({
          success: false,
          error: data.error || 'Failed to confirm opt-in',
        });
      }
    } catch (error) {
      setConfirmResult({
        success: false,
        error: 'Network error. Please try again.',
      });
    } finally {
      setConfirming(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-circleTel-orange mx-auto mb-4" />
          <p className="text-gray-600">Validating...</p>
        </div>
      </div>
    );
  }

  // Success state (after confirmation)
  if (confirmResult?.success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            You're All Set!
          </h1>

          <p className="text-gray-600 mb-6">
            Hi {confirmResult.customerName}, you'll now receive payment reminders via WhatsApp.
            No more missed payments!
          </p>

          <div className="space-y-3">
            <Link
              href="/dashboard"
              className="block w-full bg-circleTel-orange text-white font-semibold py-3 px-6 rounded-lg hover:bg-orange-600 transition-colors"
            >
              Go to Dashboard
            </Link>

            <Link
              href="/"
              className="block w-full text-gray-600 font-medium py-3 px-6 hover:text-gray-900 transition-colors"
            >
              Return Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Error states
  if (!validation?.valid) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <XCircle className="w-10 h-10 text-red-600" />
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {validation?.alreadyOptedIn ? 'Already Opted In' : 'Link Invalid'}
          </h1>

          <p className="text-gray-600 mb-6">
            {validation?.alreadyOptedIn
              ? "You've already opted in to WhatsApp notifications. You're all set!"
              : validation?.error || 'This link is invalid or has expired. Please request a new one.'}
          </p>

          <div className="space-y-3">
            {validation?.alreadyOptedIn ? (
              <Link
                href="/dashboard"
                className="block w-full bg-circleTel-orange text-white font-semibold py-3 px-6 rounded-lg hover:bg-orange-600 transition-colors"
              >
                Go to Dashboard
              </Link>
            ) : (
              <Link
                href="/contact"
                className="block w-full bg-gray-100 text-gray-700 font-semibold py-3 px-6 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Contact Support
              </Link>
            )}

            <Link
              href="/"
              className="block w-full text-gray-600 font-medium py-3 px-6 hover:text-gray-900 transition-colors"
            >
              Return Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Confirmation error (after failed attempt)
  if (confirmResult && !confirmResult.success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <XCircle className="w-10 h-10 text-red-600" />
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Something Went Wrong
          </h1>

          <p className="text-gray-600 mb-6">
            {confirmResult.error}
          </p>

          <button
            onClick={() => {
              setConfirmResult(null);
              handleConfirm();
            }}
            className="w-full bg-circleTel-orange text-white font-semibold py-3 px-6 rounded-lg hover:bg-orange-600 transition-colors mb-3"
          >
            Try Again
          </button>

          <Link
            href="/contact"
            className="block w-full text-gray-600 font-medium py-3 px-6 hover:text-gray-900 transition-colors"
          >
            Contact Support
          </Link>
        </div>
      </div>
    );
  }

  // Valid token - show confirmation form
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-circleTel-orange to-orange-500 p-6 text-center">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <MessageSquare className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">
            WhatsApp Notifications
          </h1>
          <p className="text-white/90 mt-1">
            Never miss a payment
          </p>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-600 mb-6 text-center">
            Hi <span className="font-semibold">{validation.customerName}</span>,
            enable WhatsApp notifications to receive:
          </p>

          <ul className="space-y-3 mb-6">
            <li className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
              <span className="text-gray-700">Invoice reminders before due date</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
              <span className="text-gray-700">Easy Pay Now links for quick payments</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
              <span className="text-gray-700">Payment confirmations instantly</span>
            </li>
          </ul>

          {/* Phone number display */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-500 mb-1">
              Notifications will be sent to:
            </p>
            <p className="font-semibold text-gray-900">
              {validation.phone}
            </p>
          </div>

          {/* Consent text */}
          <p className="text-xs text-gray-500 mb-6 text-center">
            By clicking "Enable WhatsApp", you consent to receive payment-related
            notifications from CircleTel via WhatsApp. You can opt out at any time
            from your account settings.
          </p>

          {/* Confirm button */}
          <button
            onClick={handleConfirm}
            disabled={confirming}
            className="w-full bg-circleTel-orange text-white font-semibold py-3 px-6 rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {confirming ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Enabling...
              </>
            ) : (
              <>
                <MessageSquare className="w-5 h-5" />
                Enable WhatsApp
              </>
            )}
          </button>

          {/* Cancel link */}
          <p className="text-center mt-4">
            <Link
              href="/"
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              No thanks, maybe later
            </Link>
          </p>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 text-center border-t">
          <p className="text-xs text-gray-500">
            CircleTel respects your privacy.{' '}
            <Link href="/privacy" className="text-circleTel-orange hover:underline">
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
