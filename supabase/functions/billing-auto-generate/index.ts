/**
 * Billing Auto-Generate Edge Function
 * 
 * Automatically generates monthly invoices for active services.
 * Designed to be triggered by Supabase Cron (pg_cron) or external scheduler.
 * 
 * Schedule: Run daily at 00:05 UTC
 * - Checks for services with billing_date matching today
 * - Generates invoices for the upcoming billing period
 * - Logs all operations to billing_run_log
 * 
 * @module supabase/functions/billing-auto-generate
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// South African VAT rate
const VAT_RATE = 15.00;

interface BillingRunResult {
  run_id: string;
  status: 'completed' | 'failed' | 'partial';
  customers_processed: number;
  invoices_generated: number;
  invoices_failed: number;
  total_amount_billed: number;
  errors: Array<{ customer_id: string; error: string }>;
  duration_ms: number;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const startTime = Date.now();
  const errors: Array<{ customer_id: string; error: string }> = [];
  const generatedInvoiceIds: string[] = [];
  let customersProcessed = 0;
  let invoicesGenerated = 0;
  let invoicesFailed = 0;
  let totalAmountBilled = 0;

  try {
    // Initialize Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body for optional parameters
    let targetBillingDay: number | null = null;
    let forceRun = false;
    let dryRun = false;

    if (req.method === 'POST') {
      try {
        const body = await req.json();
        targetBillingDay = body.billing_day || null;
        forceRun = body.force || false;
        dryRun = body.dry_run || false;
      } catch {
        // No body or invalid JSON - use defaults
      }
    }

    // Determine which billing day to process
    const today = new Date();
    const currentDay = today.getDate();
    const billingDays = [1, 5, 25, 30];
    
    // If specific billing day requested, use it; otherwise use today if it's a billing day
    const billingDayToProcess = targetBillingDay || 
      (billingDays.includes(currentDay) ? currentDay : null);

    if (!billingDayToProcess && !forceRun) {
      return new Response(
        JSON.stringify({
          success: true,
          message: `Today (${currentDay}) is not a billing day. No invoices generated.`,
          billing_days: billingDays
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create billing run log entry
    const { data: billingRun, error: runError } = await supabase
      .from('billing_run_log')
      .insert({
        run_date: today.toISOString().split('T')[0],
        run_type: forceRun ? 'manual' : 'scheduled',
        billing_day: billingDayToProcess || currentDay,
        status: 'running',
        triggered_by_system: !forceRun
      })
      .select()
      .single();

    if (runError) {
      throw new Error(`Failed to create billing run log: ${runError.message}`);
    }

    // Calculate billing period
    const periodStart = new Date(today.getFullYear(), today.getMonth(), billingDayToProcess || 1);
    const periodEnd = new Date(today.getFullYear(), today.getMonth() + 1, billingDayToProcess || 1);
    periodEnd.setDate(periodEnd.getDate() - 1); // Last day of billing period

    // Fetch active services that need billing
    // Services where:
    // - status is 'active'
    // - billing_day matches (or customer's preferred billing day)
    // - No invoice exists for this billing period
    const { data: services, error: servicesError } = await supabase
      .from('customer_services')
      .select(`
        id,
        customer_id,
        product_id,
        service_name,
        monthly_price,
        status,
        billing_day,
        next_billing_date,
        customer:customers(
          id, first_name, last_name, email, account_number
        ),
        product:products(
          id, name, price
        )
      `)
      .eq('status', 'active')
      .eq('billing_day', billingDayToProcess);

    if (servicesError) {
      throw new Error(`Failed to fetch services: ${servicesError.message}`);
    }

    if (!services || services.length === 0) {
      // Update billing run log
      await supabase
        .from('billing_run_log')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          duration_ms: Date.now() - startTime,
          customers_processed: 0,
          invoices_generated: 0
        })
        .eq('id', billingRun.id);

      return new Response(
        JSON.stringify({
          success: true,
          message: `No active services found for billing day ${billingDayToProcess}`,
          run_id: billingRun.id
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Group services by customer
    const customerServices = new Map<string, typeof services>();
    for (const service of services) {
      const customerId = service.customer_id;
      if (!customerServices.has(customerId)) {
        customerServices.set(customerId, []);
      }
      customerServices.get(customerId)!.push(service);
    }

    // Process each customer
    for (const [customerId, customerServiceList] of customerServices) {
      customersProcessed++;
      
      try {
        // Check if invoice already exists for this period
        const periodMonth = periodStart.toISOString().substring(0, 7);
        const { data: existingInvoice } = await supabase
          .from('customer_invoices')
          .select('id, invoice_number')
          .eq('customer_id', customerId)
          .gte('invoice_date', `${periodMonth}-01`)
          .lte('invoice_date', `${periodMonth}-31`)
          .single();

        if (existingInvoice) {
          console.log(`Invoice already exists for customer ${customerId}: ${existingInvoice.invoice_number}`);
          continue;
        }

        // Build line items from services
        const lineItems = customerServiceList.map(service => {
          const monthName = periodStart.toLocaleDateString('en-ZA', {
            month: 'long',
            year: 'numeric'
          });
          const price = service.monthly_price || service.product?.price || 0;
          
          return {
            description: `${service.service_name || service.product?.name} - ${monthName}`,
            quantity: 1,
            unit_price: price,
            amount: price,
            type: 'recurring' as const
          };
        });

        // Calculate totals (prices are VAT-inclusive)
        const totalAmount = lineItems.reduce((sum, item) => sum + item.amount, 0);
        const subtotal = Math.round((totalAmount / (1 + VAT_RATE / 100)) * 100) / 100;
        const vatAmount = Math.round((totalAmount - subtotal) * 100) / 100;

        // Calculate due date (7 days from invoice date)
        const dueDate = new Date(today);
        dueDate.setDate(dueDate.getDate() + 7);

        if (dryRun) {
          console.log(`[DRY RUN] Would generate invoice for customer ${customerId}:`, {
            line_items: lineItems,
            total: totalAmount
          });
          invoicesGenerated++;
          totalAmountBilled += totalAmount;
          continue;
        }

        // Create invoice
        const { data: invoice, error: invoiceError } = await supabase
          .from('customer_invoices')
          .insert({
            customer_id: customerId,
            service_id: customerServiceList[0].id, // Primary service
            invoice_type: 'recurring',
            invoice_date: today.toISOString().split('T')[0],
            due_date: dueDate.toISOString().split('T')[0],
            period_start: periodStart.toISOString().split('T')[0],
            period_end: periodEnd.toISOString().split('T')[0],
            subtotal,
            vat_rate: VAT_RATE,
            vat_amount: vatAmount,
            total_amount: totalAmount,
            amount_paid: 0,
            line_items: lineItems,
            status: 'draft',
            notes: `Auto-generated for billing day ${billingDayToProcess}`
          })
          .select()
          .single();

        if (invoiceError) {
          throw new Error(invoiceError.message);
        }

        invoicesGenerated++;
        totalAmountBilled += totalAmount;
        generatedInvoiceIds.push(invoice.id);

        // Update service next_billing_date
        const nextBillingDate = new Date(periodEnd);
        nextBillingDate.setDate(nextBillingDate.getDate() + 1);
        
        for (const service of customerServiceList) {
          await supabase
            .from('customer_services')
            .update({
              next_billing_date: nextBillingDate.toISOString().split('T')[0],
              last_billed_date: today.toISOString().split('T')[0]
            })
            .eq('id', service.id);
        }

        console.log(`Generated invoice ${invoice.invoice_number} for customer ${customerId}`);

      } catch (err) {
        invoicesFailed++;
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        errors.push({ customer_id: customerId, error: errorMessage });
        console.error(`Failed to generate invoice for customer ${customerId}:`, errorMessage);
      }
    }

    // Determine final status
    const finalStatus = invoicesFailed === 0 ? 'completed' : 
                        invoicesGenerated === 0 ? 'failed' : 'partial';

    // Update billing run log
    await supabase
      .from('billing_run_log')
      .update({
        status: finalStatus,
        completed_at: new Date().toISOString(),
        duration_ms: Date.now() - startTime,
        customers_processed: customersProcessed,
        invoices_generated: invoicesGenerated,
        invoices_failed: invoicesFailed,
        total_amount_billed: totalAmountBilled,
        error_details: errors,
        invoice_ids: generatedInvoiceIds
      })
      .eq('id', billingRun.id);

    const result: BillingRunResult = {
      run_id: billingRun.id,
      status: finalStatus,
      customers_processed: customersProcessed,
      invoices_generated: invoicesGenerated,
      invoices_failed: invoicesFailed,
      total_amount_billed: totalAmountBilled,
      errors,
      duration_ms: Date.now() - startTime
    };

    return new Response(
      JSON.stringify({
        success: true,
        message: `Billing run ${finalStatus}`,
        ...result,
        dry_run: dryRun
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Billing auto-generate failed:', errorMessage);

    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
        duration_ms: Date.now() - startTime
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
