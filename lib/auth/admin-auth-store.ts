/**
 * Admin Auth Store (Zustand)
 *
 * State machine-based authentication store for admin users.
 * Replaces complex hook logic with clear state transitions.
 *
 * States:
 * - idle: Initial state, no authentication attempted
 * - checking: Validating session or performing login
 * - authenticated: User is logged in with valid session
 * - error: Authentication failed with an error
 *
 * @example
 * // In a component
 * const { user, state, login, logout } = useAdminAuthStore()
 *
 * if (state === 'checking') return <LoadingSpinner />
 * if (state === 'error') return <LoginForm error={error} />
 * if (state === 'authenticated') return <Dashboard user={user} />
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { SessionStorage, type AdminUser } from './session-storage';
import { DevAuthService } from './dev-auth-service';
import { ProdAuthService } from './prod-auth-service';
import { isDevelopmentMode } from './constants';
import type { Permission } from '@/lib/rbac/permissions';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Authentication state machine states
 */
export type AuthState = 'idle' | 'checking' | 'authenticated' | 'error';

/**
 * Auth store state
 */
export interface AdminAuthState {
  /** Current auth state */
  state: AuthState;
  /** Authenticated user or null */
  user: AdminUser | null;
  /** Error message if state is 'error' */
  error: string | null;
  /** Timestamp of last successful auth check */
  lastChecked: number | null;
}

/**
 * Auth store actions
 */
export interface AdminAuthActions {
  /** Login with email and password */
  login: (email: string, password: string) => Promise<AdminUser>;
  /** Logout current user */
  logout: () => Promise<void>;
  /** Validate existing session from storage */
  validateSession: () => Promise<void>;
  /** Check if user has a specific permission */
  hasPermission: (permission: Permission | string) => boolean;
  /** Check if user has any of the specified permissions */
  hasAnyPermission: (permissions: (Permission | string)[]) => boolean;
  /** Check if user has all of the specified permissions */
  hasAllPermissions: (permissions: (Permission | string)[]) => boolean;
  /** Clear error state */
  clearError: () => void;
  /** Reset store to initial state */
  reset: () => void;
}

// ============================================================================
// INITIAL STATE
// ============================================================================

const initialState: AdminAuthState = {
  state: 'idle',
  user: null,
  error: null,
  lastChecked: null,
};

// ============================================================================
// LOGGING (dev only)
// ============================================================================

const log = {
  debug: (msg: string, ctx?: object) => {
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.log(`[AdminAuthStore] ${msg}`, ctx || '');
    }
  },
  error: (msg: string, ctx?: object) => {
    // eslint-disable-next-line no-console
    console.error(`[AdminAuthStore] ${msg}`, ctx || '');
  },
};

// ============================================================================
// STORE
// ============================================================================

