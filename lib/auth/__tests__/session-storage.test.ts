/**
 * Unit Tests for Session Storage
 */

import {
  SessionStorage,
  SessionStorageError,
  type AdminSession,
  type AdminUser,
} from '../session-storage'
import { AUTH_CONFIG } from '../constants'

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    },
  }
})()

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

describe('SessionStorage', () => {
  const mockSession: AdminSession = {
    access_token: 'test-token',
    refresh_token: 'test-refresh',
    expires_at: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
    expires_in: 3600,
  }

  const mockUser: AdminUser = {
    id: 'test-id',
    email: 'test@example.com',
    full_name: 'Test User',
    role: 'product_manager',
    permissions: { products: true },
    is_active: true,
    last_login: new Date().toISOString(),
  }

  beforeEach(() => {
    localStorageMock.clear()
    jest.clearAllMocks()
  })

  describe('saveSession', () => {
    it('should save session and user to localStorage', () => {
      SessionStorage.saveSession(mockSession, mockUser)

      const savedSession = localStorage.getItem(AUTH_CONFIG.STORAGE_KEYS.SESSION)
      const savedUser = localStorage.getItem(AUTH_CONFIG.STORAGE_KEYS.USER)

      expect(savedSession).toBe(JSON.stringify(mockSession))
      expect(savedUser).toBe(JSON.stringify(mockUser))
    })

    it('should throw SessionStorageError on localStorage failure', () => {
      // Mock localStorage.setItem to throw
      const originalSetItem = localStorage.setItem
      localStorage.setItem = jest.fn(() => {
        throw new Error('Storage quota exceeded')
      })

      expect(() => {
        SessionStorage.saveSession(mockSession, mockUser)
      }).toThrow(SessionStorageError)

      localStorage.setItem = originalSetItem
    })
  })

  describe('getSession', () => {
    it('should retrieve saved session', () => {
      SessionStorage.saveSession(mockSession, mockUser)
      const retrieved = SessionStorage.getSession()

      expect(retrieved).toEqual({
        session: mockSession,
        user: mockUser,
      })
    })

    it('should return null if no session exists', () => {
      const retrieved = SessionStorage.getSession()
      expect(retrieved).toBeNull()
    })

    it('should return null if session is corrupted', () => {
      localStorage.setItem(AUTH_CONFIG.STORAGE_KEYS.SESSION, 'invalid json')
      localStorage.setItem(AUTH_CONFIG.STORAGE_KEYS.USER, JSON.stringify(mockUser))

      const retrieved = SessionStorage.getSession()
      expect(retrieved).toBeNull()

      // Should also clear corrupted data
      expect(localStorage.getItem(AUTH_CONFIG.STORAGE_KEYS.SESSION)).toBeNull()
      expect(localStorage.getItem(AUTH_CONFIG.STORAGE_KEYS.USER)).toBeNull()
    })

    it('should return null if only session exists', () => {
      localStorage.setItem(
        AUTH_CONFIG.STORAGE_KEYS.SESSION,
        JSON.stringify(mockSession)
      )

      const retrieved = SessionStorage.getSession()
      expect(retrieved).toBeNull()
    })

    it('should return null if only user exists', () => {
      localStorage.setItem(AUTH_CONFIG.STORAGE_KEYS.USER, JSON.stringify(mockUser))

      const retrieved = SessionStorage.getSession()
      expect(retrieved).toBeNull()
    })
  })

  describe('clearSession', () => {
    it('should clear all session data', () => {
      SessionStorage.saveSession(mockSession, mockUser)
      SessionStorage.clearSession()

      expect(localStorage.getItem(AUTH_CONFIG.STORAGE_KEYS.SESSION)).toBeNull()
      expect(localStorage.getItem(AUTH_CONFIG.STORAGE_KEYS.USER)).toBeNull()
    })

    it('should not throw if nothing to clear', () => {
      expect(() => {
        SessionStorage.clearSession()
      }).not.toThrow()
    })
  })

  describe('hasValidSession', () => {
    it('should return true for valid non-expired session', () => {
      SessionStorage.saveSession(mockSession, mockUser)
      expect(SessionStorage.hasValidSession()).toBe(true)
    })

    it('should return false if no session exists', () => {
      expect(SessionStorage.hasValidSession()).toBe(false)
    })

    it('should return false for expired session', () => {
      const expiredSession = {
        ...mockSession,
        expires_at: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
      }

      SessionStorage.saveSession(expiredSession, mockUser)
      expect(SessionStorage.hasValidSession()).toBe(false)

      // Should clear expired session
      expect(SessionStorage.getSession()).toBeNull()
    })

    it('should return true for session without expiry', () => {
      const noExpirySession = {
        access_token: 'test-token',
        refresh_token: 'test-refresh',
      }

      SessionStorage.saveSession(noExpirySession, mockUser)
      expect(SessionStorage.hasValidSession()).toBe(true)
    })
  })

  describe('getAccessToken', () => {
    it('should return access token from stored session', () => {
      SessionStorage.saveSession(mockSession, mockUser)
      expect(SessionStorage.getAccessToken()).toBe(mockSession.access_token)
    })

    it('should return null if no session exists', () => {
      expect(SessionStorage.getAccessToken()).toBeNull()
    })
  })

  describe('getUser', () => {
    it('should return user from stored session', () => {
      SessionStorage.saveSession(mockSession, mockUser)
      expect(SessionStorage.getUser()).toEqual(mockUser)
    })

    it('should return null if no session exists', () => {
      expect(SessionStorage.getUser()).toBeNull()
    })
  })

  describe('updateUser', () => {
    it('should update user data while keeping session', () => {
      SessionStorage.saveSession(mockSession, mockUser)

      const updatedUser: AdminUser = {
        ...mockUser,
        full_name: 'Updated Name',
      }

      SessionStorage.updateUser(updatedUser)

      const stored = SessionStorage.getSession()
      expect(stored?.user.full_name).toBe('Updated Name')
      expect(stored?.session).toEqual(mockSession)
    })

    it('should throw if no session exists', () => {
      const updatedUser: AdminUser = {
        ...mockUser,
        full_name: 'Updated Name',
      }

      expect(() => {
        SessionStorage.updateUser(updatedUser)
      }).toThrow(SessionStorageError)
    })
  })

  describe('isSessionExpiringSoon', () => {
    it('should return true if session expires within 5 minutes', () => {
      const soonExpiring = {
        ...mockSession,
        expires_at: Math.floor(Date.now() / 1000) + 240, // 4 minutes from now
      }

      SessionStorage.saveSession(soonExpiring, mockUser)
      expect(SessionStorage.isSessionExpiringSoon()).toBe(true)
    })

    it('should return false if session expires later', () => {
      const laterExpiring = {
        ...mockSession,
        expires_at: Math.floor(Date.now() / 1000) + 600, // 10 minutes from now
      }

      SessionStorage.saveSession(laterExpiring, mockUser)
      expect(SessionStorage.isSessionExpiringSoon()).toBe(false)
    })

    it('should return false if no expiry set', () => {
      const noExpiry = {
        access_token: 'test-token',
        refresh_token: 'test-refresh',
      }

      SessionStorage.saveSession(noExpiry, mockUser)
      expect(SessionStorage.isSessionExpiringSoon()).toBe(false)
    })
  })

  describe('getTimeUntilExpiry', () => {
    it('should return seconds until expiry', () => {
      const expiresIn = 3600
      const expiringSession = {
        ...mockSession,
        expires_at: Math.floor(Date.now() / 1000) + expiresIn,
      }

      SessionStorage.saveSession(expiringSession, mockUser)
      const remaining = SessionStorage.getTimeUntilExpiry()

      expect(remaining).toBeGreaterThan(3590)
      expect(remaining).toBeLessThanOrEqual(3600)
    })

    it('should return 0 for expired session', () => {
      const expired = {
        ...mockSession,
        expires_at: Math.floor(Date.now() / 1000) - 100,
      }

      SessionStorage.saveSession(expired, mockUser)
      expect(SessionStorage.getTimeUntilExpiry()).toBe(0)
    })

    it('should return null if no expiry set', () => {
      const noExpiry = {
        access_token: 'test-token',
        refresh_token: 'test-refresh',
      }

      SessionStorage.saveSession(noExpiry, mockUser)
      expect(SessionStorage.getTimeUntilExpiry()).toBeNull()
    })
  })
})
