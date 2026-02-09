/**
 * Zoho API Rate Limiter
 *
 * Global rate limiting service for all Zoho API calls to prevent rate limit violations.
 *
 * Rate Limits (with 10% safety buffer):
 * - OAuth Token Refresh: 10 requests/minute (ultra-conservative, actual limit unknown)
 * - Zoho Billing API: 90 requests/minute (documented: 100/min)
 * - Zoho CRM API: 90 requests/minute (assumed similar to Billing)
 *
 * Usage:
 * ```typescript
 * await rateLimiter.waitForSlot('billing');
 * const response = await billingClient.upsertPlan(...);
 * rateLimiter.recordRequest('billing');
 * ```
 */

import { zohoLogger } from '@/lib/logging';

export type ZohoAPIType = 'oauth' | 'crm' | 'billing';

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number; // Time window in milliseconds
}

interface RequestRecord {
  timestamp: number;
  api: ZohoAPIType;
}

class ZohoRateLimiter {
  private requestHistory: Map<ZohoAPIType, RequestRecord[]> = new Map();

  // Rate limit configurations (with 10% safety buffer)
  private readonly limits: Record<ZohoAPIType, RateLimitConfig> = {
    oauth: {
      maxRequests: 10,   // Ultra-conservative (actual limit unknown)
      windowMs: 60000    // 1 minute
    },
    billing: {
      maxRequests: 90,   // 10% buffer from documented 100/min
      windowMs: 60000    // 1 minute
    },
    crm: {
      maxRequests: 90,   // 10% buffer (assumed similar to Billing)
      windowMs: 60000    // 1 minute
    }
  };

  constructor() {
    // Initialize request history for each API
    this.requestHistory.set('oauth', []);
    this.requestHistory.set('crm', []);
    this.requestHistory.set('billing', []);
  }

  /**
   * Wait for an available request slot
   * Blocks if rate limit would be exceeded
   */
  async waitForSlot(api: ZohoAPIType): Promise<void> {
    const config = this.limits[api];

    while (true) {
      this.cleanOldRecords(api);

      const currentCount = this.getCurrentCount(api);

      if (currentCount < config.maxRequests) {
        // Slot available, record the request
        this.recordRequest(api);
        return;
      }

      // Rate limit reached, calculate wait time
      const waitTimeMs = this.calculateWaitTime(api);

      zohoLogger.warn(`[RateLimiter] ${api} rate limit reached (${currentCount}/${config.maxRequests}). Waiting ${waitTimeMs}ms...`);

      await this.sleep(waitTimeMs);
    }
  }

  /**
   * Record a request (called automatically by waitForSlot)
   */
  private recordRequest(api: ZohoAPIType): void {
    const history = this.requestHistory.get(api)!;
    history.push({
      timestamp: Date.now(),
      api
    });
  }

  /**
   * Get current request count within the time window
   */
  getCurrentCount(api: ZohoAPIType): number {
    this.cleanOldRecords(api);
    return this.requestHistory.get(api)!.length;
  }

  /**
   * Get remaining quota for an API
   */
  getRemainingQuota(api: ZohoAPIType): number {
    const config = this.limits[api];
    const currentCount = this.getCurrentCount(api);
    return Math.max(0, config.maxRequests - currentCount);
  }

  /**
   * Remove records older than the time window
   */
  private cleanOldRecords(api: ZohoAPIType): void {
    const config = this.limits[api];
    const now = Date.now();
    const cutoff = now - config.windowMs;

    const history = this.requestHistory.get(api)!;
    const filtered = history.filter(record => record.timestamp > cutoff);
    this.requestHistory.set(api, filtered);
  }

  /**
   * Calculate how long to wait before next request is allowed
   */
  private calculateWaitTime(api: ZohoAPIType): number {
    const config = this.limits[api];
    const history = this.requestHistory.get(api)!;

    if (history.length === 0) {
      return 0;
    }

    // Find the oldest request in the current window
    const oldestTimestamp = Math.min(...history.map(r => r.timestamp));
    const now = Date.now();
    const age = now - oldestTimestamp;

    // Wait until the oldest request falls outside the window
    const waitTime = Math.max(0, config.windowMs - age + 100); // +100ms buffer

    return waitTime;
  }

  /**
   * Reset all rate limit tracking (for testing only)
   */
  reset(): void {
    this.requestHistory.set('oauth', []);
    this.requestHistory.set('crm', []);
    this.requestHistory.set('billing', []);
  }

  /**
   * Get statistics for monitoring
   */
  getStats(): Record<ZohoAPIType, { current: number; limit: number; remaining: number }> {
    return {
      oauth: {
        current: this.getCurrentCount('oauth'),
        limit: this.limits.oauth.maxRequests,
        remaining: this.getRemainingQuota('oauth')
      },
      crm: {
        current: this.getCurrentCount('crm'),
        limit: this.limits.crm.maxRequests,
        remaining: this.getRemainingQuota('crm')
      },
      billing: {
        current: this.getCurrentCount('billing'),
        limit: this.limits.billing.maxRequests,
        remaining: this.getRemainingQuota('billing')
      }
    };
  }

  /**
   * Utility sleep function
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Singleton instance
const rateLimiter = new ZohoRateLimiter();

export default rateLimiter;
