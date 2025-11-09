'use client';

/**
 * CustomerAuthProvider
 * React Context provider for customer authentication state
 *
 * Provides:
 * - Current user session
 * - Customer profile data
 * - Auth methods (signUp, signIn, signOut)
 * - Loading states
 * - Email verification status
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { CustomerAuthService } from '@/lib/auth/customer-auth-service';
import type { User, Session, AuthChangeEvent } from '@supabase/supabase-js';

interface Customer {
  id: string;
  auth_user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  account_type: 'personal' | 'business';
  business_name?: string;
  business_registration?: string;
  tax_number?: string;
  email_verified: boolean;
  status: string;
  last_login?: string;
  created_at: string;
  updated_at: string;
}

interface CustomerAuthContextType {
  user: User | null;
  customer: Customer | null;
  session: Session | null;
  loading: boolean;
  isAuthenticated: boolean;
  isEmailVerified: boolean;
  signUp: typeof CustomerAuthService.signUp;
  signIn: typeof CustomerAuthService.signIn;
  signInWithGoogle: typeof CustomerAuthService.signInWithGoogle;
  signInWithOtp: typeof CustomerAuthService.signInWithOtp;
  signOut: typeof CustomerAuthService.signOut;
  refreshCustomer: () => Promise<void>;
  resendVerification: typeof CustomerAuthService.resendVerificationEmail;
}

const CustomerAuthContext = createContext<CustomerAuthContextType | undefined>(undefined);

export function CustomerAuthProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Prevent duplicate fetches - use ref to track in-flight queries
  const customerFetchInProgress = React.useRef(false);
  const abortController = React.useRef<AbortController | null>(null);

  // Skip auth initialization on admin, partner, password reset and auth callback pages to prevent
  // competing Supabase client instances that clear the session
  const isAdminPage = pathname?.startsWith('/admin');
  const isPartnerPage = pathname?.startsWith('/partners');
  const isAuthPage = pathname?.startsWith('/auth/reset-password') || pathname?.startsWith('/auth/callback');

  // Shared function to fetch customer with duplicate prevention
  const fetchCustomer = React.useCallback(async (userId: string, supabase: any): Promise<Customer | null> => {
    // Prevent duplicate fetches
    if (customerFetchInProgress.current) {
      console.log('[CustomerAuthProvider] Fetch already in progress, skipping duplicate');
      return null;
    }

    // Cancel any in-flight request
    if (abortController.current) {
      abortController.current.abort();
    }

    // Create new abort controller for this request
    abortController.current = new AbortController();
    customerFetchInProgress.current = true;

    try {
      console.log('[CustomerAuthProvider] Fetching customer record...');

      // Fetch with reduced timeout (5 seconds instead of 10)
      const customerQuery = supabase
        .from('customers')
        .select('*')
        .eq('auth_user_id', userId)
        .maybeSingle()
        .abortSignal(abortController.current.signal);

      const timeoutPromise = new Promise<{ data: null; error: { message: string } }>((resolve) => {
        setTimeout(() => {
          console.warn('[CustomerAuthProvider] Customer query timed out after 5 seconds');
          resolve({ data: null, error: { message: 'Query timeout' } });
        }, 5000); // Reduced from 10 to 5 seconds
      });

      const result = await Promise.race([customerQuery, timeoutPromise]);
      const { data: customerData, error: customerError } = result as any;

      if (customerError) {
        console.error('[CustomerAuthProvider] Customer fetch error:', customerError);
        return null;
      }

      console.log('[CustomerAuthProvider] Customer fetched:', customerData ? 'Found' : 'Not found');
      return customerData;
    } catch (error) {
      // Ignore abort errors (they're expected when we cancel requests)
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('[CustomerAuthProvider] Fetch cancelled');
        return null;
      }
      console.error('[CustomerAuthProvider] Failed to fetch customer:', error);
      return null;
    } finally {
      customerFetchInProgress.current = false;
      abortController.current = null;
    }
  }, []);

  // Initialize auth state on mount
  useEffect(() => {
    // Skip initialization on admin, partner, and auth pages
    if (isAdminPage || isPartnerPage || isAuthPage) {
      setLoading(false);
      return;
    }
    const supabase = createClient();

    // Get initial session
    const initializeAuth = async () => {
      try {
        console.log('[CustomerAuthProvider] Initializing auth...');

        // Get session directly without timeout - Supabase handles this internally
        const { data: { session: currentSession } } = await supabase.auth.getSession();

        if (currentSession) {
          console.log('[CustomerAuthProvider] Session found, setting user state...');
          setSession(currentSession);
          setUser(currentSession.user);

          // Fetch customer record using shared function
          const customerData = await fetchCustomer(currentSession.user.id, supabase);
          setCustomer(customerData);
        } else {
          console.log('[CustomerAuthProvider] No session found');
          // Clear auth state when no session exists
          setSession(null);
          setUser(null);
          setCustomer(null);
        }
      } catch (error) {
        console.error('[CustomerAuthProvider] Failed to initialize auth:', error);
        // Ensure state is reset on error
        setSession(null);
        setUser(null);
        setCustomer(null);
      } finally {
        // ALWAYS set loading to false, even if errors occurred
        setLoading(false);
        console.log('[CustomerAuthProvider] Auth initialization complete');
      }
    };

    initializeAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, currentSession: Session | null) => {
        console.log('Auth state changed:', event);

        setSession(currentSession);
        setUser(currentSession?.user || null);

        if (currentSession?.user) {
          // Fetch customer record using shared function
          const customerData = await fetchCustomer(currentSession.user.id, supabase);
          setCustomer(customerData);
        } else {
          // Clear customer data when user signs out
          setCustomer(null);
        }

        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
      // Cancel any in-flight fetch on cleanup
      if (abortController.current) {
        abortController.current.abort();
      }
    };
  }, [isAdminPage, isPartnerPage, isAuthPage, fetchCustomer]);

  // Refresh customer data from database
  const refreshCustomer = async () => {
    if (!user) return;

    const supabase = createClient();
    const customerData = await fetchCustomer(user.id, supabase);
    setCustomer(customerData);
  };

  // Check if email is verified
  const isEmailVerified = user?.email_confirmed_at !== null && user?.email_confirmed_at !== undefined;

  const value: CustomerAuthContextType = {
    user,
    customer,
    session,
    loading,
    isAuthenticated: !!user,
    isEmailVerified,
    signUp: CustomerAuthService.signUp,
    signIn: CustomerAuthService.signIn,
    signInWithGoogle: CustomerAuthService.signInWithGoogle,
    signInWithOtp: CustomerAuthService.signInWithOtp,
    signOut: CustomerAuthService.signOut,
    refreshCustomer,
    resendVerification: CustomerAuthService.resendVerificationEmail,
  };

  return (
    <CustomerAuthContext.Provider value={value}>
      {children}
    </CustomerAuthContext.Provider>
  );
}

/**
 * Hook to access customer auth context
 * Must be used within CustomerAuthProvider
 */
export function useCustomerAuth() {
  const context = useContext(CustomerAuthContext);

  if (context === undefined) {
    throw new Error('useCustomerAuth must be used within CustomerAuthProvider');
  }

  return context;
}
