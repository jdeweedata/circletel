import {
  PiCheckCircleBold,
  PiWarningCircleBold,
} from 'react-icons/pi';

export interface DayDoneBannerProps {
  dayDone: boolean;
  unmatchedCount: number;
  windowLabel: string;
  unmatchedNetcashToCt?: number;
  ctPaidBooksOpenCount?: number;
  bankNetcashOnlyCount?: number;
}

/**
 * Day-done status banner for the three-way recon hub.
 * Green when cash + Books payment mirror are clear for the window.
 */
export function DayDoneBanner({
  dayDone,
  unmatchedCount,
  windowLabel,
  unmatchedNetcashToCt,
  ctPaidBooksOpenCount,
  bankNetcashOnlyCount,
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
            Day done: Netcash→CT matched and CT paid invoices are mirrored in
            Books for this window.
          </p>
          <p className="mt-0.5 text-xs text-green-700">
            Window: {windowLabel}
          </p>
        </div>
      </div>
    );
  }

  const parts: string[] = [];
  if (typeof unmatchedNetcashToCt === 'number' && unmatchedNetcashToCt > 0) {
    parts.push(
      unmatchedNetcashToCt === 1
        ? '1 unmatched Netcash→CT payment'
        : `${unmatchedNetcashToCt} unmatched Netcash→CT payments`
    );
  }
  if (typeof ctPaidBooksOpenCount === 'number' && ctPaidBooksOpenCount > 0) {
    parts.push(
      ctPaidBooksOpenCount === 1
        ? '1 CT paid / Books open invoice'
        : `${ctPaidBooksOpenCount} CT paid / Books open invoices`
    );
  }
  if (typeof bankNetcashOnlyCount === 'number' && bankNetcashOnlyCount > 0) {
    parts.push(
      bankNetcashOnlyCount === 1
        ? '1 Netcash bank line without Books match'
        : `${bankNetcashOnlyCount} Netcash bank lines without Books match`
    );
  }

  const countLabel =
    parts.length > 0
      ? parts.join(' · ')
      : unmatchedCount === 1
        ? '1 recon exception blocks day-done'
        : `${unmatchedCount} recon exceptions block day-done`;

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
