/**
 * Invoice Generation Cron Job
 * POST /api/cron/generate-invoices
 * 
 * Runs daily at 02:00 SAST to generate invoices 7 days before billing date
 * Task 2.4: Invoice Generation Cron Job
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateCustomerInvoice, buildInvoiceLineItems } from '@/lib/invoices/invoice-generator';
import { BillingService } from '@/lib/billing/billing-service';

/**
 * POST /api/cron/generate-invoices
 * 
 * Authentication: Vercel Cron Secret
 * 
 * Process:
 * 1. Query active services with billing_date in next 7 days
 * 2. Check if invoice already generated for this period
 * 3. Generate invoice with line items
 * 4. Update customer account balance
 * 5. Send notifications (email + SMS)
 * 6. Log execution in cron_execution_log
 */
export async function POST(request: NextRequest) {
  const executionStart = new Date();
  let recordsProcessed = 0;
  let recordsFailed = 0;
  let recordsSkipped = 0;
  const errors: string[] = [];
  
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (!cronSecret) {
      console.error('CRON_SECRET not configured');
      return NextResponse.json(
        { error: 'Cron secret not configured' },
        { status: 500 }
      );
    }
    
    if (authHeader !== `Bearer ${cronSecret}`) {
      console.error('Invalid cron secret');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const supabase = await createClient();
    
    // Calculate date range (today + 7 days)
    const today = new Date();
    const sevenDaysFromNow = new Date(today);
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
    
    console.log(`Invoice generation job started at ${executionStart.toISOString()}`);
    console.log(`Looking for services with next_billing_date = ${sevenDaysFromNow.toISOString().split('T')[0]}`);
    
    // Get active services where next_billing_date is exactly 7 days from now
    const targetDate = sevenDaysFromNow.toISOString().split('T')[0];
    
    const { data: services, error: servicesError } = await supabase
      .from('customer_services')
      .select(`
        *,
        customer:customers(
          id,
          first_name,
          last_name,
          email,
          phone
        )
      `)
      .eq('status', 'active')
      .eq('next_billing_date', targetDate);
    
    if (servicesError) {
      throw new Error(`Failed to fetch services: ${servicesError.message}`);
    }
    
    console.log(`Found ${services?.length || 0} services to process`);
    
    if (!services || services.length === 0) {
      // Log execution with no records
      await logExecution(supabase, {
        job_name: 'generate_invoices',
        execution_start: executionStart,
        execution_end: new Date(),
        status: 'completed',
        records_processed: 0,
        records_failed: 0,
        records_skipped: 0,
        execution_details: {
          target_date: targetDate,
          message: 'No services due for billing'
        }
      });
      
      return NextResponse.json({
        message: 'No services due for billing',
        processed: 0,
        failed: 0,
        skipped: 0
      });
    }
    
    // Process each service
    for (const service of services) {
      try {
        // Check if invoice already exists for this billing period
        const periodStart = service.last_billing_date || service.activation_date;
        const periodEnd = service.next_billing_date;
        
        const { data: existingInvoice } = await supabase
          .from('customer_invoices')
          .select('id')
          .eq('service_id', service.id)
          .eq('period_start', periodStart)
          .eq('period_end', periodEnd)
          .single();
        
        if (existingInvoice) {
          console.log(`Invoice already exists for service ${service.id}, skipping`);
          recordsSkipped++;
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
        // Business Rule: Invoice date is 6 days before billing date, due date is billing date
        const invoice = await generateCustomerInvoice({
          customer_id: service.customer_id,
          service_id: service.id,
          invoice_type: 'recurring',
          line_items: lineItems,
          period_start: periodStart,
          period_end: periodEnd,
          billing_date: service.next_billing_date, // Due date = billing date (when payment is collected)
          invoice_days_before_billing: 6 // Invoice created 6 days before billing
        });
        
        // Update account balance
        await BillingService.updateAccountBalance(
          service.customer_id,
          invoice.total_amount,
          `Invoice ${invoice.invoice_number} generated`
        );
        
        // Send notifications (email + SMS)
        await sendInvoiceNotifications(service.customer, invoice);
        
        console.log(`Generated invoice ${invoice.invoice_number} for service ${service.id}`);
        recordsProcessed++;
        
      } catch (error: any) {
        console.error(`Failed to process service ${service.id}:`, error);
        errors.push(`Service ${service.id}: ${error.message}`);
        recordsFailed++;
      }
    }
    
    // Log execution
    const executionEnd = new Date();
    const status = recordsFailed > 0 ? 'partial' : 'completed';
    
    await logExecution(supabase, {
      job_name: 'generate_invoices',
      execution_start: executionStart,
      execution_end: executionEnd,
      status,
      records_processed: recordsProcessed,
      records_failed: recordsFailed,
      records_skipped: recordsSkipped,
      error_message: errors.length > 0 ? errors.join('; ') : null,
      execution_details: {
        target_date: targetDate,
        total_services: services.length
      }
    });
    
    console.log(`Invoice generation completed: ${recordsProcessed} processed, ${recordsFailed} failed, ${recordsSkipped} skipped`);
    
    return NextResponse.json({
      message: 'Invoice generation completed',
      processed: recordsProcessed,
      failed: recordsFailed,
      skipped: recordsSkipped,
      errors: errors.length > 0 ? errors : undefined
    });
    
  } catch (error: any) {
    console.error('Invoice generation job failed:', error);
    
    // Log failed execution
    const supabase = await createClient();
    await logExecution(supabase, {
      job_name: 'generate_invoices',
      execution_start: executionStart,
      execution_end: new Date(),
      status: 'failed',
      records_processed: recordsProcessed,
      records_failed: recordsFailed,
      records_skipped: recordsSkipped,
      error_message: error.message,
      error_details: {
        stack: error.stack
      }
    });
    
    return NextResponse.json(
      { error: 'Invoice generation failed', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * Log cron execution
 */
async function logExecution(
  supabase: any,
  details: {
    job_name: string;
    execution_start: Date;
    execution_end: Date;
    status: 'running' | 'completed' | 'failed' | 'partial';
    records_processed: number;
    records_failed: number;
    records_skipped: number;
    error_message?: string | null;
    error_details?: any;
    execution_details?: any;
  }
) {
  try {
    await supabase.from('cron_execution_log').insert({
      job_name: details.job_name,
      execution_start: details.execution_start.toISOString(),
      execution_end: details.execution_end.toISOString(),
      status: details.status,
      records_processed: details.records_processed,
      records_failed: details.records_failed,
      records_skipped: details.records_skipped,
      error_message: details.error_message || null,
      error_details: details.error_details || null,
      execution_details: details.execution_details || null,
      trigger_source: 'vercel_cron',
      environment: process.env.NODE_ENV || 'production'
    });
  } catch (error) {
    console.error('Failed to log execution:', error);
  }
}

/**
 * Send invoice notifications (email + SMS)
 * 
 * TODO: Implement actual notification sending
 * - Email via Resend
 * - SMS via Clickatell
 */
async function sendInvoiceNotifications(
  customer: any,
  invoice: any
) {
  try {
    // TODO: Implement email notification
    console.log(`Would send invoice email to ${customer.email}`);
    
    // TODO: Implement SMS notification
    console.log(`Would send invoice SMS to ${customer.phone}`);
    
    // For now, just log
    return true;
  } catch (error) {
    console.error('Failed to send notifications:', error);
    // Don't throw - notifications are non-critical
    return false;
  }
}
