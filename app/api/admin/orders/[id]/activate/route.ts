/**
 * Admin Order Activation API Route
 * POST /api/admin/orders/[orderId]/activate
 *
 * Activates a consumer order:
 * 1. Validates order status (must be payment_verified or kyc_approved)
 * 2. Generates account number and temporary password
 * 3. Creates Zoho CRM contact, Books customer/invoice, Billing subscription
 * 4. Sends activation email with account details
 * 5. Updates order status to 'active'
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ZohoActivationService } from '@/lib/integrations/zoho/zoho-activation-service';
import { EmailNotificationService } from '@/lib/notifications/notification-service';
import crypto from 'crypto';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await context.params;
    const supabase = await createClient();

    // Validate orderId
    if (!orderId) {
      return NextResponse.json(
        { success: false, error: 'Order ID is required' },
        { status: 400 }
      );
    }

    // Get order details
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

    // Validate order status - must be ready for activation
    const validStatuses = ['payment_verified', 'kyc_approved', 'installation_scheduled', 'installation_completed'];
    if (!validStatuses.includes(order.status)) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot activate order with status: ${order.status}. Order must be in one of: ${validStatuses.join(', ')}`,
        },
        { status: 400 }
      );
    }

    // Check if already activated
    if (order.status === 'active') {
      return NextResponse.json(
        { success: false, error: 'Order is already activated' },
        { status: 400 }
      );
    }

    // Generate account number if not exists
    let accountNumber = order.account_number;
    if (!accountNumber) {
      accountNumber = generateAccountNumber();
    }

    // Generate temporary password
    const temporaryPassword = generateTemporaryPassword();
    const hashedPassword = await hashPassword(temporaryPassword);

    // Get service start date (today or specified)
    const serviceStartDate = new Date().toISOString().split('T')[0];

    // Initialize Zoho activation service
    const zohoService = new ZohoActivationService();

    // Activate service in Zoho (CRM, Books, Billing)
    const zohoResult = await zohoService.activateService({
      orderId: order.id,
      orderNumber: order.order_number,
      customerName: `${order.first_name} ${order.last_name}`,
      email: order.email,
      phone: order.phone,
      address: order.installation_address,
      city: order.installation_city || 'Johannesburg',
      postalCode: order.installation_postal_code || '2000',

      packageName: order.package_name,
      monthlyPrice: order.package_price,
      installationFee: order.installation_fee || 0,
      routerFee: order.router_fee || 0,

      accountNumber,
      serviceStartDate,
    });

    // Update order in database
    const updateData: any = {
      status: 'active',
      account_number: accountNumber,
      service_start_date: serviceStartDate,
      activated_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Add Zoho IDs if available
    if (zohoResult.crmContactId) {
      updateData.zoho_crm_contact_id = zohoResult.crmContactId;
    }
    if (zohoResult.booksCustomerId) {
      updateData.zoho_books_customer_id = zohoResult.booksCustomerId;
    }
    if (zohoResult.booksInvoiceId) {
      updateData.zoho_books_invoice_id = zohoResult.booksInvoiceId;
    }
    if (zohoResult.billingSubscriptionId) {
      updateData.zoho_billing_subscription_id = zohoResult.billingSubscriptionId;
    }

    const { error: updateError } = await supabase
      .from('consumer_orders')
      .update(updateData)
      .eq('id', orderId);

    if (updateError) {
      console.error('Failed to update order:', updateError);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to update order status',
          details: updateError.message,
        },
        { status: 500 }
      );
    }

    // Send activation email
    const emailResult = await EmailNotificationService.sendServiceActivation({
      email: order.email,
      customer_name: `${order.first_name} ${order.last_name}`,
      order_number: order.order_number,
      account_number: accountNumber,
      package_name: order.package_name,
      package_speed: order.package_speed,
      monthly_price: order.package_price,
      service_start_date: serviceStartDate,
      temporary_password: temporaryPassword,
      installation_fee: order.installation_fee || 0,
      router_fee: order.router_fee || 0,
      invoice_number: zohoResult.invoiceNumber,
      invoice_total: zohoResult.invoiceTotal,
    });

    // Log activation
    await supabase.from('order_status_history').insert({
      order_id: orderId,
      order_type: 'consumer',
      status: 'active',
      notes: `Service activated. Account: ${accountNumber}. Zoho: ${zohoResult.success ? 'integrated' : 'partial/failed'}. Email: ${emailResult.success ? 'sent' : 'failed'}`,
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: 'Service activated successfully',
      data: {
        orderId: order.id,
        orderNumber: order.order_number,
        accountNumber,
        serviceStartDate,
        zohoIntegration: {
          success: zohoResult.success,
          partialSuccess: zohoResult.partialSuccess,
          crmContactId: zohoResult.crmContactId,
          booksCustomerId: zohoResult.booksCustomerId,
          booksInvoiceId: zohoResult.booksInvoiceId,
          billingSubscriptionId: zohoResult.billingSubscriptionId,
          invoiceNumber: zohoResult.invoiceNumber,
          errors: zohoResult.errors,
        },
        emailSent: emailResult.success,
        emailError: emailResult.error,
      },
    });
  } catch (error: any) {
    console.error('Service activation error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error during activation',
        details: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * Generate unique account number
 * Format: CT-YYYYMMDD-XXXXX (e.g., CT-20251022-AB123)
 */
