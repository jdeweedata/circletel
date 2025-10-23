'use client';

/**
 * Email Verification Page
 * Shown after customer creates account
 *
 * Flow:
 * 1. User signs up → Supabase sends verification email
 * 2. User lands here with instructions
 * 3. User clicks link in email → redirected to /auth/callback
 * 4. Callback verifies email → redirects to dashboard
 */

import React from 'react';
import { useRouter } from 'next/navigation';
import { useCustomerAuth } from '@/components/providers/CustomerAuthProvider';
import { OrderBreadcrumb } from '@/components/order/OrderBreadcrumb';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mail, CheckCircle2, RefreshCcw, ArrowRight, Inbox, Clock } from 'lucide-react';
import { toast } from 'sonner';

export default function VerifyEmailPage() {
  const router = useRouter();
  const { user, isEmailVerified, resendVerification } = useCustomerAuth();
  const [isResending, setIsResending] = React.useState(false);
  const [countdown, setCountdown] = React.useState(0);

  // Check if already verified
  React.useEffect(() => {
    if (isEmailVerified) {
      toast.success('Email verified! Redirecting to dashboard...');
      router.push('/my-account/dashboard');
    }
  }, [isEmailVerified, router]);

  // Countdown timer for resend button
  React.useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleResendEmail = async () => {
    if (!user?.email || countdown > 0) return;

    setIsResending(true);
    try {
      const { error } = await resendVerification(user.email);

      if (error) {
        toast.error(error);
        return;
      }

      toast.success('Verification email sent! Please check your inbox.');
      setCountdown(60); // 60 second cooldown
    } catch (error) {
      console.error('Failed to resend email:', error);
      toast.error('Failed to resend email. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  const handleContinueToDashboard = () => {
    router.push('/my-account/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/50 via-white to-indigo-50/30">
      {/* Breadcrumb Navigation */}
      <OrderBreadcrumb />

      {/* Main Content */}
      <div className="max-w-screen-md mx-auto px-4 sm:px-6 md:px-8 py-6 sm:py-8 md:py-12 lg:py-16">
        <Card className="border-0 shadow-2xl shadow-blue-200/50">
          <CardHeader className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white pb-10 pt-12 px-8">
            <div className="flex flex-col items-center text-center">
              <div className="h-20 w-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mb-6 animate-bounce">
                <Mail className="h-10 w-10 text-white" />
              </div>
              <CardTitle className="text-3xl font-bold mb-3">
                Check Your Email
              </CardTitle>
              <CardDescription className="text-blue-100 text-lg max-w-md">
                We've sent a verification link to <span className="font-semibold text-white">{user?.email}</span>
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="pt-8 pb-10 px-8 space-y-8">
            {/* Instructions */}
            <div className="space-y-6">
              <Alert className="border-blue-200 bg-blue-50/50">
                <Inbox className="h-5 w-5 text-blue-600" />
                <AlertDescription className="text-blue-900 text-base">
                  <span className="font-semibold">Next steps:</span> Click the verification link in your email to activate your account
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <h3 className="font-semibold text-circleTel-darkNeutral text-lg flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  What to do:
                </h3>
                <ol className="space-y-4 ml-2">
                  <li className="flex items-start gap-4">
                    <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-sm font-bold text-blue-700">
                      1
                    </div>
                    <div className="flex-1 pt-1">
                      <p className="font-semibold text-circleTel-darkNeutral">Open your email inbox</p>
                      <p className="text-sm text-circleTel-secondaryNeutral mt-1">
                        Look for an email from CircleTel (check spam folder if you don't see it)
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-4">
                    <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-sm font-bold text-blue-700">
                      2
                    </div>
                    <div className="flex-1 pt-1">
                      <p className="font-semibold text-circleTel-darkNeutral">Click the verification link</p>
                      <p className="text-sm text-circleTel-secondaryNeutral mt-1">
                        This will confirm your email address and activate your account
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-4">
                    <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-sm font-bold text-blue-700">
                      3
                    </div>
                    <div className="flex-1 pt-1">
                      <p className="font-semibold text-circleTel-darkNeutral">Access your dashboard</p>
                      <p className="text-sm text-circleTel-secondaryNeutral mt-1">
                        You'll be redirected to your customer dashboard to complete your order
                      </p>
                    </div>
                  </li>
                </ol>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-4 pt-6 border-t">
              <Button
                onClick={handleResendEmail}
                disabled={isResending || countdown > 0}
                variant="outline"
                className="w-full h-12 text-base border-2 hover:bg-blue-50 hover:border-blue-300 transition-all"
              >
                {isResending ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Sending...
                  </>
                ) : countdown > 0 ? (
                  <>
                    <Clock className="h-4 w-4 mr-2" />
                    Resend in {countdown}s
                  </>
                ) : (
                  <>
                    <RefreshCcw className="h-4 w-4 mr-2" />
                    Didn't receive it? Resend email
                  </>
                )}
              </Button>

              <Button
                onClick={handleContinueToDashboard}
                className="w-full h-14 text-base bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-semibold shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all"
              >
                Continue to Dashboard
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>

            {/* Help Section */}
            <Alert className="border-amber-200 bg-amber-50/50">
              <Clock className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-900 text-sm">
                <span className="font-semibold">Email not arriving?</span> It may take a few minutes. Check your spam folder or contact support at{' '}
                <a href="mailto:support@circletel.co.za" className="underline hover:text-amber-700">
                  support@circletel.co.za
                </a>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Security Note */}
        <div className="mt-8 text-center">
          <p className="text-sm text-circleTel-secondaryNeutral">
            <CheckCircle2 className="h-4 w-4 inline mr-1.5 text-green-600" />
            Your information is secure and will never be shared with third parties
          </p>
        </div>
      </div>
    </div>
  );
}
