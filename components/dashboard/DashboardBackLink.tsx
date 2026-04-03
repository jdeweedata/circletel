// components/dashboard/DashboardBackLink.tsx
import Link from 'next/link';

export function DashboardBackLink() {
  return (
    <Link
      href="/dashboard"
      className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 mb-6 transition-colors"
    >
      ← Back to dashboard
    </Link>
  );
}
