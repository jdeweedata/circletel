/**
 * Audit active consumer services vs billable consumer_orders.
 *
 * An orphan is an active consumer service whose customer has no
 * consumer_orders row with billing_active = true.
 * (Clinic/corporate services are excluded — they are not consumer.)
 *
 * Usage:
 *   set -a && source .env.local && set +a && \\
 *     npx tsx scripts/billing/audit-consumer-service-order-orphans.ts
 *
 *   # Deactivate one orphan (writes only with --execute):
 *   ... --action=deactivate --service-id=<uuid> --execute
 *
 *   # Mark matching order billing_active (writes only with --execute):
 *   ... --action=link --service-id=<uuid> --order-id=<uuid> --execute
 *
 * Default is dry-run (read-only). Env: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { isClinicBillingCategory } from '../../lib/billing/new-clinic-billing-helper';

type Action = 'audit' | 'deactivate' | 'link';

interface CliArgs {
  action: Action;
  execute: boolean;
  serviceId: string | null;
  orderId: string | null;
  json: boolean;
  force: boolean;
}

interface ServiceRow {
  id: string;
  customer_id: string;
  package_name: string | null;
  monthly_price: number | null;
  status: string | null;
  active: boolean | null;
  product_category: string | null;
  service_type: string | null;
  activation_date: string | null;
  connection_id: string | null;
  last_invoice_date: string | null;
  billing_start_date: string | null;
}

interface OrderRow {
  id: string;
  customer_id: string | null;
  order_number: string | null;
  billing_active: boolean | null;
  status: string | null;
  package_name: string | null;
  package_price: number | null;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  payment_status: string | null;
  activation_date: string | null;
}

interface CustomerRow {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  account_type: string | null;
  account_status: string | null;
}

interface OrphanReport {
  service: ServiceRow;
  customer: CustomerRow | null;
  candidateOrders: OrderRow[];
  suggestedAction: 'link' | 'deactivate' | 'review';
  reason: string;
}

function parseArgs(argv: string[]): CliArgs {
  let action: Action = 'audit';
  let execute = false;
  let serviceId: string | null = null;
  let orderId: string | null = null;
  let json = false;
  let force = false;

  for (const a of argv) {
    if (a === '--execute') execute = true;
    else if (a === '--json') json = true;
    else if (a === '--force') force = true;
    else if (a.startsWith('--action=')) {
      const v = a.slice('--action='.length);
      if (v === 'audit' || v === 'deactivate' || v === 'link') action = v;
      else throw new Error(`Invalid --action=${v} (use audit|deactivate|link)`);
    } else if (a.startsWith('--service-id=')) {
      serviceId = a.slice('--service-id='.length);
    } else if (a.startsWith('--order-id=')) {
      orderId = a.slice('--order-id='.length);
    } else if (a === '--help' || a === '-h') {
      printHelp();
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${a}`);
    }
  }

  return { action, execute, serviceId, orderId, json, force };
}

function printHelp() {
  console.log(`Audit active consumer services without billing_active consumer_orders.

Usage:
  set -a && source .env.local && set +a && npx tsx scripts/billing/audit-consumer-service-order-orphans.ts [options]

Options:
  (default)                 Dry-run audit — print orphans and candidates
  --json                    Emit machine-readable JSON summary
  --action=deactivate       Soft-cancel one orphan service
  --action=link             Set billing_active on a candidate order for the service customer
  --service-id=<uuid>       Target service (required for deactivate/link)
  --order-id=<uuid>         Target order (required for link)
  --execute                 Persist writes (without this, mutations are dry-run only)
  --force                   Allow linking a cancelled order (still requires --execute)
  --help                    Show this help

Consumer filter:
  active=true AND status=active, excluding clinic/corporate product categories
  (and Unjani package names). Matched to consumer_orders.billing_active = true
  on the same customer_id.

Env: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY`);
}

function isConsumerService(s: ServiceRow): boolean {
  if (isClinicBillingCategory(s.product_category)) return false;
  const pkg = (s.package_name ?? '').toLowerCase();
  if (pkg.includes('unjani')) return false;
  return true;
}

function customerLabel(c: CustomerRow | null, fallbackId: string): string {
  if (!c) return fallbackId;
  const name = [c.first_name, c.last_name].filter(Boolean).join(' ').trim();
  return name || c.email || c.id;
}

function createServiceRoleClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Run: set -a && source .env.local && set +a'
    );
    process.exit(1);
  }
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function loadActiveServices(supabase: SupabaseClient): Promise<ServiceRow[]> {
  const { data, error } = await supabase
    .from('customer_services')
    .select(
      'id, customer_id, package_name, monthly_price, status, active, product_category, service_type, activation_date, connection_id, last_invoice_date, billing_start_date'
    )
    .eq('active', true)
    .eq('status', 'active');

  if (error) throw new Error(`customer_services: ${error.message}`);
  return (data ?? []) as ServiceRow[];
}

async function loadOrdersForCustomers(
  supabase: SupabaseClient,
  customerIds: string[]
): Promise<OrderRow[]> {
  if (customerIds.length === 0) return [];
  const all: OrderRow[] = [];
  for (let i = 0; i < customerIds.length; i += 50) {
    const batch = customerIds.slice(i, i + 50);
    const { data, error } = await supabase
      .from('consumer_orders')
      .select(
        'id, customer_id, order_number, billing_active, status, package_name, package_price, email, first_name, last_name, payment_status, activation_date'
      )
      .in('customer_id', batch);
    if (error) throw new Error(`consumer_orders: ${error.message}`);
    all.push(...((data ?? []) as OrderRow[]));
  }
  return all;
}

async function loadCustomers(
  supabase: SupabaseClient,
  customerIds: string[]
): Promise<Map<string, CustomerRow>> {
  const map = new Map<string, CustomerRow>();
  if (customerIds.length === 0) return map;
  for (let i = 0; i < customerIds.length; i += 50) {
    const batch = customerIds.slice(i, i + 50);
    const { data, error } = await supabase
      .from('customers')
      .select('id, first_name, last_name, email, account_type, account_status')
      .in('id', batch);
    if (error) throw new Error(`customers: ${error.message}`);
    for (const c of (data ?? []) as CustomerRow[]) {
      map.set(c.id, c);
    }
  }
  return map;
}

function suggestForOrphan(service: ServiceRow, candidates: OrderRow[]): {
  suggestedAction: OrphanReport['suggestedAction'];
  reason: string;
} {
  const linkable = candidates.filter(
    (o) => o.status !== 'cancelled' && o.billing_active !== true
  );
  if (linkable.length === 1) {
    return {
      suggestedAction: 'link',
      reason: `Single non-cancelled order ${linkable[0].order_number ?? linkable[0].id} (status=${linkable[0].status}) — candidate to set billing_active`,
    };
  }
  if (linkable.length > 1) {
    return {
      suggestedAction: 'review',
      reason: `${linkable.length} non-cancelled orders — pick one with --action=link --order-id=…`,
    };
  }
  if (candidates.length > 0) {
    return {
      suggestedAction: 'deactivate',
      reason: 'Only cancelled/billable-mismatch orders exist — deactivate service if not a live customer',
    };
  }
  return {
    suggestedAction: 'deactivate',
    reason: 'No consumer_orders for this customer — deactivate if service was test/orphan',
  };
}

async function runAudit(supabase: SupabaseClient): Promise<{
  allActive: number;
  consumerActive: number;
  billableOrderCustomers: number;
  matched: number;
  orphans: OrphanReport[];
  reverseGaps: { order: OrderRow; reason: string }[];
}> {
  const allActive = await loadActiveServices(supabase);
  const consumer = allActive.filter(isConsumerService);
  const customerIds = [...new Set(consumer.map((s) => s.customer_id))];
  const [orders, customers] = await Promise.all([
    loadOrdersForCustomers(supabase, customerIds),
    loadCustomers(supabase, customerIds),
  ]);

  const billableByCustomer = new Map<string, OrderRow[]>();
  const allOrdersByCustomer = new Map<string, OrderRow[]>();
  for (const o of orders) {
    if (!o.customer_id) continue;
    const list = allOrdersByCustomer.get(o.customer_id) ?? [];
    list.push(o);
    allOrdersByCustomer.set(o.customer_id, list);
    if (o.billing_active === true) {
      const b = billableByCustomer.get(o.customer_id) ?? [];
      b.push(o);
      billableByCustomer.set(o.customer_id, b);
    }
  }

  const orphans: OrphanReport[] = [];
  let matched = 0;
  for (const service of consumer) {
    const billable = billableByCustomer.get(service.customer_id) ?? [];
    if (billable.length > 0) {
      matched += 1;
      continue;
    }
    const candidates = allOrdersByCustomer.get(service.customer_id) ?? [];
    const { suggestedAction, reason } = suggestForOrphan(service, candidates);
    orphans.push({
      service,
      customer: customers.get(service.customer_id) ?? null,
      candidateOrders: candidates,
      suggestedAction,
      reason,
    });
  }

  // Reverse: billing_active orders whose customer has no active consumer service
  const { data: allBillable, error: baErr } = await supabase
    .from('consumer_orders')
    .select(
      'id, customer_id, order_number, billing_active, status, package_name, package_price, email, first_name, last_name, payment_status, activation_date'
    )
    .eq('billing_active', true);
  if (baErr) throw new Error(`billing_active orders: ${baErr.message}`);

  const consumerCustomerIds = new Set(consumer.map((s) => s.customer_id));
  const reverseGaps: { order: OrderRow; reason: string }[] = [];
  for (const o of (allBillable ?? []) as OrderRow[]) {
    if (!o.customer_id || !consumerCustomerIds.has(o.customer_id)) {
      // Customer may still have an active consumer service we already loaded under another path
      const has = consumer.some((s) => s.customer_id === o.customer_id);
      if (!has) {
        reverseGaps.push({
          order: o,
          reason: 'billing_active order with no active consumer service for customer_id',
        });
      }
    }
  }

  return {
    allActive: allActive.length,
    consumerActive: consumer.length,
    billableOrderCustomers: billableByCustomer.size,
    matched,
    orphans,
    reverseGaps,
  };
}

function printAuditHuman(
  report: Awaited<ReturnType<typeof runAudit>>,
  mode: string
) {
  console.log('=== Consumer service ↔ billable order audit ===');
  console.log(`Mode: ${mode}`);
  console.log(`Active services (all categories): ${report.allActive}`);
  console.log(`Active consumer services:         ${report.consumerActive}`);
  console.log(`Customers with billing_active:    ${report.billableOrderCustomers}`);
  console.log(`Matched (service has billable):   ${report.matched}`);
  console.log(`Orphans:                          ${report.orphans.length}`);
  console.log(`Reverse gaps (billable w/o svc):  ${report.reverseGaps.length}`);
  console.log('');

  if (report.orphans.length === 0) {
    console.log('✅ No unexplained consumer service orphans.');
  } else {
    console.log('--- ORPHANS (active consumer service, no billing_active order) ---');
    for (const o of report.orphans) {
      const s = o.service;
      const label = customerLabel(o.customer, s.customer_id);
      console.log(`\n• service=${s.id}`);
      console.log(`  customer=${s.customer_id} (${label})`);
      console.log(
        `  package=${s.package_name} R${s.monthly_price ?? '?'} type=${s.service_type} cat=${s.product_category ?? 'null'}`
      );
      console.log(
        `  activation=${s.activation_date ?? '—'} last_invoice=${s.last_invoice_date ?? '—'} connection=${s.connection_id ?? '—'}`
      );
      console.log(`  suggested=${o.suggestedAction} — ${o.reason}`);
      if (o.candidateOrders.length === 0) {
        console.log('  candidates: (none)');
      } else {
        console.log('  candidates:');
        for (const c of o.candidateOrders) {
          console.log(
            `    - ${c.order_number ?? c.id} status=${c.status} billing_active=${c.billing_active} payment=${c.payment_status} pkg=${c.package_name} R${c.package_price ?? '?'}`
          );
          console.log(`      order_id=${c.id}`);
        }
      }
      if (o.suggestedAction === 'link' && o.candidateOrders.length > 0) {
        const cand =
          o.candidateOrders.find((c) => c.status !== 'cancelled') ??
          o.candidateOrders[0];
        console.log(
          `  dry-run link: --action=link --service-id=${s.id} --order-id=${cand.id}`
        );
      }
      if (o.suggestedAction === 'deactivate') {
        console.log(`  dry-run deactivate: --action=deactivate --service-id=${s.id}`);
      }
    }
  }

  if (report.reverseGaps.length > 0) {
    console.log('\n--- REVERSE GAPS (informational) ---');
    for (const g of report.reverseGaps) {
      const o = g.order;
      console.log(
        `• ${o.order_number ?? o.id} customer=${o.customer_id} status=${o.status} — ${g.reason}`
      );
    }
  }

  console.log('\nWrites require --execute. Prefer ops sign-off before mutating production.');
}

async function deactivateService(
  supabase: SupabaseClient,
  serviceId: string,
  execute: boolean
): Promise<void> {
  const { data: service, error } = await supabase
    .from('customer_services')
    .select(
      'id, customer_id, package_name, monthly_price, status, active, product_category, service_type, activation_date, connection_id, last_invoice_date, billing_start_date'
    )
    .eq('id', serviceId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!service) throw new Error(`Service not found: ${serviceId}`);

  const row = service as ServiceRow;
  if (!isConsumerService(row)) {
    throw new Error(
      `Service ${serviceId} is not classified as consumer (category=${row.product_category}). Refusing.`
    );
  }
  if (row.status !== 'active' || row.active !== true) {
    console.log(`Service already inactive: status=${row.status} active=${row.active}`);
    return;
  }

  const now = new Date().toISOString();
  const patch = {
    status: 'cancelled',
    active: false,
    cancelled_at: now,
    updated_at: now,
  };

  console.log(`Would deactivate service ${serviceId}:`, patch);
  if (!execute) {
    console.log('DRY-RUN — no write. Re-run with --execute to apply.');
    return;
  }

  const { error: upErr } = await supabase
    .from('customer_services')
    .update(patch)
    .eq('id', serviceId)
    .eq('status', 'active')
    .eq('active', true);

  if (upErr) throw new Error(`deactivate failed: ${upErr.message}`);
  console.log(`✅ Deactivated service ${serviceId}`);
}

async function linkOrder(
  supabase: SupabaseClient,
  serviceId: string,
  orderId: string,
  execute: boolean,
  force: boolean
): Promise<void> {
  const { data: service, error: sErr } = await supabase
    .from('customer_services')
    .select(
      'id, customer_id, package_name, monthly_price, status, active, product_category, service_type, activation_date, connection_id, last_invoice_date, billing_start_date'
    )
    .eq('id', serviceId)
    .maybeSingle();
  if (sErr) throw new Error(sErr.message);
  if (!service) throw new Error(`Service not found: ${serviceId}`);
  const row = service as ServiceRow;

  if (!isConsumerService(row)) {
    throw new Error(
      `Service ${serviceId} is not classified as consumer (category=${row.product_category}). Refusing.`
    );
  }
  if (row.status !== 'active' || row.active !== true) {
    throw new Error(`Service ${serviceId} is not active (status=${row.status}, active=${row.active})`);
  }

  const { data: order, error: oErr } = await supabase
    .from('consumer_orders')
    .select(
      'id, customer_id, order_number, billing_active, status, package_name, package_price, email, first_name, last_name, payment_status, activation_date'
    )
    .eq('id', orderId)
    .maybeSingle();
  if (oErr) throw new Error(oErr.message);
  if (!order) throw new Error(`Order not found: ${orderId}`);
  const ord = order as OrderRow;

  if (ord.customer_id !== row.customer_id) {
    throw new Error(
      `Order customer_id ${ord.customer_id} does not match service customer_id ${row.customer_id}`
    );
  }
  if (ord.billing_active === true) {
    console.log(`Order ${ord.order_number ?? ord.id} already billing_active=true — nothing to do.`);
    return;
  }
  if (ord.status === 'cancelled' && !force) {
    throw new Error(
      `Order ${ord.order_number ?? ord.id} is cancelled. Pass --force if you really intend to reactivate billing on it.`
    );
  }

  const now = new Date().toISOString();
  const patch: Record<string, unknown> = {
    billing_active: true,
    billing_activated_at: now,
    updated_at: now,
  };
  // Only lift non-cancelled orders to active when linking for billing
  if (ord.status !== 'active' && ord.status !== 'cancelled') {
    patch.status = 'active';
  }

  console.log(
    `Would link service ${serviceId} → order ${ord.order_number ?? ord.id} (${orderId}):`,
    patch
  );
  if (!execute) {
    console.log('DRY-RUN — no write. Re-run with --execute to apply.');
    return;
  }

  const { error: upErr } = await supabase
    .from('consumer_orders')
    .update(patch)
    .eq('id', orderId)
    .eq('billing_active', false);
  if (upErr) throw new Error(`link failed: ${upErr.message}`);
  console.log(
    `✅ Linked: set billing_active on ${ord.order_number ?? orderId} for service ${serviceId}`
  );
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const supabase = createServiceRoleClient();
  const mode = args.execute ? 'EXECUTE (writes enabled)' : 'DRY-RUN (read-only)';

  if (args.action === 'audit') {
    const report = await runAudit(supabase);
    if (args.json) {
      process.stdout.write(
        JSON.stringify(
          {
            mode: args.execute ? 'execute' : 'dry-run',
            summary: {
              allActive: report.allActive,
              consumerActive: report.consumerActive,
              billableOrderCustomers: report.billableOrderCustomers,
              matched: report.matched,
              orphanCount: report.orphans.length,
              reverseGapCount: report.reverseGaps.length,
            },
            orphans: report.orphans.map((o) => ({
              serviceId: o.service.id,
              customerId: o.service.customer_id,
              customer: customerLabel(o.customer, o.service.customer_id),
              packageName: o.service.package_name,
              monthlyPrice: o.service.monthly_price,
              productCategory: o.service.product_category,
              serviceType: o.service.service_type,
              activationDate: o.service.activation_date,
              lastInvoiceDate: o.service.last_invoice_date,
              suggestedAction: o.suggestedAction,
              reason: o.reason,
              candidateOrders: o.candidateOrders.map((c) => ({
                id: c.id,
                orderNumber: c.order_number,
                status: c.status,
                billingActive: c.billing_active,
                paymentStatus: c.payment_status,
                packageName: c.package_name,
              })),
            })),
            reverseGaps: report.reverseGaps.map((g) => ({
              orderId: g.order.id,
              orderNumber: g.order.order_number,
              customerId: g.order.customer_id,
              reason: g.reason,
            })),
          },
          null,
          2
        ) + '\n'
      );
    } else {
      printAuditHuman(report, mode);
    }
    if (report.orphans.length > 0) process.exitCode = 1;
    return;
  }

  if (args.action === 'deactivate') {
    if (!args.serviceId) {
      throw new Error('--action=deactivate requires --service-id=<uuid>');
    }
    console.log(`Mode: ${mode}`);
    await deactivateService(supabase, args.serviceId, args.execute);
    console.log('\nRe-run audit (no flags) to verify orphan count.');
    return;
  }

  if (args.action === 'link') {
    if (!args.serviceId || !args.orderId) {
      throw new Error('--action=link requires --service-id=<uuid> and --order-id=<uuid>');
    }
    console.log(`Mode: ${mode}`);
    await linkOrder(supabase, args.serviceId, args.orderId, args.execute, args.force);
    console.log('\nRe-run audit (no flags) to verify orphan count.');
    return;
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(2);
});
