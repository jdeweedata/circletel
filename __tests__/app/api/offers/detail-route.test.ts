import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { NextRequest } from 'next/server';

// ts-jest does not reliably hoist and bind factory mocks with @/-aliased ESM-interop modules.
// Use jest.resetModules() + dynamic import() in beforeEach to ensure a fresh, correctly-bound mock per test.
jest.mock('@/lib/offers/public-read');

describe('GET /api/offers/[slug]', () => {
  let getPublicOfferBySlug: any;
  let GET: any;
  const ctx = (slug: string) => ({ params: Promise.resolve({ slug }) });
  const req = new NextRequest(new URL('http://localhost/api/offers/x'));

  beforeEach(async () => {
    jest.resetModules();
    jest.clearAllMocks();

    const publicRead = await import('@/lib/offers/public-read');
    getPublicOfferBySlug = publicRead.getPublicOfferBySlug;

    const route = await import('@/app/api/offers/[slug]/route');
    GET = route.GET;
  });

  it('returns the offer when found', async () => {
    jest.mocked(getPublicOfferBySlug).mockResolvedValueOnce({ slug: 'sky-50', priceInclVat: 2183.85 });
    const res = await GET(req, ctx('sky-50'));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ offer: { slug: 'sky-50', priceInclVat: 2183.85 } });
  });

  it('404s when not found / excluded', async () => {
    jest.mocked(getPublicOfferBySlug).mockResolvedValueOnce(null);
    const res = await GET(req, ctx('nope'));
    expect(res.status).toBe(404);
  });
});
