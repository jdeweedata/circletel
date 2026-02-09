/**
 * Admin Partner Details API
 * GET /api/admin/partners/[id] - Get partner details with compliance docs
 * PUT /api/admin/partners/[id] - Update partner (tier, commission, notes)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { apiLogger } from '@/lib/logging/logger';
import { authenticateAdmin, requirePermission } from '@/lib/auth/admin-api-auth';
import { z } from 'zod';

// Schema for updating partner
const updatePartnerSchema = z.object({
  tier: z.enum(['bronze', 'silver', 'gold', 'platinum']).optional(),
  commission_rate: z.number().min(0).max(100).optional(),
  admin_notes: z.string().optional(),
});

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Authenticate admin user
    const authResult = await authenticateAdmin(request);
    if (!authResult.success) {
      return authResult.response;
    }

    const { id: partnerId } = await context.params;
    const supabase = await createClient();

    // Get partner details
    const { data: partner, error: partnerError } = await supabase
      .from('partners')
      .select('*')
      .eq('id', partnerId)
      .single();

    if (partnerError || !partner) {
      return NextResponse.json(
        { success: false, error: 'Partner not found' },
        { status: 404 }
      );
    }

    // Get compliance documents
    const { data: documents, error: docsError } = await supabase
      .from('partner_compliance_documents')
      .select('*')
      .eq('partner_id', partnerId)
      .order('uploaded_at', { ascending: false });

    if (docsError) {
      apiLogger.error('[Admin Partner Details] Error fetching documents', { error: docsError });
    }

    // Get leads assigned to this partner
    const { data: leads, error: leadsError } = await supabase
      .from('coverage_leads')
      .select('id, full_name, email, status, created_at')
      .eq('partner_id', partnerId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (leadsError) {
      apiLogger.error('[Admin Partner Details] Error fetching leads', { error: leadsError });
    }

    // Get commission transactions
    const { data: commissions, error: commissionsError } = await supabase
      .from('partner_commission_transactions')
      .select('*')
      .eq('partner_id', partnerId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (commissionsError) {
      apiLogger.error('[Admin Partner Details] Error fetching commissions', { error: commissionsError });
    }

    // Mask sensitive banking info
    const maskedPartner = {
      ...partner,
      account_number: partner.account_number
        ? `****${partner.account_number.slice(-4)}`
        : null,
    };

    return NextResponse.json({
      success: true,
      data: {
        partner: maskedPartner,
        documents: documents || [],
        leads: leads || [],
        commissions: commissions || [],
        stats: {
          totalLeads: leads?.length || 0,
          totalCommissions: commissions?.length || 0,
          documentCount: documents?.length || 0,
        },
      },
    });
  } catch (error) {
    apiLogger.error('[Admin Partner Details] Unexpected error', { error });
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}


export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Authenticate admin user
    const authResult = await authenticateAdmin(request);
    if (!authResult.success) {
      return authResult.response;
    }

    const { adminUser } = authResult;

    // Check permission for managing commissions
    const permissionError = requirePermission(adminUser, 'partners_admin:manage_commissions');
    if (permissionError) {
      return permissionError;
    }

    const { id: partnerId } = await context.params;
    const body = await request.json();

    // Validate request body
    const validation = updatePartnerSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid request', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { tier, commission_rate, admin_notes } = validation.data;
    const supabase = await createClient();

    // Check if partner exists
    const { data: existingPartner, error: checkError } = await supabase
      .from('partners')
      .select('id, status')
      .eq('id', partnerId)
      .single();

    if (checkError || !existingPartner) {
      return NextResponse.json(
        { success: false, error: 'Partner not found' },
        { status: 404 }
      );
    }

    // Build update object
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (tier !== undefined) {
      updateData.tier = tier;
    }

    if (commission_rate !== undefined) {
      updateData.commission_rate = commission_rate;
    }

    if (admin_notes !== undefined) {
      updateData.admin_notes = admin_notes;
    }

    // Update partner
    const { data: updatedPartner, error: updateError } = await supabase
      .from('partners')
      .update(updateData)
      .eq('id', partnerId)
      .select()
      .single();

    if (updateError) {
      apiLogger.error('[Admin Partner Details] Update error', { error: updateError });
      return NextResponse.json(
        { success: false, error: 'Failed to update partner', details: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Partner updated successfully',
      data: updatedPartner,
    });
  } catch (error) {
    apiLogger.error('[Admin Partner Details] Unexpected error', { error });
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
