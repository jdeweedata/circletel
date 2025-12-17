/**
 * Admin B2B Site Details Detail API
 *
 * GET /api/admin/b2b-customers/site-details/[id] - Get single site details
 *
 * @module app/api/admin/b2b-customers/site-details/[id]/route
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();

    // Verify admin access
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: adminUser } = await supabase
      .from('admin_users')
      .select('id, is_active')
      .eq('id', user.id)
      .single();

    if (!adminUser || !adminUser.is_active) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

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
