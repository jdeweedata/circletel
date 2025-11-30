/**
 * Admin Order Invoice Generation API
 * POST /api/admin/billing/generate-order-invoice
 *
 * Generates invoice from consumer_order and syncs account number from customers table.
 * Used for active orders where customer_services record doesn't exist.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient, createClientWithSession } from '@/lib/supabase/server';
import type { InvoiceLineItem } from '@/lib/billing/types';

interface GenerateOrderInvoiceRequest {
  order_id: string;
  period_start: string;  // ISO date string (YYYY-MM-DD)
  period_end: string;    // ISO date string (YYYY-MM-DD)
  sync_account_number?: boolean; // Default true - sync from customers table
  billing_date?: string; // ISO date string - the actual debit/payment date (defaults to period_start)
  invoice_days_before_billing?: number; // Days before billing_date to set invoice_date (default: 6)
}

export async function POST(request: NextRequest) {
  try {
    // Use session-aware client to get authenticated user
    const sessionClient = await createClientWithSession();
    const { data: { user }, error: authError } = await sessionClient.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Use service role client for data operations (bypasses RLS)
    const supabase = await createClient();

    // Check admin permissions
    const { data: adminUser } = await supabase
      .from('admin_users')
      .select('id, role, permissions')
      .eq('email', user.email)
      .single();

    if (!adminUser) {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Parse request body
    const body: GenerateOrderInvoiceRequest = await request.json();
    const {
      order_id,
      period_start,
      period_end,
      sync_account_number = true,
      billing_date, // The actual debit/payment date
      invoice_days_before_billing = 6 // Invoice created 6 days before billing
    } = body;

    if (!order_id || !period_start || !period_end) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: order_id, period_start, period_end' },
        { status: 400 }
      );
    }

    // 1. Fetch the consumer order with customer data
    const { data: order, error: orderError } = await supabase
      .from('consumer_orders')
      .select(`
        *,
        customer:customers(
          id,
          first_name,
          last_name,
          email,
          phone,
          account_number,
          account_status
        )
      `)
      .eq('id', order_id)
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        { success: false, error: `Order not found: ${order_id}` },
        { status: 404 }
      );
    }

    // 2. Sync account number from customers to consumer_orders if needed
    let accountNumber = order.account_number;
    const customerAccountNumber = order.customer?.account_number;

    if (sync_account_number && customerAccountNumber && !order.account_number) {
      const { error: syncError } = await supabase
        .from('consumer_orders')
        .update({ account_number: customerAccountNumber })
        .eq('id', order_id);

      if (syncError) {
        console.error('Failed to sync account number:', syncError);
      } else {
        accountNumber = customerAccountNumber;
        console.log(`[Invoice] Synced account number ${customerAccountNumber} to order ${order.order_number}`);
      }
    }

    // 3. Check if invoice already exists for this month
    // Since period_start/period_end don't exist, check by invoice_date month
    const periodMonth = period_start.substring(0, 7); // YYYY-MM
    const { data: existingInvoices } = await supabase
      .from('customer_invoices')
      .select('id, invoice_number, invoice_date')
      .eq('customer_id', order.customer_id)
      .gte('invoice_date', `${periodMonth}-01`)
      .lte('invoice_date', `${periodMonth}-31`);

    if (existingInvoices && existingInvoices.length > 0) {
      return NextResponse.json({
        success: false,
        error: `Invoice already exists for this month: ${existingInvoices[0].invoice_number}`,
        existing_invoice: existingInvoices[0]
      }, { status: 409 });
    }

    // 4. Build line items from order data
    const monthName = new Date(period_start).toLocaleDateString('en-ZA', {
      month: 'long',
      year: 'numeric'
    });

    const lineItems: InvoiceLineItem[] = [
      {
        description: `${order.package_name} - ${monthName}`,
        quantity: 1,
        unit_price: parseFloat(order.package_price) || 0,
        amount: parseFloat(order.package_price) || 0,
        type: 'recurring'
      }
    ];

    // Add router fee if applicable
    if (order.router_fee && parseFloat(order.router_fee) > 0) {
      lineItems.push({
        description: 'Router Rental',
        quantity: 1,
        unit_price: parseFloat(order.router_fee),
        amount: parseFloat(order.router_fee),
        type: 'equipment'
      });
    }

    // 5. Calculate totals
    // Package prices are VAT-INCLUSIVE, so we need to reverse-calculate
    const vatRate = 15.00; // South African VAT
    const totalAmount = lineItems.reduce((sum, item) => sum + item.amount, 0);
    // Reverse calculate: subtotal = total / 1.15, vat = total - subtotal
    const subtotal = Math.round((totalAmount / (1 + vatRate / 100)) * 100) / 100;
    const vatAmount = Math.round((totalAmount - subtotal) * 100) / 100;

    // 6. Calculate dates
    // Business Rule: Invoice date is X days before billing date, due date is billing date
    // - billing_date defaults to period_start (e.g., 1st of the month)
    // - invoice_date is 6 days before billing_date (e.g., 25th of previous month)
    const effectiveBillingDate = billing_date || period_start;
    const dueDate = new Date(effectiveBillingDate);
    const invoiceDate = new Date(dueDate);
    invoiceDate.setDate(invoiceDate.getDate() - invoice_days_before_billing);

    // 7. Generate unique invoice number (INV-YYYY-NNNNN format)
    const year = invoiceDate.getFullYear();
    const { count } = await supabase
      .from('customer_invoices')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', `${year}-01-01`)
      .lt('created_at', `${year + 1}-01-01`);

    const sequenceNumber = (count || 0) + 1;
    const invoiceNumber = `INV-${year}-${sequenceNumber.toString().padStart(5, '0')}`;

    // 8. Insert invoice (matching actual customer_invoices schema)
    const { data: invoice, error: invoiceError } = await supabase
      .from('customer_invoices')
      .insert({
        customer_id: order.customer_id,
        invoice_number: invoiceNumber,
        invoice_date: invoiceDate.toISOString().split('T')[0],
        due_date: dueDate.toISOString().split('T')[0],
        subtotal,
        tax_amount: vatAmount,
        total_amount: totalAmount,
        amount_paid: 0,
        amount_due: totalAmount,
        line_items: lineItems,
        status: 'draft'
      })
      .select()
      .single();

    if (invoiceError) {
      console.error('Failed to create invoice:', invoiceError);
      return NextResponse.json(
        { success: false, error: `Failed to create invoice: ${invoiceError.message}` },
        { status: 500 }
      );
    }

    // 8. Update customer_billing balance if exists
    const { data: customerBilling } = await supabase
      .from('customer_billing')
      .select('id, account_balance')
      .eq('customer_id', order.customer_id)
      .single();

    if (customerBilling) {
      const newBalance = (parseFloat(customerBilling.account_balance) || 0) + totalAmount;
      await supabase
        .from('customer_billing')
        .update({
          account_balance: newBalance,
          updated_at: new Date().toISOString()
        })
        .eq('id', customerBilling.id);
    }

    // 9. Log the action
    await supabase
      .from('admin_activity_log')
      .insert({
        admin_user_id: adminUser.id,
        action: 'generate_invoice',
        resource_type: 'customer_invoice',
        resource_id: invoice.id,
        details: {
          order_id,
          order_number: order.order_number,
          invoice_number: invoice.invoice_number,
          customer_id: order.customer_id,
          account_number: accountNumber,
          total_amount: totalAmount,
          period: `${period_start} to ${period_end}`,
          synced_account_number: sync_account_number && !order.account_number && customerAccountNumber
        }
      });

    return NextResponse.json({
      success: true,
      message: 'Invoice generated successfully',
      invoice: {
        id: invoice.id,
        invoice_number: invoice.invoice_number,
        customer_id: order.customer_id,
        account_number: accountNumber,
        total_amount: totalAmount,
        vat_amount: vatAmount,
        subtotal,
        due_date: invoice.due_date,
        period_start,
        period_end,
        status: invoice.status,
        line_items: lineItems
      },
      order: {
        id: order.id,
        order_number: order.order_number,
        account_number: accountNumber,
        account_number_synced: sync_account_number && !order.account_number && customerAccountNumber
      },
      customer: {
        id: order.customer?.id,
        name: `${order.customer?.first_name} ${order.customer?.last_name}`,
        email: order.customer?.email,
        account_number: customerAccountNumber
      }
    });

  } catch (error: any) {
    console.error('Order invoice generation failed:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
