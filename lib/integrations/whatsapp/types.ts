/**
 * WhatsApp Business API Types
 *
 * Type definitions for Meta Cloud API (WhatsApp Business Platform)
 * @see https://developers.facebook.com/docs/whatsapp/cloud-api
 */

// =============================================================================
// CONFIGURATION
// =============================================================================

export interface WhatsAppConfig {
  phoneNumberId: string;
  accessToken: string;
  businessAccountId: string;
  webhookVerifyToken: string;
  baseUrl: string;
}

// =============================================================================
// MESSAGE TYPES
// =============================================================================

export type MessageType = 'text' | 'template' | 'image' | 'document';

export interface WhatsAppRecipient {
  phone: string; // Phone number in international format (e.g., 27821234567)
  name?: string; // Contact name for personalization
}

// =============================================================================
// TEMPLATE TYPES
// =============================================================================

export type TemplateCategory = 'UTILITY' | 'MARKETING' | 'AUTHENTICATION';

export type TemplateComponentType = 'HEADER' | 'BODY' | 'FOOTER' | 'BUTTONS';

export type HeaderFormat = 'TEXT' | 'IMAGE' | 'VIDEO' | 'DOCUMENT';

export type ButtonType = 'URL' | 'PHONE_NUMBER' | 'QUICK_REPLY';

export interface TemplateButton {
  type: ButtonType;
  text: string;
  url?: string; // For URL buttons - can contain {{1}} placeholder
  phone_number?: string; // For phone number buttons
}

export interface TemplateComponent {
  type: TemplateComponentType;
  format?: HeaderFormat;
  text?: string;
  buttons?: TemplateButton[];
  parameters?: TemplateParameter[];
}

export interface TemplateParameter {
  type: 'text' | 'currency' | 'date_time' | 'image' | 'document';
  text?: string;
  currency?: {
    fallback_value: string;
    code: string;
    amount_1000: number;
  };
  date_time?: {
    fallback_value: string;
  };
  image?: {
    link: string;
  };
  document?: {
    link: string;
    filename?: string;
  };
}

// =============================================================================
// CIRCLETEL TEMPLATE DEFINITIONS
// =============================================================================

/**
 * CircleTel WhatsApp Template Names
 * These must match templates registered in Meta Business Suite
 */
export type CircleTelTemplate =
  | 'circletel_invoice_payment'
  | 'circletel_payment_reminder'
  | 'circletel_debit_failed'
  | 'circletel_payment_received'
  | 'circletel_service_activated';

/**
 * Template parameter mappings for CircleTel templates
 */
export interface InvoicePaymentParams {
  customerName: string;       // {{1}} - Customer first name
  invoiceNumber: string;      // {{2}} - Invoice number (e.g., INV-2026-00123)
  amount: string;             // {{3}} - Amount in Rands (e.g., "899.00")
  dueDate: string;            // {{4}} - Due date (e.g., "28 February 2026")
  paymentUrl: string;         // {{5}} - Pay Now URL (button URL)
}

export interface PaymentReminderParams {
  invoiceNumber: string;      // {{1}} - Invoice number
  amount: string;             // {{2}} - Amount in Rands
  daysOverdue: string;        // {{3}} - Days overdue (e.g., "3")
  paymentUrl: string;         // {{4}} - Pay Now URL (button URL)
}

export interface DebitFailedParams {
  customerName: string;       // {{1}} - Customer first name
  invoiceNumber: string;      // {{2}} - Invoice number
  amount: string;             // {{3}} - Amount in Rands
  paymentUrl: string;         // {{4}} - Pay Now URL (button 1 URL)
  // Button 2 URL is static: circletel.co.za/billing
}

export interface PaymentReceivedParams {
  customerName: string;       // {{1}} - Customer first name
  invoiceNumber: string;      // {{2}} - Invoice number
  amount: string;             // {{3}} - Amount paid
  paymentDate: string;        // {{4}} - Payment date
}

export interface ServiceActivatedParams {
  customerName: string;       // {{1}} - Customer first name
  serviceName: string;        // {{2}} - Package name
  accountNumber: string;      // {{3}} - Account number
}

// Union type for all template params
export type TemplateParams =
  | { template: 'circletel_invoice_payment'; params: InvoicePaymentParams }
  | { template: 'circletel_payment_reminder'; params: PaymentReminderParams }
  | { template: 'circletel_debit_failed'; params: DebitFailedParams }
  | { template: 'circletel_payment_received'; params: PaymentReceivedParams }
  | { template: 'circletel_service_activated'; params: ServiceActivatedParams };

// =============================================================================
// API REQUEST/RESPONSE TYPES
// =============================================================================

