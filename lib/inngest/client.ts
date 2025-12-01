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

// Union type for all events
export type InngestEvents = {
  'competitor/scrape.requested': CompetitorScrapeEvent;
  'competitor/scrape.completed': CompetitorScrapeCompleteEvent;
  'competitor/scrape.failed': CompetitorScrapeFailedEvent;
  'competitor/price.alert': PriceAlertEvent;
};
