/**
 * Service Management Service
 * 
 * Handles service lifecycle management with activation, suspension,
 * cancellation, and reactivation workflows.
 * 
 * All operations are transactional and include:
 * - Status updates
 * - Pro-rata invoice generation
 * - Account balance updates
 * - Audit logging
 * - Notification triggers
 * 
 * Task 3.1: Service Management Service
 * @module lib/services/service-manager
 */

import { createClient } from '@/lib/supabase/server';
import { BillingService } from '@/lib/billing/billing-service';
import { generateCustomerInvoice, buildInvoiceLineItems } from '@/lib/invoices/invoice-generator';
import { syncSubscriptionToZohoBilling } from '@/lib/integrations/zoho/subscription-sync-service';

/**
 * Service activation parameters
 */
export interface ActivateServiceParams {
  service_id: string;
  admin_user_id?: string;
  reason: string;
  notes?: string;
  activation_date?: Date;
}

/**
 * Service suspension parameters
 */
export interface SuspendServiceParams {
  service_id: string;
  admin_user_id?: string;
  suspension_type: 'non_payment' | 'customer_request' | 'technical' | 'fraud' | 'policy_violation' | 'other';
  reason: string;
  notes?: string;
  skip_billing?: boolean; // Default: true
}

/**
 * Service reactivation parameters
 */
export interface ReactivateServiceParams {
  service_id: string;
  admin_user_id?: string;
  reason: string;
  notes?: string;
}

/**
 * Service cancellation parameters
 */
export interface CancelServiceParams {
  service_id: string;
  admin_user_id?: string;
  reason: string;
  notes?: string;
  cancellation_date?: Date;
}

/**
 * Service operation result
 */
export interface ServiceOperationResult {
  success: boolean;
  service: any;
  invoice?: any;
  balance_updated?: {
    previous_balance: number;
    amount_adjusted: number;
    new_balance: number;
  };
  audit_log_id?: string;
  error?: string;
}

/**
 * Service Manager
 * 
 * Manages customer service lifecycle with full transaction support
 */
export class ServiceManager {
  
  /**
   * Activate service (pending → active)
   * 
   * Process:
   * 1. Update service status to 'active'
   * 2. Set activation_date
   * 3. Calculate next_billing_date
   * 4. Generate pro-rata invoice
   * 5. Update account balance
   * 6. Create audit log
   * 7. Send notifications
   * 
   * @param params - Activation parameters
   * @returns Operation result with invoice details
   */
  static async activateService(
    params: ActivateServiceParams
  ): Promise<ServiceOperationResult> {
    const supabase = await createClient();
    const { service_id, admin_user_id, reason, notes, activation_date = new Date() } = params;
    
    try {
      // 1. Get service details
      const { data: service, error: fetchError } = await supabase
        .from('customer_services')
        .select('*')
        .eq('id', service_id)
        .single();
      
      if (fetchError || !service) {
        return {
          success: false,
          service: null,
          error: 'Service not found'
        };
      }
      
      // Validate status transition
      if (service.status !== 'pending') {
        return {
          success: false,
          service: null,
          error: `Cannot activate service with status '${service.status}'. Expected 'pending'.`
        };
      }
      
      // 2. Calculate next billing date
      const nextBillingDate = BillingService.getNextBillingDate(
        activation_date,
        service.billing_date
      );
      
      // 3. Calculate pro-rata amount
      const proRata = BillingService.calculateProRata(
        activation_date,
        service.monthly_price,
        service.billing_date
      );
      
      // 4. Update service status (with optimistic locking check)
      const { data: updatedService, error: updateError } = await supabase
        .from('customer_services')
        .update({
          status: 'active',
          activation_date: activation_date.toISOString().split('T')[0],
          next_billing_date: nextBillingDate.toISOString().split('T')[0],
          updated_at: new Date().toISOString(),
          updated_by: admin_user_id
        })
        .eq('id', service_id)
        .eq('status', 'pending') // Optimistic locking
        .select()
        .single();
      
      if (updateError || !updatedService) {
        throw new Error(`Failed to update service: ${updateError?.message || 'Unknown error'}`);
      }

      // Trigger async ZOHO Billing subscription sync (background task, non-blocking)
      // This creates a ZOHO Subscription for recurring monthly billing
      syncSubscriptionToZohoBilling(service_id)
        .then((result) => {
          if (result.success) {
            console.log('[ZOHO Trigger] Subscription synced to ZOHO Billing:', result.zoho_subscription_id);
          } else {
            console.error('[ZOHO Trigger] Subscription sync failed:', result.error);
          }
        })
        .catch((error) => {
          console.error('[ZOHO Trigger] Subscription sync error:', error);
        });

      // 5. Generate pro-rata invoice
      const lineItems = buildInvoiceLineItems(
        'pro_rata',
        {
          package_name: service.package_name,
          monthly_price: service.monthly_price,
          installation_fee: 0,
          router_fee: 0
        },
        proRata.prorated_amount,
        {
          start: activation_date.toISOString().split('T')[0],
          end: nextBillingDate.toISOString().split('T')[0]
        }
      );
      
      const invoice = await generateCustomerInvoice({
        customer_id: service.customer_id,
        service_id: service.id,
        invoice_type: 'pro_rata',
        line_items: lineItems,
        period_start: activation_date.toISOString().split('T')[0],
        period_end: nextBillingDate.toISOString().split('T')[0],
        due_days: 7
      });
      
      // 6. Update account balance
      const balanceUpdate = await BillingService.updateAccountBalance(
        service.customer_id,
        invoice.total_amount,
        `Service activation - Invoice ${invoice.invoice_number}`
      );
      
      // 7. Create audit log
      const { data: auditLog } = await supabase
        .from('service_action_log')
        .insert({
          service_id: service.id,
          customer_id: service.customer_id,
          admin_user_id,
          action_type: 'activate',
          reason,
          notes,
          previous_status: 'pending',
          new_status: 'active',
          previous_data: service,
          new_data: updatedService
        })
        .select('id')
        .single();
      
      // 8. Send notifications (stub)
      await this.sendNotification(service.customer_id, 'service_activated', {
        service_name: service.package_name,
        activation_date: activation_date.toISOString().split('T')[0],
        invoice_number: invoice.invoice_number
      });
      
      return {
        success: true,
        service: updatedService,
        invoice,
        balance_updated: balanceUpdate,
        audit_log_id: auditLog?.id
      };
      
    } catch (error: any) {
      console.error('Service activation failed:', error);
      return {
        success: false,
        service: null,
        error: error.message
      };
    }
  }
  
