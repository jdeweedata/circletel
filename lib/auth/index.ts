/**
 * Auth Module Exports
 *
 * Central export point for all authentication and authorization utilities.
 */

// Session storage
export { SessionStorage, type AdminUser } from './session-storage';

// Auth services
export { DevAuthService } from './dev-auth-service';
export { ProdAuthService } from './prod-auth-service';
export { isDevelopmentMode } from './constants';

// Auth store (Zustand)
export {
  useAdminAuthStore,
  useAdminAuthFromStore,
  type AuthState,
  type AdminAuthState,
  type AdminAuthActions,
  selectIsLoading,
  selectIsAuthenticated,
  selectHasError,
  selectUserRole,
  selectCanApprove,
  selectCanEdit,
} from './admin-auth-store';

// Permission checker utilities
export {
  canAccess,
  canAccessAny,
  canAccessAll,
  hasRoleLevel,
  isSuperAdmin,
  canApprove,
  canEdit,
  can,
  checkPermission,
  checkPermissions,
  type PermissionGuardResult,
} from './permission-checker';
