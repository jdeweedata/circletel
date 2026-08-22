/**
 * Assemble cycle-match workbench + RA payloads from the latest ready run.
 */

import { createClient } from '@/lib/supabase/server';
import { buildFunnel } from './build-funnel';
import {
  customerDisplayName,
  cycleMonthEndDate,
  includeInCycleMatch,
} from './include-service';
import { monthBounds, parseYearMonth } from './period';
import { runCycleMatch } from './run-cycle-match';
import type { CycleFunnel, CycleMatchPairwise, FieldDiffRow, LeakType, RecommendedAction, ScoredCycleMatch, ServiceStatus } from './types';

export interface CycleMatchRunSummary {
  id: string;
  status: string;
  periodMonth: string;
  startedAt: string;
  finishedAt: string | null;
  servicesChecked: number;
}

export interface CycleWorklistRow {
  matchId: string;
  exceptionId: string | null;
  displayCode: string | null;
  serviceId: string;
  serviceDisplayId: string;
  customerId: string;
  customerName: string;
  packageName: string;
  fno: string | null;
  matchState: string;
  leakType: LeakType | null;
  leakLabel: string | null;
  platformExVat: number;
  platformInclVat: number;
  zohoExVat: number | null;
  zohoInclVat: number | null;
  zohoInvoiceNumber: string | null;
  netcashAmount: number | null;
  netcashRef: string | null;
  signedVariance: number;
  recommendedAction: RecommendedAction;
  actionLabel: string;
}

export interface ThreeSourcePanel {
  exceptionId: string | null;
  displayCode: string | null;
  customerName: string;
  serviceDisplayId: string;
  packageName: string;
  matchState: string;
  legsMatched: number;
  pairwise: CycleMatchPairwise;
  platform: {
    recordId: string;
    status: string;
    amountExVat: number;
    amountInclVat: number;
  };
  zoho: {
    invoiceNumber: string | null;
    booksId: string | null;
    amountExVat: number | null;
    amountInclVat: number | null;
    status: string;
  };
  netcash: {
    ref: string | null;
    amount: number | null;
    status: string;
  };
  diagnosis: string;
  recommendedAction: RecommendedAction;
}

export interface CycleMatchKpis {
  matched3Count: number;
  matched3Amount: number;
  matched3Pct: number;
  matched2Count: number;
  matched2Amount: number;
  unmatchedCount: number;
  unmatchedAmount: number;
  netVariance: number;
  openExceptions: number;
  oldestOpenDays: number | null;
}

export interface CycleMatchWorkbench {
  month: string;
  monthLabel: string;
  run: CycleMatchRunSummary | null;
  kpis: CycleMatchKpis;
  tabs: Record<string, number>;
  selected: ThreeSourcePanel | null;
  worklist: CycleWorklistRow[];
}

export interface RevenueAssurancePayload {
  month: string;
  monthLabel: string;
  run: CycleMatchRunSummary | null;
  funnel: CycleFunnel;
  kpis: {
    activeServices: number;
    contractedValue: number;
    billedAndCollectedPct: number;
    billedCount: number;
    leakage: number;
    leakServiceCount: number;
    recoveredYtd: number;
    recoveredCount: number;
  };
  worklist: CycleWorklistRow[];
}

interface MatchRow {
  id: string;
  run_id: string;
  service_id: string;
  customer_id: string;
  platform_amount_ex_vat: number | null;
  platform_amount_incl_vat: number | null;
  zoho_amount_ex_vat: number | null;
  zoho_amount_incl_vat: number | null;
  netcash_amount: number | null;
  platform_record_id: string | null;
  zoho_invoice_id: string | null;
  zoho_invoice_number: string | null;
  zoho_books_invoice_id: string | null;
  netcash_ref: string | null;
  match_state: string;
  pairwise: CycleMatchPairwise;
  variance: number;
  leak_type: LeakType | null;
  exposure: number;
  recommended_action: string | null;
  diagnosis: string | null;
  pattern_key: string | null;
  field_diff: FieldDiffRow[];
}

interface ExceptionRow {
  id: string;
  display_code: string;
  match_id: string;
  service_id: string;
  status: string;
  resolved_at: string | null;
  leak_type: LeakType | null;
  pattern_key: string | null;
  diagnosis: string;
  variance: number;
  recoverable: number;
  cycles_affected: number;
  field_diff: FieldDiffRow[];
  audit_events: unknown[];
  created_at: string;
}

const ACTION_LABEL: Record<RecommendedAction, string> = {
  create_invoice: 'Create invoice',
  credit_note: 'Credit note',
  debit_note: 'Raise debit note',
  request_mandate: 'Request mandate',
  open_exception: 'Open exception',
  none: '—',
};