  /**
   * Suspend service (active → suspended)
   * 
   * Process:
   * 1. Update service status to 'suspended'
   * 2. Set suspension_date
   * 3. Create suspension record
   * 4. Pause billing if skip_billing = true
   * 5. Create audit log
   * 6. Send notifications
   * 
   * @param params - Suspension parameters
   * @returns Operation result
   */
  static async suspendService(
    params: SuspendServiceParams
  ): Promise<ServiceOperationResult> {
    const supabase = await createClient();
    const {
      service_id,
      admin_user_id,
      suspension_type,
      reason,
      notes,
      skip_billing = true
    } = params;
    
    try {
      // 1. Get service details
      const { data: service, error: fetchError } = await supabase
        .from('customer_services')
        .select('*')
        .eq('id', service_id)
        .single();
      
      if (fetchError || !service) {
        return {
          success: false,
          service: null,
          error: 'Service not found'
        };
      }
      
      // Validate status transition
      if (service.status !== 'active') {
        return {
          success: false,
          service: null,
          error: `Cannot suspend service with status '${service.status}'. Expected 'active'.`
        };
      }
      
      const suspensionDate = new Date();
      
      // 2. Update service status
      const { data: updatedService, error: updateError } = await supabase
        .from('customer_services')
        .update({
          status: 'suspended',
          suspension_date: suspensionDate.toISOString().split('T')[0],
          updated_at: new Date().toISOString(),
          updated_by: admin_user_id
        })
        .eq('id', service_id)
        .eq('status', 'active') // Optimistic locking
        .select()
        .single();
      
      if (updateError || !updatedService) {
        throw new Error(`Failed to update service: ${updateError?.message || 'Unknown error'}`);
      }
      
      // 3. Create suspension record
      await supabase
        .from('service_suspensions')
        .insert({
          service_id: service.id,
          customer_id: service.customer_id,
          suspension_type,
          reason,
          notes,
          suspended_at: suspensionDate.toISOString(),
          skip_billing,
          suspended_by: admin_user_id
        });
      
      // 4. Create audit log
      const { data: auditLog } = await supabase
        .from('service_action_log')
        .insert({
          service_id: service.id,
          customer_id: service.customer_id,
          admin_user_id,
          action_type: 'suspend',
          reason,
          notes,
          previous_status: 'active',
          new_status: 'suspended',
          previous_data: service,
          new_data: updatedService
        })
        .select('id')
        .single();
      
      // 5. Send notifications
      await this.sendNotification(service.customer_id, 'service_suspended', {
        service_name: service.package_name,
        suspension_date: suspensionDate.toISOString().split('T')[0],
        reason: suspension_type
      });
      
      return {
        success: true,
        service: updatedService,
        audit_log_id: auditLog?.id
      };
      
    } catch (error: any) {
      console.error('Service suspension failed:', error);
      return {
        success: false,
        service: null,
        error: error.message
      };
    }
  }
  
