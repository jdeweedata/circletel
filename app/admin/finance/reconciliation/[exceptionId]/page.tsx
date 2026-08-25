'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { PiFileTextBold } from 'react-icons/pi';
import { Button } from '@/components/ui/button';
import {
  AdminPage,
  DetailPageHeader,
  ErrorState,
  LoadingState,
  StatCard,
} from '@/components/backend';
import { SourceDot } from '@/components/admin/finance/cycle-match/SourceDot';
import { formatZar } from '@/components/admin/finance/cycle-match/money';

interface ExceptionDetail {
  exception: {
    id: string;
    display_code: string;
    diagnosis: string;
    status: string;
    variance: number;
    recoverable: number;
    cycles_affected: number;
    created_at: string;
    pattern_key: string | null;
    leak_type: string | null;
    field_diff: Array<{
      field: string;
      platform: string;
      zoho: string;
      netcash: string;
      mismatch: boolean;
    }>;
    audit_events: Array<{ at?: string; kind?: string; message?: string; actor?: string }>;
  };
  match: {
    recommended_action: string | null;
    platform_record_id: string;
    zoho_invoice_number: string | null;
    netcash_ref: string | null;
    pairwise: {
      platformToZoho: { ok: boolean };
      zohoToNetcash: { ok: boolean };
      platformToNetcash: { ok: boolean };
    };
  };
  service: {
    package_name: string;
    provider_name: string | null;
    activation_date: string | null;
    status: string;
  } | null;
  customer: { name: string; account_number: string | null } | null;
  patternCount: number;
  prevId: string | null;
  nextId: string | null;
  index: number;
  total: number;
}

const th =
  'pb-2 pr-4 text-left font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400';