const LEAK_LABEL: Record<LeakType, string> = {
  never_invoiced: 'Never invoiced',
  under_contract: 'Under contract price',
  promo_expired: 'Promo expired',
  cancelled_still_billing: 'Cancelled, still billed',
};

function customerName(row: {
  first_name?: string | null;
  last_name?: string | null;
  business_name?: string | null;
}): string {
  const business = row.business_name?.trim();
  if (business) return business;
  return [row.first_name, row.last_name].filter(Boolean).join(' ').trim() || 'Unknown customer';
}

function actionLabel(action: string | null): { action: RecommendedAction; label: string } {
  const key = (action || 'none') as RecommendedAction;
  return { action: key, label: ACTION_LABEL[key] || ACTION_LABEL.none };
}

export async function ensureLatestRun(yearMonth: string): Promise<CycleMatchRunSummary | null> {
  const supabase = await createClient();
  const { periodMonth } = monthBounds(yearMonth);

  const { data: existing } = await supabase
    .from('cycle_match_runs')
    .select('id, status, period_month, started_at, finished_at, services_checked')
    .eq('period_month', periodMonth)
    .eq('status', 'ready')
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing) {
    return {
      id: existing.id,
      status: existing.status,
      periodMonth: existing.period_month,
      startedAt: existing.started_at,
      finishedAt: existing.finished_at,
      servicesChecked: existing.services_checked,
    };
  }

  const result = await runCycleMatch({ yearMonth, triggeredBy: 'manual' });
  const { data: created } = await supabase
    .from('cycle_match_runs')
    .select('id, status, period_month, started_at, finished_at, services_checked')
    .eq('id', result.runId)
    .single();
  if (!created) return null;
  return {
    id: created.id,
    status: created.status,
    periodMonth: created.period_month,
    startedAt: created.started_at,
    finishedAt: created.finished_at,
    servicesChecked: created.services_checked,
  };
}

interface HydratedService {
  id: string;
  package_name: string;
  provider_name: string | null;
  status: string;
  active: boolean | null;
  product_category: string | null;
  monthly_price: number | null;
  billing_start_date: string | null;
}

interface HydratedCustomer {
  id: string;
  first_name: string | null;
  last_name: string | null;
  business_name: string | null;
  account_number: string | null;
}

async function loadRunGraph(runId: string, yearMonth: string) {
  const supabase = await createClient();
  const { data: matchRows, error: matchError } = await supabase
    .from('billing_cycle_matches')
    .select('*')
    .eq('run_id', runId);
  if (matchError) throw new Error(matchError.message);

  const { data: exceptionRows, error: excError } = await supabase
    .from('billing_cycle_exceptions')
    .select('*')
    .eq('run_id', runId);
  if (excError) throw new Error(excError.message);

  const allMatches = (matchRows || []) as MatchRow[];
  const serviceIds = [...new Set(allMatches.map((m) => m.service_id))];
  const customerIds = [...new Set(allMatches.map((m) => m.customer_id))];

  const { data: services } = serviceIds.length
    ? await supabase
        .from('customer_services')
        .select(
          'id, package_name, provider_name, status, active, product_category, monthly_price, billing_start_date'
        )
        .in('id', serviceIds)
    : { data: [] as never[] };

  const { data: customers } = customerIds.length
    ? await supabase
        .from('customers')
        .select('id, first_name, last_name, business_name, account_number')
        .in('id', customerIds)
    : { data: [] as never[] };

  const serviceMap = Object.fromEntries(
    ((services || []) as HydratedService[]).map((s) => [s.id, s])
  );
  const customerMap = Object.fromEntries(
    ((customers || []) as HydratedCustomer[]).map((c) => [c.id, c])
  );
  const cycleEnd = cycleMonthEndDate(monthBounds(yearMonth).end);

  const matches = allMatches.filter((m) => {
    const svc = serviceMap[m.service_id];
    if (!svc) return false;
    const cust = customerMap[m.customer_id];
    return includeInCycleMatch(
      {
        packageName: svc.package_name,
        productCategory: svc.product_category,
        monthlyPrice: Number(svc.monthly_price) || 0,
        status: svc.status,
        active: svc.active,
        billingStartDate: svc.billing_start_date,
        customerName: customerDisplayName(cust),
        accountNumber: cust?.account_number ?? null,
        hasInvoiceThisMonth: !!(m.zoho_invoice_id || m.zoho_amount_ex_vat != null),
      },
      cycleEnd
    );
  });
  const includedMatchIds = new Set(matches.map((m) => m.id));
  const exceptions = ((exceptionRows || []) as ExceptionRow[]).filter((e) =>
    includedMatchIds.has(e.match_id)
  );

  return {
    matches,
    exceptions,
    services: serviceMap,
    customers: customerMap,
  };
}

