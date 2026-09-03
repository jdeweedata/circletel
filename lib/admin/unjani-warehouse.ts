import { addBusinessDays } from '@/lib/dates/business-days';
import { isVisitWindowBlocked } from '@/lib/admin/unjani-operator-actions';
import { recommendedAccess, type CoverageCheckResults } from '@/lib/portal/coverage-summary';
import type { StageKey } from '@/lib/portal/onboarding-stage';

export const UNJANI_KIT_ROUTER_SKU = 'UNJ-KIT-ROUTER';
export const UNJANI_KIT_AP_SKU = 'UNJ-KIT-AP';

export const UNJANI_CONNECT_KIT: Array<{ sku: string; name: string; qty: number }> = [
  { sku: UNJANI_KIT_ROUTER_SKU, name: 'Unjani Connect router', qty: 1 },
  { sku: UNJANI_KIT_AP_SKU, name: 'Unjani Connect Wi-Fi access point', qty: 1 },
];

export const STOCK_ORDER_BUSINESS_DAYS = 5;
export const FULFIL_MIN_BUSINESS_DAYS = 14;
export const FULFIL_MAX_BUSINESS_DAYS = 21;

export type InstallStockStatus = 'checking' | 'reserved' | 'on_order';

export interface WarehouseStockLine {
  sku: string;
  qtyOnHand: number;
  qtyReserved: number;
}

export function toCalendarDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseCalendarDate(iso: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  if (!match) throw new Error(`Invalid calendar date: ${iso}`);
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 12, 0, 0);
}

export function availableQty(qtyOnHand: number, qtyReserved: number): number {
  return Math.max(0, qtyOnHand - qtyReserved);
}

export function canReserveKit(
  stock: WarehouseStockLine[],
  kit: Array<{ sku: string; qty: number }> = UNJANI_CONNECT_KIT
): boolean {
  return kit.every((line) => {
    const row = stock.find((item) => item.sku === line.sku);
    if (!row) return false;
    return availableQty(row.qtyOnHand, row.qtyReserved) >= line.qty;
  });
}

export function canPlaceInstallOrder(results: CoverageCheckResults | null | undefined): boolean {
  return recommendedAccess(results) !== 'none';
}

const INSTALL_ORDER_STAGES: ReadonlySet<StageKey> = new Set([
  'details_confirmed',
  'changes_requested',
  'visit_booked',
  'installing',
]);

/** Coverage feasible and Unjani NPC has confirmed clinic details (not live). */
export function canProcessInstallOrder(input: {
  results: CoverageCheckResults | null | undefined;
  stage: StageKey | null | undefined;
}): boolean {
  if (!canPlaceInstallOrder(input.results)) return false;
  if (!input.stage) return false;
  return INSTALL_ORDER_STAGES.has(input.stage);
}

export type AdminInstallOrderPrompt = 'process' | 'await_npc' | 'no_coverage' | 'live';

export function adminInstallOrderPrompt(input: {
  results: CoverageCheckResults | null | undefined;
  stage: StageKey | null | undefined;
}): AdminInstallOrderPrompt {
  if (input.stage === 'live') return 'live';
  if (!canPlaceInstallOrder(input.results)) return 'no_coverage';
  if (!canProcessInstallOrder(input)) return 'await_npc';
  return 'process';
}

export function replenishmentDue(orderedAt: Date): string {
  return toCalendarDate(addBusinessDays(orderedAt, STOCK_ORDER_BUSINESS_DAYS));
}

export function fulfilWindow(orderedAt: Date): { fulfilByMin: string; fulfilByMax: string } {
  return {
    fulfilByMin: toCalendarDate(addBusinessDays(orderedAt, FULFIL_MIN_BUSINESS_DAYS)),
    fulfilByMax: toCalendarDate(addBusinessDays(orderedAt, FULFIL_MAX_BUSINESS_DAYS)),
  };
}

export function assertScheduleAllowed(input: {
  stockStatus: InstallStockStatus | string;
  visitDate: string;
  fulfilByMax: string;
}): true {
  if (input.stockStatus !== 'reserved') {
    throw new Error('Booking is blocked until the Unjani Connect kit is reserved');
  }
  if (isVisitWindowBlocked(input.visitDate)) {
    throw new Error('Installation visits must avoid the 25th to the 7th');
  }
  if (input.visitDate > input.fulfilByMax) {
    throw new Error('Visit date must fall within the 21 business days fulfil window');
  }
  return true;
}
