/**
 * Inngest Functions Index
 *
 * Exports all Inngest functions for registration with the serve handler.
 */

export { inngest } from './client';
export type { InngestEvents } from './client';

// Import all functions
export {
  competitorScrapeFunction,
  priceAlertFunction,
  scheduledScrapeFunction,
} from './functions/competitor-scrape';

export {
  taranaSyncFunction,
  taranaSyncCompletedFunction,
  taranaSyncFailedFunction,
} from './functions/tarana-sync';

export {
  taranaMetricsCollectionFunction,
} from './functions/tarana-metrics-collection';

export {
  dfaSyncFunction,
  dfaSyncCompletedFunction,
  dfaSyncFailedFunction,
} from './functions/dfa-sync';

export {
  feasibilityCheckFunction,
  feasibilityCheckCompletedFunction,
  feasibilityCheckFailedFunction,
} from './functions/feasibility-check';

export {
  debitOrdersFunction,
  debitOrdersCompletedFunction,
  debitOrdersFailedFunction,
} from './functions/debit-orders';

export {
  billingDayFunction,
  billingDayCompletedFunction,
  billingDayFailedFunction,
} from './functions/billing-day';

export {
  whatsappBillingNotifications,
  whatsappNotificationsCompleted,
  whatsappNotificationsFailed,
} from './functions/whatsapp-notifications';

export {
  supplierSyncFunction,
  supplierSyncCompletedFunction,
  supplierSyncFailedFunction,
} from './functions/supplier-sync';

export {
  ruijieSyncFunction,
  ruijieSyncCompletedFunction,
} from './functions/ruijie-sync';

export {
  ruijieTunnelCleanupFunction,
} from './functions/ruijie-tunnel-cleanup';

export {
  ruijieTokenRefreshFunction,
  ruijieTokenRefreshFailedFunction,
} from './functions/ruijie-token-refresh';

export {
  ruijieOfflineAlertsFunction,
} from './functions/ruijie-offline-alerts';

export {
  ruijieHealthMonitorFunction,
} from './functions/ruijie-health-monitor';

export {
  mikrotikSyncFunction,
  mikrotikSyncCompletedFunction,
} from './functions/mikrotik-sync';

export {
  paynowReconciliationFunction,
  paynowReconciliationCompletedFunction,
  paynowReconciliationFailedFunction,
} from './functions/paynow-reconciliation';

export {
  marketingDfaLeadMatchFunction,
  marketingDemandThresholdFunction,
} from './functions/marketing-triggers';

export {
  zoneDemographicEnrichmentFunction,
  zoneDemographicEnrichmentCompletedFunction,
  zoneDemographicEnrichmentFailedFunction,
} from './functions/zone-demographic-enrichment';

export {
  osmPoiSyncFunction,
} from './functions/osm-poi-sync';

export {
  salesEngineDailyOrchestrator,
  salesEngineWeeklyReview,
  salesEngineOrchestratorCompleted,
} from './functions/sales-engine-orchestrator';

export {
  invoiceNotificationFunction,
} from './functions/invoice-notification';

export {
  whatsappCampaignReportFunction,
} from './functions/whatsapp-campaign-report';

export {
  zohoDeskTokenRefreshFunction,
  zohoDeskTokenRefreshFailedFunction,
} from './functions/zoho-desk-token-refresh';

// Collect all functions for the serve handler
import {
  competitorScrapeFunction,
  priceAlertFunction,
  scheduledScrapeFunction,
} from './functions/competitor-scrape';

import {
  taranaSyncFunction,
  taranaSyncCompletedFunction,
  taranaSyncFailedFunction,
} from './functions/tarana-sync';

import {
  taranaMetricsCollectionFunction,
} from './functions/tarana-metrics-collection';

import {
  dfaSyncFunction,
  dfaSyncCompletedFunction,
  dfaSyncFailedFunction,
} from './functions/dfa-sync';

import {
  feasibilityCheckFunction,
  feasibilityCheckCompletedFunction,
  feasibilityCheckFailedFunction,
} from './functions/feasibility-check';

import {
  debitOrdersFunction,
  debitOrdersCompletedFunction,
  debitOrdersFailedFunction,
} from './functions/debit-orders';

import {
  billingDayFunction,
  billingDayCompletedFunction,
  billingDayFailedFunction,
} from './functions/billing-day';

import {
  whatsappBillingNotifications,
  whatsappNotificationsCompleted,
  whatsappNotificationsFailed,
} from './functions/whatsapp-notifications';

import {
  supplierSyncFunction,
  supplierSyncCompletedFunction,
  supplierSyncFailedFunction,
} from './functions/supplier-sync';

import {
  ruijieSyncFunction,
  ruijieSyncCompletedFunction,
} from './functions/ruijie-sync';

