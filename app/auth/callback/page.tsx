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

        // Check for errors first
        const error = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');

        if (error) {
          setStatus('error');
          setErrorMessage(errorDescription || error);
          return;
        }

        // Get the 'next' parameter for redirect after auth
        // First check localStorage (more reliable for OAuth flows where query params can be lost)
        // Then fall back to query params
        let next = '/dashboard';

        if (typeof window !== 'undefined') {
          const savedNext = localStorage.getItem('circletel_oauth_next');
          if (savedNext) {
            next = savedNext;
            localStorage.removeItem('circletel_oauth_next');  // Clean up after use
            console.log('[Auth Callback] Got next URL from localStorage:', next);
          }
        }

        // Fall back to query param if localStorage didn't have it
        if (next === '/dashboard') {
          const queryNext = searchParams.get('next');
          if (queryNext) {
            next = queryNext;
            console.log('[Auth Callback] Got next URL from query param:', next);
          }
        }

        console.log('[Auth Callback] Final redirect destination:', next);

        // Check for implicit flow (OAuth with hash fragment)
        // This happens when tokens are in the URL hash instead of query params
        console.log('[Auth Callback] Checking for hash:', window.location.hash);
        
        if (typeof window !== 'undefined' && window.location.hash) {
          const hashParams = new URLSearchParams(window.location.hash.substring(1));
          const accessToken = hashParams.get('access_token');
          
          console.log('[Auth Callback] Access token found:', !!accessToken);
          
          if (accessToken) {
            console.log('[Auth Callback] Detected implicit flow OAuth response');
            
            // Manually set the session from hash parameters
            const refreshToken = hashParams.get('refresh_token');
            
            if (refreshToken) {
              console.log('[Auth Callback] Setting session from tokens...');
              
              // Set the session using the tokens from the hash
              const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken,
              });
              
              if (sessionError) {
                console.error('[Auth Callback] Failed to set session:', sessionError);
                setStatus('error');
                setErrorMessage('Failed to authenticate with Google');
                return;
              }
              
              const session = sessionData.session;
              console.log('[Auth Callback] Session set successfully:', !!session?.user);
            
            if (session?.user) {
              // Check if customer record exists
              const { data: existingCustomer } = await supabase
                .from('customers')
                .select('id')
                .eq('auth_user_id', session.user.id)
                .maybeSingle();

              if (!existingCustomer && session.user.email) {
                console.log('[Auth Callback] Creating customer record for OAuth user');
                console.log('[Auth Callback] User metadata:', session.user.user_metadata);
                
                const customerData = {
                  auth_user_id: session.user.id,
                  first_name: session.user.user_metadata?.full_name?.split(' ')[0] || session.user.user_metadata?.name?.split(' ')[0] || 'User',
                  last_name: session.user.user_metadata?.full_name?.split(' ').slice(1).join(' ') || session.user.user_metadata?.name?.split(' ').slice(1).join(' ') || '',
                  email: session.user.email,
                  phone: session.user.user_metadata?.phone || session.user.phone || '',
                  account_type: 'personal',
                };
                
                console.log('[Auth Callback] Customer data payload:', customerData);
                
                // Create customer record for OAuth user
                const response = await fetch('/api/auth/create-customer', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(customerData),
                });
                
                const result = await response.json();
                console.log('[Auth Callback] Create customer result:', result);
                
                if (!result.success) {
                  console.error('[Auth Callback] Failed to create customer:', result.error);
                  // Continue anyway - user is authenticated, just missing customer record
                }
              }

              setStatus('success');

              // Wait for session to be confirmed in storage before redirecting
              // This fixes race condition where getSession() returns null on next page
              // We wait a fixed delay to allow cookies to be written, rather than
              // creating multiple client instances (which triggers GoTrueClient warnings)
              console.log('[Auth Callback] Waiting for session to persist to cookies...');
              await new Promise(resolve => setTimeout(resolve, 1500));

              // Verify session is still valid with the same client
              const { data: checkSession } = await supabase.auth.getSession();
              if (checkSession.session?.user) {
                console.log('[Auth Callback] Session verified successfully');
              } else {
                console.warn('[Auth Callback] Session verification failed, proceeding anyway');
              }

              // Use replace to avoid back-button navigation issues
              router.replace(next);
              return;
            }
            }
          }
        }

        // Try PKCE flow first (for password resets and some email confirmations)
        const code = searchParams.get('code');

        if (code) {
          try {
            // Exchange code for session (PKCE flow)
            const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

            if (exchangeError) {
              // If PKCE fails, fall back to implicit flow
              console.log('PKCE flow failed, trying implicit flow:', exchangeError.message);
              throw exchangeError;
            }

            if (data.session) {
              // Check if customer record exists, create if not (for OAuth users)
              const { data: existingCustomer } = await supabase
                .from('customers')
                .select('id')
                .eq('auth_user_id', data.session.user.id)
                .maybeSingle();

              if (!existingCustomer && data.session.user.email) {
                // Create customer record for OAuth user
                await fetch('/api/auth/create-customer', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    auth_user_id: data.session.user.id,
                    first_name: data.session.user.user_metadata?.first_name || '',
                    last_name: data.session.user.user_metadata?.last_name || '',
                    email: data.session.user.email,
                    phone: data.session.user.user_metadata?.phone || '',
                    account_type: 'personal',
                  }),
                });
              }

              setStatus('success');
              // Use replace to avoid back-button navigation issues
              setTimeout(() => {
                router.replace(next);
              }, 1000);
              return;
            }
          } catch (pkceError) {
            console.log('PKCE exchange failed, falling back to implicit flow');
          }
        }

        // Try implicit flow (for email confirmations with token_hash)
        const tokenHash = searchParams.get('token_hash');
        const type = searchParams.get('type');

        if (tokenHash && type) {
          // Verify the token hash
          const { data, error: verifyError } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: type as any,
          });

          if (verifyError) {
            setStatus('error');
            setErrorMessage(verifyError.message);
            return;
          }

          if (data.session) {
            // Check if customer record exists, create if not (for OAuth users)
            const { data: existingCustomer } = await supabase
              .from('customers')
              .select('id')
              .eq('auth_user_id', data.session.user.id)
              .maybeSingle();

            if (!existingCustomer && data.session.user.email) {
              // Create customer record for OAuth user
              await fetch('/api/auth/create-customer', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  auth_user_id: data.session.user.id,
                  first_name: data.session.user.user_metadata?.first_name || '',
                  last_name: data.session.user.user_metadata?.last_name || '',
                  email: data.session.user.email,
                  phone: data.session.user.user_metadata?.phone || '',
                  account_type: 'personal',
                }),
              });
            }

            setStatus('success');
            // Use the 'next' variable already defined at the top (from localStorage or query params)
            // Use replace to avoid back-button navigation issues
            setTimeout(() => {
              router.replace(next);
            }, 1000);
            return;
          }
        }

        // If neither flow worked
        setStatus('error');
        setErrorMessage('No valid verification code or token found in URL');
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
