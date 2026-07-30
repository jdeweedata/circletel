import Link from 'next/link';
import {
  PiCheckCircleBold,
  PiClockBold,
  PiCurrencyCircleDollarBold,
  PiWarningBold,
  PiXCircleBold,
} from 'react-icons/pi';
import { MetricCard } from '@/components/backend';
import type { ReconHubSummary } from '@/lib/billing/recon-hub/types';

export interface CashMatchStripProps {
  unmatchedNetcashToCt: number;
  netcashCompletedInWindow: number;
  netcashMatchedInWindow: number;
  zohoPaymentLagCount: number;
  paynowRecon: ReconHubSummary['paynowRecon'];
}

const PAYNOW_STATUS_LABEL: Record<
  NonNullable<ReconHubSummary['paynowRecon']['status']>,
  string
> = {
  success: 'Success',
  partial: 'Partial',
  failed: 'Failed',
};

function formatLastRunAt(iso: string | null): string {
  if (!iso) return 'No runs yet';
  return new Date(iso).toLocaleString('en-ZA', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Africa/Johannesburg',
  });
}

/**
 * Primary KPI strip: unmatched cash, NetCash completed, Zoho lag, PayNow last run.
 */
export function CashMatchStrip({
  unmatchedNetcashToCt,
  netcashCompletedInWindow,
  netcashMatchedInWindow,
  zohoPaymentLagCount,
  paynowRecon,
}: CashMatchStripProps) {
  const unmatchedClear = unmatchedNetcashToCt === 0;
  const paynowStatus = paynowRecon.status;
  const paynowLabel = paynowStatus
    ? PAYNOW_STATUS_LABEL[paynowStatus]
    : 'Unknown';

  const paynowIcon =
    paynowStatus === 'success' ? (
      <PiCheckCircleBold className="w-5 h-5" aria-hidden="true" />
    ) : paynowStatus === 'failed' ? (
      <PiXCircleBold className="w-5 h-5" aria-hidden="true" />
    ) : (
      <PiClockBold className="w-5 h-5" aria-hidden="true" />
    );

  const paynowIconColor =
    paynowStatus === 'success'
      ? 'text-green-600'
      : paynowStatus === 'failed'
        ? 'text-red-600'
        : paynowStatus === 'partial'
          ? 'text-amber-600'
          : 'text-slate-400';

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <MetricCard
        title="Unmatched NetCash→CT"
        value={`${unmatchedNetcashToCt}`}
        subtitle={unmatchedClear ? 'Day-done clear' : 'Needs invoice match'}
        className={
          unmatchedClear
            ? 'border-green-200/80 bg-green-50/40'
            : 'border-red-200/80 bg-red-50/40'
        }
      >
        {unmatchedClear ? (
          <PiCheckCircleBold className="w-5 h-5 text-green-600" aria-hidden="true" />
        ) : (
          <PiWarningBold className="w-5 h-5 text-red-600" aria-hidden="true" />
        )}
      </MetricCard>

      <MetricCard
        title="NetCash completed"
        value={`${netcashCompletedInWindow}`}
        subtitle={`${netcashMatchedInWindow} matched in window`}
      >
        <PiCurrencyCircleDollarBold className="w-5 h-5 text-slate-500" aria-hidden="true" />
      </MetricCard>

      <Link href="/admin/integrations/zoho-books" className="block">
        <MetricCard
          title="Zoho payment sync lag"
          value={`${zohoPaymentLagCount}`}
          subtitle="Pending or failed sync"
          className={
            zohoPaymentLagCount > 0
              ? 'border-amber-200/80 bg-amber-50/40 transition-shadow hover:shadow-md'
              : 'transition-shadow hover:shadow-md'
          }
        >
          <PiWarningBold
            className={`w-5 h-5 ${zohoPaymentLagCount > 0 ? 'text-amber-600' : 'text-slate-400'}`}
            aria-hidden="true"
          />
        </MetricCard>
      </Link>

      <MetricCard
        title="PayNow recon last run"
        value={paynowLabel}
        subtitle={formatLastRunAt(paynowRecon.lastRunAt)}
      >
        <span className={paynowIconColor}>{paynowIcon}</span>
      </MetricCard>
    </div>
  );
}
