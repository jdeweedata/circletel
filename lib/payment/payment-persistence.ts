/**
 * Payment Persistence Utility
 * Handles saving and restoring order data across payment retries
 */

const STORAGE_KEYS = {
  ORDER_DATA: 'circletel_order_data',
  PAYMENT_RETRIES: 'circletel_payment_retries',
  PAYMENT_ERROR: 'circletel_payment_error',
  ORDER_ID: 'circletel_order_id',
} as const;

export interface PersistedOrderData {
  // Customer information
  customerName: string;
  customerEmail: string;
  customerPhone: string;

  // Service details
  packageId: string;
  packageName: string;
  serviceType: string;
  speed: string;

  // Pricing
  basePrice: number;
  installationFee: number;
  totalAmount: number;

  // Address
  installationAddress: string;
  coordinates?: { lat: number; lng: number };

  // Installation preferences
  preferredDate?: string;
  specialInstructions?: string;

  // Metadata
  createdAt: string;
  lastAttempt?: string;
}

export interface PaymentRetryInfo {
  count: number;
  lastErrorCode?: string;
  attempts: Array<{
    timestamp: string;
    errorCode: string;
    errorMessage: string;
  }>;
}

/**
 * Save order data to localStorage for retry persistence
 */
export function saveOrderData(orderData: PersistedOrderData): void {
  try {
    if (typeof window === 'undefined') return;

    const dataWithTimestamp = {
      ...orderData,
      createdAt: orderData.createdAt || new Date().toISOString(),
      lastAttempt: new Date().toISOString(),
    };

    localStorage.setItem(STORAGE_KEYS.ORDER_DATA, JSON.stringify(dataWithTimestamp));
    console.log('[Payment Persistence] Order data saved');
  } catch (error) {
    console.error('[Payment Persistence] Failed to save order data:', error);
  }
}

/**
 * Retrieve saved order data from localStorage
 */
export function getOrderData(): PersistedOrderData | null {
  try {
    if (typeof window === 'undefined') return null;

    const data = localStorage.getItem(STORAGE_KEYS.ORDER_DATA);
    if (!data) return null;

    const parsed = JSON.parse(data) as PersistedOrderData;

    // Check if data is stale (older than 24 hours)
    const createdAt = new Date(parsed.createdAt);
    const now = new Date();
    const hoursDiff = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);

    if (hoursDiff > 24) {
      console.warn('[Payment Persistence] Order data is stale, clearing...');
      clearOrderData();
      return null;
    }

    console.log('[Payment Persistence] Order data retrieved');
    return parsed;
  } catch (error) {
    console.error('[Payment Persistence] Failed to retrieve order data:', error);
    return null;
  }
}

/**
 * Clear saved order data
 */
export function clearOrderData(): void {
  try {
    if (typeof window === 'undefined') return;

    localStorage.removeItem(STORAGE_KEYS.ORDER_DATA);
    localStorage.removeItem(STORAGE_KEYS.PAYMENT_RETRIES);
    localStorage.removeItem(STORAGE_KEYS.PAYMENT_ERROR);
    localStorage.removeItem(STORAGE_KEYS.ORDER_ID);
    console.log('[Payment Persistence] Order data cleared');
  } catch (error) {
    console.error('[Payment Persistence] Failed to clear order data:', error);
  }
}

/**
 * Increment retry count and record attempt
 */
export function recordPaymentAttempt(errorCode: string, errorMessage: string): PaymentRetryInfo {
  try {
    if (typeof window === 'undefined') {
      return { count: 0, attempts: [] };
    }

    const existing = getRetryInfo();
    const newRetryInfo: PaymentRetryInfo = {
      count: existing.count + 1,
      lastErrorCode: errorCode,
      attempts: [
        ...existing.attempts,
        {
          timestamp: new Date().toISOString(),
          errorCode,
          errorMessage,
        },
      ],
    };

    localStorage.setItem(STORAGE_KEYS.PAYMENT_RETRIES, JSON.stringify(newRetryInfo));
    console.log(`[Payment Persistence] Retry count: ${newRetryInfo.count}`);

    return newRetryInfo;
  } catch (error) {
    console.error('[Payment Persistence] Failed to record payment attempt:', error);
    return { count: 0, attempts: [] };
  }
}

