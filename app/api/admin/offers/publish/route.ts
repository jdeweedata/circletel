import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdmin } from '@/lib/auth/admin-api-auth';
import { unifiedProductAggregator } from '@/lib/services/unified-product-aggregator';
import { publishFromUnified } from '@/lib/offers/publisher';
import { inngest } from '@/lib/inngest/client';

/**
 * POST /api/admin/offers/publish
 *
 * Publishes UnifiedProducts into Offers via the publisher.
 *
 * Request body:
 * - uid?: string — Publish single product by UID
 * - all?: boolean — Publish all active products and fire pricing.recompute event
 *
 * Returns: { success: boolean, published: number, offerIds: string[] }
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  // Authenticate first (REQUIRED for this endpoint)
  const authResult = await authenticateAdmin(request);
  if (!authResult.success) return authResult.response;

  // Role-gate: only super_admin and product_manager can publish offers
  if (!['super_admin', 'product_manager'].includes(authResult.adminUser.role)) {
    return NextResponse.json(
      { success: false, error: 'Forbidden' },
      { status: 403 }
    );
  }

  try {
    const body = await request.json().catch(() => ({}));
    const uid: string | undefined = body.uid;
    const all: boolean = body.all === true;

    const offerIds: string[] = [];

    if (uid) {
      // Single product path: use aggregateOne for efficiency
      const product = await unifiedProductAggregator.aggregateOne(uid);
      if (!product) {
        return NextResponse.json(
          { success: false, error: `uid not found: ${uid}` },
          { status: 404 }
        );
      }
      offerIds.push(await publishFromUnified(product));
    } else if (all) {
      // All active products path
      const { products } = await unifiedProductAggregator.aggregateAll({
        status: 'active',
        page: 1,
        perPage: 1000,
      });
      const failedUids: string[] = [];
      for (const p of products) {
        try {
          offerIds.push(await publishFromUnified(p));
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          console.error(`[offers/publish] Failed to publish ${p.uid}: ${message}`);
          failedUids.push(p.uid);
        }
      }
      // Fire recompute event for pricing updates
      await inngest.send({
        name: 'offer/pricing.recompute.requested',
        data: { all: true, triggeredBy: 'manual' },
      });
      return NextResponse.json({
        success: failedUids.length === 0,
        published: offerIds.length,
        offerIds,
        failedUids: failedUids.length > 0 ? failedUids : undefined,
      });
    } else {
      return NextResponse.json(
        { success: false, error: 'provide uid or all:true' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      published: offerIds.length,
      offerIds,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
