/**
 * Inngest Client Configuration
 *
 * Provides a configured Inngest client for background job processing.
 * Used for long-running tasks like competitor scraping that would
 * otherwise timeout on Vercel serverless functions.
 *
 * @see https://www.inngest.com/docs
 */

import { Inngest } from 'inngest';

// Create the Inngest client
export const inngest = new Inngest({
  id: 'circletel',
  name: 'CircleTel',
  // Event key is optional for development
  // In production, set INNGEST_EVENT_KEY environment variable
});

// =============================================================================
// EVENT TYPES
// =============================================================================

/**
 * Event types for type-safe event handling
 */
export type CompetitorScrapeEvent = {
  name: 'competitor/scrape.requested';
  data: {
    provider_id: string;
    provider_slug: string;
    provider_name: string;
    scrape_log_id: string;
    scrape_urls: string[];
    triggered_by?: string;
  };
};

export type CompetitorScrapeCompleteEvent = {
  name: 'competitor/scrape.completed';
  data: {
    provider_id: string;
    provider_slug: string;
    scrape_log_id: string;
    products_found: number;
    products_new: number;
    products_updated: number;
    credits_used: number;
    duration_ms: number;
  };
};

export type CompetitorScrapeFailedEvent = {
  name: 'competitor/scrape.failed';
  data: {
    provider_id: string;
    provider_slug: string;
    scrape_log_id: string;
    error: string;
  };
};

export type PriceAlertEvent = {
  name: 'competitor/price.alert';
  data: {
    provider_id: string;
    provider_name: string;
    product_name: string;
    old_price: number;
    new_price: number;
    change_percent: number;
    product_url?: string;
  };
};

// =============================================================================
// TARANA SYNC EVENTS
// =============================================================================

export type TaranaSyncRequestedEvent = {
  name: 'tarana/sync.requested';
  data: {
    triggered_by: 'cron' | 'manual';
    admin_user_id?: string;
    sync_log_id: string;
    options?: {
      deleteStale?: boolean;
      dryRun?: boolean;
    };
  };
};

export type TaranaSyncCompletedEvent = {
  name: 'tarana/sync.completed';
  data: {
    sync_log_id: string;
    inserted: number;
    updated: number;
    deleted: number;
    duration_ms: number;
  };
};

export type TaranaSyncFailedEvent = {
  name: 'tarana/sync.failed';
  data: {
    sync_log_id: string;
    error: string;
    attempt: number;
  };
};

export type TaranaSyncCancelledEvent = {
  name: 'tarana/sync.cancelled';
  data: {
    sync_log_id: string;
    cancelled_by?: string;
    reason?: string;
  };
};

// =============================================================================
// DFA SYNC EVENTS
// =============================================================================

export type DFASyncRequestedEvent = {
  name: 'dfa/sync.requested';
  data: {
    triggered_by: 'cron' | 'manual';
    admin_user_id?: string;
    sync_log_id: string;
    options?: {
      connectedOnly?: boolean;
      nearNetOnly?: boolean;
      dryRun?: boolean;
    };
  };
};

export type DFASyncCompletedEvent = {
  name: 'dfa/sync.completed';
  data: {
    sync_log_id: string;
    connected_count: number;
    near_net_count: number;
    records_inserted: number;
    records_updated: number;
    duration_ms: number;
  };
};

export type DFASyncFailedEvent = {
  name: 'dfa/sync.failed';
  data: {
    sync_log_id: string;
    error: string;
    attempt: number;
  };
};

export type DFASyncCancelledEvent = {
  name: 'dfa/sync.cancelled';
  data: {
    sync_log_id: string;
    cancelled_by?: string;
    reason?: string;
  };
};

// =============================================================================
// FEASIBILITY CHECK EVENTS
// =============================================================================

export type FeasibilityCheckRequestedEvent = {
  name: 'feasibility/check.requested';
  data: {
    lead_id: string;
    coordinates: { lat: number; lng: number };
    requirements?: {
      bandwidth_mbps?: number;
      budget_max?: number;
      contention?: 'best-effort' | '10:1' | 'dia';
      failover_needed?: boolean;
      sla_required?: string;
    };
    triggered_by?: 'api' | 'admin' | 'partner';
    user_id?: string;
  };
};

export type FeasibilityCheckCompletedEvent = {
  name: 'feasibility/check.completed';
  data: {
    lead_id: string;
    results: Array<{
      technology: string;
      provider: string;
      is_feasible: boolean;
      confidence: 'high' | 'medium' | 'low';
      checked_at: string;
    }>;
    duration_ms: number;
    is_feasible: boolean;
    best_technology?: string;
  };
};

export type FeasibilityCheckFailedEvent = {
  name: 'feasibility/check.failed';
  data: {
    lead_id: string;
    error: string;
    attempt: number;
  };
};

