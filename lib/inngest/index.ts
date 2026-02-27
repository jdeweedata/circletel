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
];
