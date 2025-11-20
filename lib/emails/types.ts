/**
 * Email Types and Interfaces
 *
 * Centralized type definitions for the email system
 */

import type { AccessApprovalEmailProps } from '@/emails/templates/admin/AccessApprovalEmail';

/**
 * Base email sending options
 */
export interface EmailSendOptions {
  from?: string;
  replyTo?: string;
  tags?: Record<string, string>;
  trackOpens?: boolean;
  trackClicks?: boolean;
}

/**
 * Email sending result
 */
export interface EmailSendResult {
  success: boolean;
  emailId?: string;
  error?: string;
}

/**
 * Admin email template types
 */
export interface AdminApprovalEmailData extends AccessApprovalEmailProps {
  // All props inherited from AccessApprovalEmailProps
}

/**
 * Email template variable substitution
 */
export interface EmailVariables {
  [key: string]: string | number | boolean | undefined;
}

/**
 * Supported email template IDs
 */
export type EmailTemplateId =
  // Consumer templates
  | 'order-confirmation'
  | 'installation-scheduled'
  | 'payment-received'
  | 'service-activated'
  | 'service-suspended'
  | 'password-reset'
  | 'account-created'
  | 'billing-reminder'
  // Business templates
  | 'quote-sent'
  | 'quote-accepted'
  | 'kyc-approved'
  | 'kyc-rejected'
  | 'contract-signed'
  // Admin templates
  | 'admin-approval'
  | 'admin-rejection'
  | 'admin-password-reset'
  | 'admin-role-changed';

/**
 * Email notification tracking
 */
export interface EmailNotificationData {
  recipient_email: string;
  template_id: EmailTemplateId;
  status: 'pending' | 'sent' | 'delivered' | 'opened' | 'clicked' | 'bounced' | 'failed';
  provider: 'resend';
  provider_message_id?: string;
  metadata?: Record<string, any>;
  sent_at?: string;
  delivered_at?: string;
  opened_at?: string;
  clicked_at?: string;
  failed_at?: string;
  error_message?: string;
}

/**
 * Email renderer options
 */
export interface EmailRenderOptions {
  preview?: boolean;
  plainText?: boolean;
  variables?: EmailVariables;
}

/**
 * Email template registry entry
 */
export interface EmailTemplateEntry {
  id: EmailTemplateId;
  name: string;
  description: string;
  category: 'transactional' | 'marketing' | 'system' | 'admin';
  variables: string[];
  component: React.ComponentType<any>;
}
