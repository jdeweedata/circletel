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
} from './types';

// Didit API Configuration
const DIDIT_API_BASE = process.env.DIDIT_API_URL || 'https://api.didit.me/v1';
const DIDIT_API_KEY = process.env.DIDIT_API_KEY;

// Validate required environment variables
if (!DIDIT_API_KEY) {
  throw new Error(
    'DIDIT_API_KEY environment variable is required. Please add it to your .env file.'
  );
}

/**
 * Axios Instance for Didit API
 *
 * Pre-configured with:
 * - Base URL
 * - Bearer token authentication
 * - 30-second timeout (prevents hanging requests)
 * - Request/response logging for debugging
 */
export const diditClient: AxiosInstance = axios.create({
  baseURL: DIDIT_API_BASE,
  headers: {
    'Authorization': `Bearer ${DIDIT_API_KEY}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 30000, // 30 seconds
});

/**
 * Request Interceptor
 *
 * Logs all outgoing requests for debugging
 */
diditClient.interceptors.request.use(
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

/**
 * Response Interceptor
 *
 * Logs all responses and handles errors gracefully
 */
diditClient.interceptors.response.use(
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
    const { data } = await diditClient.post<DiditSessionResponse>('/sessions', request);
    return data;
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
