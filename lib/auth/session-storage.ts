/**
 * Session Storage Utility
 *
 * Centralized session management for admin authentication.
 * Handles saving, retrieving, and validating admin sessions
 * with proper error handling and type safety.
 */

import { AUTH_CONFIG } from './constants'

/**
 * Admin session data structure
 */
export interface AdminSession {
  access_token: string
  refresh_token: string
  expires_at?: number
  expires_in?: number
}

/**
 * Admin user data structure
 */
export interface AdminUser {
  id: string
  email: string
  full_name: string
  role: 'super_admin' | 'product_manager' | 'editor' | 'viewer'
  permissions: Record<string, unknown>
  is_active: boolean
  last_login?: string
}

/**
 * Stored session data
 */
export interface StoredSession {
  session: AdminSession
  user: AdminUser
}

/**
 * Session storage errors
 */
export class SessionStorageError extends Error {
  constructor(message: string, public cause?: unknown) {
    super(message)
    this.name = 'SessionStorageError'
  }
}

/**
 * Session Storage Service
 *
 * Provides type-safe, error-handled operations for managing
 * admin sessions in localStorage.
 */
export class SessionStorage {
  /**
   * Save session and user data to localStorage
   *
   * @param session - Session data to save
   * @param user - User data to save
   * @throws {SessionStorageError} If storage operation fails
   */
  static saveSession(session: AdminSession, user: AdminUser): void {
    try {
      localStorage.setItem(
        AUTH_CONFIG.STORAGE_KEYS.SESSION,
        JSON.stringify(session)
      )
      localStorage.setItem(AUTH_CONFIG.STORAGE_KEYS.USER, JSON.stringify(user))
    } catch (error) {
      console.error('Failed to save session to localStorage:', error)
      throw new SessionStorageError('Failed to save session', error)
    }
  }

  /**
   * Retrieve session and user data from localStorage
   *
   * @returns Stored session data or null if not found/invalid
   */
  static getSession(): StoredSession | null {
    try {
      const sessionStr = localStorage.getItem(AUTH_CONFIG.STORAGE_KEYS.SESSION)
      const userStr = localStorage.getItem(AUTH_CONFIG.STORAGE_KEYS.USER)

      if (!sessionStr || !userStr) {
        return null
      }

      const session = JSON.parse(sessionStr) as AdminSession
      const user = JSON.parse(userStr) as AdminUser

      return { session, user }
    } catch (error) {
      console.error('Failed to retrieve session from localStorage:', error)
      // Clear corrupted data
      this.clearSession()
      return null
    }
  }

  /**
   * Clear all session data from localStorage
   */
  static clearSession(): void {
    try {
      localStorage.removeItem(AUTH_CONFIG.STORAGE_KEYS.SESSION)
      localStorage.removeItem(AUTH_CONFIG.STORAGE_KEYS.USER)
    } catch (error) {
      console.error('Failed to clear session from localStorage:', error)
    }
  }

  /**
   * Check if a valid session exists in localStorage
   *
   * @returns true if valid session exists and is not expired
   */
  static hasValidSession(): boolean {
    const stored = this.getSession()
    if (!stored) {
      return false
    }

    // Check if session is expired
    if (stored.session.expires_at) {
      const now = Math.floor(Date.now() / 1000) // Convert to seconds
      const isExpired = now >= stored.session.expires_at

      if (isExpired) {
        this.clearSession()
        return false
      }
    }

    return true
  }

  /**
   * Get the access token from stored session
   *
   * @returns Access token or null if not found
   */
  static getAccessToken(): string | null {
    const stored = this.getSession()
    return stored?.session.access_token ?? null
  }

  /**
   * Get the user data from stored session
   *
   * @returns User data or null if not found
   */
  static getUser(): AdminUser | null {
    const stored = this.getSession()
    return stored?.user ?? null
  }

  /**
   * Update user data in storage (keeps session unchanged)
   *
   * @param user - Updated user data
   * @throws {SessionStorageError} If no session exists or storage fails
   */
  static updateUser(user: AdminUser): void {
    const stored = this.getSession()

    if (!stored) {
      throw new SessionStorageError('No session found to update')
    }

    try {
      localStorage.setItem(AUTH_CONFIG.STORAGE_KEYS.USER, JSON.stringify(user))
    } catch (error) {
      console.error('Failed to update user in localStorage:', error)
      throw new SessionStorageError('Failed to update user', error)
    }
  }

  /**
   * Check if session is about to expire (within next 5 minutes)
   *
   * @returns true if session expires within 5 minutes
   */
  static isSessionExpiringSoon(): boolean {
    const stored = this.getSession()
    if (!stored?.session.expires_at) {
      return false
    }

    const now = Math.floor(Date.now() / 1000)
    const fiveMinutesFromNow = now + 5 * 60
    return stored.session.expires_at <= fiveMinutesFromNow
  }

  /**
   * Get time remaining until session expires
   *
   * @returns Seconds until expiry, or null if no expiry set
   */
  static getTimeUntilExpiry(): number | null {
    const stored = this.getSession()
    if (!stored?.session.expires_at) {
      return null
    }

    const now = Math.floor(Date.now() / 1000)
    const remaining = stored.session.expires_at - now
    return Math.max(0, remaining)
  }
}
