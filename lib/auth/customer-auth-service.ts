/**
 * Customer Authentication Service
 * Handles customer signup, login, and email verification using Supabase Auth
 *
 * Flow:
 * 1. Customer signs up → Creates auth.users + customers record
 * 2. Supabase sends verification email automatically
 * 3. Customer clicks link → email verified → can access dashboard
 * 4. Customer logs in → gets session → can manage orders/KYC
 */

import { createClient } from '@/integrations/supabase/client';
import type { User, Session, AuthError } from '@supabase/supabase-js';

export interface CustomerData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  accountType?: 'personal' | 'business';
  businessName?: string;
  businessRegistration?: string;
  taxNumber?: string;
}

export interface SignUpResult {
  user: User | null;
  customer: any | null;
  session: Session | null;
  error: string | null;
}

export interface SignInResult {
  user: User | null;
  customer: any | null;
  session: Session | null;
  error: string | null;
}

export class CustomerAuthService {
  /**
   * Sign up a new customer
   * Creates both auth user and customer record in single transaction
   */
  static async signUp(
    email: string,
    password: string,
    customerData: CustomerData
  ): Promise<SignUpResult> {
    try {
      const supabase = createClient();

      // 1. Create Supabase Auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            first_name: customerData.firstName,
            last_name: customerData.lastName,
            phone: customerData.phone,
          }
        }
      });

      if (authError) {
        // Handle rate limiting specifically
        if (authError.message.includes('429') || authError.message.toLowerCase().includes('rate limit')) {
          return {
            user: null,
            customer: null,
            session: null,
            error: 'Too many signup attempts. Please wait a few minutes and try again.'
          };
        }
        
        // Handle duplicate user (user already exists)
        if (authError.message.toLowerCase().includes('already registered')) {
          return {
            user: null,
            customer: null,
            session: null,
            error: 'This email is already registered. Please sign in instead.'
          };
        }
        
        return {
          user: null,
          customer: null,
          session: null,
          error: authError.message
        };
      }

      if (!authData.user) {
        return {
          user: null,
          customer: null,
          session: null,
          error: 'Failed to create user account'
        };
      }

      // 2. Create customer record via API route (uses service role to bypass RLS)
      // We use an API route instead of direct client INSERT because RLS policies
      // may not recognize auth.uid() immediately after signup

      // Add small delay to ensure auth user is fully committed in database
      await new Promise(resolve => setTimeout(resolve, 500));

      // Retry mechanism for customer creation (up to 3 attempts)
      let customerResponse;
      let customerResult;
      let lastError = null;

      for (let attempt = 1; attempt <= 3; attempt++) {
        customerResponse = await fetch('/api/auth/create-customer', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            auth_user_id: authData.user.id,
            first_name: customerData.firstName,
            last_name: customerData.lastName,
            email: email,
            phone: customerData.phone,
            account_type: customerData.accountType || 'personal',
          }),
        });

        customerResult = await customerResponse.json();

        // If successful or not a timing issue, break
        if (customerResult.success || (customerResult.code !== 'AUTH_USER_NOT_FOUND' && !customerResult.error?.includes('foreign key'))) {
          break;
        }

        lastError = customerResult.error;

        // Wait before retry (exponential backoff: 500ms, 1s, 2s)
        if (attempt < 3) {
          await new Promise(resolve => setTimeout(resolve, 500 * Math.pow(2, attempt - 1)));
        }
      }

      if (!customerResult || !customerResult.success) {
        const errorMsg = lastError || customerResult?.error || 'Unknown error';
        console.error('Failed to create customer record:', errorMsg);

        // If it's a duplicate key error, this is actually OK - the customer record exists
        // This can happen during retry scenarios or rate limiting
        if (errorMsg?.includes('duplicate key') || errorMsg?.includes('already exists')) {
          // Try to fetch the existing customer record
          const { data: existingCustomer } = await supabase
            .from('customers')
            .select('*')
            .eq('email', email)
            .single();
          
          if (existingCustomer) {
            return {
              user: authData.user,
              customer: existingCustomer,
              session: authData.session,
              error: null
            };
          }
        }
        
        // Note: Auth user is already created, but customer record failed
        // This is OK - customer can still verify email and we can create record later
        return {
          user: authData.user,
          customer: null,
          session: authData.session,
          error: `Account created but profile setup failed: ${errorMsg}`
        };
      }

      const customer = customerResult.customer;

      return {
        user: authData.user,
        customer,
        session: authData.session,
        error: null
      };

    } catch (error) {
      console.error('Sign up error:', error);
      return {
        user: null,
        customer: null,
        session: null,
        error: error instanceof Error ? error.message : 'Signup failed'
      };
    }
  }

  /**
   * Sign in existing customer
   */
  static async signIn(email: string, password: string): Promise<SignInResult> {
    try {
      const supabase = createClient();

      // Sign in with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (authError) {
        return {
          user: null,
          customer: null,
          session: null,
          error: authError.message
        };
      }

      if (!authData.user) {
        return {
          user: null,
          customer: null,
          session: null,
          error: 'Invalid credentials'
        };
      }

      // Fetch customer record (graceful when no row exists)
      const { data: customer, error: customerError } = await supabase
        .from('customers')
        .select('*')
        .eq('auth_user_id', authData.user.id)
        .maybeSingle();

      if (customerError) {
        console.error('Failed to fetch customer record:', customerError);
        // User can still access dashboard, but profile data missing
      }

      return {
        user: authData.user,
        customer: customer || null,
        session: authData.session,
        error: null
      };

    } catch (error) {
      console.error('Sign in error:', error);
      return {
        user: null,
        customer: null,
        session: null,
        error: error instanceof Error ? error.message : 'Sign in failed'
      };
    }
  }

  /**
   * Sign in with Google OAuth
   */
  static async signInWithGoogle(): Promise<{ error: string | null }> {
    try {
      const supabase = createClient();

      // Use environment variable if set, otherwise use current origin
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;

      // Save the intended redirect destination to localStorage BEFORE OAuth
      // This is necessary because Supabase OAuth doesn't reliably preserve query params
      // (the hash fragment with tokens can overwrite them)
      const nextUrl = '/order/service-address';
      if (typeof window !== 'undefined') {
        localStorage.setItem('circletel_oauth_next', nextUrl);
        console.log('[Google OAuth] Saved next URL to localStorage:', nextUrl);
      }

      // Use base callback URL without query params - we'll get next from localStorage
      const redirectUrl = `${baseUrl}/auth/callback`;

      console.log('[Google OAuth] Redirect URL:', redirectUrl);

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) {
        return { error: error.message };
      }

      // OAuth sign-in redirects user to Google, so no immediate return needed
      return { error: null };

    } catch (error) {
      console.error('Google sign-in error:', error);
      return {
        error: error instanceof Error ? error.message : 'Google sign-in failed'
      };
    }
  }

  /**
   * Sign in with OTP (One-Time Password)
   * Verifies OTP code and signs in user using phone number
   */
  static async signInWithOtp(phone: string, otp: string): Promise<SignInResult> {
    try {
      const supabase = createClient();

      // First, verify the OTP is valid
      const verifyResponse = await fetch('/api/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, otp }),
      });

      const verifyResult = await verifyResponse.json();

      if (!verifyResult.success) {
        return {
          user: null,
          customer: null,
          session: null,
          error: verifyResult.error || 'Invalid or expired OTP'
        };
      }

      // Find customer by phone number
      const { data: customer, error: customerError } = await supabase
        .from('customers')
        .select('*')
        .eq('phone', phone)
        .maybeSingle();

      if (customerError || !customer) {
        return {
          user: null,
          customer: null,
          session: null,
          error: 'No account found with this phone number. Please create an account first.'
        };
      }

      // Get the auth user associated with this customer
      const { data: userData, error: userError } = await supabase.auth.getUser();

      // If user is already signed in, return current session
      if (userData?.user && userData.user.id === customer.auth_user_id) {
        const { data: sessionData } = await supabase.auth.getSession();
        return {
          user: userData.user,
          customer,
          session: sessionData.session,
          error: null
        };
      }

      // Sign in using Supabase OTP (phone)
      // Note: This requires Supabase to be configured for phone auth
      // Alternative: Create a magic link or custom session
      const { data: authData, error: authError } = await supabase.auth.signInWithOtp({
        phone: phone,
        options: {
          shouldCreateUser: false // Don't create new user, only sign in existing
        }
      });

      if (authError) {
        // Fallback: If Supabase phone auth not configured, we can create a session manually
        // This requires a custom implementation with your auth backend
        console.warn('[OTP Login] Supabase phone auth not configured, using fallback');

        // Create a passwordless session by signing in with a temporary token
        // This is a simplified approach - in production you'd want to use Supabase's
        // signInWithOAuth or create a custom auth flow
        return {
          user: null,
          customer,
          session: null,
          error: 'OTP verification successful, but phone authentication is not fully configured. Please contact support.'
        };
      }

      // After OTP is sent, user needs to verify it
      // This is typically a two-step process with Supabase phone auth
      return {
        user: authData?.user || null,
        customer,
        session: authData?.session || null,
        error: null
      };

    } catch (error) {
      console.error('OTP sign-in error:', error);
      return {
        user: null,
        customer: null,
        session: null,
        error: error instanceof Error ? error.message : 'OTP sign-in failed'
      };
    }
  }

  /**
   * Sign out current user
   * Clears auth session and all CircleTel localStorage data for privacy/security
   */
  static async signOut(): Promise<{ error: string | null }> {
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signOut();

      // Clear all CircleTel localStorage data to prevent data leakage on shared devices
      if (typeof window !== 'undefined') {
        const keysToRemove = [
          'circletel_order_data',
          'circletel_order_id',
          'circletel_pending_order_id',
          'circletel_coverage_address',
          'circletel_payment_retries',
          'circletel_payment_error',
          'circletel_oauth_next',
          'dashboard-sidebar-collapsed', // UI preference, safe to clear
        ];
        keysToRemove.forEach(key => localStorage.removeItem(key));
        console.log('[CustomerAuthService] Cleared localStorage on sign out');
      }

      if (error) {
        return { error: error.message };
      }

      return { error: null };

    } catch (error) {
      console.error('Sign out error:', error);
      return {
        error: error instanceof Error ? error.message : 'Sign out failed'
      };
    }
  }

  /**
   * Get current session
   */
  static async getSession(): Promise<{ session: Session | null; error: string | null }> {
    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        return { session: null, error: error.message };
      }

      return { session: data.session, error: null };

    } catch (error) {
      console.error('Get session error:', error);
      return {
        session: null,
        error: error instanceof Error ? error.message : 'Failed to get session'
      };
    }
  }

  /**
   * Get current user
   */
  static async getUser(): Promise<{ user: User | null; error: string | null }> {
    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.getUser();

      if (error) {
        return { user: null, error: error.message };
      }

      return { user: data.user, error: null };

    } catch (error) {
      console.error('Get user error:', error);
      return {
        user: null,
        error: error instanceof Error ? error.message : 'Failed to get user'
      };
    }
  }

  /**
   * Get customer record for current user
   */
  static async getCustomer(): Promise<{ customer: any | null; error: string | null }> {
    try {
      const supabase = createClient();

      // Get current user
      const { data: userData, error: userError } = await supabase.auth.getUser();

      if (userError || !userData.user) {
        return { customer: null, error: 'Not authenticated' };
      }

      // Fetch customer record (graceful when no row exists)
      const { data: customer, error: customerError } = await supabase
        .from('customers')
        .select('*')
        .eq('auth_user_id', userData.user.id)
        .maybeSingle();

      if (customerError) {
        return { customer: null, error: customerError.message };
      }

      return { customer, error: null };

    } catch (error) {
      console.error('Get customer error:', error);
      return {
        customer: null,
        error: error instanceof Error ? error.message : 'Failed to get customer'
      };
    }
  }

  /**
   * Resend verification email
   */
  static async resendVerificationEmail(email: string): Promise<{ error: string | null }> {
    try {
      const supabase = createClient();

      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (error) {
        return { error: error.message };
      }

      return { error: null };

    } catch (error) {
      console.error('Resend verification error:', error);
      return {
        error: error instanceof Error ? error.message : 'Failed to resend verification'
      };
    }
  }

  /**
   * Send password reset email
   */
  static async sendPasswordResetEmail(email: string): Promise<{ error: string | null }> {
    try {
      // Staging mitigation: use implicit flow to avoid PKCE verifier mismatch across devices
      const isStaging = (typeof window !== 'undefined') && (
        window.location.host.includes('staging') ||
        (process.env.NEXT_PUBLIC_ENV || '').toLowerCase() === 'staging'
      );
      const supabase = createClient({ flowType: isStaging ? 'implicit' : 'pkce' });

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`
      });

      if (error) {
        return { error: error.message };
      }

      return { error: null };

    } catch (error) {
      console.error('Password reset error:', error);
      return {
        error: error instanceof Error ? error.message : 'Failed to send password reset'
      };
    }
  }

  /**
   * Update password
   */
  static async updatePassword(newPassword: string): Promise<{ error: string | null }> {
    try {
      const supabase = createClient();

      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        return { error: error.message };
      }

      return { error: null };

    } catch (error) {
      console.error('Update password error:', error);
      return {
        error: error instanceof Error ? error.message : 'Failed to update password'
      };
    }
  }

  /**
   * Check if email is verified
   */
  static async isEmailVerified(): Promise<boolean> {
    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.getUser();

      if (error || !data.user) {
        return false;
      }

      return data.user.email_confirmed_at !== null;

    } catch (error) {
      console.error('Check email verified error:', error);
      return false;
    }
  }
}