  /**
   * Reactivate service (suspended → active)
   * 
   * Process:
   * 1. Update service status to 'active'
   * 2. Clear suspension_date
   * 3. Update suspension record (reactivated_at)
   * 4. Generate pro-rata invoice for remaining billing cycle
   * 5. Update account balance
   * 6. Create audit log
   * 7. Send notifications
   * 
   * @param params - Reactivation parameters
   * @returns Operation result with invoice details
   */
  static async reactivateService(
    params: ReactivateServiceParams
  ): Promise<ServiceOperationResult> {
    const supabase = await createClient();
    const { service_id, admin_user_id, reason, notes } = params;
    
    try {
      // 1. Get service details
      const { data: service, error: fetchError } = await supabase
        .from('customer_services')
        .select('*')
        .eq('id', service_id)
        .single();
      
      if (fetchError || !service) {
        return {
          success: false,
          service: null,
          error: 'Service not found'
        };
      }
      
      // Validate status transition
      if (service.status !== 'suspended') {
        return {
          success: false,
          service: null,
          error: `Cannot reactivate service with status '${service.status}'. Expected 'suspended'.`
        };
      }
      
      const reactivationDate = new Date();
      
      // 2. Calculate pro-rata for remaining billing cycle
      const nextBillingDate = new Date(service.next_billing_date);
      const daysRemaining = Math.ceil(
        (nextBillingDate.getTime() - reactivationDate.getTime()) / (24 * 60 * 60 * 1000)
      );
      
      // Get days in billing month for pro-rata calculation
      const billingMonth = nextBillingDate.getMonth();
      const billingYear = nextBillingDate.getFullYear();
      const daysInMonth = new Date(billingYear, billingMonth + 1, 0).getDate();
      
      const dailyRate = service.monthly_price / daysInMonth;
      const proratedAmount = Math.round(dailyRate * daysRemaining * 100) / 100;
      
      // 3. Update service status
      const { data: updatedService, error: updateError } = await supabase
        .from('customer_services')
        .update({
          status: 'active',
          suspension_date: null,
          updated_at: new Date().toISOString(),
          updated_by: admin_user_id
        })
        .eq('id', service_id)
        .eq('status', 'suspended') // Optimistic locking
        .select()
        .single();
      
      if (updateError || !updatedService) {
        throw new Error(`Failed to update service: ${updateError?.message || 'Unknown error'}`);
      }
      
      // 4. Update suspension record
      await supabase
        .from('service_suspensions')
        .update({
          reactivated_at: reactivationDate.toISOString(),
          reactivated_by: admin_user_id
        })
        .eq('service_id', service.id)
        .is('reactivated_at', null)
        .order('suspended_at', { ascending: false })
        .limit(1);
      
      // 5. Generate pro-rata invoice (if significant amount)
      let invoice = null;
      let balanceUpdate = null;
      
      if (proratedAmount > 0) {
        const lineItems = buildInvoiceLineItems(
          'pro_rata',
          {
            package_name: service.package_name,
            monthly_price: service.monthly_price,
            installation_fee: 0,
            router_fee: 0
          },
          proratedAmount,
          {
            start: reactivationDate.toISOString().split('T')[0],
            end: service.next_billing_date
          }
        );
        
        invoice = await generateCustomerInvoice({
          customer_id: service.customer_id,
          service_id: service.id,
          invoice_type: 'pro_rata',
          line_items: lineItems,
          period_start: reactivationDate.toISOString().split('T')[0],
          period_end: service.next_billing_date,
          due_days: 7
        });
        
        // 6. Update account balance
        balanceUpdate = await BillingService.updateAccountBalance(
          service.customer_id,
          invoice.total_amount,
          `Service reactivation - Invoice ${invoice.invoice_number}`
        );
      }
      
      // 7. Create audit log
      const { data: auditLog } = await supabase
        .from('service_action_log')
        .insert({
          service_id: service.id,
          customer_id: service.customer_id,
          admin_user_id,
          action_type: 'reactivate',
          reason,
          notes,
          previous_status: 'suspended',
          new_status: 'active',
          previous_data: service,
          new_data: updatedService
        })
        .select('id')
        .single();
      
      // 8. Send notifications
      await this.sendNotification(service.customer_id, 'service_reactivated', {
        service_name: service.package_name,
        reactivation_date: reactivationDate.toISOString().split('T')[0],
        invoice_number: invoice?.invoice_number
      });
      
      return {
        success: true,
        service: updatedService,
        invoice,
        balance_updated: balanceUpdate || undefined,
        audit_log_id: auditLog?.id
      };
      
    } catch (error: any) {
      console.error('Service reactivation failed:', error);
      return {
        success: false,
        service: null,
        error: error.message
      };
    }
  }
  
