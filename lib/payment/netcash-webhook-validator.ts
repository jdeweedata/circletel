/**
 * Netcash Webhook Validator
 * Handles signature verification, IP whitelisting, and payload validation
 * Task 3.3: Netcash Webhook Integration
 */

import crypto from 'crypto';

// ==================================================================
// TYPES
// ==================================================================

export interface NetcashWebhookPayload {
  // Payment Details
  Reference: string;
  TransactionID?: string;
  Amount: string;
  Currency?: string;

  // Payment Status
  Status: string;
  StatusText?: string;
  ResponseCode?: string;
  ResponseText?: string;

  // Customer Details
  CustomerName?: string;
  CustomerEmail?: string;
  CustomerPhone?: string;

  // Card Details (masked)
  CardNumber?: string;
  CardType?: string;
  CardToken?: string;
  Token?: string;

  // Timestamp
  TransactionDate?: string;
  ProcessedDate?: string;

  // Additional Data
  Extra1?: string;
  Extra2?: string;
  Extra3?: string;

  // Raw data for verification
  [key: string]: any;
}

export interface WebhookValidationResult {
  valid: boolean;
  errors: string[];
  payload?: NetcashWebhookPayload;
}

// ==================================================================
// NETCASH IP WHITELIST
// ==================================================================

/**
 * Netcash server IP addresses (as of 2025)
 * Source: Netcash API documentation
 * Update this list if Netcash changes their IPs
 */
const NETCASH_IP_WHITELIST = [
  '196.33.252.0/24',    // Netcash primary range
  '41.203.154.0/24',    // Netcash secondary range
  '102.165.16.0/24',    // Netcash tertiary range
  '127.0.0.1',          // Localhost for testing
  '::1',                // IPv6 localhost
  '0.0.0.0',            // Allow all (only for development)
];

/**
 * Check if IP address is in allowed range
 */
export function isNetcashIP(ipAddress: string): boolean {
  // In development, allow all IPs
  if (process.env.NODE_ENV === 'development') {
    console.log('[Webhook Validator] Development mode: Allowing all IPs');
    return true;
  }

  // Check if IP is in whitelist
  const isWhitelisted = NETCASH_IP_WHITELIST.some(whitelistedIP => {
    // Exact match
    if (whitelistedIP === ipAddress) {
      return true;
    }

    // CIDR range check (simplified)
    if (whitelistedIP.includes('/')) {
      const [network, bits] = whitelistedIP.split('/');
      // For production, use a proper CIDR library like 'ip-cidr'
      // This is a basic check
      return ipAddress.startsWith(network.split('.').slice(0, 3).join('.'));
    }

    return false;
  });

  if (!isWhitelisted) {
    console.warn(`[Webhook Validator] IP ${ipAddress} not in whitelist`);
  }

  return isWhitelisted;
}

// ==================================================================
// SIGNATURE VERIFICATION
// ==================================================================

/**
 * Verify webhook signature using HMAC-SHA256
 * Netcash signs webhooks with: HMAC-SHA256(payload + secret)
 */
export function validateWebhookSignature(
  payload: string | object,
  receivedSignature: string,
  webhookSecret: string
): boolean {
  try {
    // Convert payload to string if it's an object
    const payloadString = typeof payload === 'string'
      ? payload
      : JSON.stringify(payload);

    // Generate expected signature
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(payloadString)
      .digest('hex');

    // Compare signatures (timing-safe)
    const isValid = crypto.timingSafeEqual(
      Buffer.from(receivedSignature),
      Buffer.from(expectedSignature)
    );

    if (!isValid) {
      console.warn('[Webhook Validator] Signature mismatch');
      console.log('Expected:', expectedSignature);
      console.log('Received:', receivedSignature);
    }

    return isValid;
  } catch (error) {
    console.error('[Webhook Validator] Signature verification error:', error);
    return false;
  }
}

/**
 * Alternative signature verification for URL-encoded payloads
 * Some Netcash webhooks send data as URL parameters
 */
export function validateURLEncodedSignature(
  params: Record<string, string>,
  receivedSignature: string,
  webhookSecret: string
): boolean {
  try {
    // Sort parameters alphabetically
    const sortedKeys = Object.keys(params).sort();

    // Concatenate key=value pairs
    const signatureString = sortedKeys
      .map(key => `${key}=${params[key]}`)
      .join('&');

    // Generate expected signature
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(signatureString)
      .digest('hex');

    // Compare signatures
    return crypto.timingSafeEqual(
      Buffer.from(receivedSignature),
      Buffer.from(expectedSignature)
    );
  } catch (error) {
    console.error('[Webhook Validator] URL signature verification error:', error);
    return false;
  }
}

// ==================================================================
// PAYLOAD VALIDATION
// ==================================================================

/**
 * Parse and validate Netcash webhook payload
 */
