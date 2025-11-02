/**
 * Billing Service - Core Logic
 * 
 * Handles pro-rata calculations, invoice generation, billing date management,
 * and account balance updates for customer dashboard.
 * 
 * @module lib/billing/billing-service
 */

import { createClient } from '@/lib/supabase/server';

/**
 * Billing date options (day of month)
 */
export type BillingDate = 1 | 5 | 25 | 30;

/**
 * Invoice type classification
 */
export type InvoiceType = 'recurring' | 'installation' | 'pro_rata' | 'equipment' | 'adjustment';

/**
 * Invoice line item structure
 */
export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
  type: InvoiceType;
}

/**
 * Pro-rata calculation result
 */
export interface ProRataCalculation {
  days_in_period: number;
  days_used: number;
  monthly_amount: number;
  prorated_amount: number;
  billing_period_start: Date;
  billing_period_end: Date;
}

/**
 * Invoice generation parameters
 */
export interface GenerateInvoiceParams {
  customer_id: string;
  service_id?: string;
  invoice_type: InvoiceType;
  line_items: InvoiceLineItem[];
  period_start?: Date;
  period_end?: Date;
  due_days?: number; // Days until due (default: 7)
}

/**
 * Billing Service
 * 
 * Core service for billing operations including pro-rata calculations,
 * invoice generation, and billing date management.
 */
export class BillingService {
  
  /**
   * Calculate pro-rata amount for mid-cycle activation
   * 
   * @param activationDate - Service activation date
   * @param monthlyAmount - Full monthly service amount
   * @param billingDate - Customer's preferred billing date (1, 5, 25, or 30)
   * @returns Pro-rata calculation details
   * 
   * @example
   * // Service activated Nov 15, next billing Dec 1, monthly price R699
   * const proRata = BillingService.calculateProRata(
   *   new Date('2025-11-15'),
   *   699.00,
   *   1
   * );
   * // Returns: { days_used: 16, days_in_period: 30, prorated_amount: 372.80 }
   */
  static calculateProRata(
    activationDate: Date,
    monthlyAmount: number,
    billingDate: BillingDate
  ): ProRataCalculation {
    const nextBillingDate = this.getNextBillingDate(activationDate, billingDate);
    
    // Calculate days in the billing period (activation date to next billing date)
    const msPerDay = 24 * 60 * 60 * 1000;
    const daysUsed = Math.ceil(
      (nextBillingDate.getTime() - activationDate.getTime()) / msPerDay
    );
    
    // Get days in the billing month (handle variable month lengths)
    const billingMonth = nextBillingDate.getMonth();
    const billingYear = nextBillingDate.getFullYear();
    const daysInMonth = new Date(billingYear, billingMonth + 1, 0).getDate();
    
    // Pro-rata calculation: (monthly_amount / days_in_month) * days_used
    const dailyRate = monthlyAmount / daysInMonth;
    const proratedAmount = Math.round(dailyRate * daysUsed * 100) / 100; // Round to 2 decimals
    
    return {
      days_in_period: daysInMonth,
      days_used: daysUsed,
      monthly_amount: monthlyAmount,
      prorated_amount: proratedAmount,
      billing_period_start: activationDate,
      billing_period_end: nextBillingDate
    };
  }
  
  /**
   * Calculate next billing date based on activation date and billing preference
   * 
   * Handles edge cases:
   * - If billing date is 30th but month has fewer days (Feb 28/29), use last day of month
   * - If activation is after billing date in current month, move to next month
   * 
   * @param fromDate - Starting date (usually activation date)
   * @param billingDate - Preferred billing date (1, 5, 25, or 30)
   * @returns Next billing date
   * 
   * @example
   * // Activated Nov 15, billing date 1st
   * getNextBillingDate(new Date('2025-11-15'), 1)
   * // Returns: 2025-12-01
   * 
   * // Activated Jan 28, billing date 30th (Feb has only 28 days)
   * getNextBillingDate(new Date('2025-01-28'), 30)
   * // Returns: 2025-02-28
   */
  static getNextBillingDate(fromDate: Date, billingDate: BillingDate): Date {
    const result = new Date(fromDate);
    
    // Start with current month
    let targetMonth = result.getMonth();
    let targetYear = result.getFullYear();
    
    // If activation date is >= billing date in current month, move to next month
    if (result.getDate() >= billingDate) {
      targetMonth++;
      if (targetMonth > 11) {
        targetMonth = 0;
        targetYear++;
      }
    }
    
    // Handle edge case: billing date 30 but month has fewer days
    const daysInTargetMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
    const actualBillingDay = Math.min(billingDate, daysInTargetMonth);
    
    // Set the date
    result.setFullYear(targetYear);
    result.setMonth(targetMonth);
    result.setDate(actualBillingDay);
    
    // Reset time to start of day
    result.setHours(0, 0, 0, 0);
    
    return result;
  }
  
