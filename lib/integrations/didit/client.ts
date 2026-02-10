/**
 * Didit KYC API Client
 *
 * Axios-based HTTP client for Didit KYC verification API
 * Documentation: https://docs.didit.me/api-reference
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import type {
  DiditSessionRequest,
  DiditSessionResponse,
  DiditSessionStatusResponse,
  DiditSessionStatus,
  DiditFlowType,
} from './types';

// Didit API Configuration (lazy loaded to avoid build-time errors)
const DIDIT_API_BASE =
  process.env.DIDIT_API_URL || 'https://verification.didit.me/v2';

/**
 * Get Didit API client instance lazily
 * This prevents build-time errors when env vars are not available
 */
let _diditClient: AxiosInstance | null = null;

function setupInterceptors(client: AxiosInstance): void {
  // Request Interceptor - Logs all outgoing requests for debugging
  client.interceptors.request.use(
    (config) => {
      const method = config.method?.toUpperCase();
      const url = config.url;
      const timestamp = new Date().toISOString();

      console.log(`[Didit API Request] ${timestamp} ${method} ${url}`);

      // Log request body for debugging (exclude sensitive data)
      if (config.data) {
        const sanitizedData = { ...config.data };
        // Don't log full extracted data (contains PII)
        if (sanitizedData.extractedData) {
          sanitizedData.extractedData = '[REDACTED]';
        }
        console.log(`[Didit API Request Body]`, JSON.stringify(sanitizedData, null, 2));
      }

      return config;
    },
    (error) => {
      console.error('[Didit API Request Error]', error.message);
      return Promise.reject(error);
    }
  );

  // Response Interceptor - Logs all responses and handles errors gracefully
  client.interceptors.response.use(
    (response) => {
      const method = response.config.method?.toUpperCase();
      const url = response.config.url;
      const status = response.status;
      const timestamp = new Date().toISOString();

      console.log(`[Didit API Response] ${timestamp} ${method} ${url} ${status}`);

      return response;
    },
    (error: AxiosError) => {
      const method = error.config?.method?.toUpperCase();
      const url = error.config?.url;
      const status = error.response?.status;
      const timestamp = new Date().toISOString();

      console.error(
        `[Didit API Error] ${timestamp} ${method} ${url} ${status || 'NO_RESPONSE'}`
      );

      // Log error details
      if (error.response?.data) {
        console.error('[Didit API Error Response]', error.response.data);
      } else if (error.message) {
        console.error('[Didit API Error Message]', error.message);
      }

      // Handle specific error cases
      if (error.code === 'ECONNABORTED') {
        throw new Error('Didit API request timed out after 30 seconds');
      }

      if (error.response?.status === 401) {
        throw new Error('Didit API authentication failed. Check DIDIT_API_KEY.');
      }

      if (error.response?.status === 429) {
        throw new Error('Didit API rate limit exceeded. Try again later.');
      }

      if (error.response?.status === 500) {
        throw new Error('Didit API server error. Please contact support.');
      }

      // Re-throw original error
      throw error;
    }
  );
}

export function getDiditClient(): AxiosInstance {
  if (!_diditClient) {
    const apiKey = process.env.DIDIT_API_KEY;
    if (!apiKey) {
      throw new Error(
        'DIDIT_API_KEY environment variable is required. Please add it to your .env file.'
      );
    }
    _diditClient = axios.create({
      baseURL: DIDIT_API_BASE,
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      timeout: 30000, // 30 seconds
    });
    setupInterceptors(_diditClient);
  }
  return _diditClient;
}

/**
 * Axios Instance for Didit API (kept for backwards compatibility)
 * Use getDiditClient() for lazy initialization
 *
 * Pre-configured with:
 * - Base URL
 * - x-api-key header authentication
 * - 30-second timeout (prevents hanging requests)
 * - Request/response logging for debugging
 */
export const diditClient: AxiosInstance = new Proxy({} as AxiosInstance, {
  get(_, prop) {
    return (getDiditClient() as Record<string, unknown>)[prop as string];
  }
});

/**
 * Internal type representing Didit v2 create-session response
 *
 * Example (from live response):
 * {
 *   "session_id": "ef4d3476-582a-49cd-943b-5741c17b962b",
 *   "session_number": 3,
 *   "session_token": "d2q0Apts7zoC",
 *   "url": "https://verify.didit.me/session/d2q0Apts7zoC",
 *   "vendor_data": "test-company-kyb",
 *   "metadata": null,
 *   "status": "Not Started",
 *   "callback": "https://www.circletel.co.za/api/compliance/webhook/didit",
 *   "workflow_id": "849daa0b-c9f4-4669-a74c-212ceb2adcfe"
 * }
 */
interface DiditV2CreateSessionResponse {
  session_id: string;
  session_number: number;
  session_token: string;
  url: string;
  vendor_data: string;
  metadata: unknown | null;
  status: string;
  callback: string;
  workflow_id: string;
}

/**
 * Map Didit v2 status string (e.g. "Not Started") to internal union
 */
