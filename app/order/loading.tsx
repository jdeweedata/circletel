import { PiSpinnerBold } from 'react-icons/pi';

/** Order flow loading boundary — shown between order stages. */
export default function OrderLoading() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <PiSpinnerBold className="w-8 h-8 mx-auto text-circleTel-orange animate-spin" aria-hidden="true" />
        <p className="mt-3 text-sm text-gray-500">Preparing your order…</p>
      </div>
    </div>
  );
}