export type FeasibilityCheckCancelledEvent = {
  name: 'feasibility/check.cancelled';
  data: {
    lead_id: string;
    cancelled_by?: string;
    reason?: string;
  };
};

// =============================================================================
// BILLING EVENTS
// =============================================================================

export type DebitOrdersRequestedEvent = {
  name: 'billing/debit-orders.requested';
  data: {
    triggered_by: 'cron' | 'manual';
    billing_date?: string;
    admin_user_id?: string;
    batch_log_id: string;
    options?: {
      dryRun?: boolean;
    };
  };
};

export type DebitOrdersCompletedEvent = {
  name: 'billing/debit-orders.completed';
  data: {
    batch_log_id: string;
    billing_date: string;
    batch_id?: string;
    total_eligible: number;
    submitted: number;
    skipped: number;
    paynow_sent: number;
    duration_ms: number;
  };
};

export type DebitOrdersFailedEvent = {
  name: 'billing/debit-orders.failed';
  data: {
    batch_log_id: string;
    error: string;
    attempt: number;
  };
};

export type DebitOrdersCancelledEvent = {
  name: 'billing/debit-orders.cancelled';
  data: {
    batch_log_id: string;
    cancelled_by?: string;
    reason?: string;
  };
};

export type BillingDayRequestedEvent = {
  name: 'billing/day.requested';
  data: {
    triggered_by: 'cron' | 'manual' | 'debit-completion';
    billing_date?: string;
    admin_user_id?: string;
    process_log_id: string;
    options?: {
      dryRun?: boolean;
    };
  };
};

export type BillingDayCompletedEvent = {
  name: 'billing/day.completed';
  data: {
    process_log_id: string;
    billing_date: string;
    total_invoices: number;
    processed: number;
    successful: number;
    failed: number;
    duration_ms: number;
  };
};

export type BillingDayFailedEvent = {
  name: 'billing/day.failed';
  data: {
    process_log_id: string;
    error: string;
    attempt: number;
  };
};

export type ZohoSyncRequestedEvent = {
  name: 'zoho/sync.requested';
  data: {
    triggered_by: 'cron' | 'manual';
    sync_log_id: string;
    options?: {
      maxProducts?: number;
      dryRun?: boolean;
      retryFailed?: boolean;
    };
  };
};

export type ZohoSyncCompletedEvent = {
  name: 'zoho/sync.completed';
  data: {
    sync_log_id: string;
    total_candidates: number;
    processed: number;
    crm_succeeded: number;
    crm_failed: number;
    billing_succeeded: number;
    billing_failed: number;
    duration_ms: number;
  };
};

export type ZohoSyncFailedEvent = {
  name: 'zoho/sync.failed';
  data: {
    sync_log_id: string;
    error: string;
    attempt: number;
  };
};

// Union type for all events
export type InngestEvents = {
  'competitor/scrape.requested': CompetitorScrapeEvent;
  'competitor/scrape.completed': CompetitorScrapeCompleteEvent;
  'competitor/scrape.failed': CompetitorScrapeFailedEvent;
  'competitor/price.alert': PriceAlertEvent;
  'tarana/sync.requested': TaranaSyncRequestedEvent;
  'tarana/sync.completed': TaranaSyncCompletedEvent;
  'tarana/sync.failed': TaranaSyncFailedEvent;
  'tarana/sync.cancelled': TaranaSyncCancelledEvent;
  // DFA sync events
  'dfa/sync.requested': DFASyncRequestedEvent;
  'dfa/sync.completed': DFASyncCompletedEvent;
  'dfa/sync.failed': DFASyncFailedEvent;
  'dfa/sync.cancelled': DFASyncCancelledEvent;
  // Feasibility check events
  'feasibility/check.requested': FeasibilityCheckRequestedEvent;
  'feasibility/check.completed': FeasibilityCheckCompletedEvent;
  'feasibility/check.failed': FeasibilityCheckFailedEvent;
  'feasibility/check.cancelled': FeasibilityCheckCancelledEvent;
  // Billing events
  'billing/debit-orders.requested': DebitOrdersRequestedEvent;
  'billing/debit-orders.completed': DebitOrdersCompletedEvent;
  'billing/debit-orders.failed': DebitOrdersFailedEvent;
  'billing/debit-orders.cancelled': DebitOrdersCancelledEvent;
  'billing/day.requested': BillingDayRequestedEvent;
  'billing/day.completed': BillingDayCompletedEvent;
  'billing/day.failed': BillingDayFailedEvent;
  // Zoho sync events
  'zoho/sync.requested': ZohoSyncRequestedEvent;
  'zoho/sync.completed': ZohoSyncCompletedEvent;
  'zoho/sync.failed': ZohoSyncFailedEvent;
};
