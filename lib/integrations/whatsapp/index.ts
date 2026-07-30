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

// WhatsApp Flows (F1 Lead Qualification)
export {
  sendFlow,
  buildFlowMessagePayload,
  formatWhatsAppPhone,
  F1_FLOW_NAME,
  F1_DEFAULT_SCREEN,
  type SendFlowParams,
  type SendFlowResult,
} from './flows/flow-sender';

export {
  handleFlowCompletion,
  parseNfmReplyResponseJson,
  buildCoverageLeadInsert,
  type FlowCompletionResult,
  type FlowResponseHandlerDeps,
  type FlowCompletionReason,
  type LeadCreatedHookContext,
} from './flows/flow-response-handler';

export {
  notifyF1LeadCreated,
  onF1LeadCreated,
  type F1LeadNotificationResult,
} from './flows/f1-lead-notifications';

export type {
  F1LeadQualificationResponse,
  WhatsAppFlowSession,
  NfmReplyWebhookMessage,
  FlowSessionStatus,
  FlowEntrySource,
} from './flows/types';

export {
  isF1LeadQualificationResponse,
  isNfmReplyWebhookMessage,
  normalizeCustomerType,
  parsePopiaOptIn,
} from './flows/types';
