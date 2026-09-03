'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { PiHeartbeatBold } from 'react-icons/pi';
import { usePortalAuth } from '@/lib/portal/portal-auth-provider';
import { usePortalApp } from '@/lib/portal/portal-app-context';
import {
  formatClinicShortName,
  formatSiteCode,
  formatSiteStreet,
  formatTechnology,
  formatZar,
} from '@/lib/portal/site-format';
import HealthTrendChart from '@/components/portal/HealthTrendChart';
import StaffWifiUsageChart from '@/components/portal/StaffWifiUsageChart';
import {
  PageHeader,
  PmButton,
  PortalModernistShell,
} from '@/components/portal/modernist/PortalModernistShell';
import { StageBadge } from '@/components/portal/modernist/StageIndicators';
import { ClinicNowCard } from '@/components/portal/modernist/ClinicNowCard';
import { ClinicPlacePeople } from '@/components/portal/modernist/ClinicPlacePeople';
import { OnboardingStepper } from '@/components/portal/modernist/OnboardingStepper';
import type { StageKey } from '@/lib/portal/onboarding-stage';
import { usePortalCapability } from '@/lib/portal/use-portal-capability';

interface SiteDetail {
  site: {
    id: string;
    site_number: number | null;
    site_name: string;
    site_code: string | null;
    installation_address: unknown;
    province: string | null;
    status: string | null;
    technology: string | null;
    monthly_fee: number | string | null;
    installed_at: string | null;
    job_card_number: string | null;
    access_type: string | null;
    access_instructions: string | null;
    rfi_status: string | null;
    rfi_notes: string | null;
    router_model: string | null;
    router_serial: string | null;
    ruijie_device_sn: string | null;
    site_contact_name: string | null;
    site_contact_phone: string | null;
    site_contact_email: string | null;
    lat: number | null;
    lng: number | null;
    created_at: string;
    customer_id: string | null;
    stage: StageKey;
  };
  install: {
    visit_date: string | null;
    stock_status: string;
    status: string;
  } | null;
  health: {
    health_score: number;
    online_clients: number;
    cpu_usage: number | null;
    memory_usage: number | null;
    status: string | null;
    captured_at: string;
  } | null;
}

export default function PortalSiteDetailPage() {
  const params = useParams();
  const siteId = params.id as string;
  const { isSiteUser } = usePortalAuth();
  const { href, isUnjani } = usePortalApp();
  const { allowed } = usePortalCapability('sites.read');
  const [data, setData] = useState<SiteDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/portal/sites/${siteId}`)
      .then((r) => r.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [siteId]);

  if (!allowed) return null;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-circleTel-orange border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data?.site) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">Site not found.</p>
        {allowed && (
          <Link href={href('/sites')} className="text-sm text-circleTel-orange hover:underline mt-2 inline-block">
            Back to sites
          </Link>
        )}
      </div>
    );
  }

  const { site, health, install } = data;
  const isLive = site.stage === 'live';
  const hasMonitoring = !!site.ruijie_device_sn;
  const address = formatSiteStreet(site);
  const showInstallFacts = site.stage === 'visit_booked' || site.stage === 'installing';

  return (
    <PortalModernistShell className="space-y-6">
      <PageHeader
        eyebrow={
          formatSiteCode(site) ? `Network · ${formatSiteCode(site)}` : 'Network · Site'
        }
        title={formatClinicShortName(site.site_name)}
        subtitle={address || undefined}
        actions={
          <>
            {isUnjani && <StageBadge stage={site.stage} />}
            {!isSiteUser && (
              <Link href={href('/sites')}>
                <PmButton variant="ghost">Back to sites</PmButton>
              </Link>
            )}
          </>
        }
      />

      {isUnjani && (
        <>
          <ClinicNowCard stage={site.stage} visitDate={install?.visit_date} />
          <OnboardingStepper stage={site.stage} />
          <ClinicPlacePeople
            address={address}
            province={site.province}
            lat={site.lat}
            lng={site.lng}
            contactName={site.site_contact_name}
            contactPhone={site.site_contact_phone}
            contactEmail={site.site_contact_email}
          />
        </>
      )}

      {isLive && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              icon={<PiHeartbeatBold className="w-6 h-6" />}
              label="Health Score"
              value={health ? `${health.health_score}%` : 'N/A'}
              color={
                health && health.health_score >= 80
                  ? 'green'
                  : health && health.health_score >= 50
                    ? 'orange'
                    : 'gray'
              }
            />
          </div>

          {!hasMonitoring && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
              Automated monitoring is not available for this site (MTN LTE). Status is updated manually.
            </div>
          )}

          {hasMonitoring && <HealthTrendChart siteId={siteId} />}

          {isUnjani && <StaffWifiUsageChart siteId={siteId} />}
        </>
      )}

      <div className="bg-white rounded-xl border p-4">
        <h2
          className="text-[10px] font-extrabold tracking-[0.08em] uppercase mb-3"
          style={{ color: 'var(--pm-navy)' }}
        >
          Site Information
        </h2>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 text-sm">
          <InfoRow label="Technology" value={formatTechnology(site.technology)} />
          <InfoRow label="Site Code" value={site.site_code} />
          <InfoRow label="Monthly fee" value={formatZar(site.monthly_fee)} />
          {!isUnjani && <InfoRow label="Contact" value={site.site_contact_name} />}
          {!isUnjani && <InfoRow label="Phone" value={site.site_contact_phone} />}
          {!isUnjani && <InfoRow label="Email" value={site.site_contact_email} />}
          {showInstallFacts && (
            <InfoRow label="Visit date" value={install?.visit_date || 'Visit date not booked yet'} />
          )}
          {showInstallFacts && install?.stock_status && (
            <InfoRow label="Kit" value={install.stock_status === 'reserved' ? 'Assigned' : install.stock_status} />
          )}
          <InfoRow label="Job card" value={site.job_card_number} />
          {site.rfi_notes && <InfoRow label="Notes" value={site.rfi_notes} />}
        </dl>
      </div>

      <div>
        <Link href={href('/support')}>
          <PmButton variant="cta">Raise support ticket</PmButton>
        </Link>
      </div>
    </PortalModernistShell>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: string;
}) {
  const colorMap: Record<string, string> = {
    green: 'bg-green-50 text-green-600',
    orange: 'bg-orange-50 text-orange-600',
    gray: 'bg-gray-50 text-gray-600',
  };

  return (
    <div className="bg-white rounded-xl border p-4">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorMap[color] ?? colorMap.gray}`}>
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-sm text-gray-500">{label}</p>
          <p className="text-xl font-bold text-gray-900 break-words">{value}</p>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div>
      <dt className="text-gray-500">{label}</dt>
      <dd className="font-medium text-gray-900 break-words">{value}</dd>
    </div>
  );
}
