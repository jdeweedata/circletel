import {
  collectPages,
  createOperationsPreviewRepository,
  readOperationsPreview,
  type OperationsPreviewRepository,
  type OperationsPreviewPageResult,
} from "@/lib/admin/operations-preview/read";
import type {
  ActiveServiceRow,
  IncidentRow,
  InvoiceRow,
} from "@/lib/admin/operations-preview/types";

const NOW = new Date("2026-07-13T10:00:00.000Z");

interface FakeQueryResult {
  data: unknown[] | null;
  error: { message: string } | null;
  count?: number | null;
}

interface RecordedQuery {
  table: string;
  steps: Array<{ method: string; args: unknown[] }>;
}

function fakeSupabase(
  resultQueues: Record<string, Array<FakeQueryResult | Error>>,
): { client: unknown; queries: RecordedQuery[] } {
  const queries: RecordedQuery[] = [];

  const client = {
    from(table: string) {
      const result = resultQueues[table]?.shift();
      if (!result) throw new Error(`Missing fake result for ${table}`);

      const query: RecordedQuery = { table, steps: [] };
      queries.push(query);
      const builder: Record<string, unknown> = {};
      for (const method of [
        "select",
        "eq",
        "neq",
        "is",
        "order",
        "range",
        "in",
        "gte",
        "lt",
        "not",
      ]) {
        builder[method] = (...args: unknown[]) => {
          query.steps.push({ method, args });
          return builder;
        };
      }
      builder.then = (
        resolve: (value: FakeQueryResult) => unknown,
        reject: (reason: Error) => unknown,
      ) =>
        (result instanceof Error
          ? Promise.reject(result)
          : Promise.resolve(result)
        ).then(resolve, reject);

      return builder;
    },
  };

  return { client, queries };
}

function repositoryFixture(
  overrides: Partial<{
    activeServices: ActiveServiceRow[];
    openTickets: number;
    priorityTickets: number;
    unresolvedIncidents: IncidentRow[];
    customerCounts: number[];
    invoices: InvoiceRow[];
    scheduledInstalls: number;
    ordersInProgress: number;
    availableTechnicians: number;
  }> = {},
): jest.Mocked<OperationsPreviewRepository> {
  const values = {
    activeServices: [
      { customer_id: "customer-1", monthly_price: "100.00" },
      { customer_id: "customer-1", monthly_price: 50 },
      { customer_id: "customer-2", monthly_price: "25" },
    ],
    openTickets: 8,
    priorityTickets: 3,
    unresolvedIncidents: [
      { affected_customer_count: 2 },
      { affected_customer_count: null },
    ],
    customerCounts: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    invoices: [
      {
        invoice_date: "2025-08-01",
        total_amount: "10.00",
        amount_paid: "10.00",
        amount_due: "0.00",
        status: "paid",
      },
      {
        invoice_date: "2026-07-05",
        total_amount: "100.00",
        amount_paid: "60.00",
        amount_due: "40.00",
        status: "partial",
      },
      {
        invoice_date: "2026-07-06",
        total_amount: 50,
        amount_paid: 50,
        amount_due: 0,
        status: "paid",
      },
    ],
    scheduledInstalls: 4,
    ordersInProgress: 5,
    availableTechnicians: 6,
    ...overrides,
  };

  return {
    getActiveServices: jest.fn().mockResolvedValue(values.activeServices),
    countOpenTickets: jest.fn().mockResolvedValue(values.openTickets),
    countPriorityTickets: jest.fn().mockResolvedValue(values.priorityTickets),
    getUnresolvedIncidents: jest
      .fn()
      .mockResolvedValue(values.unresolvedIncidents),
    getCustomerCounts: jest.fn().mockResolvedValue(values.customerCounts),
    getInvoices: jest.fn().mockResolvedValue(values.invoices),
    countScheduledInstalls: jest
      .fn()
      .mockResolvedValue(values.scheduledInstalls),
    countOrdersInProgress: jest.fn().mockResolvedValue(values.ordersInProgress),
    countAvailableTechnicians: jest
      .fn()
      .mockResolvedValue(values.availableTechnicians),
  };
}

