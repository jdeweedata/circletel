/**
 * Admin Manual Invoice Generation API
 * POST /api/admin/billing/generate-invoices-now
 * 
 * Manually trigger invoice generation for specific services or all eligible
 * Task 3.4: Admin Billing Controls
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateCustomerInvoice, buildInvoiceLineItems } from '@/lib/invoices/invoice-generator';
import { BillingService } from '@/lib/billing/billing-service';
import { apiLogger } from '@/lib/logging';

/**
 * POST /api/admin/billing/generate-invoices-now
 * 
 * Body:
 * {
 *   service_ids?: string[] (optional - specific services, or omit for all eligible)
 * }
 * 
 * Returns:
 * - generated: count of invoices generated
 * - failed: count of failures
 * - skipped: count of skipped services
 * - invoices: array of generated invoice details
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get authenticated admin user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // TODO: Check admin permissions (billing:manage)
    
    // Parse request body
    const body = await request.json();
    const { service_ids } = body;
    
    let query = supabase
      .from('customer_services')
      .select('*')
      .eq('status', 'active');
    
    // Filter by specific service IDs if provided
    if (service_ids && Array.isArray(service_ids) && service_ids.length > 0) {
      query = query.in('id', service_ids);
    }
    
    const { data: services, error: servicesError } = await query;
    
    if (servicesError) {
      apiLogger.error('Error fetching services:', servicesError);
      return NextResponse.json(
        { error: 'Failed to fetch services' },
        { status: 500 }
      );
    }
    
    if (!services || services.length === 0) {
      return NextResponse.json({
        message: 'No services found to process',
        generated: 0,
        failed: 0,
        skipped: 0,
        invoices: []
      });
    }
    
    // Process each service
    let generated = 0;
    let failed = 0;
    let skipped = 0;
    const invoices = [];
    const errors = [];
    
    for (const service of services) {
      try {
        // Check if invoice already exists for current billing period
        const periodStart = service.last_billing_date || service.activation_date;
        const periodEnd = service.next_billing_date;
        
        if (!periodStart || !periodEnd) {
          apiLogger.info(`Service ${service.id} missing billing dates, skipping`);
          skipped++;
          continue;
        }
        
        const { data: existingInvoice } = await supabase
          .from('customer_invoices')
          .select('id')
          .eq('service_id', service.id)
          .eq('period_start', periodStart)
          .eq('period_end', periodEnd)
          .single();
        
        if (existingInvoice) {
          apiLogger.info(`Invoice already exists for service ${service.id}, skipping`);
          skipped++;
          continue;
        }
        
        // Build invoice line items
        const lineItems = buildInvoiceLineItems(
          'recurring',
          {
            package_name: service.package_name,
            monthly_price: service.monthly_price,
            installation_fee: 0,
            router_fee: 0
          },
          undefined,
          {
            start: periodStart,
            end: periodEnd
          }
        );
        
        // Generate invoice
        const invoice = await generateCustomerInvoice({
          customer_id: service.customer_id,
          service_id: service.id,
          invoice_type: 'recurring',
          line_items: lineItems,
          period_start: periodStart,
          period_end: periodEnd,
          due_days: 7
        });
        
        // Update account balance
        await BillingService.updateAccountBalance(
          service.customer_id,
          invoice.total_amount,
          `Manual invoice generation - ${invoice.invoice_number}`
        );
        
        invoices.push({
          service_id: service.id,
          invoice_number: invoice.invoice_number,
          total_amount: invoice.total_amount,
          customer_id: service.customer_id
        });
        
        generated++;
        
      } catch (error: any) {
        apiLogger.error(`Failed to generate invoice for service ${service.id}:`, error);
        errors.push(`Service ${service.id}: ${error.message}`);
        failed++;
      }
    }
    
    return NextResponse.json({
      message: `Invoice generation completed: ${generated} generated, ${failed} failed, ${skipped} skipped`,
      generated,
      failed,
      skipped,
      invoices,
      errors: errors.length > 0 ? errors : undefined
    });
    
  } catch (error: any) {
    apiLogger.error('Manual invoice generation failed:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
