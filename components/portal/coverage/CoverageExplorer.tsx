'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import {
  AlertBand,
  PmButton,
  RuledTable,
} from '@/components/portal/modernist/PortalModernistShell';
import {
  clinicKey,
  contactForClinic,
  coverageKpis,
  isInPipeline,
  recommendedAccess,
  recommendedLabel,
  type AccessTech,
  type CoverageCheckRow,
} from '@/lib/portal/coverage-summary';
import { formatClinicShortName } from '@/lib/portal/site-format';
import { usePortalAuth } from '@/lib/portal/portal-auth-provider';
import type { CoverageLayer } from './PortalCoverageMap';

const PortalCoverageMap = dynamic(() => import('./PortalCoverageMap'), {
  ssr: false,
  loading: () => (
    <div
      className="flex h-[min(55dvh,380px)] items-center justify-center text-sm sm:h-[480px] lg:h-[520px]"
      style={{ color: 'var(--pm-body)' }}
    >
      Loading map…
    </div>
  ),
});

const KPI_CARDS: Array<{
  tech: AccessTech;
  label: string;
  note: string;
  accent: string;
  key: 'fixedWireless' | 'fiveG' | 'fourG';
}> = [
  {
    tech: 'fixed_wireless',
    label: 'Fixed wireless',
    note: 'Tarana 50 Mbps',
    accent: '#2563C9',
    key: 'fixedWireless',
  },
  {
    tech: '5g',
    label: '5G',
    note: 'Where no Tarana',
    accent: '#0F766E',
    key: 'fiveG',
  },
  {
    tech: '4g',
    label: '4G',
    note: 'Last resort, uncapped',
    accent: '#DC2626',
    key: 'fourG',
  },
];

function locationLabel(check: CoverageCheckRow): string {
  const province = check.results?.province;
  const district = check.results?.district;
  if (district && province) return `${district}, ${province}`;
  if (province) return province;
  return check.address;
}

function availability(ok: boolean | undefined): string {
  return ok ? 'Available' : 'Not available';
}

const PAGE_SIZE = 10;

type SiteContact = { name: string; phone: string; email: string };