describe("collectPages", () => {
  it("reads 1,005 rows in two inclusive 1,000-row ranges", async () => {
    const rows = Array.from({ length: 1_005 }, (_, id) => ({ id }));
    const loadPage = jest.fn(
      async (
        from: number,
        to: number,
      ): Promise<OperationsPreviewPageResult<{ id: number }>> => ({
        data: rows.slice(from, to + 1),
        error: null,
      }),
    );

    await expect(collectPages(loadPage)).resolves.toEqual(rows);
    expect(loadPage).toHaveBeenCalledTimes(2);
    expect(loadPage).toHaveBeenNthCalledWith(1, 0, 999);
    expect(loadPage).toHaveBeenNthCalledWith(2, 1_000, 1_999);
  });

  it("rejects when a later page fails instead of returning partial data", async () => {
    const loadPage = jest
      .fn<Promise<OperationsPreviewPageResult<number>>, [number, number]>()
      .mockResolvedValueOnce({ data: Array(2).fill(1), error: null })
      .mockResolvedValueOnce({
        data: null,
        error: { message: "page two failed" },
      });

    await expect(collectPages(loadPage, 2)).rejects.toThrow("page two failed");
    expect(loadPage).toHaveBeenCalledTimes(2);
  });

  it("rejects null data without an explicit query error", async () => {
    const loadPage = jest.fn(async () => ({ data: null, error: null }));

    await expect(collectPages(loadPage)).rejects.toThrow("invalid response");
  });

  it.each([0, -1, 1.5, Number.MAX_SAFE_INTEGER + 1])(
    "rejects invalid page size %s before loading",
    async (pageSize) => {
      const loadPage = jest.fn();

      await expect(collectPages(loadPage, pageSize)).rejects.toThrow(
        "pageSize",
      );
      expect(loadPage).not.toHaveBeenCalled();
    },
  );
});

describe("readOperationsPreview", () => {
  it("reads each repository aggregate once and returns the approved typed metrics", async () => {
    const repository = repositoryFixture();

    const result = await readOperationsPreview({ repository, now: NOW });

    expect(result).toEqual({
      generatedAt: "2026-07-13T10:00:00.000Z",
      source: "production",
      timeZone: "Africa/Johannesburg",
      kpis: {
        activeCustomers: 2,
        activeMrrCents: 17_500,
        openTickets: 8,
        needsAttention: 3,
        networkIncidents: 2,
        servicesImpacted: 2,
      },
      growth: [
        {
          month: "2025-08",
          label: "Aug",
          totalCustomers: 1,
          billedCents: 1_000,
        },
        { month: "2025-09", label: "Sept", totalCustomers: 2, billedCents: 0 },
        { month: "2025-10", label: "Oct", totalCustomers: 3, billedCents: 0 },
        { month: "2025-11", label: "Nov", totalCustomers: 4, billedCents: 0 },
        { month: "2025-12", label: "Dec", totalCustomers: 5, billedCents: 0 },
        { month: "2026-01", label: "Jan", totalCustomers: 6, billedCents: 0 },
        { month: "2026-02", label: "Feb", totalCustomers: 7, billedCents: 0 },
        { month: "2026-03", label: "Mar", totalCustomers: 8, billedCents: 0 },
        { month: "2026-04", label: "Apr", totalCustomers: 9, billedCents: 0 },
        { month: "2026-05", label: "May", totalCustomers: 10, billedCents: 0 },
        { month: "2026-06", label: "Jun", totalCustomers: 11, billedCents: 0 },
        {
          month: "2026-07",
          label: "Jul",
          totalCustomers: 12,
          billedCents: 15_000,
        },
      ],
      operations: {
        scheduledInstalls: 4,
        ordersInProgress: 5,
        priorityTickets: 3,
        availableTechnicians: 6,
      },
      finance: {
        periodStart: "2026-07-01",
        periodEnd: "2026-07-31",
        billedCents: 15_000,
        collectedCents: 11_000,
        outstandingCents: 4_000,
        paidInvoices: 1,
      },
    });

    Object.values(repository).forEach((method) => {
      expect(method).toHaveBeenCalledTimes(1);
    });
  });

  it("derives exact Johannesburg customer, invoice, and install boundaries", async () => {
    const repository = repositoryFixture();

    await readOperationsPreview({ repository, now: NOW });

    expect(repository.getCustomerCounts).toHaveBeenCalledWith([
      "2025-08-31T22:00:00.000Z",
      "2025-09-30T22:00:00.000Z",
      "2025-10-31T22:00:00.000Z",
      "2025-11-30T22:00:00.000Z",
      "2025-12-31T22:00:00.000Z",
      "2026-01-31T22:00:00.000Z",
      "2026-02-28T22:00:00.000Z",
      "2026-03-31T22:00:00.000Z",
      "2026-04-30T22:00:00.000Z",
      "2026-05-31T22:00:00.000Z",
      "2026-06-30T22:00:00.000Z",
      "2026-07-31T22:00:00.000Z",
    ]);
    expect(repository.getInvoices).toHaveBeenCalledWith(
      "2025-08-01",
      "2026-08-01",
    );
    expect(repository.countScheduledInstalls).toHaveBeenCalledWith(
      "2026-07-13",
    );
  });

  it.each([
    ["row query", "getActiveServices"],
    ["count query", "countOpenTickets"],
  ] as const)(
    "rejects a %s failure without returning fallback zeros",
    async (_, method) => {
      const repository = repositoryFixture();
      repository[method].mockRejectedValueOnce(
        new Error(`${method} unavailable`),
      );

      await expect(
        readOperationsPreview({ repository, now: NOW }),
      ).rejects.toThrow(`${method} unavailable`);
    },
  );
});

