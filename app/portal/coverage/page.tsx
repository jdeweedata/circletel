'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { usePortalAuth } from '@/lib/portal/portal-auth-provider';
import {
  PortalModernistShell,
  PageHeader,
  PmButton,
  AlertBand,
} from '@/components/portal/modernist/PortalModernistShell';

const CoverageMap = dynamic(
  () => import('@/components/coverage/CoverageMap'),
  {
    ssr: false,
    loading: () => (
      <div className="h-[420px] flex items-center justify-center text-sm" style={{ color: 'var(--pm-body)' }}>
        Loading map…
      </div>
    ),
  }
);

interface CoverageCheck {
  id: string;
  clinic_name: string | null;
  address: string;
  latitude: number;
  longitude: number;
  results: {
    summary?: { tarana?: string; '5g_lte'?: string };
    tarana?: { feasible?: boolean };
    lte?: { available?: boolean };
    five_g?: { available?: boolean };
  };
  created_at: string;
}

export default function PortalCoveragePage() {
  const { user, isAdmin, loading: authLoading } = usePortalAuth();
  const router = useRouter();

  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [address, setAddress] = useState('');
  const [clinicName, setClinicName] = useState('');
  const [running, setRunning] = useState(false);
  const [latest, setLatest] = useState<CoverageCheck | null>(null);
  const [history, setHistory] = useState<CoverageCheck[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [showOnboard, setShowOnboard] = useState(false);
  const [contactName, setContactName] = useState('');
  const [contactMobile, setContactMobile] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!isAdmin) {
      router.replace('/portal');
      return;
    }
    fetch('/api/portal/coverage')
      .then((r) => r.json())
      .then((data) => setHistory(data.checks ?? []))
      .catch(console.error);
  }, [authLoading, isAdmin, router]);

  const onLocationSelect = useCallback(
    (coordinates: { lat: number; lng: number }, addr?: string) => {
      setCoords(coordinates);
      if (addr) setAddress(addr);
    },
    []
  );

  if (!user || !isAdmin) return null;

  async function runCoverageCheck() {
    if (!coords || !address.trim()) {
      setError('Select a location on the map and confirm the address');
      return;
    }
    setRunning(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch('/api/portal/coverage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          latitude: coords.lat,
          longitude: coords.lng,
          address: address.trim(),
          clinic_name: clinicName.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Coverage check failed');
      setLatest(data.check);
      setHistory((prev) => [data.check, ...prev]);
      setShowOnboard(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Coverage check failed');
    } finally {
      setRunning(false);
    }
  }

  async function proceedOnboard(e: React.FormEvent) {
    e.preventDefault();
    if (!latest) return;
    setSubmitting(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch('/api/portal/coverage/onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          coverage_check_id: latest.id,
          clinic_name: clinicName.trim() || latest.clinic_name || 'New clinic',
          address: address.trim() || latest.address,
          contact_name: contactName.trim(),
          contact_mobile: contactMobile.trim(),
          contact_email: contactEmail.trim() || undefined,
          notes: notes.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit onboarding request');
      setSuccess(
        `Onboarding request submitted (ticket ${data.ticket.id.slice(0, 8)}…). CircleTel will coordinate installation after confirmation with the clinic.`
      );
      setShowOnboard(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submit failed');
    } finally {
      setSubmitting(false);
    }
  }

  const summary = latest?.results?.summary;

  return (
    <PortalModernistShell>
      <PageHeader
        eyebrow="Connectivity · Feasibility"
        title="Coverage check"
        subtitle="Desktop research for new clinics (PDF steps 1–3). Tarana/FWB + 5G/LTE — then proceed to nominate for install."
      />

      {error && (
        <p className="mt-4 text-sm font-medium" style={{ color: '#DC2626' }}>
          {error}
        </p>
      )}
      {success && (
        <AlertBand>{success}</AlertBand>
      )}

      <div className="mt-6 grid lg:grid-cols-3 gap-0" style={{ border: '2px solid var(--pm-divider)' }}>
        <div className="lg:col-span-2">
          <CoverageMap
            onLocationSelect={onLocationSelect}
            showAddressSearch
            showCoverageControls
            height="420px"
          />
        </div>
        <div className="p-4 space-y-3 bg-white" style={{ borderLeft: '1px solid var(--pm-divider)' }}>
          <p
            className="text-[10px] font-extrabold tracking-[0.08em] uppercase"
            style={{ color: 'var(--pm-navy)' }}
          >
            Check details
          </p>
          <input
            type="text"
            placeholder="Clinic name"
            value={clinicName}
            onChange={(e) => setClinicName(e.target.value)}
            className="w-full px-3 py-2 text-sm"
            style={{ border: '1px solid var(--pm-divider)' }}
          />
          <textarea
            placeholder="Service address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 text-sm"
            style={{ border: '1px solid var(--pm-divider)' }}
          />
          {coords && (
            <p className="text-xs" style={{ color: 'var(--pm-body)' }}>
              Pin: {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
            </p>
          )}
          <PmButton onClick={runCoverageCheck} disabled={running || !coords}>
            {running ? 'Checking…' : 'Run coverage check'}
          </PmButton>

          {latest && summary && (
            <div
              className="mt-4 p-3 space-y-2"
              style={{ border: '1px solid var(--pm-divider)', background: 'var(--pm-surface)' }}
            >
              <p className="text-sm font-extrabold" style={{ color: 'var(--pm-navy)' }}>
                Results
              </p>
              <p className="text-sm" style={{ color: 'var(--pm-body)' }}>
                Tarana — {summary.tarana}
              </p>
              <p className="text-sm" style={{ color: 'var(--pm-body)' }}>
                5G/LTE — {summary['5g_lte']}
              </p>
              <PmButton variant="secondary" onClick={() => setShowOnboard(true)}>
                Proceed to onboard
              </PmButton>
            </div>
          )}
        </div>
      </div>

      {showOnboard && latest && (
        <form
          onSubmit={proceedOnboard}
          className="mt-6 p-4 space-y-3 bg-white"
          style={{ border: '2px solid var(--pm-divider)' }}
        >
          <p
            className="text-[10px] font-extrabold tracking-[0.08em] uppercase"
            style={{ color: 'var(--pm-navy)' }}
          >
            Nominate clinic (confirm details)
          </p>
          <p className="text-sm" style={{ color: 'var(--pm-body)' }}>
            Sends an onboarding request to CircleTel with coverage findings. No banking details required.
          </p>
          <div className="grid sm:grid-cols-2 gap-3">
            <input
              required
              placeholder="On-site contact name"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              className="px-3 py-2 text-sm"
              style={{ border: '1px solid var(--pm-divider)' }}
            />
            <input
              required
              placeholder="Contact mobile"
              value={contactMobile}
              onChange={(e) => setContactMobile(e.target.value)}
              className="px-3 py-2 text-sm"
              style={{ border: '1px solid var(--pm-divider)' }}
            />
            <input
              type="email"
              placeholder="Contact email (optional)"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              className="px-3 py-2 text-sm"
              style={{ border: '1px solid var(--pm-divider)' }}
            />
            <input
              placeholder="Notes (optional)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="px-3 py-2 text-sm"
              style={{ border: '1px solid var(--pm-divider)' }}
            />
          </div>
          <div className="flex gap-2">
            <PmButton type="submit" disabled={submitting}>
              {submitting ? 'Submitting…' : 'Submit onboarding request'}
            </PmButton>
            <PmButton type="button" variant="ghost" onClick={() => setShowOnboard(false)}>
              Cancel
            </PmButton>
          </div>
        </form>
      )}

      {history.length > 0 && (
        <div className="mt-8">
          <p
            className="text-[10px] font-extrabold tracking-[0.08em] uppercase mb-3"
            style={{ color: 'var(--pm-navy)' }}
          >
            Recent checks
          </p>
          <ul className="space-y-2">
            {history.slice(0, 10).map((c) => (
              <li
                key={c.id}
                className="px-4 py-3 text-sm bg-white"
                style={{ border: '1px solid var(--pm-divider)' }}
              >
                <span className="font-extrabold" style={{ color: 'var(--pm-navy)' }}>
                  {c.clinic_name || 'Untitled'}
                </span>
                {' — '}
                {c.address}
                <span className="block text-xs mt-1 opacity-70">
                  Tarana: {c.results?.summary?.tarana ?? 'n/a'} · 5G/LTE:{' '}
                  {c.results?.summary?.['5g_lte'] ?? 'n/a'} ·{' '}
                  {new Date(c.created_at).toLocaleString('en-ZA')}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </PortalModernistShell>
  );
}
