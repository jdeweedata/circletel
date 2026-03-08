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
  mikrotikSyncFunction,
  mikrotikSyncCompletedFunction,
} from './functions/mikrotik-sync';

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
  mikrotikSyncFunction,
  mikrotikSyncCompletedFunction,
} from './functions/mikrotik-sync';

export const functions = [
  // Competitor analysis
  competitorScrapeFunction,
  priceAlertFunction,
  scheduledScrapeFunction,
  // Tarana sync
  taranaSyncFunction,
  taranaSyncCompletedFunction,
  taranaSyncFailedFunction,
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
  // MikroTik router sync
  mikrotikSyncFunction,
  mikrotikSyncCompletedFunction,
];
