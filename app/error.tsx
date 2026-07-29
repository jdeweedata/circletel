'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { PiWarningCircleBold } from 'react-icons/pi';

/**
 * Global route error boundary
 *
 * Catches render/data errors in any route without its own error.tsx,
 * replacing the white-screen crash with a recoverable UI.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[Route Error]', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-circleTel-lightNeutral to-white px-4">
      <div className="text-center max-w-2xl">
        <PiWarningCircleBold className="w-24 h-24 mx-auto text-circleTel-orange mb-8" aria-hidden="true" />
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Something went wrong</h1>
        <p className="text-xl text-gray-600 mb-2">
          An unexpected error occurred while loading this page.
        </p>
        {error.digest && (
          <p className="text-sm text-gray-400 mb-8">Reference: {error.digest}</p>
        )}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
          <button
            onClick={reset}
            className="px-8 py-4 bg-circleTel-orange text-white rounded-lg font-bold text-lg hover:bg-orange-600 transition-colors shadow-lg"
          >
            Try again
          </button>
          <Link
            href="/"
            className="px-8 py-4 border border-gray-300 text-gray-700 rounded-lg font-bold text-lg hover:bg-gray-50 transition-colors"
          >
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
