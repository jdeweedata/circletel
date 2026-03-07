/**
 * Notification Core - Types Only
 *
 * Lightweight import for type-only usage.
 * Does NOT import Resend, SMS providers, or any runtime dependencies.
 *
 * Usage:
 *   import type { NotificationEvent, NotificationStatus } from '@/lib/notifications/core';
 */

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
} from '../types';

// Re-export template utilities (pure functions, no external deps)
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
} from '../templates/base-template';
