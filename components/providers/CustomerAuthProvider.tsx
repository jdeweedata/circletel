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
import { createClient } from '@/integrations/supabase/client';
import { CustomerAuthService } from '@/lib/auth/customer-auth-service';
import type { User, Session } from '@supabase/supabase-js';

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

  // Skip auth initialization on password reset and auth callback pages to prevent
  // competing Supabase client instances that clear the session
  const isAuthPage = pathname?.startsWith('/auth/reset-password') || pathname?.startsWith('/auth/callback');

  // Initialize auth state on mount
  useEffect(() => {
    // Skip initialization on auth pages
    if (isAuthPage) {
      setLoading(false);
      return;
    }
    const supabase = createClient();

    // Get initial session
    const initializeAuth = async () => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();

        if (currentSession) {
          setSession(currentSession);
          setUser(currentSession.user);

          // Fetch customer record
          const { customer: customerData } = await CustomerAuthService.getCustomer();
          setCustomer(customerData);
        }
      } catch (error) {
        console.error('Failed to initialize auth:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        console.log('Auth state changed:', event);

        setSession(currentSession);
        setUser(currentSession?.user || null);

        if (currentSession?.user) {
          // Fetch customer record when user signs in
          try {
            console.log('[CustomerAuthProvider] Fetching customer record...');

            // Add timeout to prevent hanging indefinitely
            const timeoutPromise = new Promise<{ customer: null; error: string }>((_, reject) => {
              setTimeout(() => reject(new Error('Customer fetch timeout after 5 seconds')), 5000);
            });

            const customerPromise = CustomerAuthService.getCustomer();
            const { customer: customerData } = await Promise.race([customerPromise, timeoutPromise]);

            console.log('[CustomerAuthProvider] Customer fetched:', customerData ? 'Found' : 'Not found');
            setCustomer(customerData);
          } catch (error) {
            console.error('[CustomerAuthProvider] Failed to fetch customer:', error);
            setCustomer(null);
          }
        } else {
          // Clear customer data when user signs out
          setCustomer(null);
        }

        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [isAuthPage]);

  // Refresh customer data from database
  const refreshCustomer = async () => {
    if (!user) return;

    const { customer: customerData } = await CustomerAuthService.getCustomer();
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
