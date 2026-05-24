import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { authenticateAdmin } from '@/lib/auth/admin-api-auth';
import { apiLogger } from '@/lib/logging/logger';

const VALID_VERIFICATION_RESULTS = ['approved', 'declined', 'pending_review'] as const;
const VALID_RISK_TIERS = ['low', 'medium', 'high'] as const;

export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticateAdmin(request);
    if (!authResult.success) return authResult.response;

    const { adminUser } = authResult;
    const supabase = await createServerClient();

    const body = await request.json();
    const { sessionId, verification_result, risk_tier, extracted_data, admin_notes } = body;

    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: 'Session ID is required' },
        { status: 400 }
      );
    }

    if (verification_result && !VALID_VERIFICATION_RESULTS.includes(verification_result)) {
      return NextResponse.json(
        { success: false, error: `Invalid verification_result. Must be one of: ${VALID_VERIFICATION_RESULTS.join(', ')}` },
        { status: 400 }
      );
    }

    if (risk_tier && !VALID_RISK_TIERS.includes(risk_tier)) {
      return NextResponse.json(
        { success: false, error: `Invalid risk_tier. Must be one of: ${VALID_RISK_TIERS.join(', ')}` },
        { status: 400 }
      );
    }

    const { data: existing, error: fetchError } = await supabase
      .from('kyc_sessions')
      .select('id, extracted_data')
      .eq('id', sessionId)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json(
        { success: false, error: 'KYC session not found' },
        { status: 404 }
      );
    }

    const updateData: Record<string, unknown> = {};

    if (verification_result) {
      updateData.verification_result = verification_result;
      if (verification_result === 'approved' || verification_result === 'declined') {
        updateData.completed_at = new Date().toISOString();
      }
    }

    if (risk_tier) {
      updateData.risk_tier = risk_tier;
    }

    if (extracted_data || admin_notes) {
      const merged = { ...(existing.extracted_data || {}) };
      if (extracted_data) {
        if (extracted_data.id_number !== undefined) merged.id_number = extracted_data.id_number;
        if (extracted_data.full_name !== undefined) merged.full_name = extracted_data.full_name;
        if (extracted_data.company_registration !== undefined) merged.company_registration = extracted_data.company_registration;
        if (extracted_data.proof_of_address !== undefined) merged.proof_of_address = extracted_data.proof_of_address;
      }
      if (admin_notes !== undefined) {
        merged.admin_notes = admin_notes;
      }
      merged.last_admin_update = new Date().toISOString();
      merged.updated_by = adminUser.email;
      updateData.extracted_data = merged;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { success: false, error: 'No fields to update' },
        { status: 400 }
      );
    }

    const { error: updateError } = await supabase
      .from('kyc_sessions')
      .update(updateData)
      .eq('id', sessionId);

    if (updateError) {
      apiLogger.error('Failed to update KYC session', { error: updateError });
      return NextResponse.json(
        { success: false, error: 'Failed to update session' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'KYC session updated successfully',
    });
  } catch (error: unknown) {
    apiLogger.error('KYC session update error', { error });
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
