import "server-only";

import { createClient } from "../../supabase/server";
import {
  aggregateOperationsPreview,
  buildJohannesburgMonthWindows,
} from "./aggregate";
import {
  OPERATIONS_PREVIEW_TIME_ZONE,
  type ActiveServiceRow,
  type IncidentRow,
  type InvoiceRow,
  type MoneyValue,
  type OperationsPreviewData,
} from "./types";

const OPEN_TICKET_STATUSES = ["open", "pending", "in_progress"];
const PRIORITY_TICKET_PRIORITIES = ["high", "urgent"];
const SCHEDULED_INSTALL_STATUSES = ["scheduled", "rescheduled"];
const EXCLUDED_ORDER_STATUSES = "(active,suspended,cancelled,failed)";
const EXCLUDED_INVOICE_STATUSES = "(voided,cancelled)";

type OperationsPreviewSupabaseClient = Awaited<ReturnType<typeof createClient>>;

export interface OperationsPreviewQueryError {
  message: string;
}

export interface OperationsPreviewPageResult<T> {
  data: T[] | null;
  error: OperationsPreviewQueryError | null;
}

export interface OperationsPreviewRepository {
  getActiveServices(): Promise<ActiveServiceRow[]>;
  countOpenTickets(): Promise<number>;
  countPriorityTickets(): Promise<number>;
  getUnresolvedIncidents(): Promise<IncidentRow[]>;
  getCustomerCounts(monthEndExclusiveIso: string[]): Promise<number[]>;
  getInvoices(
    startDate: string,
    endDateExclusive: string,
  ): Promise<InvoiceRow[]>;
  countScheduledInstalls(today: string): Promise<number>;
  countOrdersInProgress(): Promise<number>;
  countAvailableTechnicians(): Promise<number>;
}