export interface SendTemplateRequest {
  messaging_product: 'whatsapp';
  to: string;
  type: 'template';
  template: {
    name: string;
    language: {
      code: string; // e.g., 'en_US' or 'en_ZA'
    };
    components?: Array<{
      type: 'header' | 'body' | 'button';
      parameters?: TemplateParameter[];
      sub_type?: 'url' | 'quick_reply';
      index?: number; // For buttons
    }>;
  };
}

export interface SendTextRequest {
  messaging_product: 'whatsapp';
  to: string;
  type: 'text';
  text: {
    body: string;
    preview_url?: boolean;
  };
}

export interface WhatsAppMessageResponse {
  messaging_product: 'whatsapp';
  contacts: Array<{
    input: string;
    wa_id: string;
  }>;
  messages: Array<{
    id: string;
    message_status?: string;
  }>;
}

export interface WhatsAppErrorResponse {
  error: {
    message: string;
    type: string;
    code: number;
    error_subcode?: number;
    error_user_title?: string;
    error_user_msg?: string;
    fbtrace_id?: string;
  };
}

// =============================================================================
// WEBHOOK TYPES
// =============================================================================

export type WebhookMessageStatus =
  | 'sent'
  | 'delivered'
  | 'read'
  | 'failed';

export interface WebhookStatusUpdate {
  id: string; // Message ID
  status: WebhookMessageStatus;
  timestamp: string;
  recipient_id: string;
  errors?: Array<{
    code: number;
    title: string;
    message?: string;
  }>;
  conversation?: {
    id: string;
    origin: {
      type: 'user_initiated' | 'business_initiated' | 'referral_conversion';
    };
    expiration_timestamp?: string;
  };
  pricing?: {
    billable: boolean;
    pricing_model: 'CBP';
    category: 'utility' | 'authentication' | 'marketing' | 'service';
  };
}

export interface WebhookMessage {
  from: string; // Sender's phone number
  id: string; // Message ID
  timestamp: string;
  type: 'text' | 'image' | 'document' | 'button' | 'interactive';
  text?: {
    body: string;
  };
  button?: {
    text: string;
    payload: string;
  };
  interactive?: {
    type: 'button_reply' | 'list_reply';
    button_reply?: {
      id: string;
      title: string;
    };
    list_reply?: {
      id: string;
      title: string;
      description?: string;
    };
  };
}

export interface WebhookEntry {
  id: string; // Business Account ID
  changes: Array<{
    value: {
      messaging_product: 'whatsapp';
      metadata: {
        display_phone_number: string;
        phone_number_id: string;
      };
      contacts?: Array<{
        profile: {
          name: string;
        };
        wa_id: string;
      }>;
      messages?: WebhookMessage[];
      statuses?: WebhookStatusUpdate[];
    };
    field: 'messages';
  }>;
}

export interface WebhookPayload {
  object: 'whatsapp_business_account';
  entry: WebhookEntry[];
}

// =============================================================================
// SERVICE RESULT TYPES
// =============================================================================

export interface WhatsAppSendResult {
  success: boolean;
  messageId?: string;
  waId?: string; // WhatsApp ID of recipient
  error?: string;
  errorCode?: number;
}

export interface WhatsAppBatchResult {
  total: number;
  sent: number;
  failed: number;
  results: Array<{
    phone: string;
    result: WhatsAppSendResult;
  }>;
  errors: string[];
}

// =============================================================================
// RATE LIMITING
// =============================================================================

export interface RateLimitTier {
  name: 'TIER_1K' | 'TIER_10K' | 'TIER_100K' | 'UNLIMITED';
  messagesPerDay: number;
  description: string;
}

export const RATE_LIMIT_TIERS: Record<string, RateLimitTier> = {
  TIER_1K: {
    name: 'TIER_1K',
    messagesPerDay: 1000,
    description: 'New businesses (7 days)',
  },
  TIER_10K: {
    name: 'TIER_10K',
    messagesPerDay: 10000,
    description: 'Growing businesses',
  },
  TIER_100K: {
    name: 'TIER_100K',
    messagesPerDay: 100000,
    description: 'Established businesses',
  },
  UNLIMITED: {
    name: 'UNLIMITED',
    messagesPerDay: Infinity,
    description: 'Enterprise tier',
  },
};

// =============================================================================
// CONSENT TYPES
// =============================================================================

export type ConsentSource = 'signup' | 'sms_optin' | 'admin_import' | 'order_form' | 'partner_registration';

export interface WhatsAppConsent {
  customerId: string;
  hasConsent: boolean;
  consentAt?: Date;
  consentSource?: ConsentSource;
  phone?: string;
}
