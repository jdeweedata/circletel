'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  PiArrowsClockwiseBold,
  PiCheckCircleBold,
  PiClipboardTextBold,
  PiPlayBold,
  PiWarningCircleBold,
  PiXCircleBold,
} from 'react-icons/pi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AdminPage,
  PageHeader,
  StatCard,
  LoadingState,
  EmptyState,
  ErrorState,
} from '@/components/backend';
import type {
  StatementAuditMatch,
  StatementAuditRails,
  StatementAuditReport,
  StatementAuditRow,
} from '@/lib/billing/netcash-statement-audit';

function isoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function defaultRange(): { from: string; to: string } {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 29);
  return { from: isoDate(from), to: isoDate(to) };
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 2,
  }).format(amount);
}

function daySpan(from: string, to: string): number {
  if (!from || !to) return 0;
  const a = new Date(`${from}T12:00:00`);
  const b = new Date(`${to}T12:00:00`);
  return Math.floor((b.getTime() - a.getTime()) / (24 * 60 * 60 * 1000)) + 1;
}

function matchBadgeVariant(
  match: StatementAuditMatch
): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (match === 'MATCHED_PAID_OK') return 'default';
  if (match === 'MATCHED_PAID_DUE_DRIFT' || match.startsWith('MATCHED_')) return 'secondary';
  if (match === 'SUCCESS_NO_INVOICE') return 'outline';
  return 'destructive';
}

