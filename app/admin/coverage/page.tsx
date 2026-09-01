import { redirect } from 'next/navigation';

/**
 * Coverage section root.
 *
 * This page used to be a dashboard reading MTNCoverageMonitor — an in-process
 * singleton array that was never persisted, so it permanently displayed
 * "System Health: Unhealthy — Last request: Never — 0.0%". Provider-API
 * observability now lives in /admin/integrations, backed by provider_api_calls
 * and integration_api_metrics.
 *
 * Coverage keeps the operational tools; the checker is the natural landing page.
 *
 * Temporary redirect, not permanent: this is an internal admin reorganisation
 * rather than a public URL contract, and a permanent redirect would be cached in
 * admins' browsers if the layout is ever revisited.
 */
export default function CoverageIndexPage() {
  redirect('/admin/coverage/checker');
}
