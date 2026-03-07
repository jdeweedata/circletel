/**
 * Notification Services
 *
 * High-level notification services for different use cases.
 * Imports runtime dependencies (Resend, Supabase).
 *
 * For type-only imports, use '@/lib/notifications/core' instead.
 *
 * Usage:
 *   import { EmailNotificationService } from '@/lib/notifications/services';
 *   import { AdminNotificationService } from '@/lib/notifications/services';
 */

// Core notification service
export {
  EmailNotificationService,
  SmsNotificationService,
  NotificationService,
  type EmailNotificationInput,
  type SmsNotificationInput,
  type EmailTemplate,
  type NotificationResult as ServiceNotificationResult,
} from '../notification-service';

// Notification router (multi-channel)
export {
  NotificationRouter,
  getChannelStatus,
  type NotificationMethod,
  type NotificationRequest,
  type NotificationResults,
  type ChannelStatus,
} from '../notification-router';

// Specialized services
export { AdminNotificationService } from '../admin-notifications';
export * from '../sales-alerts';
export { QuoteNotificationService } from '../quote-notifications';
export * from '../workflow-notifications';
