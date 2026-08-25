/**
 * Detect Supabase Data API (PostgREST) infrastructure failures.
 *
 * Keep this file edge-safe: middleware imports it. Pure functions only.
 */

export const DATA_API_UNAVAILABLE_CODE = 'DATA_API_UNAVAILABLE';

export const DATA_API_UNAVAILABLE_MESSAGE =
  'Sign-in is temporarily unavailable because the admin directory cannot be reached. This is not a password problem — please try again in a few minutes.';

type MaybeDataApiError = {
  message?: string;
  code?: string | number;
  status?: number;
} | null | undefined;

/**
 * True when a Supabase `.from()` error is an infrastructure failure, not
 * "row not found". Login must not map these to HTTP 401 Invalid credentials.
 */
export function isSupabaseDataApiUnavailable(error: MaybeDataApiError): boolean {
  if (!error) return false;
  if (error.status === 503) return true;

  const code = String(error.code ?? '');
  if (code === '503') return true;

  const message = (error.message || '').toLowerCase();
  return (
    message.includes('upstream connect error') ||
    message.includes('delayed connect error') ||
    message.includes('econnrefused') ||
    message.includes('connection refused')
  );
}