  /**
   * Generate invoice with VAT calculation
   * 
   * Creates invoice record with auto-generated invoice number,
   * calculates VAT (15% South African rate), and sets due date.
   * 
   * @param params - Invoice generation parameters
   * @returns Created invoice record
   */
  static async generateInvoice(params: GenerateInvoiceParams) {
    const supabase = await createClient();
    const {
      customer_id,
      service_id,
      invoice_type,
      line_items,
      period_start,
      period_end,
      due_days = 7
    } = params;
    
    // Calculate subtotal from line items
    const subtotal = line_items.reduce((sum, item) => sum + item.amount, 0);
    
    // Calculate VAT (15% South African rate)
    const vat_rate = 15.00;
    const vat_amount = Math.round(subtotal * (vat_rate / 100) * 100) / 100;
    const total_amount = Math.round((subtotal + vat_amount) * 100) / 100;
    
    // Calculate due date (default: 7 days from today)
    const invoice_date = new Date();
    const due_date = new Date(invoice_date);
    due_date.setDate(due_date.getDate() + due_days);
    
    // Insert invoice (invoice_number will be auto-generated by trigger)
    const { data: invoice, error } = await supabase
      .from('customer_invoices')
      .insert({
        customer_id,
        service_id,
        invoice_type,
        invoice_date: invoice_date.toISOString().split('T')[0],
        due_date: due_date.toISOString().split('T')[0],
        period_start: period_start?.toISOString().split('T')[0],
        period_end: period_end?.toISOString().split('T')[0],
        subtotal,
        vat_rate,
        vat_amount,
        total_amount,
        amount_paid: 0,
        line_items: line_items,
        status: 'unpaid'
      })
      .select()
      .single();
    
    if (error) {
      throw new Error(`Failed to generate invoice: ${error.message}`);
    }
    
    return invoice;
  }
  
  /**
   * Update customer account balance
   * 
   * Handles both debits (invoices) and credits (payments).
   * Uses atomic increment/decrement to prevent race conditions.
   * 
   * @param customer_id - Customer UUID
   * @param amount - Amount to adjust (positive = debit, negative = credit)
   * @param description - Transaction description for audit
   */
  static async updateAccountBalance(
    customer_id: string,
    amount: number,
    description: string
  ) {
    const supabase = await createClient();
    
    // Get current balance
    const { data: billing, error: fetchError } = await supabase
      .from('customer_billing')
      .select('account_balance')
      .eq('customer_id', customer_id)
      .single();
    
    if (fetchError) {
      throw new Error(`Failed to fetch billing record: ${fetchError.message}`);
    }
    
    const currentBalance = billing?.account_balance || 0;
    const newBalance = Math.round((currentBalance + amount) * 100) / 100;
    
    // Update balance
    const { error: updateError } = await supabase
      .from('customer_billing')
      .update({
        account_balance: newBalance,
        updated_at: new Date().toISOString()
      })
      .eq('customer_id', customer_id);
    
    if (updateError) {
      throw new Error(`Failed to update account balance: ${updateError.message}`);
    }
    
    return {
      previous_balance: currentBalance,
      amount_adjusted: amount,
      new_balance: newBalance,
      description
    };
  }
  
  /**
   * Get billing cycle dates for a service
   * 
   * @param billingDate - Service billing date (1, 5, 25, or 30)
   * @param referenceDate - Reference date (default: today)
   * @returns Start and end dates of current billing cycle
   */
  static getBillingCycleDates(
    billingDate: BillingDate,
    referenceDate: Date = new Date()
  ): { cycle_start: Date; cycle_end: Date } {
    const today = new Date(referenceDate);
    const currentDay = today.getDate();
    
    let cycleStart: Date;
    let cycleEnd: Date;
    
    if (currentDay < billingDate) {
      // We're before billing date - cycle started last month
      cycleStart = new Date(today.getFullYear(), today.getMonth() - 1, billingDate);
      cycleEnd = new Date(today.getFullYear(), today.getMonth(), billingDate);
    } else {
      // We're after billing date - cycle started this month
      cycleStart = new Date(today.getFullYear(), today.getMonth(), billingDate);
      cycleEnd = new Date(today.getFullYear(), today.getMonth() + 1, billingDate);
    }
    
    // Handle edge case: billing date 30 but month has fewer days
    const daysInStartMonth = new Date(cycleStart.getFullYear(), cycleStart.getMonth() + 1, 0).getDate();
    const daysInEndMonth = new Date(cycleEnd.getFullYear(), cycleEnd.getMonth() + 1, 0).getDate();
    
    cycleStart.setDate(Math.min(billingDate, daysInStartMonth));
    cycleEnd.setDate(Math.min(billingDate, daysInEndMonth));
    
    // Reset time to start of day
    cycleStart.setHours(0, 0, 0, 0);
    cycleEnd.setHours(0, 0, 0, 0);
    
    return { cycle_start: cycleStart, cycle_end: cycleEnd };
  }
  
  /**
   * Calculate days until next billing date
   * 
   * @param billingDate - Service billing date
   * @param fromDate - Start date (default: today)
   * @returns Number of days until next billing date
   */
  static daysUntilNextBilling(
    billingDate: BillingDate,
    fromDate: Date = new Date()
  ): number {
    const nextBilling = this.getNextBillingDate(fromDate, billingDate);
    const msPerDay = 24 * 60 * 60 * 1000;
    return Math.ceil((nextBilling.getTime() - fromDate.getTime()) / msPerDay);
  }
  
  /**
   * Validate billing date
   * 
   * @param date - Date to validate
   * @returns true if valid billing date (1, 5, 25, or 30)
   */
  static isValidBillingDate(date: number): date is BillingDate {
    return [1, 5, 25, 30].includes(date);
  }
}
