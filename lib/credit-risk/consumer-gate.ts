import { CIRCLECONNECT_5G_CATALOGUE, OP19627_PROMOS } from '@/lib/products/five-g-offer-term';
import { hasHardLegalFlag } from './decision';
import type { CreditDecision, CreditFlags } from './types';

export type ConsumerDealKind = 'credit' | 'skip';
export type HardwarePath = 'included' | 'cash_cpe' | 'byo' | 'none';
export type DualControlRole = 'md' | 'cfo';

export interface DualControlSignoff {
  role: DualControlRole;
  adminId: string;
}

export interface ProcessCreditDealResult {
  ok: boolean;
  unlockTerm: boolean;
  reason?: string;
  fallback?: 'sim_only_or_cash_cpe';
}

const CREDIT_SKUS = new Set(
  [...OP19627_PROMOS, ...CIRCLECONNECT_5G_CATALOGUE]
    .filter((row) => row.kind === 'contract_router')
    .map((row) => row.sku)
);

const SKIP_SKUS = new Set(
  CIRCLECONNECT_5G_CATALOGUE.filter((row) => row.kind === 'mtm_sim').map((row) => row.sku)
);

export function skuFromOrder(order: {
  package_name?: string | null;
  metadata?: unknown;
  service_package_id?: string | null;
}): string | null {
  const meta = order.metadata && typeof order.metadata === 'object' ? (order.metadata as Record<string, unknown>) : {};
  const fromMeta = [meta.sku, meta.package_sku, meta.package_code].find(
    (value) => typeof value === 'string' && value.trim()
  );
  if (typeof fromMeta === 'string') return fromMeta.trim();
  const name = order.package_name || '';
  const skuMatch = name.match(/CC-[A-Z0-9-]+/i);
  return skuMatch ? skuMatch[0].toUpperCase() : null;
}

export function resolveConsumerDealKind(input: {
  sku?: string | null;
  routerIncluded?: boolean;
  contractDuration?: string | null;
  onAccount?: boolean;
  hardwarePath?: HardwarePath;
}): ConsumerDealKind {
  if (input.onAccount) return 'credit';
  if (input.hardwarePath === 'cash_cpe' || input.hardwarePath === 'byo') return 'skip';

  const sku = (input.sku || '').trim();
  if (sku && SKIP_SKUS.has(sku) && !input.routerIncluded) return 'skip';
  if (sku && CREDIT_SKUS.has(sku)) return 'credit';

  const duration = (input.contractDuration || '').toLowerCase();
  if (input.routerIncluded || duration.includes('24')) return 'credit';
  return 'skip';
}

export function shouldPullConsumerCredit(input: {
  dealKind: ConsumerDealKind;
  kycReady: boolean;
  consent: boolean;
}): boolean {
  return input.dealKind === 'credit' && input.kycReady && input.consent;
}

export function canProcessCreditDeal(input: {
  dealKind: ConsumerDealKind;
  review?: { decision?: CreditDecision | null } | null;
  pullTimedOut?: boolean;
}): ProcessCreditDealResult {
  if (input.dealKind === 'skip') {
    return { ok: true, unlockTerm: false };
  }

  const decision = input.review?.decision;
  if (decision === 'PASS' || decision === 'MARGINAL') {
    return { ok: true, unlockTerm: decision === 'PASS' };
  }

  if (input.pullTimedOut) {
    return {
      ok: false,
      unlockTerm: false,
      fallback: 'sim_only_or_cash_cpe',
      reason: 'Credit pull timed out. Stay on SIM-only or cash CPE. Do not unlock term.',
    };
  }

  if (!decision || decision === 'UNCHECKED') {
    return {
      ok: false,
      unlockTerm: false,
      reason: 'Credit Deal cannot process until a credit review exists.',
    };
  }

  return {
    ok: false,
    unlockTerm: false,
    reason: `Credit Deal cannot process while decision is ${decision}.`,
  };
}

export function processCreditDealBlockedReason(input: {
  dealKind: ConsumerDealKind;
  review?: { decision?: CreditDecision | null } | null;
  pullTimedOut?: boolean;
}): string | null {
  const result = canProcessCreditDeal(input);
  return result.ok ? null : result.reason || 'Credit Deal cannot process.';
}

export function validateDualControlOverride(input: {
  actorRole?: string | null;
  signoffs?: DualControlSignoff[] | null;
  reason?: string | null;
  requestedDecision?: CreditDecision | null;
  flags?: CreditFlags;
  hardwarePrepaid?: boolean;
}): { ok: boolean; reason?: string } {
  const actor = (input.actorRole || '').toLowerCase();
  if (actor === 'editor' || actor === 'viewer' || actor === 'product_manager') {
    return { ok: false, reason: 'Sales cannot override a credit decision.' };
  }

  const reason = (input.reason || '').trim();
  if (reason.length < 8) {
    return { ok: false, reason: 'Dual Control Override needs a written reason.' };
  }

  const signoffs = input.signoffs || [];
  const md = signoffs.find((s) => s.role === 'md');
  const cfo = signoffs.find((s) => s.role === 'cfo');
  if (!md || !cfo) {
    return { ok: false, reason: 'MD and CFO must both sign the override.' };
  }
  if (!md.adminId || !cfo.adminId || md.adminId === cfo.adminId) {
    return { ok: false, reason: 'MD and CFO sign-off must be two distinct admins.' };
  }

  if (
    input.requestedDecision === 'PASS' &&
    hasHardLegalFlag(input.flags || {}) &&
    !input.hardwarePrepaid
  ) {
    return {
      ok: false,
      reason: 'Cannot mark PASS while a hard-fail flag is set unless hardware is prepaid.',
    };
  }

  return { ok: true };
}
