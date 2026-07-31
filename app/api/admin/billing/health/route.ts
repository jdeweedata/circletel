/**
 * Billing Health dashboard API
 * GET /api/admin/billing/health
 *
 * One composed payload for /admin/billing: MRR, past-due totals, aging
 * buckets, 6-month invoiced/collected trend, suspension watchlist and the
 * overdue invoice register. Month boundaries are UTC (matches stats route).
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { apiLogger } from '@/lib/logging';
import { authenticateAdmin } from '@/lib/auth/admin-api-auth';
import {
  buildAgingBuckets,
  buildOverdueRegister,
  buildWatchlist,
  countUnpaidCustomers,
  daysPastDue,
  type UnpaidInvoiceInput,
} from '@/lib/billing/health/aging';
import type {
  BillingHealthResponse,
  BillingHealthTrendPoint,
} from '@/lib/billing/health/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const UNPAID_STATUSES = ['sent', 'partial', 'overdue'] as const;
const EXCLUDED_FROM_INVOICED = ['draft', 'cancelled', 'voided'] as const;
const SUSPENSION_POLICY_DAYS = 30;
const URGENT_DAYS = 31;

function monthStartUTC(offset: number, now: Date): Date {
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + offset, 1)
  );
}

function monthLabel(date: Date): string {
  return `${date.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' })} ${date.getUTCFullYear()}`;
}

function toMonthKey(iso: string): string {
  return iso.slice(0, 7); // YYYY-MM
}

export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateAdmin(request);
    if (!authResult.success) return authResult.response;

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const now = new Date();
    const todayISO = now.toISOString().slice(0, 10);
    const currentMonthStart = monthStartUTC(0, now);
    const trendStart = monthStartUTC(-5, now);
    const prevMonthLabel = monthLabel(monthStartUTC(-1, now)).split(' ')[0];

    const [activeServicesResult, unpaidInvoicesResult, invoicedRowsResult, collectedRowsResult] =
      await Promise.all([
        // MRR + suspend targets
        supabase
          .from('customer_services')
          .select('id, customer_id, monthly_price, created_at')
          .eq('status', 'active'),

        // Unpaid invoices (aging, watchlist, register)
        supabase
          .from('customer_invoices')
          .select('id, customer_id, invoice_number, due_date, amount_due, service_id')
          .in('status', [...UNPAID_STATUSES])
          .gt('amount_due', 0),

        // Trend: invoiced per month (last 6 months)
        supabase
          .from('customer_invoices')
          .select('invoice_date, total_amount')
          .gte('invoice_date', trendStart.toISOString().slice(0, 10))
          .not('status', 'in', `(${EXCLUDED_FROM_INVOICED.join(',')})`),

        // Trend: collected per month (last 6 months)
        supabase
          .from('customer_invoices')
          .select('paid_at, amount_paid')
          .in('status', ['paid', 'partial'])
          .not('paid_at', 'is', null)
          .gte('paid_at', trendStart.toISOString()),
      ]);

    if (activeServicesResult.error) throw activeServicesResult.error;
    if (unpaidInvoicesResult.error) throw unpaidInvoicesResult.error;
    if (invoicedRowsResult.error) throw invoicedRowsResult.error;
    if (collectedRowsResult.error) throw collectedRowsResult.error;

    // ---- MRR ----
    const activeServices = activeServicesResult.data || [];
    let mrrCurrent = 0;
    let mrrPrevious = 0;
    const activeServiceIdsByCustomer = new Map<string, string[]>();

    for (const svc of activeServices) {
      const price = Number(svc.monthly_price || 0);
      mrrCurrent += price;
      if (svc.created_at && svc.created_at < currentMonthStart.toISOString()) {
        mrrPrevious += price;
      }
      const list = activeServiceIdsByCustomer.get(svc.customer_id) ?? [];
      list.push(svc.id);
      activeServiceIdsByCustomer.set(svc.customer_id, list);
    }

    const momChangePct =
      mrrPrevious > 0 ? ((mrrCurrent - mrrPrevious) / mrrPrevious) * 100 : null;

    // ---- Unpaid invoices → names + package names ----
    const unpaidRows = unpaidInvoicesResult.data || [];
    const customerIds = [...new Set(unpaidRows.map((r) => r.customer_id))];
    const serviceIds = [
      ...new Set(unpaidRows.map((r) => r.service_id).filter(Boolean)),
    ] as string[];

    const [customersResult, packagesResult] = await Promise.all([
      customerIds.length
        ? supabase
            .from('customers')
            .select('id, first_name, last_name, business_name, account_type')
            .in('id', customerIds)
        : Promise.resolve({ data: [], error: null }),
      serviceIds.length
        ? supabase.from('customer_services').select('id, package_name').in('id', serviceIds)
        : Promise.resolve({ data: [], error: null }),
    ]);

    if (customersResult.error) throw customersResult.error;
    if (packagesResult.error) throw packagesResult.error;

    const customerNameById = new Map<string, string>();
    for (const c of customersResult.data || []) {
      const business = c.account_type === 'business' && c.business_name;
      customerNameById.set(
        c.id,
        business ? c.business_name : `${c.first_name} ${c.last_name}`.trim()
      );
    }
    const packageNameById = new Map<string, string>();
    for (const s of packagesResult.data || []) {
      packageNameById.set(s.id, s.package_name);
    }

    const unpaidInvoices: UnpaidInvoiceInput[] = unpaidRows.map((r) => ({
      id: r.id,
      customerId: r.customer_id,
      customerName: customerNameById.get(r.customer_id) ?? 'Unknown customer',
      invoiceNumber: r.invoice_number,
      packageName: r.service_id ? packageNameById.get(r.service_id) ?? null : null,
      dueDate: r.due_date,
      amountDue: Number(r.amount_due || 0),
    }));

    // ---- Aggregations ----
    const aging = buildAgingBuckets(unpaidInvoices, todayISO);
    const watchlist = buildWatchlist(unpaidInvoices, todayISO, activeServiceIdsByCustomer);
    const overdueInvoices = buildOverdueRegister(unpaidInvoices, todayISO).slice(0, 100);

    const pastDueTotal = unpaidInvoices.reduce((sum, inv) => sum + inv.amountDue, 0);
    const overdueCount = unpaidInvoices.filter(
      (inv) => daysPastDue(inv.dueDate, todayISO) > 0
    ).length;

    // ---- Trend (oldest → newest) ----
    const invoicedByMonth = new Map<string, number>();
    for (const row of invoicedRowsResult.data || []) {
      const key = toMonthKey(row.invoice_date);
      invoicedByMonth.set(key, (invoicedByMonth.get(key) ?? 0) + Number(row.total_amount || 0));
    }
    const collectedByMonth = new Map<string, number>();
    for (const row of collectedRowsResult.data || []) {
      const key = toMonthKey(row.paid_at);
      collectedByMonth.set(key, (collectedByMonth.get(key) ?? 0) + Number(row.amount_paid || 0));
    }

    const trend: BillingHealthTrendPoint[] = [];
    for (let offset = -5; offset <= 0; offset++) {
      const start = monthStartUTC(offset, now);
      const key = `${start.getUTCFullYear()}-${String(start.getUTCMonth() + 1).padStart(2, '0')}`;
      trend.push({
        month: monthLabel(start),
        invoiced: Math.round((invoicedByMonth.get(key) ?? 0) * 100) / 100,
        collected: Math.round((collectedByMonth.get(key) ?? 0) * 100) / 100,
        mrr: Math.round(mrrCurrent * 100) / 100,
      });
    }

    const response: BillingHealthResponse = {
      generatedAt: now.toISOString(),
      mrr: {
        current: Math.round(mrrCurrent * 100) / 100,
        previous: Math.round(mrrPrevious * 100) / 100,
        momChangePct: momChangePct === null ? null : Math.round(momChangePct * 10) / 10,
        deltaLabel: `Delta vs ${prevMonthLabel}`,
      },
      pastDue: {
        totalAmount: Math.round(pastDueTotal * 100) / 100,
        customerCount: countUnpaidCustomers(unpaidInvoices),
      },
      suspension: {
        candidates: watchlist.length,
        urgent: watchlist.filter((w) => w.daysPastDue >= URGENT_DAYS).length,
        policyDays: SUSPENSION_POLICY_DAYS,
      },
      unpaid: {
        total: unpaidInvoices.length,
        overdue: overdueCount,
      },
      trend,
      aging,
      watchlist,
      overdueInvoices,
    };

    return NextResponse.json(response);
  } catch (error) {
    apiLogger.error('Error fetching billing health', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: 'Failed to fetch billing health' },
      { status: 500 }
    );
  }
}
