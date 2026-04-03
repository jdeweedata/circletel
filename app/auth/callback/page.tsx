'use client';

import React from 'react';
import { PiCheckCircleBold, PiSpinnerBold, PiXCircleBold } from 'react-icons/pi';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/integrations/supabase/client';
import { CheckoutProgressBar } from '@/components/order/CheckoutProgressBar';

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
          if (savedNext && !savedNext.startsWith('/auth/')) {
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
            const { data: existingCustomer } = await supabase
              .from('customers')
              .select('id')
              .eq('auth_user_id', data.session.user.id)
              .maybeSingle();

            if (!existingCustomer && data.session.user.email) {
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
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Minimal header with progress context */}
      <div className="max-w-screen-xl mx-auto px-4 sm:px-8 lg:px-16 w-full pt-8 pb-6">
        <CheckoutProgressBar currentStage="account" />
      </div>

      {/* Card */}
      <div className="flex-1 flex items-start justify-center px-4">
        <div className="w-full max-w-sm bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
          {status === 'loading' && (
            <>
              <div className="flex items-center justify-center w-16 h-16 bg-orange-50 rounded-full mx-auto mb-5">
                <PiSpinnerBold className="w-8 h-8 text-circleTel-orange animate-spin" />
              </div>
              <p className="font-semibold text-gray-900 mb-1">Signing you in…</p>
              <p className="text-sm text-gray-400">Just a moment while we verify your account</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="flex items-center justify-center w-16 h-16 bg-green-50 rounded-full mx-auto mb-5">
                <PiCheckCircleBold className="w-8 h-8 text-green-500" />
              </div>
              <p className="font-semibold text-gray-900 mb-1">Signed in!</p>
              <p className="text-sm text-gray-400">Redirecting you now…</p>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="flex items-center justify-center w-16 h-16 bg-red-50 rounded-full mx-auto mb-5">
                <PiXCircleBold className="w-8 h-8 text-red-500" />
              </div>
              <p className="font-semibold text-gray-900 mb-1">Something went wrong</p>
              <p className="text-sm text-red-500 mb-5">{errorMessage}</p>
              <button
                onClick={() => router.push('/order/checkout')}
                className="w-full bg-circleTel-orange hover:bg-orange-600 text-white font-semibold rounded-xl px-4 py-3 text-sm transition-colors"
              >
                Back to Checkout
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
