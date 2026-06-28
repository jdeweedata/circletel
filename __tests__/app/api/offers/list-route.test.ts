import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { NextRequest } from 'next/server';

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
    (listPublicOffers as any).mockResolvedValueOnce([{ slug: 's', priceInclVat: 100 }]);
    const res = await GET(req('/api/offers?segment=consumer'));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ offers: [{ slug: 's', priceInclVat: 100 }] });
  });

  it('defaults to segment=all when omitted', async () => {
    (listPublicOffers as any).mockResolvedValueOnce([]);
    await GET(req('/api/offers'));
    expect((listPublicOffers as any)).toHaveBeenCalledWith('all');
  });

  it('400s on an invalid segment', async () => {
    const res = await GET(req('/api/offers?segment=bogus'));
    expect(res.status).toBe(400);
  });
});