function generateAccountNumber(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  // Generate 5-character alphanumeric code
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excluding confusing chars (0, O, 1, I)
  let code = '';
  for (let i = 0; i < 5; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return `CT-${year}${month}${day}-${code}`;
}

/**
 * Generate secure temporary password
 * Format: 12 characters with uppercase, lowercase, numbers, and special chars
 */
function generateTemporaryPassword(): string {
  const uppercase = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lowercase = 'abcdefghjkmnpqrstuvwxyz';
  const numbers = '23456789';
  const special = '@#$%&*';

  // Ensure at least one of each character type
  let password = '';
  password += uppercase.charAt(Math.floor(Math.random() * uppercase.length));
  password += lowercase.charAt(Math.floor(Math.random() * lowercase.length));
  password += numbers.charAt(Math.floor(Math.random() * numbers.length));
  password += special.charAt(Math.floor(Math.random() * special.length));

  // Fill remaining 8 characters
  const allChars = uppercase + lowercase + numbers + special;
  for (let i = 0; i < 8; i++) {
    password += allChars.charAt(Math.floor(Math.random() * allChars.length));
  }

  // Shuffle the password
  return password
    .split('')
    .sort(() => Math.random() - 0.5)
    .join('');
}

/**
 * Hash password for storage
 * Uses crypto.pbkdf2 for security
 */
async function hashPassword(password: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString('hex');
    crypto.pbkdf2(password, salt, 100000, 64, 'sha512', (err, derivedKey) => {
      if (err) reject(err);
      resolve(salt + ':' + derivedKey.toString('hex'));
    });
  });
}

/**
 * GET endpoint - Get activation status
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await context.params;
    const supabase = await createClient();

    const { data: order, error } = await supabase
      .from('consumer_orders')
      .select('id, order_number, status, account_number, service_start_date, activated_at, zoho_crm_contact_id, zoho_books_customer_id, zoho_billing_subscription_id')
      .eq('id', orderId)
      .single();

    if (error || !order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        orderId: order.id,
        orderNumber: order.order_number,
        status: order.status,
        isActive: order.status === 'active',
        accountNumber: order.account_number,
        serviceStartDate: order.service_start_date,
        activatedAt: order.activated_at,
        zohoIntegrated: !!(order.zoho_crm_contact_id || order.zoho_books_customer_id || order.zoho_billing_subscription_id),
      },
    });
  } catch (error: any) {
    console.error('Get activation status error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
