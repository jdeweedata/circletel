/**
 * Admin B2B Site Details Detail API
 *
 * GET /api/admin/b2b-customers/site-details/[id] - Get single site details
 *
 * @module app/api/admin/b2b-customers/site-details/[id]/route
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { authenticateAdmin } from '@/lib/auth/admin-api-auth';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const authResult = await authenticateAdmin(request);
  if (!authResult.success) {
    return authResult.response;
  }

  try {
    const { id } = await context.params;
    const supabase = await createClient();

    // Fetch site details with customer info
    const { data: siteDetails, error } = await supabase
      .from('business_site_details')
      .select(
        `
        *,
        business_customers!inner(
          company_name,
          account_number,
          primary_contact_name,
          primary_contact_email,
          primary_contact_phone
        )
      `
      )
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Site details not found' }, { status: 404 });
      }
      console.error('Error fetching site details:', error);
      return NextResponse.json(
        { error: 'Failed to fetch site details' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      siteDetails,
    });
  } catch (error) {
    console.error('Error in admin site details detail API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