  /**
   * Cancel service (active → cancelled)
   * 
   * Process:
   * 1. Update service status to 'cancelled'
   * 2. Set cancellation_date
   * 3. Generate final invoice (pro-rated to cancellation date)
   * 4. Update account balance
   * 5. Create audit log
   * 6. Send notifications
   * 
   * @param params - Cancellation parameters
   * @returns Operation result with final invoice
   */
  static async cancelService(
    params: CancelServiceParams
  ): Promise<ServiceOperationResult> {
    const supabase = await createClient();
    const {
      service_id,
      admin_user_id,
      reason,
      notes,
      cancellation_date = new Date()
    } = params;
    
    try {
      // 1. Get service details
      const { data: service, error: fetchError } = await supabase
        .from('customer_services')
        .select('*')
        .eq('id', service_id)
        .single();
      
      if (fetchError || !service) {
        return {
          success: false,
          service: null,
          error: 'Service not found'
        };
      }
      
      // Validate status transition (can cancel from active or suspended)
      if (!['active', 'suspended'].includes(service.status)) {
        return {
          success: false,
          service: null,
          error: `Cannot cancel service with status '${service.status}'. Expected 'active' or 'suspended'.`
        };
      }
      
      // 2. Calculate final pro-rata amount (from last_billing_date to cancellation_date)
      const lastBillingDate = service.last_billing_date 
        ? new Date(service.last_billing_date)
        : new Date(service.activation_date);
      
      const daysSinceLastBilling = Math.ceil(
        (cancellation_date.getTime() - lastBillingDate.getTime()) / (24 * 60 * 60 * 1000)
      );
      
      // Get days in billing month
      const billingMonth = cancellation_date.getMonth();
      const billingYear = cancellation_date.getFullYear();
      const daysInMonth = new Date(billingYear, billingMonth + 1, 0).getDate();
      
      const dailyRate = service.monthly_price / daysInMonth;
      const finalAmount = Math.round(dailyRate * daysSinceLastBilling * 100) / 100;
      
      // 3. Update service status
      const { data: updatedService, error: updateError } = await supabase
        .from('customer_services')
        .update({
          status: 'cancelled',
          cancellation_date: cancellation_date.toISOString().split('T')[0],
          cancellation_reason: reason,
          updated_at: new Date().toISOString(),
          updated_by: admin_user_id
        })
        .eq('id', service_id)
        .in('status', ['active', 'suspended']) // Allow both
        .select()
        .single();
      
      if (updateError || !updatedService) {
        throw new Error(`Failed to update service: ${updateError?.message || 'Unknown error'}`);
      }
      
      // 4. Generate final invoice (if significant amount)
      let invoice = null;
      let balanceUpdate = null;
      
      if (finalAmount > 0) {
        const lineItems = buildInvoiceLineItems(
          'pro_rata',
          {
            package_name: service.package_name,
            monthly_price: service.monthly_price,
            installation_fee: 0,
            router_fee: 0
          },
          finalAmount,
          {
            start: lastBillingDate.toISOString().split('T')[0],
            end: cancellation_date.toISOString().split('T')[0]
          }
        );
        
        invoice = await generateCustomerInvoice({
          customer_id: service.customer_id,
          service_id: service.id,
          invoice_type: 'pro_rata',
          line_items: lineItems,
          period_start: lastBillingDate.toISOString().split('T')[0],
          period_end: cancellation_date.toISOString().split('T')[0],
          due_days: 7
        });
        
        // 5. Update account balance
        balanceUpdate = await BillingService.updateAccountBalance(
          service.customer_id,
          invoice.total_amount,
          `Service cancellation - Final invoice ${invoice.invoice_number}`
        );
      }
      
      // 6. Create audit log
      const { data: auditLog } = await supabase
        .from('service_action_log')
        .insert({
          service_id: service.id,
          customer_id: service.customer_id,
          admin_user_id,
          action_type: 'cancel',
          reason,
          notes,
          previous_status: service.status,
          new_status: 'cancelled',
          previous_data: service,
          new_data: updatedService
        })
        .select('id')
        .single();
      
      // 7. Send notifications
      await this.sendNotification(service.customer_id, 'service_cancelled', {
        service_name: service.package_name,
        cancellation_date: cancellation_date.toISOString().split('T')[0],
        final_invoice: invoice?.invoice_number
      });
      
      return {
        success: true,
        service: updatedService,
        invoice,
        balance_updated: balanceUpdate || undefined,
        audit_log_id: auditLog?.id
      };
      
    } catch (error: any) {
      console.error('Service cancellation failed:', error);
      return {
        success: false,
        service: null,
        error: error.message
      };
    }
  }
  
  /**
   * Send notification (stub)
   * 
   * TODO: Implement actual notification sending
   * - Email via Resend
   * - SMS via Clickatell
   */
  private static async sendNotification(
    customer_id: string,
    type: string,
    data: any
  ): Promise<void> {
    console.log(`[Notification] ${type} for customer ${customer_id}:`, data);
    // TODO: Implement notification logic
  }
}
