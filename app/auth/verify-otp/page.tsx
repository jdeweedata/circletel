'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, Shield, ArrowLeft } from 'lucide-react';
import { useCustomerAuth } from '@/components/providers/CustomerAuthProvider';
import Link from 'next/link';

export default function VerifyOTPLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signInWithOtp } = useCustomerAuth();
  const phone = searchParams.get('phone') || '';
  const redirectPath = searchParams.get('redirect') || '/dashboard';

  const [otp, setOtp] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);

  // Countdown timer for resend
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [countdown]);

  // Redirect if no phone number
  useEffect(() => {
    if (!phone) {
      toast.error('Phone number is required');
      router.push('/auth/login');
    }
  }, [phone, router]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();

    if (otp.length !== 6) {
      toast.error('Please enter a valid 6-digit code');
      return;
    }

    setIsVerifying(true);

    try {
      const response = await fetch('/api/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, otp }),
      });

      const result = await response.json();

      if (result.success) {
        // If OTP is valid, sign in the user
        if (signInWithOtp) {
          const signInResult = await signInWithOtp(phone, otp);

          if (signInResult.error) {
            toast.error(signInResult.error);
            setIsVerifying(false);
            return;
          }
        }

        toast.success('Successfully signed in!');
        // Redirect to intended page or dashboard
        router.push(redirectPath);
      } else {
        toast.error(result.error || 'Invalid verification code');
      }
    } catch (error) {
      console.error('Error verifying OTP:', error);
      toast.error('Failed to verify code. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (isResending || !canResend) return; // Prevent duplicate requests

    setIsResending(true);
    setCanResend(false); // Immediately disable to prevent double-clicks

    try {
      const response = await fetch('/api/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('New verification code sent!');
        setCountdown(60);
      } else {
        // If rate limited, show how long to wait
        if (response.status === 429 && result.retryAfter) {
          toast.error(`Please wait ${result.retryAfter} seconds before requesting a new code`);
          setCountdown(result.retryAfter);
        } else {
          toast.error(result.error || 'Failed to resend code');
          // Re-enable resend button on error (but not rate limit)
          if (response.status !== 429) {
            setCanResend(true);
          }
        }
      }
    } catch (error) {
      console.error('Error resending OTP:', error);
      toast.error('Failed to resend code. Please try again.');
      setCanResend(true); // Re-enable on network error
    } finally {
      setIsResending(false);
    }
  };

  const maskPhone = (phoneNumber: string) => {
    if (!phoneNumber) return '';
    const cleaned = phoneNumber.replace(/\D/g, '');
    if (cleaned.length < 4) return phoneNumber;
    const lastFour = cleaned.slice(-4);
    const masked = '*'.repeat(cleaned.length - 4);
    return `${masked}${lastFour}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        <div className="max-w-7xl mx-auto">
          {/* Minimal Card Container */}
          <div className="w-full max-w-md mx-auto">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sm:p-8">
              {/* Icon */}
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                  <Shield className="w-8 h-8 text-[#F5831F]" />
                </div>
              </div>

              {/* Heading */}
              <div className="mb-6 text-center">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                  Verify your phone
                </h1>
                <p className="text-sm sm:text-base text-gray-600">
                  We've sent a 6-digit code to{' '}
                  <span className="font-semibold">{maskPhone(phone)}</span>
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleVerify} className="space-y-4">
                {/* OTP Input */}
                <div className="space-y-2">
                  <Label htmlFor="otp" className="text-sm sm:text-base font-semibold text-gray-700">
                    Verification Code <span className="text-red-600">*</span>
                  </Label>
                  <Input
                    id="otp"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="000000"
                    className="w-full text-center text-2xl tracking-widest font-mono"
                    required
                  />
                  <p className="text-xs text-gray-500 text-center">
                    Enter the 6-digit code from your SMS
                  </p>
                </div>

                {/* Verify Button */}
                <button
                  type="submit"
                  disabled={isVerifying || otp.length !== 6}
                  className="w-full bg-[#F5831F] hover:bg-[#E67510] text-white font-bold text-sm sm:text-base py-3 rounded-md transition-all duration-200 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                >
                  {isVerifying ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <Shield className="w-5 h-5" />
                      Verify & Sign In
                    </>
                  )}
                </button>
              </form>

              {/* Resend Section */}
              <div className="mt-6 text-center">
                {canResend ? (
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={isResending}
                    className="text-sm text-[#F5831F] hover:underline font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isResending ? 'Sending...' : 'Resend code'}
                  </button>
                ) : (
                  <p className="text-sm text-gray-600">
                    Resend code in{' '}
                    <span className="font-semibold text-[#F5831F]">{countdown}s</span>
                  </p>
                )}
              </div>

              {/* Back Link */}
              <div className="text-center text-sm sm:text-base text-gray-600 mt-4">
                <Link
                  href="/auth/login"
                  className="inline-flex items-center gap-1 text-gray-600 hover:text-gray-900 hover:underline transition-colors font-medium"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Sign In
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
