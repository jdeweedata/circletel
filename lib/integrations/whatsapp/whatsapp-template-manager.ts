/**
 * WhatsApp Template Manager
 *
 * Manages WhatsApp message template definitions and helps with
 * template registration in Meta Business Suite.
 *
 * Templates must be submitted for approval before use.
 * @see https://developers.facebook.com/docs/whatsapp/message-templates
 */

import type {
  CircleTelTemplate,
  TemplateCategory,
  TemplateComponent,
  TemplateButton,
} from './types';

// =============================================================================
// TEMPLATE DEFINITIONS
// =============================================================================

export interface TemplateDefinition {
  name: CircleTelTemplate;
  category: TemplateCategory;
  language: string;
  header?: {
    format: 'TEXT' | 'IMAGE';
    text?: string;
    example?: string; // Example header text or image URL
  };
  body: {
    text: string;
    examples: string[]; // Example values for each {{n}} variable
  };
  footer?: {
    text: string;
  };
  buttons?: TemplateButton[];
}

/**
 * CircleTel WhatsApp Template Definitions
 *
 * These definitions are used to:
 * 1. Submit templates to Meta for approval
 * 2. Document expected parameters for each template
 * 3. Generate example payloads for testing
 */
export const CIRCLETEL_TEMPLATES: Record<CircleTelTemplate, TemplateDefinition> = {
  // ===========================================================================
  // INVOICE PAYMENT TEMPLATE
  // ===========================================================================
  circletel_invoice_payment: {
    name: 'circletel_invoice_payment',
    category: 'UTILITY',
    language: 'en_US',
    header: {
      format: 'IMAGE',
      example: 'https://www.circletel.co.za/images/logo-square.png',
    },
    body: {
      text: 'Hi {{1}}, your CircleTel invoice {{2}} for R{{3}} is due on {{4}}. Pay securely now:',
      examples: ['John', 'INV-2026-00123', '899.00', '28 February 2026'],
    },
    buttons: [
      {
        type: 'URL',
        text: 'Pay Now',
        url: 'https://www.circletel.co.za/api/paynow/{{1}}',
      },
    ],
  },

  // ===========================================================================
  // PAYMENT REMINDER TEMPLATE
  // ===========================================================================
  circletel_payment_reminder: {
    name: 'circletel_payment_reminder',
    category: 'UTILITY',
    language: 'en_US',
    body: {
      text: 'Reminder: Invoice {{1}} (R{{2}}) is {{3}} days overdue. Avoid service interruption - pay now.',
      examples: ['INV-2026-00123', '899.00', '3'],
    },
    buttons: [
      {
        type: 'URL',
        text: 'Pay Now',
        url: 'https://www.circletel.co.za/api/paynow/{{1}}',
      },
    ],
  },

  // ===========================================================================
  // DEBIT FAILED TEMPLATE
  // ===========================================================================
  circletel_debit_failed: {
    name: 'circletel_debit_failed',
    category: 'UTILITY',
    language: 'en_US',
    body: {
      text: "Hi {{1}}, we couldn't collect payment for invoice {{2}} (R{{3}}). Please pay manually or update your debit order.",
      examples: ['John', 'INV-2026-00123', '899.00'],
    },
    buttons: [
      {
        type: 'URL',
        text: 'Pay Now',
        url: 'https://www.circletel.co.za/api/paynow/{{1}}',
      },
      {
        type: 'URL',
        text: 'Update Payment',
        url: 'https://www.circletel.co.za/dashboard/billing',
      },
    ],
  },

  // ===========================================================================
  // PAYMENT RECEIVED TEMPLATE
  // ===========================================================================
  circletel_payment_received: {
    name: 'circletel_payment_received',
    category: 'UTILITY',
    language: 'en_US',
    body: {
      text: 'Hi {{1}}, we received your payment of R{{3}} for invoice {{2}} on {{4}}. Thank you!',
      examples: ['John', 'INV-2026-00123', '899.00', '27 February 2026'],
    },
  },

  // ===========================================================================
  // SERVICE ACTIVATED TEMPLATE
  // ===========================================================================
  circletel_service_activated: {
    name: 'circletel_service_activated',
    category: 'UTILITY',
    language: 'en_US',
    body: {
      text: 'Hi {{1}}, your {{2}} service is now active! Your account number is {{3}}. Welcome to CircleTel!',
      examples: ['John', '100Mbps Fibre Uncapped', 'CT-2026-00456'],
    },
  },
};

// =============================================================================
// TEMPLATE UTILITIES
// =============================================================================

/**
 * Get template definition by name
 */
