import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { NextRequest } from 'next/server';

// ts-jest does not reliably hoist and bind factory mocks with @/-aliased ESM-interop modules.
// Use jest.resetModules() + dynamic import() in beforeEach to ensure a fresh, correctly-bound mock per test.
jest.mock('@/lib/offers/public-read');

describe('GET /api/offers', () => {
  let listPublicOffers: any;
  let GET: any;
  const req = (url: string) => new NextRequest(new URL(url, 'http://localhost'));

  beforeEach(async () => {
    jest.resetModules();
    jest.clearAllMocks();

    const publicRead = await import('@/lib/offers/public-read');
    listPublicOffers = publicRead.listPublicOffers;

    const route = await import('@/app/api/offers/route');
    GET = route.GET;
  });

  it('returns offers for a valid segment', async () => {
    jest.mocked(listPublicOffers).mockResolvedValueOnce([{ slug: 's', priceInclVat: 100 }]);
    const res = await GET(req('/api/offers?segment=consumer'));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ offers: [{ slug: 's', priceInclVat: 100 }] });
  });

  it('defaults to segment=all when omitted', async () => {
    jest.mocked(listPublicOffers).mockResolvedValueOnce([]);
    await GET(req('/api/offers'));
    expect(jest.mocked(listPublicOffers)).toHaveBeenCalledWith('all');
  });

  it('400s on an invalid segment', async () => {
    const res = await GET(req('/api/offers?segment=bogus'));
    expect(res.status).toBe(400);
    expect(jest.mocked(listPublicOffers)).not.toHaveBeenCalled();
  });
});
