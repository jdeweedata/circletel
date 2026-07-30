import {
  PiCheckCircleBold,
  PiClockBold,
  PiCurrencyCircleDollarBold,
  PiWarningBold,
  PiXCircleBold,
} from 'react-icons/pi';
import { StatCard } from '@/components/admin/shared';
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
      <PiCheckCircleBold className="h-5 w-5" />
    ) : paynowStatus === 'failed' ? (
      <PiXCircleBold className="h-5 w-5" />
    ) : (
      <PiClockBold className="h-5 w-5" />
    );

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        label="Unmatched NetCash→CT"
        value={unmatchedNetcashToCt}
        icon={
          unmatchedClear ? (
            <PiCheckCircleBold className="h-5 w-5" />
          ) : (
            <PiWarningBold className="h-5 w-5" />
          )
        }
        iconBgColor={unmatchedClear ? 'bg-green-100' : 'bg-red-100'}
        iconColor={unmatchedClear ? 'text-green-700' : 'text-red-700'}
        subtitle={
          unmatchedClear
            ? 'Day-done clear'
            : 'Needs invoice match'
        }
        className={
          unmatchedClear
            ? 'border-green-200 bg-green-50/40'
            : 'border-red-200 bg-red-50/40'
        }
      />

      <StatCard
        label="NetCash completed"
        value={netcashCompletedInWindow}
        icon={<PiCurrencyCircleDollarBold className="h-5 w-5" />}
        iconBgColor="bg-slate-100"
        iconColor="text-slate-700"
        subtitle={`${netcashMatchedInWindow} matched in window`}
      />

      <StatCard
        label="Zoho payment sync lag"
        value={zohoPaymentLagCount}
        icon={<PiWarningBold className="h-5 w-5" />}
        iconBgColor={
          zohoPaymentLagCount > 0 ? 'bg-amber-100' : 'bg-slate-100'
        }
        iconColor={
          zohoPaymentLagCount > 0 ? 'text-amber-700' : 'text-slate-600'
        }
        subtitle="Pending or failed sync"
        href="/admin/integrations/zoho-books"
        className={
          zohoPaymentLagCount > 0
            ? 'border-amber-200 bg-amber-50/40'
            : undefined
        }
      />

      <StatCard
        label="PayNow recon last run"
        value={paynowLabel}
        icon={paynowIcon}
        iconBgColor={
          paynowStatus === 'success'
            ? 'bg-green-100'
            : paynowStatus === 'failed'
              ? 'bg-red-100'
              : paynowStatus === 'partial'
                ? 'bg-amber-100'
                : 'bg-slate-100'
        }
        iconColor={
          paynowStatus === 'success'
            ? 'text-green-700'
            : paynowStatus === 'failed'
              ? 'text-red-700'
              : paynowStatus === 'partial'
                ? 'text-amber-700'
                : 'text-slate-600'
        }
        subtitle={formatLastRunAt(paynowRecon.lastRunAt)}
      />
    </div>
  );
}
