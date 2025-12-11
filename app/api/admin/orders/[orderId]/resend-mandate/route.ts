/**
 * Resend eMandate API
 * 
 * POST /api/admin/orders/[orderId]/resend-mandate
 * 
 * Resends the eMandate signing request to the customer via NetCash.
 * This submits a new BatchFileUpload with sendMandate=1 to trigger
 * NetCash to send a fresh email/SMS to the customer.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { NetCashEMandateBatchService, EMandateBatchRequest } from '@/lib/payments/netcash-emandate-batch-service';

export const runtime = 'nodejs';
export const maxDuration = 30;

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ orderId: string }> }
) {
  const { orderId } = await context.params;

  if (!orderId) {
    return NextResponse.json(
      { success: false, error: 'Order ID is required' },
      { status: 400 }
    );
  }

  try {
    // Use service role client to bypass RLS
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

    // Fetch the order
    const { data: order, error: orderError } = await supabase
      .from('consumer_orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    // Fetch customer details
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('*')
      .eq('id', order.customer_id)
      .single();

    if (customerError || !customer) {
      return NextResponse.json(
        { success: false, error: 'Customer not found' },
        { status: 404 }
      );
    }

    // Fetch existing emandate request
    const { data: emandateRequest, error: emandateError } = await supabase
      .from('emandate_requests')
      .select('*, payment_methods(*)')
      .eq('order_id', orderId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!emandateRequest) {
      return NextResponse.json(
        { success: false, error: 'No eMandate request found for this order. Please initiate a new mandate first.' },
        { status: 404 }
      );
    }

    // Check if mandate is already signed
    if (emandateRequest.status === 'signed') {
      return NextResponse.json(
        { success: false, error: 'Mandate has already been signed. No need to resend.' },
        { status: 400 }
      );
    }

    // Get payment method details
    const paymentMethod = emandateRequest.payment_methods;
    if (!paymentMethod) {
      return NextResponse.json(
        { success: false, error: 'Payment method not found for this mandate request.' },
        { status: 404 }
      );
    }

    // Build the resend request using existing data
    const accountReference = customer.account_number || `CT-${order.order_number}`;
    const agreementDate = new Date();
    
    // Get bank details from payment method or request payload
    const requestPayload = emandateRequest.request_payload || {};
    const bankDetails = requestPayload.bank_details || {};

    const emandateBatchRequest: EMandateBatchRequest = {
      accountReference: accountReference.substring(0, 22),
      mandateName: `${customer.first_name} ${customer.last_name}`.substring(0, 50),
      isConsumer: true,
      firstName: customer.first_name || order.first_name,
      surname: customer.last_name || order.last_name,
      mobileNumber: customer.phone || order.phone,
      emailAddress: customer.email || order.email,
      mandateAmount: parseFloat(order.package_price) || 0,
      debitFrequency: 1, // Monthly
      commencementMonth: agreementDate.getMonth() + 1,
      commencementDay: String(emandateRequest.billing_day || requestPayload.billing_day || 25),
      agreementDate: agreementDate,
      agreementReference: order.order_number,
      sendMandate: true, // IMPORTANT: This triggers NetCash to send email/SMS
      
      // Bank details (if available)
      ...(bankDetails.account_number && {
        bankDetailType: 1,
        bankAccountName: bankDetails.account_name || `${customer.first_name} ${customer.last_name}`,
        bankAccountType: bankDetails.account_type === 'savings' ? 2 : 1,
        branchCode: bankDetails.branch_code,
        bankAccountNumber: bankDetails.account_number,
      }),
      
      // Custom fields for postback tracking
      field1: orderId,
      field2: order.order_number,
      field3: customer.id,
    };

    // Submit to NetCash
    const emandateBatchService = new NetCashEMandateBatchService();
    const batchResult = await emandateBatchService.submitMandate(emandateBatchRequest);

    if (!batchResult.success) {
      console.error('[Resend Mandate] NetCash submission failed:', batchResult);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to resend mandate via NetCash',
          details: batchResult.errorMessage || batchResult.errorCode
        },
        { status: 500 }
      );
    }

    // Update emandate request with resend info
    const resendCount = (emandateRequest.resend_count || 0) + 1;
    await supabase
      .from('emandate_requests')
      .update({
        status: 'resent',
        resend_count: resendCount,
        last_resent_at: new Date().toISOString(),
        netcash_file_token: batchResult.fileToken,
        updated_at: new Date().toISOString(),
      })
      .eq('id', emandateRequest.id);

    // Log the resend action
    await supabase.from('order_status_history').insert({
      entity_type: 'consumer_order',
      entity_id: orderId,
      old_status: emandateRequest.status,
      new_status: 'mandate_resent',
      changed_by: 'admin',
      notes: `eMandate resent to ${customer.email} / ${customer.phone}. Resend count: ${resendCount}`,
      created_at: new Date().toISOString(),
    });

    console.log(`[Resend Mandate] Successfully resent mandate for order ${order.order_number} to ${customer.email}`);

    return NextResponse.json({
      success: true,
      message: `Mandate resent successfully to ${customer.email} and ${customer.phone}`,
      data: {
        fileToken: batchResult.fileToken,
        recipientEmail: customer.email,
        recipientPhone: customer.phone,
        resendCount: resendCount,
      },
    });

  } catch (error: any) {
    console.error('[Resend Mandate] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
