/**
 * Webhook URL Generator
 *
 * Dynamically generates webhook URLs based on environment (staging, production)
 * This utility ensures correct webhook URLs for external integrations (Didit, ZOHO, NetCash, RICA)
 */

/**
 * Environment Detection
 *
 * Determines current environment based on NEXT_PUBLIC_APP_URL or VERCEL_ENV
 */
export type Environment = 'development' | 'staging' | 'production';

export function getCurrentEnvironment(): Environment {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || '';
  const vercelEnv = process.env.VERCEL_ENV;

  // Check Vercel environment variable first
  if (vercelEnv === 'production') return 'production';
  if (vercelEnv === 'preview') return 'staging';

  // Check URL patterns
  if (appUrl.includes('localhost') || appUrl.includes('127.0.0.1')) {
    return 'development';
  }

  if (appUrl.includes('circletel-staging') || appUrl.includes('-staging.vercel.app')) {
    return 'staging';
  }

  if (appUrl.includes('circletel.co.za') || appUrl.includes('circletel-nextjs.vercel.app')) {
    return 'production';
  }

  // Default to development
  return 'development';
}

/**
 * Get Base URL for Current Environment
 */
export function getBaseUrl(): string {
  const env = getCurrentEnvironment();

  switch (env) {
    case 'production':
      return 'https://circletel.co.za';
    case 'staging':
      return 'https://circletel-staging.vercel.app';
    case 'development':
      return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    default:
      return 'http://localhost:3000';
  }
}

/**
 * Webhook URL Generators
 */

export const WebhookUrls = {
  /**
   * Didit KYC Webhook
   * Receives verification completion events
   */
  didit: (): string => `${getBaseUrl()}/api/compliance/webhook/didit`,

  /**
   * ZOHO CRM Webhook
   * Receives deal updates, stage changes
   */
  zoho: (): string => `${getBaseUrl()}/api/integrations/zoho/webhook`,

  /**
   * ZOHO Sign Webhook
   * Receives signature completion events
   */
  zohoSign: (contractId: string): string =>
    `${getBaseUrl()}/api/contracts/${contractId}/signature-webhook`,

  /**
   * NetCash Payment Webhook (Notify URL)
   * Receives payment completion events
   */
  netcashNotify: (): string => `${getBaseUrl()}/api/payments/webhook`,

  /**
   * NetCash Payment Return URL
   * Where customer is redirected after payment
   */
  netcashReturn: (invoiceId: string): string =>
    `${getBaseUrl()}/api/payments/return?invoice_id=${invoiceId}`,

  /**
   * RICA Approval Webhook
   * Receives RICA approval/rejection events
   */
  rica: (): string => `${getBaseUrl()}/api/activation/rica-webhook`,

  /**
   * Quote Acceptance Redirect URL
   * Where customer is redirected after accepting quote
   */
  quoteAccepted: (quoteId: string): string =>
    `${getBaseUrl()}/customer/quote/${quoteId}/kyc`,

  /**
   * KYC Completion Redirect URL
   * Where customer is redirected after completing KYC
   */
  kycCompleted: (quoteId: string): string =>
    `${getBaseUrl()}/customer/quote/${quoteId}/kyc-complete`,

  /**
   * Contract Signing Redirect URL
   * Where customer is redirected after signing contract (ZOHO Sign)
   */
  contractSigned: (contractId: string): string =>
    `${getBaseUrl()}/customer/contracts/${contractId}/signed`,
};

/**
 * Get All Webhook URLs (for documentation/configuration)
 */
export function getAllWebhookUrls(): Record<string, string> {
  return {
    didit: WebhookUrls.didit(),
    zoho: WebhookUrls.zoho(),
    netcash_notify: WebhookUrls.netcashNotify(),
    rica: WebhookUrls.rica(),
    environment: getCurrentEnvironment(),
    base_url: getBaseUrl(),
  };
}

/**
 * Validate Webhook URL Format
 */
export function isValidWebhookUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return (
      (parsed.protocol === 'https:' || parsed.protocol === 'http:') &&
      parsed.hostname.length > 0
    );
  } catch {
    return false;
  }
}
