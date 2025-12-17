/**
 * Admin B2B Site Details Approve API
 *
 * POST /api/admin/b2b-customers/site-details/[id]/approve - Approve site details
 *
 * @module app/api/admin/b2b-customers/site-details/[id]/approve/route
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
    const { notes } = body as { notes?: string };

    // Get existing site details
    const existing = await SiteDetailsService.getSiteDetailsById(id);
    if (!existing) {
      return NextResponse.json({ error: 'Site details not found' }, { status: 404 });
    }

    if (existing.status !== 'submitted') {
      return NextResponse.json(
        { error: 'Only submitted site details can be approved' },
        { status: 400 }
      );
    }

    // Approve site details
    const approved = await SiteDetailsService.approveSiteDetails(id, user.id, notes);

    // Update journey stage to completed
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
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', journeyStage.id);

      // Also move customer to next stage (contract)
      const { data: nextStage } = await supabase
        .from('business_journey_stages')
        .select('id')
        .eq('business_customer_id', existing.business_customer_id)
        .eq('stage', 'contract')
        .single();

      if (nextStage) {
        await supabase
          .from('business_journey_stages')
          .update({
            status: 'in_progress',
            started_at: new Date().toISOString(),
          })
          .eq('id', nextStage.id);
      }
    }

    return NextResponse.json({
      success: true,
      data: approved,
      message: 'Site details approved',
    });
  } catch (error) {
    console.error('Error approving site details:', error);
    return NextResponse.json(
      { error: 'Failed to approve site details' },
      { status: 500 }
    );
  }
}
