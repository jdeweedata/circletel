/**
 * WhatsApp Business API Integration
 *
 * Re-exports all WhatsApp service components for easy importing.
 *
 * @example
 * import { whatsAppService, CIRCLETEL_TEMPLATES } from '@/lib/integrations/whatsapp';
 *
 * // Send invoice payment notification
 * await whatsAppService.sendInvoicePayment('0821234567', {
 *   customerName: 'John',
 *   invoiceNumber: 'INV-2026-00123',
 *   amount: '899.00',
 *   dueDate: '28 February 2026',
 *   paymentUrl: 'https://circletel.co.za/api/paynow/ref123',
 * });
 */

// Service
export { WhatsAppService, whatsAppService } from './whatsapp-service';

// Template Manager
export {
  CIRCLETEL_TEMPLATES,
  getTemplateDefinition,
  generateTemplatePayload,
  listTemplateNames,
  validateTemplateParams,
  printSubmissionGuide,
  type TemplateDefinition,
} from './whatsapp-template-manager';

// Types
export type {
  WhatsAppConfig,
  WhatsAppRecipient,
  CircleTelTemplate,
  InvoicePaymentParams,
  PaymentReminderParams,
  DebitFailedParams,
  PaymentReceivedParams,
  ServiceActivatedParams,
  WhatsAppSendResult,
  WhatsAppBatchResult,
  WebhookPayload,
  WebhookStatusUpdate,
  WebhookMessage,
  ConsentSource,
  WhatsAppConsent,
  RATE_LIMIT_TIERS,
} from './types';
