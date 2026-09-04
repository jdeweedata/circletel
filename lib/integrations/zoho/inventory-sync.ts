export const ZOHO_MOVEMENT_REF_PREFIX = 'CT-WH-';

export type SyncableMovementType = 'receive' | 'issue';

export type InboundApplyResult =
  | { action: 'skip_echo' }
  | { action: 'skip_unmapped' }
  | { action: 'noop' }
  | {
      action: 'applied';
      nextOnHand: number;
      reserved: number;
      overReserved: boolean;
    };

export interface InventoryAdjustmentPayload {
  date: string;
  reason: string;
  adjustment_type: 'quantity';
  reference_number: string;
  line_items: Array<{
    item_id: string;
    quantity_adjusted: number;
    location_id?: string;
    adjustment_account_id?: string;
  }>;
}

export interface ParsedInventoryWebhook {
  reference: string | null;
  sku: string | null;
  itemId: string | null;
  quantityAdjusted: number | null;
  stockOnHand: number | null;
}

export function movementReference(movementId: string): string {
  return `${ZOHO_MOVEMENT_REF_PREFIX}${movementId}`;
}

export function isEchoReference(reference: string | null | undefined): boolean {
  return Boolean(reference && reference.startsWith(ZOHO_MOVEMENT_REF_PREFIX));
}

export function shouldPushMovement(type: string): type is SyncableMovementType {
  return type === 'receive' || type === 'issue';
}

export function adjustmentQuantity(type: SyncableMovementType, qty: number): number {
  const abs = Math.abs(qty);
  return type === 'issue' ? -abs : abs;
}

export function buildInventoryAdjustmentPayload(input: {
  movementId: string;
  movementType: SyncableMovementType;
  qty: number;
  itemId: string;
  date: string;
  locationId?: string;
  adjustmentAccountId?: string;
}): InventoryAdjustmentPayload {
  const line: InventoryAdjustmentPayload['line_items'][number] = {
    item_id: input.itemId,
    quantity_adjusted: adjustmentQuantity(input.movementType, input.qty),
  };
  if (input.locationId) line.location_id = input.locationId;
  if (input.adjustmentAccountId) line.adjustment_account_id = input.adjustmentAccountId;

  return {
    date: input.date,
    reason: input.movementType === 'issue' ? 'Warehouse issue' : 'Warehouse receive',
    adjustment_type: 'quantity',
    reference_number: movementReference(input.movementId),
    line_items: [line],
  };
}

function inboundBase(input: {
  reference?: string | null;
  skuMapped: boolean;
}): InboundApplyResult | null {
  if (isEchoReference(input.reference)) return { action: 'skip_echo' };
  if (!input.skuMapped) return { action: 'skip_unmapped' };
  return null;
}

function applied(nextOnHand: number, reserved: number): InboundApplyResult {
  return {
    action: 'applied',
    nextOnHand: Math.max(0, nextOnHand),
    reserved,
    overReserved: reserved > Math.max(0, nextOnHand),
  };
}

export function applyInboundStockDelta(input: {
  reference?: string | null;
  skuMapped: boolean;
  qtyOnHand: number;
  qtyReserved: number;
  delta: number;
}): InboundApplyResult {
  const blocked = inboundBase(input);
  if (blocked) return blocked;
  if (input.delta === 0) return { action: 'noop' };
  return applied(input.qtyOnHand + input.delta, input.qtyReserved);
}

export function applyInboundStockAbsolute(input: {
  reference?: string | null;
  skuMapped: boolean;
  qtyOnHand: number;
  qtyReserved: number;
  zohoStockOnHand: number;
}): InboundApplyResult {
  const blocked = inboundBase(input);
  if (blocked) return blocked;
  if (input.qtyOnHand === input.zohoStockOnHand) return { action: 'noop' };
  return applied(input.zohoStockOnHand, input.qtyReserved);
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function asString(value: unknown): string | null {
  if (typeof value === 'string' && value.trim()) return value.trim();
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return null;
}

function asNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() && Number.isFinite(Number(value))) {
    return Number(value);
  }
  return null;
}

export function parseInventoryWebhookPayload(body: unknown): ParsedInventoryWebhook {
  const root = asRecord(body) ?? {};
  const adjustment = asRecord(root.inventory_adjustment) ?? asRecord(root.inventoryadjustment);
  const item = asRecord(root.item);
  const lineItems = Array.isArray(adjustment?.line_items) ? adjustment.line_items : [];
  const firstLine = asRecord(lineItems[0]);

  return {
    reference:
      asString(adjustment?.reference_number) ??
      asString(root.reference_number) ??
      null,
    sku:
      asString(firstLine?.sku) ??
      asString(item?.sku) ??
      asString(root.sku) ??
      null,
    itemId:
      asString(firstLine?.item_id) ??
      asString(item?.item_id) ??
      asString(root.item_id) ??
      null,
    quantityAdjusted:
      asNumber(firstLine?.quantity_adjusted) ??
      asNumber(root.quantity_adjusted) ??
      null,
    stockOnHand:
      asNumber(item?.stock_on_hand) ??
      asNumber(root.stock_on_hand) ??
      null,
  };
}
