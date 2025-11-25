/**
 * CMS Page Not Found
 *
 * Shown when a page slug doesn't exist or isn't published.
 */

import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <div className="text-center">
        <div className="mb-6">
          <span className="text-9xl font-bold text-gray-200">404</span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Page Not Found
        </h1>
        <p className="text-lg text-gray-600 mb-8 max-w-md">
          The page you&apos;re looking for doesn&apos;t exist or hasn&apos;t been published yet.
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          <Link
            href="/"
            className="inline-flex items-center px-6 py-3 bg-circleTel-orange text-white font-semibold rounded-lg hover:bg-orange-600 transition-colors"
          >
            Go to Homepage
          </Link>
          <Link
            href="/contact"
            className="inline-flex items-center px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
          >
            Contact Us
          </Link>
        </div>
      </div>
    </main>
  );
}
