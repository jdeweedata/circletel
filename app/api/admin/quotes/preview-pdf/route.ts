/**
 * Quote PDF Preview API
 * POST /api/admin/quotes/preview-pdf - Generate PDF preview from quote data
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateQuotePDF } from '@/lib/quotes/pdf-generator-v2';
import { apiLogger } from '@/lib/logging/logger';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.company_name || !body.contact_name || !body.items || body.items.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: company_name, contact_name, and items'
        },
        { status: 400 }
      );
    }

    // Transform the quote data to match QuoteDetails interface (from types.ts)
    const quoteData = {
      // Core quote fields
      id: 'preview',
      quote_number: 'PREVIEW-' + Date.now(),
      customer_id: null,
      lead_id: null,
      customer_type: body.customer_type || 'smme',

      // Company details
      company_name: body.company_name,
      registration_number: body.registration_number || null,
      vat_number: body.vat_number || null,

      // Contact details
      contact_name: body.contact_name,
      contact_email: body.contact_email,
      contact_phone: body.contact_phone,

      // Service location
      service_address: body.service_address,
      coordinates: null,

      // Quote details
      status: 'draft' as const,
      contract_term: parseInt(body.contract_term) || 12,

      // Pricing (calculated from body.pricing)
      subtotal_monthly: body.pricing?.totalMonthly || 0,
      subtotal_installation: body.pricing?.totalInstallation || 0,
      custom_discount_percent: body.custom_discount_percent || 0,
      custom_discount_amount: body.pricing?.discountAmount || 0,
      custom_discount_reason: null,
      vat_amount_monthly: body.pricing?.vat || 0,
      vat_amount_installation: 0,
      total_monthly: body.pricing?.totalMonthly + (body.pricing?.vat || 0) || 0,
      total_installation: body.pricing?.totalInstallation || 0,

      // Notes
      admin_notes: null,
      customer_notes: body.customer_notes || null,

      // Validity
      valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),

      // Workflow tracking
      approved_by: null,
      approved_at: null,
      sent_at: null,
      viewed_at: null,
      accepted_at: null,
      rejected_at: null,
      expired_at: null,

      // Audit
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: null,
      updated_by: null,

      // Items (BusinessQuoteItem format)
      items: body.items.map((item: any, index: number) => ({
        id: `preview-item-${index}`,
        quote_id: 'preview',
        package_id: item.package_id,
        item_type: item.item_type || 'primary',
        quantity: item.quantity || 1,
        monthly_price: item.package?.pricing?.monthly || item.package?.base_price_zar || 0,
        installation_price: item.package?.pricing?.installation || item.package?.cost_price_zar || 0,
        custom_pricing: false,
        service_name: item.package?.name || 'Unknown Package',
        service_type: item.package?.service_type || 'BizFibreConnect',
        product_category: item.package?.product_category || 'connectivity',
        speed_down: item.package?.speed_download || item.package?.pricing?.download_speed || 0,
        speed_up: item.package?.speed_upload || item.package?.pricing?.upload_speed || 0,
        data_cap_gb: item.package?.data_cap_gb || null,
        notes: null,
        display_order: index,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })),

      // Additional fields for QuoteDetails
      signature: null,
      versions: [],
      approved_by_admin: null
    };

    // Generate PDF
    const pdf = generateQuotePDF(quoteData, {
      includeTerms: true,
      includeSignature: false
    });

    // Convert PDF to base64 data URL for preview
    const pdfOutput = pdf.output('datauristring');

    return NextResponse.json({
      success: true,
      data: {
        pdf_url: pdfOutput,
        quote_number: quoteData.quote_number,
        company_name: quoteData.company_name
      }
    });

  } catch (error) {
    apiLogger.error('Error generating PDF preview', { error });
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate PDF preview',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
