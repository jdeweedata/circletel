/**
 * Payment Demo Layout
 *
 * Restricts access to payment demo page in production environment.
 * Demo pages are only accessible in development and staging.
 */

import { notFound } from 'next/navigation';

/**
 * Check if current environment allows demo access
 */
function isDemoAllowed(): boolean {
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

export default function PaymentDemoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Block demo access in production
  if (!isDemoAllowed()) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Demo indicator banner */}
      <div className="bg-amber-50 border-b border-amber-200 px-4 py-2">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
              PAYMENT DEMO
            </span>
            <span className="text-sm text-amber-700">
              This is a demonstration of the payment flow. No real payments are processed.
            </span>
          </div>
          <a
            href="/"
            className="text-sm text-amber-700 hover:text-amber-900 underline"
          >
            Return to site
          </a>
        </div>
      </div>
      {children}
    </div>
  );
}
