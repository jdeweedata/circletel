import { nowISO } from '@/lib/dates';
/**
 * Monthly Invoice Generator Service
 *
 * Generates monthly recurring invoices for active customer services.
 * Integrates with:
 * - ZOHO Books for invoice sync
 * - NetCash Pay Now for payment notifications
 * - Email/SMS for customer communication
 *
 * Flow:
 * 1. Query active services due for billing (matching billing_day)
 * 2. Check for existing invoice in current month (duplicate prevention)
 * 3. Generate invoice in customer_invoices table
 * 4. Sync to ZOHO Books (async, non-blocking)
 * 5. Send Pay Now notifications (email + SMS)
 * 6. Update last_invoice_date to prevent re-billing
 *
 * @see docs/architecture/BILLING_AUTOMATION.md
 */

import { createClient } from '@/lib/supabase/server';
import { syncInvoiceToZohoBilling } from '@/lib/integrations/zoho/invoice-sync-service';
import { computeVatInclusiveAmounts, formatInvoiceNumber, nextInvoiceSequence } from './invoice-amounts';
import { processPayNowForInvoice } from '@/lib/billing/paynow-billing-service';
import { computeProRata } from '@/lib/onboarding/prorata';
import { billingLogger } from '@/lib/logging';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Service with customer and package joins
 */
export interface ServiceToBill {
  id: string;
  customer_id: string;
  package_id: string | null;
  package_name: string;
  service_type: string;
  monthly_price: number;
  billing_day: number;
  last_invoice_date: string | null;
  status: string;
  activation_date: string | null;
  customer: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string | null;
    phone: string | null;
    account_number: string | null;
    onboarding_status: string | null;
  } | null;
  package: {
    id: string;
    name: string;
  } | null;
}

/**
 * Result for a single service billing attempt
 */
export interface InvoiceGenerationResult {
  serviceId: string;
  customerId: string;
  success: boolean;
  invoiceId?: string;
  invoiceNumber?: string;
  amount?: number;
  zohoSynced?: boolean;
  paynowSent?: boolean;
  emailSent?: boolean;
  smsSent?: boolean;
  errors: string[];
  skipped?: boolean;
  skipReason?: string;
}

/**
 * Overall billing run result
 */
export interface MonthlyBillingResult {
  runId: string;
  billingDay: number;
  startedAt: string;
  completedAt: string;
  dryRun: boolean;
  summary: {
    totalServices: number;
    processed: number;
    successful: number;
    failed: number;
    skipped: number;
  };
  results: InvoiceGenerationResult[];
}

/**
 * Options for monthly invoice generation
 */
export interface MonthlyBillingOptions {
  /** If true, preview only - no database changes */
  dryRun?: boolean;
  /** Specific billing day to process (1-28) */
  billingDay?: number;
  /** Filter to single customer for testing */
  customerId?: string;
  /** Skip ZOHO sync (useful for testing) */
  skipZohoSync?: boolean;
  /** Skip Pay Now notifications (useful for testing) */
  skipPayNow?: boolean;
}

// =============================================================================
// MONTHLY INVOICE GENERATOR
// =============================================================================

export class MonthlyInvoiceGenerator {
  private supabase: Awaited<ReturnType<typeof createClient>> | null = null;

  /**
   * Get or create Supabase client (lazy initialization)
   */
  private async getClient() {
    if (!this.supabase) {
      this.supabase = await createClient();
    }
    return this.supabase;
  }

