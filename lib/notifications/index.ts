/**
 * Notification Module
 *
 * Centralized notification system for CircleTel
 *
 * Architecture:
 * - channels/       - Low-level channel implementations (email, SMS)
 * - templates/      - Email/SMS template utilities and base templates
 * - notification-service.ts   - High-level service with convenience methods
 * - notification-router.ts    - Unified routing to multiple channels
 * - types.ts                  - Shared types for notification system
 */

// ============================================================================
// TYPES
// ============================================================================
export type {
  NotificationType,
  NotificationStatus,
  NotificationEvent,
  NotificationTemplate,
  Notification,
  NotificationPreference,
  NotificationContext,
  SendNotificationRequest,
  SendNotificationResponse,
  SendBatchNotificationsRequest,
  SendBatchNotificationsResponse,
} from './types';

// ============================================================================
// CHANNELS
// ============================================================================
export {
  EmailChannel,
  type EmailNotificationInput as ChannelEmailInput,
  type EmailTags,
  type NotificationResult,
} from './channels/email-channel';

export {
  SmsChannel,
  type SmsNotificationInput as ChannelSmsInput,
  type SmsTemplate,
  renderSmsTemplate,
  sendTemplatedSms,
} from './channels/sms-channel';

// ============================================================================
// TEMPLATES
// ============================================================================
export {
  wrapEmailContent,
  createHeader,
  createGradientHeader,
  createFooter,
  createInfoBox,
  createButton,
  formatCurrency,
  getOrdinalSuffix,
  BRAND_COLORS,
  type BaseTemplateOptions,
} from './templates/base-template';

// ============================================================================
// ROUTER
// ============================================================================
export {
  NotificationRouter,
  getChannelStatus,
  type NotificationMethod,
  type NotificationRequest,
  type NotificationResults,
  type ChannelStatus,
} from './notification-router';

// ============================================================================
// HIGH-LEVEL SERVICES (backward compatibility)
// ============================================================================
export {
  EmailNotificationService,
  SmsNotificationService,
  NotificationService,
  type EmailNotificationInput,
  type SmsNotificationInput,
  type EmailTemplate,
  type NotificationResult as ServiceNotificationResult,
} from './notification-service';

// ============================================================================
// SPECIALIZED NOTIFICATION SERVICES
// ============================================================================
export * from './admin-notifications';
export * from './sales-alerts';
export * from './quote-notifications';
export * from './workflow-notifications';
