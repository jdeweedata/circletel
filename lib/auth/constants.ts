/**
 * Authentication Constants
 *
 * Centralized configuration for authentication system.
 * Provides type-safe constants for development credentials,
 * storage keys, and authentication configuration.
 */

export const AUTH_CONFIG = {
  /**
   * Development mode credentials for testing
   * Only valid when NODE_ENV === 'development'
   */
  DEV_CREDENTIALS: {
    email: 'admin@circletel.co.za',
    password: 'admin123',
  },

  /**
   * LocalStorage keys for session management
   */
  STORAGE_KEYS: {
    SESSION: 'admin_session',
    USER: 'admin_user',
  },

  /**
   * Mock user for development mode
   */
  MOCK_USER: {
    id: 'dev-admin-1',
    email: 'admin@circletel.co.za',
    full_name: 'Development Admin',
    role: 'super_admin' as const,
    permissions: {},
    is_active: true,
  },

  /**
   * Timing delays for UX
   */
  DELAYS: {
    MOCK_LOGIN: 1000, // 1 second delay to simulate network request
  },

  /**
   * Session configuration
   */
  SESSION: {
    // Mock token identifier for development mode
    DEV_ACCESS_TOKEN: 'dev-token-123',
    DEV_REFRESH_TOKEN: 'dev-refresh-123',
  },
} as const

/**
 * Check if application is running in development mode
 * @returns true if NODE_ENV === 'development'
 */
export const isDevelopmentMode = (): boolean => {
  return process.env.NODE_ENV === 'development'
}

/**
 * Check if credentials match development credentials
 * @param email - Email to check
 * @param password - Password to check
 * @returns true if credentials match development credentials
 */
export const isDevCredentials = (email: string, password: string): boolean => {
  return (
    email === AUTH_CONFIG.DEV_CREDENTIALS.email &&
    password === AUTH_CONFIG.DEV_CREDENTIALS.password
  )
}

/**
 * Check if access token is a development token
 * @param token - Access token to check
 * @returns true if token is development token
 */
export const isDevToken = (token: string): boolean => {
  return token === AUTH_CONFIG.SESSION.DEV_ACCESS_TOKEN
}

/**
 * Admin user roles
 */
export type AdminRole = 'super_admin' | 'product_manager' | 'editor' | 'viewer'

/**
 * Role hierarchy for permission checking
 * Higher number = more permissions
 */
export const ROLE_HIERARCHY: Record<AdminRole, number> = {
  super_admin: 4,
  product_manager: 3,
  editor: 2,
  viewer: 1,
}

/**
 * Check if a role has at least the permissions of another role
 * @param userRole - User's current role
 * @param requiredRole - Minimum required role
 * @returns true if user role is equal or higher than required role
 */
export const hasRolePermission = (
  userRole: AdminRole,
  requiredRole: AdminRole
): boolean => {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole]
}
