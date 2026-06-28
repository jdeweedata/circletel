import { NextRequest, NextResponse } from 'next/server';
import { getPublicOfferBySlug } from '@/lib/offers/public-read';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> },
) {
  const { slug } = await context.params;
  const offer = await getPublicOfferBySlug(slug);
  if (!offer) {
    return NextResponse.json({ error: 'offer not found' }, { status: 404 });
  }
  return NextResponse.json({ offer });
}
