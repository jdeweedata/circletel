/**
 * Test Pages Layout
 *
 * Restricts access to test pages in production environment.
 * Test pages are only accessible in development and staging.
 */

import { notFound } from 'next/navigation';

/**
 * Check if current environment allows test access
 */
function isTestAllowed(): boolean {
  // Check VERCEL_ENV (set automatically by Vercel)
  const vercelEnv = process.env.VERCEL_ENV;
  if (vercelEnv === 'production') {
    return false;
  }

  // Check custom APP_URL for production domain
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || '';
  if (appUrl.includes('circletel.co.za') && !appUrl.includes('staging')) {
    return false;
  }

  // Allow in development, preview, and staging
  return true;
}

export default function TestLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Block test access in production
  if (!isTestAllowed()) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Test indicator banner */}
      <div className="bg-purple-50 border-b border-purple-200 px-4 py-2">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
              TEST
            </span>
            <span className="text-sm text-purple-700">
              These pages are for testing purposes only.
            </span>
          </div>
          <a
            href="/"
            className="text-sm text-purple-700 hover:text-purple-900 underline"
          >
            Return to site
          </a>
        </div>
      </div>
      {children}
    </div>
  );
}
