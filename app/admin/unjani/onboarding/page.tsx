'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  PiBuildingsBold,
  PiCaretDownBold,
  PiChatCircleTextBold,
  PiEnvelopeSimpleBold,
  PiFileTextBold,
  PiMagnifyingGlassBold,
  PiSpinnerBold,
  PiWarningBold,
  PiWhatsappLogoBold,
} from 'react-icons/pi';
import { openKycDocument } from '@/lib/admin/open-kyc-document';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  EmptyState,
  ErrorState,
  AdminPage,
  LoadingState,
  SectionCard,
  StatCard,
} from '@/components/backend';
import { UnjaniAdminModernistShell } from '@/components/admin/unjani/UnjaniAdminModernistShell';
import {
  KpiStrip,
  PageHeader as PortalPageHeader,
} from '@/components/portal/modernist/PortalModernistShell';
import { cn } from '@/lib/utils';
import networkRegister from '@/lib/data/unjani-network-register.json';
import { Input } from '@/components/ui/input';
import { PortalOpsQueues } from '@/components/admin/unjani/PortalOpsQueues';
import { UnjaniFulfilmentPanel } from '@/components/admin/unjani/UnjaniFulfilmentPanel';
import type { ActivationRow, NominationRow } from '@/lib/admin/unjani-portal-ops';
import { portalStageForClinic } from '@/lib/admin/unjani-portal-ops';
import {
  isVisitWindowBlocked,
  operatorAction,
} from '@/lib/admin/unjani-operator-actions';
import { emptyStageCounts, type StageClinicRef } from '@/lib/portal/count-onboarding-stages';
import { spendNote, type UnjaniDashboardKpis } from '@/lib/portal/dashboard-kpis';
import {
  ONBOARDING_STAGES,
  stageDefinition,
  type StageKey,
} from '@/lib/portal/onboarding-stage';
import { formatZar } from '@/lib/portal/site-format';

// ---------- Types (mirror /api/admin/b2b/onboarding-pipeline) ----------

interface PipelineClinic {
  account_number: string;
  customer_id: string;
  business_name: string;
  province: string;
  nurse_name: string | null;
  phone: string | null;
  email: string | null;
  stage: string;
  display_stage: string;
  document_vetting_status: string | null;
  mandate_status: string | null;
  vetting_due_date: string | null;
  submitted_at: string | null;
  service_order_issued_at: string | null;
  service_order_pdf_path: string | null;
  sla: {
    dueDate: string | null;
    overdue: boolean;
    businessDaysLeft: number | null;
  };
  submission_id: string | null;
  site_address: string | null;
  incumbent_isp: string | null;
  incumbent_cost: number | null;
  contract_status: 'in_contract' | 'out_of_contract' | 'unknown';
  current_service: {
    status: string | null;
    active: boolean | null;
    package_name: string | null;
    monthly_price: number | null;
    activation_date: string | null;
    billing_day: number | null;
    last_invoice_date: string | null;
  } | null;
  latest_invoice: {
    invoice_number: string | null;
    invoice_date: string | null;
    due_date: string | null;
    status: string | null;
    total_amount: number | null;
    amount_paid: number | null;
    amount_due: number | null;
    paid_at: string | null;
    payment_collection_method: string | null;
  } | null;
}

interface PipelineResponse {
  clinics: PipelineClinic[];
  stageCounts: {
    invited: number;
    submitted: number;
    changes_requested: number;
    docs_approved: number;
    billing_ready: number;
    service_active: number;
    pending: number;
  };
  overdueCount: number;
}

interface PortalOpsResponse {
  organisationId: string;
  nominations: NominationRow[];
  activations: ActivationRow[];
  pipelineStages: Record<string, { key: StageKey; label: string }>;
  stageCounts: Record<StageKey, number>;
  stageClinics: StageClinicRef[];
  kpis: UnjaniDashboardKpis;
}

// ---------- Stage model (portal guide stages only) ----------

interface StageMeta {
  id: StageKey;
  label: string;
  pillBg: string;
  pillFg: string;
  color: string;
  action: string;
}

/** Same accents as /unjani StageStrip — used by the admin funnel, pills, and kanban. */
const PORTAL_STAGE_COLORS: Record<StageKey, string> = {
  nominated: '#4A5568',
  introduced: '#2563C9',
  details_confirmed: '#C2700C',
  changes_requested: '#D14343',
  visit_booked: '#2563C9',
  installing: '#2F9E5E',
  live: '#2F9E5E',
};

const PORTAL_STAGE_PILLS: Record<StageKey, { pillBg: string; pillFg: string }> = {
  nominated: { pillBg: '#F6F7F9', pillFg: '#4A5568' },
  introduced: { pillBg: '#EBF1FE', pillFg: '#2563C9' },
  details_confirmed: { pillBg: '#FDF2E9', pillFg: '#C2700C' },
  changes_requested: { pillBg: '#FDECEC', pillFg: '#D14343' },
  visit_booked: { pillBg: '#EBF1FE', pillFg: '#2563C9' },
  installing: { pillBg: '#E7F6EE', pillFg: '#2F9E5E' },
  live: { pillBg: '#DFF7EA', pillFg: '#0F7A3D' },
};

function portalStageLabel(key: StageKey): string {
  return key === 'live' ? 'Site Live' : stageDefinition(key).label;
}

const STAGE_INDEX = Object.fromEntries(ONBOARDING_STAGES.map((s, i) => [s.key, i])) as Record<
  StageKey,
  number
>;
const PROGRESS_STAGES = ONBOARDING_STAGES.filter((s) => !s.branch);

function isSitePlaceholder(clinic: PipelineClinic): boolean {
  return clinic.customer_id.startsWith('site:');
}

function placeholderPipelineClinic(ref: StageClinicRef): PipelineClinic {
  return {
    account_number: ref.coverageCheckId ? 'Coverage nominated' : 'Pending site',
    customer_id: ref.customerId ?? (ref.coverageCheckId ? `check:${ref.coverageCheckId}` : `site:${ref.siteId ?? ref.name}`),
    business_name: ref.name,
    province: '',
    nurse_name: null,
    phone: null,
    email: null,
    stage: 'pending',
    display_stage: ref.stage,
    document_vetting_status: null,
    mandate_status: null,
    vetting_due_date: null,
    submitted_at: null,
    service_order_issued_at: null,
    service_order_pdf_path: null,
    sla: { dueDate: null, overdue: false, businessDaysLeft: null },
    submission_id: null,
    site_address: ref.address ?? (
      ref.latitude != null && ref.longitude != null
        ? `${ref.latitude}, ${ref.longitude}`
        : null
    ),
    incumbent_isp: null,
    incumbent_cost: null,
    contract_status: 'unknown',
    current_service: null,
    latest_invoice: null,
  };
}

function clinicPortalStage(
  clinic: PipelineClinic,
  pipelineStages?: Record<string, { key: StageKey; label: string }> | null
): StageKey {
  const fromDisplay = ONBOARDING_STAGES.some((stage) => stage.key === clinic.display_stage)
    ? (clinic.display_stage as StageKey)
    : undefined;
  return (
    pipelineStages?.[clinic.customer_id]?.key ??
    fromDisplay ??
    portalStageForClinic({
      billingStage: clinic.stage,
      documentVettingStatus: clinic.document_vetting_status,
      onboardingLinkSent: clinic.stage !== 'pending',
    })
  );
}

function stageMeta(stage: StageKey): StageMeta {
  const pills = PORTAL_STAGE_PILLS[stage];
  return {
    id: stage,
    label: portalStageLabel(stage),
    pillBg: pills.pillBg,
    pillFg: pills.pillFg,
    color: PORTAL_STAGE_COLORS[stage],
    action: operatorAction(stage).primary.label,
  };
}

function serviceIsActive(clinic: PipelineClinic): boolean {
  return clinic.current_service?.status === 'active' || clinic.current_service?.active === true;
}

function canRunPrimaryAction(stage: StageKey): boolean {
  const actionId = operatorAction(stage).primary.id;
  return actionId !== 'done' && actionId !== 'request_npc_acceptance';
}

function displayDate(value: string | null | undefined): string {
  return value ? new Date(value).toLocaleDateString('en-ZA') : '—';
}

function displayStatus(value: string | null | undefined): string {
  if (!value) return '—';
  return value
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

// ---------- SLA helpers (vetting SLA from the API) ----------

type SlaStatus = 'ok' | 'warn' | 'err';

function slaStatus(clinic: PipelineClinic): SlaStatus | null {
  if (!clinic.sla.dueDate) return null;
  if (clinic.sla.overdue) return 'err';
  if ((clinic.sla.businessDaysLeft ?? 99) <= 1) return 'warn';
  return 'ok';
}

/** Elapsed share of the vetting window (submitted_at → vetting_due_date), 0–100. */
function slaProgress(clinic: PipelineClinic): number {
  if (!clinic.sla.dueDate || !clinic.submitted_at) return clinic.sla.overdue ? 100 : 0;
  const start = new Date(clinic.submitted_at).getTime();
  const end = new Date(clinic.sla.dueDate).getTime();
  if (end <= start) return 100;
  const pct = ((Date.now() - start) / (end - start)) * 100;
  return Math.min(Math.max(pct, 4), 100);
}

function slaLabel(clinic: PipelineClinic): string {
  const days = clinic.sla.businessDaysLeft;
  if (clinic.sla.dueDate === null || days === null) return '—';
  if (clinic.sla.overdue) return `${Math.abs(days)}d overdue`;
  return `${days}d left`;
}

const SLA_TEXT: Record<SlaStatus, string> = {
  ok: 'text-green-600',
  warn: 'text-amber-600',
  err: 'text-red-600',
};
const SLA_FILL: Record<SlaStatus, string> = {
  ok: 'bg-green-600',
  warn: 'bg-amber-500',
  err: 'bg-red-600',
};

const fmtRand = (n: number) => 'R' + Math.round(n).toLocaleString('en-ZA');

const CONTRACT_BADGE: Record<string, { label: string; bg: string; fg: string }> = {
  in_contract: { label: 'In contract', bg: '#FCF6E5', fg: '#CA8A04' },
  out_of_contract: { label: 'Out of contract', bg: '#EAF7EF', fg: '#16A34A' },
  unknown: { label: 'Contract unknown', bg: '#F1F3F5', fg: '#6B7280' },
};

function ContractBadge({ status }: { status: string }) {
  const b = CONTRACT_BADGE[status] ?? CONTRACT_BADGE.unknown;
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
      style={{ background: b.bg, color: b.fg }}
    >
      {b.label}
    </span>
  );
}