describe("createOperationsPreviewRepository", () => {
  it("uses minimal columns, exact filters, deterministic ordering, and exact counts", async () => {
    const { client, queries } = fakeSupabase({
      customer_services: [
        {
          data: [
            {
              id: "service-1",
              customer_id: "customer-1",
              monthly_price: "99.50",
            },
          ],
          error: null,
        },
      ],
      support_tickets: [
        { data: null, error: null, count: 8 },
        { data: null, error: null, count: 3 },
      ],
      outage_incidents: [
        {
          data: [
            { id: "incident-1", affected_customer_count: 4 },
            { id: "incident-2", affected_customer_count: null },
          ],
          error: null,
        },
      ],
      customers: [
        { data: null, error: null, count: 10 },
        { data: null, error: null, count: 12 },
      ],
      customer_invoices: [
        {
          data: [
            {
              id: "invoice-1",
              invoice_date: "2026-07-01",
              total_amount: "100.00",
              amount_paid: "25.00",
              amount_due: "75.00",
              status: "partial",
            },
          ],
          error: null,
        },
      ],
      installation_schedules: [{ data: null, error: null, count: 4 }],
      consumer_orders: [{ data: null, error: null, count: 5 }],
      technicians: [{ data: null, error: null, count: 6 }],
    });
    const repository = createOperationsPreviewRepository(client as never);

    await expect(repository.getActiveServices()).resolves.toEqual([
      { customer_id: "customer-1", monthly_price: "99.50" },
    ]);
    await expect(repository.countOpenTickets()).resolves.toBe(8);
    await expect(repository.countPriorityTickets()).resolves.toBe(3);
    await expect(repository.getUnresolvedIncidents()).resolves.toEqual([
      { affected_customer_count: 4 },
      { affected_customer_count: null },
    ]);
    await expect(
      repository.getCustomerCounts(["boundary-1", "boundary-2"]),
    ).resolves.toEqual([10, 12]);
    await expect(
      repository.getInvoices("2025-08-01", "2026-08-01"),
    ).resolves.toEqual([
      {
        invoice_date: "2026-07-01",
        total_amount: "100.00",
        amount_paid: "25.00",
        amount_due: "75.00",
        status: "partial",
      },
    ]);
    await expect(repository.countScheduledInstalls("2026-07-13")).resolves.toBe(
      4,
    );
    await expect(repository.countOrdersInProgress()).resolves.toBe(5);
    await expect(repository.countAvailableTechnicians()).resolves.toBe(6);

    expect(queries).toEqual([
      {
        table: "customer_services",
        steps: [
          { method: "select", args: ["id, customer_id, monthly_price"] },
          { method: "eq", args: ["status", "active"] },
          { method: "order", args: ["id", { ascending: true }] },
          { method: "range", args: [0, 999] },
        ],
      },
      {
        table: "support_tickets",
        steps: [
          { method: "select", args: ["id", { count: "exact", head: true }] },
          {
            method: "in",
            args: ["status", ["open", "pending", "in_progress"]],
          },
        ],
      },
      {
        table: "support_tickets",
        steps: [
          { method: "select", args: ["id", { count: "exact", head: true }] },
          {
            method: "in",
            args: ["status", ["open", "pending", "in_progress"]],
          },
          { method: "in", args: ["priority", ["high", "urgent"]] },
        ],
      },
      {
        table: "outage_incidents",
        steps: [
          { method: "select", args: ["id, affected_customer_count"] },
          { method: "neq", args: ["status", "resolved"] },
          { method: "is", args: ["resolved_at", null] },
          { method: "order", args: ["id", { ascending: true }] },
          { method: "range", args: [0, 999] },
        ],
      },
      {
        table: "customers",
        steps: [
          { method: "select", args: ["id", { count: "exact", head: true }] },
          { method: "lt", args: ["created_at", "boundary-1"] },
        ],
      },
      {
        table: "customers",
        steps: [
          { method: "select", args: ["id", { count: "exact", head: true }] },
          { method: "lt", args: ["created_at", "boundary-2"] },
        ],
      },
      {
        table: "customer_invoices",
        steps: [
          {
            method: "select",
            args: [
              "id, invoice_date, total_amount, amount_paid, amount_due, status",
            ],
          },
          { method: "gte", args: ["invoice_date", "2025-08-01"] },
          { method: "lt", args: ["invoice_date", "2026-08-01"] },
          { method: "not", args: ["status", "in", "(voided,cancelled)"] },
          { method: "order", args: ["invoice_date", { ascending: true }] },
          { method: "order", args: ["id", { ascending: true }] },
          { method: "range", args: [0, 999] },
        ],
      },
      {
        table: "installation_schedules",
        steps: [
          { method: "select", args: ["id", { count: "exact", head: true }] },
          { method: "in", args: ["status", ["scheduled", "rescheduled"]] },
          { method: "gte", args: ["scheduled_date", "2026-07-13"] },
        ],
      },
      {
        table: "consumer_orders",
        steps: [
          { method: "select", args: ["id", { count: "exact", head: true }] },
          {
            method: "not",
            args: ["status", "in", "(active,suspended,cancelled,failed)"],
          },
        ],
      },
      {
        table: "technicians",
        steps: [
          { method: "select", args: ["id", { count: "exact", head: true }] },
          { method: "eq", args: ["is_active", true] },
          { method: "eq", args: ["status", "available"] },
        ],
      },
    ]);
  });

  it("rejects query errors, null counts, query exceptions, and malformed rows", async () => {
    const queryError = fakeSupabase({
      customer_services: [
        { data: null, error: { message: "services unavailable" } },
      ],
    });
    await expect(
      createOperationsPreviewRepository(
        queryError.client as never,
      ).getActiveServices(),
    ).rejects.toThrow("services unavailable");

    const nullCount = fakeSupabase({
      support_tickets: [{ data: null, error: null, count: null }],
    });
    await expect(
      createOperationsPreviewRepository(
        nullCount.client as never,
      ).countOpenTickets(),
    ).rejects.toThrow("Invalid support_tickets count");

    const exception = fakeSupabase({
      technicians: [new Error("connection failed")],
    });
    await expect(
      createOperationsPreviewRepository(
        exception.client as never,
      ).countAvailableTechnicians(),
    ).rejects.toThrow("connection failed");

    const synchronousExceptionClient = {
      from() {
        throw new Error("query builder failed");
      },
    };
    await expect(
      createOperationsPreviewRepository(
        synchronousExceptionClient as never,
      ).countOrdersInProgress(),
    ).rejects.toThrow("query builder failed");

    const malformed = fakeSupabase({
      customer_services: [
        {
          data: [{ id: "service-1", customer_id: "private-customer-id" }],
          error: null,
        },
      ],
    });
    const malformedResult = createOperationsPreviewRepository(
      malformed.client as never,
    ).getActiveServices();
    await expect(malformedResult).rejects.toThrow(
      "Invalid customer_services row",
    );
    await expect(malformedResult).rejects.not.toThrow("private-customer-id");
  });
});
