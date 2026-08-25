'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePortalAuth } from '@/lib/portal/portal-auth-provider';
import { usePortalApp } from '@/lib/portal/portal-app-context';
import {
  PortalModernistShell,
  PageHeader,
  RuledTable,
  PmButton,
} from '@/components/portal/modernist/PortalModernistShell';
import {
  INVITABLE_HQ_ROLES,
  isPortalRole,
  roleLabel,
  type InvitableHqRole,
  type PortalRole,
} from '@/lib/portal/access-templates';

interface TeamMember {
  id: string;
  display_name: string;
  email: string;
  role: PortalRole;
  created_at: string;
}

export default function PortalTeamPage() {
  const { user, isAdmin, loading: authLoading } = usePortalAuth();
  const { href } = usePortalApp();
  const router = useRouter();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState<InvitableHqRole>('finance');

  useEffect(() => {
    if (authLoading) return;
    if (!isAdmin) {
      router.replace(href('/'));
      return;
    }

    fetch('/api/portal/team')
      .then((r) => r.json())
      .then((teamData) => {
        if (teamData.error) setError(teamData.error);
        setMembers(teamData.portalUsers ?? []);
      })
      .catch(() => setError('Failed to load team'))
      .finally(() => setLoading(false));
  }, [authLoading, isAdmin, router, href]);

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
          role,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Invite failed');
      setMembers((prev) => [data.portalUser, ...prev]);
      const sentNote = data.invited
        ? `Invite sent to ${email}`
        : `${displayName} added to the portal`;
      setSuccess(data.emailWarning ? `${sentNote}. ${data.emailWarning}` : sentNote);
      setEmail('');
      setDisplayName('');
      setRole('finance');
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
        subtitle="One Super User. Invite Unjani NPC colleagues with a Finance, Operations, or Viewer role. Portal access does not extend to clinic sites."
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
          Invite HQ user
        </p>
        <div className="grid sm:grid-cols-3 gap-3">
          <input
            required
            type="text"
            placeholder="Display name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="min-h-11 px-3 py-2 text-sm bg-white"
            style={{ border: '1px solid var(--pm-divider)', color: 'var(--pm-body)' }}
          />
          <input
            required
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="min-h-11 px-3 py-2 text-sm bg-white"
            style={{ border: '1px solid var(--pm-divider)', color: 'var(--pm-body)' }}
          />
          <select
            required
            value={role}
            onChange={(e) => setRole(e.target.value as InvitableHqRole)}
            className="min-h-11 px-3 py-2 text-sm bg-white"
            style={{ border: '1px solid var(--pm-divider)', color: 'var(--pm-body)' }}
          >
            {INVITABLE_HQ_ROLES.map((value) => (
              <option key={value} value={value}>
                {roleLabel(value)}
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
        <RuledTable headers={['Name', 'Email', 'Role', 'Actions']}>
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
                {isPortalRole(m.role) ? roleLabel(m.role) : m.role}
              </td>
              <td className="px-4 py-3">
                {m.role !== 'admin' && (
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
