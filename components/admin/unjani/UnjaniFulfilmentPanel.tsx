'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import CoverageExplorer from '@/components/portal/coverage/CoverageExplorer';
import { PmButton, RuledTable } from '@/components/portal/modernist/PortalModernistShell';
import { UNJANI_CONNECT_KIT } from '@/lib/admin/unjani-warehouse';
import { countTechnicianWorkload } from '@/lib/admin/unjani-install-schedule';
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
  contact_name: string | null;
  contact_phone: string | null;
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

  return (
    <section className="mb-8 space-y-6">
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
          Same map as /unjani/coverage. After a feasible check, place the CircleTel install order
          (kit reserve or 5-business-day stock PO, 14–21 business day fulfil window).
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

      <div>
        <p
          className="text-[10px] font-extrabold tracking-[0.08em] uppercase"
          style={{ color: 'var(--pm-navy)' }}
        >
          Install orders
        </p>
        <RuledTable
          headers={['Clinic', 'Stock', 'Fulfil by', 'Visit', 'On-site / RFS']}
          className="mt-3 rounded-xl shadow-sm ring-1 ring-black/[0.06]"
        >
          {orders.length === 0 ? (
            <tr>
              <td colSpan={5} className="px-4 py-6 text-sm" style={{ color: 'var(--pm-body)' }}>
                No install orders yet. Use Process install order on a feasible clinic above.
              </td>
            </tr>
          ) : (
            orders.map((order) => {
              const slot = schedule[order.id] ?? {
                technicianId: technicians[0]?.id ?? '',
                visitDate: visitDays[0] ?? '',
              };
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
                    <span className="text-xs" style={{ color: '#6B7280' }}>
                      {order.contact_name || order.contact_phone || order.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 align-top text-sm" style={{ color: 'var(--pm-body)' }}>
                    <p>{order.stock_status === 'reserved' ? 'Kit reserved' : 'On order (+5 BD)'}</p>
                    {order.stock_status !== 'reserved' && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        <PmButton
                          variant="secondary"
                          disabled={busyId === order.id}
                          onClick={() => postAction(order.id, { action: 'receive_stock' })}
                        >
                          Receive stock
                        </PmButton>
                        <PmButton
                          variant="ghost"
                          disabled={busyId === order.id}
                          onClick={() => postAction(order.id, { action: 'assign_kit' })}
                        >
                          Assign kit
                        </PmButton>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 align-top text-sm tabular-nums" style={{ color: 'var(--pm-body)' }}>
                    {order.fulfil_by_min} – {order.fulfil_by_max}
                  </td>
                  <td className="px-4 py-3 align-top text-sm">
                    {order.visit_date ? (
                      <p style={{ color: 'var(--pm-body)' }}>{order.visit_date}</p>
                    ) : (
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
                        <PmButton
                          variant="cta"
                          disabled={
                            busyId === order.id ||
                            order.stock_status !== 'reserved' ||
                            !slot.technicianId ||
                            !slot.visitDate
                          }
                          onClick={() =>
                            postAction(order.id, {
                              action: 'schedule',
                              technicianId: slot.technicianId,
                              visitDate: slot.visitDate,
                            })
                          }
                        >
                          Book vs workload
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
                      Job card
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
      </div>
    </section>
  );
}
