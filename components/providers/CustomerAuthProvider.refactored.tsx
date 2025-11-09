'use client';

/**
 * CustomerAuthProvider (Refactored)
 * React Context provider for customer authentication state
 *
 * Provides:
 * - Current user session
 * - Customer profile data
 * - Auth methods (signUp, signIn, signOut)
 * - Loading states
 * - Email verification status
 *
 * Improvements:
 * - Extracted reusable session management utilities
 * - Eliminated code duplication (3 instances → 1 utility)
 * - Simplified complex timeout logic
 * - Better error handling and logging
 * - Improved maintainability
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { CustomerAuthService } from '@/lib/auth/customer-auth-service';
import {
  shouldSkipAuth,
  createAuthStateFromSession,
  handleAuthStateChange,
  fetchCustomerWithTimeout,
  createClearedAuthState,
  type AuthState,
} from '@/lib/auth/session-utils';
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

const LOG_PREFIX = '[CustomerAuthProvider]';

export function CustomerAuthProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  /**
   * Update component state from AuthState object
   */
  const updateAuthState = (authState: AuthState) => {
    setSession(authState.session);
    setUser(authState.user);
    setCustomer(authState.customer);
  };

  /**
   * Initialize auth state on mount
   */
  useEffect(() => {
    // Skip initialization on excluded pages (admin, partners, auth callbacks)
    if (shouldSkipAuth(pathname)) {
      setLoading(false);
      return;
    }

    const supabase = createClient();

    const initializeAuth = async () => {
      try {
        console.log(`${LOG_PREFIX} Initializing auth...`);

        // Get session from Supabase (reads from local storage)
        const { data: { session: currentSession } } = await supabase.auth.getSession();

        // Create auth state from session (includes customer fetch)
        const authState = await createAuthStateFromSession(
          supabase,
          currentSession,
          LOG_PREFIX
        );

        updateAuthState(authState);

      } catch (error) {
        console.error(`${LOG_PREFIX} Failed to initialize auth:`, error);
        updateAuthState(createClearedAuthState());
      } finally {
        setLoading(false);
        console.log(`${LOG_PREFIX} Auth initialization complete`);
      }
    };

    initializeAuth();

    // Listen for auth state changes (sign in, sign out, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, currentSession: Session | null) => {
        const authState = await handleAuthStateChange(
          supabase,
          event,
          currentSession,
          LOG_PREFIX
        );

        updateAuthState(authState);
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [pathname]);

  /**
   * Refresh customer data from database
   * Useful after profile updates
   */
  const refreshCustomer = async () => {
    if (!user) {
      console.warn(`${LOG_PREFIX} Cannot refresh customer: no user logged in`);
      return;
    }

    const supabase = createClient();
    const customerData = await fetchCustomerWithTimeout(
      supabase,
      user.id,
      undefined, // Use default timeout
      `${LOG_PREFIX} [Refresh]`
    );

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