function toWorklistRow(
  match: MatchRow,
  ctx: {
    exceptionsByMatch: Map<string, ExceptionRow>;
    services: Record<string, { package_name: string; provider_name: string | null; status: string; active: boolean | null }>;
    customers: Record<string, { first_name: string | null; last_name: string | null; business_name: string | null }>;
  }
): CycleWorklistRow {
  const exc = ctx.exceptionsByMatch.get(match.id) ?? null;
  const svc = ctx.services[match.service_id];
  const cust = ctx.customers[match.customer_id];
  const rec = actionLabel(match.recommended_action);
  return {
    matchId: match.id,
    exceptionId: exc?.id ?? null,
    displayCode: exc?.display_code ?? null,
    serviceId: match.service_id,
    serviceDisplayId: match.platform_record_id || match.service_id,
    customerId: match.customer_id,
    customerName: cust ? customerName(cust) : 'Unknown customer',
    packageName: svc?.package_name || '',
    fno: svc?.provider_name ?? null,
    matchState: match.match_state,
    leakType: match.leak_type,
    leakLabel: match.leak_type ? LEAK_LABEL[match.leak_type] : null,
    platformExVat: Number(match.platform_amount_ex_vat) || 0,
    platformInclVat: Number(match.platform_amount_incl_vat) || 0,
    zohoExVat: match.zoho_amount_ex_vat == null ? null : Number(match.zoho_amount_ex_vat),
    zohoInclVat: match.zoho_amount_incl_vat == null ? null : Number(match.zoho_amount_incl_vat),
    zohoInvoiceNumber: match.zoho_invoice_number,
    netcashAmount: match.netcash_amount == null ? null : Number(match.netcash_amount),
    netcashRef: match.netcash_ref,
    signedVariance: Number(match.variance) || 0,
    recommendedAction: rec.action,
    actionLabel: rec.label,
  };
}

function toScored(match: MatchRow, svc?: { status: string; active: boolean | null }): ScoredCycleMatch {
  return {
    serviceId: match.service_id,
    customerId: match.customer_id,
    matchState: match.match_state as ScoredCycleMatch['matchState'],
    legsPresent: (1 +
      (match.zoho_invoice_id || match.zoho_amount_ex_vat != null ? 1 : 0) +
      (match.netcash_amount != null || match.netcash_ref ? 1 : 0)) as 1 | 2 | 3,
    pairwise: match.pairwise,
    leakType: match.leak_type,
    signedVariance: Number(match.variance) || 0,
    exposure: Number(match.exposure) || 0,
    recommendedAction: (match.recommended_action as RecommendedAction) || 'none',
    diagnosis: match.diagnosis || '',
    patternKey: match.pattern_key,
    fieldDiff: match.field_diff || [],
    platformExVat: Number(match.platform_amount_ex_vat) || 0,
    platformInclVat: Number(match.platform_amount_incl_vat) || 0,
    zohoExVat: match.zoho_amount_ex_vat == null ? null : Number(match.zoho_amount_ex_vat),
    zohoInclVat: match.zoho_amount_incl_vat == null ? null : Number(match.zoho_amount_incl_vat),
    zohoInvoiceId: match.zoho_invoice_id,
    zohoInvoiceNumber: match.zoho_invoice_number,
    zohoBooksInvoiceId: match.zoho_books_invoice_id,
    netcashAmount: match.netcash_amount == null ? null : Number(match.netcash_amount),
    netcashRef: match.netcash_ref,
    packageName: '',
    serviceStatus: (svc?.status as ServiceStatus) || 'active',
    serviceActive: svc?.active !== false,
  };
}

