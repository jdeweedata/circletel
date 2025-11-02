/**
 * Customer Invoice PDF Download API
 * GET /api/dashboard/invoices/[id]/pdf
 * 
 * Streams PDF file from Supabase Storage
 * Task 2.5: Invoice API Endpoints
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/dashboard/invoices/[id]/pdf
 * 
 * Returns:
 * - PDF file stream
 * - Content-Type: application/pdf
 * - Content-Disposition: attachment or inline
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await context.params;
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Get customer_id from auth_user_id
    const { data: customer } = await supabase
      .from('customers')
      .select('id')
      .eq('auth_user_id', user.id)
      .single();
    
    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }
    
    // Verify customer owns this invoice
    const { data: invoice, error: invoiceError } = await supabase
      .from('customer_invoices')
      .select('invoice_number, pdf_url')
      .eq('id', id)
      .eq('customer_id', customer.id)
      .single();
    
    if (invoiceError || !invoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      );
    }
    
    // Check if PDF exists
    if (!invoice.pdf_url) {
      return NextResponse.json(
        { error: 'PDF not yet generated' },
        { status: 404 }
      );
    }
    
    // Extract storage path from URL
    // pdf_url format: https://xxx.supabase.co/storage/v1/object/public/customer-invoices/...
    const urlParts = invoice.pdf_url.split('/storage/v1/object/public/');
    if (urlParts.length !== 2) {
      return NextResponse.json(
        { error: 'Invalid PDF URL' },
        { status: 500 }
      );
    }
    
    const [bucket, ...pathParts] = urlParts[1].split('/');
    const path = pathParts.join('/');
    
    // Download PDF from Supabase Storage
    const { data: pdfData, error: downloadError } = await supabase
      .storage
      .from(bucket)
      .download(path);
    
    if (downloadError || !pdfData) {
      console.error('Error downloading PDF:', downloadError);
      return NextResponse.json(
        { error: 'Failed to download PDF' },
        { status: 500 }
      );
    }
    
    // Convert blob to buffer
    const buffer = await pdfData.arrayBuffer();
    
    // Determine disposition (inline for viewing, attachment for download)
    const disposition = request.nextUrl.searchParams.get('download') === 'true'
      ? 'attachment'
      : 'inline';
    
    // Return PDF with proper headers
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `${disposition}; filename="${invoice.invoice_number}.pdf"`,
        'Cache-Control': 'private, max-age=3600' // Cache for 1 hour
      }
    });
    
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
