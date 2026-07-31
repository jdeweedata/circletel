'use client';

import { useState } from 'react';
import Link from 'next/link';
import { PiUserMinusBold } from 'react-icons/pi';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { SuspensionWatchlistEntry } from '@/lib/billing/health/types';
import { AgingBadge } from './AgingBadge';
import { formatRand } from './format';

interface SuspensionWatchlistProps {
  entries: SuspensionWatchlistEntry[];
  policyDays: number;
  onSuspended: () => void;
}

export function SuspensionWatchlist({ entries, policyDays, onSuspended }: SuspensionWatchlistProps) {
  const [target, setTarget] = useState<SuspensionWatchlistEntry | null>(null);
  const [suspending, setSuspending] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const handleSuspend = async () => {
    if (!target) return;
    setSuspending(true);
    setActionError(null);
    try {
      for (const serviceId of target.activeServiceIds) {
        const res = await fetch(`/api/admin/customers/${target.customerId}/services/suspend`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            service_id: serviceId,
            suspension_type: 'non_payment',
            reason: `Non-payment — ${target.daysPastDue}d past due (Billing Health watchlist)`,
          }),
        });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error((body as { error?: string }).error || 'Failed to suspend service');
        }
      }
      setTarget(null);
      onSuspended();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to suspend service');
    } finally {
      setSuspending(false);
    }
  };

  return (
    <div className="flex flex-col rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-6 py-4">
        <h2 className="text-base font-semibold text-slate-900">Suspension Watchlist</h2>
        <p className="mt-0.5 text-sm text-slate-500">
          Sorted by days past due · policy threshold {policyDays} days
        </p>
      </div>

      {actionError && (
        <div role="alert" className="mx-6 mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {actionError}
        </div>
      )}

      {entries.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 py-12 text-center">
          <PiUserMinusBold className="h-8 w-8 text-slate-300" aria-hidden="true" />
          <p className="text-sm font-medium text-slate-600">No customers past due</p>
          <p className="text-xs text-slate-400">Customers will appear here once an invoice passes its due date.</p>
        </div>
      ) : (
        <ul className="divide-y divide-slate-100">
          {entries.map((entry) => (
            <li key={entry.customerId} className="flex items-center justify-between gap-4 px-6 py-4">
              <div className="min-w-0">
                <Link
                  href={entry.href}
                  className="block truncate text-sm font-semibold text-slate-900 hover:text-circleTel-orange"
                >
                  {entry.customerName}
                </Link>
                <p className="mt-0.5 text-xs text-slate-500">{entry.daysPastDue}d past due</p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1.5">
                <div className="flex items-center gap-2">
                  <AgingBadge bucket={entry.agingBucket} />
                  <button
                    type="button"
                    onClick={() => setTarget(entry)}
                    disabled={entry.activeServiceIds.length === 0}
                    title={
                      entry.activeServiceIds.length === 0
                        ? 'No active services to suspend'
                        : `Suspend ${entry.customerName}`
                    }
                    className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Suspend
                  </button>
                </div>
                <p className="text-xs text-slate-400">
                  {entry.overdueInvoiceCount} overdue invoice{entry.overdueInvoiceCount === 1 ? '' : 's'} ·{' '}
                  {formatRand(entry.overdueAmount)} overdue
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}

      <AlertDialog open={target !== null} onOpenChange={(open) => !open && setTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Suspend {target?.customerName}?</AlertDialogTitle>
            <AlertDialogDescription>
              This suspends {target?.activeServiceIds.length ?? 0} active service
              {(target?.activeServiceIds.length ?? 0) === 1 ? '' : 's'} for non-payment (
              {target?.daysPastDue}d past due). The customer can be reactivated from their profile
              once payment is received.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={suspending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSuspend}
              disabled={suspending}
              className="bg-red-600 hover:bg-red-700"
            >
              {suspending ? 'Suspending…' : 'Suspend services'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
