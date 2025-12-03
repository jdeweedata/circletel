/**
 * Invoice Notification Tracking Service
 *
 * Tracks all notifications sent for overdue invoices.
 * Provides analytics for AR management and DSO tracking.
 *
 * @module lib/billing/notification-tracking-service
 */

import { createClient } from '@/lib/supabase/server';

// =============================================================================
// Types
// =============================================================================

export type NotificationType = 'sms' | 'email' | 'whatsapp' | 'call';
export type NotificationStatus = 'pending' | 'sent' | 'delivered' | 'failed' | 'bounced' | 'opened' | 'clicked';
export type NotificationTemplate = 'first_reminder' | 'second_reminder' | 'final_notice' | 'due_reminder' | 'overdue_reminder' | 'payment_confirmation' | 'custom';

export interface NotificationLogEntry {
  invoice_id: string;
  invoice_number: string;
  customer_id: string;
  notification_type: NotificationType;
  notification_template?: NotificationTemplate;
  recipient: string;
  message_content?: string;
  status: NotificationStatus;
  provider?: string;
  provider_message_id?: string;
  error_message?: string;
  amount_due: number;
  days_overdue: number;
  metadata?: Record<string, unknown>;
}

export interface ARAgingSummary {
  total_outstanding_invoices: number;
  total_outstanding_amount: number;
  current_count: number;
  current_amount: number;
  overdue_1_30_count: number;
  overdue_1_30_amount: number;
  overdue_31_60_count: number;
  overdue_31_60_amount: number;
  overdue_61_90_count: number;
  overdue_61_90_amount: number;
  overdue_90_plus_count: number;
  overdue_90_plus_amount: number;
  avg_days_overdue: number;
}

export interface NotificationAnalytics {
  date: string;
  notification_type: NotificationType;
  total_sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  failed: number;
  total_amount_notified: number;
  avg_days_overdue: number;
}

export interface DSOMetrics {
  dso_current: number;
  dso_30_day_avg: number;
  dso_trend: 'improving' | 'stable' | 'worsening';
  best_possible_dso: number;
  collection_effectiveness_index: number;
}

export interface CollectionEffectiveness {
  total_notifications_sent: number;
  total_amount_collected: number;
  collection_rate: number;
  avg_days_to_payment: number;
  response_rate: number;
}

// =============================================================================
// Notification Tracking Service
// =============================================================================

export class NotificationTrackingService {
  /**
   * Log a notification sent for an invoice
   */
  static async logNotification(entry: NotificationLogEntry): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
      const supabase = await createClient();

      const { data, error } = await supabase
        .from('invoice_notification_log')
        .insert({
          invoice_id: entry.invoice_id,
          invoice_number: entry.invoice_number,
          customer_id: entry.customer_id,
          notification_type: entry.notification_type,
          notification_template: entry.notification_template,
          recipient: entry.recipient,
          message_content: entry.message_content,
          status: entry.status,
          provider: entry.provider,
          provider_message_id: entry.provider_message_id,
          error_message: entry.error_message,
          amount_due: entry.amount_due,
          days_overdue: entry.days_overdue,
          sent_at: entry.status === 'sent' ? new Date().toISOString() : null,
          metadata: entry.metadata || {},
        })
        .select('id')
        .single();

      if (error) {
        console.error('[NotificationTracking] Failed to log notification:', error);
        return { success: false, error: error.message };
      }