export function parseWebhookPayload(body: any): WebhookValidationResult {
  const errors: string[] = [];

  try {
    // Parse JSON if string
    let payload: NetcashWebhookPayload;

    if (typeof body === 'string') {
      try {
        payload = JSON.parse(body);
      } catch (e) {
        errors.push('Invalid JSON payload');
        return { valid: false, errors };
      }
    } else {
      payload = body;
    }

    // Validate required fields
    if (!payload.Reference) {
      errors.push('Missing required field: Reference');
    }

    if (!payload.Status) {
      errors.push('Missing required field: Status');
    }

    if (!payload.Amount) {
      errors.push('Missing required field: Amount');
    }

    // Validate amount format
    if (payload.Amount) {
      const amount = parseFloat(payload.Amount);
      if (isNaN(amount) || amount < 0) {
        errors.push('Invalid amount format');
      }
    }

    // Validate status
    const validStatuses = [
      'Approved',
      'Declined',
      'Cancelled',
      'Pending',
      'Failed',
      'Refunded',
      'Chargeback'
    ];

    if (payload.Status && !validStatuses.includes(payload.Status)) {
      errors.push(`Invalid status: ${payload.Status}`);
    }

    return {
      valid: errors.length === 0,
      errors,
      payload: errors.length === 0 ? payload : undefined
    };
  } catch (error) {
    errors.push(`Payload parsing error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return { valid: false, errors };
  }
}

// ==================================================================
// IDEMPOTENCY CHECK
// ==================================================================

/**
 * Generate idempotency key for webhook
 * Prevents duplicate processing of same webhook
 */
export function generateIdempotencyKey(payload: NetcashWebhookPayload): string {
  const keyComponents = [
    payload.Reference,
    payload.TransactionID || '',
    payload.Status,
    payload.Amount
  ].join('|');

  return crypto.createHash('sha256').update(keyComponents).digest('hex');
}

// ==================================================================
// REQUEST VALIDATION
// ==================================================================

/**
 * Comprehensive webhook request validation
 */
export async function validateWebhookRequest(
  req: Request,
  webhookSecret: string
): Promise<WebhookValidationResult> {
  const errors: string[] = [];

  try {
    // 1. Verify HTTP method
    if (req.method !== 'POST') {
      errors.push(`Invalid HTTP method: ${req.method}. Expected POST.`);
      return { valid: false, errors };
    }

    // 2. Check Content-Type
    const contentType = req.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      // Netcash might send form-urlencoded
      if (!contentType?.includes('application/x-www-form-urlencoded')) {
        errors.push(`Invalid Content-Type: ${contentType}`);
      }
    }

    // 3. Verify IP address
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
               req.headers.get('x-real-ip') ||
               'unknown';

    if (!isNetcashIP(ip)) {
      errors.push(`Request from unauthorized IP: ${ip}`);
      // In production, this should be a hard block
      // return { valid: false, errors };
    }

    // 4. Extract and verify signature
    const signature = req.headers.get('x-netcash-signature') ||
                     req.headers.get('x-signature') ||
                     '';

    if (!signature && process.env.NODE_ENV !== 'development') {
      errors.push('Missing webhook signature');
    }

    // 5. Parse body
    const body = await req.text();
    const payloadValidation = parseWebhookPayload(body);

    if (!payloadValidation.valid) {
      errors.push(...payloadValidation.errors);
      return { valid: false, errors };
    }

    // 6. Verify signature (if present)
    if (signature && webhookSecret) {
      const signatureValid = validateWebhookSignature(body, signature, webhookSecret);

      if (!signatureValid) {
        errors.push('Invalid webhook signature');
        return { valid: false, errors };
      }
    }

    // All validations passed
    return {
      valid: errors.length === 0,
      errors,
      payload: payloadValidation.payload
    };
  } catch (error) {
    errors.push(`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return { valid: false, errors };
  }
}

// ==================================================================
// UTILITY FUNCTIONS
// ==================================================================

/**
 * Map Netcash status to internal payment status
 */
export function mapNetcashStatus(netcashStatus: string): string {
  const statusMap: Record<string, string> = {
    'Approved': 'completed',
    'Declined': 'failed',
    'Cancelled': 'cancelled',
    'Pending': 'pending',
    'Failed': 'failed',
    'Refunded': 'refunded',
    'Chargeback': 'chargeback'
  };

  return statusMap[netcashStatus] || 'unknown';
}

/**
 * Determine webhook type from payload
 */
export function determineWebhookType(payload: NetcashWebhookPayload): string {
  const status = payload.Status?.toLowerCase() || '';

  if (status.includes('approved') || status.includes('success')) {
    return 'payment_success';
  }

  if (status.includes('declined') || status.includes('reject')) {
    return 'payment_failure';
  }

  if (status.includes('pending')) {
    return 'payment_pending';
  }

  if (status.includes('refund')) {
    return 'refund';
  }

  if (status.includes('chargeback')) {
    return 'chargeback';
  }

  return 'notify';
}

/**
 * Extract order ID from payment reference
 * Assumes format: CT-{timestamp}-{random} or similar
 */
export function extractOrderIdFromReference(reference: string): string | null {
  // Extract UUID from reference if present
  const uuidRegex = /([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i;
  const match = reference.match(uuidRegex);

  return match ? match[1] : null;
}

/**
 * Sanitize webhook payload for logging (remove sensitive data)
 */
export function sanitizePayloadForLogging(payload: NetcashWebhookPayload): Record<string, any> {
  const sanitized = { ...payload };

  // Mask card number
  if (sanitized.CardNumber) {
    sanitized.CardNumber = sanitized.CardNumber.replace(/\d(?=\d{4})/g, '*');
  }

  // Remove other sensitive fields if needed
  delete sanitized.CVV;
  delete sanitized.PIN;

  return sanitized;
}
