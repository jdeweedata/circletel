'use client';

import { useState } from 'react';
import { PiEnvelopeBold, PiXBold, PiCheckCircleBold } from 'react-icons/pi';
import { useCustomerAuth } from '@/components/providers/CustomerAuthProvider';

/**
 * P9: Dismissible banner shown to email-signup users whose email is not yet verified.
 * Renders nothing if the user is verified, is a phone-signup user, or is not authenticated.
 */
export function EmailVerificationBanner() {
  const { user, isEmailVerified, resendVerification } = useCustomerAuth();
  const [dismissed, setDismissed] = useState(false);
  const [resendStatus, setResendStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  // Only show for authenticated email-signup users who haven't verified yet
  if (!user || isEmailVerified || dismissed) return null;

  // Phone-signup users have a phantom @phone.circletel.co.za email — don't show the banner
  const isPhoneSignup = user.email?.endsWith('@phone.circletel.co.za');
  if (isPhoneSignup) return null;

  const handleResend = async () => {
    if (!user.email) return;
    setResendStatus('sending');
    const result = await resendVerification(user.email);
    setResendStatus(result.success ? 'sent' : 'error');
  };

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
      <PiEnvelopeBold className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-amber-900">Please verify your email address</p>
        <p className="text-xs text-amber-700 mt-0.5">
          Verify <span className="font-medium">{user.email}</span> to manage your account and view order history.
        </p>
        <div className="mt-2">
          {resendStatus === 'sent' ? (
            <span className="inline-flex items-center gap-1 text-xs text-green-700 font-medium">
              <PiCheckCircleBold className="w-3.5 h-3.5" />
              Verification email sent — check your inbox.
            </span>
          ) : resendStatus === 'error' ? (
            <span className="text-xs text-red-600">Failed to send. Please try again later.</span>
          ) : (
            <button
              type="button"
              onClick={handleResend}
              disabled={resendStatus === 'sending'}
              className="text-xs font-semibold text-amber-800 underline hover:text-amber-900 disabled:opacity-50"
            >
              {resendStatus === 'sending' ? 'Sending…' : 'Resend verification email'}
            </button>
          )}
        </div>
      </div>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label="Dismiss"
        className="text-amber-500 hover:text-amber-700 flex-shrink-0 p-0.5"
      >
        <PiXBold className="w-4 h-4" />
      </button>
    </div>
  );
}