export default function ExceptionDetailPage() {
  const params = useParams<{ exceptionId: string }>();
  const [data, setData] = useState<ExceptionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [acting, setActing] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/admin/finance/cycle-match/exceptions/${params.exceptionId}`
      );
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || 'Failed to load exception');
      setData(body as ExceptionDetail);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load exception');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [params.exceptionId]);

  useEffect(() => {
    void load();
  }, [load]);

  const act = async (action: string) => {
    setActing(action);
    try {
      const res = await fetch(
        `/api/admin/finance/cycle-match/exceptions/${params.exceptionId}/actions`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action }),
        }
      );
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.message || body.error || 'Action failed');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setActing(null);
    }
  };

  if (loading && !data) {
    return (
      <AdminPage>
        <LoadingState message="Loading exception…" />
      </AdminPage>
    );
  }

  if (error && !data) {
    return (
      <AdminPage>
        <ErrorState title="Could not load exception" message={error} onRetry={() => void load()} />
      </AdminPage>
    );
  }

  if (!data) return null;

  const legs =
    1 +
    (data.match.pairwise.platformToZoho.ok || data.match.zoho_invoice_number ? 1 : 0) +
    (data.match.pairwise.zohoToNetcash.ok || data.match.netcash_ref ? 1 : 0);
  const primary =
    data.match.recommended_action === 'create_invoice'
      ? { action: 'create_invoice', label: 'Create invoice' }
      : data.match.recommended_action === 'credit_note'
        ? { action: 'credit_note', label: 'Credit note' }
        : data.match.recommended_action === 'request_mandate'
          ? { action: 'request_mandate', label: 'Request mandate' }
          : {
              action: 'debit_note',
              label: `Raise ${formatZar(Math.abs(Number(data.exception.recoverable) || 0))} debit note`,
            };

  return (
    <AdminPage>
      <DetailPageHeader
        breadcrumbs={[
          { label: 'Payments', href: '/admin/finance/reconciliation' },
          { label: 'Reconciliation', href: '/admin/finance/reconciliation' },
          { label: data.exception.display_code },
        ]}
        title={data.customer?.name || 'Exception'}
        subtitle={`${data.match.platform_record_id} · ${data.service?.package_name || ''} · account since ${data.service?.activation_date || '—'}`}
        status={{
          label: `${Math.min(legs, 3)} of 3 matched`,
          variant: legs === 3 ? 'success' : 'warning',
        }}
        actions={
          <span className="text-sm text-slate-500">
            Opened {new Date(data.exception.created_at).toLocaleDateString('en-ZA')}
          </span>
        }
      />

      {error && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Variance this cycle"
          value={formatZar(data.exception.variance)}
        />
        <StatCard label="Cycles affected" value={data.exception.cycles_affected} />
        <StatCard
          label="Total recoverable"
          value={formatZar(data.exception.recoverable)}
        />
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="mb-3 flex items-center gap-4 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">
          <span className="inline-flex items-center gap-1.5">
            <SourceDot tone="platform" /> Platform
          </span>
          <span className="inline-flex items-center gap-1.5">
            <SourceDot tone="zoho" /> Zoho
          </span>
          <span className="inline-flex items-center gap-1.5">
            <SourceDot tone="netcash" /> Netcash
          </span>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200">
              <th className={th}>Field</th>
              <th className={th}>Platform</th>
              <th className={th}>Zoho</th>
              <th className={th}>Netcash</th>
            </tr>
          </thead>
          <tbody>
            {(data.exception.field_diff || []).map((row) => (
              <tr key={row.field} className="border-b border-slate-100">
                <td className="py-2 pr-4 font-medium text-slate-600">{row.field}</td>
                <td className="py-2 pr-4">{row.platform}</td>
                <td className={row.mismatch ? 'bg-red-50 py-2 pr-4 font-semibold text-red-700' : 'py-2 pr-4'}>
                  {row.zoho}
                </td>
                <td className="py-2 pr-4 text-slate-500">{row.netcash}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="rounded-xl border-l-4 border-circleTel-orange bg-slate-50 p-4">
        <h3 className="mb-1 text-sm font-semibold text-slate-900">Diagnosis</h3>
        <p className="text-sm text-slate-700">{data.exception.diagnosis}</p>
      </section>

      <section>
        <h3 className="mb-3 font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">
          Resolve
        </h3>
        <div className="flex flex-wrap gap-2">
          <Button
            className="bg-circleTel-orange hover:bg-circleTel-orange/90"
            onClick={() => void act(primary.action)}
            disabled={!!acting || data.exception.status !== 'open'}
          >
            <PiFileTextBold className="mr-1.5 h-4 w-4" />
            {acting === primary.action ? 'Working…' : primary.label}
          </Button>
          <Button variant="outline" disabled>
            Fix Zoho recurring profile
          </Button>
          <Button variant="outline" disabled>
            Correct platform price
          </Button>
          <Button
            variant="outline"
            onClick={() => void act('accept_variance')}
            disabled={!!acting || data.exception.status !== 'open'}
          >
            Accept variance
          </Button>
          {data.patternCount > 1 && (
            <Button
              variant="outline"
              onClick={() => void act('apply_to_pattern')}
              disabled={!!acting || data.exception.status !== 'open'}
            >
              Apply to all {data.patternCount}
            </Button>
          )}
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-900">Audit trail</h3>
        {(data.exception.audit_events || []).map((event, i) => (
          <div key={i} className="flex items-start gap-3 text-sm">
            <SourceDot
              tone={
                event.kind?.includes('fail')
                  ? 'red'
                  : event.kind === 'auto_match'
                    ? 'platform'
                    : 'grey'
              }
              className="mt-1.5"
            />
            <div>
              <p className="text-slate-800">{event.message}</p>
              <p className="text-xs text-slate-400">
                {event.at
                  ? new Date(event.at).toLocaleString('en-ZA', {
                      timeZone: 'Africa/Johannesburg',
                    })
                  : ''}
                {event.actor ? ` · ${event.actor}` : ''}
              </p>
            </div>
          </div>
        ))}
      </section>

      <div className="flex items-center justify-between border-t border-slate-200 pt-4">
        <p className="text-sm text-slate-500">
          Exception {data.index} of {data.total}
        </p>
        <div className="flex gap-2">
          {data.prevId ? (
            <Button asChild variant="outline" size="sm">
              <Link href={`/admin/finance/reconciliation/${data.prevId}`}>Previous</Link>
            </Button>
          ) : (
            <Button variant="outline" size="sm" disabled>
              Previous
            </Button>
          )}
          {data.nextId ? (
            <Button asChild variant="outline" size="sm">
              <Link href={`/admin/finance/reconciliation/${data.nextId}`}>
                Next exception
              </Link>
            </Button>
          ) : (
            <Button variant="outline" size="sm" disabled>
              Next exception
            </Button>
          )}
        </div>
      </div>
    </AdminPage>
  );
}
