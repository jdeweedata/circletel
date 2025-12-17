/**
 * Admin API Client
 * Client-side utility for making authenticated API requests to admin endpoints.
 * Automatically includes the Bearer token from localStorage.
 */

import { SessionStorage } from './session-storage';

export interface AdminFetchOptions extends RequestInit {
  /** Skip authentication header (for unauthenticated endpoints) */
  skipAuth?: boolean;
}

/**
 * Make an authenticated fetch request to an admin API endpoint.
 * Automatically includes the Authorization header with the access token.
 *
 * @param url - The URL to fetch
 * @param options - Fetch options (extends RequestInit)
 * @returns The fetch Response
 *
 * @example
 * ```typescript
 * const response = await adminFetch('/api/admin/field-ops');
 * if (!response.ok) {
 *   throw new Error('Failed to fetch');
 * }
 * const data = await response.json();
 * ```
 */
export async function adminFetch(
  url: string,
  options: AdminFetchOptions = {}
): Promise<Response> {
  const { skipAuth = false, headers: customHeaders, ...fetchOptions } = options;

  const headers = new Headers(customHeaders);

  // Add Authorization header if not skipped
  if (!skipAuth) {
    const accessToken = SessionStorage.getAccessToken();
    if (accessToken) {
      headers.set('Authorization', `Bearer ${accessToken}`);
    }
  }

  // Set default Content-Type for JSON bodies
  if (
    fetchOptions.body &&
    typeof fetchOptions.body === 'string' &&
    !headers.has('Content-Type')
  ) {
    headers.set('Content-Type', 'application/json');
  }

  return fetch(url, {
    ...fetchOptions,
    headers,
  });
}

/**
 * Make an authenticated GET request
 */
export async function adminGet<T>(url: string): Promise<T> {
  const response = await adminFetch(url);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || error.message || `HTTP ${response.status}`);
  }

  return response.json();
}

/**
 * Make an authenticated POST request
 */
export async function adminPost<T>(url: string, body?: unknown): Promise<T> {
  const response = await adminFetch(url, {
    method: 'POST',
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || error.message || `HTTP ${response.status}`);
  }

  return response.json();
}

/**
 * Make an authenticated PUT request
 */
export async function adminPut<T>(url: string, body?: unknown): Promise<T> {
  const response = await adminFetch(url, {
    method: 'PUT',
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || error.message || `HTTP ${response.status}`);
  }

  return response.json();
}

/**
 * Make an authenticated DELETE request
 */
export async function adminDelete<T>(url: string): Promise<T> {
  const response = await adminFetch(url, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || error.message || `HTTP ${response.status}`);
  }

  return response.json();
}
