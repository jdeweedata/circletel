'use client';

/**
 * Password Reset Confirmation Page
 *
 * This intermediate page protects against link preview bots (SafeLinks, Proofpoint, etc.)
 * consuming one-time password reset tokens before the user can click.
 *
 * Flow:
 * 1. Email link → /auth/confirm?token_hash=...&type=recovery
 * 2. /auth/confirm redirects here (without consuming token)
 * 3. User clicks "Reset Password" button
 * 4. Redirects to /auth/confirm?...&confirmed=true
 * 5. Token is verified and session is set
 * 6. User is redirected to /auth/reset-password
 */

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { KeyRound, Loader2, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

export default function ConfirmResetPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [hasParams, setHasParams] = useState(false);

  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type');
  const next = searchParams.get('next');

  useEffect(() => {
    // Check if we have the required parameters
    setHasParams(!!token_hash && type === 'recovery');
  }, [token_hash, type]);

  const handleConfirm = () => {
    setIsLoading(true);

    // Build the confirmation URL with the confirmed=true flag
    const confirmUrl = new URL('/auth/confirm', window.location.origin);
    confirmUrl.searchParams.set('token_hash', token_hash!);
    confirmUrl.searchParams.set('type', type!);
    confirmUrl.searchParams.set('confirmed', 'true');
    if (next) {
      confirmUrl.searchParams.set('next', next);
    }

    // Navigate to the confirm route which will now verify the token
    window.location.href = confirmUrl.toString();
  };

  // If no valid params, show error state
  if (!hasParams && typeof window !== 'undefined') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50/30 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-2xl border-0">
          <CardHeader className="text-center pb-6">
            <div className="flex flex-col items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center">
                <ShieldCheck className="h-8 w-8 text-red-600" />
              </div>
              <CardTitle className="text-2xl text-red-700">Invalid Link</CardTitle>
              <CardDescription className="text-base">
                This password reset link is invalid or has expired.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-center text-gray-600 text-sm">
              Please request a new password reset link.
            </p>
            <div className="flex justify-center">
              <Link href="/auth/forgot-password">
                <Button className="bg-circleTel-orange hover:bg-circleTel-orange/90">
                  Request New Link
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50/30 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl border-0">
        <CardHeader className="text-center pb-6">
          <div className="flex flex-col items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center">
              <KeyRound className="h-8 w-8 text-blue-600" />
            </div>
            <CardTitle className="text-2xl">Reset Your Password</CardTitle>
            <CardDescription className="text-base">
              Click the button below to continue with your password reset.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Security Notice:</strong> This extra step protects your account by ensuring
              only you can reset your password, not automated email scanners.
            </p>
          </div>

          <Button
            onClick={handleConfirm}
            disabled={isLoading}
            className="w-full h-12 bg-circleTel-orange hover:bg-circleTel-orange/90 text-white font-semibold text-base"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Verifying...
              </>
            ) : (
              <>
                <KeyRound className="mr-2 h-5 w-5" />
                Continue to Reset Password
              </>
            )}
          </Button>

          <p className="text-center text-gray-500 text-xs">
            If you did not request a password reset, you can safely ignore this page.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
