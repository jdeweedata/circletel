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
  const isInitializing = React.useRef(false);
  const currentUserId = React.useRef<string | null>(null);

  // Skip auth initialization on admin, partner, password reset and auth callback pages to prevent
  // competing Supabase client instances that clear the session
  // Also skip on studio subdomain (for Sanity CMS)
  const isStudioSubdomain = typeof window !== 'undefined' && window.location.hostname.startsWith('studio.');
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

      // Fetch customer directly - Supabase SDK handles timeouts internally
      const { data: customerData, error: customerError } = await supabase
        .from('customers')
        .select('*')
        .eq('auth_user_id', userId)
        .maybeSingle()
        .abortSignal(abortController.current.signal);

      if (customerError) {
        console.error('[CustomerAuthProvider] Customer fetch error:', customerError);
        return null;
      }

      // If customer not found, try to fetch via API (which uses service role)
      if (!customerData) {
        console.log('[CustomerAuthProvider] Customer not found via client, trying API...');
        
        try {
          const response = await fetch('/api/customers/ensure', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ auth_user_id: userId }),
          });
          
          if (response.ok) {
            const result = await response.json();
            if (result.success && result.customer) {
              console.log('[CustomerAuthProvider] Customer fetched/created via API:', result.customer.id);
              return result.customer;
            }
          }
        } catch (apiError) {
          console.error('[CustomerAuthProvider] API fallback failed:', apiError);
        }
        
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
    // Skip initialization on admin, partner, auth pages, and studio subdomain
    if (isAdminPage || isPartnerPage || isAuthPage || isStudioSubdomain) {
      setLoading(false);
      return;
    }

    // Create Supabase client once per mount (singleton)
    const supabase = createClient();
    let authSubscription: { unsubscribe: () => void } | null = null;

    // Get initial session
    const initializeAuth = async () => {
      isInitializing.current = true;

      try {
        console.log('[CustomerAuthProvider] Initializing auth...');

        // Get session directly - Supabase handles timeouts internally
        const { data: { session: currentSession } } = await supabase.auth.getSession();

        if (currentSession) {
          console.log('[CustomerAuthProvider] Session found, setting user state...');
          setSession(currentSession);
          setUser(currentSession.user);
          currentUserId.current = currentSession.user.id;

          // Fetch customer record using shared function
          const customerData = await fetchCustomer(currentSession.user.id, supabase);
          setCustomer(customerData);
        } else {
          console.log('[CustomerAuthProvider] No session found');
          // Clear auth state when no session exists
          setSession(null);
          setUser(null);
          setCustomer(null);
          currentUserId.current = null;
        }
      } catch (error) {
        console.error('[CustomerAuthProvider] Failed to initialize auth:', error);
        // Ensure state is reset on error
        setSession(null);
        setUser(null);
        setCustomer(null);
        currentUserId.current = null;
      } finally {
        // ALWAYS set loading to false, even if errors occurred
        setLoading(false);
        // Mark initialization as complete BEFORE subscribing to auth changes
        // This prevents the subscription from firing for the initial session
        setTimeout(() => {
          isInitializing.current = false;
          console.log('[CustomerAuthProvider] Auth initialization complete');
        }, 100); // Small delay to ensure state updates have settled
      }
    };

    initializeAuth().then(() => {
      // Subscribe to auth state changes AFTER initialization completes
      // This prevents duplicate events for the initial session
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event: AuthChangeEvent, currentSession: Session | null) => {
          // Skip auth state changes during initialization
          if (isInitializing.current) {
            console.log('[CustomerAuthProvider] Skipping auth event during initialization:', event);
            return;
          }

          console.log('[CustomerAuthProvider] Auth state changed:', event);

          const newUserId = currentSession?.user?.id || null;
          const userChanged = currentUserId.current !== newUserId;

          setSession(currentSession);
          setUser(currentSession?.user || null);

          if (currentSession?.user && userChanged) {
            // Only fetch customer if the user actually changed
            console.log('[CustomerAuthProvider] User changed, fetching customer...');
            currentUserId.current = newUserId;
            const customerData = await fetchCustomer(currentSession.user.id, supabase);
            setCustomer(customerData);
          } else if (!currentSession?.user) {
            // Clear customer data when user signs out
            console.log('[CustomerAuthProvider] User signed out, clearing customer data');
            currentUserId.current = null;
            setCustomer(null);
          } else {
            console.log('[CustomerAuthProvider] Same user, skipping customer fetch');
          }

          setLoading(false);
        }
      );

      authSubscription = subscription;
    });

    return () => {
      // Unsubscribe from auth changes
      authSubscription?.unsubscribe();
      // Cancel any in-flight fetch on cleanup
      if (abortController.current) {
        abortController.current.abort();
      }
    };
  }, [isAdminPage, isPartnerPage, isAuthPage, isStudioSubdomain, fetchCustomer]);

  // Refresh customer data from database
  const refreshCustomer = React.useCallback(async () => {
    if (!user) return;

    // Reuse the singleton client
    const supabase = createClient();
    const customerData = await fetchCustomer(user.id, supabase);
    setCustomer(customerData);
  }, [user, fetchCustomer]);

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
