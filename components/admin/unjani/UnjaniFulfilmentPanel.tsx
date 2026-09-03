'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import CoverageExplorer from '@/components/portal/coverage/CoverageExplorer';
import { PmButton, RuledTable } from '@/components/portal/modernist/PortalModernistShell';
import { UNJANI_CONNECT_KIT } from '@/lib/admin/unjani-warehouse';
import { countTechnicianWorkload } from '@/lib/admin/unjani-install-schedule';
import { fulfilmentDesk, isKitBookedOut } from '@/lib/admin/unjani-install-desk';
import { ONSITE_CHECKLIST, canGoLiveFromFulfilment } from '@/lib/admin/unjani-onsite';

interface StockRow {
  sku: string;
  qty_on_hand: number;
  qty_reserved: number;
}

interface InstallOrderRow {
  id: string;
  clinic_name: string | null;
  address: string | null;
  stock_status: string;
  status: string;
  ordered_at: string;
  fulfil_by_min: string;
  fulfil_by_max: string;
  visit_date: string | null;
  kit_issued_at: string | null;
  survey_speedtest_path: string | null;
  commission_speedtest_path: string | null;
  job_card_path: string | null;
  job_card_approved_at: string | null;
  customer_id: string | null;
  corporate_site_id: string | null;
  field_job_id: string | null;
  technician_id: string | null;
  contact_name: string | null;
  contact_phone: string | null;
  contact_email: string | null;
}

interface TechnicianRow {
  id: string;
  first_name: string;
  last_name: string;
  status?: string;
}

interface JobRow {
  assigned_technician_id?: string | null;
  scheduled_date?: string | null;
  status?: string | null;
}

function waHref(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  const intl = digits.startsWith('0') ? `27${digits.slice(1)}` : digits;
  return `https://wa.me/${intl}`;
}

