/**
 * Development Authentication Service
 *
 * Provides mock authentication functionality for development mode.
 * Simulates network delays and returns mock user/session data.
 */

import { AUTH_CONFIG, isDevelopmentMode, isDevCredentials } from './constants'
import { SessionStorage, type AdminSession, type AdminUser } from './session-storage'

export class DevAuthServiceError extends Error {
  constructor(message: string, public cause?: unknown) {
    super(message)
    this.name = 'DevAuthServiceError'
  }
}

export interface DevAuthResult {
  user: AdminUser
  session: AdminSession
}

/**
 * Development Authentication Service
 * Only active when NODE_ENV === 'development'
 */
export class DevAuthService {
  /**
   * Check if credentials match development credentials
   */
  static isValidDevCredentials(email: string, password: string): boolean {
    return isDevCredentials(email, password)
  }

  /**
   * Simulate login with mock delay
   * Returns mock user and session data
   */
  static async mockLogin(email: string, password: string): Promise<DevAuthResult> {
    if (!isDevelopmentMode()) {
      throw new DevAuthServiceError('Development mode not active')
    }

    if (!this.isValidDevCredentials(email, password)) {
      // Simulate network delay even for invalid credentials
      await this.simulateNetworkDelay()
      throw new DevAuthServiceError('Invalid development credentials')
    }

    // Simulate network delay
    await this.simulateNetworkDelay()

    const mockUser: AdminUser = {
      ...AUTH_CONFIG.MOCK_USER,
      last_login: new Date().toISOString(),
    }

    const mockSession: AdminSession = {
      access_token: AUTH_CONFIG.SESSION.DEV_ACCESS_TOKEN,
      refresh_token: AUTH_CONFIG.SESSION.DEV_REFRESH_TOKEN,
      expires_at: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
      expires_in: 3600,
    }

    return {
      user: mockUser,
      session: mockSession,
    }
  }

  /**
   * Get mock user from storage or create new one
   */
  static getMockUser(): AdminUser | null {
    const stored = SessionStorage.getSession()
    if (stored && isDevelopmentMode()) {
      return stored.user
    }
    return null
  }

  /**
   * Validate development session
   */
  static isValidDevSession(): boolean {
    if (!isDevelopmentMode()) return false

    const stored = SessionStorage.getSession()
    if (!stored) return false

    // Check if it's a dev token
    return stored.session.access_token === AUTH_CONFIG.SESSION.DEV_ACCESS_TOKEN
  }

  /**
   * Simulate network delay for realistic UX
   */
  private static async simulateNetworkDelay(): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, AUTH_CONFIG.DELAYS.MOCK_LOGIN))
  }

  /**
   * Get mock session data
   */
  static getMockSession(): AdminSession | null {
    const stored = SessionStorage.getSession()
    if (stored && isDevelopmentMode()) {
      return stored.session
    }
    return null
  }
}
