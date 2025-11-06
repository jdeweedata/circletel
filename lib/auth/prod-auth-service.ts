/**
 * Production Authentication Service
 *
 * Handles real authentication via Supabase Edge Functions.
 * Provides login and session validation for production environments.
 */

import { supabase } from '@/integrations/supabase/client'
import { type AdminSession, type AdminUser } from './session-storage'

export class ProdAuthServiceError extends Error {
  constructor(
    message: string,
    public code?: string,
    public cause?: unknown
  ) {
    super(message)
    this.name = 'ProdAuthServiceError'
  }
}

export interface ProdAuthResult {
  user: AdminUser
  session: AdminSession
}

export interface SessionValidationResult {
  valid: boolean
  user?: AdminUser
  error?: string
}

/**
 * Production Authentication Service
 * Communicates with Supabase Edge Functions for authentication
 */
export class ProdAuthService {
  /**
   * Login with email and password
   * Calls Supabase Edge Function for authentication
   */
  static async login(email: string, password: string): Promise<ProdAuthResult> {
    try {

      const { data, error } = await supabase.functions.invoke('admin-auth', {
        body: { email, password },
        method: 'POST',
      })

      if (error) {
        throw new ProdAuthServiceError(
          'Authentication request failed',
          'AUTH_REQUEST_FAILED',
          error
        )
      }

      if (!data || data.error) {
        throw new ProdAuthServiceError(
          data?.error || 'Invalid credentials',
          'INVALID_CREDENTIALS'
        )
      }

      if (!data.user || !data.session) {
        throw new ProdAuthServiceError(
          'Invalid response from authentication service',
          'INVALID_RESPONSE'
        )
      }

      return {
        user: data.user,
        session: data.session,
      }
    } catch (error) {
      if (error instanceof ProdAuthServiceError) {
        throw error
      }

      console.error('Login error:', error)
      throw new ProdAuthServiceError(
        'An unexpected error occurred during login',
        'UNEXPECTED_ERROR',
        error
      )
    }
  }

  /**
   * Validate current session with access token
   * Calls Supabase Edge Function for session validation
   */
  static async validateSession(accessToken: string): Promise<SessionValidationResult> {
    try {

      const { data, error } = await supabase.functions.invoke('admin-auth', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        method: 'GET',
      })

      if (error) {
        console.error('Session validation error:', error)
        return {
          valid: false,
          error: 'Failed to validate session',
        }
      }

      if (!data || !data.valid) {
        return {
          valid: false,
          error: data?.error || 'Invalid session',
        }
      }

      return {
        valid: true,
        user: data.user,
      }
    } catch (error) {
      console.error('Session validation error:', error)
      return {
        valid: false,
        error: 'An unexpected error occurred during session validation',
      }
    }
  }

  /**
   * Logout user
   * Calls Supabase auth signOut
   */
  static async logout(): Promise<void> {
    try {
      const { error } = await supabase.auth.signOut()

      if (error) {
        throw new ProdAuthServiceError(
          'Failed to logout',
          'LOGOUT_FAILED',
          error
        )
      }
    } catch (error) {
      if (error instanceof ProdAuthServiceError) {
        throw error
      }

      console.error('Logout error:', error)
      throw new ProdAuthServiceError(
        'An unexpected error occurred during logout',
        'UNEXPECTED_ERROR',
        error
      )
    }
  }

  /**
   * Refresh session using refresh token
   * @param refreshToken - The refresh token to use
   */
  static async refreshSession(refreshToken: string): Promise<ProdAuthResult> {
    try {

      const { data, error } = await supabase.auth.refreshSession({
        refresh_token: refreshToken,
      })

      if (error || !data.session || !data.user) {
        throw new ProdAuthServiceError(
          'Failed to refresh session',
          'REFRESH_FAILED',
          error
        )
      }

      // Fetch admin user details
      const { data: adminUser, error: adminError } = await supabase
        .from('admin_users')
        .select('*')
        .eq('id', data.user.id)
        .eq('is_active', true)
        .single()

      if (adminError || !adminUser) {
        throw new ProdAuthServiceError(
          'Failed to fetch user details',
          'USER_FETCH_FAILED',
          adminError
        )
      }

      return {
        user: adminUser as AdminUser,
        session: {
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
          expires_at: Math.floor(Date.now() / 1000) + (data.session.expires_in ?? 3600),
          expires_in: data.session.expires_in,
        },
      }
    } catch (error) {
      if (error instanceof ProdAuthServiceError) {
        throw error
      }

      console.error('Refresh session error:', error)
      throw new ProdAuthServiceError(
        'An unexpected error occurred during session refresh',
        'UNEXPECTED_ERROR',
        error
      )
    }
  }
}
