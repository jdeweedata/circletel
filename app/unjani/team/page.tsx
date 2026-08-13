'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePortalAuth } from '@/lib/portal/portal-auth-provider';
import {
  PortalModernistShell,
  PageHeader,
  RuledTable,
  PmButton,
} from '@/components/portal/modernist/PortalModernistShell';

interface Site {
  id: string;
  site_name: string;
}

interface TeamMember {
  id: string;
  display_name: string;
  email: string;
  role: 'admin' | 'site_user';
  site_id: string | null;
  created_at: string;
  corporate_sites: { id: string; site_name: string } | null;
}

export default function PortalTeamPage() {
  const { user, isAdmin, loading: authLoading } = usePortalAuth();
  const router = useRouter();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [siteId, setSiteId] = useState('');

  useEffect(() => {
    if (authLoading) return;
    if (!isAdmin) {
      router.replace('/unjani');
      return;
    }

    Promise.all([
      fetch('/api/portal/team').then((r) => r.json()),
      fetch('/api/portal/sites').then((r) => r.json()),
    ])
      .then(([teamData, siteData]) => {
        if (teamData.error) setError(teamData.error);
        setMembers(teamData.portalUsers ?? []);
        setSites(siteData.sites ?? []);
      })
      .catch(() => setError('Failed to load team'))
      .finally(() => setLoading(false));
  }, [authLoading, isAdmin, router]);

  if (!user || !isAdmin) return null;

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch('/api/portal/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          display_name: displayName,
          site_id: siteId,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Invite failed');
      setMembers((prev) => [data.portalUser, ...prev]);
      setSuccess(
        data.invited
          ? `Invite sent to ${email}`
          : `${displayName} added to the portal`
      );
      setEmail('');
      setDisplayName('');
      setSiteId('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invite failed');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRemove(member: TeamMember) {
    if (!confirm(`Remove ${member.display_name} from the portal?`)) return;
    setError('');
    const res = await fetch(`/api/portal/team/${member.id}`, { method: 'DELETE' });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'Remove failed');
      return;
    }
    setMembers((prev) => prev.filter((m) => m.id !== member.id));
    setSuccess(`${member.display_name} removed`);
  }

  return (
    <PortalModernistShell>
      <PageHeader
        eyebrow="Organisation · Access"
        title="Team"
        subtitle="One Super User per organisation. Invite site users (e.g. clinic nurses) for their assigned site."
      />

      {error && (
        <p className="mt-4 text-sm font-medium" style={{ color: '#DC2626' }}>
          {error}
        </p>
      )}
      {success && (
        <p className="mt-4 text-sm font-medium" style={{ color: '#059669' }}>
          {success}
        </p>
      )}

      <form
        onSubmit={handleInvite}
        className="mt-6 p-4 space-y-4 bg-white"
        style={{ border: '2px solid var(--pm-divider)' }}
      >
        <p
          className="text-[10px] font-extrabold tracking-[0.08em] uppercase"
          style={{ color: 'var(--pm-navy)' }}
        >
          Invite site user
        </p>
        <div className="grid sm:grid-cols-3 gap-3">
          <input
            required
            type="text"
            placeholder="Display name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="px-3 py-2 text-sm bg-white"
            style={{ border: '1px solid var(--pm-divider)', color: 'var(--pm-body)' }}
          />
          <input
            required
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="px-3 py-2 text-sm bg-white"
            style={{ border: '1px solid var(--pm-divider)', color: 'var(--pm-body)' }}
          />
          <select
            required
            value={siteId}
            onChange={(e) => setSiteId(e.target.value)}
            className="px-3 py-2 text-sm bg-white"
            style={{ border: '1px solid var(--pm-divider)', color: 'var(--pm-body)' }}
          >
            <option value="">Select site…</option>
            {sites.map((s) => (
              <option key={s.id} value={s.id}>
                {s.site_name}
              </option>
            ))}
          </select>
        </div>
        <PmButton type="submit" disabled={submitting}>
          {submitting ? 'Sending…' : 'Send invite'}
        </PmButton>
      </form>

      {loading ? (
        <div className="py-16 text-center text-sm" style={{ color: 'var(--pm-body)' }}>
          Loading team…
        </div>
      ) : (
        <RuledTable headers={['Name', 'Email', 'Role', 'Site', 'Actions']}>
          {members.map((m) => (
            <tr
              key={m.id}
              style={{ borderBottom: '1px solid var(--pm-divider)' }}
            >
              <td className="px-4 py-3 font-medium" style={{ color: 'var(--pm-navy)' }}>
                {m.display_name}
              </td>
              <td className="px-4 py-3" style={{ color: 'var(--pm-body)' }}>
                {m.email}
              </td>
              <td className="px-4 py-3" style={{ color: 'var(--pm-body)' }}>
                {m.role === 'admin' ? 'Super User' : 'Site User'}
              </td>
              <td className="px-4 py-3" style={{ color: 'var(--pm-body)' }}>
                {m.corporate_sites?.site_name ?? '—'}
              </td>
              <td className="px-4 py-3">
                {m.role === 'site_user' && (
                  <PmButton variant="ghost" onClick={() => handleRemove(m)}>
                    Remove
                  </PmButton>
                )}
              </td>
            </tr>
          ))}
        </RuledTable>
      )}
    </PortalModernistShell>
  );
}
