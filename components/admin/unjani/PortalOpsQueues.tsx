'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import {
  PiCheckCircleBold,
  PiMapPinBold,
  PiPaperPlaneTiltBold,
  PiTicketBold,
} from 'react-icons/pi';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { EmptyState, SectionCard } from '@/components/backend';
import type { ActivationRow, NominationRow } from '@/lib/admin/unjani-portal-ops';
import { activationSteps } from '@/lib/admin/unjani-portal-ops';

interface PortalOpsQueuesProps {
  tab: 'nominations' | 'activations';
  nominations: NominationRow[];
  activations: ActivationRow[];
  organisationId: string | null;
  authHeaders: () => Record<string, string>;
  onRegisterNomination: (row: NominationRow) => void;
  onSendLink: (clinicName: string) => void;
  onRefresh: () => Promise<void>;
}

export function PortalOpsQueues({
  tab,
  nominations,
  activations,
  organisationId,
  authHeaders,
  onRegisterNomination,
  onSendLink,
  onRefresh,
}: PortalOpsQueuesProps) {
  const [activating, setActivating] = useState<ActivationRow | null>(null);
  const [activateTechnology, setActivateTechnology] = useState('lte_5g');
  const [activateInstallDate, setActivateInstallDate] = useState('');
  const [activateInstaller, setActivateInstaller] = useState('');
  const [activateWholesaleRef, setActivateWholesaleRef] = useState('');
  const [activateNotes, setActivateNotes] = useState('');
  const [busy, setBusy] = useState(false);

  const resetActivate = () => {
    setActivating(null);
    setActivateTechnology('lte_5g');
    setActivateInstallDate('');
    setActivateInstaller('');
    setActivateWholesaleRef('');
    setActivateNotes('');
  };

  const activateSite = async () => {
    if (!activating) return;
    setBusy(true);
    try {
      const steps = activationSteps(activating.siteStatus);
      if (steps.length === 0) {
        const res = await fetch('/api/admin/unjani/portal-ops', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...authHeaders() },
          body: JSON.stringify({
            action: 'resolve_activation',
            ticketId: activating.ticket.id,
            siteId: activating.siteId,
          }),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || 'Failed to resolve activation ticket');
        }
      } else {
        for (const status of steps) {
          const res = await fetch(
            `/api/admin/b2b-customers/site-details/${activating.siteId}/activate`,
            {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json', ...authHeaders() },
              body: JSON.stringify({
                status,
                technology: activateTechnology,
                package_id: 'f6828ecf-4a8d-42c0-9fd7-d7cac5c1537e',
                monthly_fee: 450,
                wholesale_order_ref: activateWholesaleRef || undefined,
                installed_at: activateInstallDate || undefined,
                installed_by: activateInstaller || undefined,
                notes: activateNotes || undefined,
              }),
            }
          );
          if (!res.ok) {
            const body = await res.json().catch(() => ({}));
            throw new Error(body.error || `Failed to set site ${status}`);
          }
        }
      }
      toast.success(`${activating.siteName} activated`);
      resetActivate();
      await onRefresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Activation failed');
    } finally {
      setBusy(false);
    }
  };

  if (tab === 'nominations') {
    return (
      <SectionCard
        title="Coverage nominations"
        action={
          <span className="text-xs text-gray-400">
            Portal /unjani/coverage · {nominations.length} waiting
          </span>
        }
      >
        {nominations.length === 0 ? (
          <EmptyState
            icon={<PiMapPinBold />}
            title="No open nominations"
            description="When Unjani nominates a clinic on /unjani/coverage it appears here the same day."
          />
        ) : (
          <div className="overflow-x-auto -mx-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Clinic</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Coverage</TableHead>
                  <TableHead>Desk</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {nominations.map((row) => (
                  <TableRow key={row.ticket?.id || row.coverageCheckId}>
                    <TableCell>
                      <div className="font-semibold text-gray-900">{row.clinicName}</div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        {row.address || 'Address not captured'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-800">
                        {row.contact.contactName || '—'}
                      </div>
                      <div className="text-xs text-gray-400">
                        {[row.contact.mobile, row.contact.email].filter(Boolean).join(' · ') ||
                          'Add contact when registering'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-xs text-gray-600">
                        Tarana {row.coverageSummary?.tarana ?? 'n/a'}
                      </div>
                      <div className="text-xs text-gray-400">
                        5G/LTE {row.coverageSummary?.['5g_lte'] ?? 'n/a'}
                      </div>
                    </TableCell>
                    <TableCell>
                      {row.ticket?.zoho_ticket_number ? (
                        <span className="inline-flex items-center gap-1 text-sm font-medium text-gray-800">
                          <PiTicketBold className="h-3.5 w-3.5" />
                          #{row.ticket.zoho_ticket_number}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">
                          {row.source === 'coverage_check' ? 'Pre-qualified' : 'No Desk #'}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="inline-flex flex-wrap justify-end gap-2">
                        <Button
                          size="sm"
                          className="bg-circleTel-orange hover:bg-circleTel-orange-dark text-white"
                          onClick={() => onRegisterNomination(row)}
                        >
                          Register clinic
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onSendLink(row.clinicName)}
                        >
                          <PiPaperPlaneTiltBold className="h-3.5 w-3.5 mr-1" />
                          Send link
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </SectionCard>
    );
  }

  return (
    <>
      <SectionCard
        title="Site activations"
        action={
          <span className="text-xs text-gray-400">
            Portal Activate Site · {activations.length} open
          </span>
        }
      >
        {activations.length === 0 ? (
          <EmptyState
            icon={<PiCheckCircleBold />}
            title="No open activation requests"
            description="When a clinic Super User logs Activate Site it appears here with the Desk ticket Unjani sees."
          />
        ) : (
          <div className="overflow-x-auto -mx-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Site</TableHead>
                  <TableHead>Site status</TableHead>
                  <TableHead>Desk</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activations.map((row) => (
                  <TableRow key={row.ticket.id}>
                    <TableCell>
                      <div className="font-semibold text-gray-900">{row.siteName}</div>
                      <div className="text-xs text-gray-400 mt-0.5">{row.ticket.subject}</div>
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-0.5 text-[11px] font-semibold capitalize text-gray-700">
                        {row.siteStatus}
                      </span>
                    </TableCell>
                    <TableCell>
                      {row.ticket.zoho_ticket_number ? (
                        <span className="inline-flex items-center gap-1 text-sm font-medium">
                          <PiTicketBold className="h-3.5 w-3.5" />
                          #{row.ticket.zoho_ticket_number}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">Pending Desk sync</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="inline-flex flex-wrap justify-end gap-2">
                        <Button
                          size="sm"
                          className="bg-circleTel-orange hover:bg-circleTel-orange-dark text-white"
                          onClick={() => setActivating(row)}
                        >
                          Activate site
                        </Button>
                        {organisationId && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              window.location.href = `/admin/b2b-customers/${organisationId}`;
                            }}
                          >
                            Open account
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </SectionCard>

      <Dialog open={!!activating} onOpenChange={(open) => { if (!open) resetActivate(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Activate Site: {activating?.siteName}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Technology</label>
              <Select value={activateTechnology} onValueChange={setActivateTechnology}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lte_5g">LTE / 5G</SelectItem>
                  <SelectItem value="tarana_fwb">Tarana FWB</SelectItem>
                  <SelectItem value="ftth">FTTH</SelectItem>
                  <SelectItem value="fwa">FWA</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Install Date (optional)</label>
              <Input
                type="date"
                value={activateInstallDate}
                onChange={(e) => setActivateInstallDate(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Installer Name (optional)</label>
              <Input
                value={activateInstaller}
                onChange={(e) => setActivateInstaller(e.target.value)}
                placeholder="e.g. John from TechInstall"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Wholesale Order Ref (optional)</label>
              <Input
                value={activateWholesaleRef}
                onChange={(e) => setActivateWholesaleRef(e.target.value)}
                placeholder="e.g. WO-2026-001"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Notes (optional)</label>
              <Input
                value={activateNotes}
                onChange={(e) => setActivateNotes(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={resetActivate} disabled={busy}>
              Cancel
            </Button>
            <Button
              onClick={activateSite}
              disabled={busy}
              className="bg-circleTel-orange hover:bg-orange-600"
            >
              {busy ? 'Activating…' : 'Activate Site'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
