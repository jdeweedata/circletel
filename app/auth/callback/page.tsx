'use client';

/**
 * Supabase Auth Callback Page
 * Handles email verification and password reset redirects
 *
 * Flow:
 * 1. User clicks verification link in email
 * 2. Supabase redirects here with token in URL
 * 3. This page exchanges token for session
 * 4. Redirects to dashboard on success
 */

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = React.useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = React.useState('');

  React.useEffect(() => {
    const handleCallback = async () => {
      try {
        const supabase = createClient();

        // Get the code from the URL (Supabase PKCE flow)
        const code = searchParams.get('code');
        const error = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');

        if (error) {
          setStatus('error');
          setErrorMessage(errorDescription || error);
          return;
        }

        if (!code) {
          setStatus('error');
          setErrorMessage('No verification code found in URL');
          return;
        }

        // Exchange code for session
        const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

        if (exchangeError) {
          setStatus('error');
          setErrorMessage(exchangeError.message);
          return;
        }

        if (data.session) {
          setStatus('success');

          // Redirect to dashboard after short delay
          setTimeout(() => {
            router.push('/my-account/dashboard');
          }, 2000);
        } else {
          setStatus('error');
          setErrorMessage('Failed to create session');
        }
      } catch (error) {
        console.error('Auth callback error:', error);
        setStatus('error');
        setErrorMessage(error instanceof Error ? error.message : 'An unexpected error occurred');
      }
    };

    handleCallback();
  }, [router, searchParams]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50/30 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl border-0">
        <CardHeader className="text-center pb-6">
          {status === 'loading' && (
            <div className="flex flex-col items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center">
                <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
              </div>
              <CardTitle className="text-2xl">Verifying your email...</CardTitle>
            </div>
          )}
          {status === 'success' && (
            <div className="flex flex-col items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle className="text-2xl text-green-700">Email Verified!</CardTitle>
            </div>
          )}
          {status === 'error' && (
            <div className="flex flex-col items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center">
                <XCircle className="h-8 w-8 text-red-600" />
              </div>
              <CardTitle className="text-2xl text-red-700">Verification Failed</CardTitle>
            </div>
          )}
        </CardHeader>
        <CardContent className="text-center">
          {status === 'loading' && (
            <p className="text-circleTel-secondaryNeutral">
              Please wait while we verify your email address...
            </p>
          )}
          {status === 'success' && (
            <div className="space-y-4">
              <p className="text-circleTel-secondaryNeutral">
                Your email has been successfully verified. Redirecting to your dashboard...
              </p>
              <div className="flex justify-center">
                <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
              </div>
            </div>
          )}
          {status === 'error' && (
            <div className="space-y-4">
              <p className="text-red-600 text-sm">
                {errorMessage}
              </p>
              <p className="text-circleTel-secondaryNeutral text-sm">
                Please try again or contact support if the problem persists.
              </p>
              <button
                onClick={() => router.push('/order/verify-email')}
                className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Back to Verification
              </button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
