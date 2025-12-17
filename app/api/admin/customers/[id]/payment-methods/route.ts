import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * GET /api/admin/customers/[id]/payment-methods
 * Retrieve all payment methods for a customer including eMandate details
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: customerId } = await context.params;

    // Use service role to bypass RLS for admin
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Fetch payment methods from payment_methods table
    const { data: paymentMethods, error } = await supabase
      .from('payment_methods')
      .select(`
        id,
        method_type,
        status,
        bank_name,
        bank_account_name,
        bank_account_number_masked,
        branch_code,
        mandate_amount,
        mandate_debit_day,
        mandate_signed_at,
        netcash_mandate_reference,
        netcash_mandate_pdf_link,
        is_primary,
        is_verified,
        created_at,
        updated_at
      `)
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching payment methods:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch payment methods' },
        { status: 500 }
      );
    }

    // Generate signed URLs for mandate PDFs stored in Supabase
    const paymentMethodsWithUrls = await Promise.all(
      (paymentMethods || []).map(async (pm) => {
        if (pm.netcash_mandate_pdf_link && pm.netcash_mandate_pdf_link.startsWith('mandate-documents/')) {
          // It's a Supabase storage path, generate signed URL
          const storagePath = pm.netcash_mandate_pdf_link.replace('mandate-documents/', '');
          const { data: urlData } = await supabase.storage
            .from('mandate-documents')
            .createSignedUrl(storagePath, 60 * 60); // 1 hour validity

          return {
            ...pm,
            netcash_mandate_pdf_link: urlData?.signedUrl || pm.netcash_mandate_pdf_link,
          };
        }
        return pm;
      })
    );

    return NextResponse.json({
      success: true,
      data: paymentMethodsWithUrls,
    });
  } catch (error) {
    console.error('Error in payment-methods API:', error);
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