export async function loadCycleMatchWorkbench(
  monthParam: string | null,
  selectedExceptionId?: string | null
): Promise<CycleMatchWorkbench> {
  const month = parseYearMonth(monthParam);
  const { label } = monthBounds(month);
  const run = await ensureLatestRun(month);
  if (!run) {
    return emptyWorkbench(month, label);
  }
  const graph = await loadRunGraph(run.id, month);
  const exceptionsByMatch = new Map(graph.exceptions.map((e) => [e.match_id, e]));
  const ctx = {
    exceptionsByMatch,
    services: graph.services,
    customers: graph.customers,
  };
  const worklist = graph.matches.map((m) => toWorklistRow(m, ctx));

  const matched3 = worklist.filter((r) => r.matchState === 'matched_3');
  const matched2 = worklist.filter((r) => r.matchState === 'matched_2');
  const unmatched = worklist.filter((r) => r.matchState === 'unmatched');
  const resolvedToday = graph.exceptions.filter((e) => {
    if (!e.resolved_at) return false;
    const day = new Date(e.resolved_at).toLocaleDateString('en-CA', {
      timeZone: 'Africa/Johannesburg',
    });
    const today = new Date().toLocaleDateString('en-CA', {
      timeZone: 'Africa/Johannesburg',
    });
    return day === today;
  });

  const open = graph.exceptions.filter((e) => e.status === 'open');
  const oldest = open.reduce<number | null>((acc, e) => {
    const days = Math.floor(
      (Date.now() - new Date(e.created_at).getTime()) / 86_400_000
    );
    return acc == null ? days : Math.max(acc, days);
  }, null);

  const selectedExc =
    graph.exceptions.find((e) => e.id === selectedExceptionId) ||
    open[0] ||
    graph.exceptions[0] ||
    null;
  const selectedMatch = selectedExc
    ? graph.matches.find((m) => m.id === selectedExc.match_id)
    : graph.matches.find((m) => m.match_state !== 'matched_3') || graph.matches[0];

  return {
    month,
    monthLabel: label,
    run,
    kpis: {
      matched3Count: matched3.length,
      matched3Amount: sum(matched3.map((r) => r.platformInclVat)),
      matched3Pct:
        worklist.length === 0
          ? 0
          : Math.round((matched3.length / worklist.length) * 1000) / 10,
      matched2Count: matched2.length,
      matched2Amount: sum(matched2.map((r) => Math.abs(r.signedVariance))),
      unmatchedCount: unmatched.length,
      unmatchedAmount: sum(unmatched.map((r) => r.platformInclVat)),
      netVariance: sum(open.map((e) => Number(e.variance) || 0)),
      openExceptions: open.length,
      oldestOpenDays: oldest,
    },
    tabs: {
      all: worklist.length,
      matched_3: matched3.length,
      matched_2: matched2.length,
      unmatched: unmatched.length,
      resolved_today: resolvedToday.length,
    },
    selected: selectedMatch
      ? toPanel(selectedMatch, selectedExc, ctx)
      : null,
    worklist,
  };
}

export async function loadRevenueAssurance(
  monthParam: string | null
): Promise<RevenueAssurancePayload> {
  const month = parseYearMonth(monthParam);
  const { label } = monthBounds(month);
  const run = await ensureLatestRun(month);
  if (!run) {
    return {
      month,
      monthLabel: label,
      run: null,
      funnel: buildFunnel([]),
      kpis: {
        activeServices: 0,
        contractedValue: 0,
        billedAndCollectedPct: 0,
        billedCount: 0,
        leakage: 0,
        leakServiceCount: 0,
        recoveredYtd: 0,
        recoveredCount: 0,
      },
      worklist: [],
    };
  }
  const graph = await loadRunGraph(run.id, month);
  const exceptionsByMatch = new Map(graph.exceptions.map((e) => [e.match_id, e]));
  const ctx = {
    exceptionsByMatch,
    services: graph.services,
    customers: graph.customers,
  };
  const scored = graph.matches.map((m) =>
    toScored(m, graph.services[m.service_id])
  );
  const funnel = buildFunnel(scored);
  const leakRows = graph.matches
    .filter((m) => m.leak_type)
    .map((m) => toWorklistRow(m, ctx));

  const supabase = await createClient();
  const yearStart = `${month.slice(0, 4)}-01-01`;
  const { data: recovered } = await supabase
    .from('billing_cycle_exceptions')
    .select('recoverable, resolved_at')
    .eq('status', 'resolved')
    .gte('resolved_at', yearStart);

  const recoveredRows = recovered || [];

  return {
    month,
    monthLabel: label,
    run,
    funnel,
    kpis: {
      activeServices: funnel.stages.activeOnNetwork.count,
      contractedValue: funnel.stages.activeOnNetwork.amount,
      billedAndCollectedPct: funnel.billedAndCollectedPct,
      billedCount: funnel.stages.collected.count,
      leakage: funnel.leakageTotal,
      leakServiceCount: leakRows.length,
      recoveredYtd: sum(recoveredRows.map((r) => Number(r.recoverable) || 0)),
      recoveredCount: recoveredRows.length,
    },
    worklist: leakRows,
  };
}

