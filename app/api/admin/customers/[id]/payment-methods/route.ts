import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { authenticateAdmin } from '@/lib/auth/admin-api-auth';
import { mapPaymentMethodToDisplay } from '@/lib/payments/payment-method-mapper';

/**
 * GET /api/admin/customers/[id]/payment-methods
 * Retrieve all payment methods for a customer including eMandate details
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const authResult = await authenticateAdmin(request);
  if (!authResult.success) return authResult.response;

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

    // Source of truth: customer_payment_methods (W1.3 cutover). Mapped to the legacy
    // display shape so existing admin UI keeps working.
    const { data: rows, error } = await supabase
      .from('customer_payment_methods')
      .select('*')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching payment methods:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch payment methods' },
        { status: 500 }
      );
    }

    const paymentMethods = (rows || []).map(mapPaymentMethodToDisplay);

    // Generate signed URLs for mandate PDFs stored in Supabase
    const paymentMethodsWithUrls = await Promise.all(
      paymentMethods.map(async (pm) => {
        const link = pm.netcash_mandate_pdf_link;
        if (link && link.startsWith('mandate-documents/')) {
          // It's a Supabase storage path, generate signed URL
          const storagePath = link.replace('mandate-documents/', '');
          const { data: urlData } = await supabase.storage
            .from('mandate-documents')
            .createSignedUrl(storagePath, 60 * 60); // 1 hour validity

          return { ...pm, netcash_mandate_pdf_link: urlData?.signedUrl || link };
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