export function getTemplateDefinition(
  name: CircleTelTemplate
): TemplateDefinition | undefined {
  return CIRCLETEL_TEMPLATES[name];
}

/**
 * Generate Meta Business API payload for template creation
 * Use this output to register templates via the Meta Business Suite API
 */
export function generateTemplatePayload(
  template: TemplateDefinition
): object {
  const components: TemplateComponent[] = [];

  // Header component
  if (template.header) {
    components.push({
      type: 'HEADER',
      format: template.header.format,
      text: template.header.text,
    });
  }

  // Body component
  components.push({
    type: 'BODY',
    text: template.body.text,
  });

  // Footer component
  if (template.footer) {
    components.push({
      type: 'FOOTER',
      text: template.footer.text,
    });
  }

  // Buttons component
  if (template.buttons && template.buttons.length > 0) {
    components.push({
      type: 'BUTTONS',
      buttons: template.buttons,
    });
  }

  return {
    name: template.name,
    category: template.category,
    language: template.language,
    components,
  };
}

/**
 * List all template names
 */
export function listTemplateNames(): CircleTelTemplate[] {
  return Object.keys(CIRCLETEL_TEMPLATES) as CircleTelTemplate[];
}

/**
 * Validate template parameters
 * Returns errors if required parameters are missing
 */
export function validateTemplateParams(
  templateName: CircleTelTemplate,
  params: Record<string, string>
): { valid: boolean; errors: string[] } {
  const template = CIRCLETEL_TEMPLATES[templateName];
  if (!template) {
    return { valid: false, errors: [`Unknown template: ${templateName}`] };
  }

  const errors: string[] = [];

  // Count required parameters from body text
  const matches = template.body.text.match(/\{\{\d+\}\}/g) || [];
  const requiredCount = matches.length;

  // Check if we have enough examples (examples = parameter slots)
  if (template.body.examples.length < requiredCount) {
    errors.push(
      `Template definition error: expected ${requiredCount} examples, got ${template.body.examples.length}`
    );
  }

  // Validate provided params
  const paramKeys = Object.keys(params);
  if (paramKeys.length < requiredCount) {
    errors.push(
      `Missing parameters: expected ${requiredCount}, got ${paramKeys.length}`
    );
  }

  // Check for empty values
  for (const [key, value] of Object.entries(params)) {
    if (!value || value.trim() === '') {
      errors.push(`Parameter '${key}' is empty`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// =============================================================================
// TEMPLATE SUBMISSION GUIDE
// =============================================================================

/**
 * Instructions for submitting templates to Meta Business Suite
 *
 * 1. Go to Meta Business Suite: https://business.facebook.com/
 * 2. Navigate to WhatsApp Manager > Message Templates
 * 3. Click "Create Template"
 * 4. For each template:
 *    - Name: Use the template name (e.g., "circletel_invoice_payment")
 *    - Category: Select "Utility" for payment notifications
 *    - Language: English (US)
 *    - Header: Add image or text as defined
 *    - Body: Enter the text with {{1}}, {{2}}, etc. placeholders
 *    - Buttons: Add URL buttons with dynamic suffixes
 *
 * 5. Submit for review (24-48 hours approval time)
 *
 * Important Notes:
 * - Template names must be unique within your WABA
 * - Names can only contain lowercase letters, numbers, and underscores
 * - Variables must be numbered sequentially starting from {{1}}
 * - Button URLs with variables must have a static base URL
 */
export const TEMPLATE_SUBMISSION_GUIDE = `
=== WhatsApp Template Submission Guide ===

Templates must be approved by Meta before use.
Approval typically takes 24-48 hours.

STEP 1: Access WhatsApp Manager
- Go to: https://business.facebook.com/
- Click: WhatsApp Manager > Message Templates

STEP 2: Create Each Template
Run this to see template definitions:
  import { CIRCLETEL_TEMPLATES } from './whatsapp-template-manager';
  console.log(JSON.stringify(CIRCLETEL_TEMPLATES, null, 2));

STEP 3: Submit for Review
- Category: UTILITY (for payment notifications)
- Language: English (US)
- Add sample values for all variables

STEP 4: Wait for Approval (24-48 hours)
- Check status in WhatsApp Manager
- Rejected templates show reason; fix and resubmit

STEP 5: Update Environment Variables
After approval, add to .env:
  WHATSAPP_TEMPLATE_INVOICE=circletel_invoice_payment
  WHATSAPP_TEMPLATE_REMINDER=circletel_payment_reminder
  WHATSAPP_TEMPLATE_DEBIT_FAILED=circletel_debit_failed
`;

export function printSubmissionGuide(): void {
  console.log(TEMPLATE_SUBMISSION_GUIDE);
}
