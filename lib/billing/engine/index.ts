/**
 * Billing engine public API.
 * @see docs/architecture/BILLING_ENGINE.md
 */

export { billingEngine } from './billing-engine';
export {
  assertTransition,
  canTransition,
  TRANSITION_TABLE,
} from './state-machine';
export type { InvoiceDbStatus } from './state-machine';
export type { EngineAuditContext, InvoiceType } from './types';
// Re-export option types for cron/admin callers
export type { MonthlyBillingOptions, MonthlyBillingResult } from '@/lib/billing/monthly-invoice-generator';
// Simulation (pure domain — tests / dry tools)
export {
  createScenario,
  createInvoice,
  issueInvoice,
  applyPaymentIncrement,
  recordCollectionFailure,
  applyCredit,
  computeAr,
  assertArInvariant,
  outstandingFor,
  resetSimIds,
} from './simulation/run-month';
export type {
  MonthScenario,
  SimInvoice,
  SimEvent,
  ArSnapshot,
  SimInvoiceType,
} from './simulation/scenario';
