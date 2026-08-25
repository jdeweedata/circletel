'use client';

import { useCallback, useEffect, useState } from 'react';
import { AdminPage, ErrorState, LoadingState } from '@/components/backend';
import { UnjaniAdminModernistShell } from '@/components/admin/unjani/UnjaniAdminModernistShell';
import { UnjaniFulfilmentPanel } from '@/components/admin/unjani/UnjaniFulfilmentPanel';
import {
  KpiStrip,
  PageHeader,
} from '@/components/portal/modernist/PortalModernistShell';
import { spendNote, type UnjaniDashboardKpis } from '@/lib/portal/dashboard-kpis';
import { formatZar } from '@/lib/portal/site-format';

const EMPTY_KPIS: UnjaniDashboardKpis = {
  sitesLive: 0,
  inOnboarding: 0,
  preQualified: 0,
  billedSites: 0,
  monthlySpend: 0,
};

function authHeaders(): Record<string, string> {
  return { Authorization: `Bearer ${localStorage.getItem('admin_token') || ''}` };
}

export default function UnjaniOnboardingPage() {
  const [kpis, setKpis] = useState<UnjaniDashboardKpis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/unjani/portal-ops', {
        headers: authHeaders(),
      });
      if (!response.ok) throw new Error('Failed to load');
      const data = await response.json();
      setKpis(data.kpis ?? EMPTY_KPIS);
      setError(false);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <UnjaniAdminModernistShell>
        <AdminPage>
          <LoadingState message="Loading Unjani clinics…" />
        </AdminPage>
      </UnjaniAdminModernistShell>
    );
  }

  if (error || !kpis) {
    return (
      <UnjaniAdminModernistShell>
        <AdminPage>
          <ErrorState
            title="Failed to load"
            message="The clinic onboarding dashboard could not be loaded."
            onRetry={load}
          />
        </AdminPage>
      </UnjaniAdminModernistShell>
    );
  }

  return (
    <UnjaniAdminModernistShell>
      <AdminPage>
        <PageHeader
          eyebrow="Unjani Connect"
          title="Clinic Onboarding"
          subtitle={`${kpis.inOnboarding} in onboarding · ${kpis.sitesLive} live · ${kpis.preQualified} pre-qualified`}
        />

        <div className="mb-6">
          <KpiStrip
            variant="cards"
            items={[
              {
                label: 'Sites live',
                value: String(kpis.sitesLive),
                accent: '#2F9E5E',
                valueColor: '#2F9E5E',
                href: '/admin/unjani/sites-live',
              },
              {
                label: 'In onboarding',
                value: String(kpis.inOnboarding),
                note: 'Across 5 stages',
                accent: '#13274A',
                href: '/admin/unjani/in-onboarding',
              },
              {
                label: 'Pre-qualified',
                value: String(kpis.preQualified),
                note: 'Ready to add to the pipeline',
                accent: '#F5841E',
                href: '/admin/unjani/pre-qualified',
              },
              {
                label: 'Monthly spend',
                value: formatZar(kpis.monthlySpend),
                note: spendNote(kpis.billedSites, kpis.monthlySpend),
                accent: '#13274A',
                href: '/admin/unjani/monthly-spend',
              },
            ]}
          />
        </div>

        <UnjaniFulfilmentPanel authHeaders={authHeaders} onRefresh={() => void load()} />
      </AdminPage>
    </UnjaniAdminModernistShell>
  );
}