export default function CoverageExplorer() {
  const { user } = usePortalAuth();
  const [checks, setChecks] = useState<CoverageCheckRow[]>([]);
  const [pipelineKeys, setPipelineKeys] = useState<string[]>([]);
  const [pipelineContacts, setPipelineContacts] = useState<
    Record<string, SiteContact>
  >({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [query, setQuery] = useState('');
  const [province, setProvince] = useState('all');
  const [techFilter, setTechFilter] = useState<AccessTech | 'all'>('all');
  const [includePipeline, setIncludePipeline] = useState(false);
  const [page, setPage] = useState(1);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [picked, setPicked] = useState<{
    lat: number;
    lng: number;
    address: string;
  } | null>(null);
  const [clinicName, setClinicName] = useState('');
  const [nominatedAddress, setNominatedAddress] = useState('');
  const [layer, setLayer] = useState<CoverageLayer>('all');
  const [running, setRunning] = useState(false);

  const [showOnboard, setShowOnboard] = useState(false);
  const [contactName, setContactName] = useState('');
  const [contactMobile, setContactMobile] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch('/api/portal/coverage')
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setChecks(data.checks ?? []);
        setPipelineKeys(data.pipelineClinicKeys ?? []);
        setPipelineContacts(data.pipelineContacts ?? {});
      })
      .catch((err) =>
        setError(err instanceof Error ? err.message : 'Could not load coverage')
      )
      .finally(() => setLoading(false));
  }, []);

  const provinces = useMemo(() => {
    const set = new Set<string>();
    for (const check of checks) {
      if (check.results?.province) set.add(check.results.province);
    }
    return [...set].sort();
  }, [checks]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return checks.filter((check) => {
      if (!includePipeline && isInPipeline(check.clinic_name, pipelineKeys)) {
        return false;
      }
      if (province !== 'all' && check.results?.province !== province) return false;
      const rec = recommendedAccess(check.results);
      if (techFilter !== 'all' && rec !== techFilter) return false;
      if (!q) return true;
      const hay = `${check.clinic_name ?? ''} ${check.address} ${check.results?.site_id ?? ''}`.toLowerCase();
      return hay.includes(q);
    });
  }, [checks, includePipeline, pipelineKeys, province, query, techFilter]);

  useEffect(() => {
    setPage(1);
  }, [query, province, techFilter, includePipeline]);

  const totalPages = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paged = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return visible.slice(start, start + PAGE_SIZE);
  }, [visible, currentPage]);

  const kpis = useMemo(() => coverageKpis(visible), [visible]);
  const selected = checks.find((c) => c.id === selectedId) ?? null;
  const selectedIsNew = Boolean(picked && !selected);

  const mapClinics = useMemo(
    () =>
      visible.map((check) => ({
        id: check.id,
        label: formatClinicShortName(check.clinic_name),
        lat: check.latitude,
        lng: check.longitude,
      })),
    [visible]
  );

  const selectedMapClinic = selected
    ? {
        id: selected.id,
        label: formatClinicShortName(selected.clinic_name),
        lat: selected.latitude,
        lng: selected.longitude,
      }
    : picked
      ? { id: 'picked', label: 'New address', lat: picked.lat, lng: picked.lng }
      : null;

  const onPickLocation = useCallback(
    (coords: { lat: number; lng: number }, address: string) => {
      const match = checks.find(
        (c) =>
          Math.abs(c.latitude - coords.lat) < 0.0004 &&
          Math.abs(c.longitude - coords.lng) < 0.0004
      );
      if (match) {
        setSelectedId(match.id);
        setPicked(null);
        setClinicName(match.clinic_name ?? '');
        return;
      }
      setSelectedId(null);
      setPicked({ ...coords, address });
      setClinicName('');
    },
    [checks]
  );

  function openNomination(check: CoverageCheckRow) {
    const site = contactForClinic(check.clinic_name, pipelineContacts);
    setSelectedId(check.id);
    setPicked(null);
    setClinicName(check.clinic_name ?? '');
    setNominatedAddress(check.address);
    setContactName(site?.name || user?.display_name || '');
    setContactMobile(site?.phone || '');
    setContactEmail(site?.email || user?.email || '');
    setNotes(
      `Recommended: ${recommendedLabel(recommendedAccess(check.results))}`
    );
    setShowOnboard(true);
  }

  async function runCoverageCheck() {
    if (!picked) return;
    setRunning(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch('/api/portal/coverage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          latitude: picked.lat,
          longitude: picked.lng,
          address: picked.address,
          clinic_name: clinicName.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Coverage check failed');
      setChecks((prev) => [data.check, ...prev]);
      setPicked(null);
      openNomination(data.check);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Coverage check failed');
    } finally {
      setRunning(false);
    }
  }

  async function proceedOnboard(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;
    setSubmitting(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch('/api/portal/coverage/onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          coverage_check_id: selected.id,
          clinic_name:
            clinicName.trim() || selected.clinic_name || 'New clinic',
          address: nominatedAddress.trim() || selected.address,
          contact_name: contactName.trim(),
          contact_mobile: contactMobile.trim(),
          contact_email: contactEmail.trim() || undefined,
          notes: notes.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit onboarding request');
      setSuccess(
        `Onboarding request submitted (ticket ${String(data.ticket.id).slice(0, 8)}…). CircleTel will coordinate installation.`
      );
      setShowOnboard(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submit failed');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="py-16 text-center text-sm" style={{ color: 'var(--pm-body)' }}>
        Loading coverage…
      </div>
    );
  }

  return (
    <div>
      {error && (
        <p className="mt-4 text-sm font-medium" style={{ color: '#DC2626' }}>
          {error}
        </p>
      )}
      {success && <AlertBand>{success}</AlertBand>}

      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {KPI_CARDS.map((card) => {
          const on = techFilter === card.tech;
          return (
            <button
              key={card.tech}
              type="button"
              onClick={() => setTechFilter(on ? 'all' : card.tech)}
              className="rounded-xl bg-white px-4 py-4 text-left shadow-sm ring-1 ring-black/[0.06] transition-opacity hover:opacity-90"
              style={{ borderBottom: `3px solid ${card.accent}` }}
            >
              <p
                className="text-[10px] font-extrabold tracking-[0.08em] uppercase"
                style={{ color: 'var(--pm-navy)' }}
              >
                {card.label}
              </p>
              <p
                className="mt-1 text-2xl font-extrabold tabular-nums"
                style={{ color: 'var(--pm-navy)' }}
              >
                {kpis[card.key]}
              </p>
              <p className="mt-1 text-xs" style={{ color: '#6B7280' }}>
                {card.note}
              </p>
            </button>
          );
        })}
      </div>

      <div
        className="mt-6 overflow-hidden rounded-xl bg-white"
        style={{ border: '1px solid var(--pm-divider)' }}
      >
        <PortalCoverageMap
          selected={selectedMapClinic}
          clinics={mapClinics}
          activeLayer={layer}
          onLayerChange={setLayer}
          onSelectClinic={setSelectedId}
          onPickLocation={onPickLocation}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(280px,1fr)]">
        <section>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search clinics"
              className="min-h-11 w-full flex-1 rounded-lg bg-white px-3 py-2 text-sm"
              style={{ border: '1px solid var(--pm-divider)', color: 'var(--pm-navy)' }}
            />
            <select
              value={province}
              onChange={(e) => setProvince(e.target.value)}
              className="min-h-11 w-full rounded-lg bg-white px-3 py-2 text-sm sm:w-auto"
              style={{ border: '1px solid var(--pm-divider)', color: 'var(--pm-navy)' }}
            >
              <option value="all">All provinces</option>
              {provinces.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
            <select
              value={techFilter}
              onChange={(e) => setTechFilter(e.target.value as AccessTech | 'all')}
              className="min-h-11 w-full rounded-lg bg-white px-3 py-2 text-sm sm:w-auto"
              style={{ border: '1px solid var(--pm-divider)', color: 'var(--pm-navy)' }}
            >
              <option value="all">All technologies</option>
              <option value="fixed_wireless">Fixed wireless</option>
              <option value="5g">5G</option>
              <option value="4g">4G</option>
            </select>
          </div>
          <label className="mt-3 flex items-center gap-2 text-sm" style={{ color: 'var(--pm-body)' }}>
            <input
              type="checkbox"
              checked={includePipeline}
              onChange={(e) => setIncludePipeline(e.target.checked)}
            />
            Include clinics already in the pipeline
          </label>

          <p
            className="mt-6 text-[10px] font-extrabold tracking-[0.08em] uppercase"
            style={{ color: 'var(--pm-navy)' }}
          >
            {visible.length} clinic{visible.length === 1 ? '' : 's'}
            {visible.length > 0 && (
              <span className="ml-2 font-semibold normal-case tracking-normal opacity-70">
                · {currentPage} of {totalPages}
              </span>
            )}
          </p>

          <RuledTable
            headers={['Clinic', 'Location', 'Recommended', '']}
            className="mt-3 rounded-xl shadow-sm ring-1 ring-black/[0.06]"
          >
            {paged.map((check) => {
              const rec = recommendedAccess(check.results);
              const on = check.id === selectedId;
              return (
                <tr
                  key={check.id}
                  onClick={() => {
                    setSelectedId(check.id);
                    setPicked(null);
                    setClinicName(check.clinic_name ?? '');
                  }}
                  className="cursor-pointer"
                  style={{
                    borderBottom: '1px solid var(--pm-divider)',
                    background: on ? 'color-mix(in srgb, #13274A 6%, #FFFFFF)' : undefined,
                  }}
                >
                  <td className="px-4 py-3">
                    <span className="block font-extrabold" style={{ color: 'var(--pm-navy)' }}>
                      {formatClinicShortName(check.clinic_name)}
                    </span>
                    <span className="text-xs" style={{ color: '#6B7280' }}>
                      {check.results?.site_id ?? clinicKey(check.clinic_name)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm" style={{ color: 'var(--pm-body)' }}>
                    {locationLabel(check)}
                  </td>
                  <td className="px-4 py-3 text-sm" style={{ color: 'var(--pm-body)' }}>
                    {recommendedLabel(rec)}
                  </td>
                  <td className="px-4 py-3">
                    <PmButton
                      variant="cta"
                      className="whitespace-nowrap"
                      onClick={(e) => {
                        e.stopPropagation();
                        openNomination(check);
                      }}
                    >
                      Nominate
                    </PmButton>
                  </td>
                </tr>
              );
            })}
          </RuledTable>

          {totalPages > 1 && (
            <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs" style={{ color: '#6B7280' }}>
                Showing {(currentPage - 1) * PAGE_SIZE + 1}–
                {Math.min(currentPage * PAGE_SIZE, visible.length)} of {visible.length}
              </p>
              <div className="flex items-center gap-2">
                <PmButton
                  variant="secondary"
                  disabled={currentPage <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </PmButton>
                <PmButton
                  variant="secondary"
                  disabled={currentPage >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  Next
                </PmButton>
              </div>
            </div>
          )}
        </section>

        <aside className="space-y-4">
          {selected ? (
            <div
              className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-black/[0.06]"
            >
              <p
                className="text-[10px] font-extrabold tracking-[0.08em] uppercase mb-2"
                style={{ color: 'var(--pm-navy)' }}
              >
                Site
              </p>
              <p className="text-lg font-extrabold" style={{ color: 'var(--pm-navy)' }}>
                {formatClinicShortName(selected.clinic_name)}
              </p>
              <p className="mt-1 text-sm" style={{ color: 'var(--pm-body)' }}>
                {selected.address}
              </p>
              <p className="mt-2 text-xs" style={{ color: '#059669' }}>
                Location: {selected.latitude.toFixed(6)}, {selected.longitude.toFixed(6)}
              </p>
              <ul className="mt-4 space-y-1 text-sm" style={{ color: 'var(--pm-body)' }}>
                <li>
                  Fixed wireless — {availability(selected.results?.tarana?.feasible)}
                </li>
                <li>5G — {availability(selected.results?.five_g?.available)}</li>
                <li>4G — {availability(selected.results?.lte?.available)}</li>
              </ul>
              <p className="mt-3 text-sm font-extrabold" style={{ color: 'var(--pm-navy)' }}>
                Recommended: {recommendedLabel(recommendedAccess(selected.results))}
              </p>
              <div className="mt-4">
                <PmButton variant="cta" onClick={() => openNomination(selected)}>
                  Nominate clinic
                </PmButton>
              </div>
            </div>
          ) : selectedIsNew && picked ? (
            <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-black/[0.06]">
              <p
                className="text-[10px] font-extrabold tracking-[0.08em] uppercase mb-2"
                style={{ color: 'var(--pm-navy)' }}
              >
                New address
              </p>
              <p className="text-sm" style={{ color: 'var(--pm-body)' }}>
                {picked.address}
              </p>
              <p className="mt-2 text-xs" style={{ color: '#059669' }}>
                Location: {picked.lat.toFixed(6)}, {picked.lng.toFixed(6)}
              </p>
              <input
                value={clinicName}
                onChange={(e) => setClinicName(e.target.value)}
                placeholder="Clinic name (optional)"
                className="mt-3 min-h-11 w-full rounded-lg px-3 py-2 text-sm"
                style={{ border: '1px solid var(--pm-divider)' }}
              />
              <div className="mt-3">
                <PmButton onClick={runCoverageCheck} disabled={running}>
                  {running ? 'Checking…' : 'Check this address'}
                </PmButton>
              </div>
            </div>
          ) : (
            <div className="rounded-xl bg-white p-4 text-sm shadow-sm ring-1 ring-black/[0.06]" style={{ color: 'var(--pm-body)' }}>
              Click a clinic in the list, or search / tap the map to check a new address.
            </div>
          )}
        </aside>
      </div>

      {showOnboard && selected && (
        <form
          onSubmit={proceedOnboard}
          className="mt-6 space-y-3 rounded-xl bg-white p-4"
          style={{ border: '2px solid var(--pm-divider)' }}
        >
          <p
            className="text-[10px] font-extrabold tracking-[0.08em] uppercase"
            style={{ color: 'var(--pm-navy)' }}
          >
            Nominate clinic
          </p>
          <p className="text-sm" style={{ color: 'var(--pm-body)' }}>
            Sends an onboarding request to CircleTel with coverage findings. No banking details required. You can edit any field before submitting.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              required
              placeholder="Clinic name"
              value={clinicName}
              onChange={(e) => setClinicName(e.target.value)}
              className="min-h-11 px-3 py-2 text-sm"
              style={{ border: '1px solid var(--pm-divider)' }}
            />
            <input
              required
              placeholder="Service address"
              value={nominatedAddress}
              onChange={(e) => setNominatedAddress(e.target.value)}
              className="min-h-11 px-3 py-2 text-sm"
              style={{ border: '1px solid var(--pm-divider)' }}
            />
            <input
              required
              placeholder="On-site contact name"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              className="min-h-11 px-3 py-2 text-sm"
              style={{ border: '1px solid var(--pm-divider)' }}
            />
            <input
              required
              placeholder="Contact mobile"
              value={contactMobile}
              onChange={(e) => setContactMobile(e.target.value)}
              className="min-h-11 px-3 py-2 text-sm"
              style={{ border: '1px solid var(--pm-divider)' }}
            />
            <input
              type="email"
              placeholder="Contact email (optional)"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              className="min-h-11 px-3 py-2 text-sm"
              style={{ border: '1px solid var(--pm-divider)' }}
            />
            <input
              placeholder="Notes (optional)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-11 px-3 py-2 text-sm"
              style={{ border: '1px solid var(--pm-divider)' }}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <PmButton type="submit" variant="cta" disabled={submitting}>
              {submitting ? 'Submitting…' : 'Submit onboarding request'}
            </PmButton>
            <PmButton type="button" variant="ghost" onClick={() => setShowOnboard(false)}>
              Cancel
            </PmButton>
          </div>
        </form>
      )}
    </div>
  );
}
