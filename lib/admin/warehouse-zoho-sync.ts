import { inngest } from '@/lib/inngest/client';
import { createClient } from '@/lib/supabase/server';
import { zohoLogger } from '@/lib/logging';
import { toCalendarDate } from '@/lib/admin/unjani-warehouse';
import {
  createZohoInventoryClient,
  type ZohoInventoryClient,
} from '@/lib/integrations/zoho/inventory-api-client';
import {
  applyInboundStockAbsolute,
  applyInboundStockDelta,
  buildInventoryAdjustmentPayload,
  parseInventoryWebhookPayload,
  shouldPushMovement,
  type SyncableMovementType,
} from '@/lib/integrations/zoho/inventory-sync';

type Db = {
  from: (table: string) => any;
};

export async function enqueueZohoWarehousePush(movementId: string): Promise<void> {
  try {
    await inngest.send({
      name: 'warehouse/zoho.push',
      data: { movementId },
    });
  } catch (error) {
    zohoLogger.error('[WarehouseZohoSync] Failed to enqueue push', {
      movementId,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

async function recordSyncEvent(
  db: Db,
  row: {
    direction: 'outbound' | 'inbound';
    sku: string | null;
    qty: number | null;
    zohoId?: string | null;
    movementId?: string | null;
    status: 'success' | 'skipped' | 'failed' | 'exception';
    error?: string | null;
    actor?: string;
  }
) {
  const { error } = await db.from('warehouse_zoho_sync_events').insert({
    direction: row.direction,
    sku: row.sku,
    qty: row.qty,
    zoho_id: row.zohoId ?? null,
    movement_id: row.movementId ?? null,
    status: row.status,
    error: row.error ?? null,
    actor: row.actor ?? 'warehouse-zoho-sync',
  });
  if (error) {
    zohoLogger.error('[WarehouseZohoSync] Failed to record sync event', {
      error: error.message,
    });
  }
}

export async function pushWarehouseMovementToZoho(
  db: Db,
  movementId: string,
  client: ZohoInventoryClient = createZohoInventoryClient()
): Promise<{ status: 'success' | 'skipped' | 'failed'; zohoId?: string; error?: string }> {
  const { data: movement, error } = await db
    .from('warehouse_movements')
    .select('id, sku, qty, movement_type, zoho_adjustment_id')
    .eq('id', movementId)
    .single();
  if (error || !movement) {
    return { status: 'failed', error: error?.message || 'Movement not found' };
  }
  if (movement.zoho_adjustment_id) {
    await recordSyncEvent(db, {
      direction: 'outbound',
      sku: movement.sku,
      qty: movement.qty,
      zohoId: movement.zoho_adjustment_id,
      movementId,
      status: 'skipped',
      error: 'Already pushed',
    });
    return { status: 'skipped', zohoId: movement.zoho_adjustment_id };
  }
  if (!shouldPushMovement(movement.movement_type)) {
    await recordSyncEvent(db, {
      direction: 'outbound',
      sku: movement.sku,
      qty: movement.qty,
      movementId,
      status: 'skipped',
      error: `Local-only movement ${movement.movement_type}`,
    });
    return { status: 'skipped' };
  }

  const { data: skuRow, error: skuError } = await db
    .from('warehouse_skus')
    .select('sku, zoho_item_id')
    .eq('sku', movement.sku)
    .single();
  if (skuError || !skuRow?.zoho_item_id) {
    const message = `No Zoho item mapping for ${movement.sku}`;
    await recordSyncEvent(db, {
      direction: 'outbound',
      sku: movement.sku,
      qty: movement.qty,
      movementId,
      status: 'failed',
      error: message,
    });
    return { status: 'failed', error: message };
  }

  try {
    const payload = buildInventoryAdjustmentPayload({
      movementId: movement.id,
      movementType: movement.movement_type as SyncableMovementType,
      qty: movement.qty,
      itemId: skuRow.zoho_item_id,
      date: toCalendarDate(new Date()),
      locationId: process.env.ZOHO_INVENTORY_LOCATION_ID,
      adjustmentAccountId: process.env.ZOHO_INVENTORY_ADJUSTMENT_ACCOUNT_ID,
    });
    const { adjustmentId } = await client.createInventoryAdjustment(payload);
    const { error: updateError } = await db
      .from('warehouse_movements')
      .update({ zoho_adjustment_id: adjustmentId })
      .eq('id', movement.id);
    if (updateError) throw new Error(updateError.message);

    await recordSyncEvent(db, {
      direction: 'outbound',
      sku: movement.sku,
      qty: movement.qty,
      zohoId: adjustmentId,
      movementId,
      status: 'success',
    });
    return { status: 'success', zohoId: adjustmentId };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await recordSyncEvent(db, {
      direction: 'outbound',
      sku: movement.sku,
      qty: movement.qty,
      movementId,
      status: 'failed',
      error: message,
    });
    return { status: 'failed', error: message };
  }
}

async function resolveMappedSku(
  db: Db,
  parsed: { sku: string | null; itemId: string | null }
): Promise<{ sku: string; zohoItemId: string | null } | null> {
  if (parsed.sku) {
    const { data } = await db
      .from('warehouse_skus')
      .select('sku, zoho_item_id')
      .eq('sku', parsed.sku)
      .maybeSingle();
    if (data) return { sku: data.sku, zohoItemId: data.zoho_item_id };
  }
  if (parsed.itemId) {
    const { data } = await db
      .from('warehouse_skus')
      .select('sku, zoho_item_id')
      .eq('zoho_item_id', parsed.itemId)
      .maybeSingle();
    if (data) return { sku: data.sku, zohoItemId: data.zoho_item_id };
  }
  return null;
}

async function applyInboundResult(
  db: Db,
  sku: string,
  result: ReturnType<typeof applyInboundStockDelta>,
  zohoId: string | null,
  qty: number | null
) {
  if (result.action === 'skip_echo' || result.action === 'skip_unmapped' || result.action === 'noop') {
    await recordSyncEvent(db, {
      direction: 'inbound',
      sku,
      qty,
      zohoId,
      status: 'skipped',
      error: result.action,
    });
    return result;
  }

  const { error } = await db
    .from('warehouse_stock')
    .update({
      qty_on_hand: result.nextOnHand,
      zoho_over_reserved_at: result.overReserved ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq('sku', sku);
  if (error) throw new Error(error.message);

  await recordSyncEvent(db, {
    direction: 'inbound',
    sku,
    qty,
    zohoId,
    status: result.overReserved ? 'exception' : 'success',
    error: result.overReserved ? 'qty_reserved exceeds qty_on_hand' : null,
  });
  return result;
}

export async function applyZohoInventoryWebhook(db: Db, body: unknown) {
  const parsed = parseInventoryWebhookPayload(body);
  const mapped = await resolveMappedSku(db, parsed);
  const stock = mapped
    ? (
        await db
          .from('warehouse_stock')
          .select('qty_on_hand, qty_reserved')
          .eq('sku', mapped.sku)
          .single()
      ).data
    : null;

  const input = {
    reference: parsed.reference,
    skuMapped: Boolean(mapped && stock),
    qtyOnHand: stock?.qty_on_hand ?? 0,
    qtyReserved: stock?.qty_reserved ?? 0,
  };

  const result =
    parsed.quantityAdjusted !== null
      ? applyInboundStockDelta({ ...input, delta: parsed.quantityAdjusted })
      : parsed.stockOnHand !== null
        ? applyInboundStockAbsolute({ ...input, zohoStockOnHand: parsed.stockOnHand })
        : { action: 'skip_unmapped' as const };

  if (!mapped) {
    await recordSyncEvent(db, {
      direction: 'inbound',
      sku: parsed.sku,
      qty: parsed.quantityAdjusted,
      zohoId: parsed.itemId,
      status: 'skipped',
      error: 'skip_unmapped',
    });
    return result;
  }

  return applyInboundResult(
    db,
    mapped.sku,
    result,
    parsed.itemId,
    parsed.quantityAdjusted ?? parsed.stockOnHand
  );
}

export async function pollZohoInventoryStock(
  db: Db,
  client: ZohoInventoryClient = createZohoInventoryClient()
) {
  const { data: skus, error } = await db
    .from('warehouse_skus')
    .select('sku, zoho_item_id')
    .not('zoho_item_id', 'is', null);
  if (error) throw new Error(error.message);

  const results: Array<{ sku: string; action: string }> = [];
  for (const sku of skus ?? []) {
    if (!sku.zoho_item_id) continue;
    const item = await client.getItem(sku.zoho_item_id);
    const { data: stock } = await db
      .from('warehouse_stock')
      .select('qty_on_hand, qty_reserved')
      .eq('sku', sku.sku)
      .single();
    if (!stock) {
      results.push({ sku: sku.sku, action: 'skip_unmapped' });
      continue;
    }
    const result = applyInboundStockAbsolute({
      skuMapped: true,
      qtyOnHand: stock.qty_on_hand,
      qtyReserved: stock.qty_reserved,
      zohoStockOnHand: Number(item.stock_on_hand ?? stock.qty_on_hand),
    });
    await applyInboundResult(db, sku.sku, result, sku.zoho_item_id, item.stock_on_hand ?? null);
    results.push({ sku: sku.sku, action: result.action });
  }
  return results;
}

export async function pushWarehouseMovementById(movementId: string) {
  const supabase = await createClient();
  return pushWarehouseMovementToZoho(supabase, movementId);
}

export async function pollMappedZohoInventoryItems() {
  const supabase = await createClient();
  return pollZohoInventoryStock(supabase);
}
