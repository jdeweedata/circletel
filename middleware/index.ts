/**
 * Middleware Handlers
 *
 * Exports all middleware handler modules for use in the main middleware.
 */

export {
  handleSubdomainRouting,
  isSubdomainRequest,
} from './subdomain-handler';

export {
  createMiddlewareSupabaseClient,
  type MiddlewareSupabaseResult,
} from './supabase-client';

export {
  handleAdminAuth,
  isAdminRoute,
  isPublicAdminRoute,
  getSessionUser,
  type AdminAuthResult,
} from './admin-auth';