// ---------- Network register (static reference data — MSA savings schedule v1.0) ----------

interface RegisterClinic {
  name: string;
  province: string;
  nurse: string | null;
  isp: string | null;
  isp_cost: number | null;
  saving: number | null;
  migration_ready: boolean;
}

const REGISTER = networkRegister as {
  version: string;
  as_of: string;
  summary: {
    total_clinics: number;
    clinics_with_saving: number;
    clinics_with_cost_increase: number;
    clinics_no_cost_data: number;
    net_monthly_saving_rands: number;
  };
  clinics: RegisterClinic[];
};

/** Normalise clinic names so pipeline rows ("Unjani Clinic - Delmas") match register rows ("Delmas"). */
const normName = (s: string) => s.toLowerCase().replace(/^unjani clinic\s*-\s*/, '').trim();

const SAVING_BY_NAME = new Map(REGISTER.clinics.map((c) => [normName(c.name), c.saving]));

function savingDisplay(saving: number | null | undefined) {
  if (saving === null || saving === undefined) {
    return <span className="text-sm text-gray-400">—</span>;
  }
  if (saving > 0) {
    return <span className="text-sm font-semibold text-green-600">+{fmtRand(saving)}</span>;
  }
  if (saving < 0) {
    return <span className="text-sm font-semibold text-red-600">−{fmtRand(Math.abs(saving))}</span>;
  }
  return <span className="text-sm text-gray-400">R0</span>;
}

// ---------- Page ----------

type SortKey = 'name' | 'stage' | 'sla' | 'province';

