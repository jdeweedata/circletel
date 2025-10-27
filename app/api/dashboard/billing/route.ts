import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase credentials');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get authenticated user
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized'
      }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({
        success: false,
        error: 'Invalid session'
      }, { status: 401 });
    }

    // Get customer
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('id')
      .eq('auth_user_id', user.id)
      .single();

    if (customerError || !customer) {
      return NextResponse.json({
        success: false,
        error: 'Customer not found'
      }, { status: 404 });
    }

    const customerId = customer.id;

    // Fetch all billing data in parallel
    const [
      invoicesResult,
      paymentsResult,
      billingResult,
      servicesResult
    ] = await Promise.all([
      // Fetch invoices
      supabase
        .from('customer_invoices')
        .select('*')
        .eq('customer_id', customerId)
        .order('invoice_date', { ascending: false })
        .limit(50),

      // Fetch payment transactions
      supabase
        .from('payment_transactions')
        .select('*')
        .eq('customer_email', user.email)
        .eq('status', 'completed')
        .order('completed_at', { ascending: false })
        .limit(50),

      // Fetch billing info
      supabase
        .from('customer_billing')
        .select('*')
        .eq('customer_id', customerId)
        .single(),

      // Fetch services for calculating average monthly
      supabase
        .from('customer_services')
        .select('monthly_price, status')
        .eq('customer_id', customerId)
        .eq('active', true)
    ]);

    // Handle errors gracefully
    if (invoicesResult.error) {
      console.error('Error fetching invoices:', invoicesResult.error);
    }
    if (paymentsResult.error) {
      console.error('Error fetching payments:', paymentsResult.error);
    }
    if (billingResult.error && billingResult.error.code !== 'PGRST116') {
      // PGRST116 is "no rows returned" which is OK
      console.error('Error fetching billing:', billingResult.error);
    }
    if (servicesResult.error) {
      console.error('Error fetching services:', servicesResult.error);
    }

    const invoices = invoicesResult.data || [];
    const payments = paymentsResult.data || [];
    const billing = billingResult.data || null;
    const services = servicesResult.data || [];

    // Calculate billing summary
    const currentBalance = billing?.account_balance || 0;

    // Calculate total paid this year
    const currentYear = new Date().getFullYear();
    const totalPaidYTD = payments
      .filter(p => {
        const paymentDate = new Date(p.completed_at || p.created_at);
        return paymentDate.getFullYear() === currentYear;
      })
      .reduce((sum, p) => sum + parseFloat(p.amount.toString()), 0);

    // Calculate average monthly from active services
    const averageMonthly = services
      .filter(s => s.status === 'active')
      .reduce((sum, s) => sum + parseFloat(s.monthly_price.toString()), 0);

    // Get next billing date
    const nextBillingDate = billing?.next_billing_date ||
      new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0];

    // Transform invoices to match frontend interface
    const transformedInvoices = invoices.map(invoice => ({
      id: invoice.id,
      invoice_number: invoice.invoice_number,
      invoice_date: invoice.invoice_date,
      due_date: invoice.due_date,
      total_amount: parseFloat(invoice.total_amount.toString()),
      amount_due: parseFloat(invoice.amount_due.toString()),
      amount_paid: parseFloat(invoice.amount_paid.toString()),
      status: mapInvoiceStatus(invoice.status),
      description: getInvoiceDescription(invoice),
      service_period_start: invoice.created_at.split('T')[0],
      service_period_end: invoice.due_date
    }));

    // Transform payments to match frontend interface
    const transformedPayments = payments.map(payment => ({
      id: payment.id,
      payment_date: payment.completed_at || payment.created_at,
      amount: parseFloat(payment.amount.toString()),
      payment_method: formatPaymentMethod(payment.payment_method, payment.payment_provider),
      transaction_id: payment.provider_reference || payment.id,
      status: 'successful' as const,
      invoice_id: payment.order_type === 'invoice' ? payment.order_id : undefined
    }));

    // Get or create payment methods from billing info
    const paymentMethods = getPaymentMethods(billing);

    // Build response
    const billingData = {
      billing_summary: {
        current_balance: currentBalance,
        total_paid_ytd: totalPaidYTD,
        next_billing_date: nextBillingDate,
        average_monthly: averageMonthly
      },
      invoices: transformedInvoices,
      payments: transformedPayments,
      payment_methods: paymentMethods
    };

    return NextResponse.json({
      success: true,
      data: billingData
    });

  } catch (error) {
    console.error('Dashboard billing error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch billing data',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Helper functions

function mapInvoiceStatus(status: string): 'paid' | 'pending' | 'overdue' | 'cancelled' {
  const statusMap: Record<string, 'paid' | 'pending' | 'overdue' | 'cancelled'> = {
    'paid': 'paid',
    'sent': 'pending',
    'draft': 'pending',
    'overdue': 'overdue',
    'cancelled': 'cancelled'
  };
  return statusMap[status] || 'pending';
}

function getInvoiceDescription(invoice: any): string {
  if (invoice.line_items && Array.isArray(invoice.line_items) && invoice.line_items.length > 0) {
    return invoice.line_items[0].description || 'Service fee';
  }

  // Generate description from date
  const date = new Date(invoice.invoice_date);
  const monthYear = date.toLocaleDateString('en-ZA', { month: 'long', year: 'numeric' });
  return `Monthly service fee - ${monthYear}`;
}

function formatPaymentMethod(method: string | null, provider: string | null): string {
  if (!method && !provider) return 'Payment';

  const methodMap: Record<string, string> = {
    'card': 'Credit Card',
    'credit_card': 'Credit Card',
    'debit_card': 'Debit Card',
    'eft': 'EFT Transfer',
    'bank_transfer': 'Bank Transfer',
    'debit_order': 'Debit Order',
    'cash': 'Cash Payment'
  };

  const providerMap: Record<string, string> = {
    'netcash': 'NetCash',
    'payfast': 'PayFast',
    'ozow': 'Ozow'
  };

  const methodStr = method ? (methodMap[method.toLowerCase()] || method) : '';
  const providerStr = provider ? (providerMap[provider.toLowerCase()] || provider) : '';

  if (methodStr && providerStr) {
    return `${methodStr} (${providerStr})`;
  }
  return methodStr || providerStr || 'Payment';
}

function getPaymentMethods(billing: any): Array<{
  id: string;
  type: 'credit_card' | 'debit_card' | 'bank_account' | 'eft';
  last_four: string;
  expiry_date?: string;
  is_primary: boolean;
  card_brand?: string;
  bank_name?: string;
}> {
  if (!billing?.payment_method_details) {
    return [];
  }

  const details = billing.payment_method_details;

  // If it's an array of payment methods
  if (Array.isArray(details)) {
    return details.map((method, index) => ({
      id: method.id || `pm_${index}`,
      type: method.type || 'credit_card',
      last_four: method.last4 || method.last_four || '0000',
      expiry_date: method.exp_month && method.exp_year
        ? `${method.exp_month}/${method.exp_year}`
        : undefined,
      is_primary: index === 0 || method.is_primary === true,
      card_brand: method.brand || method.card_brand,
      bank_name: method.bank_name
    }));
  }

  // If it's a single payment method object
  if (typeof details === 'object') {
    return [{
      id: details.id || 'pm_1',
      type: details.type || 'credit_card',
      last_four: details.last4 || details.last_four || '0000',
      expiry_date: details.exp_month && details.exp_year
        ? `${details.exp_month}/${details.exp_year}`
        : undefined,
      is_primary: true,
      card_brand: details.brand || details.card_brand,
      bank_name: details.bank_name
    }];
  }

  return [];
}
