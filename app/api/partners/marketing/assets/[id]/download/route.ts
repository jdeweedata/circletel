/**
 * Partner Asset Download Tracking API
 *
 * POST /api/partners/marketing/assets/[id]/download
 *
 * Tracks when a partner downloads an asset
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { trackDownload, getAssetById } from '@/lib/marketing/asset-service';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();

    // Verify authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is a partner
    const { data: partner } = await supabase
      .from('partners')
      .select('id, status')
      .eq('user_id', user.id)
      .single();

    if (!partner || partner.status !== 'approved') {
      return NextResponse.json(
        { error: 'Partner account not approved' },
        { status: 403 }
      );
    }

    // Check if asset exists
    const asset = await getAssetById(id);
    if (!asset) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
    }

    // Check if partner can access this asset
    const allowedVisibility = ['public', 'ambassadors', 'partners'];
    if (!allowedVisibility.includes(asset.visibility)) {
      return NextResponse.json(
        { error: 'Asset not accessible' },
        { status: 403 }
      );
    }

    // Track the download
    await trackDownload(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Partner asset download tracking error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