export async function collectPages<T>(
  loadPage: (
    from: number,
    to: number,
  ) => Promise<OperationsPreviewPageResult<T>>,
  pageSize = 1_000,
): Promise<T[]> {
  if (!Number.isSafeInteger(pageSize) || pageSize <= 0) {
    throw new Error("pageSize must be a positive safe integer");
  }

  const rows: T[] = [];
  let from = 0;

  while (true) {
    const page = await loadPage(from, from + pageSize - 1);
    if (page.error) throw new Error(page.error.message);
    if (!Array.isArray(page.data)) {
      throw new Error("Pagination query returned an invalid response");
    }

    rows.push(...page.data);
    if (page.data.length < pageSize) return rows;

    from += pageSize;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isMoneyValue(value: unknown): value is MoneyValue {
  if (typeof value === "number") return Number.isFinite(value);
  return isNonEmptyString(value) && Number.isFinite(Number(value));
}

function parseActiveServiceRow(value: unknown): ActiveServiceRow {
  if (
    !isRecord(value) ||
    !isNonEmptyString(value.id) ||
    !isNonEmptyString(value.customer_id) ||
    !isMoneyValue(value.monthly_price)
  ) {
    throw new Error("Invalid customer_services row");
  }

  return {
    customer_id: value.customer_id,
    monthly_price: value.monthly_price,
  };
}

function parseIncidentRow(value: unknown): IncidentRow {
  if (!isRecord(value) || !isNonEmptyString(value.id)) {
    throw new Error("Invalid outage_incidents row");
  }

  const affectedCount = value.affected_customer_count;
  if (
    affectedCount !== null &&
    (!Number.isSafeInteger(affectedCount) || (affectedCount as number) < 0)
  ) {
    throw new Error("Invalid outage_incidents row");
  }

  return { affected_customer_count: affectedCount as number | null };
}

function parseInvoiceRow(value: unknown): InvoiceRow {
  if (
    !isRecord(value) ||
    !isNonEmptyString(value.id) ||
    !isNonEmptyString(value.invoice_date) ||
    !isMoneyValue(value.total_amount) ||
    !isMoneyValue(value.amount_paid) ||
    !isMoneyValue(value.amount_due) ||
    !isNonEmptyString(value.status)
  ) {
    throw new Error("Invalid customer_invoices row");
  }

  return {
    invoice_date: value.invoice_date,
    total_amount: value.total_amount,
    amount_paid: value.amount_paid,
    amount_due: value.amount_due,
    status: value.status,
  };
}

async function exactCount(
  name: string,
  query: PromiseLike<{
    count: number | null;
    error: OperationsPreviewQueryError | null;
  }>,
): Promise<number> {
  const result = await query;
  if (result.error) throw new Error(result.error.message);
  if (!Number.isSafeInteger(result.count) || (result.count as number) < 0) {
    throw new Error(`Invalid ${name} count`);
  }
  return result.count as number;
}

function pageResult<T>(result: {
  data: T[] | null;
  error: OperationsPreviewQueryError | null;
}): OperationsPreviewPageResult<T> {
  return { data: result.data, error: result.error };
}

export function createOperationsPreviewRepository(
  supabase: OperationsPreviewSupabaseClient,
): OperationsPreviewRepository {
  return {
    async getActiveServices() {
      const rows = await collectPages<unknown>(async (from, to) => {
        const result = await supabase
          .from("customer_services")
          .select("id, customer_id, monthly_price")
          .eq("status", "active")
          .order("id", { ascending: true })
          .range(from, to);
        return pageResult(result);
      });
      return rows.map(parseActiveServiceRow);
    },

    async countOpenTickets() {
      return exactCount(
        "support_tickets",
        supabase
          .from("support_tickets")
          .select("id", { count: "exact", head: true })
          .in("status", OPEN_TICKET_STATUSES),
      );
    },

    async countPriorityTickets() {
      return exactCount(
        "support_tickets",
        supabase
          .from("support_tickets")
          .select("id", { count: "exact", head: true })
          .in("status", OPEN_TICKET_STATUSES)
          .in("priority", PRIORITY_TICKET_PRIORITIES),
      );
    },

    async getUnresolvedIncidents() {
      const rows = await collectPages<unknown>(async (from, to) => {
        const result = await supabase
          .from("outage_incidents")
          .select("id, affected_customer_count")
          .neq("status", "resolved")
          .is("resolved_at", null)
          .order("id", { ascending: true })
          .range(from, to);
        return pageResult(result);
      });
      return rows.map(parseIncidentRow);
    },

    async getCustomerCounts(monthEndExclusiveIso) {
      return Promise.all(
        monthEndExclusiveIso.map((boundary) =>
          exactCount(
            "customers",
            supabase
              .from("customers")
              .select("id", { count: "exact", head: true })
              .lt("created_at", boundary),
          ),
        ),
      );
    },

    async getInvoices(startDate, endDateExclusive) {
      const rows = await collectPages<unknown>(async (from, to) => {
        const result = await supabase
          .from("customer_invoices")
          .select(
            "id, invoice_date, total_amount, amount_paid, amount_due, status",
          )
          .gte("invoice_date", startDate)
          .lt("invoice_date", endDateExclusive)
          .not("status", "in", EXCLUDED_INVOICE_STATUSES)
          .order("invoice_date", { ascending: true })
          .order("id", { ascending: true })
          .range(from, to);
        return pageResult(result);
      });
      return rows.map(parseInvoiceRow);
    },

    async countScheduledInstalls(today) {
      return exactCount(
        "installation_schedules",
        supabase
          .from("installation_schedules")
          .select("id", { count: "exact", head: true })
          .in("status", SCHEDULED_INSTALL_STATUSES)
          .gte("scheduled_date", today),
      );
    },

    async countOrdersInProgress() {
      return exactCount(
        "consumer_orders",
        supabase
          .from("consumer_orders")
          .select("id", { count: "exact", head: true })
          .not("status", "in", EXCLUDED_ORDER_STATUSES),
      );
    },

    async countAvailableTechnicians() {
      return exactCount(
        "technicians",
        supabase
          .from("technicians")
          .select("id", { count: "exact", head: true })
          .eq("is_active", true)
          .eq("status", "available"),
      );
    },
  };
}

function johannesburgDate(value: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: OPERATIONS_PREVIEW_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(value);
  const part = (type: Intl.DateTimeFormatPartTypes): string => {
    const found = parts.find((candidate) => candidate.type === type)?.value;
    if (!found) throw new Error("Invalid Johannesburg date");
    return found;
  };
  return `${part("year")}-${part("month")}-${part("day")}`;
}

export async function readOperationsPreview(
  options: { repository?: OperationsPreviewRepository; now?: Date } = {},
): Promise<OperationsPreviewData> {
  const now = options.now ?? new Date();
  const windows = buildJohannesburgMonthWindows(now);
  const firstWindow = windows[0];
  const lastWindow = windows[windows.length - 1];
  const customerBoundaries = windows.map((window) =>
    window.endExclusive.toISOString(),
  );
  const invoiceStartDate = `${firstWindow.key}-01`;
  const invoiceEndDateExclusive = johannesburgDate(lastWindow.endExclusive);
  const today = johannesburgDate(now);
  const repository =
    options.repository ??
    createOperationsPreviewRepository(await createClient());

  const [
    activeServices,
    openTickets,
    needsAttention,
    unresolvedIncidents,
    customerCounts,
    invoices,
    scheduledInstalls,
    ordersInProgress,
    availableTechnicians,
  ] = await Promise.all([
    repository.getActiveServices(),
    repository.countOpenTickets(),
    repository.countPriorityTickets(),
    repository.getUnresolvedIncidents(),
    repository.getCustomerCounts(customerBoundaries),
    repository.getInvoices(invoiceStartDate, invoiceEndDateExclusive),
    repository.countScheduledInstalls(today),
    repository.countOrdersInProgress(),
    repository.countAvailableTechnicians(),
  ]);

  return aggregateOperationsPreview(
    {
      activeServices,
      unresolvedIncidents,
      invoices,
      customerCounts,
      openTickets,
      needsAttention,
      scheduledInstalls,
      ordersInProgress,
      availableTechnicians,
    },
    now,
  );
}
