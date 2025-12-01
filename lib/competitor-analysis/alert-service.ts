/**
 * Competitor Analysis Alert Service
 *
 * Sends email notifications for significant competitor price changes
 * and other important market intelligence events.
 */

import { EmailNotificationService } from '@/lib/notifications/notification-service';
import type { PriceChange } from './price-change-detector';
import type { DashboardAlert, CompetitorProvider, ScrapeJobResult } from './types';

// =============================================================================
// TYPES
// =============================================================================

export interface AlertConfig {
  /** Email addresses for price drop alerts */
  priceAlertRecipients: string[];
  /** Email addresses for scrape failure alerts */
  scrapeAlertRecipients: string[];
  /** Minimum price drop percentage to trigger alert (default: 10%) */
  priceDropThreshold: number;
  /** Enable email notifications */
  emailEnabled: boolean;
}

export interface AlertResult {
  success: boolean;
  alerts_sent: number;
  errors: string[];
}

// =============================================================================
// DEFAULT CONFIG
// =============================================================================

const DEFAULT_CONFIG: AlertConfig = {
  priceAlertRecipients: process.env.COMPETITOR_PRICE_ALERT_EMAILS?.split(',') || [
    'sales@circletel.co.za',
  ],
  scrapeAlertRecipients: process.env.COMPETITOR_SCRAPE_ALERT_EMAILS?.split(',') || [
    'devadmin@circletel.co.za',
  ],
  priceDropThreshold: 10,
  emailEnabled: process.env.COMPETITOR_ALERTS_ENABLED === 'true',
};

// =============================================================================
// ALERT SERVICE
// =============================================================================

/**
 * Send alerts for significant price drops.
 * These are important for sales team to adjust pricing strategy.
 */
