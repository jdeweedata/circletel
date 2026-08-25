import {
  isSupabaseDataApiUnavailable,
  DATA_API_UNAVAILABLE_CODE,
  DATA_API_UNAVAILABLE_MESSAGE,
} from '@/lib/auth/data-api-errors';

describe('isSupabaseDataApiUnavailable', () => {
  it('returns false for null/undefined and empty errors', () => {
    expect(isSupabaseDataApiUnavailable(null)).toBe(false);
    expect(isSupabaseDataApiUnavailable(undefined)).toBe(false);
    expect(isSupabaseDataApiUnavailable({})).toBe(false);
  });

  it('returns false for a genuine missing-row PostgREST error', () => {
    expect(
      isSupabaseDataApiUnavailable({
        code: 'PGRST116',
        message: 'JSON object requested, multiple (or no) rows returned',
      })
    ).toBe(false);
  });

  it('detects the Envoy/Istio 111 signature from a down PostgREST', () => {
    expect(
      isSupabaseDataApiUnavailable({
        message:
          'upstream connect error or disconnect/reset before headers. retried and the latest reset reason: remote connection failure, transport failure reason: delayed connect error: 111',
      })
    ).toBe(true);
  });

  it('detects HTTP 503 status or code', () => {
    expect(isSupabaseDataApiUnavailable({ status: 503, message: 'Service Unavailable' })).toBe(
      true
    );
    expect(isSupabaseDataApiUnavailable({ code: 503 })).toBe(true);
    expect(isSupabaseDataApiUnavailable({ code: '503' })).toBe(true);
  });

  it('detects connection refused', () => {
    expect(isSupabaseDataApiUnavailable({ message: 'connect ECONNREFUSED 127.0.0.1:443' })).toBe(
      true
    );
    expect(isSupabaseDataApiUnavailable({ message: 'Connection refused' })).toBe(true);
  });

  it('exports a stable user-facing message and code', () => {
    expect(DATA_API_UNAVAILABLE_CODE).toBe('DATA_API_UNAVAILABLE');
    expect(DATA_API_UNAVAILABLE_MESSAGE.toLowerCase()).toContain('not a password problem');
  });
});