export async function loadExceptionDetail(idOrCode: string) {
  const supabase = await createClient();
  const isUuid = /^[0-9a-f-]{36}$/i.test(idOrCode);
  let query = supabase.from('billing_cycle_exceptions').select('*');
  query = isUuid ? query.eq('id', idOrCode) : query.eq('display_code', idOrCode);
  const { data: exception, error } = await query.maybeSingle();
  if (error) throw new Error(error.message);
  if (!exception) return null;

  const { data: match } = await supabase
    .from('billing_cycle_matches')
    .select('*')
    .eq('id', exception.match_id)
    .single();
  if (!match) return null;

  const { data: service } = await supabase
    .from('customer_services')
    .select(
      'id, package_name, provider_name, status, active, activation_date, monthly_price, installation_address'
    )
    .eq('id', exception.service_id)
    .single();
  const { data: customer } = await supabase
    .from('customers')
    .select('id, first_name, last_name, business_name, account_number')
    .eq('id', exception.customer_id)
    .single();

  const { count: patternCount } = await supabase
    .from('billing_cycle_exceptions')
    .select('id', { count: 'exact', head: true })
    .eq('pattern_key', exception.pattern_key || '__none__')
    .eq('status', 'open');

  const { data: siblings } = await supabase
    .from('billing_cycle_exceptions')
    .select('id, display_code')
    .eq('run_id', exception.run_id)
    .order('display_code', { ascending: true });

  const idx = (siblings || []).findIndex((s) => s.id === exception.id);

  return {
    exception,
    match,
    service,
    customer: customer
      ? { ...customer, name: customerName(customer) }
      : null,
    patternCount: patternCount || 0,
    prevId: idx > 0 ? siblings![idx - 1].id : null,
    nextId:
      idx >= 0 && siblings && idx < siblings.length - 1
        ? siblings[idx + 1].id
        : null,
    index: idx + 1,
    total: siblings?.length || 0,
  };
}

function toPanel(
  match: MatchRow,
  exception: ExceptionRow | null,
  ctx: {
    services: Record<string, { package_name: string; status: string; active: boolean | null }>;
    customers: Record<string, { first_name: string | null; last_name: string | null; business_name: string | null }>;
  }
): ThreeSourcePanel {
  const svc = ctx.services[match.service_id];
  const cust = ctx.customers[match.customer_id];
  const rec = actionLabel(match.recommended_action);
  const legs =
    1 +
    (match.zoho_invoice_id || match.zoho_amount_ex_vat != null ? 1 : 0) +
    (match.netcash_amount != null || match.netcash_ref ? 1 : 0);
  return {
    exceptionId: exception?.id ?? null,
    displayCode: exception?.display_code ?? null,
    customerName: cust ? customerName(cust) : 'Unknown customer',
    serviceDisplayId: match.platform_record_id || match.service_id,
    packageName: svc?.package_name || '',
    matchState: match.match_state,
    legsMatched: legs,
    pairwise: match.pairwise,
    platform: {
      recordId: match.platform_record_id || match.service_id,
      status: svc?.status || 'unknown',
      amountExVat: Number(match.platform_amount_ex_vat) || 0,
      amountInclVat: Number(match.platform_amount_incl_vat) || 0,
    },
    zoho: {
      invoiceNumber: match.zoho_invoice_number,
      booksId: match.zoho_books_invoice_id,
      amountExVat:
        match.zoho_amount_ex_vat == null ? null : Number(match.zoho_amount_ex_vat),
      amountInclVat:
        match.zoho_amount_incl_vat == null ? null : Number(match.zoho_amount_incl_vat),
      status: match.zoho_invoice_id ? 'Invoiced' : 'Missing',
    },
    netcash: {
      ref: match.netcash_ref,
      amount: match.netcash_amount == null ? null : Number(match.netcash_amount),
      status: match.netcash_amount != null || match.netcash_ref ? 'Collected' : 'None',
    },
    diagnosis: match.diagnosis || exception?.diagnosis || '',
    recommendedAction: rec.action,
  };
}

function emptyWorkbench(month: string, monthLabel: string): CycleMatchWorkbench {
  return {
    month,
    monthLabel,
    run: null,
    kpis: {
      matched3Count: 0,
      matched3Amount: 0,
      matched3Pct: 0,
      matched2Count: 0,
      matched2Amount: 0,
      unmatchedCount: 0,
      unmatchedAmount: 0,
      netVariance: 0,
      openExceptions: 0,
      oldestOpenDays: null,
    },
    tabs: { all: 0, matched_3: 0, matched_2: 0, unmatched: 0, resolved_today: 0 },
    selected: null,
    worklist: [],
  };
}

function sum(nums: number[]): number {
  return Math.round(nums.reduce((a, b) => a + b, 0) * 100) / 100;
}