export const useAdminAuthStore = create<AdminAuthState & AdminAuthActions>()(
  devtools(
    (set, get) => ({
      ...initialState,

      // ========================================
      // LOGIN
      // ========================================
      login: async (email: string, password: string): Promise<AdminUser> => {
        log.debug('Login attempt', { email });
        set({ state: 'checking', error: null });

        try {
          let user: AdminUser;
          let session: { access_token: string; expires_at: number };

          if (isDevelopmentMode()) {
            // Development mode - use DevAuthService
            if (!DevAuthService.isValidDevCredentials(email, password)) {
              throw new Error('Invalid credentials. Use: admin@circletel.co.za / admin123');
            }
            const result = await DevAuthService.mockLogin(email, password);
            user = result.user;
            session = result.session;
          } else {
            // Production mode - use ProdAuthService
            const result = await ProdAuthService.login(email, password);
            user = result.user;
            session = result.session;
          }

          // Save session to storage
          SessionStorage.saveSession(session, user);

          // Transition to authenticated state
          set({
            state: 'authenticated',
            user,
            error: null,
            lastChecked: Date.now(),
          });

          log.debug('Login successful', { email: user.email, role: user.role });
          return user;
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'Login failed';
          log.error('Login failed', { email, error: errorMessage });

          set({
            state: 'error',
            user: null,
            error: errorMessage,
          });

          throw new Error(errorMessage);
        }
      },

      // ========================================
      // LOGOUT
      // ========================================
      logout: async (): Promise<void> => {
        log.debug('Logout initiated');
        set({ state: 'checking' });

        try {
          // Sign out from Supabase in production mode
          if (!isDevelopmentMode()) {
            await ProdAuthService.logout();
          }

          // Clear session storage
          SessionStorage.clearSession();

          // Transition to idle state
          set({
            state: 'idle',
            user: null,
            error: null,
            lastChecked: null,
          });

          log.debug('Logout successful');
        } catch (err) {
          log.error('Logout error', { error: err instanceof Error ? err.message : String(err) });

          // Still clear state on logout error
          SessionStorage.clearSession();
          set({
            state: 'idle',
            user: null,
            error: null,
            lastChecked: null,
          });
        }
      },

      // ========================================
      // VALIDATE SESSION
      // ========================================
      validateSession: async (): Promise<void> => {
        const { state } = get();

        // Skip if already checking or authenticated
        if (state === 'checking') {
          log.debug('Already checking session, skipping');
          return;
        }

        log.debug('Validating session');
        set({ state: 'checking', error: null });

        try {
          // Check for stored session in localStorage
          const stored = SessionStorage.getSession();

          if (!stored) {
            log.debug('No session found in storage');
            set({
              state: 'idle',
              user: null,
              error: null,
            });
            return;
          }

          log.debug('Found session', {
            email: stored.user.email,
            role: stored.user.role,
            hasPermissions: !!stored.user.permissions,
          });

          // In production, trust the localStorage session
          // The cookie-based SSR auth handles server-side validation
          set({
            state: 'authenticated',
            user: stored.user,
            error: null,
            lastChecked: Date.now(),
          });
        } catch (err) {
          log.error('Session validation error', { error: err instanceof Error ? err.message : String(err) });

          SessionStorage.clearSession();
          set({
            state: 'error',
            user: null,
            error: 'Session validation failed',
          });
        }
      },

      // ========================================
      // PERMISSION CHECKING
      // ========================================
      hasPermission: (permission: Permission | string): boolean => {
        const { user } = get();

        if (!user) return false;

        // Super admin has all permissions
        if (user.role === 'super_admin') return true;

        // Check specific permission
        return user.permissions?.[permission] === true;
      },

      hasAnyPermission: (permissions: (Permission | string)[]): boolean => {
        const { user, hasPermission } = get();

        if (!user) return false;
        if (user.role === 'super_admin') return true;

        return permissions.some((p) => hasPermission(p));
      },

      hasAllPermissions: (permissions: (Permission | string)[]): boolean => {
        const { user, hasPermission } = get();

        if (!user) return false;
        if (user.role === 'super_admin') return true;

        return permissions.every((p) => hasPermission(p));
      },

      // ========================================
      // UTILITY
      // ========================================
      clearError: () => {
        set({ error: null });
      },

      reset: () => {
        SessionStorage.clearSession();
        set(initialState);
      },
    }),
    { name: 'AdminAuth' }
  )
);

// ============================================================================
// SELECTORS
// ============================================================================

/** Check if auth state is loading */
export const selectIsLoading = (state: AdminAuthState) => state.state === 'checking';

/** Check if user is authenticated */
export const selectIsAuthenticated = (state: AdminAuthState) => state.state === 'authenticated';

/** Check if there's an error */
export const selectHasError = (state: AdminAuthState) => state.state === 'error';

/** Get user role */
export const selectUserRole = (state: AdminAuthState) => state.user?.role ?? null;

/** Check if user can approve (super_admin or product_manager) */
export const selectCanApprove = (state: AdminAuthState) =>
  state.user?.role === 'super_admin' || state.user?.role === 'product_manager';

/** Check if user can edit (not a viewer) */
export const selectCanEdit = (state: AdminAuthState) => state.user?.role !== 'viewer';

// ============================================================================
// HOOK WRAPPER (for backwards compatibility)
// ============================================================================

/**
 * Hook wrapper for the auth store
 * Provides backwards compatibility with the old useAdminAuth hook
 */
export function useAdminAuthFromStore() {
  const store = useAdminAuthStore();

  return {
    user: store.user,
    isLoading: store.state === 'checking',
    error: store.error,
    login: store.login,
    logout: store.logout,
    validateSession: store.validateSession,
    hasPermission: store.hasPermission,
    canApprove: () => selectCanApprove(store),
    canEdit: () => selectCanEdit(store),
  };
}