      return { success: true, id: data.id };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('[NotificationTracking] Error:', message);
      return { success: false, error: message };
    }
  }

  /**
   * Update notification status (e.g., when delivery confirmation received)
   */
  static async updateNotificationStatus(
    notificationId: string,
    status: NotificationStatus,
    metadata?: Record<string, unknown>
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const supabase = await createClient();

      const updateData: Record<string, unknown> = { status };

      // Set appropriate timestamp based on status
      if (status === 'delivered') {
        updateData.delivered_at = new Date().toISOString();
      } else if (status === 'opened') {
        updateData.opened_at = new Date().toISOString();
      } else if (status === 'clicked') {
        updateData.clicked_at = new Date().toISOString();
      }

      if (metadata) {
        updateData.metadata = metadata;
      }

      const { error } = await supabase
        .from('invoice_notification_log')
        .update(updateData)
        .eq('id', notificationId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: message };
    }
  }

  /**
   * Get AR aging summary
   */
  static async getARAgingSummary(): Promise<ARAgingSummary | null> {
    try {
      const supabase = await createClient();

      const { data, error } = await supabase
        .from('v_ar_dashboard_summary')
        .select('*')
        .single();

      if (error) {
        console.error('[NotificationTracking] Failed to get AR summary:', error);
        return null;
      }

      return data as ARAgingSummary;
    } catch (error) {
      console.error('[NotificationTracking] Error getting AR summary:', error);
      return null;
    }
  }

  /**
   * Get notification analytics for a date range
   */
  static async getNotificationAnalytics(
    startDate: string,
    endDate: string
  ): Promise<NotificationAnalytics[]> {
    try {
      const supabase = await createClient();

      const { data, error } = await supabase
        .from('v_notification_analytics')
        .select('*')
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: false });

      if (error) {
        console.error('[NotificationTracking] Failed to get analytics:', error);
        return [];
      }

      return (data || []) as NotificationAnalytics[];
    } catch (error) {
      console.error('[NotificationTracking] Error getting analytics:', error);
      return [];
    }
  }

  /**
   * Calculate DSO (Days Sales Outstanding) metrics
   */
  static async calculateDSOMetrics(): Promise<DSOMetrics | null> {
    try {
      const supabase = await createClient();

      // Get current AR and recent revenue
      const { data: invoices, error } = await supabase
        .from('customer_invoices')
        .select('total_amount, amount_due, status, invoice_date, due_date, paid_at')
        .gte('invoice_date', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

      if (error || !invoices) {
        return null;
      }

      // Calculate metrics
      const totalAR = invoices
        .filter(i => ['unpaid', 'overdue', 'partial'].includes(i.status))
        .reduce((sum, i) => sum + (i.amount_due || 0), 0);

      const totalRevenue90Days = invoices.reduce((sum, i) => sum + i.total_amount, 0);
      const avgDailyRevenue = totalRevenue90Days / 90;

      // Current DSO = (Total AR / Average Daily Revenue)
      const dsoCurrent = avgDailyRevenue > 0 ? totalAR / avgDailyRevenue : 0;

      // Best Possible DSO = (Current AR / Average Daily Revenue)
      const currentAR = invoices
        .filter(i => i.status === 'unpaid' && new Date(i.due_date) >= new Date())
        .reduce((sum, i) => sum + (i.amount_due || 0), 0);
      const bestPossibleDso = avgDailyRevenue > 0 ? currentAR / avgDailyRevenue : 0;

      // Collection Effectiveness Index = ((Beginning AR + Credit Sales - Ending AR) / (Beginning AR + Credit Sales)) * 100
      // Simplified: (Payments Received / Total Billed) * 100
      const paidInvoices = invoices.filter(i => i.status === 'paid');
      const totalPaid = paidInvoices.reduce((sum, i) => sum + i.total_amount, 0);
      const cei = totalRevenue90Days > 0 ? (totalPaid / totalRevenue90Days) * 100 : 0;

      // Get 30-day average DSO from snapshots
      const { data: snapshots } = await supabase
        .from('ar_aging_snapshots')
        .select('dso_current')
        .order('snapshot_date', { ascending: false })
        .limit(30);

      const dso30DayAvg = snapshots && snapshots.length > 0
        ? snapshots.reduce((sum, s) => sum + (s.dso_current || 0), 0) / snapshots.length
        : dsoCurrent;

      // Determine trend
      let trend: 'improving' | 'stable' | 'worsening' = 'stable';
      if (dsoCurrent < dso30DayAvg - 2) trend = 'improving';
      else if (dsoCurrent > dso30DayAvg + 2) trend = 'worsening';

      return {
        dso_current: Math.round(dsoCurrent * 100) / 100,
        dso_30_day_avg: Math.round(dso30DayAvg * 100) / 100,
        dso_trend: trend,
        best_possible_dso: Math.round(bestPossibleDso * 100) / 100,
        collection_effectiveness_index: Math.round(cei * 100) / 100,
      };
    } catch (error) {
      console.error('[NotificationTracking] Error calculating DSO:', error);
      return null;
    }
  }

  /**
   * Get collection effectiveness metrics
   */
  static async getCollectionEffectiveness(days: number = 30): Promise<CollectionEffectiveness | null> {
    try {
      const supabase = await createClient();
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

      // Get notifications sent
      const { data: notifications, error: notifError } = await supabase
        .from('invoice_notification_log')
        .select('id, invoice_id, amount_due')
        .gte('created_at', startDate)
        .eq('status', 'sent');

      if (notifError) {
        return null;
      }

      // Get payments received for notified invoices
      const { data: paidInvoices, error: paidError } = await supabase
        .from('customer_invoices')
        .select('id, total_amount, paid_at')
        .eq('status', 'paid')
        .gte('paid_at', startDate);

      if (paidError) {
        return null;
      }

      // Get collection activity
      const { data: activities, error: actError } = await supabase
        .from('invoice_collection_activity')
        .select('days_to_payment, customer_responded')
        .not('days_to_payment', 'is', null);

      const totalNotifications = notifications?.length || 0;
      const totalAmountCollected = paidInvoices?.reduce((sum, i) => sum + i.total_amount, 0) || 0;
      const totalAmountNotified = notifications?.reduce((sum, n) => sum + n.amount_due, 0) || 0;

      const collectionRate = totalAmountNotified > 0 
        ? (totalAmountCollected / totalAmountNotified) * 100 
        : 0;

      const avgDaysToPayment = activities && activities.length > 0
        ? activities.reduce((sum, a) => sum + (a.days_to_payment || 0), 0) / activities.length
        : 0;

      const responseRate = activities && activities.length > 0
        ? (activities.filter(a => a.customer_responded).length / activities.length) * 100
        : 0;

      return {
        total_notifications_sent: totalNotifications,
        total_amount_collected: totalAmountCollected,
        collection_rate: Math.round(collectionRate * 100) / 100,
        avg_days_to_payment: Math.round(avgDaysToPayment * 100) / 100,
        response_rate: Math.round(responseRate * 100) / 100,
      };
    } catch (error) {
      console.error('[NotificationTracking] Error getting collection effectiveness:', error);
      return null;
    }
  }

  /**
   * Get notification history for a specific invoice
   */
  static async getInvoiceNotificationHistory(invoiceId: string): Promise<NotificationLogEntry[]> {
    try {
      const supabase = await createClient();

      const { data, error } = await supabase
        .from('invoice_notification_log')
        .select('*')
        .eq('invoice_id', invoiceId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[NotificationTracking] Failed to get invoice history:', error);
        return [];
      }

      return (data || []) as NotificationLogEntry[];
    } catch (error) {
      console.error('[NotificationTracking] Error getting invoice history:', error);
      return [];
    }
  }

  /**
   * Create daily AR aging snapshot (called by cron job)
   */
  static async createDailySnapshot(): Promise<{ success: boolean; error?: string }> {
    try {
      const supabase = await createClient();
      const today = new Date().toISOString().split('T')[0];

      // Get AR summary
      const summary = await this.getARAgingSummary();
      if (!summary) {
        return { success: false, error: 'Failed to get AR summary' };
      }

      // Get DSO metrics
      const dso = await this.calculateDSOMetrics();

      // Get notification counts for today
      const { data: notifCounts } = await supabase
        .from('invoice_notification_log')
        .select('notification_type')
        .gte('created_at', today);

      const smsCount = notifCounts?.filter(n => n.notification_type === 'sms').length || 0;
      const emailCount = notifCounts?.filter(n => n.notification_type === 'email').length || 0;

      // Get payments received today
      const { data: payments } = await supabase
        .from('customer_invoices')
        .select('total_amount')
        .eq('status', 'paid')
        .gte('paid_at', today);

      const paymentsAmount = payments?.reduce((sum, p) => sum + p.total_amount, 0) || 0;
      const paymentsCount = payments?.length || 0;

      // Insert snapshot
      const { error } = await supabase
        .from('ar_aging_snapshots')
        .upsert({
          snapshot_date: today,
          total_outstanding: summary.total_outstanding_amount,
          total_invoices: summary.total_outstanding_invoices,
          current_amount: summary.current_amount,
          current_count: summary.current_count,
          overdue_1_30_amount: summary.overdue_1_30_amount,
          overdue_1_30_count: summary.overdue_1_30_count,
          overdue_31_60_amount: summary.overdue_31_60_amount,
          overdue_31_60_count: summary.overdue_31_60_count,
          overdue_61_90_amount: summary.overdue_61_90_amount,
          overdue_61_90_count: summary.overdue_61_90_count,
          overdue_90_plus_amount: summary.overdue_90_plus_amount,
          overdue_90_plus_count: summary.overdue_90_plus_count,
          dso_current: dso?.dso_current,
          dso_best_possible: dso?.best_possible_dso,
          collection_effectiveness_index: dso?.collection_effectiveness_index,
          average_days_delinquent: summary.avg_days_overdue,
          sms_sent_count: smsCount,
          email_sent_count: emailCount,
          total_notifications: smsCount + emailCount,
          payments_received_amount: paymentsAmount,
          payments_received_count: paymentsCount,
        }, { onConflict: 'snapshot_date' });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: message };
    }
  }
}
