import {
  OPERATIONS_PREVIEW_TIME_ZONE,
  type OperationsPreviewData,
} from "@/lib/admin/operations-preview/types";

export type GrowthRange = "6m" | "12m";

export type DashboardKpiLabel =
  | "Active customers"
  | "Active MRR"
  | "Open tickets"
  | "Network incidents";

export interface DashboardKpi {
  label: DashboardKpiLabel;
  value: string;
  detail: string;
  status?: string;
}

export type OperationsRowLabel =
  | "Scheduled installs"
  | "Orders in progress"
  | "Priority tickets"
  | "Available technicians";

export type FinanceRowLabel =
  | "Billed"
  | "Collected"
  | "Outstanding"
  | "Paid invoices";

export interface DashboardTableRow<
  Label extends OperationsRowLabel | FinanceRowLabel =
    | OperationsRowLabel
    | FinanceRowLabel,
> {
  label: Label;
  value: string;
}

const zarFormatter = new Intl.NumberFormat("en-ZA", {
  style: "currency",
  currency: "ZAR",
});

const countFormatter = new Intl.NumberFormat("en-ZA", {
  maximumFractionDigits: 0,
});

const generatedAtFormatter = new Intl.DateTimeFormat("en-ZA", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: OPERATIONS_PREVIEW_TIME_ZONE,
});

function assertSafeInteger(value: number, label: string): void {
  if (!Number.isSafeInteger(value)) {
    throw new RangeError(`${label} must be a safe integer`);
  }
}

function formatCount(value: number): string {
  assertSafeInteger(value, "Count");
  return countFormatter.format(value);
}

export function formatZar(cents: number): string {
  assertSafeInteger(cents, "Money in cents");
  return zarFormatter.format(cents / 100);
}

export function formatGeneratedAt(iso: string): string {
  if (
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/.test(
      iso,
    )
  ) {
    throw new RangeError("generatedAt must be a valid ISO timestamp");
  }

  const generatedAt = new Date(iso);
  if (Number.isNaN(generatedAt.getTime())) {
    throw new RangeError("generatedAt must be a valid ISO timestamp");
  }

  return generatedAtFormatter.format(generatedAt);
}

export function buildKpis(data: OperationsPreviewData): DashboardKpi[] {
  return [
    {
      label: "Active customers",
      value: formatCount(data.kpis.activeCustomers),
      detail: "Distinct customers with active services",
    },
    {
      label: "Active MRR",
      value: formatZar(data.kpis.activeMrrCents),
      detail: "Recurring run-rate from active services",
    },
    {
      label: "Open tickets",
      value: formatCount(data.kpis.openTickets),
      detail: "Open, pending, or in progress",
      status: `${formatCount(data.kpis.needsAttention)} high or urgent`,
    },
    {
      label: "Network incidents",
      value: formatCount(data.kpis.networkIncidents),
      detail: "Unresolved incidents",
      status: `${formatCount(data.kpis.servicesImpacted)} services impacted`,
    },
  ];
}

export function buildGrowthSeries(
  data: OperationsPreviewData,
  range: GrowthRange,
): OperationsPreviewData["growth"] {
  return range === "6m" ? data.growth.slice(-6) : data.growth;
}

export function buildOperationsRows(
  data: OperationsPreviewData,
): Array<DashboardTableRow<OperationsRowLabel>> {
  return [
    {
      label: "Scheduled installs",
      value: formatCount(data.operations.scheduledInstalls),
    },
    {
      label: "Orders in progress",
      value: formatCount(data.operations.ordersInProgress),
    },
    {
      label: "Priority tickets",
      value: formatCount(data.operations.priorityTickets),
    },
    {
      label: "Available technicians",
      value: formatCount(data.operations.availableTechnicians),
    },
  ];
}

export function buildFinanceRows(
  data: OperationsPreviewData,
): Array<DashboardTableRow<FinanceRowLabel>> {
  return [
    { label: "Billed", value: formatZar(data.finance.billedCents) },
    { label: "Collected", value: formatZar(data.finance.collectedCents) },
    { label: "Outstanding", value: formatZar(data.finance.outstandingCents) },
    {
      label: "Paid invoices",
      value: formatCount(data.finance.paidInvoices),
    },
  ];
}
