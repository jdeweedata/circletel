import { describe, it, expect } from '@jest/globals';
import CoverageCheckPage from '@/app/coverage-check/page';

// Extract URL from Next.js redirect error digest format: "NEXT_REDIRECT;replace;/<url>;307;"
function extractRedirectUrl(error: unknown): string | null {
  if (error instanceof Error && error.message === 'NEXT_REDIRECT') {
    const digest = (error as any).digest;
    if (typeof digest === 'string' && digest.startsWith('NEXT_REDIRECT;')) {
      // Format: "NEXT_REDIRECT;replace;/<url>;307;"
      const parts = digest.split(';');
      return parts[2] || null;
    }
  }
  return null;
}

describe('coverage-check offer attribution', () => {
  it('carries ?offer through to the homepage coverage checker', async () => {
    let redirectUrl: string | null = null;
    try {
      await CoverageCheckPage({ searchParams: Promise.resolve({ offer: 'sky-50' }) });
    } catch (error) {
      redirectUrl = extractRedirectUrl(error);
    }
    expect(redirectUrl).toBe('/?offer=sky-50');
  });

  it('still maps a plan alias when present (no regression)', async () => {
    let redirectUrl: string | null = null;
    try {
      await CoverageCheckPage({ searchParams: Promise.resolve({ plan: 'plus' }) });
    } catch (error) {
      redirectUrl = extractRedirectUrl(error);
    }
    expect(redirectUrl).toBe('/packages?plan=skyfibre-home-plus');
  });

  it('falls back to homepage with neither param', async () => {
    let redirectUrl: string | null = null;
    try {
      await CoverageCheckPage({ searchParams: Promise.resolve({}) });
    } catch (error) {
      redirectUrl = extractRedirectUrl(error);
    }
    expect(redirectUrl).toBe('/');
  });
});
