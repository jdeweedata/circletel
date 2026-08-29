import { cashCpeSkuFromMetadata, hasCashCpeCheckout } from '@/lib/products/five-g-cash-cpe';
import { HARDWARE_PRODUCTS_TABLE } from '@/lib/tenant';

export type HardwareIndentStatus = 'pending' | 'ordered' | 'cancelled';

export interface HardwareIndentRow {
  id: string;
  consumer_order_id: string;
  hardware_product_id: string | null;
  supplier_sku: string;
  status: HardwareIndentStatus;
}

export type HardwareIndentClient = {
  // Service-role client used only after payment. Shape matches the chained
  // select/insert calls in this module; keep it loose so tests can stub tables.
  from: (table: string) => any;
}

export interface PaidCashCpeOrder {
  id: string;
  payment_status?: string | null;
  router_fee?: number | null;
  router_model?: string | null;
  metadata?: Record<string, unknown> | null;
}

export async function createHardwareIndentForPaidOrder(
  supabase: HardwareIndentClient,
  order: PaidCashCpeOrder
): Promise<{ created: boolean; indent?: HardwareIndentRow; reason?: string }> {
  if (order.payment_status !== 'paid') {
    return { created: false, reason: 'unpaid' };
  }

  if (
    !hasCashCpeCheckout({
      metadata: order.metadata,
      router_sku: cashCpeSkuFromMetadata(order.metadata || undefined),
    }) &&
    !(Number(order.router_fee) > 0)
  ) {
    return { created: false, reason: 'no_cash_cpe' };
  }

  const sku =
    cashCpeSkuFromMetadata(order.metadata || undefined) ||
    (typeof order.metadata?.router_sku === 'string' ? order.metadata.router_sku : null) ||
    'G5C';

  const { data: existing } = await supabase
    .from('hardware_indents')
    .select('*')
    .eq('consumer_order_id', order.id)
    .maybeSingle();

  if (existing && typeof existing === 'object') {
    return { created: false, indent: existing as HardwareIndentRow, reason: 'exists' };
  }

  const { data: product } = await supabase
    .from(HARDWARE_PRODUCTS_TABLE)
    .select('id, metadata')
    .eq('status', 'published')
    .contains('metadata', { cash_cpe: true })
    .maybeSingle();

  const hardwareProductId =
    product && typeof product === 'object' && 'id' in product
      ? String((product as { id: string }).id)
      : null;

  const { data: inserted, error } = await supabase
    .from('hardware_indents')
    .insert({
      consumer_order_id: order.id,
      hardware_product_id: hardwareProductId,
      supplier_sku: sku,
      status: 'pending',
    })
    .select('*')
    .single();

  if (error || !inserted) {
    return { created: false, reason: 'insert_failed' };
  }

  return { created: true, indent: inserted as HardwareIndentRow };
}
