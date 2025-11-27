/**
 * Admin Notification Service
 * Sends notifications to internal teams (sales, service delivery, management)
 */

import { EmailNotificationService, type NotificationResult } from './notification-service';
import type { ConsumerOrder } from '@/lib/types/customer-journey';

export interface AdminNotificationConfig {
  salesTeamEmail?: string;
  serviceDeliveryEmail?: string;
  managementEmail?: string;
  ccEmails?: string[];
}

export class AdminNotificationService {
  private static config: AdminNotificationConfig = {
    salesTeamEmail: process.env.SALES_TEAM_EMAIL || 'sales@circletel.co.za',
    serviceDeliveryEmail: process.env.SERVICE_DELIVERY_EMAIL || 'servicedelivery@circletel.co.za',
    managementEmail: process.env.MANAGEMENT_EMAIL || 'management@circletel.co.za',
    ccEmails: process.env.ADMIN_CC_EMAILS ? process.env.ADMIN_CC_EMAILS.split(',') : [],
  };

  // Admin notification sender email (using verified Resend domain)
  private static adminSenderEmail = 'CircleTel Admin <devadmin@notifications.circletelsa.co.za>';

  /**
   * Send new order notification to sales and service delivery teams
   */
  static async notifyNewOrder(order: ConsumerOrder): Promise<{
    sales: NotificationResult;
    serviceDelivery: NotificationResult;
  }> {
    console.log(`[AdminNotifications] Sending new order notifications for ${order.order_number}`);

    // Prepare notification data
    const notificationData = {
      order_number: order.order_number,
      order_id: order.id,
      created_at: new Date(order.created_at).toLocaleString('en-ZA', {
        timeZone: 'Africa/Johannesburg',
        dateStyle: 'medium',
        timeStyle: 'short'
      }),

      // Customer details
      customer_name: `${order.first_name} ${order.last_name}`,
      customer_email: order.email,
      customer_phone: order.phone,
      alternate_phone: order.alternate_phone || 'N/A',

      // Location
      installation_address: order.installation_address,
      suburb: order.suburb || 'N/A',
      city: order.city || 'N/A',
      province: order.province || 'N/A',
      postal_code: order.postal_code || 'N/A',

      // Package details
      package_name: order.package_name,
      package_speed: order.package_speed,
      package_price: order.package_price,
      installation_fee: order.installation_fee || 0,
      router_included: order.router_included ? 'Yes' : 'No',
      router_rental_fee: order.router_rental_fee || 0,

      // Pricing
      total_monthly: order.package_price + (order.router_rental_fee || 0),
      total_once_off: order.installation_fee || 0,

      // Status
      payment_status: order.payment_status,
      payment_method: order.payment_method || 'Pending',
      order_status: order.status,

      // Preferences
      preferred_installation_date: order.preferred_installation_date
        ? new Date(order.preferred_installation_date).toLocaleDateString('en-ZA')
        : 'Not specified',
      contact_preference: order.contact_preference || 'email',
      special_instructions: order.special_instructions || 'None',

      // Lead source
      lead_source: order.lead_source || 'Direct',
      source_campaign: order.source_campaign || 'N/A',

      // Links
      admin_order_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://circletel.co.za'}/admin/orders/${order.id}`,
      customer_profile_url: order.customer_id
        ? `${process.env.NEXT_PUBLIC_BASE_URL || 'https://circletel.co.za'}/admin/customers/${order.customer_id}`
        : null,

      // Priority indicator
      urgency: this.calculateUrgency(order),
      urgency_color: this.getUrgencyColor(order),
    };

    // Send to sales team
    // Note: Avoid emojis in subject lines for better Microsoft deliverability
    const salesResult = await EmailNotificationService.send({
      from: this.adminSenderEmail,
      to: this.config.salesTeamEmail!,
      cc: this.config.ccEmails,
      subject: `[New Order] ${order.order_number} - ${order.first_name} ${order.last_name}`,
      template: 'admin_new_order_sales',
      data: notificationData,
    });

    // Send to service delivery team
    const serviceDeliveryResult = await EmailNotificationService.send({
      from: this.adminSenderEmail,
      to: this.config.serviceDeliveryEmail!,
      cc: this.config.ccEmails,
      subject: `[Installation Required] ${order.order_number} - ${order.city || 'New Location'}`,
      template: 'admin_new_order_service_delivery',
      data: notificationData,
    });

    // Log results
    if (salesResult.success) {
      console.log(`[AdminNotifications] Sales team notified (MessageID: ${salesResult.message_id})`);
    } else {
      console.error(`[AdminNotifications] Failed to notify sales team:`, salesResult.error);
    }

    if (serviceDeliveryResult.success) {
      console.log(`[AdminNotifications] Service delivery team notified (MessageID: ${serviceDeliveryResult.message_id})`);
    } else {
      console.error(`[AdminNotifications] Failed to notify service delivery team:`, serviceDeliveryResult.error);
    }

    return {
      sales: salesResult,
      serviceDelivery: serviceDeliveryResult,
    };
  }