export async function sendPriceDropAlerts(
  priceChanges: PriceChange[],
  config: Partial<AlertConfig> = {}
): Promise<AlertResult> {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };
  const errors: string[] = [];
  let alertsSent = 0;

  // Filter for significant price drops
  const significantDrops = priceChanges.filter(
    (change) =>
      change.direction === 'decrease' &&
      Math.abs(change.change_percentage) >= mergedConfig.priceDropThreshold
  );

  if (significantDrops.length === 0) {
    return { success: true, alerts_sent: 0, errors: [] };
  }

  if (!mergedConfig.emailEnabled) {
    console.log('[CompetitorAlerts] Email alerts disabled, skipping notifications');
    return { success: true, alerts_sent: 0, errors: ['Email alerts disabled'] };
  }

  // Group by provider for cleaner email
  const byProvider = new Map<string, PriceChange[]>();
  for (const drop of significantDrops) {
    const existing = byProvider.get(drop.provider_name) || [];
    existing.push(drop);
    byProvider.set(drop.provider_name, existing);
  }

  // Build email content
  const emailSubject = `[CircleTel] Competitor Price Alert: ${significantDrops.length} Price ${significantDrops.length === 1 ? 'Drop' : 'Drops'} Detected`;

  const providerSections = Array.from(byProvider.entries())
    .map(([provider, drops]) => {
      const dropRows = drops
        .map((d) => {
          const absPercent = Math.abs(d.change_percentage).toFixed(1);
          return `  - ${d.product_name}: R${d.old_price} → R${d.new_price} (-${absPercent}%)`;
        })
        .join('\n');
      return `${provider}:\n${dropRows}`;
    })
    .join('\n\n');

  const emailBody = `
Competitor Price Alert

${significantDrops.length} significant price ${significantDrops.length === 1 ? 'drop has' : 'drops have'} been detected:

${providerSections}

---
Detected at: ${new Date().toLocaleString('en-ZA', { timeZone: 'Africa/Johannesburg' })}
View details: ${process.env.NEXT_PUBLIC_APP_URL || 'https://www.circletel.co.za'}/admin/competitor-analysis

This is an automated alert from CircleTel Competitor Analysis.
  `.trim();

  // Send to each recipient
  for (const recipient of mergedConfig.priceAlertRecipients) {
    try {
      const result = await EmailNotificationService.send({
        to: recipient,
        subject: emailSubject,
        template: 'sales_coverage_lead_alert', // Reuse existing admin template
        data: {
          title: 'Competitor Price Alert',
          content: emailBody,
          alert_type: 'price_drop',
          price_changes: significantDrops,
        },
      });

      if (result.success) {
        alertsSent++;
      } else {
        errors.push(`Failed to send to ${recipient}: ${result.error}`);
      }
    } catch (error) {
      errors.push(`Error sending to ${recipient}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  console.log(`[CompetitorAlerts] Sent ${alertsSent} price drop alerts`);

  return {
    success: errors.length === 0,
    alerts_sent: alertsSent,
    errors,
  };
}

/**
 * Send alerts for scrape failures.
 * These are important for dev team to investigate.
 */
export async function sendScrapeFailureAlert(
  provider: CompetitorProvider,
  errorMessage: string,
  config: Partial<AlertConfig> = {}
): Promise<AlertResult> {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };

  if (!mergedConfig.emailEnabled) {
    console.log('[CompetitorAlerts] Email alerts disabled, skipping scrape failure notification');
    return { success: true, alerts_sent: 0, errors: ['Email alerts disabled'] };
  }

  const errors: string[] = [];
  let alertsSent = 0;

  const emailSubject = `[CircleTel] Scrape Failed: ${provider.name}`;
  const emailBody = `
Competitor Scrape Failure

Provider: ${provider.name} (${provider.slug})
Website: ${provider.website}
Error: ${errorMessage}

Last successful scrape: ${provider.last_scraped_at ? new Date(provider.last_scraped_at).toLocaleString('en-ZA', { timeZone: 'Africa/Johannesburg' }) : 'Never'}

---
Please investigate and resolve the issue.

This is an automated alert from CircleTel Competitor Analysis.
  `.trim();

  for (const recipient of mergedConfig.scrapeAlertRecipients) {
    try {
      const result = await EmailNotificationService.send({
        to: recipient,
        subject: emailSubject,
        template: 'admin_urgent_order', // Reuse urgent template for failures
        data: {
          title: 'Scrape Failure Alert',
          content: emailBody,
          provider_name: provider.name,
          error_message: errorMessage,
        },
      });

      if (result.success) {
        alertsSent++;
      } else {
        errors.push(`Failed to send to ${recipient}: ${result.error}`);
      }
    } catch (error) {
      errors.push(`Error sending to ${recipient}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  console.log(`[CompetitorAlerts] Sent ${alertsSent} scrape failure alerts for ${provider.name}`);

  return {
    success: errors.length === 0,
    alerts_sent: alertsSent,
    errors,
  };
}

/**
 * Send a daily/weekly summary of competitor changes.
 */
export async function sendScrapesSummary(
  results: ScrapeJobResult[],
  priceChanges: PriceChange[],
  config: Partial<AlertConfig> = {}
): Promise<AlertResult> {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };

  if (!mergedConfig.emailEnabled) {
    return { success: true, alerts_sent: 0, errors: ['Email alerts disabled'] };
  }

  const errors: string[] = [];
  let alertsSent = 0;

  const totalProducts = results.reduce((sum, r) => sum + r.products_found, 0);
  const newProducts = results.reduce((sum, r) => sum + r.products_new, 0);
  const updatedProducts = results.reduce((sum, r) => sum + r.products_updated, 0);
  const failedScrapes = results.filter((r) => r.status === 'failed');
  const priceDrops = priceChanges.filter((c) => c.direction === 'decrease');
  const priceIncreases = priceChanges.filter((c) => c.direction === 'increase');

  const emailSubject = `[CircleTel] Competitor Analysis Summary - ${new Date().toLocaleDateString('en-ZA')}`;
  const emailBody = `
Competitor Analysis Summary

Scrape Results:
- Providers scraped: ${results.length}
- Total products found: ${totalProducts}
- New products: ${newProducts}
- Updated products: ${updatedProducts}
- Failed scrapes: ${failedScrapes.length}

Price Changes:
- Price drops: ${priceDrops.length}
- Price increases: ${priceIncreases.length}

${failedScrapes.length > 0 ? `\nFailed Providers:\n${failedScrapes.map((r) => `  - ${r.provider_slug}: ${r.errors.join(', ')}`).join('\n')}` : ''}

${priceDrops.length > 0 ? `\nSignificant Price Drops:\n${priceDrops.slice(0, 10).map((d) => `  - ${d.provider_name} ${d.product_name}: R${d.old_price} → R${d.new_price}`).join('\n')}` : ''}

---
View full details: ${process.env.NEXT_PUBLIC_APP_URL || 'https://www.circletel.co.za'}/admin/competitor-analysis

This is an automated summary from CircleTel Competitor Analysis.
  `.trim();

  // Send to all recipients
  const allRecipients = [...new Set([...mergedConfig.priceAlertRecipients, ...mergedConfig.scrapeAlertRecipients])];

  for (const recipient of allRecipients) {
    try {
      const result = await EmailNotificationService.send({
        to: recipient,
        subject: emailSubject,
        template: 'admin_new_order_sales', // Reuse existing template
        data: {
          title: 'Competitor Analysis Summary',
          content: emailBody,
        },
      });

      if (result.success) {
        alertsSent++;
      } else {
        errors.push(`Failed to send to ${recipient}: ${result.error}`);
      }
    } catch (error) {
      errors.push(`Error sending to ${recipient}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  console.log(`[CompetitorAlerts] Sent ${alertsSent} summary emails`);

  return {
    success: errors.length === 0,
    alerts_sent: alertsSent,
    errors,
  };
}

/**
 * Store alerts in the database for dashboard display.
 */
export async function storeAlerts(
  alerts: DashboardAlert[],
  supabase: any
): Promise<{ success: boolean; error?: string }> {
  if (alerts.length === 0) {
    return { success: true };
  }

  try {
    // Store in a competitor_alerts table (if exists) or just log
    // For now, alerts are generated on-demand from price history
    console.log(`[CompetitorAlerts] Generated ${alerts.length} dashboard alerts`);
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[CompetitorAlerts] Failed to store alerts:', message);
    return { success: false, error: message };
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

export const CompetitorAlertService = {
  sendPriceDropAlerts,
  sendScrapeFailureAlert,
  sendScrapesSummary,
  storeAlerts,
};

export default CompetitorAlertService;
