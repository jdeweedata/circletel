/**
 * Admin KYC Document URL API Route
 * Returns signed URL for viewing KYC documents
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { authenticateAdmin } from '@/lib/auth/admin-api-auth';
import { apiLogger } from '@/lib/logging/logger';

export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateAdmin(request);
    if (!authResult.success) return authResult.response;

    // Use service role key for admin access
    const supabase = await createServerClient();

    const { searchParams } = new URL(request.url);
    const path = searchParams.get('path');

    if (!path) {
      return NextResponse.json(
        { success: false, error: 'Document path is required' },
        { status: 400 }
      );
    }

    // Get signed URL (valid for 1 hour)
    const { data, error } = await supabase.storage
      .from('kyc-documents')
      .createSignedUrl(path, 3600);

    if (error) {
      apiLogger.error('Signed URL error', { error });
      return NextResponse.json(
        { success: false, error: 'Failed to get document URL' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      url: data.signedUrl,
    });
  } catch (error: unknown) {
    apiLogger.error('API error', { error });
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
