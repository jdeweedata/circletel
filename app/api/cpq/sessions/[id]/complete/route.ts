/**
 * CPQ Session Complete API
 *
 * POST /api/cpq/sessions/[id]/complete - Convert session to a business quote
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { CPQSession } from '@/lib/cpq/types';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get session
    const { data: session, error: fetchError } = await supabase
      .from('cpq_sessions')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const cpqSession = session as CPQSession;
    const stepData = cpqSession.step_data || {};

    // Check ownership (database uses owner_id)
    if (cpqSession.owner_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Validate session is ready to convert
    if (cpqSession.status === 'converted') {
      return NextResponse.json(
        { error: 'Session already converted', quote_id: cpqSession.converted_quote_id },
        { status: 400 }
      );
    }

    if (['expired', 'cancelled'].includes(cpqSession.status)) {
      return NextResponse.json(
        { error: `Cannot complete a ${cpqSession.status} session` },
        { status: 400 }
      );
    }

    // Check if pending approval
    if (cpqSession.status === 'pending_approval') {
      // Check if discount was approved (database uses discount_approved column)
      if (!cpqSession.discount_approved) {
        return NextResponse.json(
          { error: 'Session is pending discount approval' },
          { status: 400 }
        );
      }
    }

    // Validate customer details (stored in step_data)
    const customerDetails = stepData.customer_details;
    if (!customerDetails?.company_name) {
      return NextResponse.json(
        { error: 'Customer company name is required' },
        { status: 400 }
      );
    }

    // Validate packages selected (stored in step_data)
    const packageSelection = stepData.package_selection;
    const selectedPackages = packageSelection?.selected_packages || [];
    if (selectedPackages.length === 0) {
      return NextResponse.json(
        { error: 'At least one package must be selected' },
        { status: 400 }
      );
    }

    // Get pricing discounts from step_data
    const pricingDiscounts = stepData.pricing_discounts;
    const locationCoverage = stepData.location_coverage;

    // Determine if owner is admin or partner
    const isAdmin = cpqSession.owner_type === 'admin';

    // Create business quote from session data
    const quoteData = {
      company_name: customerDetails.company_name,
      registration_number: customerDetails.registration_number,
      vat_number: customerDetails.vat_number,
      contact_name: customerDetails.primary_contact?.name,
      contact_email: customerDetails.primary_contact?.email,
      contact_phone: customerDetails.primary_contact?.phone,
      billing_address: customerDetails.billing_address,

      // Quote details from packages
      quote_items: selectedPackages.map((pkg: { package_id: string; package_name: string; site_index: number; quantity: number; base_price: number; contract_term_months: number }) => ({
        package_id: pkg.package_id,
        package_name: pkg.package_name,
        site_index: pkg.site_index,
        quantity: pkg.quantity,
        base_price: pkg.base_price,
        contract_term_months: pkg.contract_term_months,
      })),

      // Pricing
      subtotal: pricingDiscounts?.subtotal || 0,
      discount_amount: pricingDiscounts?.total_discount_amount || 0,
      discount_percent: cpqSession.total_discount_percent || 0,
      total: pricingDiscounts?.total || 0,

      // Sites
      sites: locationCoverage?.sites || [],

      // Metadata
      status: 'draft',
      source: 'cpq',
      cpq_session_id: id,
      created_by_admin_id: isAdmin ? cpqSession.owner_id : null,
      partner_id: !isAdmin ? cpqSession.owner_id : null,

      // AI metadata
      ai_recommendations_used: selectedPackages.some((p: { ai_recommended?: boolean }) => p.ai_recommended),
    };

    // Insert into business_quotes
    const { data: quote, error: quoteError } = await supabase
      .from('business_quotes')
      .insert(quoteData)
      .select()
      .single();

    if (quoteError) {
      console.error('[cpq-complete] Quote creation error:', quoteError);
      return NextResponse.json(
        { error: 'Failed to create quote', details: quoteError.message },
        { status: 500 }
      );
    }

    // Update session as converted
    const { error: updateError } = await supabase
      .from('cpq_sessions')
      .update({
        status: 'converted',
        converted_at: new Date().toISOString(),
        converted_quote_id: quote.id,
      })
      .eq('id', id);

    if (updateError) {
      console.error('[cpq-complete] Session update error:', updateError);
      // Quote was created, log but don't fail
    }

    return NextResponse.json({
      success: true,
      quote_id: quote.id,
      quote_number: quote.quote_number,
      message: 'Session successfully converted to quote',
    });
  } catch (error) {
    console.error('[cpq-complete] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
