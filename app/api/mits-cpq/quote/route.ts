import { NextRequest, NextResponse } from 'next/server';
import { createClientWithSession } from '@/lib/supabase/server';
import { MITSStepData } from '@/lib/mits-cpq/types';

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const supabase = await createClientWithSession();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('[MITS-CPQ] Auth failed:', authError?.message);
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { session_id, step_data } = body as {
      session_id: string;
      step_data: MITSStepData;
    };

    if (!session_id || !step_data) {
      return NextResponse.json(
        { error: 'Missing session_id or step_data' },
        { status: 400 }
      );
    }

    // Validate required data
    if (!step_data.customer || !step_data.pricing) {
      return NextResponse.json(
        { error: 'Missing customer or pricing data' },
        { status: 400 }
      );
    }

    const { customer, pricing } = step_data;

    if (
      !customer.company_name ||
      !customer.contact_name ||
      !customer.contact_email ||
      !customer.contact_phone
    ) {
      return NextResponse.json(
        { error: 'Missing required customer details' },
        { status: 400 }
      );
    }

    // Generate quote number: CT-MITS-YYYY-NNNN format
    const now = new Date();
    const year = now.getFullYear();

    // Get count of existing MITS quotes for this year
    const { count, error: countError } = await supabase
      .from('business_quotes')
      .select('id', { count: 'exact', head: true })
      .eq('customer_type', 'managed_it')
      .gte('created_at', `${year}-01-01`)
      .lt('created_at', `${year + 1}-01-01`);

    if (countError) {
      console.error('[MITS-CPQ] Failed to get quote count:', countError);
      return NextResponse.json(
        { error: 'Failed to generate quote number' },
        { status: 500 }
      );
    }

    const nextNumber = (count || 0) + 1;
    const quoteNumber = `CT-MITS-${year}-${String(nextNumber).padStart(4, '0')}`;

    // Prepare quote data
    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + 30); // Valid for 30 days

    // Store step_data as JSON string in admin_notes (since no quote_data column exists)
    const adminNotes = JSON.stringify({
      tier_selection: step_data.tier_selection,
      m365_config: step_data.m365_config,
      add_ons: step_data.add_ons,
      review: step_data.review,
    });

    // Insert quote
    const { data: quote, error: insertError } = await supabase
      .from('business_quotes')
      .insert({
        quote_number: quoteNumber,
        customer_type: 'managed_it',
        company_name: customer.company_name,
        registration_number: customer.registration_number || null,
        vat_number: customer.vat_number || null,
        contact_name: customer.contact_name,
        contact_email: customer.contact_email,
        contact_phone: customer.contact_phone,
        service_address: customer.billing_address,
        status: 'submitted',
        contract_term: pricing.contract_term_months,
        subtotal_monthly: pricing.subtotal_mrc,
        subtotal_installation: pricing.add_ons_nrc || 0,
        vat_amount_monthly: (pricing.subtotal_mrc * 0.15) || 0,
        vat_amount_installation: ((pricing.add_ons_nrc || 0) * 0.15) || 0,
        total_monthly: pricing.total_mrc,
        total_installation: ((pricing.add_ons_nrc || 0) * 1.15) || 0,
        admin_notes: adminNotes,
        customer_notes: customer.notes || null,
        valid_until: validUntil.toISOString().split('T')[0],
        created_by: user.id,
      })
      .select()
      .single();

    if (insertError) {
      console.error('[MITS-CPQ] Failed to insert quote:', insertError);
      return NextResponse.json(
        { error: 'Failed to create quote' },
        { status: 500 }
      );
    }

    // Update cpq_session to completed
    const { error: updateError } = await supabase
      .from('cpq_sessions')
      .update({
        status: 'completed',
        converted_quote_id: quote.id,
        converted_at: new Date().toISOString(),
      })
      .eq('id', session_id);

    if (updateError) {
      console.error('[MITS-CPQ] Failed to update session:', updateError);
      return NextResponse.json(
        { error: 'Failed to update session' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      quote_number: quoteNumber,
      quote_id: quote.id,
    });
  } catch (error) {
    console.error('[MITS-CPQ] Unhandled error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
