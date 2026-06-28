import { NextRequest, NextResponse } from 'next/server';
import { listPublicOffers, type OfferSegment } from '@/lib/offers/public-read';

const VALID: OfferSegment[] = ['consumer', 'business', 'all'];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const raw = searchParams.get('segment') ?? 'all';
  if (!VALID.includes(raw as OfferSegment)) {
    return NextResponse.json({ error: `invalid segment: ${raw}` }, { status: 400 });
  }
  const offers = await listPublicOffers(raw as OfferSegment);
  return NextResponse.json({ offers });
}