  /**
   * Main entry point: Generate monthly invoices for services due on billing day
   */
  async generateMonthlyInvoices(
    options: MonthlyBillingOptions = {}
  ): Promise<MonthlyBillingResult> {
    const {
      dryRun = false,
      billingDay = new Date().getDate(),
      customerId,
      skipZohoSync = false,
      skipPayNow = false,
    } = options;

    const runId = `billing-${Date.now()}`;
    const startedAt = nowISO();
    const results: InvoiceGenerationResult[] = [];

    billingLogger.info('MonthlyInvoice: Starting billing run', {
      runId,
      billingDay,
      dryRun,
      customerId: customerId || 'all',
    });

    try {
      // 1. Get services due for billing
      const services = await this.getServicesDueForBilling(billingDay, customerId);

      billingLogger.info('MonthlyInvoice: Found services to bill', {
        runId,
        count: services.length,
      });

      // 2. Process each service
      for (const service of services) {
        const result = await this.processServiceBilling(service, {
          dryRun,
          skipZohoSync,
          skipPayNow,
        });
        results.push(result);

        // Small delay between services to avoid rate limiting
        if (!dryRun) {
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      }

      // 3. Build summary
      const summary = this.buildSummary(results);

      const completedAt = nowISO();

      const billingResult: MonthlyBillingResult = {
        runId,
        billingDay,
        startedAt,
        completedAt,
        dryRun,
        summary,
        results,
      };

      // 4. Log billing run (unless dry run)
      if (!dryRun) {
        await this.logBillingRun(billingResult);
      }

      billingLogger.info('MonthlyInvoice: Billing run complete', {
        runId,
        ...summary,
      });

      return billingResult;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      billingLogger.error('MonthlyInvoice: Billing run failed', {
        runId,
        error: errorMsg,
      });

      return {
        runId,
        billingDay,
        startedAt,
        completedAt: nowISO(),
        dryRun,
        summary: {
          totalServices: 0,
          processed: 0,
          successful: 0,
          failed: 1,
          skipped: 0,
        },
        results: [
          {
            serviceId: 'system',
            customerId: 'system',
            success: false,
            errors: [errorMsg],
          },
        ],
      };
    }
  }

  /**
   * Query active services due for billing on specified day
   */
  async getServicesDueForBilling(
    billingDay: number,
    customerId?: string
  ): Promise<ServiceToBill[]> {
    const supabase = await this.getClient();

    let query = supabase
      .from('customer_services')
      .select(
        `
        id,
        customer_id,
        package_id,
        package_name,
        service_type,
        monthly_price,
        billing_day,
        last_invoice_date,
        activation_date,
        status,
        customer:customers(
          id,
          first_name,
          last_name,
          email,
          phone,
          account_number,
          onboarding_status
        ),
        package:service_packages(
          id,
          name
        )
      `
      )
      .eq('status', 'active')
      .eq('billing_day', billingDay);

    // Filter by customer if specified
    if (customerId) {
      query = query.eq('customer_id', customerId);
    }

    const { data: services, error } = await query;

    if (error) {
      billingLogger.error('MonthlyInvoice: Failed to fetch services', {
        error: error.message,
      });
      throw new Error(`Failed to fetch services: ${error.message}`);
    }

    // Transform data - handle Supabase joins returning arrays
    const transformed = (services || []).map((service) => ({
      ...service,
      customer: Array.isArray(service.customer)
        ? service.customer[0]
        : service.customer,
      package: Array.isArray(service.package)
        ? service.package[0]
        : service.package,
    })) as ServiceToBill[];

    // GATE: Exclude customers in onboarding flow unless they are billing_ready.
    // Legacy customers (no onboarding_submission) continue to bill normally.
    const customerIds = transformed.map(s => s.customer_id);
    if (customerIds.length > 0) {
      const { data: onboardingByCustomer } = await supabase
        .from('onboarding_submissions')
        .select('customer_id')
        .in('customer_id', customerIds);
      const inOnboardingSet = new Set((onboardingByCustomer || []).map(row => row.customer_id));

      return transformed.filter(service => {
        const inOnboarding = inOnboardingSet.has(service.customer_id);
        // If NOT in onboarding: bill (legacy customer)
        if (!inOnboarding) return true;
        // If in onboarding: bill only if billing_ready
        return service.customer?.onboarding_status === 'billing_ready';
      });
    }

    return transformed;
  }

  /**
   * Process billing for a single service
   */
  async processServiceBilling(
    service: ServiceToBill,
    options: {
      dryRun: boolean;
      skipZohoSync: boolean;
      skipPayNow: boolean;
    }
  ): Promise<InvoiceGenerationResult> {
    const { dryRun, skipZohoSync, skipPayNow } = options;
    const errors: string[] = [];

    try {
      // 1. Check for duplicate invoice
      const existingInvoice = await this.checkExistingInvoice(service.id);
      if (existingInvoice) {
        return {
          serviceId: service.id,
          customerId: service.customer_id,
          success: true,
          skipped: true,
          skipReason: `Already billed this month (Invoice: ${existingInvoice})`,
          errors: [],
        };
      }

      // 2. Dry run - return preview
      if (dryRun) {
        return {
          serviceId: service.id,
          customerId: service.customer_id,
          success: true,
          skipped: false,
          invoiceId: 'DRY-RUN',
          invoiceNumber: 'DRY-RUN',
          errors: [],
        };
      }

      // 3. Create invoice
      const invoice = await this.createInvoice(service);
      if (!invoice) {
        return {
          serviceId: service.id,
          customerId: service.customer_id,
          success: false,
          errors: ['Failed to create invoice'],
        };
      }

      // 4. Update last_invoice_date
      await this.updateLastInvoiceDate(service.id);

      // 5. Sync to ZOHO (non-blocking, continue on failure)
      let zohoSynced = false;
      if (!skipZohoSync) {
        try {
          const zohoResult = await syncInvoiceToZohoBilling(invoice.id);
          zohoSynced = zohoResult.success;
          if (!zohoResult.success) {
            errors.push(`ZOHO sync failed: ${zohoResult.error}`);
          }
        } catch (zohoError) {
          const zohoErrMsg =
            zohoError instanceof Error ? zohoError.message : 'ZOHO sync error';
          errors.push(`ZOHO sync error: ${zohoErrMsg}`);
          billingLogger.error('MonthlyInvoice: ZOHO sync failed', {
            invoiceId: invoice.id,
            error: zohoErrMsg,
          });
        }
      }

      // 6. Send Pay Now notification (non-blocking, continue on failure)
      let paynowSent = false;
      if (!skipPayNow) {
        try {
          const paynowResult = await processPayNowForInvoice(invoice.id, {
            sendEmail: true,
            sendSms: true,
            smsTemplate: 'paymentDue',
          });
          paynowSent = paynowResult.success;
          if (!paynowResult.success) {
            errors.push(`Pay Now failed: ${paynowResult.errors.join(', ')}`);
          }
        } catch (paynowError) {
          const paynowErrMsg =
            paynowError instanceof Error
              ? paynowError.message
              : 'Pay Now error';
          errors.push(`Pay Now error: ${paynowErrMsg}`);
          billingLogger.error('MonthlyInvoice: Pay Now failed', {
            invoiceId: invoice.id,
            error: paynowErrMsg,
          });
        }
      }

      billingLogger.info('MonthlyInvoice: Service billed successfully', {
        serviceId: service.id,
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoice_number,
        zohoSynced,
        paynowSent,
      });

      return {
        serviceId: service.id,
        customerId: service.customer_id,
        success: true,
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoice_number,
        zohoSynced,
        paynowSent,
        errors,
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      billingLogger.error('MonthlyInvoice: Service billing failed', {
        serviceId: service.id,
        error: errorMsg,
      });

      return {
        serviceId: service.id,
        customerId: service.customer_id,
        success: false,
        errors: [errorMsg],
      };
    }
  }

  /**
   * Check if invoice already exists for this service in current month
   */
  async checkExistingInvoice(serviceId: string): Promise<string | null> {
    const supabase = await this.getClient();
    const now = new Date();
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const { data: existing } = await supabase
      .from('customer_invoices')
      .select('invoice_number')
      .eq('service_id', serviceId)
      .eq('invoice_type', 'recurring')
      .gte('invoice_date', firstOfMonth.toISOString().split('T')[0])
      .lte('invoice_date', lastOfMonth.toISOString().split('T')[0])
      .single();

    return existing?.invoice_number || null;
  }

  /**
   * Create invoice for a service
   */
  async createInvoice(
    service: ServiceToBill
  ): Promise<{ id: string; invoice_number: string } | null> {
    const supabase = await this.getClient();
    const now = new Date();
    const invoiceDate = now.toISOString().split('T')[0];

    // Due date is same as billing day (today)
    const dueDate = invoiceDate;

    // Billing period: start of current month to end of current month
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1)
      .toISOString()
      .split('T')[0];
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      .toISOString()
      .split('T')[0];

    // Amounts — consumer monthly_price is VAT-INCLUSIVE (gross); back VAT out so total === price.
    // Matches every existing paid invoice (e.g. R899 -> net 781.74 + VAT 117.26 = 899).
    const vatRate = 15.0;

    // Always compute full-month amounts from the existing function on the unchanged price.
    const { subtotal: fullSubtotal, vatAmount: fullVat, totalAmount: fullTotal } = computeVatInclusiveAmounts(service.monthly_price);

    // Pro-rata first invoice: detect via last_invoice_date === null and apply fraction
    // Only use computeProRata to get days/daysInMonth; ignore its amount fields (VAT base is already set above).
    const isFirstInvoice = service.last_invoice_date === null;
    let fraction = 1;
    if (isFirstInvoice && service.activation_date) {
      const pr = computeProRata({
        monthlyExVat: service.monthly_price, // only days/daysInMonth are used; VAT treatment irrelevant here
        vatPct: 15,
        activationDate: service.activation_date,
        billingDay: service.billing_day,
      });
      fraction = pr.days / pr.daysInMonth;
      billingLogger.info('MonthlyInvoice: Pro-rata first invoice', {
        serviceId: service.id,
        activationDate: service.activation_date,
        days: pr.days,
        daysInMonth: pr.daysInMonth,
        fraction,
      });
    }

    const round2 = (n: number) => Math.round(n * 100) / 100;
    const subtotal = round2(fullSubtotal * fraction);
    const vatAmount = round2(fullVat * fraction);
    const totalAmount = round2(subtotal + vatAmount);

    // Generate INV-YYYY-NNNNN — customer_invoices has NO DB sequence/trigger for invoice_number
    // (the legacy sequence was dropped in the baseline squash), so the app must supply it.
    const invoiceYear = now.getFullYear();
    const { data: yearInvoices } = await supabase
      .from('customer_invoices')
      .select('invoice_number')
      .like('invoice_number', `INV-${invoiceYear}-%`);
    const invoiceNumber = formatInvoiceNumber(
      invoiceYear,
      nextInvoiceSequence((yearInvoices || []).map((r) => r.invoice_number as string), invoiceYear)
    );

    // Build line items
    const periodName = now.toLocaleDateString('en-ZA', {
      month: 'long',
      year: 'numeric',
    });
    const lineItems = [
      {
        description: `${service.package_name} - ${periodName}`,
        quantity: 1,
        unit_price: subtotal,
        amount: subtotal,
        type: 'recurring',
      },
    ];

    // Determine collection method: onboarding customers use debit_order, others default to existing behavior
    let paymentCollectionMethod: string | null = null;
    if (service.customer?.onboarding_status === 'billing_ready') {
      paymentCollectionMethod = 'debit_order';
    }

    // Insert invoice (invoice_number generated above — no DB trigger exists for customer_invoices)
    const invoicePayload: Record<string, any> = {
      invoice_number: invoiceNumber,
      customer_id: service.customer_id,
      service_id: service.id,
      invoice_date: invoiceDate,
      due_date: dueDate,
      period_start: periodStart,
      period_end: periodEnd,
      subtotal,
      vat_rate: vatRate,
      tax_amount: vatAmount,
      total_amount: totalAmount,
      amount_due: totalAmount, // new invoice: full amount owed (NOT NULL column)
      amount_paid: 0,
      line_items: lineItems,
      invoice_type: 'recurring',
      status: 'sent', // valid_invoice_status CHECK allows draft|sent|paid|partial|overdue|cancelled|voided ('unpaid' is invalid)
    };

    if (paymentCollectionMethod) {
      invoicePayload.payment_collection_method = paymentCollectionMethod;
    }

    const { data: invoice, error } = await supabase
      .from('customer_invoices')
      .insert(invoicePayload)
      .select('id, invoice_number')
      .single();

    if (error) {
      billingLogger.error('MonthlyInvoice: Failed to create invoice', {
        serviceId: service.id,
        error: error.message,
      });
      return null;
    }

    return invoice;
  }

  /**
   * Update last_invoice_date on service to prevent duplicate billing
   */
  async updateLastInvoiceDate(serviceId: string): Promise<void> {
    const supabase = await this.getClient();
    const today = nowISO().split('T')[0];

    const { error } = await supabase
      .from('customer_services')
      .update({ last_invoice_date: today })
      .eq('id', serviceId);

    if (error) {
      billingLogger.error('MonthlyInvoice: Failed to update last_invoice_date', {
        serviceId,
        error: error.message,
      });
      // Don't throw - invoice was created successfully
    }
  }

  /**
   * Log billing run to billing_cron_logs table
   * Note: Table created in Task 5, this will gracefully fail if table doesn't exist
   */
  async logBillingRun(result: MonthlyBillingResult): Promise<void> {
    try {
      const supabase = await this.getClient();
      await supabase.from('billing_cron_logs').insert({
        run_id: result.runId,
        billing_day: result.billingDay,
        started_at: result.startedAt,
        completed_at: result.completedAt,
        dry_run: result.dryRun,
        total_services: result.summary.totalServices,
        processed: result.summary.processed,
        successful: result.summary.successful,
        failed: result.summary.failed,
        skipped: result.summary.skipped,
        results: result.results,
      });
    } catch (error) {
      // Table may not exist yet - log but don't fail
      billingLogger.warn('MonthlyInvoice: Failed to log billing run', {
        runId: result.runId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Build summary from results array
   */
  private buildSummary(results: InvoiceGenerationResult[]): {
    totalServices: number;
    processed: number;
    successful: number;
    failed: number;
    skipped: number;
  } {
    const totalServices = results.length;
    const skipped = results.filter((r) => r.skipped).length;
    const processed = totalServices - skipped;
    const successful = results.filter((r) => r.success && !r.skipped).length;
    const failed = results.filter((r) => !r.success).length;

    return {
      totalServices,
      processed,
      successful,
      failed,
      skipped,
    };
  }
}

// =============================================================================
// CONVENIENCE EXPORTS
// =============================================================================

/**
 * Generate monthly invoices for services due today
 * Main entry point for cron jobs
 */
export async function generateMonthlyInvoices(
  options: MonthlyBillingOptions = {}
): Promise<MonthlyBillingResult> {
  const generator = new MonthlyInvoiceGenerator();
  return generator.generateMonthlyInvoices(options);
}

/**
 * Preview billing run without making changes
 * Useful for testing and validation
 */
export async function previewMonthlyBilling(
  billingDay?: number,
  customerId?: string
): Promise<MonthlyBillingResult> {
  const generator = new MonthlyInvoiceGenerator();
  return generator.generateMonthlyInvoices({
    dryRun: true,
    billingDay,
    customerId,
  });
}

/**
 * Generate invoice for a single customer
 * Useful for manual billing or retries
 */
export async function generateInvoiceForCustomer(
  customerId: string,
  options: { skipZohoSync?: boolean; skipPayNow?: boolean } = {}
): Promise<InvoiceGenerationResult[]> {
  const generator = new MonthlyInvoiceGenerator();
  const result = await generator.generateMonthlyInvoices({
    customerId,
    dryRun: false,
    skipZohoSync: options.skipZohoSync,
    skipPayNow: options.skipPayNow,
  });
  return result.results;
}
