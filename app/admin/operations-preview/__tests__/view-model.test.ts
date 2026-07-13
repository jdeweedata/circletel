import type { OperationsPreviewData } from "@/lib/admin/operations-preview/types";
import {
  buildFinanceRows,
  buildGrowthSeries,
  buildKpis,
  buildOperationsRows,
  formatDateOnly,
  formatGeneratedAt,
  formatGrowthTooltipItem,
  formatZar,
} from "../view-model";

const DATA: OperationsPreviewData = {
  generatedAt: "2026-07-13T10:00:00.000Z",
  source: "production",
  timeZone: "Africa/Johannesburg",
  kpis: {
    activeCustomers: 25,
    activeMrrCents: 1_244_600,
    openTickets: 11,
    needsAttention: 8,
    networkIncidents: 2,
    servicesImpacted: 7,
  },
  growth: Array.from({ length: 12 }, (_, index) => ({
    month: new Date(Date.UTC(2025, 7 + index, 1)).toISOString().slice(0, 7),
    label: `M${index + 1}`,
    totalCustomers: index + 1,
    billedCents: (index + 1) * 10_000,
  })),
  operations: {
    scheduledInstalls: 2,
    ordersInProgress: 17,
    priorityTickets: 8,
    availableTechnicians: 1,
  },
  finance: {
    periodStart: "2026-07-01",
    periodEnd: "2026-07-31",
    billedCents: 100_000,
    collectedCents: 75_000,
    outstandingCents: 25_000,
    paidInvoices: 3,
  },
};

describe("operations preview view model", () => {
  it("formats integer cents as South African rand", () => {
    expect(formatZar(1_244_600)).toBe(
      new Intl.NumberFormat("en-ZA", {
        style: "currency",
        currency: "ZAR",
      }).format(12_446),
    );
  });

  it.each([Number.NaN, Number.POSITIVE_INFINITY, 1.5, 9_007_199_254_740_992])(
    "rejects invalid integer cents: %s",
    (value) => {
      expect(() => formatZar(value)).toThrow("safe integer");
    },
  );

  it("builds only the approved production KPI claims", () => {
    const kpis = buildKpis(DATA);

    expect(kpis.map((item) => item.label)).toEqual([
      "Active customers",
      "Active MRR",
      "Open tickets",
      "Network incidents",
    ]);
    expect(kpis[1].detail).toBe("Recurring run-rate from active services");
    expect(kpis[2].status).toBe("8 high or urgent");
    expect(kpis[3].status).toBe("7 services impacted");
  });

  it("selects only supported monthly growth ranges without changing data", () => {
    expect(buildGrowthSeries(DATA, "6m")).toEqual(DATA.growth.slice(-6));
    expect(buildGrowthSeries(DATA, "12m")).toEqual(DATA.growth);
  });

  it("builds the exact operations snapshot rows", () => {
    expect(buildOperationsRows(DATA)).toEqual([
      { label: "Scheduled installs", value: "2" },
      { label: "Orders in progress", value: "17" },
      { label: "Priority tickets", value: "8" },
      { label: "Available technicians", value: "1" },
    ]);
  });

  it("builds the exact current-month finance rows", () => {
    const rows = buildFinanceRows(DATA);

    expect(rows.map((row) => row.label)).toEqual([
      "Billed",
      "Collected",
      "Outstanding",
      "Paid invoices",
    ]);
    expect(rows.map((row) => row.value)).toEqual([
      formatZar(100_000),
      formatZar(75_000),
      formatZar(25_000),
      "3",
    ]);
  });

  it("formats generated timestamps in the contract timezone and rejects invalid values", () => {
    expect(formatGeneratedAt(DATA.generatedAt)).toBe(
      new Intl.DateTimeFormat("en-ZA", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "Africa/Johannesburg",
      }).format(new Date(DATA.generatedAt)),
    );
    expect(() => formatGeneratedAt("not-a-date")).toThrow(
      "valid ISO timestamp",
    );
  });

  it("formats PostgreSQL date-only values without a timezone shift", () => {
    expect(formatDateOnly("2026-07-01")).toBe(
      new Intl.DateTimeFormat("en-ZA", {
        dateStyle: "medium",
        timeZone: "UTC",
      }).format(new Date(Date.UTC(2026, 6, 1))),
    );
    expect(() => formatDateOnly("2026-02-30")).toThrow("valid YYYY-MM-DD date");
    expect(() => formatDateOnly("2026-07-01T00:00:00Z")).toThrow(
      "valid YYYY-MM-DD date",
    );
  });

  it("formats both growth tooltip series, including zero values", () => {
    expect(formatGrowthTooltipItem("totalCustomers", 0)).toEqual({
      label: "Total customers",
      value: "0",
    });
    expect(formatGrowthTooltipItem("billedCents", 0)).toEqual({
      label: "Billed revenue",
      value: formatZar(0),
    });
  });
});
