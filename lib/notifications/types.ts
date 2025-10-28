/**
 * Notification System Types
 *
 * TypeScript definitions for the notification system
 */

export type NotificationType = 'email' | 'sms' | 'push';

export type NotificationStatus =
  | 'pending'
  | 'sent'
  | 'delivered'
  | 'failed'
  | 'bounced';

export type NotificationEvent =
  | 'quote_created'
  | 'quote_approved'
  | 'quote_sent'
  | 'quote_viewed'
  | 'quote_accepted'
  | 'quote_rejected'
  | 'quote_expired';

export interface NotificationTemplate {
  id: string;
  event: NotificationEvent;
  type: NotificationType;
  subject: string | null;
  body: string;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  event: NotificationEvent;
  type: NotificationType;
  recipient_email: string | null;
  recipient_phone: string | null;
  subject: string | null;
  body: string;
  status: NotificationStatus;
  error_message: string | null;
  quote_id: string | null;
  agent_id: string | null;
  sent_at: string | null;
  delivered_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface NotificationPreference {
  id: string;
  user_type: 'agent' | 'customer' | 'admin';
  user_id: string;
  event: NotificationEvent;
  email_enabled: boolean;
  sms_enabled: boolean;
  push_enabled: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Template variable context for substitution
 */
export interface NotificationContext {
  // Quote details
  quote_number?: string;
  company_name?: string;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  service_address?: string;

  // Pricing
  total_monthly?: number;
  total_installation?: number;
  subtotal_monthly?: number;
  subtotal_installation?: number;
  vat_amount_monthly?: number;
  vat_amount_installation?: number;

  // Contract
  contract_term?: number;
  valid_until?: string;

  // Agent details
  agent_name?: string;
  agent_email?: string;
  agent_company?: string;
  commission_rate?: number;
  commission_amount?: number;

  // Event details
  viewed_at?: string;
  accepted_at?: string;
  rejected_at?: string;
  rejection_reason?: string;

  // URLs
  acceptance_url?: string;
  agent_dashboard_url?: string;
  admin_url?: string;
}

/**
 * Request to send a notification
 */
export interface SendNotificationRequest {
  event: NotificationEvent;
  type: NotificationType;
  recipient_email?: string;
  recipient_phone?: string;
  quote_id?: string;
  agent_id?: string;
  context: NotificationContext;
}

/**
 * Response from notification service
 */
export interface SendNotificationResponse {
  success: boolean;
  notification_id?: string;
  error?: string;
}

/**
 * Batch send request
 */
export interface SendBatchNotificationsRequest {
  notifications: SendNotificationRequest[];
}

/**
 * Batch send response
 */
export interface SendBatchNotificationsResponse {
  success: boolean;
  results: {
    success: boolean;
    notification_id?: string;
    error?: string;
  }[];
  total: number;
  succeeded: number;
  failed: number;
}
