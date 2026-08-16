import { clinicKey } from '@/lib/portal/coverage-summary';
import {
  UNJANI_CONNECT_KIT,
  canPlaceInstallOrder,
  canReserveKit,
  fulfilWindow,
  replenishmentDue,
  type WarehouseStockLine,
} from '@/lib/admin/unjani-warehouse';

type Db = {
  from: (table: string) => any;
};

export interface PlaceInstallOrderInput {
  organisationId: string;
  coverageCheckId: string;
  clinicName: string;
  address: string;
  contactName?: string;
  contactMobile?: string;
  contactEmail?: string;
  notes?: string;
  createdBy?: string;
}

async function loadStock(db: Db): Promise<WarehouseStockLine[]> {
  const { data, error } = await db
    .from('warehouse_stock')
    .select('sku, qty_on_hand, qty_reserved');
  if (error) throw new Error(error.message);
  return (data ?? []).map((row: { sku: string; qty_on_hand: number; qty_reserved: number }) => ({
    sku: row.sku,
    qtyOnHand: row.qty_on_hand,
    qtyReserved: row.qty_reserved,
  }));
}

async function reserveKit(db: Db, orderId: string, createdBy?: string) {
  for (const line of UNJANI_CONNECT_KIT) {
    const { data: stock, error } = await db
      .from('warehouse_stock')
      .select('qty_on_hand, qty_reserved')
      .eq('sku', line.sku)
      .single();
    if (error || !stock) throw new Error(`Warehouse stock missing for ${line.sku}`);
    const { error: updateError } = await db
      .from('warehouse_stock')
      .update({
        qty_reserved: stock.qty_reserved + line.qty,
        updated_at: new Date().toISOString(),
      })
      .eq('sku', line.sku);
    if (updateError) throw new Error(updateError.message);
    const { error: moveError } = await db.from('warehouse_movements').insert({
      sku: line.sku,
      movement_type: 'reserve',
      qty: line.qty,
      install_order_id: orderId,
      created_by: createdBy ?? null,
    });
    if (moveError) throw new Error(moveError.message);
  }
}

async function raiseReplenishments(db: Db, orderId: string, orderedAt: Date, createdBy?: string) {
  const stock = await loadStock(db);
  const dueAt = replenishmentDue(orderedAt);
  for (const line of UNJANI_CONNECT_KIT) {
    const row = stock.find((item) => item.sku === line.sku);
    const available = row ? Math.max(0, row.qtyOnHand - row.qtyReserved) : 0;
    const qty = Math.max(line.qty - available, line.qty);
    const { error } = await db.from('warehouse_replenishments').insert({
      sku: line.sku,
      qty,
      ordered_at: orderedAt.toISOString(),
      due_at: dueAt,
      install_order_id: orderId,
    });
    if (error) throw new Error(error.message);
  }
  void createdBy;
}

export async function receiveReplenishmentsForOrder(db: Db, orderId: string, createdBy?: string) {
  const { data: rows, error } = await db
    .from('warehouse_replenishments')
    .select('id, sku, qty, received_at')
    .eq('install_order_id', orderId)
    .is('received_at', null);
  if (error) throw new Error(error.message);

  for (const row of rows ?? []) {
    const { data: stock, error: stockError } = await db
      .from('warehouse_stock')
      .select('qty_on_hand, qty_reserved')
      .eq('sku', row.sku)
      .single();
    if (stockError || !stock) throw new Error(`Warehouse stock missing for ${row.sku}`);
    const { error: updateError } = await db
      .from('warehouse_stock')
      .update({
        qty_on_hand: stock.qty_on_hand + row.qty,
        updated_at: new Date().toISOString(),
      })
      .eq('sku', row.sku);
    if (updateError) throw new Error(updateError.message);
    const { error: recvError } = await db
      .from('warehouse_replenishments')
      .update({ received_at: new Date().toISOString() })
      .eq('id', row.id);
    if (recvError) throw new Error(recvError.message);
    const { error: moveError } = await db.from('warehouse_movements').insert({
      sku: row.sku,
      movement_type: 'receive',
      qty: row.qty,
      install_order_id: orderId,
      replenishment_id: row.id,
      created_by: createdBy ?? null,
    });
    if (moveError) throw new Error(moveError.message);
  }

  return tryReserveOpenOrder(db, orderId, createdBy);
}

export async function tryReserveOpenOrder(db: Db, orderId: string, createdBy?: string) {
  const { data: order, error } = await db
    .from('unjani_install_orders')
    .select('id, stock_status, status')
    .eq('id', orderId)
    .single();
  if (error || !order) throw new Error(error?.message || 'Install order not found');
  if (order.stock_status === 'reserved') return order;

  const stock = await loadStock(db);
  if (!canReserveKit(stock)) return order;

  await reserveKit(db, orderId, createdBy);
  const { data: updated, error: updateError } = await db
    .from('unjani_install_orders')
    .update({ stock_status: 'reserved', updated_at: new Date().toISOString() })
    .eq('id', orderId)
    .select()
    .single();
  if (updateError) throw new Error(updateError.message);
  return updated;
}

