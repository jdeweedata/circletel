import { PiSpinnerBold } from 'react-icons/pi';

/** Dashboard route-group loading boundary. */
export default function DashboardLoading() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <PiSpinnerBold className="w-8 h-8 mx-auto text-circleTel-orange animate-spin" aria-hidden="true" />
        <p className="mt-3 text-sm text-gray-500">Loading your dashboard…</p>
      </div>
    </div>
  );
}
