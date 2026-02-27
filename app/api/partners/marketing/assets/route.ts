/**
 * Partner Marketing Assets API
 *
 * GET - List marketing assets available to partners
 *
 * Partners can access assets with visibility: 'public', 'ambassadors', or 'partners'
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  getPartnerAssets,
  type AssetCategory,
} from '@/lib/marketing/asset-service';

export async function GET(request: NextRequest) {
  try {
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

    if (!partner) {
      return NextResponse.json(
        { error: 'Partner account not found' },
        { status: 403 }
      );
    }

    if (partner.status !== 'approved') {
      return NextResponse.json(
        { error: 'Partner account not approved' },
        { status: 403 }
      );
    }

    // Parse query params
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category') as AssetCategory | null;
    const search = searchParams.get('search');
    const limit = searchParams.get('limit');

    const assets = await getPartnerAssets({
      category: category || undefined,
      search: search || undefined,
      limit: limit ? parseInt(limit) : undefined,
    });

    return NextResponse.json({ assets });
  } catch (error) {
    console.error('Partner marketing assets GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
