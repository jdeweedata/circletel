'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { PiWarningCircleBold } from 'react-icons/pi';

/**
 * Order flow error boundary
 *
 * Order state persists in localStorage (circletel_order_state), so a retry
 * resumes where the customer left off rather than restarting the flow.
 */
export default function OrderError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[Order Route Error]', error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-[60vh] px-4">
      <div className="text-center max-w-lg">
        <PiWarningCircleBold className="w-16 h-16 mx-auto text-circleTel-orange mb-6" aria-hidden="true" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong with your order</h2>
        <p className="text-gray-600 mb-1">Your progress is saved — trying again will pick up where you left off.</p>
        {error.digest && (
          <p className="text-sm text-gray-400 mb-6">Reference: {error.digest}</p>
        )}
        <div className="flex flex-col sm:flex-row gap-3 justify-center mt-4">
          <button
            onClick={reset}
            className="px-6 py-3 bg-circleTel-orange text-white rounded-lg font-bold hover:bg-orange-600 transition-colors"
          >
            Try again
          </button>
          <Link
            href="/contact"
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-bold hover:bg-gray-50 transition-colors"
          >
            Contact support
          </Link>
        </div>
      </div>
    </div>
  );
}
