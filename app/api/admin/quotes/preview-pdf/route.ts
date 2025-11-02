/**
 * Quote PDF Preview API
 * POST /api/admin/quotes/preview-pdf - Generate PDF preview from quote data
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateQuotePDF } from '@/lib/quotes/pdf-generator';

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

    // Transform the quote data to match QuoteDetails interface
    const quoteData = {
      id: 'preview',
      quote_number: 'PREVIEW-' + Date.now(),
      company_name: body.company_name,
      registration_number: body.registration_number || '',
      vat_number: body.vat_number || '',
      contact_name: body.contact_name,
      contact_email: body.contact_email,
      contact_phone: body.contact_phone,
      service_address: body.service_address,
      contract_term: parseInt(body.contract_term) || 12,
      customer_type: body.customer_type || 'smme',
      items: body.items.map((item: any) => ({
        id: item.package_id,
        package_id: item.package_id,
        package_name: item.package?.name || 'Unknown Package',
        description: item.package?.description || '',
        quantity: item.quantity || 1,
        unit_price: item.package?.pricing?.monthly || 0,
        installation_fee: item.package?.pricing?.installation || 0,
        speed_download: item.package?.pricing?.download_speed || item.package?.speed_download || 0,
        speed_upload: item.package?.pricing?.upload_speed || item.package?.speed_upload || 0,
        item_type: item.item_type || 'primary'
      })),
      pricing: body.pricing || {
        subtotal: 0,
        installation: 0,
        discount: 0,
        discountAmount: 0,
        afterDiscount: 0,
        vat: 0,
        total: 0,
        totalMonthly: 0,
        totalInstallation: 0
      },
      custom_discount_percent: body.custom_discount_percent || 0,
      customer_notes: body.customer_notes || '',
      status: 'draft',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
      created_by: 'preview',
      created_by_name: 'Admin Preview'
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
    console.error('Error generating PDF preview:', error);
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