function RowTable({
  title,
  rows,
  empty,
}: {
  title: string;
  rows: StatementAuditRow[];
  empty: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          {title} ({rows.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="py-6 text-center text-sm text-gray-500">{empty}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th className="pb-2 pr-3">Date</th>
                  <th className="pb-2 pr-3">Code</th>
                  <th className="pb-2 pr-3">Rail</th>
                  <th className="pb-2 pr-3">Invoice</th>
                  <th className="pb-2 pr-3 text-right">Amount</th>
                  <th className="pb-2 pr-3">Match</th>
                  <th className="pb-2 pr-3">Invoice status</th>
                  <th className="pb-2">Reference</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, idx) => (
                  <tr
                    key={`${row.date}-${row.code}-${row.reference}-${idx}`}
                    className="border-b hover:bg-slate-50"
                  >
                    <td className="whitespace-nowrap py-2.5 pr-3">{row.date}</td>
                    <td className="py-2.5 pr-3 font-mono text-xs">{row.code}</td>
                    <td className="py-2.5 pr-3">
                      <Badge variant="outline" className="text-xs capitalize">
                        {row.rail}
                      </Badge>
                    </td>
                    <td className="py-2.5 pr-3">
                      {row.invoiceId && row.invoiceNumber ? (
                        <Link
                          href={`/admin/billing/invoices/${row.invoiceId}`}
                          className="font-mono text-xs text-circleTel-orange hover:underline"
                        >
                          {row.invoiceNumber}
                        </Link>
                      ) : (
                        <span className="font-mono text-xs text-gray-500">
                          {row.invoiceNumber || '—'}
                        </span>
                      )}
                      {row.possibleDoubleCollect ? (
                        <Badge variant="destructive" className="ml-2 text-[10px]">
                          double
                        </Badge>
                      ) : null}
                    </td>
                    <td className="py-2.5 pr-3 text-right font-medium">
                      {formatCurrency(row.amount)}
                    </td>
                    <td className="py-2.5 pr-3">
                      <Badge variant={matchBadgeVariant(row.match)} className="text-[10px]">
                        {row.match}
                      </Badge>
                    </td>
                    <td className="py-2.5 pr-3 text-xs text-gray-600">
                      {row.invStatus
                        ? `${row.invStatus} · paid=${row.invPaid ?? '—'} · due=${row.invDue ?? '—'}`
                        : '—'}
                    </td>
                    <td
                      className="max-w-[220px] truncate py-2.5 font-mono text-[11px] text-gray-500"
                      title={row.reference || row.description}
                    >
                      {row.reference || row.description || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function StatementAuditPage() {
  const initial = useMemo(() => defaultRange(), []);
  const [from, setFrom] = useState(initial.from);
  const [to, setTo] = useState(initial.to);
  const [rails, setRails] = useState<StatementAuditRails>('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<StatementAuditReport | null>(null);

  const span = daySpan(from, to);

  async function runSweep() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/finance/statement-audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ from, to, rails }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Statement audit failed');
      }
      setReport(data.report as StatementAuditReport);
    } catch (e) {
      setReport(null);
      setError(e instanceof Error ? e.message : 'Statement audit failed');
    } finally {
      setLoading(false);
    }
  }

  const exceptions = useMemo(() => {
    if (!report) return [] as StatementAuditRow[];
    return report.successes.filter(
      (r) =>
        r.possibleDoubleCollect ||
        r.match === 'MATCHED_PAID_DUE_DRIFT' ||
        r.match === 'MATCHED_INVOICE_NOT_PAID' ||
        r.match === 'MATCHED_PARTIAL_OR_UNPAID_STATUS'
    );
  }, [report]);

  return (
    <AdminPage>
      <PageHeader
        title="Statement audit"
        subtitle="Read-only NetCash merchant statement sweep vs CircleTel invoices (debit TDD + PayNow PNC/PIS). Does not change invoice status."
        actions={
          <Button onClick={runSweep} disabled={loading || !from || !to}>
            {loading ? (
              <PiArrowsClockwiseBold className="mr-1 h-4 w-4 animate-spin" />
            ) : (
              <PiPlayBold className="mr-1 h-4 w-4" />
            )}
            {loading ? 'Running…' : 'Run sweep'}
          </Button>
        }
      />

      <Card>
        <CardContent className="flex flex-wrap items-end gap-3 pt-6">
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-500">From</label>
            <Input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="w-[160px]"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-500">To</label>
            <Input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="w-[160px]"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-500">Rails</label>
            <Select
              value={rails}
              onValueChange={(v) => setRails(v as StatementAuditRails)}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="debit">Debit only</SelectItem>
                <SelectItem value="paynow">PayNow only</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <p className="pb-2 text-xs text-gray-500">
            {span > 0 ? `${span} day${span === 1 ? '' : 's'}` : 'Invalid range'}
            {span > 14
              ? ' · Long ranges are slow (one NetCash call per day). Max 62 days.'
              : ' · Default last 30 days.'}
          </p>
        </CardContent>
      </Card>

      {loading ? <LoadingState message="Fetching NetCash statements…" /> : null}

      {!loading && error ? (
        <ErrorState title="Audit failed" message={error} onRetry={runSweep} />
      ) : null}

      {!loading && !error && !report ? (
        <EmptyState
          title="No audit run yet"
          description="Choose a date range and click Run sweep to classify NetCash debit and PayNow lines against invoices."
          icon={<PiClipboardTextBold className="h-10 w-10" />}
        />
      ) : null}

      {!loading && report ? (
        <>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
            <StatCard
              label="Matched OK"
              value={report.summary.matchedPaidOk}
              icon={<PiCheckCircleBold className="h-5 w-5" />}
            />
            <StatCard
              label="Due drift"
              value={report.summary.matchedPaidDueDrift}
              icon={<PiWarningCircleBold className="h-5 w-5" />}
            />
            <StatCard
              label="Not paid"
              value={report.summary.matchedInvoiceNotPaid}
              icon={<PiXCircleBold className="h-5 w-5" />}
            />
            <StatCard
              label="No invoice"
              value={report.summary.successNoInvoice}
              icon={<PiClipboardTextBold className="h-5 w-5" />}
            />
            <StatCard
              label="Double collect"
              value={report.summary.possibleDoubleCollect}
              icon={<PiWarningCircleBold className="h-5 w-5" />}
            />
            <StatCard
              label="Stmt days failed"
              value={report.summary.statementDaysFailed}
              icon={<PiXCircleBold className="h-5 w-5" />}
            />
          </div>

          <p className="text-xs text-gray-500">
            Ran {new Date(report.ranAt).toLocaleString('en-ZA')} ·{' '}
            {(report.durationMs / 1000).toFixed(1)}s · {report.summary.daysOk}/
            {report.summary.daysScanned} statement days OK ·{' '}
            {report.summary.successLines} success lines · {report.summary.failLines}{' '}
            fail lines
          </p>

          <RowTable
            title="Exceptions (drift / unpaid / double-collect)"
            rows={exceptions}
            empty="No exceptions in this window"
          />

          <RowTable
            title="All success lines"
            rows={report.successes}
            empty="No debit/PayNow success lines in this window"
          />

          <RowTable
            title="Fail / unpaid lines (context)"
            rows={report.failures}
            empty="No fail lines in this window"
          />

          {report.dayErrors.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Statement day errors ({report.dayErrors.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1 text-sm text-gray-600">
                  {report.dayErrors.map((d) => (
                    <li key={d.date}>
                      <span className="font-mono text-xs">{d.date}</span> — {d.error}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ) : null}
        </>
      ) : null}
    </AdminPage>
  );
}
