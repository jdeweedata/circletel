'use client'

import { useState, useEffect, useCallback } from 'react'
import { SessionStorage, type AdminUser } from '@/lib/auth/session-storage'
import { DevAuthService } from '@/lib/auth/dev-auth-service'
import { ProdAuthService } from '@/lib/auth/prod-auth-service'
import { isDevelopmentMode } from '@/lib/auth/constants'

interface AdminAuthState {
  user: AdminUser | null
  isLoading: boolean
  error: string | null
}

export function useAdminAuth() {
  const [state, setState] = useState<AdminAuthState>({
    user: null,
    isLoading: true,
    error: null
  })

  const login = useCallback(async (email: string, password: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      // Development mode - use DevAuthService
      if (isDevelopmentMode()) {
        if (!DevAuthService.isValidDevCredentials(email, password)) {
          throw new Error('Invalid credentials. Use: admin@circletel.co.za / admin123')
        }

        const { user, session } = await DevAuthService.mockLogin(email, password)
        SessionStorage.saveSession(session, user)

        setState({
          user,
          isLoading: false,
          error: null
        })

        return user
      }

      // Production mode - use ProdAuthService
      const { user, session } = await ProdAuthService.login(email, password)
      SessionStorage.saveSession(session, user)

      setState({
        user,
        isLoading: false,
        error: null
      })

      return user
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed'
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage
      }))
      throw new Error(errorMessage)
    }
  }, [])

  const logout = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true }))

    try {
      // Sign out from Supabase in production mode
      if (!isDevelopmentMode()) {
        await ProdAuthService.logout()
      }

      // Clear session storage
      SessionStorage.clearSession()

      setState({
        user: null,
        isLoading: false,
        error: null
      })
    } catch (err) {
      console.error('Logout error:', err)
      // Still clear state on logout error
      SessionStorage.clearSession()
      setState({
        user: null,
        isLoading: false,
        error: null
      })
    }
  }, [])

  const validateSession = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true }))

    try {
      // Check for stored session in localStorage
      const stored = SessionStorage.getSession()

      if (!stored) {
        console.log('[useAdminAuth] No session found in localStorage')
        setState({
          user: null,
          isLoading: false,
          error: null
        })
        return
      }

      console.log('[useAdminAuth] Found session in localStorage:', {
        email: stored.user.email,
        role: stored.user.role,
        hasPermissions: !!stored.user.permissions
      })

      // In production, trust the localStorage session (it was set by the API login)
      // The cookie-based SSR auth handles server-side validation
      setState({
        user: stored.user,
        isLoading: false,
        error: null
      })
    } catch (err) {
      console.error('[useAdminAuth] Session validation error:', err)
      SessionStorage.clearSession()
      setState({
        user: null,
        isLoading: false,
        error: 'Session validation failed'
      })
    }
  }, [])

  const hasPermission = useCallback((permission: string) => {
    if (!state.user) return false

    // Super admin has all permissions
    if (state.user.role === 'super_admin') return true

    // Check specific permissions
    return state.user.permissions?.[permission] === true
  }, [state.user])

  const canApprove = useCallback(() => {
    return state.user?.role === 'super_admin' || state.user?.role === 'product_manager'
  }, [state.user])

  const canEdit = useCallback(() => {
    return state.user?.role !== 'viewer'
  }, [state.user])

  // Initialize session on mount
  useEffect(() => {
    validateSession()
  }, [validateSession])

  return {
    user: state.user,
    isLoading: state.isLoading,
    error: state.error,
    login,
    logout,
    validateSession,
    hasPermission,
    canApprove,
    canEdit
  }
}