function mapDiditStatus(status: string | undefined): DiditSessionStatus {
  if (!status) return 'not_started';

  const normalized = status.toLowerCase().replace(/\s+/g, '_');

  switch (normalized) {
    case 'not_started':
      return 'not_started';
    case 'in_progress':
      return 'in_progress';
    case 'completed':
      return 'completed';
    case 'abandoned':
      return 'abandoned';
    default:
      return 'not_started';
  }
}

/**
 * Resolve Didit workflow_id from internal flow type using env vars
 */
function getWorkflowIdForFlow(flow: DiditFlowType): string {
  const mapping: Record<DiditFlowType, string | undefined> = {
    business_light_kyc: process.env.DIDIT_WORKFLOW_BUSINESS_LIGHT_KYC,
    consumer_light_kyc: process.env.DIDIT_WORKFLOW_CONSUMER_LIGHT_KYC,
    business_full_kyc: process.env.DIDIT_WORKFLOW_BUSINESS_FULL_KYC,
  };

  const workflowId = mapping[flow];

  if (!workflowId) {
    throw new Error(
      `Didit workflow ID env var is not configured for flow: ${flow}. ` +
        'Please set DIDIT_WORKFLOW_BUSINESS_LIGHT_KYC / DIDIT_WORKFLOW_CONSUMER_LIGHT_KYC / DIDIT_WORKFLOW_BUSINESS_FULL_KYC.'
    );
  }

  return workflowId;
}

/**
 * Didit API Service Methods
 */

/**
 * Create KYC Verification Session
 *
 * @param request - Session configuration (flow type, features, metadata)
 * @returns Session details with verification URL
 *
 * @example
 * const session = await createSession({
 *   type: 'kyc',
 *   jurisdiction: 'ZA',
 *   flow: 'business_light_kyc',
 *   features: ['id_verification', 'liveness'],
 *   metadata: { quote_id: 'BQ-2025-001' },
 *   webhook_url: 'https://circletel.co.za/api/compliance/webhook/didit'
 * });
 */
export async function createSession(
  request: DiditSessionRequest
): Promise<DiditSessionResponse> {
  try {
    // Map internal session request shape to Didit v2 API payload
    const workflowId = getWorkflowIdForFlow(request.flow);

    // Encode important metadata into vendor_data as JSON string so we can
    // correlate sessions on webhook callbacks without depending on Didit
    const vendorData = JSON.stringify({
      quote_id: request.metadata?.quote_id,
      user_type: request.metadata?.user_type,
      quote_amount: request.metadata?.quote_amount,
      context: request.metadata?.context,
      subject_type: request.metadata?.subject_type,
      kyb_subject_id: request.metadata?.kyb_subject_id,
    });

    const payload = {
      workflow_id: workflowId,
      vendor_data: vendorData,
      callback: request.webhook_url,
    };

    const { data } = await diditClient.post<DiditV2CreateSessionResponse>(
      '/session/',
      payload
    );

    // Normalise v2 response into existing DiditSessionResponse shape
    const now = new Date();
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;

    const normalized: DiditSessionResponse = {
      sessionId: data.session_id,
      status: mapDiditStatus(data.status),
      verificationUrl: data.url,
      // Didit v2 response does not include explicit created/expiry timestamps;
      // approximate these so existing callers have reasonable values.
      createdAt: now.toISOString(),
      expiresAt: new Date(now.getTime() + sevenDaysMs).toISOString(),
    };

    return normalized;
  } catch (error) {
    console.error('[Didit] Failed to create session:', error);
    throw new Error('Failed to create Didit KYC session');
  }
}

/**
 * Get KYC Session Status
 *
 * @param sessionId - Didit session ID
 * @returns Current session status and extracted data (if completed)
 *
 * @example
 * const status = await getSessionStatus('session_abc123');
 * if (status.status === 'completed') {
 *   console.log('KYC data:', status.extractedData);
 * }
 */
export async function getSessionStatus(
  sessionId: string
): Promise<DiditSessionStatusResponse> {
  try {
    const { data } = await diditClient.get<DiditSessionStatusResponse>(
      `/sessions/${sessionId}`
    );
    return data;
  } catch (error) {
    console.error(`[Didit] Failed to get session status for ${sessionId}:`, error);
    throw new Error('Failed to retrieve Didit session status');
  }
}

/**
 * Cancel KYC Session
 *
 * @param sessionId - Didit session ID to cancel
 * @returns Success boolean
 *
 * @example
 * await cancelSession('session_abc123');
 */
export async function cancelSession(sessionId: string): Promise<boolean> {
  try {
    await diditClient.delete(`/sessions/${sessionId}`);
    return true;
  } catch (error) {
    console.error(`[Didit] Failed to cancel session ${sessionId}:`, error);
    return false;
  }
}

/**
 * Health Check
 *
 * Verifies Didit API is reachable and credentials are valid
 *
 * @returns True if API is healthy, false otherwise
 */
export async function healthCheck(): Promise<boolean> {
  try {
    await diditClient.get('/health');
    return true;
  } catch (error) {
    console.error('[Didit] Health check failed:', error);
    return false;
  }
}