export default function UnjaniOnboardingPipelinePage() {
  const router = useRouter();
  const [data, setData] = useState<PipelineResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const [portalOps, setPortalOps] = useState<PortalOpsResponse | null>(null);
  const [confirmClinic, setConfirmClinic] = useState<PipelineClinic | null>(null);
  const [changesClinic, setChangesClinic] = useState<PipelineClinic | null>(null);
  const [changesReason, setChangesReason] = useState('');
  const [bookClinic, setBookClinic] = useState<PipelineClinic | null>(null);
  const [bookVisitDate, setBookVisitDate] = useState('');
  const [bookVisitNotes, setBookVisitNotes] = useState('');
  const [goLiveClinic, setGoLiveClinic] = useState<PipelineClinic | null>(null);
  const [goLiveDate, setGoLiveDate] = useState('');
  const [goLiveInstaller, setGoLiveInstaller] = useState('');
  const [goLiveWholesaleRef, setGoLiveWholesaleRef] = useState('');
  const [goLiveNotes, setGoLiveNotes] = useState('');
  const [registerTicketId, setRegisterTicketId] = useState<string | null>(null);
  const [view, setView] = useState<'table' | 'kanban' | 'register'>('table');
  const [stageFilter, setStageFilter] = useState<StageKey | ''>('');
  const [provinceFilter, setProvinceFilter] = useState('');
  const [slaFilter, setSlaFilter] = useState('');
  const [query, setQuery] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('stage');
  const [sortDir, setSortDir] = useState<1 | -1>(1);

  const [actingOn, setActingOn] = useState<string | null>(null);
  const [drawerClinic, setDrawerClinic] = useState<PipelineClinic | null>(null);
  const [openingServiceOrderId, setOpeningServiceOrderId] = useState<string | null>(null);
  const [registerDrawer, setRegisterDrawer] = useState<null | {
    registerName: string;
    businessName: string;
    nurseName: string | null;
    phone: string | null;
    email: string | null;
    province: string | null;
    siteAddress: string | null;
    incumbentIsp: string | null;
    incumbentCost: number | null;
    contractStatus: 'in_contract' | 'out_of_contract' | 'unknown';
    savingPerMonth: number | null;
  }>(null);

  // Inline edit of the clinic's contact (e.g. a nurse asks for the invite on a different number)
  const [editingContact, setEditingContact] = useState(false);
  const [editNurse, setEditNurse] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editIsp, setEditIsp] = useState('');
  const [editCost, setEditCost] = useState('');
  const [editContract, setEditContract] = useState<'in_contract' | 'out_of_contract' | 'unknown'>('unknown');
  const [savingContact, setSavingContact] = useState(false);

  // "Start onboarding" dialog (Register view → create the clinic in the pipeline)
  const [registerDialog, setRegisterDialog] = useState<RegisterClinic | null>(null);
  const [regNurse, setRegNurse] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regAddress, setRegAddress] = useState('');
  const [registering, setRegistering] = useState(false);

  const authHeaders = useCallback(
    (): Record<string, string> => ({
      Authorization: `Bearer ${localStorage.getItem('admin_token') || ''}`,
    }),
    []
  );

  const fetchPipeline = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/b2b/onboarding-pipeline', {
        headers: authHeaders(),
      });
      if (!response.ok) throw new Error('Failed to fetch pipeline');
      const result: PipelineResponse = await response.json();
      setData(result);
      setLoadError(false);
    } catch (error) {
      console.error('Error fetching pipeline:', error);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, [authHeaders]);

  const fetchPortalOps = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/unjani/portal-ops', {
        headers: authHeaders(),
      });
      if (!response.ok) return;
      const result: PortalOpsResponse = await response.json();
      setPortalOps(result);
    } catch (error) {
      console.error('Error fetching portal ops:', error);
    }
  }, [authHeaders]);

  useEffect(() => {
    fetchPipeline();
    fetchPortalOps();
  }, [fetchPipeline, fetchPortalOps]);

  // ---------- Derived data ----------

  const tableRef = useRef<HTMLDivElement>(null);

  const clinics = useMemo(() => {
    const fromPipeline = data?.clinics ?? [];
    const knownIds = new Set(fromPipeline.map((clinic) => clinic.customer_id));
    const knownNames = new Set(fromPipeline.map((clinic) => normName(clinic.business_name)));
    const extras = (portalOps?.stageClinics ?? [])
      .filter((ref) => !ref.customerId || !knownIds.has(ref.customerId))
      .filter((ref) => !knownNames.has(normName(ref.name)))
      .map(placeholderPipelineClinic);
    return [...fromPipeline, ...extras];
  }, [data, portalOps]);

  const provinces = useMemo(
    () =>
      Array.from(
        new Set([
          ...clinics.map((c) => c.province).filter(Boolean),
          ...REGISTER.clinics.map((c) => c.province),
        ])
      ).sort(),
    [clinics]
  );

  /** Pipeline stage by normalised clinic name — cross-references the register view. */
  const pipelineStageByName = useMemo(
    () =>
      new Map(
        clinics.map((c) => [normName(c.business_name), clinicPortalStage(c, portalOps?.pipelineStages)])
      ),
    [clinics, portalOps]
  );

  const filteredRegister = useMemo(() => {
    const q = query.trim().toLowerCase();
    return REGISTER.clinics
      .filter(
        (c) =>
          (!provinceFilter || c.province === provinceFilter) &&
          (!q || `${c.name} ${c.nurse ?? ''}`.toLowerCase().includes(q))
      )
      .sort((a, b) => (b.saving ?? -Infinity) - (a.saving ?? -Infinity));
  }, [provinceFilter, query]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return clinics.filter(
      (c) =>
        (!stageFilter || clinicPortalStage(c, portalOps?.pipelineStages) === stageFilter) &&
        (!provinceFilter || c.province === provinceFilter) &&
        (!slaFilter || slaStatus(c) === slaFilter) &&
        (!q ||
          `${c.business_name} ${c.account_number} ${c.nurse_name ?? ''}`
            .toLowerCase()
            .includes(q))
    );
  }, [clinics, stageFilter, provinceFilter, slaFilter, query, portalOps]);

  const sorted = useMemo(() => {
    const list = [...filtered];
    list.sort((a, b) => {
      let va: string | number;
      let vb: string | number;
      switch (sortKey) {
        case 'stage':
          va = STAGE_INDEX[clinicPortalStage(a, portalOps?.pipelineStages)] ?? 0;
          vb = STAGE_INDEX[clinicPortalStage(b, portalOps?.pipelineStages)] ?? 0;
          break;
        case 'sla':
          va = a.sla.businessDaysLeft ?? 999;
          vb = b.sla.businessDaysLeft ?? 999;
          break;
        case 'province':
          va = a.province;
          vb = b.province;
          break;
        default:
          va = a.business_name;
          vb = b.business_name;
      }
      return (va < vb ? -1 : va > vb ? 1 : 0) * sortDir;
    });
    return list;
  }, [filtered, sortKey, sortDir, portalOps]);

  const provinceCounts = useMemo(() => {
    const map = new Map<string, number>();
    clinics.forEach((c) => {
      const key = c.province || 'Unknown';
      map.set(key, (map.get(key) ?? 0) + 1);
    });
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [clinics]);

  // ---------- Actions ----------

  const sendLink = async (clinic: PipelineClinic, label: string) => {
    setActingOn(clinic.customer_id);
    try {
      const response = await fetch('/api/admin/unjani/send-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ customerId: clinic.customer_id, channel: 'whatsapp' }),
      });
      const result = await response.json();
      if (response.ok && result.success && result.sent) {
        toast.success(`${label} sent to ${clinic.business_name} via WhatsApp`);
      } else if (response.ok && result.success) {
        toast.warning(
          `Link issued for ${clinic.business_name}, but sending failed${result.sendError ? `: ${result.sendError}` : ''}`
        );
      } else {
        toast.error(result.error || `Failed to send ${label.toLowerCase()}`);
      }
      await Promise.all([fetchPipeline(), fetchPortalOps()]);
    } catch (error) {
      console.error('Error sending link:', error);
      toast.error(`Failed to send ${label.toLowerCase()}`);
    } finally {
      setActingOn(null);
    }
  };


  // Email fallback for nurses without WhatsApp — sends the onboarding
  // requirements + magic link to the clinic's email address.
  const emailLink = async (clinic: PipelineClinic) => {
    setActingOn(clinic.customer_id);
    try {
      const response = await fetch('/api/admin/unjani/send-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ customerId: clinic.customer_id, channel: 'email' }),
      });
      const result = await response.json();
      if (response.ok && result.success && result.sent) {
        toast.success(`Onboarding email sent to ${clinic.business_name}`);
      } else if (response.ok && result.success) {
        toast.warning(
          `Link issued but email failed${result.sendError ? `: ${result.sendError}` : ''}`
        );
      } else {
        toast.error(result.error || 'Failed to send onboarding email');
      }
      await Promise.all([fetchPipeline(), fetchPortalOps()]);
    } catch (error) {
      console.error('Error sending onboarding email:', error);
      toast.error('Failed to send onboarding email');
    } finally {
      setActingOn(null);
    }
  };

  // Send the onboarding link via an explicit channel (the row's channel picker).
  // The main row button keeps its default behaviour; this powers the caret menu.
  const sendInviteVia = async (
    clinic: PipelineClinic,
    channel: 'whatsapp' | 'email' | 'sms'
  ) => {
    const channelLabel = channel === 'whatsapp' ? 'WhatsApp' : channel === 'email' ? 'email' : 'SMS';
    setActingOn(clinic.customer_id);
    try {
      const response = await fetch('/api/admin/unjani/send-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ customerId: clinic.customer_id, channel }),
      });
      const result = await response.json();
      if (response.ok && result.success && result.sent) {
        toast.success(`Onboarding link sent to ${clinic.business_name} via ${channelLabel}`);
      } else if (response.ok && result.success) {
        toast.warning(
          `Link issued but ${channelLabel} delivery failed${result.sendError ? `: ${result.sendError}` : ''}`
        );
      } else {
        toast.error(result.error || `Failed to send via ${channelLabel}`);
      }
      await Promise.all([fetchPipeline(), fetchPortalOps()]);
    } catch (error) {
      console.error('Error sending invite:', error);
      toast.error(`Failed to send via ${channelLabel}`);
    } finally {
      setActingOn(null);
    }
  };

  const issueServiceOrder = async (clinic: PipelineClinic) => {
    setActingOn(clinic.customer_id);
    try {
      const response = await fetch('/api/admin/b2b/issue-service-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ customerId: clinic.customer_id }),
      });
      if (response.ok) {
        toast.success(`Service order issued for ${clinic.business_name}`);
        await fetchPipeline();
      } else {
        const error = await response.json();
        toast.error(error.message || error.error || 'Failed to issue service order');
      }
    } catch (error) {
      console.error('Error issuing service order:', error);
      toast.error('Failed to issue service order');
    } finally {
      setActingOn(null);
    }
  };

  const viewServiceOrder = async (clinic: PipelineClinic) => {
    if (!clinic.service_order_pdf_path) {
      toast.error('No Service Order PDF on file for this clinic');
      return;
    }
    setOpeningServiceOrderId(clinic.customer_id);
    try {
      await openKycDocument(clinic.service_order_pdf_path);
    } catch (error) {
      console.error('Error opening service order:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to open Service Order');
    } finally {
      setOpeningServiceOrderId(null);
    }
  };

  const openRegisterDialog = (clinic: RegisterClinic) => {
    setRegisterTicketId(null);
    setRegisterDialog(clinic);
    setRegNurse(clinic.nurse ?? '');
    setRegPhone('');
    setRegEmail('');
    setRegAddress('');
  };

  const openNominationRegister = (row: NominationRow) => {
    setRegisterTicketId(row.ticket?.id ?? null);
    setRegisterDialog({
      name: row.clinicName,
      province: '',
      nurse: row.contact.contactName ?? null,
      isp: null,
      isp_cost: null,
      saving: null,
      migration_ready: true,
    });
    setRegNurse(row.contact.contactName ?? '');
    setRegPhone(row.contact.mobile ?? '');
    setRegEmail(row.contact.email ?? '');
    setRegAddress(row.contact.address ?? row.address ?? '');
  };

  const openNominatedClinic = (clinic: PipelineClinic) => {
    if (clinic.customer_id.startsWith('check:')) {
      toast.info(
        `${clinic.business_name} is waiting for Unjani NPC to accept the nomination before we send the introduction.`
      );
      return;
    }
    if (!isSitePlaceholder(clinic)) {
      setDrawerClinic(clinic);
      return;
    }
    const fromRegister = REGISTER.clinics.find(
      (row) => normName(row.name) === normName(clinic.business_name)
    );
    if (fromRegister) {
      openRegisterDialog(fromRegister);
      return;
    }
    openNominationRegister({
      source: 'coverage_check',
      clinicName: clinic.business_name,
      address: null,
      contact: {},
      coverageSummary: null,
      createdAt: new Date().toISOString(),
      ticket: null,
      coverageCheckId: null,
    });
  };

  const sendLinkForNomination = (clinicName: string) => {
    const clinic = clinics.find((c) => normName(c.business_name) === normName(clinicName));
    if (!clinic) {
      toast.info('Register the clinic first, then send the onboarding link.');
      return;
    }
    sendLink(clinic, 'Invite');
  };

  const openRegisterClinic = async (clinic: RegisterClinic) => {
    const existing = clinics.find(
      (c) => normName(c.business_name) === normName(clinic.name)
    );
    if (existing) {
      setDrawerClinic(existing);
      return;
    }
    setActingOn(clinic.name);
    try {
      const res = await fetch(
        `/api/admin/unjani/register-clinic-details?name=${encodeURIComponent(clinic.name)}`,
        { headers: { ...authHeaders() } }
      );
      const data = await res.json();
      if (res.ok && data.success) {
        if (data.alreadyInPipeline) {
          await fetchPipeline();
          toast.info('This clinic is already in the pipeline — refresh to see it.');
        } else {
          setRegisterDrawer(data.clinic);
        }
      } else {
        toast.error(data.error || 'Could not load clinic details');
      }
    } catch {
      toast.error('Could not load clinic details');
    } finally {
      setActingOn(null);
    }
  };

  const startEditContact = () => {
    if (!drawerClinic) return;
    setEditNurse(drawerClinic.nurse_name ?? '');
    setEditPhone(drawerClinic.phone ?? '');
    setEditEmail(drawerClinic.email ?? '');
    setEditAddress(drawerClinic.site_address ?? '');
    setEditIsp(drawerClinic.incumbent_isp ?? '');
    setEditCost(drawerClinic.incumbent_cost != null ? String(drawerClinic.incumbent_cost) : '');
    setEditContract(drawerClinic.contract_status ?? 'unknown');
    setEditingContact(true);
  };

  const saveContact = async () => {
    if (!drawerClinic) return;
    setSavingContact(true);
    try {
      const response = await fetch('/api/admin/unjani/update-contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({
          customerId: drawerClinic.customer_id,
          nurseName: editNurse.trim(),
          phone: editPhone.trim(),
          email: editEmail.trim(),
          siteAddress: editAddress.trim(),
          incumbentIsp: editIsp.trim(),
          incumbentCost: editCost.trim(),
          contractStatus: editContract,
        }),
      });
      const result = await response.json();
      if (response.ok && result.success) {
        toast.success('Contact details updated');
        setEditingContact(false);
        // Reflect the change in the open drawer immediately, then refresh the list
        setDrawerClinic((c) =>
          c
            ? {
                ...c,
                nurse_name: editNurse.trim() || null,
                phone: editPhone.trim() || null,
                email: editEmail.trim() || null,
                site_address: editAddress.trim() || null,
                incumbent_isp: editIsp.trim() || null,
                incumbent_cost: editCost.trim() ? Number(editCost.trim()) : null,
                contract_status: editContract,
              }
            : c
        );
        await fetchPipeline();
      } else {
        toast.error(result.error || 'Failed to update contact');
      }
    } catch (error) {
      console.error('Error updating contact:', error);
      toast.error('Failed to update contact');
    } finally {
      setSavingContact(false);
    }
  };

  const submitRegisterClinic = async () => {
    if (!registerDialog) return;
    setRegistering(true);
    try {
      const response = await fetch('/api/admin/unjani/register-clinic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({
          clinicName: registerDialog.name,
          nurseName: regNurse.trim() || undefined,
          phone: regPhone.trim() || undefined,
          email: regEmail.trim() || undefined,
          siteAddress: regAddress.trim() || undefined,
          ticketId: registerTicketId || undefined,
        }),
      });
      const result = await response.json();
      if (response.ok && result.success) {
        toast.success(`${result.businessName} added to the pipeline (${result.accountNumber})`);
        setRegisterDialog(null);
        setRegisterTicketId(null);
        await Promise.all([fetchPipeline(), fetchPortalOps()]);
      } else if (response.status === 409 && registerTicketId) {
        toast.info(result.error || 'Clinic already in the pipeline — nomination marked in progress');
        setRegisterDialog(null);
        setRegisterTicketId(null);
        await Promise.all([fetchPipeline(), fetchPortalOps()]);
      } else {
        toast.error(result.error || 'Failed to add clinic');
      }
    } catch (error) {
      console.error('Error registering clinic:', error);
      toast.error('Failed to add clinic');
    } finally {
      setRegistering(false);
    }
  };

  const advanceStage = async (
    clinic: PipelineClinic,
    body: Record<string, unknown>,
    successMessage: string
  ) => {
    setActingOn(clinic.customer_id);
    try {
      const response = await fetch('/api/admin/unjani/advance-stage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ customerId: clinic.customer_id, ...body }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        toast.error(result.error || 'Failed to advance stage');
        return false;
      }
      toast.success(successMessage);
      await Promise.all([fetchPipeline(), fetchPortalOps()]);
      return true;
    } catch (error) {
      console.error('Error advancing stage:', error);
      toast.error('Failed to advance stage');
      return false;
    } finally {
      setActingOn(null);
    }
  };

  const runNextAction = (clinic: PipelineClinic) => {
    const stage = clinicPortalStage(clinic, portalOps?.pipelineStages);
    switch (operatorAction(stage).primary.id) {
      case 'request_npc_acceptance':
        toast.info(
          `${clinic.business_name} is waiting for Unjani NPC to accept the nomination before we send the introduction.`
        );
        break;
      case 'send_intro':
        sendLink(clinic, 'Introduction');
        break;
      case 'remind':
        sendLink(clinic, 'Reminder');
        break;
      case 'confirm_details':
        setConfirmClinic(clinic);
        break;
      case 'book_visit':
        setBookClinic(clinic);
        setBookVisitDate('');
        setBookVisitNotes('');
        break;
      case 'go_live':
        setGoLiveClinic(clinic);
        setGoLiveDate('');
        setGoLiveInstaller('');
        setGoLiveWholesaleRef('');
        setGoLiveNotes('');
        break;
      case 'done':
        break;
    }
  };

  const runSecondaryAction = (clinic: PipelineClinic, actionId: string) => {
    if (actionId === 'request_changes') {
      setChangesClinic(clinic);
      setChangesReason('');
      return;
    }
    if (actionId === 'open_kyc') {
      if (clinic.submission_id) {
        router.push(`/admin/b2b/vetting/${clinic.submission_id}`);
      } else {
        toast.info('No submission to review yet');
      }
      return;
    }
    if (actionId === 'issue_service_order') {
      issueServiceOrder(clinic);
    }
  };

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 1 ? -1 : 1));
    } else {
      setSortKey(key);
      setSortDir(1);
    }
  };

  // ---------- Render ----------

  if (loading) {
    return (
      <UnjaniAdminModernistShell>
        <AdminPage>
          <LoadingState message="Loading onboarding pipeline…" />
        </AdminPage>
      </UnjaniAdminModernistShell>
    );
  }

  if (loadError || !data) {
    return (
      <UnjaniAdminModernistShell>
        <AdminPage>
          <ErrorState
            title="Failed to load pipeline"
            message="The onboarding pipeline could not be loaded."
            onRetry={() => {
              setLoading(true);
              fetchPipeline();
            }}
          />
        </AdminPage>
      </UnjaniAdminModernistShell>
    );
  }

  const total = clinics.length;
  const portalCounts = portalOps?.stageCounts ?? emptyStageCounts();
  const dashboardKpis = portalOps?.kpis ?? {
    sitesLive: 0,
    inOnboarding: 0,
    preQualified: 0,
    billedSites: 0,
    monthlySpend: 0,
  };
  const portalTotal = ONBOARDING_STAGES.reduce(
    (sum, stage) => sum + (portalCounts[stage.key] ?? 0),
    0
  );
  const maxStageCount = Math.max(...ONBOARDING_STAGES.map((s) => portalCounts[s.key] ?? 0), 1);
  const maxProvinceCount = provinceCounts[0]?.[1] ?? 1;

  return (
    <UnjaniAdminModernistShell>
    <AdminPage>
      <PortalPageHeader
        eyebrow="Unjani Connect"
        title="Clinic Onboarding"
        subtitle={`${portalTotal} clinics on the Unjani guide stages · ${portalOps?.nominations.length ?? 0} nominations to register · ${portalOps?.activations.length ?? 0} ready to go live`}
        actions={
          <div className="inline-flex overflow-hidden rounded-md border border-gray-200 bg-white">
            {(['table', 'kanban', 'register'] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setView(v)}
                className={cn(
                  'px-4 py-2 text-sm font-semibold capitalize transition-colors',
                  view === v ? 'bg-circleTel-navy text-white' : 'text-gray-500 hover:text-gray-900'
                )}
              >
                {v}
              </button>
            ))}
          </div>
        }
      />

      <div className="mb-6">
        <KpiStrip
          variant="cards"
          items={[
            {
              label: 'Sites live',
              value: String(dashboardKpis.sitesLive),
              accent: '#2F9E5E',
              valueColor: '#2F9E5E',
              href: '/admin/unjani/sites-live',
            },
            {
              label: 'In onboarding',
              value: String(dashboardKpis.inOnboarding),
              note: 'Across 5 stages',
              accent: '#13274A',
              href: '/admin/unjani/in-onboarding',
            },
            {
              label: 'Pre-qualified',
              value: String(dashboardKpis.preQualified),
              note: 'Ready to add to the pipeline',
              accent: '#F5841E',
              href: '/admin/unjani/pre-qualified',
            },
            {
              label: 'Monthly spend',
              value: formatZar(dashboardKpis.monthlySpend),
              note: spendNote(dashboardKpis.billedSites, dashboardKpis.monthlySpend),
              accent: '#13274A',
              href: '/admin/unjani/monthly-spend',
            },
          ]}
        />
      </div>

      <UnjaniFulfilmentPanel
        authHeaders={authHeaders}
        onRefresh={() => {
          void Promise.all([fetchPipeline(), fetchPortalOps()]);
        }}
      />

      {view !== 'register' && ((portalOps?.nominations.length ?? 0) > 0 || (portalOps?.activations.length ?? 0) > 0) && (
        <div className="flex flex-wrap gap-2 mb-4">
          {(portalOps?.nominations.length ?? 0) > 0 && (
            <button
              onClick={() => setStageFilter(stageFilter === 'nominated' ? '' : 'nominated')}
              className={cn(
                'rounded-full border px-3 py-1.5 text-xs font-semibold',
                stageFilter === 'nominated'
                  ? 'border-circleTel-orange bg-circleTel-orange-light text-circleTel-orange-accessible'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-circleTel-orange'
              )}
            >
              {portalOps?.nominations.length} nominations to register
            </button>
          )}
          {(portalOps?.activations.length ?? 0) > 0 && (
            <button
              onClick={() => setStageFilter(stageFilter === 'installing' ? '' : 'installing')}
              className={cn(
                'rounded-full border px-3 py-1.5 text-xs font-semibold',
                stageFilter === 'installing'
                  ? 'border-circleTel-orange bg-circleTel-orange-light text-circleTel-orange-accessible'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-circleTel-orange'
              )}
            >
              {portalOps?.activations.length} sites ready to go live
            </button>
          )}
        </div>
      )}

      {view === 'table' && (stageFilter === 'nominated' || stageFilter === '') && (portalOps?.nominations.length ?? 0) > 0 && (
        <div className="mb-6">
          <PortalOpsQueues
            tab="nominations"
            nominations={portalOps?.nominations ?? []}
            activations={[]}
            organisationId={portalOps?.organisationId ?? null}
            authHeaders={authHeaders}
            onRegisterNomination={openNominationRegister}
            onSendLink={sendLinkForNomination}
            onRefresh={async () => {
              await Promise.all([fetchPipeline(), fetchPortalOps()]);
            }}
          />
        </div>
      )}

      {/* Pipeline by stage funnel */}
      <SectionCard
        title="Pipeline by stage"
        action={<span className="text-xs text-gray-400">Click a stage to filter</span>}
        className="mb-6"
      >
        <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-7 gap-2">
          {ONBOARDING_STAGES.map((s) => {
            const count = portalCounts[s.key] ?? 0;
            const overdueInStage = clinics.filter(
              (c) =>
                clinicPortalStage(c, portalOps?.pipelineStages) === s.key &&
                slaStatus(c) === 'err'
            ).length;
            const selected = stageFilter === s.key;
            return (
              <button
                key={s.key}
                onClick={() => {
                  const next = selected ? '' : s.key;
                  setStageFilter(next);
                  if (next) {
                    tableRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }
                }}
                aria-pressed={selected}
                className={cn(
                  'relative rounded-md border p-3 text-left transition-colors',
                  selected
                    ? 'border-circleTel-orange bg-circleTel-orange-light'
                    : 'border-gray-200 bg-white hover:border-circleTel-orange'
                )}
                style={{ borderBottomColor: PORTAL_STAGE_COLORS[s.key], borderBottomWidth: 3 }}
              >
                {overdueInStage > 0 && (
                  <span className="absolute top-2 right-2 text-[10px] font-bold text-red-600 bg-red-50 rounded-full px-1.5 py-0.5">
                    {overdueInStage} overdue
                  </span>
                )}
                <div className="text-2xl font-bold text-circleTel-navy tabular-nums">
                  {count}
                </div>
                <div className="text-xs font-medium text-gray-500 mt-0.5">
                  {portalStageLabel(s.key)}
                </div>
                <div className="h-1 rounded-full bg-gray-100 mt-2 overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.round((count / maxStageCount) * 100)}%`,
                      background: PORTAL_STAGE_COLORS[s.key],
                    }}
                  />
                </div>
              </button>
            );
          })}
        </div>
      </SectionCard>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <SectionCard title="Stage distribution" compact>
          {portalTotal === 0 ? (
            <p className="text-sm text-gray-500">No clinics in pipeline.</p>
          ) : (
            <div className="flex items-center gap-6">
              <svg
                width="150"
                height="150"
                viewBox="0 0 42 42"
                role="img"
                aria-label="Stage distribution donut chart"
                className="shrink-0"
              >
                {(() => {
                  let offset = 25;
                  return ONBOARDING_STAGES.filter((s) => (portalCounts[s.key] ?? 0) > 0).map(
                    (s) => {
                      const pct = ((portalCounts[s.key] ?? 0) / portalTotal) * 100;
                      const seg = (
                        <circle
                          key={s.key}
                          r="15.915"
                          cx="21"
                          cy="21"
                          fill="none"
                          stroke={PORTAL_STAGE_COLORS[s.key]}
                          strokeWidth="5.4"
                          strokeDasharray={`${pct} ${100 - pct}`}
                          strokeDashoffset={offset}
                        />
                      );
                      offset -= pct;
                      return seg;
                    }
                  );
                })()}
                <text
                  x="21"
                  y="20"
                  textAnchor="middle"
                  fontSize="7.5"
                  fontWeight="700"
                  fill="#1B2A4A"
                >
                  {portalTotal}
                </text>
                <text x="21" y="26.5" textAnchor="middle" fontSize="3" fill="#8B8B8B">
                  clinics
                </text>
              </svg>
              <div className="flex flex-col gap-1.5 text-xs min-w-0">
                {ONBOARDING_STAGES.filter((s) => (portalCounts[s.key] ?? 0) > 0).map((s) => (
                  <div key={s.key} className="flex items-center gap-2 text-gray-600">
                    <span
                      className="w-2.5 h-2.5 rounded-sm shrink-0"
                      style={{ background: PORTAL_STAGE_COLORS[s.key] }}
                    />
                    <span className="truncate">{portalStageLabel(s.key)}</span>
                    <span className="ml-auto pl-3 font-semibold text-gray-900 tabular-nums">
                      {portalCounts[s.key] ?? 0}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </SectionCard>

        <SectionCard title="Clinics by province" compact>
          {provinceCounts.length === 0 ? (
            <p className="text-sm text-gray-500">No clinics in pipeline.</p>
          ) : (
            <div className="space-y-2">
              {provinceCounts.map(([province, count]) => (
                <div key={province} className="flex items-center gap-3 text-xs">
                  <span className="w-28 shrink-0 truncate text-gray-600" title={province}>
                    {province}
                  </span>
                  <span className="flex-1 h-3.5 bg-gray-100 rounded-sm overflow-hidden">
                    <span
                      className="block h-full bg-circleTel-navy rounded-sm"
                      style={{ width: `${(count / maxProvinceCount) * 100}%` }}
                    />
                  </span>
                  <span className="w-6 text-right font-semibold tabular-nums">{count}</span>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="relative flex-1 min-w-[220px]">
          <PiMagnifyingGlassBold className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search clinic, account number or nurse…"
            aria-label="Search clinics"
            className="w-full rounded-md border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-circleTel-orange"
          />
        </div>
        <select
          value={provinceFilter}
          onChange={(e) => setProvinceFilter(e.target.value)}
          aria-label="Filter by province"
          className="rounded-md border border-gray-200 bg-white py-2 px-3 text-sm text-gray-700"
        >
          <option value="">All provinces</option>
          {provinces.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
        <select
          value={slaFilter}
          onChange={(e) => setSlaFilter(e.target.value)}
          aria-label="Filter by SLA status"
          className="rounded-md border border-gray-200 bg-white py-2 px-3 text-sm text-gray-700"
        >
          <option value="">All SLA statuses</option>
          <option value="err">Overdue</option>
          <option value="warn">At risk</option>
          <option value="ok">On track</option>
        </select>
        {stageFilter && (
          <button
            onClick={() => setStageFilter('')}
            className="inline-flex items-center gap-1.5 rounded-full bg-circleTel-orange-light px-3 py-1.5 text-xs font-semibold text-circleTel-orange-accessible"
          >
            Stage: {portalStageLabel(stageFilter)}
            <span aria-hidden>×</span>
          </button>
        )}
      </div>

      {/* Table view */}
      {view === 'table' && (
        <div
          ref={tableRef}
          className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
        >
          {sorted.length === 0 ? (
            <EmptyState
              icon={<PiBuildingsBold />}
              title="No clinics match these filters"
              description="Clear a filter or adjust the search to see the pipeline."
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead
                      className="cursor-pointer select-none"
                      onClick={() => toggleSort('name')}
                    >
                      Clinic {sortKey === 'name' && (sortDir === 1 ? '▲' : '▼')}
                    </TableHead>
                    <TableHead
                      className="cursor-pointer select-none"
                      onClick={() => toggleSort('stage')}
                    >
                      Stage {sortKey === 'stage' && (sortDir === 1 ? '▲' : '▼')}
                    </TableHead>
                    <TableHead
                      className="cursor-pointer select-none"
                      onClick={() => toggleSort('sla')}
                    >
                      Vetting SLA {sortKey === 'sla' && (sortDir === 1 ? '▲' : '▼')}
                    </TableHead>
                    <TableHead>Saving p/m</TableHead>
                    <TableHead>Service order</TableHead>
                    <TableHead className="text-right">Next action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sorted.map((clinic) => {
                    const portalStage = clinicPortalStage(clinic, portalOps?.pipelineStages);
                    const meta = stageMeta(portalStage);
                    const st = slaStatus(clinic);
                    const stageIdx = STAGE_INDEX[portalStage] ?? 0;
                    const issued = !!clinic.service_order_issued_at;
                    const primaryId = operatorAction(portalStage).primary.id;
                    const actionable =
                      canRunPrimaryAction(portalStage) && !isSitePlaceholder(clinic);
                    return (
                      <TableRow
                        key={clinic.customer_id}
                        className="cursor-pointer hover:bg-gray-50"
                        onClick={() => openNominatedClinic(clinic)}
                      >
                        <TableCell>
                          <div className="font-semibold text-gray-900">
                            {clinic.business_name}
                          </div>
                          <div className="text-xs text-gray-400 mt-0.5">
                            <span className="font-mono">{clinic.account_number}</span>
                            {clinic.province && <> · {clinic.province}</>}
                            {clinic.nurse_name && <> · {clinic.nurse_name}</>}
                            {clinic.site_address && <> · {clinic.site_address}</>}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span
                            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap"
                            style={{ background: meta.pillBg, color: meta.pillFg }}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-current" />
                            {meta.label}
                          </span>
                          <div className="flex gap-0.5 mt-1.5">
                            {PROGRESS_STAGES.map((s, i) => (
                              <span
                                key={s.key}
                                className={cn(
                                  'w-3 h-1 rounded-full',
                                  i <= stageIdx && portalStage !== 'changes_requested'
                                    ? 'bg-circleTel-orange'
                                    : portalStage === 'changes_requested' && i <= 2
                                      ? 'bg-circleTel-orange'
                                      : 'bg-gray-200'
                                )}
                              />
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          {st === null ? (
                            <span className="text-sm text-gray-400">—</span>
                          ) : (
                            <div
                              className={cn(
                                'flex items-center gap-2 text-xs font-semibold whitespace-nowrap',
                                SLA_TEXT[st]
                              )}
                            >
                              <span className="w-10 h-1.5 rounded-full bg-gray-200 overflow-hidden shrink-0">
                                <span
                                  className={cn('block h-full', SLA_FILL[st])}
                                  style={{ width: `${slaProgress(clinic)}%` }}
                                />
                              </span>
                              {slaLabel(clinic)}
                            </div>
                          )}
                          {clinic.sla.dueDate && (
                            <div className="text-[11px] text-gray-400 mt-1">
                              due {new Date(clinic.sla.dueDate).toLocaleDateString('en-ZA')}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {savingDisplay(SAVING_BY_NAME.get(normName(clinic.business_name)))}
                        </TableCell>
                        <TableCell>
                          {issued ? (
                            <div className="text-sm" onClick={(e) => e.stopPropagation()}>
                              <span className="text-green-600 font-medium">Issued</span>
                              <div className="text-xs text-gray-400">
                                {new Date(
                                  clinic.service_order_issued_at!
                                ).toLocaleDateString('en-ZA')}
                              </div>
                              {clinic.service_order_pdf_path ? (
                                <button
                                  type="button"
                                  className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-circleTel-orange-accessible hover:underline"
                                  disabled={openingServiceOrderId === clinic.customer_id}
                                  onClick={() => viewServiceOrder(clinic)}
                                >
                                  {openingServiceOrderId === clinic.customer_id ? (
                                    <PiSpinnerBold className="h-3 w-3 animate-spin" />
                                  ) : (
                                    <PiFileTextBold className="h-3 w-3" />
                                  )}
                                  View PDF
                                </button>
                              ) : (
                                <div className="mt-1 text-[11px] text-gray-400">No PDF path</div>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">Pending</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {actionable ? (
                            primaryId === 'send_intro' || primaryId === 'remind' ? (
                              // Invite/reminder stages: split button — default WhatsApp +
                              // a caret to pick the channel (WhatsApp · Email · SMS).
                              <div className="inline-flex" onClick={(e) => e.stopPropagation()}>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled={actingOn === clinic.customer_id}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    runNextAction(clinic);
                                  }}
                                  className="border-circleTel-orange text-circleTel-orange-accessible hover:bg-circleTel-orange hover:text-white whitespace-nowrap rounded-r-none border-r-0"
                                >
                                  {actingOn === clinic.customer_id ? 'Working…' : meta.action}
                                </Button>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      disabled={actingOn === clinic.customer_id}
                                      onClick={(e) => e.stopPropagation()}
                                      aria-label="Choose channel"
                                      className="border-circleTel-orange text-circleTel-orange-accessible hover:bg-circleTel-orange hover:text-white rounded-l-none px-2"
                                    >
                                      <PiCaretDownBold className="h-3.5 w-3.5" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem
                                      disabled={!clinic.phone}
                                      onClick={() => sendInviteVia(clinic, 'whatsapp')}
                                    >
                                      <PiWhatsappLogoBold className="mr-2 h-4 w-4" style={{ color: '#25D366' }} />
                                      Send via WhatsApp
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      disabled={!clinic.email}
                                      onClick={() => sendInviteVia(clinic, 'email')}
                                    >
                                      <PiEnvelopeSimpleBold className="mr-2 h-4 w-4 text-circleTel-orange-accessible" />
                                      Send via Email
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      disabled={!clinic.phone}
                                      onClick={() => sendInviteVia(clinic, 'sms')}
                                    >
                                      <PiChatCircleTextBold className="mr-2 h-4 w-4 text-gray-500" />
                                      Send via SMS
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={actingOn === clinic.customer_id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  runNextAction(clinic);
                                }}
                                className="border-circleTel-orange text-circleTel-orange-accessible hover:bg-circleTel-orange hover:text-white whitespace-nowrap"
                              >
                                {actingOn === clinic.customer_id ? 'Working…' : meta.action}
                              </Button>
                            )
                          ) : operatorAction(portalStage).primary.id === 'request_npc_acceptance' ? (
                            <span className="text-xs font-semibold text-gray-600">
                              Awaiting Unjani NPC
                            </span>
                          ) : isSitePlaceholder(clinic) ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                openNominatedClinic(clinic);
                              }}
                              className="border-circleTel-orange text-circleTel-orange-accessible hover:bg-circleTel-orange hover:text-white whitespace-nowrap"
                            >
                              Register clinic
                            </Button>
                          ) : (
                            <span className="text-xs text-gray-400">Live</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
          <div className="flex flex-wrap justify-between gap-2 border-t border-gray-100 px-4 py-3 text-xs text-gray-500">
            <span>
              Showing {sorted.length} of {total} clinics
            </span>
            <span>Execute the same six stages as /unjani</span>
          </div>
        </div>
      )}

      {/* Kanban view — clinics move via operator actions that write deriveStage evidence */}
      {view === 'kanban' && (
        <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-2 items-start">
          {ONBOARDING_STAGES.map((s) => {
            const cards = filtered.filter(
              (c) => clinicPortalStage(c, portalOps?.pipelineStages) === s.key
            );
            const inbox =
              s.key === 'nominated' && (stageFilter === '' || stageFilter === 'nominated')
                ? portalOps?.nominations ?? []
                : [];
            const goLiveInbox =
              s.key === 'installing' && (stageFilter === '' || stageFilter === 'installing')
                ? portalOps?.activations ?? []
                : [];
            return (
              <div
                key={s.key}
                className="bg-gray-50 border border-gray-200 rounded-lg p-2 min-h-[200px]"
              >
                <div className="flex items-center justify-between px-1.5 pb-2 text-xs font-semibold text-gray-600">
                  {portalStageLabel(s.key)}
                  <span className="bg-white border border-gray-200 rounded-full px-2 py-0.5 tabular-nums">
                    {cards.length + inbox.length + goLiveInbox.length}
                  </span>
                </div>
                <div className="space-y-1.5">
                  {inbox.map((row) => (
                    <button
                      key={row.ticket?.id || row.coverageCheckId}
                      onClick={() => openNominationRegister(row)}
                      className="w-full text-left bg-white rounded-md shadow-sm p-2.5 border-l-2 hover:shadow transition-shadow"
                      style={{ borderLeftColor: PORTAL_STAGE_COLORS.nominated }}
                    >
                      <div className="text-xs font-semibold text-gray-900 truncate">
                        {row.clinicName}
                      </div>
                      <div className="text-[11px] text-gray-400 truncate">
                        {row.address || 'Register clinic'}
                      </div>
                      <div className="text-[11px] font-semibold text-circleTel-orange-accessible mt-1">
                        Register clinic
                      </div>
                    </button>
                  ))}
                  {cards.map((clinic) => {
                    const st = slaStatus(clinic);
                    return (
                      <button
                        key={clinic.customer_id}
                        onClick={() => setDrawerClinic(clinic)}
                        className="w-full text-left bg-white rounded-md shadow-sm p-2.5 border-l-2 hover:shadow transition-shadow"
                        style={{
                          borderLeftColor:
                            st === 'err' ? '#DC2626' : st === 'warn' ? '#CA8A04' : PORTAL_STAGE_COLORS[s.key],
                        }}
                      >
                        <div className="text-xs font-semibold text-gray-900 truncate">
                          {clinic.business_name}
                        </div>
                        <div className="text-[11px] text-gray-400 truncate">
                          {clinic.province || '—'}
                          {clinic.nurse_name && <> · {clinic.nurse_name}</>}
                        </div>
                        {s.key !== 'live' && serviceIsActive(clinic) && (
                          <div className="text-[11px] font-semibold text-green-600 mt-1">
                            Pilot service active
                          </div>
                        )}
                        <div className="text-[11px] font-semibold text-circleTel-orange-accessible mt-1">
                          {operatorAction(s.key).primary.label}
                        </div>
                        {st !== null && (
                          <div className={cn('text-[11px] font-semibold mt-1', SLA_TEXT[st])}>
                            {slaLabel(clinic)}
                          </div>
                        )}
                      </button>
                    );
                  })}
                  {goLiveInbox.map((row) => (
                    <div
                      key={row.ticket.id}
                      className="w-full text-left bg-white rounded-md shadow-sm p-2.5 border-l-2"
                      style={{ borderLeftColor: PORTAL_STAGE_COLORS.installing }}
                    >
                      <div className="text-xs font-semibold text-gray-900 truncate">
                        {row.clinicName}
                      </div>
                      <div className="text-[11px] text-gray-400 truncate">{row.siteName}</div>
                      <div className="text-[11px] font-semibold text-circleTel-orange-accessible mt-1">
                        Go live · {row.siteStatus}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Network register view — the full 253-clinic MSA schedule (static reference data) */}
      {view === 'register' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Network register"
              value={REGISTER.summary.total_clinics}
              subtitle={`${total} already in the pipeline`}
            />
            <StatCard
              label="Clinics that save"
              value={REGISTER.summary.clinics_with_saving}
              subtitle="cheaper on the R450 MSA fee"
            />
            <StatCard
              label="Cost increase / no data"
              value={`${REGISTER.summary.clinics_with_cost_increase} / ${REGISTER.summary.clinics_no_cost_data}`}
              subtitle="need a value conversation first"
            />
            <StatCard
              label="Net saving across network"
              value={fmtRand(REGISTER.summary.net_monthly_saving_rands) + ' p/m'}
              subtitle={`MSA schedule v${REGISTER.version} · ${REGISTER.as_of}`}
            />
          </div>

          <SectionCard title="Top displacement savings" compact>
            <div className="space-y-2">
              {REGISTER.clinics
                .filter((c) => (c.saving ?? 0) > 0)
                .sort((a, b) => (b.saving ?? 0) - (a.saving ?? 0))
                .slice(0, 6)
                .map((c, _, arr) => (
                  <div key={c.name} className="flex items-center gap-3 text-xs">
                    <span className="w-36 shrink-0 truncate text-gray-600" title={c.name}>
                      {c.name}
                    </span>
                    <span className="flex-1 h-3.5 bg-gray-100 rounded-sm overflow-hidden">
                      <span
                        className="block h-full bg-circleTel-orange rounded-sm"
                        style={{ width: `${((c.saving ?? 0) / (arr[0].saving ?? 1)) * 100}%` }}
                      />
                    </span>
                    <span className="w-16 text-right font-semibold tabular-nums">
                      {fmtRand(c.saving ?? 0)}
                    </span>
                  </div>
                ))}
            </div>
          </SectionCard>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            {filteredRegister.length === 0 ? (
              <EmptyState
                icon={<PiBuildingsBold />}
                title="No register clinics match these filters"
                description="Clear the search or province filter."
              />
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Clinic</TableHead>
                      <TableHead>Current ISP</TableHead>
                      <TableHead>Saving p/m</TableHead>
                      <TableHead>Migration ready</TableHead>
                      <TableHead>Pipeline status</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRegister.map((c) => {
                      const stage = pipelineStageByName.get(normName(c.name));
                      const meta = stage ? stageMeta(stage) : null;
                      return (
                        <TableRow
                          key={c.name}
                          onClick={() => openRegisterClinic(c)}
                          className="cursor-pointer hover:bg-gray-50"
                        >
                          <TableCell>
                            <div className="font-semibold text-gray-900">{c.name}</div>
                            <div className="text-xs text-gray-400 mt-0.5">
                              {c.province}
                              {c.nurse && <> · {c.nurse}</>}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-gray-600 whitespace-nowrap">
                            {c.isp ? (
                              <>
                                {c.isp}
                                {c.isp_cost != null && (
                                  <span className="text-gray-400"> · {fmtRand(c.isp_cost)} p/m</span>
                                )}
                              </>
                            ) : (
                              <span className="text-gray-400">No data</span>
                            )}
                          </TableCell>
                          <TableCell>{savingDisplay(c.saving)}</TableCell>
                          <TableCell>
                            {c.migration_ready ? (
                              <span className="text-sm font-medium text-green-600">Yes</span>
                            ) : (
                              <span className="text-sm text-gray-400">No</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {meta ? (
                              <span
                                className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap"
                                style={{ background: meta.pillBg, color: meta.pillFg }}
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-current" />
                                {meta.label}
                              </span>
                            ) : (
                              <span className="text-xs text-gray-400">Not started</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {meta ? (
                              <span className="text-xs text-gray-400">In pipeline</span>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openRegisterDialog(c);
                                }}
                                className="border-circleTel-orange text-circleTel-orange-accessible hover:bg-circleTel-orange hover:text-white whitespace-nowrap"
                              >
                                Start onboarding
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
            <div className="flex flex-wrap justify-between gap-2 border-t border-gray-100 px-4 py-3 text-xs text-gray-500">
              <span>
                Showing {filteredRegister.length} of {REGISTER.summary.total_clinics} register clinics
                · sorted by saving
              </span>
              <span>
                New clinics need coverage check → install → activation before the onboarding wizard
              </span>
            </div>
          </div>
        </div>
      )}

      {view === 'table' && (stageFilter === 'installing' || stageFilter === '') && (portalOps?.activations.length ?? 0) > 0 && (
        <div className="mt-6">
          <PortalOpsQueues
            tab="activations"
            nominations={[]}
            activations={portalOps?.activations ?? []}
            organisationId={portalOps?.organisationId ?? null}
            authHeaders={authHeaders}
            onRegisterNomination={openNominationRegister}
            onSendLink={sendLinkForNomination}
            onRefresh={async () => {
              await Promise.all([fetchPipeline(), fetchPortalOps()]);
            }}
          />
        </div>
      )}

      {/* Start-onboarding dialog (Register view) */}
      <Dialog
        open={!!registerDialog}
        onOpenChange={(open) => {
          if (!open && !registering) {
            setRegisterDialog(null);
            setRegisterTicketId(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Start onboarding — {registerDialog?.name}</DialogTitle>
            <DialogDescription>
              Creates the clinic in the pipeline at &ldquo;Clinic nominated&rdquo;. Billing-safe:
              no charges until go-live. Next step is Unjani NPC acceptance, then introduction.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Professional nurse
              </label>
              <input
                type="text"
                value={regNurse}
                onChange={(e) => setRegNurse(e.target.value)}
                placeholder="Nurse name"
                className="w-full rounded-md border border-gray-200 py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-circleTel-orange"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                WhatsApp number <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                value={regPhone}
                onChange={(e) => setRegPhone(e.target.value)}
                placeholder="082 123 4567"
                className="w-full rounded-md border border-gray-200 py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-circleTel-orange"
              />
              <p className="text-xs text-gray-400 mt-1">The onboarding invite is sent here.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                placeholder="clinic@unjani.org"
                className="w-full rounded-md border border-gray-200 py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-circleTel-orange"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Site address</label>
              <input
                type="text"
                value={regAddress}
                onChange={(e) => setRegAddress(e.target.value)}
                placeholder="Leave blank to use the network register address"
                className="w-full rounded-md border border-gray-200 py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-circleTel-orange"
              />
              <p className="text-xs text-gray-400 mt-1">
                The nurse confirms this in the wizard. Blank uses the address on file.
              </p>
            </div>
            {registerDialog && (
              <p className="text-xs text-gray-500">
                {registerDialog.province}
                {registerDialog.saving !== null && registerDialog.saving > 0 && (
                  <> · saves {fmtRand(registerDialog.saving)} p/m vs {registerDialog.isp}</>
                )}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRegisterDialog(null)}
              disabled={registering}
            >
              Cancel
            </Button>
            <Button
              onClick={submitRegisterClinic}
              disabled={registering || !regPhone.trim() || !regEmail.trim()}
              className="bg-circleTel-orange hover:bg-circleTel-orange-dark text-white"
            >
              {registering ? 'Adding…' : 'Add to pipeline'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail drawer */}
      <Sheet
        open={!!drawerClinic}
        onOpenChange={(open) => {
          if (!open) {
            setDrawerClinic(null);
            setEditingContact(false);
          }
        }}
      >
        <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col gap-0 bg-white">
          {drawerClinic && (
            <>
              <SheetHeader className="bg-circleTel-navy text-white p-6 space-y-1">
                <div className="font-mono text-xs text-white/60">
                  {drawerClinic.account_number}
                </div>
                <SheetTitle className="text-white">
                  {drawerClinic.business_name}
                </SheetTitle>
                <span
                  className="inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold bg-white/15 text-white"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-current" />
                  {stageMeta(clinicPortalStage(drawerClinic, portalOps?.pipelineStages)).label}
                </span>
              </SheetHeader>
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                      Contact
                    </h4>
                    {!editingContact && (
                      <button
                        onClick={startEditContact}
                        className="text-xs font-semibold text-circleTel-orange-accessible hover:text-circleTel-orange"
                      >
                        Edit
                      </button>
                    )}
                  </div>
                  {editingContact ? (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Professional nurse</label>
                        <input
                          type="text"
                          value={editNurse}
                          onChange={(e) => setEditNurse(e.target.value)}
                          className="w-full rounded-md border border-gray-200 py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-circleTel-orange"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">
                          Phone <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="tel"
                          value={editPhone}
                          onChange={(e) => setEditPhone(e.target.value)}
                          placeholder="082 123 4567"
                          className="w-full rounded-md border border-gray-200 py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-circleTel-orange"
                        />
                        <p className="text-xs text-gray-400 mt-1">The onboarding invite is sent here.</p>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Email</label>
                        <input
                          type="email"
                          value={editEmail}
                          onChange={(e) => setEditEmail(e.target.value)}
                          className="w-full rounded-md border border-gray-200 py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-circleTel-orange"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Site address</label>
                        <input
                          value={editAddress}
                          onChange={(e) => setEditAddress(e.target.value)}
                          placeholder="Site address"
                          className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Current provider</label>
                        <input
                          value={editIsp}
                          onChange={(e) => setEditIsp(e.target.value)}
                          placeholder="Current provider (e.g. MTN)"
                          className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Current monthly cost</label>
                        <input
                          value={editCost}
                          onChange={(e) => setEditCost(e.target.value)}
                          inputMode="numeric"
                          placeholder="Current monthly cost (Rands)"
                          className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Contract status</label>
                        <select
                          value={editContract}
                          onChange={(e) => setEditContract(e.target.value as typeof editContract)}
                          className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
                        >
                          <option value="unknown">Contract: Unknown</option>
                          <option value="in_contract">In contract</option>
                          <option value="out_of_contract">Out of contract</option>
                        </select>
                      </div>
                      <div className="flex gap-2 pt-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingContact(false)}
                          disabled={savingContact}
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={saveContact}
                          disabled={savingContact || editPhone.trim().length < 6}
                          className="bg-circleTel-orange hover:bg-circleTel-orange-dark text-white"
                        >
                          {savingContact ? 'Saving…' : 'Save contact'}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    (
                      [
                        ['Professional nurse', drawerClinic.nurse_name],
                        ['Phone', drawerClinic.phone],
                        ['Email', drawerClinic.email],
                        ['Province', drawerClinic.province],
                      ] as const
                    ).map(([label, value]) => (
                      <div
                        key={label}
                        className="flex justify-between gap-4 py-1.5 border-b border-gray-50 text-sm"
                      >
                        <span className="text-gray-500 shrink-0">{label}</span>
                        <span className="font-medium text-gray-900 text-right break-all">
                          {value || '—'}
                        </span>
                      </div>
                    ))
                  )}
                </div>
                {/* Site & current service */}
                <div className="px-6 py-4 border-t border-gray-100 -mx-6">
                  <p className="text-[11px] font-semibold tracking-wide text-gray-400 mb-3">
                    SITE &amp; CURRENT SERVICE
                  </p>
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between gap-4">
                      <dt className="text-gray-500">Site address</dt>
                      <dd className="text-gray-900 text-right">
                        {drawerClinic.site_address || '—'}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-gray-500">Current provider</dt>
                      <dd className="text-gray-900 text-right">
                        {drawerClinic.incumbent_isp
                          ? `${drawerClinic.incumbent_isp}${drawerClinic.incumbent_cost ? ` · ${fmtRand(drawerClinic.incumbent_cost)}/mo` : ''}`
                          : '—'}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-4 items-center">
                      <dt className="text-gray-500">Contract</dt>
                      <dd><ContractBadge status={drawerClinic.contract_status} /></dd>
                    </div>
                    {drawerClinic.current_service && (
                      <>
                        <div className="flex justify-between gap-4 border-t border-gray-100 pt-2">
                          <dt className="text-gray-500">CircleTel service</dt>
                          <dd className="text-gray-900 text-right">
                            <span
                              className={cn(
                                'inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold',
                                serviceIsActive(drawerClinic)
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-gray-100 text-gray-600'
                              )}
                            >
                              {displayStatus(drawerClinic.current_service.status)}
                            </span>
                            <div className="mt-1 text-xs text-gray-500">
                              {drawerClinic.current_service.package_name || 'Connectivity'}
                              {drawerClinic.current_service.monthly_price != null &&
                                ` · ${fmtRand(Number(drawerClinic.current_service.monthly_price))}/mo`}
                            </div>
                          </dd>
                        </div>
                        <div className="flex justify-between gap-4">
                          <dt className="text-gray-500">Activated</dt>
                          <dd className="text-gray-900 text-right">
                            {displayDate(drawerClinic.current_service.activation_date)}
                          </dd>
                        </div>
                        <div className="flex justify-between gap-4">
                          <dt className="text-gray-500">Billing day</dt>
                          <dd className="text-gray-900 text-right">
                            {drawerClinic.current_service.billing_day
                              ? `Day ${drawerClinic.current_service.billing_day}`
                              : '—'}
                          </dd>
                        </div>
                        <div className="flex justify-between gap-4">
                          <dt className="text-gray-500">Last invoice date</dt>
                          <dd className="text-gray-900 text-right">
                            {displayDate(drawerClinic.current_service.last_invoice_date)}
                          </dd>
                        </div>
                      </>
                    )}
                    <div className="flex justify-between gap-4 border-t border-gray-100 pt-2 items-start">
                      <dt className="text-gray-500">Service order</dt>
                      <dd className="text-gray-900 text-right">
                        {drawerClinic.service_order_issued_at ? (
                          <>
                            <div className="text-sm font-medium text-green-700">Issued</div>
                            <div className="text-xs text-gray-500">
                              {displayDate(drawerClinic.service_order_issued_at)}
                            </div>
                            {drawerClinic.service_order_pdf_path ? (
                              <button
                                type="button"
                                className="mt-1.5 inline-flex items-center gap-1 text-xs font-semibold text-circleTel-orange-accessible hover:underline"
                                disabled={openingServiceOrderId === drawerClinic.customer_id}
                                onClick={() => viewServiceOrder(drawerClinic)}
                              >
                                {openingServiceOrderId === drawerClinic.customer_id ? (
                                  <PiSpinnerBold className="h-3 w-3 animate-spin" />
                                ) : (
                                  <PiFileTextBold className="h-3 w-3" />
                                )}
                                View Service Order PDF
                              </button>
                            ) : (
                              <div className="mt-1 text-xs text-gray-400">No PDF on file</div>
                            )}
                          </>
                        ) : (
                          <span className="text-sm text-gray-400">Not issued</span>
                        )}
                      </dd>
                    </div>
                    {drawerClinic.latest_invoice && (
                      <div className="flex justify-between gap-4 border-t border-gray-100 pt-2">
                        <dt className="text-gray-500">Latest invoice</dt>
                        <dd className="text-gray-900 text-right">
                          <div className="font-medium">
                            {drawerClinic.latest_invoice.invoice_number || '—'} ·{' '}
                            {displayStatus(drawerClinic.latest_invoice.status)}
                          </div>
                          <div className="text-xs text-gray-500">
                            {displayDate(drawerClinic.latest_invoice.invoice_date)}
                            {drawerClinic.latest_invoice.total_amount != null &&
                              ` · ${fmtRand(Number(drawerClinic.latest_invoice.total_amount))}`}
                          </div>
                          <div className="text-xs text-gray-500">
                            {displayStatus(drawerClinic.latest_invoice.payment_collection_method)}
                            {drawerClinic.latest_invoice.paid_at
                              ? ` · paid ${displayDate(drawerClinic.latest_invoice.paid_at)}`
                              : drawerClinic.latest_invoice.amount_due != null &&
                                  Number(drawerClinic.latest_invoice.amount_due) > 0
                                ? ` · ${fmtRand(Number(drawerClinic.latest_invoice.amount_due))} due`
                                : ''}
                          </div>
                        </dd>
                      </div>
                    )}
                  </dl>
                </div>
                <div>
                  <h4 className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-3">
                    Onboarding timeline
                  </h4>
                  <ul>
                    {ONBOARDING_STAGES.map((s, i) => {
                      const current = clinicPortalStage(drawerClinic, portalOps?.pipelineStages);
                      const idx = STAGE_INDEX[current] ?? 0;
                      const state = s.key === current ? 'now' : i < idx ? 'done' : 'todo';
                      return (
                        <li key={s.key} className="relative pl-6 pb-4 text-sm last:pb-0">
                          <span
                            className={cn(
                              'absolute left-0 top-1 w-2.5 h-2.5 rounded-full',
                              state === 'done' && 'bg-green-600',
                              state === 'now' &&
                                'bg-circleTel-orange ring-4 ring-circleTel-orange-light',
                              state === 'todo' && 'bg-gray-200'
                            )}
                          />
                          {i < ONBOARDING_STAGES.length - 1 && (
                            <span className="absolute left-[4.5px] top-4 bottom-0 w-px bg-gray-200" />
                          )}
                          <span
                            className={cn(
                              state === 'now'
                                ? 'font-semibold text-gray-900'
                                : 'text-gray-600'
                            )}
                          >
                            {portalStageLabel(s.key)}
                          </span>
                          {state === 'now' && (
                            <div className="text-xs text-gray-400 mt-0.5">
                              {operatorAction(s.key).primary.label}
                              {s.description ? ` · ${s.description}` : ''}
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>
              <div className="border-t border-gray-100 p-4 flex flex-col gap-2">
                {operatorAction(clinicPortalStage(drawerClinic, portalOps?.pipelineStages)).secondary.map(
                  (action) => (
                    <Button
                      key={action.id}
                      variant="outline"
                      className="w-full"
                      disabled={actingOn === drawerClinic.customer_id}
                      onClick={() => runSecondaryAction(drawerClinic, action.id)}
                    >
                      {action.label}
                    </Button>
                  )
                )}
                {drawerClinic.email &&
                  ['nominated', 'introduced', 'changes_requested'].includes(
                    clinicPortalStage(drawerClinic, portalOps?.pipelineStages)
                  ) && (
                    <Button
                      variant="outline"
                      className="w-full"
                      disabled={actingOn === drawerClinic.customer_id}
                      onClick={() => emailLink(drawerClinic)}
                      title="Fallback for nurses without WhatsApp"
                    >
                      {actingOn === drawerClinic.customer_id
                        ? 'Working…'
                        : 'Email onboarding link'}
                    </Button>
                  )}
                {canRunPrimaryAction(clinicPortalStage(drawerClinic, portalOps?.pipelineStages)) ? (
                  <Button
                    className="w-full bg-circleTel-orange hover:bg-circleTel-orange-dark text-white"
                    disabled={actingOn === drawerClinic.customer_id}
                    onClick={() => runNextAction(drawerClinic)}
                  >
                    {actingOn === drawerClinic.customer_id
                      ? 'Working…'
                      : operatorAction(
                          clinicPortalStage(drawerClinic, portalOps?.pipelineStages)
                        ).primary.label}
                  </Button>
                ) : (
                  <div className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-center text-sm font-semibold text-green-700">
                    Site live
                  </div>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Pre-onboarding drawer (register clinic) */}
      <Sheet open={!!registerDrawer} onOpenChange={(o) => { if (!o) setRegisterDrawer(null); }}>
        <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col gap-0 bg-white">
          {registerDrawer && (
            <>
              <SheetHeader className="bg-circleTel-navy text-white p-6 space-y-1">
                <span className="text-xs uppercase tracking-wide text-white/70">Not in pipeline</span>
                <SheetTitle className="text-white">{registerDrawer.businessName}</SheetTitle>
                <span className="inline-flex w-fit items-center rounded-full bg-white/15 px-2 py-0.5 text-[11px]">
                  Awaiting onboarding
                </span>
              </SheetHeader>

              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
                <div>
                  <p className="text-[11px] font-semibold tracking-wide text-gray-400 mb-3">CONTACT</p>
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between gap-4"><dt className="text-gray-500">Professional nurse</dt><dd className="text-gray-900 text-right">{registerDrawer.nurseName || '—'}</dd></div>
                    <div className="flex justify-between gap-4"><dt className="text-gray-500">Phone</dt><dd className="text-gray-900 text-right">{registerDrawer.phone || '—'}</dd></div>
                    <div className="flex justify-between gap-4"><dt className="text-gray-500">Email</dt><dd className="text-gray-900 text-right">{registerDrawer.email || '—'}</dd></div>
                    <div className="flex justify-between gap-4"><dt className="text-gray-500">Province</dt><dd className="text-gray-900 text-right">{registerDrawer.province || '—'}</dd></div>
                  </dl>
                </div>

                <div>
                  <p className="text-[11px] font-semibold tracking-wide text-gray-400 mb-3">SITE &amp; CURRENT SERVICE</p>
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between gap-4"><dt className="text-gray-500">Site address</dt><dd className="text-gray-900 text-right">{registerDrawer.siteAddress || '—'}</dd></div>
                    <div className="flex justify-between gap-4"><dt className="text-gray-500">Current provider</dt><dd className="text-gray-900 text-right">{registerDrawer.incumbentIsp ? `${registerDrawer.incumbentIsp}${registerDrawer.incumbentCost ? ` · ${fmtRand(registerDrawer.incumbentCost)}/mo` : ''}` : '—'}</dd></div>
                    <div className="flex justify-between gap-4 items-center"><dt className="text-gray-500">Contract</dt><dd><ContractBadge status={registerDrawer.contractStatus} /></dd></div>
                    <div className="flex justify-between gap-4"><dt className="text-gray-500">Saving p/m</dt><dd className="text-right">{savingDisplay(registerDrawer.savingPerMonth)}</dd></div>
                  </dl>
                </div>
              </div>

              <div className="border-t border-gray-100 p-4">
                <Button
                  className="w-full bg-circleTel-orange hover:bg-circleTel-orange-dark text-white"
                  onClick={() => {
                    const reg = REGISTER.clinics.find((cl) => cl.name === registerDrawer.registerName);
                    setRegisterDrawer(null);
                    if (reg) openRegisterDialog(reg);
                  }}
                >
                  Start onboarding
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      <Dialog open={!!confirmClinic} onOpenChange={(open) => { if (!open) setConfirmClinic(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm clinic details</DialogTitle>
            <DialogDescription>
              Marks {confirmClinic?.business_name} as details confirmed. This books the
              installation-visit step on /unjani.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmClinic(null)}>Cancel</Button>
            <Button
              className="bg-circleTel-orange hover:bg-circleTel-orange-dark text-white"
              disabled={!!confirmClinic && actingOn === confirmClinic.customer_id}
              onClick={async () => {
                if (!confirmClinic) return;
                const ok = await advanceStage(
                  confirmClinic,
                  { action: 'confirm_details' },
                  `Details confirmed for ${confirmClinic.business_name}`
                );
                if (ok) setConfirmClinic(null);
              }}
            >
              Confirm details
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!changesClinic} onOpenChange={(open) => { if (!open) setChangesClinic(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Request changes</DialogTitle>
            <DialogDescription>
              The clinic stays on step 3 until they resubmit corrected details.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">What needs correcting?</label>
            <Input
              value={changesReason}
              onChange={(e) => setChangesReason(e.target.value)}
              placeholder="e.g. Street number is wrong"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setChangesClinic(null)}>Cancel</Button>
            <Button
              className="bg-circleTel-orange hover:bg-circleTel-orange-dark text-white"
              disabled={!changesReason.trim() || (!!changesClinic && actingOn === changesClinic.customer_id)}
              onClick={async () => {
                if (!changesClinic) return;
                const ok = await advanceStage(
                  changesClinic,
                  { action: 'request_changes', reason: changesReason },
                  `Changes requested for ${changesClinic.business_name}`
                );
                if (ok) setChangesClinic(null);
              }}
            >
              Request changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!bookClinic} onOpenChange={(open) => { if (!open) setBookClinic(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Book installation visit</DialogTitle>
            <DialogDescription>
              Agree a date with the on-site contact. Avoid the 25th to the 7th. This creates the
              pending site and moves the clinic to survey, install and test.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-700">Visit date</label>
              <Input
                type="date"
                value={bookVisitDate}
                onChange={(e) => setBookVisitDate(e.target.value)}
                className="mt-1"
              />
              {bookVisitDate && isVisitWindowBlocked(bookVisitDate) && (
                <p className="text-xs text-red-600 mt-1">
                  Choose a date outside the 25th–7th window.
                </p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Notes</label>
              <Input
                value={bookVisitNotes}
                onChange={(e) => setBookVisitNotes(e.target.value)}
                placeholder="Access instructions, contact on the day…"
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBookClinic(null)}>Cancel</Button>
            <Button
              className="bg-circleTel-orange hover:bg-circleTel-orange-dark text-white"
              disabled={
                !bookVisitDate ||
                isVisitWindowBlocked(bookVisitDate) ||
                (!!bookClinic && actingOn === bookClinic.customer_id)
              }
              onClick={async () => {
                if (!bookClinic) return;
                const ok = await advanceStage(
                  bookClinic,
                  { action: 'book_visit', visitDate: bookVisitDate, notes: bookVisitNotes },
                  `Visit booked for ${bookClinic.business_name}`
                );
                if (ok) setBookClinic(null);
              }}
            >
              Book visit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!goLiveClinic} onOpenChange={(open) => { if (!open) setGoLiveClinic(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Go live</DialogTitle>
            <DialogDescription>
              Issues the Ready for Service date. The free first month starts on go-live.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-700">Go-live date</label>
              <Input
                type="date"
                value={goLiveDate}
                onChange={(e) => setGoLiveDate(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Installer</label>
              <Input
                value={goLiveInstaller}
                onChange={(e) => setGoLiveInstaller(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Wholesale order ref</label>
              <Input
                value={goLiveWholesaleRef}
                onChange={(e) => setGoLiveWholesaleRef(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Notes</label>
              <Input
                value={goLiveNotes}
                onChange={(e) => setGoLiveNotes(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGoLiveClinic(null)}>Cancel</Button>
            <Button
              className="bg-circleTel-orange hover:bg-circleTel-orange-dark text-white"
              disabled={!!goLiveClinic && actingOn === goLiveClinic.customer_id}
              onClick={async () => {
                if (!goLiveClinic) return;
                const ok = await advanceStage(
                  goLiveClinic,
                  {
                    action: 'go_live',
                    installedAt: goLiveDate || undefined,
                    installedBy: goLiveInstaller || undefined,
                    wholesaleOrderRef: goLiveWholesaleRef || undefined,
                    notes: goLiveNotes || undefined,
                  },
                  `${goLiveClinic.business_name} is live`
                );
                if (ok) setGoLiveClinic(null);
              }}
            >
              Go live
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </AdminPage>
    </UnjaniAdminModernistShell>
  );
}