/**
 * Get retry information
 */
export function getRetryInfo(): PaymentRetryInfo {
  try {
    if (typeof window === 'undefined') {
      return { count: 0, attempts: [] };
    }

    const data = localStorage.getItem(STORAGE_KEYS.PAYMENT_RETRIES);
    if (!data) {
      return { count: 0, attempts: [] };
    }

    return JSON.parse(data) as PaymentRetryInfo;
  } catch (error) {
    console.error('[Payment Persistence] Failed to get retry info:', error);
    return { count: 0, attempts: [] };
  }
}

/**
 * Save payment error for display after redirect
 */
export function savePaymentError(errorCode: string, errorMessage: string): void {
  try {
    if (typeof window === 'undefined') return;

    const errorData = {
      code: errorCode,
      message: errorMessage,
      timestamp: new Date().toISOString(),
    };

    localStorage.setItem(STORAGE_KEYS.PAYMENT_ERROR, JSON.stringify(errorData));
    console.log('[Payment Persistence] Payment error saved');
  } catch (error) {
    console.error('[Payment Persistence] Failed to save payment error:', error);
  }
}

/**
 * Get saved payment error (and clear it)
 */
export function getPaymentError(): { code: string; message: string; timestamp: string } | null {
  try {
    if (typeof window === 'undefined') return null;

    const data = localStorage.getItem(STORAGE_KEYS.PAYMENT_ERROR);
    if (!data) return null;

    // Clear after reading (single use)
    localStorage.removeItem(STORAGE_KEYS.PAYMENT_ERROR);

    return JSON.parse(data);
  } catch (error) {
    console.error('[Payment Persistence] Failed to get payment error:', error);
    return null;
  }
}

/**
 * Save order ID for tracking
 */
export function saveOrderId(orderId: string): void {
  try {
    if (typeof window === 'undefined') return;

    localStorage.setItem(STORAGE_KEYS.ORDER_ID, orderId);
    console.log('[Payment Persistence] Order ID saved:', orderId);
  } catch (error) {
    console.error('[Payment Persistence] Failed to save order ID:', error);
  }
}

/**
 * Get saved order ID
 */
export function getOrderId(): string | null {
  try {
    if (typeof window === 'undefined') return null;

    return localStorage.getItem(STORAGE_KEYS.ORDER_ID);
  } catch (error) {
    console.error('[Payment Persistence] Failed to get order ID:', error);
    return null;
  }
}

/**
 * Check if there's a pending payment retry
 */
export function hasPendingRetry(): boolean {
  try {
    if (typeof window === 'undefined') return false;

    const orderData = getOrderData();
    const retryInfo = getRetryInfo();

    return !!(orderData && retryInfo.count > 0);
  } catch (error) {
    return false;
  }
}

/**
 * Get summary of retry session
 */
export function getRetrySession(): {
  hasData: boolean;
  retryCount: number;
  lastError?: string;
  orderAge?: string;
} {
  const orderData = getOrderData();
  const retryInfo = getRetryInfo();

  if (!orderData) {
    return { hasData: false, retryCount: 0 };
  }

  const createdAt = new Date(orderData.createdAt);
  const now = new Date();
  const minutesAgo = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60));

  let orderAge = '';
  if (minutesAgo < 60) {
    orderAge = `${minutesAgo} minute${minutesAgo !== 1 ? 's' : ''} ago`;
  } else {
    const hoursAgo = Math.floor(minutesAgo / 60);
    orderAge = `${hoursAgo} hour${hoursAgo !== 1 ? 's' : ''} ago`;
  }

  return {
    hasData: true,
    retryCount: retryInfo.count,
    lastError: retryInfo.lastErrorCode,
    orderAge,
  };
}
