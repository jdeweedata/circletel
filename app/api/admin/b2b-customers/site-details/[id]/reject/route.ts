/**
 * Admin B2B Site Details Reject API
 *
 * POST /api/admin/b2b-customers/site-details/[id]/reject - Reject site details
 *
 * @module app/api/admin/b2b-customers/site-details/[id]/reject/route
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { SiteDetailsService } from '@/lib/business/site-details-service';

export async function POST(
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

    // Parse request body
    const body = await request.json();
    const { reason, notes } = body as { reason: string; notes?: string };

    if (!reason) {
      return NextResponse.json(
        { error: 'Rejection reason is required' },
        { status: 400 }
      );
    }

    // Get existing site details
    const existing = await SiteDetailsService.getSiteDetailsById(id);
    if (!existing) {
      return NextResponse.json({ error: 'Site details not found' }, { status: 404 });
    }

    if (existing.status !== 'submitted') {
      return NextResponse.json(
        { error: 'Only submitted site details can be rejected' },
        { status: 400 }
      );
    }

    // Reject site details
    const rejected = await SiteDetailsService.rejectSiteDetails(id, reason, notes);

    // Update journey stage to blocked
    const { data: journeyStage } = await supabase
      .from('business_journey_stages')
      .select('id')
      .eq('business_customer_id', existing.business_customer_id)
      .eq('stage', 'site_details')
      .single();

    if (journeyStage) {
      await supabase
        .from('business_journey_stages')
        .update({
          status: 'blocked',
          notes: reason,
        })
        .eq('id', journeyStage.id);
    }

    return NextResponse.json({
      success: true,
      data: rejected,
      message: 'Site details rejected',
    });
  } catch (error) {
    console.error('Error rejecting site details:', error);
    return NextResponse.json(
      { error: 'Failed to reject site details' },
      { status: 500 }
    );
  }
}
