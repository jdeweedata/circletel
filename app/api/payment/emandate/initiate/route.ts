import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { NetCashEMandateService } from '@/lib/payments/netcash-emandate-service';

export const runtime = 'nodejs';
export const maxDuration = 30;

/**
 * POST /api/payment/emandate/initiate
 *
 * Initiates an eMandate request for a customer order.
 * Creates payment_methods and emandate_requests records,
 * then calls NetCash API to get mandate signing URL.
 *
 * Required body:
 * - order_id: UUID (required)
 * - billing_day: number (1, 5, 25, or 30)
 *
 * Optional body:
 * - customer_id: UUID (if not provided, will be derived from auth token)
 * - bank_details: { bank_name, account_name, account_number, branch_code, account_type }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    let { customer_id, order_id, billing_day = 1, bank_details } = body;

    // Validate order_id is required
    if (!order_id) {
      return NextResponse.json(
        { error: 'order_id is required' },
        { status: 400 }
      );
    }

    // Use service role to bypass RLS
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

    // If customer_id not provided, get it from auth token
    if (!customer_id) {
      const authHeader = request.headers.get('authorization');
      const token = authHeader?.replace('Bearer ', '');

      if (token) {
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);
        
        if (authError || !user) {
          return NextResponse.json(
            { error: 'Unauthorized - invalid token' },
            { status: 401 }
          );
        }

        // Get customer_id from auth_user_id
        const { data: customerRecord, error: customerLookupError } = await supabase
          .from('customers')
          .select('id')
          .eq('auth_user_id', user.id)
          .single();

        if (customerLookupError || !customerRecord) {
          return NextResponse.json(
            { error: 'Customer record not found for authenticated user' },
            { status: 404 }
          );
        }

        customer_id = customerRecord.id;
      } else {
        return NextResponse.json(
          { error: 'customer_id is required or provide Authorization header' },
          { status: 400 }
        );
      }
    }

    // Validate billing_day
    const validBillingDays = [1, 5, 25, 30];
    const debitDay = validBillingDays.includes(billing_day) ? billing_day : 1;

    // Fetch customer details (including account_number for NetCash reference)
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('id, first_name, last_name, email, phone, account_type, account_number')
      .eq('id', customer_id)
      .single();

    if (customerError || !customer) {
      console.error('[eMandate Initiate] Customer not found:', customerError);
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    // Validate customer has account number (auto-generated on customer creation)
    if (!customer.account_number) {
      console.error('[eMandate Initiate] Customer account number not assigned:', customer_id);
      return NextResponse.json(
        { error: 'Customer account number not yet assigned. Please contact support.' },
        { status: 400 }
      );
    }

    // Fetch order details
    const { data: order, error: orderError } = await supabase
      .from('consumer_orders')
      .select('id, order_number, package_name, package_price, status')
      .eq('id', order_id)
      .single();

    if (orderError || !order) {
      console.error('[eMandate Initiate] Order not found:', orderError);
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Use customer account number as NetCash account reference (format: CT-YYYY-NNNNN, max 15 chars)
    const accountReference = customer.account_number;
    const mandateAmount = parseFloat(order.package_price) || 0;

    // Create payment_methods record (pending status)
    const { data: paymentMethod, error: pmError } = await supabase
      .from('payment_methods')
      .insert({
        customer_id,
        order_id,
        method_type: 'bank_account',
        status: 'pending',
        netcash_account_reference: accountReference,
        mandate_amount: mandateAmount,
        mandate_frequency: 'Monthly',
        mandate_debit_day: debitDay,
        mandate_agreement_date: new Date().toISOString().split('T')[0],
        mandate_active: false,
        is_primary: true,
        is_verified: false,
        // Bank details (if provided)
        bank_name: bank_details?.bank_name || null,
        bank_account_name: bank_details?.account_name || null,
        bank_account_number_masked: bank_details?.account_number
          ? `****${bank_details.account_number.slice(-4)}`
          : null,
        branch_code: bank_details?.branch_code || null,
        // Map frontend account types to database expected values (lowercase)
        bank_account_type: bank_details?.account_type
          ? (() => {
              const dbTypeMap: Record<string, string> = {
                'cheque': 'current',
                'savings': 'savings',
                'transmission': 'transmission',
                'Current': 'current',
                'Savings': 'savings',
                'Transmission': 'transmission',
              };
              return dbTypeMap[bank_details.account_type] || 'current';
            })()
          : null,
        metadata: {
          initiated_at: new Date().toISOString(),
          order_number: order.order_number,
          package_name: order.package_name,
        },
      })
      .select()
      .single();

    if (pmError || !paymentMethod) {
      console.error('[eMandate Initiate] Failed to create payment method:', pmError);
      return NextResponse.json(
        { error: 'Failed to create payment method' },
        { status: 500 }
      );
    }

    // Build eMandate request
    const today = new Date();
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    const isConsumer = customer.account_type !== 'business';

    const emandateRequest = {
      AccountReference: accountReference,
      MandateName: `${customer.first_name} ${customer.last_name}`,
      MandateAmount: mandateAmount,
      IsConsumer: isConsumer,
      FirstName: customer.first_name,
      Surname: customer.last_name,
      TradingName: '', // Not a business
      RegistrationNumber: '',
      RegisteredName: '',
      MobileNumber: customer.phone?.replace(/^\+27/, '0').replace(/\D/g, '') || '',
      DebitFrequency: 'Monthly' as const,
      CommencementMonth: nextMonth.getMonth() + 1,
      CommencementDay: String(debitDay).padStart(2, '0'),
      AgreementDate: NetCashEMandateService.formatDate(today),
      AgreementReferenceNumber: order.order_number,
      // Custom fields for postback identification
      Field1: order_id, // order_id
      Field2: order.order_number, // order_number
      Field3: customer_id, // customer_id
      // Optional fields
      EmailAddress: customer.email || undefined,
      AllowVariableDebitAmounts: true,
      // Bank details (if provided)
      ...(bank_details && {
        BankDetailType: 1 as const,
        BankAccountName: bank_details.account_name,
        BankAccountNumber: bank_details.account_number,
        BranchCode: bank_details.branch_code,
        // Map frontend account types to NetCash expected values
        BankAccountType: (() => {
          const typeMap: Record<string, 'Current' | 'Savings' | 'Transmission'> = {
            'cheque': 'Current',
            'savings': 'Savings',
            'transmission': 'Transmission',
            'Current': 'Current',
            'Savings': 'Savings',
            'Transmission': 'Transmission',
          };
          return typeMap[bank_details.account_type] || 'Current';
        })(),
      }),
    };

    // Create emandate_requests record
    const { data: emandateRecord, error: erError } = await supabase
      .from('emandate_requests')
      .insert({
        payment_method_id: paymentMethod.id,
        order_id,
        customer_id,
        request_type: 'synchronous',
        status: 'pending',
        netcash_account_reference: accountReference,
        request_payload: emandateRequest,
        notification_email: customer.email,
        notification_phone: customer.phone,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
        ip_address: request.headers.get('x-forwarded-for')?.split(',')[0] || null,
        user_agent: request.headers.get('user-agent') || null,
      })
      .select()
      .single();

    if (erError || !emandateRecord) {
      console.error('[eMandate Initiate] Failed to create emandate request:', erError);
      // Rollback payment method
      await supabase.from('payment_methods').delete().eq('id', paymentMethod.id);
      return NextResponse.json(
        { error: 'Failed to create eMandate request' },
        { status: 500 }
      );
    }

    // Call NetCash API to create mandate
    let mandateUrl: string | undefined;
    let netcashResponse;

    try {
      const emandateService = new NetCashEMandateService();
      netcashResponse = await emandateService.createMandate(emandateRequest);

      if (netcashResponse.ErrorCode !== '0' && netcashResponse.ErrorCode !== '000') {
        throw new Error(
          `NetCash API error: ${netcashResponse.ErrorCode} - ${netcashResponse.Errors?.join(', ') || 'Unknown error'}`
        );
      }

      mandateUrl = netcashResponse.MandateUrl;

      // Update emandate_requests with response
      await supabase
        .from('emandate_requests')
        .update({
          status: 'sent',
          netcash_mandate_url: mandateUrl,
          netcash_response_code: netcashResponse.ErrorCode,
          netcash_error_messages: netcashResponse.Errors || [],
          netcash_warnings: netcashResponse.Warnings || [],
          updated_at: new Date().toISOString(),
        })
        .eq('id', emandateRecord.id);

      // Update payment_methods with mandate URL
      await supabase
        .from('payment_methods')
        .update({
          netcash_mandate_url: mandateUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', paymentMethod.id);

      console.log('[eMandate Initiate] Mandate created successfully:', {
        emandateRequestId: emandateRecord.id,
        paymentMethodId: paymentMethod.id,
        mandateUrl,
      });
    } catch (netcashError: any) {
      console.error('[eMandate Initiate] NetCash API error:', netcashError);

      // Update emandate_requests with error
      await supabase
        .from('emandate_requests')
        .update({
          status: 'failed',
          netcash_response_code: netcashResponse?.ErrorCode || 'ERROR',
          netcash_error_messages: [netcashError.message],
          updated_at: new Date().toISOString(),
        })
        .eq('id', emandateRecord.id);

      // Update payment_methods to failed
      await supabase
        .from('payment_methods')
        .update({
          status: 'failed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', paymentMethod.id);

      return NextResponse.json(
        {
          error: 'Failed to create eMandate with NetCash',
          details: netcashError.message,
        },
        { status: 502 }
      );
    }

    // Update order status
    await supabase
      .from('consumer_orders')
      .update({
        status: 'payment_method_pending',
        updated_at: new Date().toISOString(),
      })
      .eq('id', order_id);

    return NextResponse.json({
      success: true,
      emandate_request_id: emandateRecord.id,
      payment_method_id: paymentMethod.id,
      mandate_url: mandateUrl,
      account_reference: accountReference,
      expires_at: emandateRecord.expires_at,
    });
  } catch (error: any) {
    console.error('[eMandate Initiate] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/payment/emandate/initiate
 * Health check endpoint
 */
export async function GET() {
  return NextResponse.json({
    service: 'eMandate Initiation API',
    status: 'operational',
    timestamp: new Date().toISOString(),
  });
}
