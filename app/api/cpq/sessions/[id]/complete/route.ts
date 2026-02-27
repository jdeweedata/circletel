/**
 * CPQ Session Complete API
 *
 * POST /api/cpq/sessions/[id]/complete - Convert session to business quote
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { apiLogger } from '@/lib/logging';
import type { CPQSession, CPQStepData } from '@/lib/cpq/types';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();

    // Get session
    const { data: session, error: fetchError } = await supabase
      .from('cpq_sessions')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    const cpqSession = session as CPQSession;

    // Validate session state
    if (cpqSession.status === 'converted') {
      return NextResponse.json(
        { error: 'Session already converted', quote_id: cpqSession.converted_quote_id },
        { status: 400 }
      );
    }

    if (!['draft', 'approved'].includes(cpqSession.status)) {
      return NextResponse.json(
        { error: `Cannot convert session with status: ${cpqSession.status}` },
        { status: 400 }
      );
    }

    // Check if approval is required but not obtained
    const stepData = cpqSession.step_data as CPQStepData;
    if (stepData.pricing?.requires_approval && !cpqSession.discount_approved) {
      return NextResponse.json(
        { error: 'Discount approval required before conversion' },
        { status: 400 }
      );
    }

    // Validate required data
    if (!stepData.customer_details?.company_name) {
      return NextResponse.json(
        { error: 'Missing customer details' },
        { status: 400 }
      );
    }

    if (!stepData.selected_packages || stepData.selected_packages.length === 0) {
      return NextResponse.json(
        { error: 'No packages selected' },
        { status: 400 }
      );
    }

    if (!stepData.review?.terms_accepted) {
      return NextResponse.json(
        { error: 'Terms must be accepted' },
        { status: 400 }
      );
    }

    // Generate quote number
    const year = new Date().getFullYear();
    const { data: lastQuote } = await supabase
      .from('business_quotes')
      .select('quote_number')
      .like('quote_number', `CPQ-${year}-%`)
      .order('quote_number', { ascending: false })
      .limit(1)
      .single();

    let nextNumber = 1;
    if (lastQuote?.quote_number) {
      const match = lastQuote.quote_number.match(/CPQ-\d{4}-(\d+)/);
      if (match) {
        nextNumber = parseInt(match[1], 10) + 1;
      }
    }
    const quoteNumber = `CPQ-${year}-${String(nextNumber).padStart(5, '0')}`;

    // Calculate totals
    const subtotalMonthly = stepData.selected_packages.reduce(
      (sum, pkg) => sum + pkg.monthly_price * pkg.quantity,
      0
    );
    const subtotalInstallation = stepData.selected_packages.reduce(
      (sum, pkg) => sum + pkg.setup_fee * pkg.quantity,
      0
    );

    const discountPercent = cpqSession.total_discount_percent;
    const discountAmount = (subtotalMonthly * discountPercent) / 100;

    const VAT_RATE = 0.15;
    const vatMonthly = (subtotalMonthly - discountAmount) * VAT_RATE;
    const vatInstallation = subtotalInstallation * VAT_RATE;

    // Create business quote
    const { data: quote, error: quoteError } = await supabase
      .from('business_quotes')
      .insert({
        quote_number: quoteNumber,
        customer_type: 'enterprise', // CPQ is for B2B
        company_name: stepData.customer_details.company_name,
        registration_number: stepData.customer_details.registration_number || null,
        vat_number: stepData.customer_details.vat_number || null,
        contact_name: stepData.customer_details.contact_name,
        contact_email: stepData.customer_details.contact_email,
        contact_phone: stepData.customer_details.contact_phone,
        service_address: stepData.locations?.[0]?.address || '',
        coordinates: stepData.locations?.[0]?.latitude
          ? { lat: stepData.locations[0].latitude, lng: stepData.locations[0].longitude }
          : null,
        status: 'draft',
        contract_term: 24, // Default, could be from step_data
        subtotal_monthly: subtotalMonthly,
        subtotal_installation: subtotalInstallation,
        custom_discount_percent: discountPercent,
        custom_discount_amount: discountAmount,
        custom_discount_reason: 'CPQ system discount',
        vat_amount_monthly: vatMonthly,
        vat_amount_installation: vatInstallation,
        total_monthly: subtotalMonthly - discountAmount + vatMonthly,
        total_installation: subtotalInstallation + vatInstallation,
        admin_notes: `Generated from CPQ session ${id}`,
        valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
      })
      .select()
      .single();

    if (quoteError || !quote) {
      apiLogger.error('[CPQ] Failed to create quote', { error: quoteError?.message });
      return NextResponse.json(
        { error: 'Failed to create quote', details: quoteError?.message },
        { status: 500 }
      );
    }

    // Create quote items
    const quoteItems = stepData.selected_packages.map((pkg, index) => ({
      quote_id: quote.id,
      package_id: pkg.product_id,
      item_type: index === 0 ? 'primary' : 'additional',
      quantity: pkg.quantity,
      monthly_price: pkg.monthly_price,
      installation_price: pkg.setup_fee,
      custom_pricing: false,
      service_name: pkg.product_name,
      service_type: 'connectivity',
      product_category: 'business',
      display_order: index,
    }));

    const { error: itemsError } = await supabase
      .from('business_quote_items')
      .insert(quoteItems);

    if (itemsError) {
      apiLogger.error('[CPQ] Failed to create quote items', { error: itemsError.message });
      // Continue anyway, quote was created
    }

    // Update session as converted
    await supabase
      .from('cpq_sessions')
      .update({
        status: 'converted',
        converted_quote_id: quote.id,
        converted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    // Update analytics
    await supabase
      .from('cpq_analytics')
      .update({
        step_completed: true,
        final_quote_value: subtotalMonthly - discountAmount,
        final_discount_percent: discountPercent,
      })
      .eq('session_id', id)
      .eq('step_entered', 7);

    apiLogger.info('[CPQ] Session converted to quote', {
      sessionId: id,
      quoteId: quote.id,
      quoteNumber,
    });

    return NextResponse.json({
      success: true,
      data: {
        quote_id: quote.id,
        quote_number: quoteNumber,
        total_monthly: quote.total_monthly,
        total_installation: quote.total_installation,
      },
    });
  } catch (error) {
    apiLogger.error('[CPQ] Error completing session', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
