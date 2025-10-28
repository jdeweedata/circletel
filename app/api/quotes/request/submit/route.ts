/**
 * Quote Request Submission API
 *
 * POST /api/quotes/request/submit
 *
 * Submits a quote request from the public form (with or without agent token)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { QuoteRequestData } from '@/lib/sales-agents/types';
import { QuoteNotificationService } from '@/lib/notifications/quote-notifications';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body: QuoteRequestData & { token?: string } = await request.json();

    // Validate required fields
    if (!body.company_name || !body.contact_name || !body.contact_email || !body.service_address) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields'
        },
        { status: 400 }
      );
    }

    if (!body.selected_packages || body.selected_packages.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'At least one package must be selected'
        },
        { status: 400 }
      );
    }

    let agent_id: string | null = null;

    // Validate token if provided
    if (body.token) {
      // Check permanent agent token
      const { data: agent } = await supabase
        .from('sales_agents')
        .select('id')
        .eq('unique_link_token', body.token)
        .eq('status', 'active')
        .single();

      if (agent) {
        agent_id = agent.id;
      } else {
        // Check temporary link token
        const { data: link } = await supabase
          .from('agent_quote_links')
          .select('agent_id, use_count, max_uses')
          .eq('token', body.token)
          .eq('active', true)
          .single();

        if (link) {
          agent_id = link.agent_id;

          // Increment use count
          await supabase
            .from('agent_quote_links')
            .update({ use_count: link.use_count + 1 })
            .eq('token', body.token);
        }
      }
    }

    // Fetch package details for pricing
    const packageIds = body.selected_packages.map(p => p.package_id);
    const { data: packages, error: packagesError } = await supabase
      .from('service_packages')
      .select('*')
      .in('id', packageIds);

    if (packagesError || !packages || packages.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid package selection'
        },
        { status: 400 }
      );
    }

    // Create package map for lookups
    const packageMap = new Map(packages.map(p => [p.id, p]));

    // Calculate totals
    let subtotal_monthly = 0;
    let subtotal_installation = 0;

    const items = body.selected_packages.map(selection => {
      const pkg = packageMap.get(selection.package_id);
      if (!pkg) throw new Error(`Package ${selection.package_id} not found`);

      const monthly = (pkg.price || 0) * selection.quantity;
      const installation = 0; // No installation price in database

      subtotal_monthly += monthly;
      subtotal_installation += installation;

      return {
        package_id: pkg.id,
        item_type: selection.item_type,
        quantity: selection.quantity,
        monthly_price: pkg.price || 0,
        installation_price: 0,
        custom_pricing: false,
        service_name: pkg.name,
        service_type: pkg.service_type,
        product_category: pkg.product_category,
        speed_down: pkg.speed_down,
        speed_up: pkg.speed_up,
        data_cap_gb: pkg.data_cap_gb,
        notes: selection.notes || null,
        display_order: 0
      };
    });

    // Calculate VAT and totals
    const VAT_RATE = 0.15;
    const vat_amount_monthly = subtotal_monthly * VAT_RATE;
    const vat_amount_installation = subtotal_installation * VAT_RATE;
    const total_monthly = subtotal_monthly + vat_amount_monthly;
    const total_installation = subtotal_installation + vat_amount_installation;

    // Generate quote number
    const year = new Date().getFullYear();
    const { count } = await supabase
      .from('business_quotes')
      .select('*', { count: 'exact', head: true })
      .like('quote_number', `BQ-${year}-%`);

    const quoteNumber = `BQ-${year}-${String((count || 0) + 1).padStart(3, '0')}`;

    // Set validity period (30 days)
    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + 30);

    // Create business quote
    const { data: quote, error: quoteError } = await supabase
      .from('business_quotes')
      .insert({
        quote_number: quoteNumber,
        lead_id: body.coverage_lead_id || null,
        agent_id: agent_id,
        customer_type: body.customer_type,
        company_name: body.company_name,
        registration_number: body.registration_number || null,
        vat_number: body.vat_number || null,
        contact_name: body.contact_name,
        contact_email: body.contact_email,
        contact_phone: body.contact_phone,
        service_address: body.service_address,
        coordinates: body.coordinates || null,
        status: agent_id ? 'pending_approval' : 'draft', // Auto-submit if from agent
        contract_term: body.contract_term,
        subtotal_monthly,
        subtotal_installation,
        custom_discount_percent: 0,
        custom_discount_amount: 0,
        vat_amount_monthly,
        vat_amount_installation,
        total_monthly,
        total_installation,
        customer_notes: body.customer_notes || null,
        admin_notes: body.agent_notes || null,
        valid_until: validUntil.toISOString()
      })
      .select()
      .single();

    if (quoteError || !quote) {
      console.error('Error creating quote:', quoteError);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to create quote'
        },
        { status: 500 }
      );
    }

    // Create quote items
    const { error: itemsError } = await supabase
      .from('business_quote_items')
      .insert(
        items.map((item, index) => ({
          ...item,
          quote_id: quote.id,
          display_order: index
        }))
      );

    if (itemsError) {
      console.error('Error creating quote items:', itemsError);
      // Rollback quote creation
      await supabase.from('business_quotes').delete().eq('id', quote.id);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to create quote items'
        },
        { status: 500 }
      );
    }

    // Send notification (async, don't wait for result)
    QuoteNotificationService.sendForQuoteEvent('quote_created', quote.id).catch(err => {
      console.error('Failed to send quote_created notification:', err);
      // Don't fail the request if notification fails
    });

    // Return success with quote details
    return NextResponse.json(
      {
        success: true,
        quote: {
          id: quote.id,
          quote_number: quote.quote_number,
          total_monthly: quote.total_monthly,
          total_installation: quote.total_installation,
          status: quote.status
        },
        message: agent_id
          ? 'Quote request submitted successfully. An admin will review it shortly.'
          : 'Quote saved as draft. An admin will contact you shortly.'
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Error submitting quote request:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to submit quote request'
      },
      { status: 500 }
    );
  }
}
