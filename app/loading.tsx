import { PiSpinnerBold } from 'react-icons/pi';

/**
 * Global route loading boundary
 *
 * Streams immediately while server components resolve, replacing the
 * blank screen during navigation.
 */
export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center">
        <PiSpinnerBold className="w-10 h-10 mx-auto text-circleTel-orange animate-spin" aria-hidden="true" />
        <p className="mt-4 text-sm text-gray-500">Loading…</p>
      </div>
    </div>
  );
}
