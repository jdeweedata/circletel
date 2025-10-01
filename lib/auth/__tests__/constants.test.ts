/**
 * Unit Tests for Auth Constants
 */

import {
  AUTH_CONFIG,
  isDevelopmentMode,
  isDevCredentials,
  isDevToken,
  ROLE_HIERARCHY,
  hasRolePermission,
  type AdminRole,
} from '../constants'

describe('AUTH_CONFIG', () => {
  it('should have correct development credentials', () => {
    expect(AUTH_CONFIG.DEV_CREDENTIALS.email).toBe('admin@circletel.co.za')
    expect(AUTH_CONFIG.DEV_CREDENTIALS.password).toBe('admin123')
  })

  it('should have storage keys defined', () => {
    expect(AUTH_CONFIG.STORAGE_KEYS.SESSION).toBe('admin_session')
    expect(AUTH_CONFIG.STORAGE_KEYS.USER).toBe('admin_user')
  })

  it('should have mock user with super_admin role', () => {
    expect(AUTH_CONFIG.MOCK_USER.role).toBe('super_admin')
    expect(AUTH_CONFIG.MOCK_USER.email).toBe('admin@circletel.co.za')
    expect(AUTH_CONFIG.MOCK_USER.is_active).toBe(true)
  })

  it('should have session tokens defined', () => {
    expect(AUTH_CONFIG.SESSION.DEV_ACCESS_TOKEN).toBe('dev-token-123')
    expect(AUTH_CONFIG.SESSION.DEV_REFRESH_TOKEN).toBe('dev-refresh-123')
  })
})

describe('isDevelopmentMode', () => {
  const originalEnv = process.env.NODE_ENV

  afterEach(() => {
    process.env.NODE_ENV = originalEnv
  })

  it('should return true in development mode', () => {
    process.env.NODE_ENV = 'development'
    expect(isDevelopmentMode()).toBe(true)
  })

  it('should return false in production mode', () => {
    process.env.NODE_ENV = 'production'
    expect(isDevelopmentMode()).toBe(false)
  })

  it('should return false in test mode', () => {
    process.env.NODE_ENV = 'test'
    expect(isDevelopmentMode()).toBe(false)
  })
})

describe('isDevCredentials', () => {
  it('should return true for valid dev credentials', () => {
    expect(isDevCredentials('admin@circletel.co.za', 'admin123')).toBe(true)
  })

  it('should return false for invalid email', () => {
    expect(isDevCredentials('wrong@circletel.co.za', 'admin123')).toBe(false)
  })

  it('should return false for invalid password', () => {
    expect(isDevCredentials('admin@circletel.co.za', 'wrong')).toBe(false)
  })

  it('should return false for empty credentials', () => {
    expect(isDevCredentials('', '')).toBe(false)
  })
})

describe('isDevToken', () => {
  it('should return true for dev access token', () => {
    expect(isDevToken('dev-token-123')).toBe(true)
  })

  it('should return false for other tokens', () => {
    expect(isDevToken('prod-token-456')).toBe(false)
    expect(isDevToken('')).toBe(false)
  })
})

describe('ROLE_HIERARCHY', () => {
  it('should have correct hierarchy order', () => {
    expect(ROLE_HIERARCHY.super_admin).toBeGreaterThan(
      ROLE_HIERARCHY.product_manager
    )
    expect(ROLE_HIERARCHY.product_manager).toBeGreaterThan(ROLE_HIERARCHY.editor)
    expect(ROLE_HIERARCHY.editor).toBeGreaterThan(ROLE_HIERARCHY.viewer)
  })

  it('should have all roles defined', () => {
    expect(ROLE_HIERARCHY).toHaveProperty('super_admin')
    expect(ROLE_HIERARCHY).toHaveProperty('product_manager')
    expect(ROLE_HIERARCHY).toHaveProperty('editor')
    expect(ROLE_HIERARCHY).toHaveProperty('viewer')
  })
})

describe('hasRolePermission', () => {
  it('should allow same role', () => {
    expect(hasRolePermission('editor', 'editor')).toBe(true)
  })

  it('should allow higher role', () => {
    expect(hasRolePermission('super_admin', 'viewer')).toBe(true)
    expect(hasRolePermission('product_manager', 'editor')).toBe(true)
  })

  it('should deny lower role', () => {
    expect(hasRolePermission('viewer', 'super_admin')).toBe(false)
    expect(hasRolePermission('editor', 'product_manager')).toBe(false)
  })

  it('should handle super_admin correctly', () => {
    const roles: AdminRole[] = ['viewer', 'editor', 'product_manager', 'super_admin']
    roles.forEach(role => {
      expect(hasRolePermission('super_admin', role)).toBe(true)
    })
  })

  it('should handle viewer correctly', () => {
    expect(hasRolePermission('viewer', 'viewer')).toBe(true)
    expect(hasRolePermission('viewer', 'editor')).toBe(false)
    expect(hasRolePermission('viewer', 'product_manager')).toBe(false)
    expect(hasRolePermission('viewer', 'super_admin')).toBe(false)
  })
})
