/**
 * Notification Module
 *
 * Centralized notification system for CircleTel.
 *
 * IMPORT GUIDE (for tree-shaking):
 *
 * 1. Types only (0 runtime deps):
 *    import type { NotificationEvent } from '@/lib/notifications/core';
 *
 * 2. Channels only (Resend/SMS deps):
 *    import { EmailChannel } from '@/lib/notifications/channels';
 *
 * 3. Services (full deps):
 *    import { EmailNotificationService } from '@/lib/notifications/services';
 *
 * 4. Everything (backward compat - pulls all deps):
 *    import { ... } from '@/lib/notifications';
 *
 * Architecture:
 * - core/         - Types and pure template utilities (no runtime deps)
 * - channels/     - Low-level channel implementations (email, SMS)
 * - templates/    - Email/SMS template utilities
 * - services/     - High-level notification services
 */

// ============================================================================
// CORE (types + pure utilities)
// ============================================================================
export * from './core';

// ============================================================================
// CHANNELS (low-level, pulls Resend/SMS deps)
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
// SERVICES (high-level, full deps)
// ============================================================================
export * from './services';