import {
  ruijieTunnelCleanupFunction,
} from './functions/ruijie-tunnel-cleanup';

import {
  ruijieTokenRefreshFunction,
  ruijieTokenRefreshFailedFunction,
} from './functions/ruijie-token-refresh';

import {
  ruijieOfflineAlertsFunction,
} from './functions/ruijie-offline-alerts';

import {
  ruijieHealthMonitorFunction,
} from './functions/ruijie-health-monitor';

import {
  mikrotikSyncFunction,
  mikrotikSyncCompletedFunction,
} from './functions/mikrotik-sync';

import {
  paynowReconciliationFunction,
  paynowReconciliationCompletedFunction,
  paynowReconciliationFailedFunction,
} from './functions/paynow-reconciliation';

import {
  marketingDfaLeadMatchFunction,
  marketingDemandThresholdFunction,
} from './functions/marketing-triggers';

import {
  zoneDemographicEnrichmentFunction,
  zoneDemographicEnrichmentCompletedFunction,
  zoneDemographicEnrichmentFailedFunction,
} from './functions/zone-demographic-enrichment';

import {
  osmPoiSyncFunction,
} from './functions/osm-poi-sync';

import {
  salesEngineDailyOrchestrator,
  salesEngineWeeklyReview,
  salesEngineOrchestratorCompleted,
} from './functions/sales-engine-orchestrator';

import {
  invoiceNotificationFunction,
} from './functions/invoice-notification';

import {
  whatsappCampaignReportFunction,
} from './functions/whatsapp-campaign-report';

import {
  zohoDeskTokenRefreshFunction,
  zohoDeskTokenRefreshFailedFunction,
} from './functions/zoho-desk-token-refresh';

export const functions = [
  // Competitor analysis
  competitorScrapeFunction,
  priceAlertFunction,
  scheduledScrapeFunction,
  // Tarana sync
  taranaSyncFunction,
  taranaSyncCompletedFunction,
  taranaSyncFailedFunction,
  // Tarana link metrics collection (every 15 min)
  taranaMetricsCollectionFunction,
  // DFA sync
  dfaSyncFunction,
  dfaSyncCompletedFunction,
  dfaSyncFailedFunction,
  // Feasibility checks
  feasibilityCheckFunction,
  feasibilityCheckCompletedFunction,
  feasibilityCheckFailedFunction,
  // Debit orders
  debitOrdersFunction,
  debitOrdersCompletedFunction,
  debitOrdersFailedFunction,
  // Billing day (Pay Now for non-eMandate customers)
  billingDayFunction,
  billingDayCompletedFunction,
  billingDayFailedFunction,
  // WhatsApp billing notifications
  whatsappBillingNotifications,
  whatsappNotificationsCompleted,
  whatsappNotificationsFailed,
  // Supplier product sync (MiRO, Nology, Scoop)
  supplierSyncFunction,
  supplierSyncCompletedFunction,
  supplierSyncFailedFunction,
  // Ruijie Cloud device sync
  ruijieSyncFunction,
  ruijieSyncCompletedFunction,
  // Ruijie tunnel cleanup
  ruijieTunnelCleanupFunction,
  // Ruijie token refresh (weekly, before 30-day expiry)
  ruijieTokenRefreshFunction,
  ruijieTokenRefreshFailedFunction,
  // Ruijie offline device alerts
  ruijieOfflineAlertsFunction,
  // Ruijie health monitoring
  ruijieHealthMonitorFunction,
  // MikroTik router sync
  mikrotikSyncFunction,
  mikrotikSyncCompletedFunction,
  // PayNow daily reconciliation
  paynowReconciliationFunction,
  paynowReconciliationCompletedFunction,
  paynowReconciliationFailedFunction,
  // Marketing campaign triggers
  marketingDfaLeadMatchFunction,
  marketingDemandThresholdFunction,
  // Zone demographic enrichment
  zoneDemographicEnrichmentFunction,
  zoneDemographicEnrichmentCompletedFunction,
  zoneDemographicEnrichmentFailedFunction,
  // OSM POI sync
  osmPoiSyncFunction,
  // Sales engine orchestrator (daily + weekly)
  salesEngineDailyOrchestrator,
  salesEngineWeeklyReview,
  salesEngineOrchestratorCompleted,
  // Invoice notification (email + SMS on 25th generation)
  invoiceNotificationFunction,
  // WhatsApp Lead Campaign daily report (08:00 SAST)
  whatsappCampaignReportFunction,
  // Zoho Desk token refresh (every 45 min, before 1-hour expiry)
  zohoDeskTokenRefreshFunction,
  zohoDeskTokenRefreshFailedFunction,
];