export async function issueKitForOrder(db: Db, orderId: string, createdBy?: string) {
  const { data: order, error } = await db
    .from('unjani_install_orders')
    .select('id, stock_status, kit_issued_at')
    .eq('id', orderId)
    .single();
  if (error || !order) throw new Error(error?.message || 'Install order not found');
  if (order.stock_status !== 'reserved') {
    throw new Error('Cannot issue a kit that is not reserved');
  }
  if (order.kit_issued_at) return order;

  for (const line of UNJANI_CONNECT_KIT) {
    const { data: stock, error: stockError } = await db
      .from('warehouse_stock')
      .select('qty_on_hand, qty_reserved')
      .eq('sku', line.sku)
      .single();
    if (stockError || !stock) throw new Error(`Warehouse stock missing for ${line.sku}`);
    const { error: updateError } = await db
      .from('warehouse_stock')
      .update({
        qty_on_hand: Math.max(0, stock.qty_on_hand - line.qty),
        qty_reserved: Math.max(0, stock.qty_reserved - line.qty),
        updated_at: new Date().toISOString(),
      })
      .eq('sku', line.sku);
    if (updateError) throw new Error(updateError.message);
    const { error: moveError } = await db.from('warehouse_movements').insert({
      sku: line.sku,
      movement_type: 'issue',
      qty: line.qty,
      install_order_id: orderId,
      created_by: createdBy ?? null,
    });
    if (moveError) throw new Error(moveError.message);
  }

  const { data: updated, error: updateError } = await db
    .from('unjani_install_orders')
    .update({
      kit_issued_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId)
    .select()
    .single();
  if (updateError) throw new Error(updateError.message);
  return updated;
}

export async function placeUnjaniInstallOrder(db: Db, input: PlaceInstallOrderInput) {
  const { data: check, error: checkError } = await db
    .from('b2b_coverage_checks')
    .select('id, organisation_id, clinic_name, address, latitude, longitude, results')
    .eq('id', input.coverageCheckId)
    .single();
  if (checkError || !check) throw new Error('Coverage check not found');
  if (check.organisation_id !== input.organisationId) {
    throw new Error('Coverage check does not belong to Unjani');
  }
  if (!canPlaceInstallOrder(check.results)) {
    throw new Error('Place an install order only when coverage is confirmed');
  }

  const { data: existing } = await db
    .from('unjani_install_orders')
    .select('*')
    .eq('coverage_check_id', input.coverageCheckId)
    .in('status', ['open', 'scheduled', 'in_progress'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (existing) return { order: existing, created: false };

  const key = clinicKey(input.clinicName || check.clinic_name);
  const [{ data: customers }, { data: sites }] = await Promise.all([
    db.from('customers').select('id, business_name, corporate_site_id'),
    db.from('corporate_sites').select('id, site_name').eq('corporate_id', input.organisationId),
  ]);
  const customer = (customers ?? []).find(
    (row: { business_name?: string | null }) => clinicKey(row.business_name) === key
  );
  const site =
    (sites ?? []).find((row: { site_name?: string | null }) => clinicKey(row.site_name) === key) ??
    (customer?.corporate_site_id
      ? { id: customer.corporate_site_id, site_name: input.clinicName }
      : null);

  const orderedAt = new Date();
  const window = fulfilWindow(orderedAt);
  const stock = await loadStock(db);
  const reserved = canReserveKit(stock);

  const { data: order, error: insertError } = await db
    .from('unjani_install_orders')
    .insert({
      coverage_check_id: check.id,
      organisation_id: input.organisationId,
      clinic_name: input.clinicName || check.clinic_name,
      address: input.address || check.address,
      latitude: check.latitude,
      longitude: check.longitude,
      customer_id: customer?.id ?? null,
      corporate_site_id: site?.id ?? customer?.corporate_site_id ?? null,
      contact_name: input.contactName || null,
      contact_phone: input.contactMobile || null,
      contact_email: input.contactEmail || null,
      notes: input.notes || null,
      ordered_at: orderedAt.toISOString(),
      fulfil_by_min: window.fulfilByMin,
      fulfil_by_max: window.fulfilByMax,
      stock_status: reserved ? 'reserved' : 'on_order',
      status: 'open',
      created_by: input.createdBy ?? null,
    })
    .select()
    .single();
  if (insertError || !order) throw new Error(insertError?.message || 'Failed to create install order');

  if (reserved) {
    await reserveKit(db, order.id, input.createdBy);
  } else {
    await raiseReplenishments(db, order.id, orderedAt, input.createdBy);
  }

  const { data: fresh } = await db.from('unjani_install_orders').select('*').eq('id', order.id).single();
  return { order: fresh ?? order, created: true };
}