export function UnjaniFulfilmentPanel({
  authHeaders,
  onRefresh,
}: {
  authHeaders: () => Record<string, string>;
  onRefresh?: () => void;
}) {
  const [stock, setStock] = useState<StockRow[]>([]);
  const [orders, setOrders] = useState<InstallOrderRow[]>([]);
  const [technicians, setTechnicians] = useState<TechnicianRow[]>([]);
  const [jobs, setJobs] = useState<JobRow[]>([]);
  const [visitDays, setVisitDays] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [schedule, setSchedule] = useState<Record<string, { technicianId: string; visitDate: string }>>({});

  const load = useCallback(async () => {
    const res = await fetch('/api/admin/unjani/fulfilment', { headers: authHeaders() });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Could not load fulfilment');
    setStock(data.stock ?? []);
    setOrders(data.orders ?? []);
    setTechnicians(data.technicians ?? []);
    setJobs(data.jobs ?? []);
    setVisitDays(data.visitDays ?? []);
  }, [authHeaders]);

  useEffect(() => {
    load().catch((err) => setError(err instanceof Error ? err.message : 'Could not load fulfilment'));
  }, [load]);

  async function postAction(orderId: string, body: Record<string, unknown>) {
    setBusyId(orderId);
    setError('');
    try {
      const res = await fetch(`/api/admin/unjani/install-orders/${orderId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Action failed');
      await load();
      onRefresh?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setBusyId(null);
    }
  }

  async function upload(orderId: string, kind: string, file: File) {
    setBusyId(orderId);
    setError('');
    try {
      const form = new FormData();
      form.append('kind', kind);
      form.append('file', file);
      const res = await fetch(`/api/admin/unjani/install-orders/${orderId}`, {
        method: 'POST',
        headers: authHeaders(),
        body: form,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setBusyId(null);
    }
  }

  const stockBySku = useMemo(() => {
    const map = new Map(stock.map((row) => [row.sku, row]));
    return UNJANI_CONNECT_KIT.map((line) => {
      const row = map.get(line.sku);
      return {
        ...line,
        onHand: row?.qty_on_hand ?? 0,
        reserved: row?.qty_reserved ?? 0,
      };
    });
  }, [stock]);

  const opsOrders = orders.filter((order) => fulfilmentDesk(order) === 'ops');
  const schedulerOrders = orders.filter((order) => fulfilmentDesk(order) === 'scheduler');
  const onsiteOrders = orders.filter((order) => fulfilmentDesk(order) === 'onsite');

  function slotFor(order: InstallOrderRow) {
    return (
      schedule[order.id] ?? {
        technicianId: order.technician_id || technicians[0]?.id || '',
        visitDate: visitDays[0] ?? '',
      }
    );
  }

  return (
    <section id="coverage" className="mb-8 space-y-6">
      <div>
        <p
          className="text-[10px] font-extrabold tracking-[0.08em] uppercase"
          style={{ color: 'var(--pm-navy)' }}
        >
          Coverage
        </p>
        <h2 className="mt-1 text-xl font-extrabold" style={{ color: 'var(--pm-navy)' }}>
          Check coverage, then process an install order
        </h2>
        <p className="mt-1 text-sm" style={{ color: 'var(--pm-body)' }}>
          After clinic details are confirmed, ops books the kit out against the site, assigns a
          technician, and opens a job card. The scheduler then confirms the slot with the clinic.
        </p>
      </div>

      <CoverageExplorer mode="admin" getHeaders={authHeaders} onOrderCreated={() => void load()} />

      <div className="grid gap-3 sm:grid-cols-2">
        {stockBySku.map((line) => (
          <div
            key={line.sku}
            className="rounded-xl bg-white px-4 py-4 shadow-sm ring-1 ring-black/[0.06]"
          >
            <p
              className="text-[10px] font-extrabold tracking-[0.08em] uppercase"
              style={{ color: 'var(--pm-navy)' }}
            >
              {line.name}
            </p>
            <p className="mt-1 text-2xl font-extrabold tabular-nums" style={{ color: 'var(--pm-navy)' }}>
              {line.onHand - line.reserved}
              <span className="ml-2 text-sm font-semibold opacity-70">free</span>
            </p>
            <p className="mt-1 text-xs" style={{ color: '#6B7280' }}>
              {line.onHand} on hand · {line.reserved} reserved
            </p>
          </div>
        ))}
      </div>

      {error && (
        <p className="text-sm font-medium" style={{ color: '#DC2626' }}>
          {error}
        </p>
      )}

      <Desk heading="Ops — kit and job card">
        <RuledTable
          headers={['Clinic', 'Kit', 'Technician and proposed slot']}
          className="mt-3 rounded-xl shadow-sm ring-1 ring-black/[0.06]"
        >
          {opsOrders.length === 0 ? (
            <EmptyRow cols={3} text="No clinics waiting for kit or a job card." />
          ) : (
            opsOrders.map((order) => {
              const slot = slotFor(order);
              const bookedOut = isKitBookedOut(order.stock_status);
              return (
                <tr key={order.id} style={{ borderBottom: '1px solid var(--pm-divider)' }}>
                  <td className="px-4 py-3 align-top">
                    <span className="block font-extrabold" style={{ color: 'var(--pm-navy)' }}>
                      {order.clinic_name || 'Clinic'}
                    </span>
                    <span className="text-xs" style={{ color: '#6B7280' }}>
                      {order.contact_name || order.contact_phone || order.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 align-top text-sm" style={{ color: 'var(--pm-body)' }}>
                    <p>{bookedOut ? 'Booked out against site' : 'On order (+5 BD)'}</p>
                    {!bookedOut && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        <PmButton
                          variant="secondary"
                          disabled={busyId === order.id}
                          onClick={() => postAction(order.id, { action: 'receive_stock' })}
                        >
                          Receive stock
                        </PmButton>
                        <PmButton
                          variant="cta"
                          disabled={busyId === order.id}
                          onClick={() => postAction(order.id, { action: 'assign_kit' })}
                        >
                          Assign kit
                        </PmButton>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 align-top text-sm">
                    <div className="space-y-2">
                      <select
                        value={slot.technicianId}
                        onChange={(e) =>
                          setSchedule((prev) => ({
                            ...prev,
                            [order.id]: { ...slot, technicianId: e.target.value },
                          }))
                        }
                        className="min-h-11 w-full rounded-lg px-2 py-1 text-sm"
                        style={{ border: '1px solid var(--pm-divider)' }}
                        disabled={!bookedOut}
                      >
                        <option value="">Technician</option>
                        {technicians.map((tech) => {
                          const loadCount = slot.visitDate
                            ? countTechnicianWorkload(jobs, tech.id, slot.visitDate)
                            : 0;
                          return (
                            <option key={tech.id} value={tech.id}>
                              {tech.first_name} {tech.last_name}
                              {slot.visitDate ? ` · ${loadCount} jobs` : ''}
                            </option>
                          );
                        })}
                      </select>
                      <select
                        value={slot.visitDate}
                        onChange={(e) =>
                          setSchedule((prev) => ({
                            ...prev,
                            [order.id]: { ...slot, visitDate: e.target.value },
                          }))
                        }
                        className="min-h-11 w-full rounded-lg px-2 py-1 text-sm"
                        style={{ border: '1px solid var(--pm-divider)' }}
                        disabled={!bookedOut}
                      >
                        <option value="">Proposed visit date</option>
                        {visitDays
                          .filter((day) => day <= order.fulfil_by_max)
                          .map((day) => (
                            <option key={day} value={day}>
                              {day}
                            </option>
                          ))}
                      </select>
                      <PmButton
                        variant="cta"
                        disabled={
                          busyId === order.id ||
                          !bookedOut ||
                          !slot.technicianId ||
                          !slot.visitDate
                        }
                        onClick={() =>
                          postAction(order.id, {
                            action: 'open_job',
                            technicianId: slot.technicianId,
                            proposedDate: slot.visitDate,
                          })
                        }
                      >
                        Open job card
                      </PmButton>
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </RuledTable>
      </Desk>

      <Desk heading="Ready for scheduling">
        <RuledTable
          headers={['Clinic contact', 'Proposed slot', 'Confirm']}
          className="mt-3 rounded-xl shadow-sm ring-1 ring-black/[0.06]"
        >
          {schedulerOrders.length === 0 ? (
            <EmptyRow cols={3} text="No job cards waiting for a confirmed clinic slot." />
          ) : (
            schedulerOrders.map((order) => {
              const slot = slotFor(order);
              return (
                <tr key={order.id} style={{ borderBottom: '1px solid var(--pm-divider)' }}>
                  <td className="px-4 py-3 align-top">
                    <span className="block font-extrabold" style={{ color: 'var(--pm-navy)' }}>
                      {order.clinic_name || 'Clinic'}
                    </span>
                    <span className="block text-sm" style={{ color: 'var(--pm-body)' }}>
                      {order.contact_name || 'On-site contact'}
                    </span>
                    {order.contact_phone && (
                      <div className="mt-2 flex flex-wrap gap-3 text-sm">
                        <a href={`tel:${order.contact_phone}`} className="font-semibold">
                          Call {order.contact_phone}
                        </a>
                        <a
                          href={waHref(order.contact_phone)}
                          target="_blank"
                          rel="noreferrer"
                          className="font-semibold"
                        >
                          WhatsApp
                        </a>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 align-top text-sm">
                    <select
                      value={slot.visitDate}
                      onChange={(e) =>
                        setSchedule((prev) => ({
                          ...prev,
                          [order.id]: { ...slot, visitDate: e.target.value },
                        }))
                      }
                      className="min-h-11 w-full rounded-lg px-2 py-1 text-sm"
                      style={{ border: '1px solid var(--pm-divider)' }}
                    >
                      <option value="">Visit date</option>
                      {visitDays
                        .filter((day) => day <= order.fulfil_by_max)
                        .map((day) => (
                          <option key={day} value={day}>
                            {day}
                          </option>
                        ))}
                    </select>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <PmButton
                      variant="cta"
                      disabled={busyId === order.id || !slot.visitDate}
                      onClick={() =>
                        postAction(order.id, {
                          action: 'confirm_slot',
                          visitDate: slot.visitDate,
                          technicianId: slot.technicianId || order.technician_id,
                        })
                      }
                    >
                      Confirm booking slot
                    </PmButton>
                  </td>
                </tr>
              );
            })
          )}
        </RuledTable>
      </Desk>

      <Desk heading="On-site / RFS">
        <RuledTable
          headers={['Clinic', 'Visit', 'On-site / RFS']}
          className="mt-3 rounded-xl shadow-sm ring-1 ring-black/[0.06]"
        >
          {onsiteOrders.length === 0 ? (
            <EmptyRow cols={3} text="No confirmed visits yet." />
          ) : (
            onsiteOrders.map((order) => {
              const rfsReady = canGoLiveFromFulfilment({
                stockStatus: order.stock_status,
                kitIssuedAt: order.kit_issued_at,
                jobCardPath: order.job_card_path,
                jobCardApprovedAt: order.job_card_approved_at,
                surveySpeedtestPath: order.survey_speedtest_path,
                commissionSpeedtestPath: order.commission_speedtest_path,
              });
              return (
                <tr key={order.id} style={{ borderBottom: '1px solid var(--pm-divider)' }}>
                  <td className="px-4 py-3 align-top">
                    <span className="block font-extrabold" style={{ color: 'var(--pm-navy)' }}>
                      {order.clinic_name || 'Clinic'}
                    </span>
                  </td>
                  <td className="px-4 py-3 align-top text-sm" style={{ color: 'var(--pm-body)' }}>
                    <p>{order.visit_date}</p>
                    {!order.kit_issued_at && (
                      <div className="mt-2">
                        <PmButton
                          variant="secondary"
                          disabled={busyId === order.id}
                          onClick={() => postAction(order.id, { action: 'issue_kit' })}
                        >
                          Issue kit
                        </PmButton>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 align-top text-sm">
                    <ul className="mb-2 space-y-1 text-xs" style={{ color: '#6B7280' }}>
                      {ONSITE_CHECKLIST.map((item) => (
                        <li key={item.id}>{item.label}</li>
                      ))}
                    </ul>
                    <label className="mt-1 block text-xs">
                      Before Ookla
                      <input
                        type="file"
                        accept="image/png,image/jpeg,application/pdf"
                        className="mt-1 block w-full text-xs"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) void upload(order.id, 'survey_speedtest', file);
                        }}
                      />
                    </label>
                    <label className="mt-2 block text-xs">
                      After Ookla
                      <input
                        type="file"
                        accept="image/png,image/jpeg,application/pdf"
                        className="mt-1 block w-full text-xs"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) void upload(order.id, 'commission_speedtest', file);
                        }}
                      />
                    </label>
                    <label className="mt-2 block text-xs">
                      Completed job card PDF
                      <input
                        type="file"
                        accept="image/png,image/jpeg,application/pdf"
                        className="mt-1 block w-full text-xs"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) void upload(order.id, 'job_card', file);
                        }}
                      />
                    </label>
                    <div className="mt-2">
                      <PmButton
                        variant="secondary"
                        disabled={busyId === order.id || !order.job_card_path}
                        onClick={() => postAction(order.id, { action: 'approve_job_card' })}
                      >
                        Approve job card
                      </PmButton>
                    </div>
                    <p className="mt-2 text-xs font-semibold" style={{ color: rfsReady ? '#2F9E5E' : '#DC2626' }}>
                      {rfsReady ? 'Ready for RFS / go live' : 'RFS blocked'}
                    </p>
                    {rfsReady && (
                      <div className="mt-2">
                        <PmButton
                          variant="cta"
                          disabled={busyId === order.id || !order.corporate_site_id}
                          onClick={async () => {
                            setBusyId(order.id);
                            setError('');
                            try {
                              const res = await fetch('/api/admin/unjani/advance-stage', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json', ...authHeaders() },
                                body: JSON.stringify({
                                  action: 'go_live',
                                  customerId: order.customer_id,
                                  siteId: order.corporate_site_id,
                                }),
                              });
                              const data = await res.json();
                              if (!res.ok) throw new Error(data.error || 'Go live failed');
                              await load();
                              onRefresh?.();
                            } catch (err) {
                              setError(err instanceof Error ? err.message : 'Go live failed');
                            } finally {
                              setBusyId(null);
                            }
                          }}
                        >
                          Go live / issue RFS
                        </PmButton>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })
          )}
        </RuledTable>
      </Desk>
    </section>
  );
}

function Desk({ heading, children }: { heading: string; children: React.ReactNode }) {
  return (
    <div>
      <p
        className="text-[10px] font-extrabold tracking-[0.08em] uppercase"
        style={{ color: 'var(--pm-navy)' }}
      >
        {heading}
      </p>
      {children}
    </div>
  );
}

function EmptyRow({ cols, text }: { cols: number; text: string }) {
  return (
    <tr>
      <td colSpan={cols} className="px-4 py-6 text-sm" style={{ color: 'var(--pm-body)' }}>
        {text}
      </td>
    </tr>
  );
}
