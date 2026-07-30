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
