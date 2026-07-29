'use client';

import { useEffect } from 'react';
import { PiWarningCircleBold } from 'react-icons/pi';

/** Admin route-group error boundary — keeps the admin shell alive on page errors. */
export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[Admin Route Error]', error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-[60vh] px-4">
      <div className="text-center max-w-lg">
        <PiWarningCircleBold className="w-16 h-16 mx-auto text-circleTel-orange mb-6" aria-hidden="true" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">This admin page failed to load</h2>
        <p className="text-gray-600 mb-1">The rest of the admin console is unaffected.</p>
        {error.digest && (
          <p className="text-sm text-gray-400 mb-6">Reference: {error.digest}</p>
        )}
        <button
          onClick={reset}
          className="mt-4 px-6 py-3 bg-circleTel-orange text-white rounded-lg font-bold hover:bg-orange-600 transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
