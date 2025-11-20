# ZOHO Billing Integration - Performance Optimization Guide

**Version**: 1.0
**Last Updated**: 2025-11-20
**Status**: Production Optimization

---

## 📋 Table of Contents

1. [Rate Limit Management](#rate-limit-management)
2. [Caching Strategies](#caching-strategies)
3. [Batch Processing Optimization](#batch-processing-optimization)
4. [Database Query Optimization](#database-query-optimization)
5. [Error Handling & Retry Logic](#error-handling--retry-logic)
6. [Monitoring & Metrics](#monitoring--metrics)
7. [Cost Optimization](#cost-optimization)

---

## 🚦 Rate Limit Management

### Current ZOHO API Rate Limits

**ZOHO Billing API Limits** (per organization):
- **Requests per minute**: 150
- **Requests per day**: 25,000
- **Burst limit**: 10 requests/second
- **Cooldown period**: 10-15 minutes after limit hit

### Implemented Rate Limit Protection

#### 1. Request Throttling

**Current Implementation** (`lib/integrations/zoho/billing-client.ts`):
```typescript
// Default delays
const REQUEST_DELAY = 100 // 100ms between requests (max 10 req/sec)
const BATCH_DELAY = 2000  // 2 seconds between batches
```

**Recommendations**:
```typescript
// Optimized delays for production
const REQUEST_DELAY = 150 // 150ms (safer than 100ms)
const BATCH_DELAY = 3000  // 3 seconds (prevent batch rate limits)
const RETRY_DELAY_BASE = 5000 // 5 seconds base for retries
```

#### 2. Exponential Backoff

**Implementation Pattern**:
```typescript
async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3
): Promise<T> {
  let lastError: Error | null = null

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error: any) {
      lastError = error

      // Check if rate limited
      if (error.status === 429 || error.message?.includes('too many requests')) {
        const backoffMs = Math.min(
          1000 * Math.pow(2, attempt), // Exponential: 1s, 2s, 4s, 8s...
          60000 // Max 60 seconds
        )

        console.log(`Rate limited. Waiting ${backoffMs}ms before retry ${attempt + 1}/${maxRetries}`)
        await new Promise(resolve => setTimeout(resolve, backoffMs))
        continue
      }

      // Non-rate-limit error, don't retry
      throw error
    }
  }

  throw lastError || new Error('Max retries exceeded')
}
```

#### 3. Request Queue Management

**Create Request Queue Service** (`lib/integrations/zoho/request-queue.ts`):
```typescript
interface QueuedRequest<T> {
  id: string
  operation: () => Promise<T>
  priority: number
  resolve: (value: T) => void
  reject: (error: Error) => void
}

class ZohoRequestQueue {
  private queue: QueuedRequest<any>[] = []
  private processing = false
  private requestsThisMinute = 0
  private minuteStartTime = Date.now()

  private readonly MAX_REQUESTS_PER_MINUTE = 120 // Leave buffer (limit is 150)
  private readonly REQUEST_INTERVAL = 150 // 150ms between requests

  async enqueue<T>(
    operation: () => Promise<T>,
    priority: number = 0
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push({
        id: Math.random().toString(36),
        operation,
        priority,
        resolve,
        reject
      })

      // Sort by priority (higher first)
      this.queue.sort((a, b) => b.priority - a.priority)

      this.processQueue()
    })
  }

  private async processQueue() {
    if (this.processing || this.queue.length === 0) return

    this.processing = true

    while (this.queue.length > 0) {
      // Reset counter if minute has passed
      const now = Date.now()
      if (now - this.minuteStartTime >= 60000) {
        this.requestsThisMinute = 0
        this.minuteStartTime = now
      }

      // Check rate limit
      if (this.requestsThisMinute >= this.MAX_REQUESTS_PER_MINUTE) {
        const waitTime = 60000 - (now - this.minuteStartTime)
        console.log(`Rate limit approaching. Waiting ${waitTime}ms...`)
        await new Promise(resolve => setTimeout(resolve, waitTime))
        continue
      }

      // Process next request
      const request = this.queue.shift()!

      try {
        const result = await request.operation()
        request.resolve(result)
        this.requestsThisMinute++
      } catch (error: any) {
        request.reject(error)
      }

      // Wait between requests
      await new Promise(resolve => setTimeout(resolve, this.REQUEST_INTERVAL))
    }

    this.processing = false
  }

  getQueueLength(): number {
    return this.queue.length
  }

  getRequestsThisMinute(): number {
    return this.requestsThisMinute
  }
}

// Singleton instance
export const zohoRequestQueue = new ZohoRequestQueue()
```

**Usage**:
```typescript
// High priority (customer registration)
const result = await zohoRequestQueue.enqueue(
  () => syncCustomerToZohoBilling(customerId),
  10
)

// Normal priority (invoice sync)
const invoice = await zohoRequestQueue.enqueue(
  () => syncInvoiceToZohoBilling(invoiceId),
  5
)

// Low priority (batch operations)
const payment = await zohoRequestQueue.enqueue(
  () => syncPaymentToZohoBilling(paymentId),
  1
)
```

---

## 💾 Caching Strategies

### 1. ZOHO Access Token Caching

**Current Implementation**: Token cached for 1 hour via `ZohoBillingClient`

**Optimization**: Extend caching with Supabase Storage
```typescript
// lib/integrations/zoho/token-cache.ts
import { createClient } from '@/lib/supabase/server'

interface CachedToken {
  access_token: string
  expires_at: number
  scope: string
}

export async function getCachedToken(): Promise<string | null> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('zoho_token_cache')
    .select('access_token, expires_at')
    .single()

  if (!data || data.expires_at < Date.now()) {
    return null
  }

  return data.access_token
}

export async function setCachedToken(token: string, expiresIn: number) {
  const supabase = await createClient()
  const expiresAt = Date.now() + (expiresIn * 1000)

  await supabase
    .from('zoho_token_cache')
    .upsert({
      id: 1, // Single row
      access_token: token,
      expires_at: expiresAt,
      updated_at: new Date().toISOString()
    })
}
```

**Migration**:
```sql
-- Add to new migration
CREATE TABLE IF NOT EXISTS zoho_token_cache (
  id INTEGER PRIMARY KEY DEFAULT 1,
  access_token TEXT NOT NULL,
  expires_at BIGINT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT single_row CHECK (id = 1)
);

-- Enable RLS (service role only)
ALTER TABLE zoho_token_cache ENABLE ROW LEVEL SECURITY;
```

### 2. ZOHO Organization Data Caching

**Cache frequently accessed ZOHO data** (products, plans, currencies):
```typescript
// lib/integrations/zoho/org-data-cache.ts
import { createClient } from '@/lib/supabase/server'

const CACHE_TTL = 24 * 60 * 60 * 1000 // 24 hours

export async function getCachedOrgData<T>(
  key: string
): Promise<T | null> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('zoho_org_data_cache')
    .select('data, cached_at')
    .eq('cache_key', key)
    .single()

  if (!data) return null

  const age = Date.now() - new Date(data.cached_at).getTime()
  if (age > CACHE_TTL) {
    return null // Expired
  }

  return data.data as T
}

export async function setCachedOrgData<T>(
  key: string,
  data: T
) {
  const supabase = await createClient()

  await supabase
    .from('zoho_org_data_cache')
    .upsert({
      cache_key: key,
      data: data,
      cached_at: new Date().toISOString()
    })
}
```

**Usage**:
```typescript
// Check cache first
let products = await getCachedOrgData<ZohoProduct[]>('products')

if (!products) {
  // Cache miss, fetch from ZOHO
  products = await zohoClient.getProducts()
  await setCachedOrgData('products', products)
}
```

### 3. Sync Status Caching

**Avoid redundant sync status checks**:
```typescript
// lib/integrations/zoho/sync-status-cache.ts
const syncStatusCache = new Map<string, {
  status: string
  cachedAt: number
}>()

const SYNC_STATUS_CACHE_TTL = 30000 // 30 seconds

export function getCachedSyncStatus(
  entityType: string,
  entityId: string
): string | null {
  const key = `${entityType}:${entityId}`
  const cached = syncStatusCache.get(key)

  if (!cached) return null

  const age = Date.now() - cached.cachedAt
  if (age > SYNC_STATUS_CACHE_TTL) {
    syncStatusCache.delete(key)
    return null
  }

  return cached.status
}

export function setCachedSyncStatus(
  entityType: string,
  entityId: string,
  status: string
) {
  const key = `${entityType}:${entityId}`
  syncStatusCache.set(key, {
    status,
    cachedAt: Date.now()
  })
}
```

---

## 📦 Batch Processing Optimization

### Current Batch Sizes

**Backfill Scripts**:
- Customers: 10 per batch
- Subscriptions: 10 per batch
- Invoices: 20 per batch
- Payments: 20 per batch

### Recommended Batch Sizes (Production)

**Based on rate limit analysis**:
```typescript
const BATCH_SIZES = {
  customers: 5,      // Reduced from 10 (complex entity)
  subscriptions: 5,  // Reduced from 10 (complex entity)
  invoices: 10,      // Reduced from 20
  payments: 10       // Reduced from 20
}

const BATCH_DELAYS = {
  customers: 5000,      // 5 seconds between customer batches
  subscriptions: 3000,  // 3 seconds between subscription batches
  invoices: 2000,       // 2 seconds between invoice batches
  payments: 2000        // 2 seconds between payment batches
}
```

### Adaptive Batch Processing

**Adjust batch size based on error rate**:
```typescript
class AdaptiveBatchProcessor {
  private batchSize: number
  private readonly minBatchSize = 1
  private readonly maxBatchSize = 10
  private errorRate = 0

  constructor(initialBatchSize: number = 5) {
    this.batchSize = initialBatchSize
  }

  async processBatch<T>(
    items: T[],
    processor: (item: T) => Promise<void>
  ): Promise<{ succeeded: number; failed: number }> {
    let succeeded = 0
    let failed = 0

    for (let i = 0; i < items.length; i += this.batchSize) {
      const batch = items.slice(i, i + this.batchSize)

      const results = await Promise.allSettled(
        batch.map(item => processor(item))
      )

      const batchSucceeded = results.filter(r => r.status === 'fulfilled').length
      const batchFailed = results.filter(r => r.status === 'rejected').length

      succeeded += batchSucceeded
      failed += batchFailed

      // Update error rate
      this.errorRate = (this.errorRate * 0.7) + ((batchFailed / batch.length) * 0.3)

      // Adjust batch size based on error rate
      if (this.errorRate > 0.3 && this.batchSize > this.minBatchSize) {
        this.batchSize = Math.max(this.minBatchSize, this.batchSize - 1)
        console.log(`⚠️  High error rate (${(this.errorRate * 100).toFixed(1)}%). Reducing batch size to ${this.batchSize}`)
      } else if (this.errorRate < 0.1 && this.batchSize < this.maxBatchSize) {
        this.batchSize = Math.min(this.maxBatchSize, this.batchSize + 1)
        console.log(`✅ Low error rate (${(this.errorRate * 100).toFixed(1)}%). Increasing batch size to ${this.batchSize}`)
      }

      // Wait between batches
      if (i + this.batchSize < items.length) {
        const delay = 2000 + (failed * 1000) // Extra delay if failures
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }

    return { succeeded, failed }
  }
}
```

---

## 🗃️ Database Query Optimization

### 1. Add Indexes for Sync Status Queries

**Migration**:
```sql
-- Add indexes for sync status filtering
CREATE INDEX IF NOT EXISTS idx_customers_zoho_sync_status
ON customers(zoho_sync_status)
WHERE account_type != 'internal_test';

CREATE INDEX IF NOT EXISTS idx_customer_services_zoho_sync_status
ON customer_services(zoho_sync_status);

CREATE INDEX IF NOT EXISTS idx_customer_invoices_zoho_sync_status
ON customer_invoices(zoho_sync_status);

CREATE INDEX IF NOT EXISTS idx_payment_transactions_zoho_sync_status
ON payment_transactions(zoho_sync_status);

-- Add composite index for sync logs
CREATE INDEX IF NOT EXISTS idx_zoho_sync_logs_lookup
ON zoho_sync_logs(entity_type, entity_id, status, created_at DESC);

-- Add index for time-based queries
CREATE INDEX IF NOT EXISTS idx_zoho_sync_logs_created_at
ON zoho_sync_logs(created_at DESC);
```

### 2. Optimize Dashboard Queries

**Use CTEs for complex queries**:
```sql
-- Optimized sync status query for dashboard
WITH sync_stats AS (
  SELECT
    'customers' as entity_type,
    COUNT(*) FILTER (WHERE zoho_billing_customer_id IS NOT NULL) as synced,
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE zoho_sync_status = 'failed') as failed
  FROM customers
  WHERE account_type != 'internal_test'

  UNION ALL

  SELECT
    'services' as entity_type,
    COUNT(*) FILTER (WHERE zoho_subscription_id IS NOT NULL) as synced,
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE zoho_sync_status = 'failed') as failed
  FROM customer_services

  UNION ALL

  SELECT
    'invoices' as entity_type,
    COUNT(*) FILTER (WHERE zoho_billing_invoice_id IS NOT NULL) as synced,
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE zoho_sync_status = 'failed') as failed
  FROM customer_invoices

  UNION ALL

  SELECT
    'payments' as entity_type,
    COUNT(*) FILTER (WHERE zoho_payment_id IS NOT NULL) as synced,
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE zoho_sync_status = 'failed') as failed
  FROM payment_transactions
)
SELECT * FROM sync_stats;
```

### 3. Use Database Functions

**Create stored procedure for health checks**:
```sql
CREATE OR REPLACE FUNCTION get_zoho_sync_health()
RETURNS TABLE(
  entity_type TEXT,
  total_count BIGINT,
  synced_count BIGINT,
  failed_count BIGINT,
  sync_rate NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH stats AS (
    -- Same query as above
  )
  SELECT
    entity_type,
    total,
    synced,
    failed,
    ROUND(synced * 100.0 / NULLIF(total, 0), 2) as sync_rate
  FROM stats;
END;
$$ LANGUAGE plpgsql STABLE;
```

**Usage**:
```typescript
const { data } = await supabase.rpc('get_zoho_sync_health')
```

---

## 🔄 Error Handling & Retry Logic

### Enhanced Error Classification

```typescript
enum ZohoErrorType {
  RATE_LIMIT = 'rate_limit',
  AUTHENTICATION = 'authentication',
  VALIDATION = 'validation',
  NOT_FOUND = 'not_found',
  SERVER_ERROR = 'server_error',
  NETWORK_ERROR = 'network_error',
  UNKNOWN = 'unknown'
}

interface ZohoError extends Error {
  type: ZohoErrorType
  retryable: boolean
  retryAfter?: number
}

function classifyZohoError(error: any): ZohoError {
  const zohoError = error as ZohoError

  // Rate limit
  if (error.status === 429 || error.message?.includes('too many requests')) {
    zohoError.type = ZohoErrorType.RATE_LIMIT
    zohoError.retryable = true
    zohoError.retryAfter = 600000 // 10 minutes
    return zohoError
  }

  // Authentication
  if (error.status === 401 || error.message?.includes('Access Denied')) {
    zohoError.type = ZohoErrorType.AUTHENTICATION
    zohoError.retryable = true
    return zohoError
  }

  // Validation
  if (error.status === 400) {
    zohoError.type = ZohoErrorType.VALIDATION
    zohoError.retryable = false
    return zohoError
  }

  // Not found
  if (error.status === 404) {
    zohoError.type = ZohoErrorType.NOT_FOUND
    zohoError.retryable = false
    return zohoError
  }

  // Server error
  if (error.status >= 500) {
    zohoError.type = ZohoErrorType.SERVER_ERROR
    zohoError.retryable = true
    return zohoError
  }

  // Network error
  if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
    zohoError.type = ZohoErrorType.NETWORK_ERROR
    zohoError.retryable = true
    return zohoError
  }

  // Unknown
  zohoError.type = ZohoErrorType.UNKNOWN
  zohoError.retryable = false
  return zohoError
}
```

### Smart Retry Logic

```typescript
async function syncWithSmartRetry<T>(
  operation: () => Promise<T>,
  context: { entityType: string; entityId: string }
): Promise<T> {
  const maxRetries = 3
  let attempt = 0

  while (attempt < maxRetries) {
    try {
      return await operation()
    } catch (error: any) {
      attempt++
      const zohoError = classifyZohoError(error)

      // Log failure
      await logZohoSync({
        entity_type: context.entityType as any,
        entity_id: context.entityId,
        zoho_entity_type: 'Contacts',
        zoho_entity_id: null,
        status: attempt < maxRetries ? 'retrying' : 'failed',
        attempt_number: attempt,
        error_message: zohoError.message,
        request_payload: null,
        response_payload: null
      })

      // Don't retry if not retryable
      if (!zohoError.retryable) {
        throw zohoError
      }

      // Max retries exceeded
      if (attempt >= maxRetries) {
        throw zohoError
      }

      // Calculate retry delay
      const delay = zohoError.retryAfter || (1000 * Math.pow(2, attempt))
      console.log(`Retry ${attempt}/${maxRetries} after ${delay}ms: ${zohoError.message}`)

      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  throw new Error('Max retries exceeded')
}
```

---

## 📊 Monitoring & Metrics

### Key Performance Indicators (KPIs)

**Target Metrics**:
```typescript
const KPI_TARGETS = {
  syncSuccessRate: 98.0,        // %
  avgSyncTime: 5000,             // ms
  failedSyncsPerDay: 5,          // count
  rateLimitHitsPerWeek: 0,       // count
  avgRetryCount: 1.2,            // attempts
  staleSyncsPerWeek: 0           // count (>7 days old)
}
```

### Metrics Collection

**Add metrics table**:
```sql
CREATE TABLE IF NOT EXISTS zoho_sync_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_date DATE NOT NULL,
  metric_type TEXT NOT NULL, -- 'success_rate', 'avg_sync_time', etc.
  entity_type TEXT,
  metric_value NUMERIC NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(metric_date, metric_type, entity_type)
);

CREATE INDEX idx_zoho_sync_metrics_date ON zoho_sync_metrics(metric_date DESC);
```

**Daily metrics calculation**:
```typescript
// scripts/zoho-calculate-daily-metrics.ts
async function calculateDailyMetrics() {
  const supabase = await createClient()
  const today = new Date().toISOString().split('T')[0]
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  // Success rate by entity type
  const { data: logs } = await supabase
    .from('zoho_sync_logs')
    .select('entity_type, status')
    .gte('created_at', yesterday)

  const metricsByEntity = new Map()

  logs?.forEach(log => {
    if (!metricsByEntity.has(log.entity_type)) {
      metricsByEntity.set(log.entity_type, { total: 0, success: 0 })
    }

    const metrics = metricsByEntity.get(log.entity_type)
    metrics.total++
    if (log.status === 'success') metrics.success++
  })

  // Insert metrics
  for (const [entityType, metrics] of metricsByEntity) {
    const successRate = (metrics.success / metrics.total) * 100

    await supabase.from('zoho_sync_metrics').upsert({
      metric_date: today,
      metric_type: 'success_rate',
      entity_type: entityType,
      metric_value: successRate,
      metadata: { total: metrics.total, success: metrics.success }
    })
  }
}
```

---

## 💰 Cost Optimization

### ZOHO API Usage Tracking

**Monitor API call volume**:
```typescript
// Track API calls per day
let apiCallsToday = 0
let lastResetDate = new Date().toDateString()

function trackApiCall() {
  const today = new Date().toDateString()

  if (today !== lastResetDate) {
    apiCallsToday = 0
    lastResetDate = today
  }

  apiCallsToday++

  // Alert if approaching limit
  if (apiCallsToday > 20000) { // 80% of 25k daily limit
    console.warn(`⚠️  API calls today: ${apiCallsToday} (approaching daily limit)`)
  }

  return apiCallsToday
}
```

### Reduce Unnecessary Syncs

**Debounce sync triggers**:
```typescript
// Prevent duplicate syncs within 5 minutes
const syncDebounce = new Map<string, number>()
const DEBOUNCE_MS = 5 * 60 * 1000 // 5 minutes

function shouldSync(entityType: string, entityId: string): boolean {
  const key = `${entityType}:${entityId}`
  const lastSync = syncDebounce.get(key)

  if (lastSync && Date.now() - lastSync < DEBOUNCE_MS) {
    return false // Skip, too soon since last sync
  }

  syncDebounce.set(key, Date.now())
  return true
}
```

**Batch updates instead of individual syncs**:
```typescript
// Collect updates over 5 minutes, then batch sync
const updateQueue = new Map<string, any[]>()

function queueUpdate(entityType: string, entityId: string, data: any) {
  const key = entityType
  if (!updateQueue.has(key)) {
    updateQueue.set(key, [])
  }
  updateQueue.get(key)!.push({ entityId, data })
}

// Process queue every 5 minutes
setInterval(async () => {
  for (const [entityType, updates] of updateQueue) {
    if (updates.length > 0) {
      await batchSyncToZoho(entityType, updates)
      updateQueue.set(entityType, [])
    }
  }
}, 5 * 60 * 1000)
```

---

## 🚀 Quick Reference

### Recommended Settings (Production)

```typescript
// lib/integrations/zoho/config.ts
export const ZOHO_PERFORMANCE_CONFIG = {
  // Rate limiting
  REQUEST_DELAY: 150,           // ms between requests
  BATCH_DELAY: 3000,            // ms between batches
  MAX_REQUESTS_PER_MINUTE: 120, // Leave 20% buffer

  // Batch processing
  BATCH_SIZES: {
    customers: 5,
    subscriptions: 5,
    invoices: 10,
    payments: 10
  },

  // Retry logic
  MAX_RETRIES: 3,
  RETRY_BASE_DELAY: 5000,       // ms
  RATE_LIMIT_RETRY_DELAY: 600000, // 10 minutes

  // Caching
  TOKEN_CACHE_TTL: 3600000,     // 1 hour
  ORG_DATA_CACHE_TTL: 86400000, // 24 hours
  SYNC_STATUS_CACHE_TTL: 30000, // 30 seconds

  // Monitoring
  METRICS_CALCULATION_INTERVAL: 86400000, // Daily
  HEALTH_CHECK_INTERVAL: 3600000,         // Hourly
  ALERT_CHECK_INTERVAL: 1800000,          // 30 minutes

  // Cost optimization
  SYNC_DEBOUNCE_MS: 300000,     // 5 minutes
  BATCH_UPDATE_INTERVAL: 300000 // 5 minutes
}
```

### Performance Checklist

**Before Production**:
- [ ] Implement request queue with rate limit protection
- [ ] Add exponential backoff to all sync operations
- [ ] Enable token and org data caching
- [ ] Reduce batch sizes to 5 for customers/subscriptions
- [ ] Add database indexes for sync status queries
- [ ] Implement smart retry logic with error classification
- [ ] Set up daily metrics calculation
- [ ] Configure alerts for high API usage
- [ ] Add sync debouncing to prevent duplicates
- [ ] Test with production-like load

**Monitoring**:
- [ ] Daily API usage tracking
- [ ] Weekly success rate analysis
- [ ] Monthly cost review
- [ ] Quarterly optimization review

---

**Version**: 1.0
**Last Review**: 2025-11-20
**Next Review**: 2026-02-20 (quarterly)
**Owner**: Development + Operations Team