  /**
   * Send urgent order notification (e.g., high-value customer, VIP, same-day installation)
   */
  static async notifyUrgentOrder(order: ConsumerOrder, reason: string): Promise<NotificationResult> {
    const notificationData = {
      order_number: order.order_number,
      customer_name: `${order.first_name} ${order.last_name}`,
      customer_email: order.email,
      customer_phone: order.phone,
      package_name: order.package_name,
      package_price: order.package_price,
      installation_address: order.installation_address,
      urgency_reason: reason,
      admin_order_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://circletel.co.za'}/admin/orders/${order.id}`,
    };

    return await EmailNotificationService.send({
      from: this.adminSenderEmail,
      to: this.config.managementEmail!,
      cc: [this.config.salesTeamEmail!, this.config.serviceDeliveryEmail!, ...(this.config.ccEmails || [])],
      subject: `[URGENT] Order ${order.order_number} - ${reason}`,
      template: 'admin_urgent_order',
      data: notificationData,
    });
  }

  /**
   * Send payment received notification to accounting/finance
   */
  static async notifyPaymentReceived(
    order: ConsumerOrder,
    paymentAmount: number,
    paymentMethod: string,
    transactionId?: string
  ): Promise<NotificationResult> {
    const accountingEmail = process.env.ACCOUNTING_EMAIL || this.config.managementEmail!;

    return await EmailNotificationService.send({
      from: this.adminSenderEmail,
      to: accountingEmail,
      cc: [this.config.salesTeamEmail!, ...(this.config.ccEmails || [])],
      subject: `[Payment Received] ${order.order_number} - R${paymentAmount.toFixed(2)}`,
      template: 'admin_payment_received',
      data: {
        order_number: order.order_number,
        customer_name: `${order.first_name} ${order.last_name}`,
        payment_amount: paymentAmount,
        payment_method: paymentMethod,
        transaction_id: transactionId || 'N/A',
        package_name: order.package_name,
        admin_order_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://circletel.co.za'}/admin/orders/${order.id}`,
      },
    });
  }

  /**
   * Send installation scheduled notification to service delivery team
   */
  static async notifyInstallationScheduled(
    order: ConsumerOrder,
    installationDate: string,
    timeSlot: string,
    technicianName?: string
  ): Promise<NotificationResult> {
    return await EmailNotificationService.send({
      from: this.adminSenderEmail,
      to: this.config.serviceDeliveryEmail!,
      subject: `[Installation Scheduled] ${order.order_number} - ${installationDate}`,
      template: 'admin_installation_scheduled',
      data: {
        order_number: order.order_number,
        customer_name: `${order.first_name} ${order.last_name}`,
        customer_phone: order.phone,
        installation_address: order.installation_address,
        installation_date: installationDate,
        time_slot: timeSlot,
        technician_name: technicianName || 'Not assigned',
        package_name: order.package_name,
        special_instructions: order.special_instructions || 'None',
        admin_order_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://circletel.co.za'}/admin/orders/${order.id}`,
      },
    });
  }

  /**
   * Calculate order urgency based on various factors
   */
  private static calculateUrgency(order: ConsumerOrder): 'high' | 'medium' | 'low' {
    // High urgency if:
    // - High-value package (>R1000/month)
    // - Same-day installation requested
    // - Business customer
    if (order.package_price > 1000) return 'high';

    if (order.preferred_installation_date) {
      const preferredDate = new Date(order.preferred_installation_date);
      const today = new Date();
      const daysDiff = Math.ceil((preferredDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      if (daysDiff <= 1) return 'high';
      if (daysDiff <= 3) return 'medium';
    }

    return 'low';
  }

  /**
   * Get urgency color for email styling
   */
  private static getUrgencyColor(order: ConsumerOrder): string {
    const urgency = this.calculateUrgency(order);

    switch (urgency) {
      case 'high': return '#EF4444'; // Red
      case 'medium': return '#F59E0B'; // Orange
      case 'low': return '#10B981'; // Green
      default: return '#6B7280'; // Gray
    }
  }
}

// Export singleton for convenience
export const adminNotifications = AdminNotificationService;
