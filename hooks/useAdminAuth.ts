import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/integrations/supabase/client'

interface AdminUser {
  id: string
  email: string
  full_name: string
  role: 'super_admin' | 'product_manager' | 'editor' | 'viewer'
  permissions: Record<string, unknown>
  is_active: boolean
  last_login?: string
}

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
      // Development mode - check for test credentials first
      const isDev = process.env.NODE_ENV === 'development'
      if (isDev && email === 'admin@circletel.co.za' && password === 'admin123') {
        // Add a small delay to simulate network request
        await new Promise(resolve => setTimeout(resolve, 1000))

        const mockUser: AdminUser = {
          id: 'dev-admin-1',
          email: 'admin@circletel.co.za',
          full_name: 'Development Admin',
          role: 'super_admin',
          permissions: {},
          is_active: true,
          last_login: new Date().toISOString()
        }

        const mockSession = {
          access_token: 'dev-token-123',
          refresh_token: 'dev-refresh-123'
        }

        // Store auth session
        localStorage.setItem('admin_session', JSON.stringify(mockSession))
        localStorage.setItem('admin_user', JSON.stringify(mockUser))

        setState({
          user: mockUser,
          isLoading: false,
          error: null
        })

        return mockUser
      }

      // For non-dev credentials in dev mode, show appropriate error
      if (isDev) {
        throw new Error('Invalid credentials. Use: admin@circletel.co.za / admin123')
      }

      // Production mode - call the admin auth function
      const { data, error } = await supabase.functions.invoke('admin-auth', {
        body: { email, password },
        headers: { 'Content-Type': 'application/json' }
      })

      if (error) throw error

      if (!data.user) {
        throw new Error('Invalid credentials or insufficient privileges')
      }

      // Store auth session
      localStorage.setItem('admin_session', JSON.stringify(data.session))
      localStorage.setItem('admin_user', JSON.stringify(data.user))

      setState({
        user: data.user,
        isLoading: false,
        error: null
      })

      return data.user
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
      // Sign out from Supabase
      await supabase.auth.signOut()

      // Clear local storage
      localStorage.removeItem('admin_session')
      localStorage.removeItem('admin_user')

      setState({
        user: null,
        isLoading: false,
        error: null
      })
    } catch (err) {
      console.error('Logout error:', err)
      // Still clear state on logout error
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
      // Check for stored session
      const storedSession = localStorage.getItem('admin_session')
      const storedUser = localStorage.getItem('admin_user')

      if (!storedSession || !storedUser) {
        setState({
          user: null,
          isLoading: false,
          error: null
        })
        return
      }

      let session, user
      try {
        session = JSON.parse(storedSession)
        user = JSON.parse(storedUser)
      } catch (parseError) {
        // Invalid JSON in localStorage, clear it
        localStorage.removeItem('admin_session')
        localStorage.removeItem('admin_user')
        setState({
          user: null,
          isLoading: false,
          error: null
        })
        return
      }

      // Development mode - accept dev sessions without server validation
      const isDev = process.env.NODE_ENV === 'development'
      if (isDev && session.access_token === 'dev-token-123') {
        setState({
          user: user,
          isLoading: false,
          error: null
        })
        return
      }

      // Production mode - validate with server
      const { data, error } = await supabase.functions.invoke('admin-auth', {
        body: {},
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      })

      if (error || !data.valid) {
        // Session invalid, clear storage
        localStorage.removeItem('admin_session')
        localStorage.removeItem('admin_user')
        setState({
          user: null,
          isLoading: false,
          error: 'Session expired'
        })
        return
      }

      setState({
        user: data.user || user,
        isLoading: false,
        error: null
      })
    } catch (err) {
      console.error('Session validation error:', err)

      // In development mode, don't clear session on validation errors
      const isDev = process.env.NODE_ENV === 'development'
      if (isDev) {
        const storedUser = localStorage.getItem('admin_user')
        if (storedUser) {
          try {
            setState({
              user: JSON.parse(storedUser),
              isLoading: false,
              error: null
            })
            return
          } catch (parseError) {
            // Invalid JSON, clear it
            localStorage.removeItem('admin_user')
          }
        }
      }

      localStorage.removeItem('admin_session')
      localStorage.removeItem('admin_user')
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