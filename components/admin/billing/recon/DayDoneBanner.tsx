import {
  PiCheckCircleBold,
  PiWarningCircleBold,
} from 'react-icons/pi';

export interface DayDoneBannerProps {
  dayDone: boolean;
  unmatchedCount: number;
  windowLabel: string;
}

/**
 * Day-done status banner for the cash-match recon hub.
 * Red when unmatched NetCash→CT payments remain; green when clear.
 */
export function DayDoneBanner({
  dayDone,
  unmatchedCount,
  windowLabel,
}: DayDoneBannerProps) {
  if (dayDone) {
    return (
      <div
        role="status"
        className="flex items-start gap-3 rounded-xl border border-green-200/80 bg-green-50/80 shadow-sm px-4 py-3"
      >
        <PiCheckCircleBold
          className="mt-0.5 h-5 w-5 shrink-0 text-green-600"
          aria-hidden="true"
        />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-green-800">
            Cash matched: all NetCash completed payments have CT invoices.
          </p>
          <p className="mt-0.5 text-xs text-green-700">
            Window: {windowLabel}
          </p>
        </div>
      </div>
    );
  }

  const countLabel =
    unmatchedCount === 1
      ? '1 unmatched NetCash payment needs a CT invoice'
      : `${unmatchedCount} unmatched NetCash payments need a CT invoice`;

  return (
    <div
      role="alert"
      className="flex items-start gap-3 rounded-xl border border-red-200/80 bg-red-50/80 shadow-sm px-4 py-3"
    >
      <PiWarningCircleBold
        className="mt-0.5 h-5 w-5 shrink-0 text-red-600"
        aria-hidden="true"
      />
      <div className="min-w-0">
        <p className="text-sm font-semibold text-red-800">{countLabel}</p>
        <p className="mt-0.5 text-xs text-red-700">Window: {windowLabel}</p>
      </div>
    </div>
  );
}
